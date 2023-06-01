package org.entcore.blog.controllers;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.vertx.core.json.JsonObject;

public class HtmlTransformationRequest {
    private final Action action;
    private final JsonObject json;
    private final String document;

    @JsonCreator
    public HtmlTransformationRequest(@JsonProperty("action") final Action action,
                                     @JsonProperty("json") final JsonObject json,
                                     @JsonProperty("document") final String document) {
        this.action = action;
        this.json = json;
        this.document = document;
    }
    public HtmlTransformationRequest(final JsonObject json) {
        this(Action.JSON2HTML, json, null);
    }
    public HtmlTransformationRequest(final String document) {
        this(Action.HTML2JSON, null, document);
    }

    public Action getAction() {
        return action;
    }

    public JsonObject getJson() {
        return json;
    }

    public String getDocument() {
        return document;
    }
}
