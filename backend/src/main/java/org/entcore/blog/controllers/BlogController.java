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

package org.entcore.blog.controllers;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.I18n;
import fr.wseduc.webutils.http.BaseController;
import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.blog.Blog;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.security.ShareAndOwnerBlog;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.BlogTimelineService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogTimelineService;
import org.entcore.common.events.EventHelper;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.http.request.ActionsUtils;
import org.entcore.common.neo4j.Neo;
import org.entcore.common.service.VisibilityFilter;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.entcore.common.utils.ResourceUtils;
import org.entcore.common.utils.StringUtils;
import org.vertx.java.core.http.RouteMatcher;

import org.entcore.blog.to.PostProjection;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import static com.mongodb.client.model.Filters.*;
import static org.entcore.common.http.response.DefaultResponseHandler.arrayResponseHandler;
import static org.entcore.common.http.response.DefaultResponseHandler.defaultResponseHandler;
import static org.entcore.common.user.UserUtils.getUserInfos;

public class BlogController extends BaseController {

	private final BlogService blog;
	private final PostService postService;
	private BlogTimelineService timelineService;
	private ShareService shareService;
	private EventHelper eventHelper;
	private final MongoDb mongo;
	private static final String PUBLIC_RESOURCE_NAME = "blog_public";
	private static final String PRIVATE_RESOURCE_NAME = "blog_private";

