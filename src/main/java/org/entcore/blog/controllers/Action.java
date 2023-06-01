package org.entcore.blog.controllers;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Action {
    HTML2JSON("html2json"),
    JSON2HTML("json2html");

    private final String code;

    Action(final String code) {
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }
}
