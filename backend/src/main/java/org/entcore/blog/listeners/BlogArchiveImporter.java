package org.entcore.blog.listeners;

import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.blog.Blog;
import org.entcore.broker.api.dto.archive.ImportResourcesRequestDTO;
import org.entcore.broker.api.dto.archive.ImportResourcesResponseDTO;
import org.entcore.common.archive.ArchiveConstants;
import org.entcore.common.archive.ArchiveFolder;
import org.entcore.common.explorer.IExplorerPluginClient;
import org.entcore.common.folders.impl.DocumentHelper;
import org.entcore.common.explorer.to.ExplorerReindexResourcesRequest;
import org.entcore.common.service.impl.AbstractRepositoryEvents;
import org.entcore.common.service.impl.MongoDbRepositoryEvents;
import org.entcore.common.utils.FutureUtils;
import org.entcore.common.utils.ResourceUtils;
import org.entcore.common.utils.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * {@code importResources} reads back the exact folder tree produced by {@link BlogArchiveExporter}
 * This is the same folder tree produces/expects by v1. See {@link ArchiveConstants}):
 * <pre>
 * Blog/
 *   post_My post_abc123          (resource file, read as a filename in the request)
 *   Documents/
 *     image_def456.png           (attachment: name_fileId.ext)
 * </pre>
 * and delegates the actual Mongo writes to the unmodified, pure parts of
 * {@code MongoDbRepositoryEvents}/{@code AbstractRepositoryEvents} - never the disk-coupled
 * {@code readAllDocumentsFromDir}/{@code FolderImporter} v1 uses.
 */
public class BlogArchiveImporter {

  private static final Logger log = LoggerFactory.getLogger(BlogArchiveImporter.class);
  /** Same fallback {@code AbstractRepositoryEvents.getDuplicateSuffix} itself uses when portal's i18n lookup fails or has no value. */
  private static final String DEFAULT_DUPLICATE_SUFFIX = " — Duplicate";
  /** Same collection {@code FolderImporter.importFlatFiles}/{@code BlogArchiveExporter} use for attachments' own metadata record. */
  private static final String DOCUMENTS_COLLECTION = "documents";
  private static final String DOCUMENTS_APPLICATION = "media-library";
  public static final int DEFAULT_IMPORT_CONCURRENCY = 500;
  private static final Pattern UUID_PATTERN = Pattern.compile(StringUtils.UUID_REGEX);
  /** Same values as {@code ExplorerRepositoryEvents}'s own retry, for the same reindex call. */
  private static final int REINDEX_RETRY_TIMES = 5;
  private static final int REINDEX_RETRY_DELAY = 1000;

  private final ArchiveFolder folder;
  private final int importConcurrency;
  private final Map<String, IExplorerPluginClient> pluginClientPerCollection;
  private final Future<String> duplicateSuffix;

  public BlogArchiveImporter(ArchiveFolder folder, int importConcurrency,
      Map<String, IExplorerPluginClient> pluginClientPerCollection, Vertx vertx) {
    this.folder = folder;
    this.importConcurrency = importConcurrency;
    this.pluginClientPerCollection = pluginClientPerCollection;
    this.duplicateSuffix = resolveDuplicateSuffix(vertx);
  }

  /**
   * Resolves the title suffix for a duplicated resource, the same i18n lookup
   * {@code AbstractRepositoryEvents.getDuplicateSuffix(locale)} does: ask "portal" for its
   * {@code "duplicate.suffix"} label, falling back to {@link #DEFAULT_DUPLICATE_SUFFIX} if
   * portal doesn't answer or has no value for it.
   */
  private static Future<String> resolveDuplicateSuffix(Vertx vertx) {
    final Promise<String> promise = Promise.promise();
    final JsonObject request = new JsonObject().put("action", "getI18n").put("label", "duplicate.suffix");
    vertx.eventBus().request("portal", request, ar -> {
      final String label = ar.succeeded() ? ((JsonObject) ar.result().body()).getString("label") : null;
      promise.complete(label == null ? DEFAULT_DUPLICATE_SUFFIX : label);
    });
    return promise.future();
  }

