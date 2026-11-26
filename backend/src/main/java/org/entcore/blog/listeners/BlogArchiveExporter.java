package org.entcore.blog.listeners;

import com.mongodb.client.model.Filters;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.bson.conversions.Bson;
import org.entcore.blog.Blog;
import org.entcore.broker.api.dto.archive.ExportResourcesRequestDTO;
import org.entcore.broker.api.dto.archive.ExportResourcesResponseDTO;
import org.entcore.broker.api.dto.archive.ListResourceIdsRequestDTO;
import org.entcore.broker.api.dto.archive.ListResourceIdsResponseDTO;
import org.entcore.broker.api.dto.archive.ListSubresourcesRequestDTO;
import org.entcore.broker.api.dto.archive.ResourceRefDTO;
import org.entcore.common.archive.ArchiveConstants;
import org.entcore.common.archive.ArchiveFolder;
import org.entcore.common.archive.IdsPage;
import org.entcore.common.folders.impl.DocumentHelper;
import org.entcore.common.utils.ResourceUtils;
import org.entcore.common.utils.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * {@code listResourceIds}/{@code exportResources} for blog
 * Writing directly to Storage instead of the local temp directory {@code BlogRepositoryEvents.exportResources}
 * <p>
 * The on-disk layout matches v1 exactly (see {@link ArchiveConstants}):
 * <pre>
 * Blog/
 *   post_My post_abc123          (resource file: collection prefix_title_resourceId)
 *   Documents/
 *     image_def456.png           (attachment: name_fileId.ext)
 * </pre>
 * So a v2 export stays importable by v1's
 * {@code readAllDocumentsFromDir}/{@code FolderImporter.importFlatFiles}.
 * <p>
 * The app folder itself is named after the app's i18n display name (e.g. {@code "Blog"}), same
 * as v1 export
 */
public class BlogArchiveExporter {

  private static final int PAGE_SIZE = 5000;
  public static final int DEFAULT_EXPORT_CONCURRENCY = 500;
  private static final String DOCUMENTS_COLLECTION = "documents";
  static final String APP_FOLDER = "blog";

  private final MongoDb mongo = MongoDb.getInstance();
  private final ArchiveFolder folder;
  private final int exportConcurrency;
  private final Future<String> appFolder;

  public BlogArchiveExporter(ArchiveFolder folder, int exportConcurrency, Vertx vertx) {
    this.folder = folder;
    this.exportConcurrency = exportConcurrency;
    this.appFolder = resolveAppFolder(vertx);
  }

  /**
   * Resolves the app folder's real display name, the same way
   * {@code AbstractRepositoryEvents.createExportDirectory} does:
   * <ul>
   *   <li>ask the "portal" module for its i18n bundle</li>
   *   <li>read the entry for "blog"</li>
   *   <li>strip accents</li>
   * </ul>
   * Falls back to {@link #APP_FOLDER} itself if "portal" doesn't answer, or has no such entry.
   */
  private static Future<String> resolveAppFolder(Vertx vertx) {
    final Promise<String> promise = Promise.promise();
    vertx.eventBus().request("portal", new JsonObject().put("action", "getI18n"), ar -> {
      final String name = ar.succeeded() ? ((JsonObject) ar.result().body()).getString(APP_FOLDER) : null;
      promise.complete(name == null ? APP_FOLDER : StringUtils.stripAccents(name));
    });
    return promise.future();
  }

  /**
   * Lists this user's blogs, {@link #PAGE_SIZE} at a time - blog's only top-level resource kind;
   * see {@link #listSubresources} for posts.
   * <p>
   * Filters:
   * <ul>
   *   <li>userId - required: blogs owned by this user, or shared with them</li>
   *   <li>groupIds - optional: also includes blogs shared with one of these groups</li>
   *   <li>from/to - optional: only blogs modified in this date range</li>
   * </ul>
   */
  public Future<ListResourceIdsResponseDTO> listResourceIds(ListResourceIdsRequestDTO request) {
    if (request == null || !request.isValid()) {
      return Future.failedFuture("request.parameters.invalid");
    }
    final int offset = parseOffset(request.getCursor());
    final Bson ownerFilter = ownerFilter(request.getUserId(), request.getGroupIds(), request.getFrom(), request.getTo());
    return findIdsBatch(Blog.BLOGS_COLLECTION, ownerFilter, offset).map(page ->
        new ListResourceIdsResponseDTO(toRefs(page.ids, Blog.BLOG_TYPE),
            page.hasMore ? String.valueOf(offset + page.ids.size()) : null));
  }

