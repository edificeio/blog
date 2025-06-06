/*
 * Copyright © "Open Digital Education" (SAS “WebServices pour l’Education”), 2014
 *
 * This program is published by "Open Digital Education" (SAS “WebServices pour l’Education”).
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https: //opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package org.entcore.blog.services.impl;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoDbAPI;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.transformer.IContentTransformerClient;
import fr.wseduc.transformer.to.ContentTransformerFormat;
import fr.wseduc.transformer.to.ContentTransformerRequest;
import fr.wseduc.transformer.to.ContentTransformerResponse;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.Utils;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.Message;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.bson.conversions.Bson;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.security.BlogResourcesProvider;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.to.PostFilter;
import org.entcore.blog.to.PostProjection;
import org.entcore.common.audience.AudienceHelper;
import org.entcore.common.audience.to.AudienceCheckRightRequestMessage;
import org.entcore.common.editor.IContentTransformerEventRecorder;
import org.entcore.common.explorer.IngestJobState;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbSearchService;
import org.entcore.common.user.UserInfos;
import org.entcore.common.utils.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

import static com.mongodb.client.model.Filters.*;


public class DefaultPostService implements PostService {
	protected static final Logger log = LoggerFactory.getLogger(DefaultBlogService.class);
	private final String listPostAction;
	private static final String MANAGER_ACTION = "org-entcore-blog-controllers-BlogController|shareResource";

	private final MongoDb mongo;
	protected static final String POST_COLLECTION = "posts";
	public static final String TRANSFORMED_CONTENT_DB_FIELD_NAME = "transformed_content";
	private static final JsonObject defaultKeys = new JsonObject()
			.put("author", 1)
			.put("title", 1)
			.put("content", 1)
			.put("jsonContent", 1)
			.put("state", 1)
			.put("created", 1)
			.put("modified", 1)
			.put("views", 1)
			.put("firstPublishDate", 1)
			.put("contentVersion", 1);
	private static final JsonObject keysWithTransformedContent = defaultKeys.copy().put(TRANSFORMED_CONTENT_DB_FIELD_NAME, 1);


	private final int searchWordMinSize;
	private final PostExplorerPlugin plugin;
	private final IContentTransformerClient contentTransformerClient;
	private final AudienceHelper audienceHelper;
	private final IContentTransformerEventRecorder contentTransformerEventRecorder;

	public DefaultPostService(MongoDb mongo, int searchWordMinSize, String listPostAction, final PostExplorerPlugin plugin,
														final IContentTransformerClient contentTransformerClient,
														final IContentTransformerEventRecorder contentTransformerEventRecorder,
														final AudienceHelper audienceHelper) {
		this.mongo = mongo;
		this.plugin = plugin;
		this.listPostAction = listPostAction;
		this.searchWordMinSize = searchWordMinSize;
		this.contentTransformerClient = contentTransformerClient;
		this.contentTransformerEventRecorder = contentTransformerEventRecorder;
		this.audienceHelper = audienceHelper;
	}

	@Override
	public void create(String blogId, JsonObject post, UserInfos author,
										 final Handler<Either<String, JsonObject>> result,
										 final HttpServerRequest request) {
		final long version = System.currentTimeMillis();
		JsonObject now = MongoDb.nowISO();
		JsonObject blogRef = new JsonObject()
				.put("$ref", "blogs")
				.put("$id", blogId);
		JsonObject owner = new JsonObject()
				.put("userId", author.getUserId())
				.put("username", author.getUsername())
				.put("login", author.getLogin());
		post.put("created", now)
				.put("modified", now)
				.put("author", owner)
				.put("state", StateType.DRAFT.name())
				.put("comments", new JsonArray())
				.put("views", 0)
				.put("blog", blogRef);
		JsonObject b = Utils.validAndGet(post, FIELDS, FIELDS);
		if (validationError(result, b)) return;
		b.put("sorted", now);

		Future<ContentTransformerResponse> contentTransformerResponseFuture;
		if (b.containsKey("content")) {
			contentTransformerResponseFuture = contentTransformerClient
					.transform(new ContentTransformerRequest(
							new HashSet<>(Arrays.asList(ContentTransformerFormat.HTML, ContentTransformerFormat.JSON, ContentTransformerFormat.PLAINTEXT)),
							b.getInteger("contentVersion", 0),
							b.getString("content", ""),
							null));
		} else {
			contentTransformerResponseFuture = Future.succeededFuture();
		}
		contentTransformerResponseFuture.onComplete(transformerResponse -> {
			if (transformerResponse.failed()) {
				log.error("Error while transforming the content", transformerResponse.cause());
			} else {
				if (transformerResponse.result() == null) {
					log.debug("No content transformed.");
				} else {
					b.put("contentVersion", transformerResponse.result().getContentVersion());
					b.put("content", transformerResponse.result().getCleanHtml());
					b.put("jsonContent", transformerResponse.result().getJsonContent());
					b.put("contentPlain", transformerResponse.result().getPlainTextContent());
				}
			}
			plugin.setIngestJobStateAndVersion(b, IngestJobState.TO_BE_SENT, version);
			mongo.save(POST_COLLECTION, b, MongoDbAPI.WriteConcern.MAJORITY, MongoDbResult.validActionResultHandler(event -> {
				if(event.isLeft()){
					log.error("Failed to create post: ", event.left().getValue());
					result.handle(event);
					return;
				}
				//#29106 avoid fetch after save
				final String id = event.right().getValue().getString("_id");
				if(transformerResponse.succeeded()) {
					contentTransformerEventRecorder.recordTransformation(id, "post", transformerResponse.result(), request);
				}
				b.put("_id", id);
				//must set id before notify
				plugin.notifyUpsert(blogId, author, b).onComplete(e->{
					if(e.failed()){
						plugin.setIngestJobState(b, IngestJobState.SEND_KO);
						log.error("Failed to notify upsert post: ", e.cause());
					} else {
						plugin.setIngestJobState(b, IngestJobState.SENT);
					}
					// TODO JBER update here the state in mongo
					result.handle(new Either.Right<>(b));
				});
			}));
		});
	}

	@Override
	public void update(String postId, final JsonObject post, final UserInfos user,
										 final Handler<Either<String, JsonObject>> result, final HttpServerRequest request) {
		final long version = System.currentTimeMillis();
		final JsonObject jQuery = MongoQueryBuilder.build(eq("_id", postId));
		mongo.findOne(POST_COLLECTION, jQuery,  MongoDbResult.validActionResultHandler(event -> {
			if(event.isLeft()){
				result.handle(event);
				return;
			} else {
				final JsonObject postFromDb = event.right().getValue().getJsonObject("result", new JsonObject());
				final JsonObject now = MongoDb.now();
				post.put("modified", now);
				final JsonObject validatedPost = Utils.validAndGet(post, UPDATABLE_FIELDS, Collections.<String>emptyList());

				if (validationError(result, validatedPost)) return;

				Future<ContentTransformerResponse> contentTransformerResponseFuture;
				if (validatedPost.containsKey("content")) {
					// transformation of html content into jsonContent
					contentTransformerResponseFuture = contentTransformerClient.transform(
							new ContentTransformerRequest(
									new HashSet<>(Arrays.asList(ContentTransformerFormat.JSON, ContentTransformerFormat.PLAINTEXT, ContentTransformerFormat.HTML)),
									validatedPost.getInteger("contentVersion", 0),
									validatedPost.getString("content"),
									null));
				} else {
					// No content to transform
					contentTransformerResponseFuture = Future.succeededFuture();
				}

				if (postFromDb.getJsonObject("firstPublishDate") != null) {
					validatedPost.put("sorted", postFromDb.getJsonObject("firstPublishDate"));
				} else {
					validatedPost.put("sorted", now);
				}

				//republish post to make it go up
				final boolean sorting = post.containsKey("sorted") && post.getBoolean("sorted", false);
				if (sorting) {
					validatedPost.put("sorted", now);
				}

				//if user is author and is not sorting the post, draft state
				if (!sorting && user.getUserId().equals(postFromDb.getJsonObject("author", new JsonObject()).getString("userId"))) {
					validatedPost.put("state", StateType.DRAFT.name());
				}

				contentTransformerResponseFuture.onComplete(response -> {
					if (response.failed()) {
						log.error("Content transformation failed");
					} else {
						final ContentTransformerResponse transformationResult = response.result();
						if (transformationResult == null) {
							log.info("No content transformed");
						} else {
							validatedPost.put("contentVersion", transformationResult.getContentVersion());
							validatedPost.put("jsonContent", transformationResult.getJsonContent());
							validatedPost.put("content", transformationResult.getCleanHtml());
							validatedPost.put("contentPlain", transformationResult.getPlainTextContent());
							contentTransformerEventRecorder.recordTransformation(postId, "post", transformationResult, request);
						}
					}
					MongoUpdateBuilder modifier = new MongoUpdateBuilder();
					for (String attr: validatedPost.fieldNames()) {
						modifier.set(attr, validatedPost.getValue(attr));
					}
					if(postFromDb.containsKey(TRANSFORMED_CONTENT_DB_FIELD_NAME)) {
						modifier.unset(TRANSFORMED_CONTENT_DB_FIELD_NAME);
					}
					plugin.setIngestJobStateAndVersion(validatedPost, IngestJobState.TO_BE_SENT, version);
					mongo.update(POST_COLLECTION, jQuery, modifier.build(), false, false, MongoDbAPI.WriteConcern.MAJORITY, updateResponse -> {
						if ("ok".equals(updateResponse.body().getString("status"))) {
							final JsonObject blogRef = postFromDb.getJsonObject("blog");
							final String blogId = blogRef.getString("$id");
							plugin.setIngestJobStateAndVersion(validatedPost, IngestJobState.TO_BE_SENT, version);
							plugin.notifyUpsert(blogId, user, validatedPost.put("_id", postId)).onComplete(e->{
								if(e.failed()){
									log.error("Failed to notify upsert post: ", e.cause());
								}
								// TODO JBER update here status in mongo
								final JsonObject r = new JsonObject().put("state", validatedPost.getString("state", postFromDb.getString("state")));
								result.handle(new Either.Right<>(r));
							});
						} else {
							result.handle(new Either.Left<>(updateResponse.body().getString("message", "")));
						}
					});
				});
			}
		})
		);

	}

	@Override
	public void delete(UserInfos user, String blogId, String postId, final Handler<Either<String, JsonObject>> result) {
		final Bson query = eq("_id", postId);
		// TODO JBER not handled
		mongo.delete(POST_COLLECTION, MongoQueryBuilder.build(query), event -> {
			//must set id before notify
			plugin.notifyUpsert(blogId, user, new JsonObject().put("_id", postId).put("version", new Date().getTime())).onComplete(e -> {
				if (e.failed()) {
					log.error("Failed to notify upsert post: ", e.cause());
				}
				result.handle(Utils.validResult(event));
			});
			audienceHelper.notifyResourcesDeletion("blog", "post", Collections.singleton(postId))
					.onFailure(th -> log.error("Failed to notify audience of post deletion", th));
		});
	}

	@Override
	public Future<JsonObject> get(final PostFilter filter, final HttpServerRequest request) {
		final Promise<JsonObject> promise = Promise.promise();
		final Bson query = and(
			eq("_id", filter.getPostId()),
			eq("blog.$id", filter.getBlogId()),
			eq("state", filter.getState().name())
		);
		mongo.findOne(POST_COLLECTION, MongoQueryBuilder.build(query), keysWithTransformedContent, event -> {
				Either<String, JsonObject> res = Utils.validResult(event);
				if (res.isRight() && !res.right().getValue().isEmpty()) {
					final Bson query2 = and(
						eq("_id", filter.getPostId()),
						eq("state", StateType.PUBLISHED.name())
					);
						MongoUpdateBuilder incView = new MongoUpdateBuilder();
						incView.inc("views", 1);
						mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query2), incView.build());
						handleOldContent(res.right().getValue(), filter.isOriginalFormat(), request)
								.onComplete(promise);
				} else if(res.isLeft()){
					promise.fail(res.left().getValue());
				} else {
					promise.fail("post.does.not.exist");
				}
		});
		return promise.future();
	}

	@Override
	public void list(String blogId, UserInfos user, Integer page, int limit, String search, Set<String> states,
									 Handler<Either<String, JsonArray>> result, final HttpServerRequest httpCallerRequest) {
		PostService.super.list(blogId, user, page, limit, search, states, result, httpCallerRequest);
	}

	/**
	 * If {@code post} does not have contentVersion or if version is 0 then old content is transformed to new content.<br />
	 * Otherwise, nothing is done
	 * @param post Post whose content could be transformed
	 * @return The modified post (actually the same as {@code post})
	 */
	private Future<JsonObject> handleOldContent(final JsonObject post, final boolean originalFormatRequested,
																							final HttpServerRequest request) {
		final Promise<JsonObject> promise = Promise.promise();
		if (post.containsKey("jsonContent")) {
			log.debug("Post has already been transformed, nothing to do.");
			promise.complete(post);
		} else {
			Set<ContentTransformerFormat> desiredFormats = new HashSet<>();
			desiredFormats.add(ContentTransformerFormat.HTML);
			desiredFormats.add(ContentTransformerFormat.JSON);
			final ContentTransformerRequest transformerRequest = new ContentTransformerRequest(desiredFormats, 0, post.getString("content"), null);
			contentTransformerClient.transform(transformerRequest)
			.onComplete(response -> {
				if (response.failed()) {
					log.error("Content transformation failed", response.cause());
					promise.fail("content.transformation.failed");
				} else if (response.result() == null) {
					log.info("No content transformed");
					promise.complete(post);
				} else {
					// contentVersion set to 0 to indicate that content has been transformed for the first time.
					final ContentTransformerResponse transformedContent = response.result();
					final String postId = post.getString("_id");
					contentTransformerEventRecorder.recordTransformation(
						postId, "post",
						transformedContent, request);
					post.put("contentVersion", 0)
						.put("jsonContent", transformedContent.getJsonContent())
						.put(TRANSFORMED_CONTENT_DB_FIELD_NAME, transformedContent.getCleanHtml());
					final Bson findPost = eq("_id", postId);
					// Cache the products of the transformation so they can be reused until the manager updates the post
					final MongoUpdateBuilder updateFields = new MongoUpdateBuilder()
							.set("jsonContent", transformedContent.getJsonContent())
							.set("contentVersion", 0)
							.set(TRANSFORMED_CONTENT_DB_FIELD_NAME, transformedContent.getCleanHtml());
					mongo.update(POST_COLLECTION, MongoQueryBuilder.build(findPost), updateFields.build(),e -> {
						promise.complete(post);
					});
				}
			});
		}
		return promise.future().map(fetchedPost -> {
			// If the user did not request the original format we populate the field content with the value of transformed_content
			// Which was cached after the first transformation.
			// This only applies for post whose content version is 0 (i.e. for posts whose content has never been updated since
			// the new editor)
			if(!originalFormatRequested && fetchedPost.getInteger("contentVersion", -1) == 0 && fetchedPost.containsKey(TRANSFORMED_CONTENT_DB_FIELD_NAME)) {
				fetchedPost.put("content", fetchedPost.getString(TRANSFORMED_CONTENT_DB_FIELD_NAME));
			}
			fetchedPost.remove(TRANSFORMED_CONTENT_DB_FIELD_NAME); // Remove this so it doesn't appear in the response to the client
			return fetchedPost;
		});
	}

	@Override
	public void counter(final String blogId, final UserInfos user,
	                    final Handler<Either<String, JsonArray>> result) {
		final Bson query = eq("blog.$id", blogId);
		final Bson isManagerQuery = getDefautQueryBuilderForList(blogId, user,true);
		final JsonObject projection = new JsonObject();
		projection.put("state", 1);
		projection.put("_id", -1);

		final Handler<Message<JsonObject>> finalHandler = new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				result.handle(Utils.validResults(event));
			}
		};

		mongo.count("blogs", MongoQueryBuilder.build(isManagerQuery), new Handler<Message<JsonObject>>() {
			public void handle(Message<JsonObject> event) {
				JsonObject res = event.body();
				if (res == null || !"ok".equals(res.getString("status"))) {
					result.handle(new Either.Left<String, JsonArray>(event.body().encodePrettily()));
					return;
				}
				boolean isManager = 1 == res.getInteger("count", 0);

				final Bson findQuery = and(
					query,
					or(
						eq("state", StateType.PUBLISHED.name()),
						and(
								eq("author.userId", user.getUserId()),
								eq("state", StateType.DRAFT.name())
						),
						isManager ?
								eq("state", StateType.SUBMITTED.name()) :
								and(
										eq("author.userId", user.getUserId()),
										eq("state", StateType.SUBMITTED.name())
								)
					)
				);
				mongo.find(POST_COLLECTION, MongoQueryBuilder.build(findQuery), null, projection, finalHandler);
			}
		});
	}

	@Override
	public void count(final String blogId, final StateType state, final Handler<Either<String, Integer>> result){
		final Bson query = and(eq("blog.$id", blogId), eq("state", state.name()));
		mongo.count(POST_COLLECTION, MongoQueryBuilder.build(query), event -> {
			JsonObject res = event.body();
			if (res != null && "ok".equals(res.getString("status"))) {
				result.handle(new Either.Right<>(res.getInteger("count")));
			}else{
				result.handle(new Either.Left<>(res.getString("message", "")));
			}
		});

	}

	@Override
	public void listPublic(String blogId, Integer page, int limit, String search,
												 final HttpServerRequest request,
												 final Handler<Either<String, JsonArray>> result) {
		final Bson accessQuery = and(eq("blog.$id", blogId), eq("state", StateType.PUBLISHED.name()));
		final Bson query = getQueryListBuilder(search, result, accessQuery);
		final JsonObject sort = new JsonObject().put("sorted", -1);
		final JsonObject projection = defaultKeys.copy();
		//projection.remove("content");
		final Handler<Message<JsonObject>> finalHandler = event -> {
			final Either<String, JsonArray> results = Utils.validResults(event);
			if(results.isRight()) {
				final List<Future> transformedContents = results.right().getValue().stream()
					.map(post -> handleOldContent((JsonObject) post, false, request))
					.collect(Collectors.toList());
				CompositeFuture.join(transformedContents).onComplete(e -> result.handle(results));
			} else {
				result.handle(results);
			}
		};
		if (limit > 0 && page == null) {
			mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, 0, limit, limit, finalHandler);
		} else if (page == null) {
			mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, finalHandler);
		} else {
			final int skip = (0 == page) ? -1 : page * limit;
			mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, skip, limit, limit, finalHandler);
		}
	}

	@Override
	public void listOnePublic(String blogId, String postId,
														final HttpServerRequest request,
														final Handler<Either<String, JsonArray>> result) {
		final Bson query = and(eq("blog.$id", blogId), eq("state", StateType.PUBLISHED.name()), eq("_id", postId));
		final JsonObject projection = defaultKeys.copy();
		//projection.remove("content");
		final Handler<Message<JsonObject>> finalHandler =event -> {
			final Either<String, JsonArray> results = Utils.validResults(event);
			if(results.isRight()) {
				final List<Future> transformedContents = results.right().getValue().stream()
					.map(post -> handleOldContent((JsonObject) post, false, request))
					.collect(Collectors.toList());
				CompositeFuture.join(transformedContents).onComplete(e -> result.handle(results));
			} else {
				result.handle(results);
			}
		};
		mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), null, projection, finalHandler);
	}

	@Override
	public void list(String blogId, final StateType state, final UserInfos user, final Integer page, final int limit, final String search,
				final Handler<Either<String, JsonArray>> result) {
		Bson accessQuery = and(eq("blog.$id", blogId), eq("state", state.name()));
		final JsonObject sort = new JsonObject().put("sorted", -1);
		final JsonObject projection = defaultKeys.copy();
		projection.remove("content");

		final Handler<Message<JsonObject>> finalHandler = new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				result.handle(Utils.validResults(event));
			}
		};

		final Bson query = getQueryListBuilder(search, result, accessQuery);

		if (query != null) {

			if (StateType.PUBLISHED.equals(state)) {
				if (limit > 0 && page == null) {
					mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, 0, limit, limit, finalHandler);
				} else if (page == null) {
					mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, finalHandler);
				} else {
					final int skip = (0 == page) ? -1 : page * limit;
					mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, skip, limit, limit, finalHandler);
				}
			} else {
				final Bson query2 = getDefautQueryBuilderForList(blogId, user,true);
				mongo.count("blogs", MongoQueryBuilder.build(query2), new Handler<Message<JsonObject>>() {
					@Override
					public void handle(Message<JsonObject> event) {
						JsonObject res = event.body();

						final Bson finalAccessQuery;
						if ((res != null && "ok".equals(res.getString("status")) &&
								1 != res.getInteger("count")) || StateType.DRAFT.equals(state)) {
							finalAccessQuery = and(accessQuery, eq("author.userId", user.getUserId()));
						} else {
							finalAccessQuery = accessQuery;
						}

						final Bson listQuery = getQueryListBuilder(search, result, finalAccessQuery);
						if (limit > 0 && page == null) {
							mongo.find(POST_COLLECTION, MongoQueryBuilder.build(listQuery), sort, projection, 0, limit, limit, finalHandler);
						} else if (page == null) {
							mongo.find(POST_COLLECTION, MongoQueryBuilder.build(listQuery), sort, projection, finalHandler);
						} else {
							final int skip = (0 == page) ? -1 : page * limit;
							mongo.find(POST_COLLECTION, MongoQueryBuilder.build(listQuery), sort, projection, skip, limit, limit, finalHandler);
						}
					}
				});
			}
		}
	}

	@Override
	public void list(String blogId, final UserInfos user, final Integer page, final int limit,
															 final String search, final Set<String> states,
															 final PostProjection postProjection,
															 final Handler<Either<String, JsonArray>> result,
									 final HttpServerRequest request) {
		final Bson accessQuery;
		if (states == null || states.isEmpty()) {
			accessQuery = eq("blog.$id", blogId);
		} else {
			accessQuery = and(eq("blog.$id", blogId), in("state", states));
		}

		final Bson isManagerQuery = getDefautQueryBuilderForList(blogId, user,true);
		final JsonObject sort = new JsonObject().put("sorted", -1);
		final JsonObject projection = defaultKeys.copy();
		// If the user doesn't want the content we do not fetch it from the database
		if(!postProjection.isWithContent()) {
			projection.remove("content");
			projection.remove("jsonContent");
		}
		// So far, we need to fetch the comments if we want to get their number
		// A better way to do this would be by using an aggregate function instead
		// of find
		if(postProjection.isWithComments() || postProjection.isWithNbComments()) {
			projection.put("comments", 1);
		} else {
			projection.remove("comments");
		}
		final Handler<Message<JsonObject>> finalHandler = new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				// After fetchinf the results, we have some post treatments to do for the comments
				// and for the content
				final Either<String, JsonArray> fetchResults = Utils.validResults(event);
				if(fetchResults.isRight()) {
					final JsonArray posts = fetchResults.right().getValue();
					// We calculate the number of comments
					if(postProjection.isWithNbComments()) {
						posts.forEach(p -> {
							final JsonObject post = (JsonObject) p;
							final JsonArray comments = (JsonArray)post.getJsonArray("comments");
							if(comments == null) {
								post.put("nbComments", 0);
							} else {
								int commentsSize = (int) comments
                                        .stream()
                                        .map(comment -> (JsonObject) comment)
                                        .filter(comment -> !comment.getBoolean("deleted", false))
										.count();
								post.put("nbComments", commentsSize);
							}
							// We don't send comments back if the user just wanted their number
							if(!postProjection.isWithComments()) {
								post.remove("comments");
							}
						});
					}
					// We have to transform the old content of the posts if the user requested
					// the content
					if (postProjection.isWithContent()) {
						final List<Future> transformedContents = posts.stream()
								.map(post -> handleOldContent((JsonObject) post, false, request))
								.collect(Collectors.toList());
						CompositeFuture.join(transformedContents).onComplete(e -> result.handle(fetchResults));
					} else {
						result.handle(fetchResults);
					}
				} else {
					result.handle(fetchResults);
				}

			}
		};

		mongo.count("blogs", MongoQueryBuilder.build(isManagerQuery), event -> {
      JsonObject res = event.body();
      if(res == null || !"ok".equals(res.getString("status"))){
        result.handle(new Either.Left<>(event.body().encodePrettily()));
        return;
      }
      boolean isManager = 1 == res.getInteger("count", 0);

			final Bson finalAccessQuery = and(
				accessQuery,
				or(
          eq("state", StateType.PUBLISHED.name()),
          and(
              eq("author.userId", user.getUserId()),
              eq("state", StateType.DRAFT.name())
          ),
          isManager ?
              eq("state", StateType.SUBMITTED.name()) :
              and(
                  eq("author.userId", user.getUserId()),
                  eq("state", StateType.SUBMITTED.name())
              )
      	)
			);

      final Bson query = getQueryListBuilder(search, result, finalAccessQuery);

      if (query != null) {
        if (limit > 0 && page == null) {
          mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, 0, limit, limit, finalHandler);
        } else if (page == null) {
          mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, finalHandler);
        } else {
          final int skip = (0 == page) ? -1 : page * limit;
          mongo.find(POST_COLLECTION, MongoQueryBuilder.build(query), sort, projection, skip, limit, limit, finalHandler);
        }
      }
    });
	}

	private Bson getQueryListBuilder(String search, Handler<Either<String, JsonArray>> result, final Bson accessQuery) {
		final Bson query;
		if (!StringUtils.isEmpty(search)) {
			final List<String> searchWords = DefaultBlogService.checkAndComposeWordFromSearchText(search, this.searchWordMinSize);
			if (!searchWords.isEmpty()) {
				final Bson searchQuery = text(MongoDbSearchService.textSearchedComposition(searchWords));
				query = and(accessQuery, searchQuery);
			} else {
				query = null;
				//empty result (no word to search)
				result.handle(new Either.Right<String, JsonArray>(new JsonArray()));
			}
		} else {
			query = accessQuery;
		}
		return query;
	}

	@Override
	public void listOne(String blogId, String postId, final UserInfos user, final Handler<Either<String, JsonArray>> result) {
		final Bson query = and(eq("blog.$id", blogId), eq("_id", postId));
		final Bson isManagerQuery = getDefautQueryBuilderForList(blogId, user,true);
		final JsonObject sort = new JsonObject().put("modified", -1);
		final JsonObject projection = defaultKeys.copy();
		projection.remove("content");

		final Handler<Message<JsonObject>> finalHandler = new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				result.handle(Utils.validResults(event));
			}
		};

		mongo.count(DefaultBlogService.BLOG_COLLECTION, MongoQueryBuilder.build(isManagerQuery), new Handler<Message<JsonObject>>() {
			public void handle(Message<JsonObject> event) {
				JsonObject res = event.body();
				if(res == null || !"ok".equals(res.getString("status"))){
					result.handle(new Either.Left<String, JsonArray>(event.body().encodePrettily()));
					return;
				}
				boolean isManager = 1 == res.getInteger("count", 0);

				final Bson finalQuery = and(
					query,
					or(
						eq("state", StateType.PUBLISHED.name()),
						and(
								eq("author.userId", user.getUserId()),
								eq("state", StateType.DRAFT.name())
						),
						isManager ?
								eq("state", StateType.SUBMITTED.name()) :
								and(
										eq("author.userId", user.getUserId()),
										eq("state", StateType.SUBMITTED.name())
								)
					)
				);
				mongo.find(POST_COLLECTION, MongoQueryBuilder.build(finalQuery), sort, projection, finalHandler);
			}
		});
	}

	private Bson getDefautQueryBuilderForList(String blogId, UserInfos user,boolean manager) {
		List<Bson> groups = new ArrayList<>();
		if(manager) {
			groups.add(and(eq("userId", user.getUserId()), eq(MANAGER_ACTION, true)));
		}else {
			groups.add(and(eq("userId", user.getUserId()), eq(this.listPostAction, true)));
		}
		for (String gpId: user.getGroupsIds()) {
			if(manager) {
				groups.add(and(eq("groupId", gpId), eq(MANAGER_ACTION, true)));
			}else {
				groups.add(and(eq("groupId", gpId), eq(this.listPostAction, true)));
			}
		}
		return and(
			eq("_id", blogId),
			or(
				eq("author.userId", user.getUserId()),
				elemMatch("shared", or(groups))
			)
		);
	}

	@Override
	public void submit(String blogId, String postId, UserInfos user, final Handler<Either<String, JsonObject>> result) {
		final Bson query = and(
			eq("_id", postId),
			eq("blog.$id", blogId),
			eq("state", StateType.DRAFT.name()),
			eq("author.userId", user.getUserId())
		);
		final JsonObject q = MongoQueryBuilder.build(query);
		JsonObject keys = new JsonObject().put("blog", 1).put("firstPublishDate", 1);
		JsonArray fetch = new JsonArray().add("blog");
		mongo.findOne(POST_COLLECTION, q, keys, fetch,
      event -> {
        final JsonObject res = event.body().getJsonObject("result", new JsonObject());
        if ("ok".equals(event.body().getString("status")) && res.size() > 0) {
          BlogService.PublishType type = Utils.stringToEnum(res
              .getJsonObject("blog",  new JsonObject()).getString("publish-type"),
              BlogService.PublishType.RESTRAINT, BlogService.PublishType.class);
          final StateType state = (BlogService.PublishType.RESTRAINT.equals(type)) ?
              StateType.SUBMITTED : StateType.PUBLISHED;
          MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().set("state", state.name());

          // if IMMEDIATE published post, first publishing must define the first published date
          if (StateType.PUBLISHED.equals(state) && res.getJsonObject("firstPublishDate") == null) {
            updateQuery = updateQuery.set("firstPublishDate", MongoDb.now()).set("sorted",  MongoDb.now());
          }

          mongo.update(POST_COLLECTION, q, updateQuery.build(), new Handler<Message<JsonObject>>() {
            @Override
            public void handle(Message<JsonObject> res) {
              res.body().put("state", state.name());
              result.handle(Utils.validResult(res));
            }
          });
        } else {
          result.handle(Utils.validResult(event));
        }
      });
	}

	@Override
	public void publish(final String blogId, final String postId, final Handler<Either<String, JsonObject>> result) {
		final Bson query = and(eq("_id", postId), eq("blog.$id", blogId));
		MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().set("state", StateType.PUBLISHED.name());
		mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query), updateQuery.build(), false, false, MongoDbAPI.WriteConcern.MAJORITY,
				MongoDbResult.validActionResultHandler(new Handler<Either<String,JsonObject>>() {
			public void handle(Either<String, JsonObject> event) {
				if(event.isLeft()){
					result.handle(event);
					return;
				}
				final Bson query = and(
					eq("_id", postId),
					eq("blog.$id", blogId),
					exists("firstPublishDate", false)
				);

				MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().set("firstPublishDate", MongoDb.now()).set("sorted",  MongoDb.now());

				mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query), updateQuery.build(), false, false, MongoDbAPI.WriteConcern.MAJORITY,
						MongoDbResult.validActionResultHandler(result));
			}
		}));
	}

	@Override
	public void unpublish(String postId, final Handler<Either<String, JsonObject>> result) {
		final Bson query = eq("_id", postId);
		MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().set("state", StateType.DRAFT.name());
		mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query), updateQuery.build(),
				new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> res) {
				result.handle(Utils.validResult(res));
			}
		});
	}

	@Override
	public void addComment(String blogId, String postId, final String comment, final String replyTo,
						   final UserInfos author, final Handler<Either<String, JsonObject>> result) {
		if (comment == null || comment.trim().isEmpty()) {
			result.handle(new Either.Left<>("Validation error : invalid comment."));
			return;
		}

		final Bson query = and(eq("_id", postId), eq("blog.$id", blogId));
		final JsonObject q = MongoQueryBuilder.build(query);
		JsonObject keys = new JsonObject().put("blog", 1);
		JsonArray fetch = new JsonArray().add("blog");

		mongo.findOne(POST_COLLECTION, q, keys, fetch, event -> {
			final JsonObject findPostResult = event.body().getJsonObject("result", new JsonObject());

            if ("ok".equals(event.body().getString("status")) && !findPostResult.isEmpty()) {
                BlogService.CommentType type = Utils.stringToEnum(
						findPostResult.getJsonObject("blog",  new JsonObject()).getString("comment-type"),
                        BlogService.CommentType.RESTRAINT,
						BlogService.CommentType.class);

                if (BlogService.CommentType.NONE.equals(type)) {
                    result.handle(new Either.Left<>("Comments are disabled for this blog."));
                    return;
                }

                StateType stateType = BlogService.CommentType.IMMEDIATE.equals(type)
						? StateType.PUBLISHED
						: StateType.SUBMITTED;

                JsonObject user = new JsonObject()
                        .put("userId", author.getUserId())
                        .put("username", author.getUsername())
                        .put("login", author.getLogin());

                JsonObject newComment = new JsonObject()
                        .put("comment", comment)
                        .put("id", UUID.randomUUID().toString())
                        .put("state", stateType.name())
                        .put("author", user)
                        .put("created", MongoDb.now());

				if (replyTo != null && !replyTo.isEmpty()) {
					newComment.put("replyTo", replyTo);
				}

                MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().push("comments", newComment);
                mongo.update(POST_COLLECTION, q, updateQuery.build(), res -> result.handle(Utils.validResult(res)));
            } else {
                result.handle(Utils.validResult(event));
            }
        });
	}

	@Override
	public void updateComment(String postId, final String commentId, final String comment, final UserInfos coauthor,
						   final Handler<Either<String, JsonObject>> result) {
		if (comment == null || comment.trim().isEmpty()) {
			result.handle(new Either.Left<String, JsonObject>("Validation error : invalid comment."));
			return;
		}
		final Bson query = and(
			eq("_id", postId),
			elemMatch("comments", eq("id", commentId)));

		final JsonObject user = new JsonObject()
				.put("userId", coauthor.getUserId())
				.put("username", coauthor.getUsername())
				.put("login", coauthor.getLogin());

		MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().set("comments.$.comment", comment);
		updateQuery = updateQuery.set("comments.$.coauthor", user).set("comments.$.modified", MongoDb.now());
		mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query), updateQuery.build(), new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> res) {
							result.handle(Utils.validResult(res));
						}
		});
	}

	@Override
	public void deleteComment(final String blogId, final String commentId, final UserInfos user,
			final Handler<Either<String, JsonObject>> result) {
		final Bson query2 = getDefautQueryBuilderForList(blogId, user,false);
		mongo.count("blogs", MongoQueryBuilder.build(query2), event -> {
			JsonObject res = event.body();
			Bson tmp = eq("id", commentId);

			if (res != null && "ok".equals(res.getString("status"))
					&& 1 != res.getInteger("count")) {
				tmp = and(tmp, eq("author.userId", user.getUserId()));
      		}

			final Bson query = and(
				eq("blog.$id", blogId),
				elemMatch("comments", tmp)
      		);

			// feat #WB2-1941
			// The specification says:
			// Dans le cas d’un commentaire supprimé une carte de type commentaire est affiché
			// contenant uniquement l’information suivante : contenu supprimé
			// Les réponses sont maintenues dans le fil, elles sont toujours visibles
			// si le gestionnaire ne les a pas supprimées.
			//
			// So we unset the comment content and author for RGPD compliance
			// and keep the comment id and creation date to keep the history
			// and add a deleted field to indicate that the comment has been deleted
			MongoUpdateBuilder queryUpdate = new MongoUpdateBuilder();
			queryUpdate.unset("comments.$.comment");
			queryUpdate.unset("comments.$.author");
			queryUpdate.unset("comments.$.state");
			queryUpdate.set("comments.$.deleted", true);

			mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query), queryUpdate.build(),
                    res1 -> result.handle(Utils.validResult(res1)));
    	});
	}

	@Override
	public void listComment(String blogId, String postId, final UserInfos user,
			final Handler<Either<String, JsonArray>> result) {
		final Bson query = and(eq("_id", postId), eq("blog.$id", blogId));
		JsonObject keys = new JsonObject().put("comments", 1).put("blog", 1);
		JsonArray fetch = new JsonArray().add("blog");
		mongo.findOne(POST_COLLECTION, MongoQueryBuilder.build(query), keys, fetch,
                event -> {
                    JsonArray commentsRes = new JsonArray();

                    if ("ok".equals(event.body().getString("status"))
							&& !event.body().getJsonObject("result", new JsonObject()).isEmpty()) {
                        JsonObject res = event.body().getJsonObject("result");
                        boolean userIsManager = userIsManager(user, res.getJsonObject("blog"));

                        for (Object comment: res.getJsonArray("comments", new JsonArray())) {
                            if (!(comment instanceof JsonObject)) continue;

							JsonObject commentJson = (JsonObject) comment;

							if (userIsManager
                                    || StateType.PUBLISHED.name().equals(commentJson.getString("state"))
                                    || Boolean.compare(Boolean.TRUE, commentJson.getBoolean("deleted", false)) == 0
                                    || user.getUserId().equals(commentJson.getJsonObject("author", new JsonObject()).getString("userId"))) {
								commentsRes.add(commentJson);
                            }
                        }
                    }
                    result.handle(new Either.Right<>(commentsRes));
                });
	}

	private boolean userIsManager(UserInfos user, JsonObject res) {
		if (res != null  && res.getJsonArray("shared") != null) {
			for (Object o: res.getJsonArray("shared")) {
				if (!(o instanceof JsonObject)) continue;
				JsonObject json = (JsonObject) o;
				return json != null && json.getBoolean(MANAGER_ACTION, false) &&
						(user.getUserId().equals(json.getString("userId")) ||
								user.getGroupsIds().contains(json.getString("groupId")));
			}
		}
		return false;
	}

	@Override
	public void publishComment(String blogId, String commentId,
				final Handler<Either<String, JsonObject>> result) {
		final Bson query = and(
			eq("blog.$id", blogId),
			elemMatch("comments", eq("id", commentId))
		);
		MongoUpdateBuilder updateQuery = new MongoUpdateBuilder().set("comments.$.state", StateType.PUBLISHED.name());
		mongo.update(POST_COLLECTION, MongoQueryBuilder.build(query), updateQuery.build(),
				new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> res) {
				result.handle(Utils.validResult(res));
			}
		});
	}

	private boolean validationError(Handler<Either<String, JsonObject>> result, JsonObject b) {
		if (b == null) {
			result.handle(new Either.Left<String, JsonObject>("Validation error : invalids fields."));
			return true;
		}
		return false;
	}

	private boolean isOk(JsonObject body) {
		return "ok".equals(body.getString("status"));
	}

	private String toErrorStr(JsonObject body) {
		return body.getString("error", body.getString("message", "query helper error"));
	}

	public void updateAllContents(UserInfos user, List<JsonObject> posts, Handler<Either<String, JsonArray>> handler){
		JsonArray operations = new JsonArray();
		posts.stream().map(o -> (JsonObject) o).forEach(row -> {
			JsonObject set = new MongoUpdateBuilder()//
					.set("content", row.getString("content")).build();
			JsonObject op = new JsonObject().put("operation", "update")//
					.put("document", set)//
					.put("criteria", new JsonObject().put("_id", row.getString("_id")));
			operations.add(op);
		});
		//
		mongo.bulk(POST_COLLECTION, operations, MongoDbResult.validResultsHandler(e->{
			if(e.isLeft()){
				log.error("Failed to notify bulk save: ", e.left().getValue());
				handler.handle(e);
			}else{
				try {
					final Map<String, JsonObject> all = new HashMap<>();
					for (final JsonObject post : posts) {
						final JsonObject blogRef = post.getJsonObject("blog");
						final String blogId = blogRef.getString("$id");
						post.put("version", new Date().getTime());
						all.put(blogId, post);
					}
					plugin.notifyUpsert(user, all).onComplete(eNotif -> {
						handler.handle(e);
						if (eNotif.failed()) {
							log.error("Failed to notify bulk upsert: ", eNotif.cause());
						}
					});
				}catch(Exception ee){
					log.error("Failed to notify bulk upsert: ", ee);
				}
			}
		}));
	}

	@Override
	public Future<Boolean> apply(AudienceCheckRightRequestMessage audienceCheckRightRequestMessage) {
		final BlogResourcesProvider blogResourcesProvider = new BlogResourcesProvider();
		final String userId = audienceCheckRightRequestMessage.getUserId();
		final Set<String> userGroups = audienceCheckRightRequestMessage.getUserGroups();

		return blogResourcesProvider.hasRightsOnAllPosts(userId, userGroups, audienceCheckRightRequestMessage.getResourceIds(), PostController.LIST_ACTION);
	}
}