  /**
   * For one NATS batch of {@code request.getResourceIds()} (filenames under the job prefix), in
   * order:
   * <ul>
   *   <li>resolve the real app folder ({@link #resolveAppFolder})</li>
   *   <li>index every attachment already uploaded under {@code Documents/} ({@link #buildDocumentsIndex})</li>
   *   <li>read/remap {@code importConcurrency} resources at a time ({@link #readAndRemapAll})</li>
   *   <li>create every remapped attachment's own {@code documents} record ({@link #importAttachmentDocuments})</li>
   *   <li>write the resources to Mongo, blogs then posts ({@link #importByCollection})</li>
   * </ul>
   */
  public Future<ImportResourcesResponseDTO> importResources(ImportResourcesRequestDTO request) {
    if (request == null || !request.isValid()) {
      return Future.failedFuture("request.parameters.invalid");
    }
    final String sourcePrefix = request.getSourcePrefix();
    final String targetUserId = request.getTargetUserId();
    return resolveAppFolder(sourcePrefix).compose(folder -> {
      final String appPrefix = sourcePrefix + "/" + folder;
      return buildDocumentsIndex(appPrefix)
          .compose(documentsIndex -> readAndRemapAll(appPrefix, documentsIndex, request.getResourceIds(), targetUserId))
          .compose(resources -> importAttachmentDocuments(resources).map(v -> resources))
          .compose(resources -> importByCollection(resources, targetUserId, request.getTargetUserLogin(), request.getTargetUserDisplayName()));
    });
  }

  /**
   * Resolves the real top-level folder for this app under {@code sourcePrefix}, by reading
   * the Manifest.json rather than assuming it is {@link BlogArchiveExporter#APP_FOLDER}:
   * <ul>
   *   <li>go through the manifest's top-level keys (one per app, e.g. {@code "org.entcore.blog"})</li>
   *   <li>strip each down to its technical app name - the part after the last {@code "."}, with
   *       any {@code "-"} removed</li>
   *   <li>the one matching {@link BlogArchiveExporter#APP_FOLDER}: return its {@code "folder"} field</li>
   *   <li>none matched, or the manifest is missing/unreadable: fall back to
   *       {@link BlogArchiveExporter#APP_FOLDER} itself</li>
   * </ul>
   */
  private Future<String> resolveAppFolder(String sourcePrefix) {
    return folder.readFile(sourcePrefix + "/" + ArchiveConstants.MANIFEST_NAME)
        .map(buf -> {
          final JsonObject manifest = buf.toJsonObject();
          for (String key : manifest.fieldNames()) {
            final int dot = key.lastIndexOf('.');
            final String appName = (dot >= 0 ? key.substring(dot + 1) : key).replace("-", "");
            if (BlogArchiveExporter.APP_FOLDER.equals(appName)) {
              return manifest.getJsonObject(key).getString("folder", BlogArchiveExporter.APP_FOLDER);
            }
          }
          return BlogArchiveExporter.APP_FOLDER;
        })
        .recover(err -> Future.succeededFuture(BlogArchiveExporter.APP_FOLDER));
  }

  /**
   * Builds an index of {@code fileId -> its S3 key under Documents/}, read once per NATS batch
   * instead of once per resource:
   * <ul>
   *   <li>list every key under {@code appPrefix + "/" + ArchiveConstants.DOCUMENTS_FOLDER}</li>
   *   <li>for each, extract the UUID {@link BlogArchiveExporter#exportAttachment} wrote it
   *       under - the exact {@code <name>_<fileId><ext>} pattern, parsed back with
   *       {@code StringUtils.UUID_REGEX}</li>
   *   <li>map that {@code fileId} to the key it was found at</li>
   * </ul>
   * Example: {@code Documents/image_def456.png} indexes {@code "def456" -> "<appPrefix>/Documents/image_def456.png"}.
   */
  private Future<Map<String, String>> buildDocumentsIndex(String appPrefix) {
    return folder.listKeys(appPrefix + "/" + ArchiveConstants.DOCUMENTS_FOLDER + "/").map(keys -> {
      final Map<String, String> index = new HashMap<>();
      for (String key : keys) {
        final String basename = key.substring(key.lastIndexOf('/') + 1);
        final Matcher m = UUID_PATTERN.matcher(basename);
        if (m.find()) {
          index.put(m.group(), key);
        }
      }
      return index;
    });
  }