  /**
   * Lists blog's only sub-resource kind (posts), directly scoped to {@code request.getParentIds()} 
   * the caller already collected every blog id while paginating {@link #listResourceIds}
   */
  public Future<ListResourceIdsResponseDTO> listSubresources(ListSubresourcesRequestDTO request) {
    if (request == null || !request.isValid()) {
      return Future.failedFuture("request.parameters.invalid");
    }
    final int offset = parseOffset(request.getCursor());
    return findIdsBatch(Blog.POSTS_COLLECTION, Filters.in("blog.$id", request.getParentIds()), offset).map(page ->
        new ListResourceIdsResponseDTO(toRefs(page.ids, Blog.POST_TYPE),
            page.hasMore ? String.valueOf(offset + page.ids.size()) : null));
  }

  /**
   * Exports resources {@code exportConcurrency} at a time, one chunk after another:
   * <ul>
   *   <li>fetch the whole chunk's resources</li>
   *   <li>write each one to S3, concurrently within the chunk</li>
   * </ul>
   * Example: with {@code exportConcurrency = 2} and resources {@code [a, b, c, d, e]}, exports:
   * <ul>
   *   <li>{@code [a, b]}</li>
   *   <li>then {@code [c, d]}</li>
   *   <li>then {@code [e]}</li>
   * </ul>
   */
  public Future<ExportResourcesResponseDTO> exportResources(ExportResourcesRequestDTO request) {
    if (request == null || !request.isValid()) {
      return Future.failedFuture("request.parameters.invalid");
    }
    return appFolder.compose(folderName -> {
      final String appPrefix = request.getPrefix() + "/" + folderName;
      final List<String> processed = new ArrayList<>();
      final List<String> errors = new ArrayList<>();
      final List<ResourceRefDTO> resources = request.getResources();
      Future<Void> chain = Future.succeededFuture();
      for (int i = 0; i < resources.size(); i += exportConcurrency) {
        final List<ResourceRefDTO> chunk = resources.subList(i, Math.min(i + exportConcurrency, resources.size()));
        chain = chain.compose(v -> exportChunk(appPrefix, chunk, processed, errors));
      }
      return chain.map(v -> new ExportResourcesResponseDTO(processed, errors));
    });
  }

  /**
   * For one chunk, in order:
   * <ul>
   *   <li>read this chunk's resources from Mongo by id ({@link #findResourcesByIds})</li>
   *   <li>read their attachments' real names ({@link #findAttachmentNames})</li>
   *   <li>write each resource (and its attachments) to storage, concurrently within the chunk</li>
   * </ul>
   * One resource failing doesn't fail the chunk: it's recorded into {@code errors}
   */
  private Future<Void> exportChunk(String appPrefix, List<ResourceRefDTO> chunk, List<String> processed, List<String> errors) {
    return findResourcesByIds(chunk).compose(resourcesById ->
        findAttachmentNames(resourcesById.values()).compose(namesById -> {
          final List<Future<Void>> exports = new ArrayList<>();
          for (ResourceRefDTO ref : chunk) {
            final String resourceId = ref.getId();
            final JsonObject resource = resourcesById.get(resourceId);
            final Future<Void> exported = resource == null
                ? Future.failedFuture("Resource not found: " + resourceId)
                : exportOne(appPrefix, resourceId, resource, namesById);
            exports.add(exported
                .map(ok -> { processed.add(resourceId); return (Void) null; })
                .recover(err -> { errors.add(resourceId); return Future.succeededFuture(); }));
          }
          return CompositeFuture.all(new ArrayList<>(exports)).mapEmpty();
        }));
  }

