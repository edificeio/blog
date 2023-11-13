package org.entcore.blog;

import com.mongodb.QueryBuilder;
import com.opendigitaleducation.explorer.ingest.IngestJobMetricsRecorderFactory;
import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.transformer.IContentTransformerClient;
import fr.wseduc.transformer.to.ContentTransformerRequest;
import fr.wseduc.transformer.to.ContentTransformerResponse;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;
import org.entcore.test.TestHelper;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;

import java.util.HashMap;
import java.util.Map;

import static fr.wseduc.mongodb.MongoDbAPI.isOk;
import static org.entcore.blog.BlogExplorerPluginClientTest.createBlog;


@RunWith(VertxUnitRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class PostServiceContentTransformerTest {

    /**
     * Class to test
     */
    static PostService postService;
    static BlogService blogService;
    private static final TestHelper test = TestHelper.helper();
    @ClassRule
    public static Neo4jContainer<?> neo4jContainer = test.database().createNeo4jContainer();
    @ClassRule
    public static ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static MongoDb mongoDb;
    static BlogExplorerPlugin blogPlugin;
    static PostExplorerPlugin postPlugin;
    static DummyContentTransformerClient contentTransformerClient;
    static final int POST_SEARCH_WORD = 4;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos user = test.directory().generateUser("user");

    static final int nbTimesGetSamePost = 10;

    @BeforeClass
    public static void setUp(TestContext context) throws Exception {
        IngestJobMetricsRecorderFactory.init(test.vertx(), new JsonObject());
        test.database().initNeo4j(context, neo4jContainer);
        user.setLogin("user");
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        mongoDb = MongoDb.getInstance();
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        final MongoClient mongoClient = test.database().createMongoClient(mongoDBContainer);
        final Map<String, SecuredAction> securedActions = test.share().getSecuredActions(context);
        blogPlugin = new BlogExplorerPlugin(communication, mongoClient, securedActions);
        postPlugin = blogPlugin.postPlugin();
        contentTransformerClient = new DummyContentTransformerClient();
        data.put("BLOGID1", "blog-id-1");
        postService = new DefaultPostService(mongoDb, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin, contentTransformerClient);
        blogService = new DefaultBlogService(mongoDb, postService, 20, 3, blogPlugin);
    }


    @Test
    public void step1GetTransformedPostAfterCreation(TestContext context) {

        final Async async = context.async();
        final String blogId = (String) data.get("BLOGID1");
        final JsonObject post1 = createPost("post1");
        postService.create(blogId, post1, user, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(createdPost -> {
            final String postId = createdPost.getString("_id");
            data.put("POSTID1", postId);
            context.assertNotNull(postId);
            postService.get(blogId, postId, PostService.StateType.DRAFT, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(postGet -> {
                context.assertEquals("<p>clean html</p>"+post1.getString("content"), postGet.getString("content"));
                context.assertEquals(1, postGet.getInteger("contentVersion"));
                // Checking that fields not returned by get method are correctly persisted in the database
                QueryBuilder query = QueryBuilder.start("_id").is(postId).put("blog.$id").is(blogId);
                mongoDb.findOne("posts", MongoQueryBuilder.build(query), new JsonObject().put("jsonContent", 1).put("contentPlain", 1), event -> {
                    JsonObject result = event.body().getJsonObject("result");
                    context.assertEquals(new JsonObject().put("content", post1.getString("content")), result.getJsonObject("jsonContent"));
                    context.assertEquals("plainTextContent", result.getString("contentPlain"));
                });
                async.complete();
            })));
        })));
    }




    @Test
    public void step2GetTransformedPostAfterUpdate(TestContext context) {
        final Async async = context.async();
        final String blogId = (String) data.get("BLOGID1");
        final String postId = (String) data.get("POSTID1");
        final JsonObject post2 = createPost("post2");
        postService.update(postId, post2, user, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(updatedPost -> {
            context.assertNotNull(postId);
            postService.get(blogId, postId, PostService.StateType.DRAFT, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(postGet -> {
                context.assertEquals("<p>clean html</p>"+post2.getString("content"), postGet.getString("content"));
                context.assertEquals(1, postGet.getInteger("contentVersion"));
                // Checking that fields not returned by get method are correctly persisted in the database
                QueryBuilder query = QueryBuilder.start("_id").is(postId).put("blog.$id").is(blogId);
                mongoDb.findOne("posts", MongoQueryBuilder.build(query), new JsonObject().put("jsonContent", 1).put("contentPlain", 1), event -> {
                    context.assertEquals(new JsonObject().put("content", post2.getString("content")), event.body().getJsonObject("result").getJsonObject("jsonContent"));
                    context.assertEquals("plainTextContent", event.body().getJsonObject("result").getString("contentPlain"));
                });
                async.complete();
            })));
        })));
    }

    /**
     * <h1>Goal</h1>
     * <p>Ensure that the transformer is called only once for legacy content.</p>
     * <h1>Steps</h1>
     * <ol>
     *   <li>Create a blog</li>
     *   <li>Create a post</li>
     *   <li>Remove the fields of the created post which allows us to detect that a content is produced by the new editor</li>
     *   <li>Call successively n times /get</li>
     *   <li>Verify that we get a coherent result</li>
     *   <li>Verify that the transformer is only called once</li>
     * </ol>
     * @param context Test context
     */
    @Test
    public void testCacheTransformationContent(final TestContext context) {
        final Async async = context.async();
        final JsonObject blogData = createBlog("Blog cache", user);
        final JsonObject postCache = createPost("post-cache");
        createBlogOrFail(blogData, user, context)
        .compose(blog -> createPostOrFail(blog.getString("_id"), postCache, user, context).map(post -> new BlogAndPost(blog, post)))
        .compose(blogAndPost -> simulateOldContentData(blogAndPost.post).map(e -> blogAndPost))
        .onSuccess(e -> contentTransformerClient.resetNbCalls())
        .compose(blogAndPost -> getPostOrFailNTimes(blogAndPost.blog, blogAndPost.post, nbTimesGetSamePost, context))
        .onSuccess(e -> context.assertEquals(1, contentTransformerClient.nbCalls, "The cache didn't work, we should have called the transformer only once"))
        .onSuccess(e -> async.complete())
        .onFailure(context::fail)
        .onSuccess(e -> async.complete());
    }

    private Future<Void> simulateOldContentData(JsonObject post) {
        final Promise<Void> promise = Promise.promise();
        final QueryBuilder query = QueryBuilder.start("_id").is(post.getString("_id"));
        MongoUpdateBuilder simulateOldUpdateQuery = new MongoUpdateBuilder();
        simulateOldUpdateQuery.unset("jsonContent");
        simulateOldUpdateQuery.unset("contentVersion");
        mongoDb.update("posts", MongoQueryBuilder.build(query), simulateOldUpdateQuery.build(), message -> {
            final JsonObject body = message.body();
            if (isOk(body)) {
                promise.complete();
            } else {
                promise.fail("Error while removing new editor content fields : " + body);
            }
        });
        return promise.future();
    }

    private Future<Void> getPostOrFailNTimes(final JsonObject blog, JsonObject post, final int nbTimesToGet, final TestContext context) {
        final Promise<Void> promise = Promise.promise();
        if(nbTimesToGet <= 0) {
            promise.fail("nbTimesToGet should be a positive number");
        } else {
            postService.get(blog.getString("_id"), post.getString("_id"), PostService.StateType.DRAFT, e -> {
                if(e.isLeft()) {
                    promise.fail("Fail to get the post at iteration " + ( nbTimesGetSamePost - nbTimesToGet + 1) + " : " + e.right().getValue());
                } else {
                    final JsonObject fetchedPost = e.right().getValue();
                    context.assertTrue(fetchedPost.containsKey("contentVersion"), "Fetched post should contain a version field");
                    context.assertEquals(0, fetchedPost.getInteger("contentVersion"), "Content version should remain 0");
                    context.assertEquals("<p>clean html</p>"+ post.getString("content"), fetchedPost.getString("content"));
                    context.assertTrue(fetchedPost.containsKey("jsonContent"), "Fetched post should have a jsonContent field");
                    if(nbTimesToGet == 1) {
                        promise.complete();
                    } else {
                        getPostOrFailNTimes(blog, post, nbTimesToGet - 1, context).onComplete(promise);
                    }
                }
            });
        }
        return promise.future();
    }
    private Future<JsonObject> createPostOrFail(String blogId, JsonObject postData, UserInfos user, final TestContext context) {
        final Promise<JsonObject> promise = Promise.promise();
        postService.create(blogId, postData, user, e -> {
            if (e.isLeft()) {
                context.fail("An error occurred while creating the post : " + e.left().getValue());
                promise.fail(e.left().getValue());
            } else {
                promise.complete(e.right().getValue());
            }
        });
        return promise.future();
    }

    private Future<JsonObject> createBlogOrFail(final JsonObject blogData, UserInfos user, final TestContext context) {
        final Promise<JsonObject> promise = Promise.promise();
        blogService.create(blogData, PostServiceContentTransformerTest.user, false, eventBlogCreation -> {
            if (eventBlogCreation.isLeft()) {
                context.fail("An error occurred while creating the blog : " + eventBlogCreation.left().getValue());
                promise.fail(eventBlogCreation.left().getValue());
            } else {
                promise.complete(eventBlogCreation.right().getValue());
            }
        });
        return promise.future();
    }

    static class DummyContentTransformerClient implements IContentTransformerClient {

        /** Number of times a transformation has been asked.*/
        private int nbCalls = 0;

        @Override
        public Future<ContentTransformerResponse> transform(ContentTransformerRequest contentTransformerRequest) {
            nbCalls++;
            return Future.succeededFuture(new ContentTransformerResponse(1, null, new JsonObject().put("content", contentTransformerRequest.getHtmlContent()).getMap(), "plainTextContent", "<p>clean html</p>"+contentTransformerRequest.getHtmlContent(), null));
        }

        public void resetNbCalls() {
            nbCalls = 0;
        }

        public int getNbCalls() {
            return nbCalls;
        }
    }


    static JsonObject createPost(final String name) {
        return new JsonObject().put("title", name).put("content", "<div> description" + name + " </div>").put("state", "PUBLISHED");
    }

    static class BlogAndPost {
        final JsonObject blog;

        public BlogAndPost(JsonObject blog, JsonObject post) {
            this.blog = blog;
            this.post = post;
        }

        final JsonObject post;
    }
}