  /**
   * Reads/remaps {@code importConcurrency} resources at a time ({@link FutureUtils#inBatches}) -
   * see {@link BlogArchiveExporter#exportResources} for why.
   * <p>
   * Example: with {@code importConcurrency = 2} and filenames {@code [a, b, c, d, e]}, reads/remaps:
   * <ul>
   *   <li>{@code [a, b]} concurrently</li>
   *   <li>then {@code [c, d]}</li>
   *   <li>then {@code [e]}</li>
   * </ul>
   * never more than 2 at once.
   */
  private Future<List<ReadResource>> readAndRemapAll(String appPrefix, Map<String, String> documentsIndex, List<String> filenames,
      String targetUserId) {
    return FutureUtils.inBatches(filenames, importConcurrency, filename ->
        readAndRemapOne(appPrefix, documentsIndex, filename, targetUserId));
  }

  /**
   * For one resource file, in order:
   * <ul>
   *   <li>read it from {@code appPrefix + "/" + filename}</li>
   *   <li>collect every attachment id referenced in its content ({@code ResourceUtils.extractIds})</li>
   *   <li>for each one found in {@code documentsIndex}, copy it forward under a brand-new id
   *       ({@link #remapAttachment}) - one not found there is left as-is (a dangling reference,
   *       e.g. an attachment that was never exported)</li>
   *   <li>substitute every old attachment id for its new one in the resource's content
   *       ({@code AbstractRepositoryEvents.applyIdsChange})</li>
   * </ul>
   */
  private Future<ReadResource> readAndRemapOne(String appPrefix, Map<String, String> documentsIndex, String filename,
      String targetUserId) {
    return folder.readFile(appPrefix + "/" + filename).map(buf -> buf.toJsonObject()).compose(resource -> {
      final Map<String, String> fileIdMap = new HashMap<>();
      final List<JsonObject> newDocuments = new ArrayList<>();
      Future<Void> chain = Future.succeededFuture();
      for (String fileId : ResourceUtils.extractIds(resource.encode())) {
        final String sourceKey = documentsIndex.get(fileId);
        if (sourceKey == null) {
          continue;
        }
        chain = chain.compose(v -> remapAttachment(sourceKey, fileId, targetUserId)
            .map(newDocument -> { fileIdMap.put(fileId, DocumentHelper.getId(newDocument)); newDocuments.add(newDocument); return null; }));
      }
      return chain.map(v -> {
        if (!fileIdMap.isEmpty()) {
          AbstractRepositoryEvents.applyIdsChange(resource, fileIdMap);
        }
        return new ReadResource(filename, resource, newDocuments);
      });
    });
  }