	public BlogController(MongoDb mongo, final BlogService blog, final PostService post){
		this.mongo = mongo;
		this.blog = blog;
		this.postService = post;
	}


	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
			Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
		MongoDb mongo = MongoDb.getInstance();
		this.timelineService = new DefaultBlogTimelineService(vertx, eb, config, new Neo(vertx, eb, log), mongo);
		final Map<String, List<String>> groupedActions = new HashMap<>();
		groupedActions.put("manager", loadManagerActions(securedActions.values()));
		final BlogExplorerPlugin plugin = blog.getPlugin();
		this.shareService = plugin.createShareService(groupedActions);
		final EventStore eventStore = EventStoreFactory.getFactory().getEventStore(Blog.class.getSimpleName());
		eventHelper = new EventHelper(eventStore);
	}

	@Get("")
	@SecuredAction("blog.view")
	public void blog(HttpServerRequest request) {
		eventHelper.onAccess(request);
		final String view = request.params().get("view");
		final boolean useNewUi = this.config.getBoolean("use-explorer-ui", true);
		renderView(request, new JsonObject(), "index.html", null);
	}

	@Get("/id/:id")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	public void displayBlog(HttpServerRequest request) {
		eventHelper.onAccess(request);
		renderView(request, new JsonObject(), "index.html", null);
	}

	/**
	 * Display react front post page /id/:id/post/:postid
	 * @param request
	 */
	@Get("/id/:id/post/:postid")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	public void viewPostById(HttpServerRequest request) {
		eventHelper.onAccess(request);
		renderView(request, new JsonObject(), "index.html", null);
	}

	/**
	 * Display react front print blog /print/:id
	 * @param request
	 */
	@Get("/print/:id")
	@SecuredAction("blog.print")
	public void print(HttpServerRequest request) {
		renderView(request, new JsonObject(), "index.html", null);
	}

	/**
	 * Display react front print post /print/:id/post/:postId
	 * @param request
	 */
	@Get("/print/:id/post/:postid")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	public void viewPrintPostById(HttpServerRequest request) {
		renderView(request, new JsonObject(), "index.html", null);
	}

	/**
	 * Display react front print /print/:id/post/:postId
	 * @param request
	 */
	@Get("/oldformat/:id/:postid")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	public void viewOldPostById(HttpServerRequest request) {
		renderView(request, new JsonObject(), "index.html", null);
	}

	// TODO improve fields matcher and validater
	@Post("")
	@SecuredAction("blog.create")
	public void create(final HttpServerRequest request) {
		RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
			public void handle(final JsonObject data) {
				getUserInfos(eb, request, new Handler<UserInfos>() {
					@Override
					public void handle(final UserInfos user) {
						if (user != null) {
							final Handler<Either<String,JsonObject>> handler = eventHelper.onCreateResource(request, PRIVATE_RESOURCE_NAME,defaultResponseHandler(request));
							blog.create(data, user, false, handler);
						} else {
							unauthorized(request);
						}
					}
				});
			}
		});
	}

	@Put("/:blogId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void update(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		RequestUtils.bodyToJson(request, data -> {
			getUserInfos(eb, request, user -> {
				if (user != null) {
					String visibility = data.getString("visibility");
					if(visibility==null || "".equals(visibility)){
						blog.update(user, blogId, data, defaultResponseHandler(request));
					}else{
						changeResourcesVisibility(blogId, data, user, visibility, request).onComplete(res->{
							blog.update(user, blogId, data, defaultResponseHandler(request));
						});
					}
				} else {
					unauthorized(request);
				}
			});
		});
	}

	private String getBlogUri(HttpServerRequest request, String blogId) {
		return pathPrefix + "#/view/" + blogId;
	}

	@Delete("/:blogId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void delete(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		getUserInfos(eb, request, user -> {
			if (user != null) {
				blog.delete(user, blogId, new Handler<Either<String, JsonObject>>() {
					@Override
					public void handle(Either<String, JsonObject> event) {
						if (event.isRight()) {
							renderJson(request, event.right().getValue(), 204);
						} else {
							JsonObject error = new JsonObject().put("error", event.left().getValue());
							renderJson(request, error, 400);
						}
					}
				});
			}else{
				unauthorized(request);
			}
		});
	}

	@Get("/:blogId")
	@SecuredAction(value = "blog.read", type = ActionType.RESOURCE)
	public void get(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		blog.get(blogId, defaultResponseHandler(request));
	}

	@Get("/counter/:blogId")
	@SecuredAction(value = "blog.posts.counter", type = ActionType.AUTHENTICATED)
	public void postCounter(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (StringUtils.isEmpty(blogId)) {
			badRequest(request);
			return;
		}

		getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					postService.counter(blogId, user, new Handler<Either<String, JsonArray>>() {
						public void handle(Either<String, JsonArray> event) {
							if (event.isLeft()) {
								arrayResponseHandler(request).handle(event);
								;
								return;
							}

							final JsonArray blogs = event.right().getValue();

							int countPublished = 0;
							int countDraft = 0;
							int countSubmitted = 0;
							int countAll = 0;

							final JsonObject result = new JsonObject();

							for (Object blogObj : blogs) {
								final String blogState = ((JsonObject) blogObj).getString("state");
								if (PostService.StateType.DRAFT.name().equals(blogState)) {
									countDraft++;
								} else if (PostService.StateType.PUBLISHED.name().equals(blogState)) {
									countPublished++;
								} else if (PostService.StateType.SUBMITTED.name().equals(blogState)) {
									countSubmitted++;
								}
							}

							countAll = countDraft + countPublished + countSubmitted;

							result.put("countPublished", countPublished);
							result.put("countDraft", countDraft);
							result.put("countSubmitted", countSubmitted);
							result.put("countAll", countAll);

							Renders.renderJson(request, result);
						}
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Get("/list/all")
	@SecuredAction("blog.list")
	public void list(final HttpServerRequest request) {
		getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					final Integer page;

					try {
						page = (request.params().get("page") != null) ? Integer.parseInt(request.params().get("page"))
								: null;
					} catch (NumberFormatException e) {
						badRequest(request, e.getMessage());
						return;
					}

					final String search = request.params().get("search");
					final String excludePost = request.params().get("excludePost");

					blog.list(user, page, search, new Handler<Either<String, JsonArray>>() {
						public void handle(Either<String, JsonArray> event) {
							if (event.isLeft()) {
								arrayResponseHandler(request).handle(event);
								;
								return;
							}

							final JsonArray blogs = event.right().getValue();

							if (blogs.size() < 1) {
								renderJson(request, new JsonArray());
								return;
							}

							final AtomicInteger countdown = new AtomicInteger(blogs.size());
							final Handler<Void> finalHandler = new Handler<Void>() {
								public void handle(Void v) {
									if (countdown.decrementAndGet() <= 0) {
										renderJson(request, blogs);
									}
								}
							};
							if("true".equals(excludePost)){
								renderJson(request, blogs);
								return;
							}

							for (Object blogObj : blogs) {
								final JsonObject blog = (JsonObject) blogObj;

								postService.list(blog.getString("_id"), PostService.StateType.PUBLISHED, user, null, 2,
										null, new Handler<Either<String, JsonArray>>() {
											public void handle(Either<String, JsonArray> event) {
												if (event.isRight()) {
													blog.put("fetchPosts", event.right().getValue());
												}
												finalHandler.handle(null);
											}
										});
							}

						}
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Get("/linker")
	public void listBlogsIds(final HttpServerRequest request) {
		getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					blog.list(user, null, null, new Handler<Either<String, JsonArray>>() {
						public void handle(Either<String, JsonArray> event) {
							if (event.isLeft()) {
								arrayResponseHandler(request).handle(event);
								return;
							}

							final JsonArray blogs = event.right().getValue();

							if (blogs.size() < 1) {
								renderJson(request, new JsonArray());
								return;
							}

							final AtomicInteger countdown = new AtomicInteger(blogs.size());
							final Handler<Void> finalHandler = new Handler<Void>() {
								public void handle(Void v) {
									if (countdown.decrementAndGet() <= 0) {
										renderJson(request, blogs);
									}
								}
							};

							for (Object blogObj : blogs) {
								final JsonObject blog = (JsonObject) blogObj;

								postService.list(blog.getString("_id"), PostService.StateType.PUBLISHED, user, null, 0,
										null, new Handler<Either<String, JsonArray>>() {
											public void handle(Either<String, JsonArray> event) {
												if (event.isRight()) {
													blog.put("fetchPosts", event.right().getValue());
												}
												finalHandler.handle(null);
											}
										});
							}

						}
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Get("/share/json/:blogId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void shareJson(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(UserInfos user) {
				if (user != null) {
					shareService.shareInfos(user.getUserId(), blogId, I18n.acceptLanguage(request),
							request.params().get("search"), defaultResponseHandler(request));
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Put("/share/json/:blogId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void shareJsonSubmit(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		request.setExpectMultipart(true);
		request.endHandler(new Handler<Void>() {
			@Override
			public void handle(Void v) {
				final List<String> actions = request.formAttributes().getAll("actions");
				final String groupId = request.formAttributes().get("groupId");
				final String userId = request.formAttributes().get("userId");
				if (actions == null || actions.isEmpty()) {
					badRequest(request);
					return;
				}
				getUserInfos(eb, request, new Handler<UserInfos>() {
					@Override
					public void handle(final UserInfos user) {
						if (user != null) {
							Handler<Either<String, JsonObject>> r = new Handler<Either<String, JsonObject>>() {
								@Override
								public void handle(Either<String, JsonObject> event) {
									if (event.isRight()) {
										JsonObject n = event.right().getValue().getJsonObject("notify-timeline");
										if (n != null) {
											timelineService.notifyShare(request, blogId, user, new JsonArray().add(n),
													getBlogUri(request, blogId));
										}
										renderJson(request, event.right().getValue());
									} else {
										JsonObject error = new JsonObject().put("error", event.left().getValue());
										renderJson(request, error, 400);
									}
								}
							};
							if (groupId != null) {
								shareService.groupShare(user.getUserId(), groupId, blogId, actions, r);
							} else if (userId != null) {
								shareService.userShare(user.getUserId(), userId, blogId, actions, r);
							} else {
								badRequest(request);
							}
						} else {
							unauthorized(request);
						}
					}
				});
			}
		});
	}

	@Get("/publish")
	@SecuredAction("blog.publish")
	public void publish(final HttpServerRequest request) {
		// This route is used to create publish Workflow right, nothing to do
		return;
	}

	@Put("/share/remove/:blogId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void removeShare(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}

		request.setExpectMultipart(true);
		request.endHandler(new Handler<Void>() {
			@Override
			public void handle(Void v) {
				final List<String> actions = request.formAttributes().getAll("actions");
				final String groupId = request.formAttributes().get("groupId");
				final String userId = request.formAttributes().get("userId");
				if (groupId != null) {
					shareService.removeGroupShare(groupId, blogId, actions, defaultResponseHandler(request));
				} else if (userId != null) {
					shareService.removeUserShare(userId, blogId, actions, defaultResponseHandler(request));
				} else {
					badRequest(request);
				}
			}
		});
	}

	@Put("/share/resource/:blogId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void shareResource(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					RequestUtils.bodyToJson(request, share -> {
						shareService.share(user.getUserId(), blogId, share, r -> {
							if (r.isRight()) {
								JsonArray nta = r.right().getValue().getJsonArray("notify-timeline-array");
								boolean sendNotification = false;
								if (nta != null) {
									sendNotification = true;
									timelineService.notifyShare(request, blogId, user, nta,
											getBlogUri(request, blogId));
								}
								renderJson(request, r.right().getValue());
								doShareSucceed(request, blogId, user, share, r.right().getValue(), sendNotification);
							} else {
								JsonObject error = new JsonObject().put("error", r.left().getValue());
								renderJson(request, error, 400);
							}
						});
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	private List<String> loadManagerActions(Collection<fr.wseduc.webutils.security.SecuredAction> actions) {
		List<String> managerActions = new ArrayList<>();
		if (actions != null) {
			for (fr.wseduc.webutils.security.SecuredAction a : actions) {
				if (a.getName() != null && "RESOURCE".equals(a.getType())
						&& "blog.manager".equals(a.getDisplayName())) {
					managerActions.add(a.getName().replaceAll("\\.", "-"));
				}
			}
		}
		return managerActions;
	}

	@Get("/blog/availables-workflow-actions")
	@SecuredAction(value = "blog.habilitation", type = ActionType.AUTHENTICATED)
	public void getActionsInfos(final HttpServerRequest request) {
		ActionsUtils.findWorkflowSecureActions(eb, request, this);
	}

	// Routes for public blogs
	@Get("/pub/:slug/print")
	public void printPublicBlog(HttpServerRequest request) {
		// Display react front page
		renderView(request, new JsonObject(), "index.html", null);
	}

	@Get("/pub/:slug/post/:postid")
	public void getPublicPost(HttpServerRequest request) {
		// Display react front page
		renderView(request, new JsonObject(), "index.html", null);
	}

	@Get("/pub/:slug/print/post/:postid")
	public void printPublicPost(HttpServerRequest request) {
		// Display react front page
		renderView(request, new JsonObject(), "index.html", null);
	}

	@Get("/pub/:slug")
	public void getPublicBlogInfos(final HttpServerRequest request) {
		final String slug = request.params().get("slug");
		blog.isPublicBlog(slug, BlogService.IdType.Slug, ev->{
			if(ev){
				UserUtils.getUserInfos(eb, request, user ->{
					blog.getPublic(slug, BlogService.IdType.Slug, json -> {
						if(json.isLeft()){
							badRequest(request);
							return;
						}
						JsonObject blog = json.right().getValue();
						if("json".equals(request.params().get("type"))){
							renderJson(request,blog);
						}else{
							// Display react front page
							renderView(request, new JsonObject(), "index.html", null);
						}
					});
				});
			}else{
				unauthorized(request);
			}
		});
	}

	@Post("/pub")
	@SecuredAction("blog.public")
	public void createPublicBlog(final HttpServerRequest request) {
		RequestUtils.bodyToJson(request, data -> {
			String slug = data.getString("slug");
			blog.isBlogExists(Optional.empty(),slug, evExists -> {
				if (evExists) {
					conflict(request);
					return;
				}
				getUserInfos(eb, request, user -> {
					if (user != null) {
						changeLogoVisibilityIfNeeded(data, VisibilityFilter.PUBLIC.name()).onComplete(res-> {
							final Handler<Either<String,JsonObject>> handler = eventHelper.onCreateResource(request, PUBLIC_RESOURCE_NAME, defaultResponseHandler(request));
							blog.create(data, user, true, handler);
						});
					} else {
						unauthorized(request);
					}
				});
			});
		});
	}

	@Put("/pub/:id")
	@ResourceFilter(ShareAndOwnerBlog.class)
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void updatePublicBlog(final HttpServerRequest request) {
		final String blogId = request.params().get("id");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
        RequestUtils.bodyToJson(request, data -> {
        	String slug = data.getString("slug");
        	blog.isBlogExists(Optional.ofNullable(blogId),slug,evExists ->{
				if(evExists){
					conflict(request);
					return;
				}
				getUserInfos(eb, request,  user -> {
					if (user != null) {
						String visibility = data.getString("visibility");
						changeResourcesVisibility(blogId,data, user, visibility, request).onComplete(res->{
							blog.update(user, blogId, data, defaultResponseHandler(request));
						});
					} else {
						unauthorized(request);
					}
				});
			});
        });
	}

	private Future<JsonObject> changeLogoVisibilityIfNeeded(JsonObject blog, String visibility){
		final VisibilityFilter eVisibility = VisibilityFilter.valueOf(visibility);
		final String icon = blog.getString("thumbnail");
		List<String> ids = ResourceUtils.extractIds(icon);
		if(icon==null || ids.isEmpty()){
			return Future.succeededFuture(blog);
		}
		final String newUrl = ResourceUtils.transformUrlTo(icon,ids,eVisibility);
		if(newUrl.equals(icon)){
			return Future.succeededFuture(blog);
		}
		//
		Promise<JsonObject> promise = Promise.promise();
		JsonObject j = new JsonObject()
				.put("action", "changeVisibility")
				.put("visibility", visibility)
				.put("documentIds", new JsonArray(ids));
		eb.request("org.entcore.workspace", j, r -> {
			blog.put("thumbnail", newUrl);
			promise.complete(blog);
		});
		return promise.future();
	}

	private Future<JsonArray> changeResourcesVisibility(String blogId, JsonObject data, UserInfos user, String visibility,
																											final HttpServerRequest request) {
		final VisibilityFilter eVisibility = VisibilityFilter.valueOf(visibility);
		final VisibilityFilter inverse = eVisibility.equals(VisibilityFilter.PUBLIC)?VisibilityFilter.OWNER:VisibilityFilter.PUBLIC;
		//get old version of blog
		Promise<JsonObject> promiseBlog = Promise.promise();
		blog.get(blogId,res->{
			if(res.isRight()){
				promiseBlog.complete(res.right().getValue());
			}else{
				promiseBlog.fail(res.left().getValue());
			}
		});
		//check if visibility has changed
		return promiseBlog.future().map(blog->{
			String oldVisibility = blog.getString("visibility","");
			if(oldVisibility.equals(visibility)){
				//nothing to change
				return false;
			}
			return true;
		})//change logo
		.compose(changed->{
			String icon = data.getString("thumbnail");
			List<String> ids = ResourceUtils.extractIds(icon);
			if(ids.isEmpty()){
				return Future.succeededFuture(changed);
			}
			//
			Promise<Boolean> promise = Promise.promise();
			JsonObject j = new JsonObject()
					.put("action", "changeVisibility")
					.put("visibility", visibility)
					.put("documentIds", new JsonArray(ids));
			eb.request("org.entcore.workspace", j, r -> {
				data.put("thumbnail", ResourceUtils.transformUrlTo(icon,ids,eVisibility));
				promise.complete(changed);
			});
			return promise.future();
		})//fetch post
		.compose(changed ->{
			if(!changed){
				return Future.succeededFuture(new JsonArray());
			}
			Promise<JsonArray> promiseList = Promise.promise();
			//fetch posts
			postService.list(blogId, user, null, 0, "", null, new PostProjection(true, true, false), event -> {
				if (event.isRight()) {
					JsonArray posts = event.right().getValue();
					promiseList.complete(posts);
				}else{
					promiseList.fail(event.left().getValue());
				}
			}, request);
			return promiseList.future();
		})//transform content
		.compose(posts -> {
			if(posts.isEmpty()){
				return Future.succeededFuture(new ArrayList<JsonObject>());
			}
			Promise<List<JsonObject>> postToSave = Promise.promise();
			Map<String, JsonObject> postByIds = new HashMap<>();
			Map<String, List<String>> idsByPost = new HashMap<>();
			List<String> allIds = new ArrayList<>();
			for(Object elem : posts){
				JsonObject post = (JsonObject)(elem);
				String content = post.getString("content");
				String id = post.getString("_id");
				final List<String> currentIds = ResourceUtils.extractIds(content,inverse);
				if(!currentIds.isEmpty()){
					idsByPost.put(id,currentIds);
					postByIds.put(id, post);
				}
				allIds.addAll(currentIds);
			};
			JsonObject j = new JsonObject()
					.put("action", "changeVisibility")
					.put("visibility", visibility)
					.put("documentIds", new JsonArray(allIds));
			if(allIds.size()>0){
				eb.request("org.entcore.workspace", j, r -> {
					List<JsonObject> toSave = new ArrayList<>(postByIds.values());
					for(String postId : postByIds.keySet()){
						JsonObject post = postByIds.get(postId);
						String content = post.getString("content");
						List<String> ids = idsByPost.get(postId);
						content = ResourceUtils.transformUrlTo(content, ids,eVisibility);
						post.put("content", content);
					}
					postToSave.complete(toSave);
				});
			}else{
				postToSave.complete(new ArrayList<>());
			}
			return postToSave.future();
		})//save post content
		.compose(postsToSave->{
			if(postsToSave.isEmpty()){
				return Future.succeededFuture(new JsonArray());
			}
			Promise<JsonArray> promise = Promise.promise();
			postService.updateAllContents(user, postsToSave, res->{
				if(res.isRight()){
					promise.complete(res.right().getValue());
				}else{
					promise.fail(res.left().getValue());
				}
			});
			return promise.future();
		});
	}

	private void cleanFolders(String id, UserInfos user, List<String> recipientIds){
		//owner style keep the reference to the ressource
		JsonArray jsonRecipients = new JsonArray(recipientIds).add(user.getUserId());
		JsonObject query = MongoQueryBuilder.build(and(eq("ressourceIds", id), not(in("owner.userId", jsonRecipients))));
		JsonObject update = new JsonObject().put("$pull", new JsonObject().put("ressourceIds", new JsonObject().put("$nin",jsonRecipients)));
		mongo.update("blogsFolders", query, update, message -> {
			JsonObject body = message.body();
			if (!"ok".equals(body.getString("status"))) {
				String err = body.getString("error", body.getString("message", "unknown cleanFolder Error"));
				log.error("[cleanFolders] failed to clean folder because of: "+err);
			}
		});
	}

	public void doShareSucceed(HttpServerRequest request, String id, UserInfos user,JsonObject sharePayload, JsonObject result, boolean sendNotify){
		if(sharePayload!=null){
			Set<String> userIds = sharePayload.getJsonObject("users", new JsonObject()).getMap().keySet();
			Set<String> groupIds = sharePayload.getJsonObject("groups", new JsonObject()).getMap().keySet();
			UserUtils.getUserIdsForGroupIds(groupIds,user.getUserId(),this.eb, founded->{
				if(founded.succeeded()){
					List<String> userToKeep = new ArrayList<>(userIds);
					userToKeep.addAll(founded.result());
					cleanFolders(id, user, userToKeep);
				}else{
					log.error("[doShareSucceed] failed to found recipient because:",founded.cause());
				}
			});
		}
	}

}
