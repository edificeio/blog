package org.entcore.blog.explorer;

import fr.wseduc.mongodb.MongoQueryBuilder;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.mongo.MongoClientDeleteResult;
import org.entcore.blog.Blog;
import org.entcore.common.explorer.impl.ExplorerSubResourceMongo;
import org.entcore.common.user.UserInfos;

import java.util.Collection;
import java.util.Optional;

import static com.mongodb.client.model.Filters.in;

public class PostExplorerPlugin extends ExplorerSubResourceMongo {
    public static final String TYPE = Blog.BLOG_TYPE;
    public static final String COLLECTION = Blog.POSTS_COLLECTION;
    static Logger log = LoggerFactory.getLogger(PostExplorerPlugin.class);

    public PostExplorerPlugin(final BlogExplorerPlugin plugin) {
        super(plugin, plugin.getMongoClient());
    }

    @Override
    protected Optional<UserInfos> getCreatorForModel(final JsonObject json) {
        if(!json.containsKey("author") || !json.getJsonObject("author").containsKey("userId")){
            return Optional.empty();
        }
        final JsonObject author = json.getJsonObject("author");
        final UserInfos user = new UserInfos();
        user.setUserId( author.getString("userId"));
        user.setUsername(author.getString("username"));
        user.setLogin(author.getString("login"));
        return Optional.of(user);
    }

    @Override
    public Future<Void> onDeleteParent(final Collection<String> ids) {
        if(ids.isEmpty()) {
            return Future.succeededFuture();
        }
        final MongoClient mongo = ((BlogExplorerPlugin)super.parent).getMongoClient();
        final JsonObject filter = MongoQueryBuilder.build(in("blog.$id", ids));
        final Promise<MongoClientDeleteResult> promise = Promise.promise();
        log.info("Deleting post related to deleted blog. Number of blogs="+ids.size());
        mongo.removeDocuments(COLLECTION, filter, promise);
        return promise.future().map(e->{
            log.info("Deleted post related to deleted blog. Number of posts="+e.getRemovedCount());
            return null;
        });
    }

    @Override
    protected String getCreatedAtColumn() {
        return "created";
    }

    @Override
    public String getEntityType() {
        return Blog.POST_TYPE;
    }

    @Override
    protected String getParentId(JsonObject jsonObject) {
        final JsonObject blogRef = jsonObject.getJsonObject("blog");
        return blogRef.getString("$id");
    }


    @Override
    protected String getCollectionName() { return COLLECTION; }

    protected String getParentColumn() {
        return "blog.$id";
    }

}