  /**
   * For one attachment, in order:
   * <ul>
   *   <li>generate a brand-new id - re-importing the same export twice must not collide with
   *       the first import's copies</li>
   *   <li>copy it from its key in the job's {@code Documents/} folder to its real resolved
   *       storage key ({@link ArchiveFolder#resolveStorageKey})</li>
   *   <li>build its {@code documents} collection record ({@code DocumentHelper.initFile}, same
   *       shape {@code FolderImporter.importFlatFiles} builds for v1), recovering its original
   *       name from {@code sourceKey}'s basename (the inverse of
   *       {@link BlogArchiveExporter#exportAttachment}'s {@code <name>_<fileId><ext>} pattern)</li>
   * </ul>
   * {@link #readAndRemapOne} records {@code oldFileId -> newFileId} from the result, to
   * substitute into the resource's content, and queues the record for
   * {@link #importAttachmentDocuments}.
   */
  private Future<JsonObject> remapAttachment(String sourceKey, String oldFileId, String targetUserId) {
    final String newFileId = UUID.randomUUID().toString();
    final String destKey = folder.resolveStorageKey(newFileId);
    return folder.copyFile(sourceKey, destKey).map(v -> {
      final String basename = sourceKey.substring(sourceKey.lastIndexOf('/') + 1);
      final String name = basename.replace("_" + oldFileId, "");
      final JsonObject document = DocumentHelper.initFile(null, targetUserId, null, name, DOCUMENTS_APPLICATION);
      DocumentHelper.setId(document, newFileId);
      DocumentHelper.setFileId(document, newFileId);
      DocumentHelper.setThumbnails(document, new JsonObject());
      return document;
    });
  }

  /**
   * Creates the {@code documents} collection record for every attachment {@link #remapAttachment}
   * copied forward in this batch - v1's equivalent ({@code FolderImporter.importFlatFiles}) does
   * this too, via the very same {@code MongoDbRepositoryEvents.importDocuments}
   * One batched write for the whole NATS batch, same pattern as {@link #importOne} -
   * {@code hintUpdateDuplicateName=false}: each record already has a brand-new id, so
   * {@code importDocuments} never finds a collision to rename.
   */
  private Future<Void> importAttachmentDocuments(List<ReadResource> resources) {
    final List<JsonObject> documents = new ArrayList<>();
    for (ReadResource r : resources) {
      documents.addAll(r.newDocuments);
    }
    if (documents.isEmpty()) {
      return Future.succeededFuture();
    }
    final Promise<Void> promise = Promise.promise();
    MongoDbRepositoryEvents.importDocuments(DOCUMENTS_COLLECTION, documents, "", false, rapport -> {
      final int errors = Integer.parseInt(rapport.getJsonObject("rapport").getString("errorsNumber"));
      if (errors > 0) {
        log.error("Failed to create " + errors + " attachment document(s) out of " + documents.size());
      }
      promise.complete();
    });
    return promise.future();
  }

  /**
   * For the whole batch's already read/remapped resources, in order:
   * <ul>
   *   <li>reset each one for import into {@code targetUserId}'s account ({@link #sanitizeForImport})</li>
   *   <li>split them into blogs and posts - a post is the one with a {@code "blog"} field,
   *       same test {@link BlogArchiveExporter#exportOne} uses to tell them apart</li>
   *   <li>import blogs first ({@link #importOne})</li>
   *   <li>substitute each post's {@code "blog"} reference for its new id, from blogs' own
   *       {@code idsMap} ({@code AbstractRepositoryEvents.applyIdsChange}) - posts are imported
   *       after, so they must point at the blog's new id, not its original one</li>
   *   <li>import posts ({@link #importOne})</li>
   *   <li>build the response from both results ({@link #buildResponse})</li>
   * </ul>
   */
  private Future<ImportResourcesResponseDTO> importByCollection(List<ReadResource> resources, String targetUserId,
      String targetUserLogin, String targetUserDisplayName) {
    final Map<String, String> filenameByOriginalId = new HashMap<>();
    final List<JsonObject> blogs = new ArrayList<>();
    final List<JsonObject> posts = new ArrayList<>();
    for (ReadResource r : resources) {
      filenameByOriginalId.put(r.doc.getString("_id"), r.filename);
      sanitizeForImport(r.doc, targetUserId, targetUserLogin, targetUserDisplayName);
      (r.doc.containsKey("blog") ? posts : blogs).add(r.doc);
    }
    return importOne(Blog.BLOGS_COLLECTION, blogs, true).compose(blogResult -> {
      reindex(Blog.BLOGS_COLLECTION, blogResult.idsMap.values());
      for (JsonObject post : posts) {
        AbstractRepositoryEvents.applyIdsChange(post, blogResult.idsMap);
      }
      return importOne(Blog.POSTS_COLLECTION, posts, false)
          .map(postResult -> {
            reindex(Blog.POSTS_COLLECTION, postResult.idsMap.values());
            return buildResponse(filenameByOriginalId, blogResult, postResult);
          });
    });
  }

