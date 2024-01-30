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

import com.mongodb.QueryBuilder;
import fr.wseduc.mongodb.MongoDbAPI;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import io.vertx.core.Vertx;
import org.entcore.common.service.impl.MongoDbRepositoryEvents;
import org.entcore.common.folders.impl.DocumentHelper;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

public class BlogRepositoryEvents extends MongoDbRepositoryEvents {

	public BlogRepositoryEvents(Vertx vertx) {
		super(vertx);

		this.collectionNameToImportPrefixMap.put(DefaultBlogService.BLOG_COLLECTION, "blog_");
		this.collectionNameToImportPrefixMap.put(DefaultPostService.POST_COLLECTION, "post_");
	}

	@Override
	public void exportResources(JsonArray resourcesIds, boolean exportDocuments, boolean exportSharedResources, String exportId, String userId,
								JsonArray groups, String exportPath, String locale, String host, Handler<Boolean> handler)
	{
			QueryBuilder findByAuthor = QueryBuilder.start("author.userId").is(userId);
			QueryBuilder findByShared = QueryBuilder.start().or(
					QueryBuilder.start("shared.userId").is(userId).get(),
					QueryBuilder.start("shared.groupId").in(groups).get()
			);
			QueryBuilder findByAuthorOrShared = exportSharedResources == false ? findByAuthor : QueryBuilder.start().or(findByAuthor.get(),findByShared.get());

			JsonObject query;

			if(resourcesIds == null)
				query = MongoQueryBuilder.build(findByAuthorOrShared);
			else
			{
				QueryBuilder limitToResources = findByAuthorOrShared.and(
					QueryBuilder.start("_id").in(resourcesIds).get()
				);
				query = MongoQueryBuilder.build(limitToResources);
			}

			final AtomicBoolean exported = new AtomicBoolean(false);

			Map<String, String> prefixMap = this.collectionNameToImportPrefixMap;

			mongo.find(DefaultBlogService.BLOG_COLLECTION, query, new Handler<Message<JsonObject>>()
			{
				@Override
				public void handle(Message<JsonObject> event)
				{
					JsonArray results = event.body().getJsonArray("results");
					if ("ok".equals(event.body().getString("status")) && results != null)
					{
						results.forEach(elem ->
						{
							JsonObject blog = ((JsonObject) elem);
							blog.put("title", prefixMap.get(DefaultBlogService.BLOG_COLLECTION) + blog.getString("title"));
							DocumentHelper.clearComments(blog);
						});

						final Set<String> ids = results.stream().map(res -> ((JsonObject)res).getString("_id")).collect(Collectors.toSet());
						QueryBuilder findByBlogId = QueryBuilder.start("blog.$id").in(ids);
						JsonObject query2 = MongoQueryBuilder.build(findByBlogId);

						mongo.find(DefaultPostService.POST_COLLECTION, query2, new Handler<Message<JsonObject>>()
						{
							@Override
							public void handle(Message<JsonObject> event2)
							{
								JsonArray results2 = event2.body().getJsonArray("results");
								if ("ok".equals(event2.body().getString("status")) && results2 != null)
								{
									results2.forEach(elem ->
									{
										JsonObject post = ((JsonObject) elem);
										post.put("title", prefixMap.get(DefaultPostService.POST_COLLECTION) + post.getString("title"));
										DocumentHelper.clearComments(post);
									});
									results.addAll(results2);

									createExportDirectory(exportPath, locale, new Handler<String>()
									{
										@Override
										public void handle(String path)
										{
											if (path != null)
											{
												Handler<Boolean> finish = new Handler<Boolean>()
												{
													@Override
													public void handle(Boolean bool)
													{
														exportFiles(results, path, new HashSet<String>(), exported, handler);
													}
												};

												if(exportDocuments == true)
													exportDocumentsDependancies(results, path, finish);
												else
													finish.handle(Boolean.TRUE);
											}
											else
											{
												handler.handle(exported.get());
											}
										}
									});
								}
								else
								{
									log.error("Blog : Could not proceed query " + query2.encode(), event2.body().getString("message"));
									handler.handle(exported.get());
								}
							}
						});
					}
					else
					{
						log.error("Blog : Could not proceed query " + query.encode(), event.body().getString("message"));
						handler.handle(exported.get());
					}
				}
			});
	}

	@Override
	protected JsonObject transformDocumentBeforeImport(JsonObject document, String collectionName,
		String importId, String userId, String userLogin, String userName)
	{
		if(collectionName == DefaultBlogService.BLOG_COLLECTION || collectionName == DefaultPostService.POST_COLLECTION)
		{
			JsonObject owner = document.getJsonObject("owner");
			owner.put("username", owner.getString("displayName", ""));
			owner.put("login", userLogin);
			document.put("author", owner);
			document.remove("owner");
			document.remove("slug");
			document.put("visibility", "OWNER");
		}

		return document;
	}

	@Override
	public void deleteUsers(JsonArray users) {
		deleteUsers(users, e -> {});
	}

