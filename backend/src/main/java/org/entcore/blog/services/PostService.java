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

package org.entcore.blog.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Future;
import io.vertx.core.http.HttpServerRequest;
import org.entcore.blog.to.PostFilter;
import org.entcore.blog.to.PostProjection;
import org.entcore.common.audience.AudienceRightChecker;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

public interface PostService extends AudienceRightChecker {

	enum StateType {
		DRAFT, SUBMITTED, PUBLISHED
	};

	List<String> FIELDS = Arrays.asList("author", "title", "content",
			"blog", "state", "comments", "created", "modified", "views");

	List<String> UPDATABLE_FIELDS = Arrays.asList("title", "content", "modified");

	void create(String blogId, JsonObject post, UserInfos author,
			Handler<Either<String, JsonObject>> result,
			final HttpServerRequest httpCallerRequest);

	void update(String postId, JsonObject post, UserInfos user,
			Handler<Either<String, JsonObject>> result,
			final HttpServerRequest httpCallerRequest);

	void delete(UserInfos user, String blogId, String postId, Handler<Either<String, JsonObject>> result);

	/**
	 *
	 * @param filter Filter that describes the desired post.
	 * @return Fetched post iff the post with the specified id and state belongs to
	 *         the blog with the specified id.
	 */
	Future<JsonObject> get(final PostFilter filter,
												 final HttpServerRequest httpCallerRequest);

	default void list(String blogId, UserInfos user, Integer page, int limit, String search, final Set<String> states,
			Handler<Either<String, JsonArray>> result,
										final HttpServerRequest httpCallerRequest) {
		list(blogId, user, page, limit, search, states, new PostProjection(false, false, false), result, httpCallerRequest);
	}

	void list(String blogId, UserInfos user, Integer page, int limit, String search,
			final Set<String> states, final PostProjection projection,
						Handler<Either<String, JsonArray>> result,
						final HttpServerRequest httpCallerRequest);

	void list(String blogId, StateType state, UserInfos user, Integer page, int limit, String search,
			Handler<Either<String, JsonArray>> result);

	void listPublic(String blogId, Integer page, int limit, String search,
									final HttpServerRequest request, Handler<Either<String, JsonArray>> result);

	void listOnePublic(String blogId, String postId,
										 final HttpServerRequest request,
										 final Handler<Either<String, JsonArray>> result);

	void listOne(String blogId, String postId, final UserInfos user, final Handler<Either<String, JsonArray>> result);

	void submit(String blogId, String postId, UserInfos user, Handler<Either<String, JsonObject>> result);

	void publish(String blogId, String postId, Handler<Either<String, JsonObject>> result);

	void unpublish(String postId, Handler<Either<String, JsonObject>> result);

	void addComment(String blogId, String postId, String comment, String replyTo, UserInfos author,
			Handler<Either<String, JsonObject>> result);

	void updateComment(String postId, final String commentId, final String comment, final UserInfos coauthor,
			final Handler<Either<String, JsonObject>> result);

	void deleteComment(String blogId, String commentId, UserInfos author, Handler<Either<String, JsonObject>> result);

	void listComment(String blogId, String postId, UserInfos author, Handler<Either<String, JsonArray>> result);

	void publishComment(String blogId, String commentId, Handler<Either<String, JsonObject>> result);

	void counter(final String blogId, final UserInfos user, final Handler<Either<String, JsonArray>> result);

	void count(final String blogId, final StateType state, final Handler<Either<String, Integer>> result);

	void updateAllContents(UserInfos user, List<JsonObject> posts, Handler<Either<String, JsonArray>> handler);
}