  /**
   * Resets one resource doc for import into {@code targetUserId}'s account, mirroring v1's
   * generic {@code MongoDbRepositoryEvents.sanitiseDocument} plus blog's own
   * {@code BlogRepositoryEvents.transformDocumentBeforeImport} override - v1 runs both on every
   * resource it imports, so v2 does the same work here instead:
   * <ul>
   *   <li>reassign authorship to {@code targetUserId}/{@code targetUserLogin}/
   *       {@code targetUserDisplayName} - never the original exporter's; the latter two are
   *       {@code null} if the orchestrator couldn't resolve them, in which case the author is
   *       left with an id but no display name, same as v1 would with an unresolvable user</li>
   *   <li>reset {@code visibility} to {@code "OWNER"} - a shared/public blog doesn't stay
   *       shared/public on import</li>
   *   <li>drop {@code shared} - stale permissions from the source account mean nothing here</li>
   *   <li>drop {@code slug} - the old public URL slug must not be reused as-is</li>
   *   <li>clear {@code comments} - same "fresh start" as the rest</li>
   *   <li>strip the {@code blog_}/{@code post_} title prefix {@link BlogArchiveExporter#exportOne}
   *       added permanently at export time - reverted here, same as
   *       {@code MongoDbRepositoryEvents.revertExportChanges}</li>
   * </ul>
   */
  private static void sanitizeForImport(JsonObject doc, String targetUserId, String targetUserLogin, String targetUserDisplayName) {
    doc.put("author", new JsonObject()
        .put("userId", targetUserId)
        .put("username", targetUserDisplayName)
        .put("login", targetUserLogin));
    doc.put("visibility", "OWNER");
    doc.remove("shared");
    doc.remove("slug");
    if (doc.getValue("comments") != null) {
      doc.put("comments", new JsonArray());
    }
    final String prefix = doc.containsKey("blog") ? "post_" : "blog_";
    final String title = doc.getString("title");
    if (title != null && title.startsWith(prefix)) {
      doc.put("title", title.substring(prefix.length()));
    }
  }

  /**
   * Notifies the explorer (search/folder tree) of newly-written ids, same side effect v1 gets for
   * free via {@code ExplorerRepositoryEvents.indexResourcesAfterImport} - v2's import bypasses
   * that wrapper (it calls {@code MongoDbRepositoryEvents.importDocuments} directly, once per
   * NATS batch, not through {@code RepositoryEvents.importResources}), so it is called here
   * instead, on the exact ids {@link #importOne}'s {@code idsMap} reports as written (regardless
   * of {@code errors}: an id only ever lands in {@code idsMap} once its document is actually
   * written, independently of how many others in the same batch failed).
   * <p>
   * Fire-and-forget, same timing as v1: the response doesn't wait for reindexing to finish, only
   * for the ids to be known.
   */
  private void reindex(String collection, Collection<String> ids) {
    final IExplorerPluginClient pluginClient = pluginClientPerCollection == null
        ? null : pluginClientPerCollection.get(collection);
    if (pluginClient == null || ids.isEmpty()) {
      return;
    }
    pluginClient.tryReindex(null, new ExplorerReindexResourcesRequest(new HashSet<>(ids)),
            REINDEX_RETRY_TIMES, REINDEX_RETRY_DELAY)
        .onFailure(err -> log.error("Failed to reindex " + ids.size() + " " + collection + " after import", err));
  }