  /**
   * For {@code resource}, already fetched from Mongo by {@link #findResourcesByIds}, in order:
   * <ul>
   *   <li>clear its {@code comments} - same as {@code BlogRepositoryEvents.exportResources}:
   *       comments never leave the source account</li>
   *   <li>mutate its title permanently - {@code blog.put("title", prefix + title)}, same as
   *       {@code BlogRepositoryEvents.exportResources}</li>
   *   <li>sanitize that title into a filename with {@code StringUtils.replaceForbiddenCharacters}
   *       (replaces characters a filesystem can't have in a name (\ / * " < > : ? |) with "_")</li>
   *   <li>write the resource to S3 under that filename</li>
   *   <li>copy each attachment referenced in its content</li>
   * </ul>
   */
  private Future<Void> exportOne(String appPrefix, String resourceId, JsonObject resource, Map<String, String> namesById) {
    DocumentHelper.clearComments(resource);
    final String prefix = resource.containsKey("blog") ? "post_" : "blog_";
    final String rawTitle = resource.getString("title", resource.getString("name", "untitled"));
    final String prefixedTitle = prefix + rawTitle;
    resource.put("title", prefixedTitle);
    final String filename = StringUtils.replaceForbiddenCharacters(prefixedTitle) + "_" + resourceId;

    final Buffer buffer = resource.toBuffer();
    Future<Void> chain = folder.writeFile(appPrefix + "/" + filename, buffer, "application/json").mapEmpty();
    for (String fileId : ResourceUtils.extractIds(resource.encode())) {
      chain = chain.compose(v -> exportAttachment(appPrefix, fileId, namesById.get(fileId)));
    }
    return chain;
  }

  /**
   * For attachment {@code fileId}, given its real name (already fetched by
   * {@link #findAttachmentNames}, {@code null} if not found), in order:
   * <ul>
   *   <li>build its destination name, {@code <sanitized name>_<fileId><ext>} (sanitized with
   *       {@code StringUtils.replaceForbiddenCharacters}, see {@link #exportOne}; falls back to
   *       {@code fileId} itself as the name if it wasn't found) - the exact pattern
   *       {@code FolderImporter.importFlatFiles} parses back with {@code StringUtils.UUID_REGEX}</li>
   *   <li>resolve where it really lives today ({@link ArchiveFolder#resolveStorageKey})</li>
   *   <li>copy it into the job's {@code Documents/} folder under that destination name</li>
   * </ul>
   */
  private Future<Void> exportAttachment(String appPrefix, String fileId, String name) {
    final String safeName = name == null ? fileId : name;
    final int dot = safeName.lastIndexOf('.');
    final String attachmentName = StringUtils.replaceForbiddenCharacters(dot > -1
        ? safeName.substring(0, dot) + "_" + fileId + safeName.substring(dot)
        : safeName + "_" + fileId);
    final String sourceKey = folder.resolveStorageKey(fileId);
    return folder.copyFile(sourceKey, appPrefix + "/" + ArchiveConstants.DOCUMENTS_FOLDER + "/" + attachmentName);
  }

  /**
   * In order:
   * <ul>
   *   <li>collect every attachment id referenced across all of {@code resources}'s content</li>
   *   <li>none found: return an empty map directly, no query</li>
   *   <li>otherwise, fetch them all with one query against {@code documents} - the
   *       same batching {@code AbstractRepositoryEvents.exportDocumentsDependancies}</li>
   *   <li>build the {@code fileId -> name} map from the results</li>
   * </ul>
   */
  private Future<Map<String, String>> findAttachmentNames(Collection<JsonObject> resources) {
    final Set<String> fileIds = new HashSet<>();
    for (JsonObject resource : resources) {
      fileIds.addAll(ResourceUtils.extractIds(resource.encode()));
    }
    if (fileIds.isEmpty()) {
      return Future.succeededFuture(Collections.emptyMap());
    }
    final Promise<Map<String, String>> promise = Promise.promise();
    final Bson filter = Filters.in("_id", fileIds);
    mongo.find(DOCUMENTS_COLLECTION, MongoQueryBuilder.build(filter), new JsonObject(), new JsonObject(),
        0, fileIds.size(), fileIds.size(), res -> {
          if ("ok".equals(res.body().getString("status"))) {
            final Map<String, String> names = new HashMap<>();
            res.body().getJsonArray("results").forEach(o -> {
              final JsonObject doc = (JsonObject) o;
              names.put(doc.getString("_id"), doc.getString("name"));
            });
            promise.complete(names);
          } else {
            promise.fail(res.body().getString("message"));
          }
        });
    return promise.future();
  }