	@Override
	public void deleteUsers(JsonArray users, Handler<List<ResourceChanges>> handler) {
		if(users == null) {
			return;
		}
		for(int i = users.size(); i-- > 0;)
		{
			if(users.hasNull(i))
				users.remove(i);
			else if (users.getJsonObject(i) != null && users.getJsonObject(i).getString("id") == null)
				users.remove(i);
		}
		if(users.size() == 0)
			return;

		final String[] userIds = new String[users.size()];
		for (int i = 0; i < users.size(); i++) {
			JsonObject j = users.getJsonObject(i);
			userIds[i] = j.getString("id");
		}

		final JsonObject criteria = MongoQueryBuilder.build(QueryBuilder.start("shared.userId").in(userIds));

		long timestamp = System.currentTimeMillis();
		MongoUpdateBuilder modifier = new MongoUpdateBuilder();
		modifier.set("_deleteUsersKey", timestamp);
		modifier.pull("shared", MongoQueryBuilder.build(QueryBuilder.start("userId").in(userIds)));

		final String collection = DefaultBlogService.BLOG_COLLECTION;
		mongo.update(collection, criteria, modifier.build(), false, true, MongoDbAPI.WriteConcern.MAJORITY, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				if (!"ok".equals(event.body().getString("status"))) {
					log.error("Error deleting users shared in collection " + collection  +
							" : " + event.body().getString("message"));
				}

				final JsonObject criteria = MongoQueryBuilder.build(QueryBuilder.start("author.userId").in(userIds));
				MongoUpdateBuilder modifier = new MongoUpdateBuilder();
				modifier.set("_deleteUsersKey", timestamp);
				modifier.set("author.deleted", true);
				mongo.update(collection, criteria, modifier.build(), false, true,  MongoDbAPI.WriteConcern.MAJORITY, new Handler<Message<JsonObject>>() {
					@Override
					public void handle(Message<JsonObject> event) {
						if (!"ok".equals(event.body().getString("status"))) {
							log.error("Error deleting users shared in collection " + collection +
									" : " + event.body().getString("message"));
						} else {
							final QueryBuilder findByKey = QueryBuilder.start("_deleteUsersKey").is(timestamp);
							final JsonObject query = MongoQueryBuilder.build(findByKey);
							// fetch for update
							mongo.find(collection, query, (eventFind) -> {
								JsonArray results = ((JsonObject)eventFind.body()).getJsonArray("results");
								List<ResourceChanges> list = new ArrayList();
								if ("ok".equals(((JsonObject)eventFind.body()).getString("status")) && results != null && !results.isEmpty()) {
									log.info("[deleteUsers] resource to update count=" + results.size());
									results.forEach((elem) -> {
										if (elem instanceof JsonObject) {
											JsonObject jsonElem = (JsonObject)elem;
											String id = jsonElem.getString("_id");
											list.add(new ResourceChanges(id, false));
										}
									});
								} else {
									log.error("[deleteUsers] Could not found updated resources:" + eventFind.body());
								}
								handler.handle(list);
							});
							delete(collection, handler);
						}
					}
				});
			}
		});
	}

	private void delete(final String collection, Handler<List<ResourceChanges>> handler) {
		final JsonObject query = MongoQueryBuilder.build(
				QueryBuilder.start("shared.org-entcore-blog-controllers-BlogController|shareJson").notEquals(true)
						.put("author.deleted").is(true));

		mongo.find(collection, query, null, new JsonObject().put("_id", 1), new Handler<Message<JsonObject>>() {
					@Override
					public void handle(Message<JsonObject> res) {
				String status = res.body().getString("status");
				JsonArray results = res.body().getJsonArray("results");
				if ("ok".equals(status) && results != null && results.size() > 0) {
					String[] blogIds = new String[results.size()];
					for (int i = 0; i < results.size(); i++) {
						JsonObject j = results.getJsonObject(i);
						blogIds[i] = j.getString("_id");
					}
					QueryBuilder q = QueryBuilder.start("blog.$id").in(blogIds);
					mongo.delete(DefaultPostService.POST_COLLECTION, MongoQueryBuilder.build(q),
							new Handler<Message<JsonObject>>() {
								@Override
								public void handle(Message<JsonObject> event) {
									if (!"ok".equals(event.body().getString("status"))) {
										log.error("Error deleting posts : " + event.body().encode());
									} else {
										log.info("Posts deleted : " + event.body().getInteger("number"));
									}
								}
							});
					QueryBuilder query = QueryBuilder.start("_id").in(blogIds);
					mongo.delete(collection, MongoQueryBuilder.build(query),
							new Handler<Message<JsonObject>>() {
								@Override
								public void handle(Message<JsonObject> event) {
									if (!"ok".equals(event.body().getString("status"))) {
										log.error("Error deleting blogs : " + event.body().encode());
									} else {
										log.info("Blogs deleted : " + event.body().getInteger("number"));
										final List<ResourceChanges> changes = new ArrayList<>();
										for(final String id : blogIds) {
											changes.add(new ResourceChanges(id, true));
										}
										handler.handle(changes);
									}
								}
							});
				}
			}
		});
	}

}
