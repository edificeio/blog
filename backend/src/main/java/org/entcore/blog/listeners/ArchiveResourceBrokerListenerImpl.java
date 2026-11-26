package org.entcore.blog.listeners;

import io.vertx.core.Future;
import io.vertx.core.Vertx;
import org.entcore.broker.api.dto.archive.ExportResourcesRequestDTO;
import org.entcore.broker.api.dto.archive.ExportResourcesResponseDTO;
import org.entcore.broker.api.dto.archive.ImportResourcesRequestDTO;
import org.entcore.broker.api.dto.archive.ImportResourcesResponseDTO;
import org.entcore.broker.api.dto.archive.ListResourceIdsRequestDTO;
import org.entcore.broker.api.dto.archive.ListResourceIdsResponseDTO;
import org.entcore.broker.api.dto.archive.ListSubresourcesRequestDTO;
import org.entcore.broker.proxy.ArchiveResourceBrokerListener;
import org.entcore.common.archive.ArchiveFolder;
import org.entcore.common.explorer.IExplorerPluginClient;

import java.util.Map;

public class ArchiveResourceBrokerListenerImpl implements ArchiveResourceBrokerListener {

  private final BlogArchiveExporter exporter;
  private final BlogArchiveImporter importer;

  public ArchiveResourceBrokerListenerImpl(ArchiveFolder folder, int exportConcurrency, int importConcurrency, Vertx vertx,
      Map<String, IExplorerPluginClient> pluginClientPerCollection) {
    this.exporter = new BlogArchiveExporter(folder, exportConcurrency, vertx);
    this.importer = new BlogArchiveImporter(folder, importConcurrency, pluginClientPerCollection, vertx);
  }

  @Override
  public Future<ListResourceIdsResponseDTO> listResourceIds(ListResourceIdsRequestDTO request) {
    return exporter.listResourceIds(request);
  }

  @Override
  public Future<ListResourceIdsResponseDTO> listSubresources(ListSubresourcesRequestDTO request) {
    return exporter.listSubresources(request);
  }

  @Override
  public Future<ExportResourcesResponseDTO> exportResources(ExportResourcesRequestDTO request) {
    return exporter.exportResources(request);
  }

  @Override
  public Future<ImportResourcesResponseDTO> importResources(ImportResourcesRequestDTO request) {
    return importer.importResources(request);
  }
}