  /**
   * Splits {@code refs} by their type then resolves them with exactly two queries:
   * <ul>
   *   <li>fetch as blogs: {@link Blog#BLOG_TYPE} ids, plus every untyped id - tried as a blog
   *       first</li>
   *   <li>fetch as posts: {@link Blog#POST_TYPE} ids, plus whichever untyped id wasn't found as
   *       a blog</li>
   *   <li>merge both results into one map</li>
   * </ul>
   */
  private Future<Map<String, JsonObject>> findResourcesByIds(List<ResourceRefDTO> refs) {
    final List<String> blogIds = new ArrayList<>();
    final List<String> postIds = new ArrayList<>();
    final List<String> untypedIds = new ArrayList<>();
    for (ResourceRefDTO ref : refs) {
      if (Blog.BLOG_TYPE.equals(ref.getType())) {
        blogIds.add(ref.getId());
      } else if (Blog.POST_TYPE.equals(ref.getType())) {
        postIds.add(ref.getId());
      } else {
        untypedIds.add(ref.getId());
      }
    }
    final List<String> blogsToTry = new ArrayList<>(blogIds);
    blogsToTry.addAll(untypedIds);
    return findManyByIds(Blog.BLOGS_COLLECTION, blogsToTry).compose(blogsById -> {
      final List<String> postsToTry = new ArrayList<>(postIds);
      for (String untypedId : untypedIds) {
        if (!blogsById.containsKey(untypedId)) {
          postsToTry.add(untypedId);
        }
      }
      return findManyByIds(Blog.POSTS_COLLECTION, postsToTry).map(postsById -> {
        final Map<String, JsonObject> all = new HashMap<>(blogsById);
        all.putAll(postsById);
        return all;
      });
    });
  }

  private Future<Map<String, JsonObject>> findManyByIds(String collection, List<String> ids) {
    if (ids.isEmpty()) {
      return Future.succeededFuture(Collections.emptyMap());
    }
    final Promise<Map<String, JsonObject>> promise = Promise.promise();
    final Bson filter = Filters.in("_id", ids);
    mongo.find(collection, MongoQueryBuilder.build(filter), new JsonObject(), new JsonObject(),
        0, ids.size(), ids.size(), res -> {
          if ("ok".equals(res.body().getString("status"))) {
            final Map<String, JsonObject> byId = new HashMap<>();
            res.body().getJsonArray("results").forEach(o -> {
              final JsonObject doc = (JsonObject) o;
              byId.put(doc.getString("_id"), doc);
            });
            promise.complete(byId);
          } else {
            promise.fail(res.body().getString("message"));
          }
        });
    return promise.future();
  }

  /** Fetches up to {@link #PAGE_SIZE} ids from collection, matching filter, starting at offset. */
  private Future<IdsPage> findIdsBatch(String collection, Bson filter, int offset) {
    final Promise<IdsPage> promise = Promise.promise();
    mongo.find(collection, MongoQueryBuilder.build(filter), new JsonObject().put("_id", 1), new JsonObject().put("_id", 1),
        offset, PAGE_SIZE, PAGE_SIZE, res -> {
          if ("ok".equals(res.body().getString("status"))) {
            final List<String> ids = idsFromResults(res.body().getJsonArray("results"));
            promise.complete(new IdsPage(ids, ids.size() == PAGE_SIZE));
          } else {
            promise.fail(res.body().getString("message"));
          }
        });
    return promise.future();
  }

  private static List<String> idsFromResults(JsonArray results) {
    final List<String> ids = new ArrayList<>();
    if (results != null) {
      for (int i = 0; i < results.size(); i++) {
        ids.add(results.getJsonObject(i).getString("_id"));
      }
    }
    return ids;
  }

  private static int parseOffset(String cursor) {
    return cursor == null ? 0 : Integer.parseInt(cursor);
  }

  /**
   * Matches owned blogs and blogs shared with by userId or by groupIds
   * same as {@code BlogRepositoryEvents.exportResources}'s
   * {@code exportSharedResources=true} default.
   */
  private static Bson ownerFilter(String userId, List<String> groupIds, Date from, Date to) {
    final Bson shared = groupIds.isEmpty()
        ? Filters.eq("shared.userId", userId)
        : Filters.or(Filters.eq("shared.userId", userId), Filters.in("shared.groupId", groupIds));
    Bson filter = Filters.or(Filters.eq("author.userId", userId), shared);
    if (from != null) {
      filter = Filters.and(filter, Filters.gte("modified", from));
    }
    if (to != null) {
      filter = Filters.and(filter, Filters.lte("modified", to));
    }
    return filter;
  }

  /** Tags each id with its resource kind, known upfront here - see {@link #findResourcesByIds}. */
  private static List<ResourceRefDTO> toRefs(List<String> ids, String type) {
    final List<ResourceRefDTO> refs = new ArrayList<>(ids.size());
    for (String id : ids) {
      refs.add(new ResourceRefDTO(id, type));
    }
    return refs;
  }

}