  /**
   * Delegates the actual Mongo writes to {@code MongoDbRepositoryEvents.importDocuments}:
   * <ul>
   *   <li>{@code docs} empty: no-op, no query, no need to even resolve {@link #duplicateSuffix}</li>
   *   <li>otherwise, a duplicate (same resource re-imported) is kept under a new, disambiguated
   *       title - {@link #duplicateSuffix} appended - only when {@code hintUpdateDuplicateName}
   *       is {@code true}</li>
   * </ul>
   * Same heuristic as the generic import path ({@code MongoDbRepositoryEvents}'s own
   * master/dependant comment): rename only the master element (blogs), never its dependants
   * (posts), since a post is already confined to its (now disambiguated) blog.
   */
  private Future<ImportResult> importOne(String collection, List<JsonObject> docs, boolean hintUpdateDuplicateName) {
    if (docs.isEmpty()) {
      return Future.succeededFuture(new ImportResult(0, Collections.emptyMap()));
    }
    return duplicateSuffix.compose(suffix -> {
      final Promise<ImportResult> promise = Promise.promise();
      MongoDbRepositoryEvents.importDocuments(collection, docs, suffix, hintUpdateDuplicateName, rapport -> {
        final JsonObject r = rapport.getJsonObject("rapport");
        final int errors = Integer.parseInt(r.getString("errorsNumber"));
        final Map<String, String> idsMap = new HashMap<>();
        for (Map.Entry<String, Object> e : rapport.getJsonObject("idsMap")) {
          idsMap.put(e.getKey(), (String) e.getValue());
        }
        promise.complete(new ImportResult(errors, idsMap));
      });
      return promise.future();
    });
  }

  /** Merges both collections' results ({@link #classify}) into the batch's final response. */
  private static ImportResourcesResponseDTO buildResponse(Map<String, String> filenameByOriginalId, ImportResult blogResult,
      ImportResult postResult) {
    final List<String> imported = new ArrayList<>();
    final List<String> duplicated = new ArrayList<>();
    final List<String> errors = new ArrayList<>();
    classify(filenameByOriginalId, blogResult, imported, duplicated, errors);
    classify(filenameByOriginalId, postResult, imported, duplicated, errors);
    return new ImportResourcesResponseDTO(imported, duplicated, errors);
  }

  /**
   * Classifies one collection's {@code ImportResult} into the response's three buckets,
   * translating {@code idsMap}'s keys (the resource's real Mongo id) back to the per-job
   * filename the orchestrator actually tracks:
   * <ul>
   *   <li>{@code result.errors > 0}: {@code importDocuments} only reports a failure count, not
   *       which ids failed (bulk insert "n" counter) - conservatively report the whole batch as
   *       errored rather than guess</li>
   *   <li>otherwise, for each {@code idsMap} entry: unchanged id ({@code key.equals(value)}) is
   *       imported as-is; a changed one is the duplicate-resolution id, so it's duplicated</li>
   * </ul>
   */
  private static void classify(Map<String, String> filenameByOriginalId, ImportResult result,
      List<String> imported, List<String> duplicated, List<String> errors) {
    if (result.errors > 0) {
      for (String originalId : result.idsMap.keySet()) {
        errors.add(filenameByOriginalId.get(originalId));
      }
      return;
    }
    for (Map.Entry<String, String> e : result.idsMap.entrySet()) {
      final String filename = filenameByOriginalId.get(e.getKey());
      (e.getKey().equals(e.getValue()) ? imported : duplicated).add(filename);
    }
  }

  private static final class ReadResource {
    final String filename;
    final JsonObject doc;
    final List<JsonObject> newDocuments;

    ReadResource(String filename, JsonObject doc, List<JsonObject> newDocuments) {
      this.filename = filename;
      this.doc = doc;
      this.newDocuments = newDocuments;
    }
  }

  private static final class ImportResult {
    final int errors;
    final Map<String, String> idsMap;

    ImportResult(int errors, Map<String, String> idsMap) {
      this.errors = errors;
      this.idsMap = idsMap;
    }
  }
}
