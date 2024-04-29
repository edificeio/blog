/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [op[0] & 2, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	var __importDefault = (this && this.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.blogModel = void 0;
	var entcore_1 = __webpack_require__(1);
	var axios_1 = __importDefault(__webpack_require__(46));
	var slugify = function (string) {
	    if (!string)
	        return "";
	    var a = "àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;";
	    var b = "aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------";
	    var p = new RegExp(a.split("").join("|"), "g");
	    return string
	        .toString()
	        .toLowerCase()
	        .replace(/\s+/g, "-") // Replace spaces with -
	        .replace(p, function (c) { return b.charAt(a.indexOf(c)); }) // Replace special characters
	        .replace(/&/g, "-and-") // Replace & with ‘and’
	        .replace(/[^\w\-]+/g, "") // Remove all non-word characters
	        .replace(/\-\-+/g, "-") // Replace multiple - with single -
	        .replace(/^-+/, "") // Trim - from start of text
	        .replace(/-+$/, ""); // Trim - from end of text
	};
	exports.blogModel = {
	    Comment: function (data) {
	        if (data && data.created) {
	            this.created = entcore_1.moment(this.created.$date);
	            this.editing = false;
	            if (data.modified) {
	                this.modified = entcore_1.moment(this.modified.$date);
	            }
	        }
	    },
	    Post: function (data) {
	        var that = this;
	        if (data) {
	            this.created = data.created ? entcore_1.moment(data.created.$date) : entcore_1.moment();
	            this.modified = data.modified ? entcore_1.moment(data.modified.$date) : entcore_1.moment();
	        }
	        this.collection(entcore_1.Behaviours.applicationsBehaviours.blog.model.Comment, {
	            sync: "/blog/comments/:blogId/:_id",
	            remove: function (comment) {
	                return __awaiter(this, void 0, void 0, function () {
	                    return __generator(this, function (_a) {
	                        switch (_a.label) {
	                            case 0: return [4 /*yield*/, axios_1.default.delete("/blog/comment/" + that.blogId + "/" + that._id + "/" + comment.id)];
	                            case 1:
	                                _a.sent();
	                                entcore_1.Collection.prototype.remove.call(this, comment);
	                                return [2 /*return*/];
	                        }
	                    });
	                });
	            },
	        });
	    },
	    Blog: function (data) {
	        var _this = this;
	        var that = this;
	        var tryUpdateSlug = function () {
	            if (_this.enablePublic && !_this.slug) {
	                _this.safeSlug = _this.title;
	            }
	            else if (!_this.enablePublic) {
	                _this.slug = null;
	            }
	        };
	        Object.defineProperty(this, "dynTitle", {
	            get: function () {
	                return this.title;
	            },
	            set: function (a) {
	                this.title = a;
	                tryUpdateSlug();
	            },
	        });
	        Object.defineProperty(this, "enablePublic", {
	            get: function () {
	                return this.visibility == "PUBLIC";
	            },
	            set: function (a) {
	                this.visibility = a ? "PUBLIC" : "OWNER";
	                tryUpdateSlug();
	            },
	        });
	        Object.defineProperty(this, "safeSlug", {
	            get: function () {
	                return this.slug;
	            },
	            set: function (a) {
	                this.slug = slugify(a);
	            },
	        });
	        Object.defineProperty(this, "slugDomain", {
	            get: function () {
	                return window.location.origin + "/blog/pub/";
	            },
	        });
	        Object.defineProperty(this, "fullUrl", {
	            get: function () {
	                return "" + this.slugDomain + this.slug;
	            },
	        });
	        if (data && data._id) {
	            this._id = data._id;
	            this.owner = data.author;
	            this.shortenedTitle = data.title || "";
	            if (this.shortenedTitle.length > 40) {
	                this.shortenedTitle = this.shortenedTitle.substr(0, 38) + "...";
	            }
	            if (data.thumbnail) {
	                this.icon = data.thumbnail + "?thumbnail=290x290";
	            }
	            else {
	                this.icon = "/img/illustrations/blog.svg";
	            }
	            this.updateData(data);
	            this.fetchPosts = entcore_1._.map(this.fetchPosts, function (post) {
	                return new entcore_1.Behaviours.applicationsBehaviours.blog.model.Post(post);
	            });
	        }
	        this.collection(entcore_1.Behaviours.applicationsBehaviours.blog.model.Post, {
	            syncPosts: function (cb, paginate, search, filters, publicPost) {
	                if (publicPost === void 0) { publicPost = false; }
	                //for direct resource access (via uri)
	                if (paginate && !this.page) {
	                    paginate = false;
	                }
	                //end direct access
	                if (!paginate) {
	                    this.page = 0;
	                    this.lastPage = false;
	                    this.all = [];
	                }
	                if (this.postsLoading || this.lastPage) {
	                    return;
	                }
	                this.postsLoading = true;
	                this.lastPage = false;
	                if (!search) {
	                    search = "";
	                }
	                var jsonParam = { page: this.page, search: search };
	                if (filters) {
	                    if (!filters.all) {
	                        var filterValues = "";
	                        for (var filter in filters) {
	                            var filterValue = filters[filter];
	                            if (filter !== "all" && filters[filter]) {
	                                filterValues =
	                                    filterValues === ""
	                                        ? filter.toUpperCase()
	                                        : filterValues + "," + filter.toUpperCase();
	                            }
	                        }
	                        if (filterValues !== "") {
	                            jsonParam["states"] = filterValues;
	                        }
	                    }
	                    else {
	                        jsonParam["states"] = "";
	                    }
	                }
	                var postUrl = publicPost
	                    ? "/blog/pub/posts/"
	                    : "/blog/post/list/all/";
	                entcore_1.http()
	                    .get(postUrl + that._id, jsonParam)
	                    .done(function (posts) {
	                    if (posts.length > 0) {
	                        var type = this.model.data["publish-type"];
	                        posts.map(function (item) {
	                            item.blogId = data._id;
	                            item["publish-type"] = type;
	                            item["firstPublishDate"] =
	                                item["firstPublishDate"] || item["modified"];
	                            return item;
	                        });
	                        //check if a post isn't already loaded by notification access
	                        this.all.forEach(function (post) {
	                            posts = entcore_1._.reject(posts, function (p) {
	                                return p._id === post._id;
	                            });
	                        });
	                        this.addRange(posts);
	                        this.page++;
	                    }
	                    else {
	                        this.lastPage = true;
	                    }
	                    this.postsLoading = false;
	                    if (typeof cb === "function")
	                        cb();
	                }.bind(this))
	                    .e401(function () { })
	                    .e404(function () { });
	            },
	            syncAllPosts: function (cb, publicPost) {
	                if (publicPost === void 0) { publicPost = false; }
	                if (this.postsLoading) {
	                    return;
	                }
	                this.postsLoading = true;
	                var postUrl = publicPost
	                    ? "/blog/pub/posts/"
	                    : "/blog/post/list/all/";
	                entcore_1.http()
	                    .get(postUrl + that._id)
	                    .done(function (posts) {
	                    posts.map(function (item) {
	                        item.blogId = data._id;
	                        item["publish-type"] = data["publish-type"];
	                        item["firstPublishDate"] =
	                            item["firstPublishDate"] || item["modified"];
	                        return item;
	                    });
	                    this.load(posts);
	                    this.postsLoading = false;
	                    if (typeof cb === "function")
	                        cb();
	                }.bind(this))
	                    .e401(function () { })
	                    .e404(function () { });
	            },
	            syncOnePost: function (cb, id, publicPost) {
	                if (publicPost === void 0) { publicPost = false; }
	                var postUrl = publicPost
	                    ? "/blog/pub/posts/"
	                    : "/blog/post/list/all/";
	                entcore_1.http()
	                    .get(postUrl + that._id, { postId: id })
	                    .done(function (posts) {
	                    if (posts.length > 0) {
	                        var type = this.model.data["publish-type"];
	                        posts.map(function (item) {
	                            item.blogId = data._id;
	                            item["publish-type"] = type;
	                            item["firstPublishDate"] =
	                                item["firstPublishDate"] || item["modified"];
	                            return item;
	                        });
	                        this.addRange(posts);
	                    }
	                    if (typeof cb === "function")
	                        cb();
	                }.bind(this))
	                    .e401(function () { })
	                    .e404(function () { });
	            },
	            addDraft: function (post, callback) {
	                entcore_1.http()
	                    .postJson("/blog/post/" + that._id, post)
	                    .done(function (result) {
	                    post._id = result._id;
	                    this.push(post);
	                    var newPost = this.last();
	                    newPost.blogId = that._id;
	                    if (typeof callback === "function") {
	                        callback(newPost);
	                    }
	                }.bind(this));
	            },
	            remove: function (post) {
	                post.remove();
	                entcore_1.Collection.prototype.remove.call(this, post);
	            },
	            removeColl: function (blog) {
	                entcore_1.Collection.prototype.remove.call(this, blog);
	            },
	            behaviours: "blog",
	        });
	        if (this._id) {
	            this.posts.sync();
	        }
	    },
	    App: function () {
	        this.collection(entcore_1.Behaviours.applicationsBehaviours.blog.model.Blog, {
	            syncPag: function (cb, paginate, search) {
	                var _this = this;
	                if (!paginate) {
	                    this.page = 0;
	                    this.lastPage = false;
	                    this.all = [];
	                }
	                if (this.blogsLoading || this.lastPage) {
	                    return;
	                }
	                this.blogsLoading = true;
	                this.lastPage = false;
	                if (!search) {
	                    search = "";
	                }
	                entcore_1.http()
	                    .get("/blog/list/all", { page: this.page, search: search })
	                    .done(function (blogs) {
	                    if (blogs.length > 0) {
	                        _this.addRange(blogs);
	                        _this.page++;
	                    }
	                    else {
	                        _this.lastPage = true;
	                    }
	                    _this.blogsLoading = false;
	                    if (typeof cb === "function") {
	                        cb();
	                    }
	                });
	            },
	            syncAll: function (cb) {
	                var _this = this;
	                if (this.blogsLoading) {
	                    return;
	                }
	                this.blogsLoading = true;
	                entcore_1.http()
	                    .get("/blog/list/all")
	                    .done(function (blogs) {
	                    _this.load(blogs);
	                    _this.blogsLoading = false;
	                    _this.trigger("sync");
	                    if (typeof cb === "function") {
	                        cb();
	                    }
	                });
	            },
	            remove: function (blog) {
	                blog.remove();
	                entcore_1.Collection.prototype.remove.call(this, blog);
	            },
	            counterPost: function (blogId, cb) {
	                entcore_1.http()
	                    .get("/blog/counter/" + blogId)
	                    .done(function (obj) {
	                    if (typeof cb === "function") {
	                        cb(obj);
	                    }
	                });
	            },
	            behaviours: "blog",
	        });
	    },
	    register: function () {
	        this.Blog.prototype.toJSON = function () {
	            var json = {
	                _id: this._id,
	                title: this.title,
	                thumbnail: this.thumbnail || "",
	                "comment-type": this["comment-type"] || "IMMEDIATE",
	                "publish-type": this["publish-type"] || "RESTRAINT",
	                description: this.description || "",
	                visibility: this.visibility || "OWNER",
	                slug: this.slug,
	            };
	            // add folder if needed
	            var urlSearchParams = new URLSearchParams(window.location.search);
	            if (urlSearchParams.has("folderid")) {
	                json.folder = parseInt(urlSearchParams.get("folderid"));
	            }
	            return json;
	        };
	        this.Blog.prototype.create = function (fn) {
	            entcore_1.http()
	                .postJson("/blog", this)
	                .done(function (newBlog) {
	                this._id = newBlog._id;
	                if (typeof fn === "function") {
	                    fn();
	                }
	            }.bind(this));
	        };
	        this.Blog.prototype.saveModifications = function (fn) {
	            entcore_1.http()
	                .putJson("/blog/" + this._id, this)
	                .done(function () {
	                if (typeof fn === "function") {
	                    fn();
	                }
	            });
	        };
	        this.Blog.prototype.save = function (fn) {
	            if (this._id) {
	                this.saveModifications(fn);
	            }
	            else {
	                this.create(fn);
	            }
	        };
	        this.Post.prototype.open = function (cb) {
	            entcore_1.http()
	                .get("/blog/post/" + this.blogId + "/" + this._id, {
	                state: this.state,
	            })
	                .done(function (data) {
	                this.content = data.content;
	                this.data.content = data.content;
	                this.trigger("change");
	                if (typeof cb === "function")
	                    cb();
	            }.bind(this));
	        };
	        this.Post.prototype.submit = function (callback) {
	            this.state = "SUBMITTED";
	            entcore_1.http()
	                .putJson("/blog/post/submit/" + this.blogId + "/" + this._id)
	                .done(function () {
	                if (typeof callback === "function") {
	                    callback(true);
	                }
	                this.trigger("change");
	            }.bind(this))
	                .error(function () {
	                if (typeof callback === "function") {
	                    callback(null);
	                }
	            });
	        };
	        this.Post.prototype.publish = function (callback, selfPost) {
	            this.state = "PUBLISHED";
	            if (this["publish-type"] === "IMMEDIATE" && selfPost) {
	                entcore_1.http()
	                    .putJson("/blog/post/submit/" + this.blogId + "/" + this._id)
	                    .done(function () {
	                    if (typeof callback === "function") {
	                        callback(true);
	                        this.trigger("change");
	                    }
	                })
	                    .error(function () {
	                    if (typeof callback === "function") {
	                        callback(null);
	                    }
	                });
	                return;
	            }
	            entcore_1.http()
	                .putJson("/blog/post/publish/" + this.blogId + "/" + this._id)
	                .done(function () {
	                if (typeof callback === "function") {
	                    callback(true);
	                    this.trigger("change");
	                }
	            }.bind(this))
	                .e401(function () {
	                this.submit(callback);
	            }.bind(this))
	                .error(function () {
	                if (typeof callback === "function") {
	                    callback(null);
	                    this.trigger("change");
	                }
	            });
	        };
	        this.Post.prototype.create = function (callback, blog, state) {
	            entcore_1.http()
	                .postJson("/blog/post/" + blog._id, {
	                content: this.content,
	                title: this.title,
	            })
	                .done(function (data) {
	                var post = new entcore_1.Behaviours.applicationsBehaviours.blog.model.Post(data);
	                blog.posts.insertAt(0, post);
	                post = blog.posts.first();
	                post.blogId = blog._id;
	                post["publish-type"] = blog["publish-type"];
	                if (state !== "DRAFT") {
	                    post.publish(callback);
	                }
	                else {
	                    if (typeof callback === "function") {
	                        callback(true);
	                    }
	                }
	            }.bind(this))
	                .error(function () {
	                if (typeof callback === "function")
	                    callback(null);
	            });
	        };
	        this.Post.prototype.saveModifications = function (callback) {
	            entcore_1.http()
	                .putJson("/blog/post/" + this.blogId + "/" + this._id, {
	                content: this.content,
	                title: this.title,
	            })
	                .done(function (rep) {
	                if (typeof callback === "function") {
	                    callback(rep.state);
	                }
	            })
	                .error(function () {
	                if (typeof callback === "function")
	                    callback(null);
	            });
	        };
	        this.Post.prototype.save = function (callback, blog, state) {
	            if (this._id) {
	                this.saveModifications(callback);
	            }
	            else {
	                this.create(callback, blog, state);
	            }
	        };
	        this.Post.prototype.republish = function (callback) {
	            entcore_1.http()
	                .putJson("/blog/post/" + this.blogId + "/" + this._id, {
	                sorted: true,
	            })
	                .done(function (rep) {
	                if (typeof callback === "function") {
	                    callback(rep.state);
	                }
	            });
	        };
	        this.Post.prototype.remove = function (callback) {
	            entcore_1.http()
	                .delete("/blog/post/" + this.blogId + "/" + this._id)
	                .done(function () {
	                if (typeof callback === "function") {
	                    callback();
	                }
	            });
	        };
	        this.Post.prototype.comment = function (comment) {
	            var _this = this;
	            return new Promise(function (resolve, reject) {
	                entcore_1.http()
	                    .postJson("/blog/comment/" + _this.blogId + "/" + _this._id, comment)
	                    .done(function () {
	                    this.comments.sync();
	                    resolve();
	                }.bind(_this));
	            });
	        };
	        this.Post.prototype.updateComment = function (comment) {
	            entcore_1.http()
	                .putJson("/blog/comment/" + this.blogId + "/" + this._id + "/" + comment.id, comment)
	                .done(function () {
	                this.comments.sync();
	            }.bind(this));
	        };
	        this.Blog.prototype.open = function (success, error) {
	            entcore_1.http()
	                .get("/blog/" + this._id)
	                .done(function (blog) {
	                this.owner = blog.author;
	                this.shortenedTitle = blog.title || "";
	                if (this.shortenedTitle.length > 40) {
	                    this.shortenedTitle = this.shortenedTitle.substr(0, 38) + "...";
	                }
	                if (blog.thumbnail) {
	                    this.icon = blog.thumbnail + "?thumbnail=290x290";
	                }
	                else {
	                    this.icon = "/img/illustrations/blog.svg";
	                }
	                this.updateData(blog);
	                if (typeof success === "function") {
	                    success();
	                }
	            }.bind(this))
	                .e404(function () {
	                if (typeof error === "function") {
	                    error();
	                }
	            }.bind(this))
	                .e401(function () {
	                if (typeof error === "function") {
	                    error();
	                }
	            }.bind(this));
	        };
	        this.Blog.prototype.remove = function () {
	            return __awaiter(this, void 0, void 0, function () {
	                return __generator(this, function (_a) {
	                    switch (_a.label) {
	                        case 0: return [4 /*yield*/, axios_1.default.delete("/blog/" + this._id)];
	                        case 1:
	                            _a.sent();
	                            return [2 /*return*/];
	                    }
	                });
	            });
	        };
	        this.Comment.prototype.toJSON = function () {
	            return {
	                comment: this.comment,
	            };
	        };
	        entcore_1.model.makeModels(this);
	        this.app = new this.App();
	    },
	};
	entcore_1.Behaviours.register("blog", {
	    model: exports.blogModel,
	    rights: {
	        resource: {
	            update: {
	                right: "org-entcore-blog-controllers-PostController|create",
	            },
	            removePost: {
	                right: "org-entcore-blog-controllers-PostController|delete",
	            },
	            editPost: {
	                right: "org-entcore-blog-controllers-PostController|update",
	            },
	            createPost: {
	                right: "org-entcore-blog-controllers-PostController|create",
	            },
	            publishPost: {
	                right: "org-entcore-blog-controllers-PostController|publish",
	            },
	            share: {
	                right: "org-entcore-blog-controllers-BlogController|shareJson",
	            },
	            manager: {
	                right: "org-entcore-blog-controllers-BlogController|delete",
	            },
	            removeBlog: {
	                right: "org-entcore-blog-controllers-BlogController|delete",
	            },
	            editBlog: {
	                right: "org-entcore-blog-controllers-BlogController|update",
	            },
	            removeComment: {
	                right: "org-entcore-blog-controllers-BlogController|delete",
	            },
	            comment: {
	                right: "org-entcore-blog-controllers-PostController|comment",
	            },
	        },
	        workflow: {
	            createFolder: "org.entcore.blog.controllers.FoldersController|add",
	            create: "org.entcore.blog.controllers.BlogController|create",
	            createPublic: "org.entcore.blog.controllers.BlogController|createPublicBlog",
	            publish: "org.entcore.blog.controllers.BlogController|publish",
	            print: "org.entcore.blog.controllers.BlogController|print",
	        },
	    },
	    loadResources: function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var response, data, posts;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, axios_1.default.get("/blog/linker")];
	                    case 1:
	                        response = _a.sent();
	                        data = response.data;
	                        posts = [];
	                        data.forEach(function (blog) {
	                            if (blog.thumbnail) {
	                                blog.thumbnail = blog.thumbnail + "?thumbnail=48x48";
	                            }
	                            else {
	                                blog.thumbnail = "/img/illustrations/blog.svg";
	                            }
	                            var addedPosts = entcore_1._.map(blog.fetchPosts, function (post) {
	                                return {
	                                    owner: {
	                                        name: blog.author.username,
	                                        userId: blog.author.userId,
	                                    },
	                                    title: post.title + " [" + blog.title + "]",
	                                    _id: blog._id,
	                                    icon: blog.thumbnail,
	                                    path: "/blog#/view/" + blog._id + "/" + post._id,
	                                };
	                            });
	                            posts = posts.concat(addedPosts);
	                        });
	                        this.resources = posts;
	                        return [2 /*return*/];
	                }
	            });
	        });
	    },
	    sniplets: {
	        //TODO Managing paging from sniplets !
	        articles: {
	            title: "sniplet.title",
	            description: "sniplet.desc",
	            controller: {
	                init: function () {
	                    this.foundBlog = true;
	                    this.me = entcore_1.model.me;
	                    entcore_1.Behaviours.applicationsBehaviours.blog.model.register();
	                    var blog = new entcore_1.Behaviours.applicationsBehaviours.blog.model.Blog({
	                        _id: this.source._id,
	                    });
	                    this.newPost =
	                        new entcore_1.Behaviours.applicationsBehaviours.blog.model.Post();
	                    blog.open(function () {
	                        blog.posts.syncAllPosts();
	                    }.bind(this), function () {
	                        this.foundBlog = false;
	                        this.$apply();
	                    }.bind(this));
	                    blog.on("posts.sync, change", function () {
	                        this.blog = blog;
	                        this.blog.behaviours("blog");
	                        this.$apply();
	                    }.bind(this));
	                },
	                initSource: function () {
	                    entcore_1.Behaviours.applicationsBehaviours.blog.model.register();
	                    var app = new entcore_1.Behaviours.applicationsBehaviours.blog.model.App();
	                    this.blog = new entcore_1.Behaviours.applicationsBehaviours.blog.model.Blog();
	                    app.blogs.syncAll(function () {
	                        this.blogs = app.blogs;
	                    }.bind(this));
	                },
	                pickBlog: function (blog) {
	                    this.setSnipletSource(blog);
	                    this.snipletResource.synchronizeRights();
	                },
	                createBlog: function () {
	                    console.log("automatic blog creation");
	                    if (this.snipletResource) {
	                        this.blog.thumbnail = this.snipletResource.icon || "";
	                        this.blog.title =
	                            this.blog.title ||
	                                "Les actualités du site " + this.snipletResource.title;
	                        this.blog["comment-type"] = "IMMEDIATE";
	                        this.blog.description = "";
	                    }
	                    this.blog.save(function () {
	                        //filler post publication
	                        var post = {
	                            state: "SUBMITTED",
	                            content: '<p>Voici le premier billet publié sur votre site !</p><p>Vous pouvez créer de nouveaux billets (si vous êtes contributeur) en cliquant sur le bouton "Ajouter un billet" ' +
	                                "ci-dessus, ou en accédant directement à l'application Blog. Vos visiteurs pourront également suivre vos actualités depuis leur application, " +
	                                "et seront notifiés lorsque votre site sera mis à jour.</p><p>La navigation, à gauche des billets, est automatiquement mise à jour lorsque vous ajoutez" +
	                                " des pages à votre site.</p>",
	                            title: "Votre premier billet !",
	                        };
	                        this.blog.posts.addDraft(post, function (post) {
	                            post.publish(function () {
	                                this.setSnipletSource(this.blog);
	                                //sharing rights copy
	                                this.snipletResource.synchronizeRights();
	                            }.bind(this));
	                        }.bind(this));
	                    }.bind(this));
	                },
	                addPost: function () {
	                    this.newPost.showCreateBlog = false;
	                    this.newPost.save(function () {
	                        this.blog.posts.syncAllPosts(function () {
	                            this.$apply();
	                        }.bind(this));
	                        delete this.newPost._id;
	                        this.newPost.content = "";
	                        this.newPost.title = "";
	                    }.bind(this), this.blog);
	                },
	                cancelNewPost: function () {
	                    this.newPost.showCreateBlog = false;
	                    this.newPost.content = "";
	                    this.newPost.title = "";
	                },
	                cancelEditing: function (post) {
	                    post.edit = false;
	                    post.content = post.data.content;
	                    post.title = post.data.title;
	                },
	                removePost: function (post) {
	                    post.remove(function () {
	                        this.blog.posts.syncAllPosts(function () {
	                            this.$apply();
	                        }.bind(this));
	                    }.bind(this));
	                },
	                addArticle: function () {
	                    this.editBlog = {};
	                },
	                saveEdit: function (post) {
	                    var scope = this;
	                    post.save(function () {
	                        post.publish(function () {
	                            post.data.content = post.content;
	                            post.data.title = post.title;
	                            scope.$apply();
	                        });
	                    });
	                    post.edit = false;
	                },
	                formatDate: function (date) {
	                    return entcore_1.moment(date).format("D/MM/YYYY");
	                },
	                getReferencedResources: function (source) {
	                    if (source._id) {
	                        return [source._id];
	                    }
	                },
	                publish: function (post) {
	                    post.publish(function () {
	                        this.blog.posts.syncAllPosts(function () {
	                            this.$apply();
	                        }.bind(this));
	                    }.bind(this));
	                },
	                slidePost: function (post) {
	                    var scope = this;
	                    post.open(function () {
	                        scope.blog.posts.forEach(function (p) {
	                            if (post._id === p._id)
	                                p.slided = true;
	                            else
	                                p.slided = false;
	                            scope.$apply();
	                        });
	                    });
	                },
	            },
	        },
	    },
	});


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = entcore;

/***/ }),
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;
	
	process.listeners = function (name) { return [] }
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(47);

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	var bind = __webpack_require__(49);
	var Axios = __webpack_require__(51);
	var defaults = __webpack_require__(52);
	
	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios(defaultConfig);
	  var instance = bind(Axios.prototype.request, context);
	
	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios.prototype, context);
	
	  // Copy context to instance
	  utils.extend(instance, context);
	
	  return instance;
	}
	
	// Create the default instance to be exported
	var axios = createInstance(defaults);
	
	// Expose Axios class to allow class inheritance
	axios.Axios = Axios;
	
	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(utils.merge(defaults, instanceConfig));
	};
	
	// Expose Cancel & CancelToken
	axios.Cancel = __webpack_require__(69);
	axios.CancelToken = __webpack_require__(70);
	axios.isCancel = __webpack_require__(66);
	
	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = __webpack_require__(71);
	
	module.exports = axios;
	
	// Allow use of default import syntax in TypeScript
	module.exports.default = axios;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var bind = __webpack_require__(49);
	var isBuffer = __webpack_require__(50);
	
	/*global toString:true*/
	
	// utils is a library of generic helper functions non-specific to axios
	
	var toString = Object.prototype.toString;
	
	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}
	
	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}
	
	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}
	
	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}
	
	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}
	
	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}
	
	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}
	
	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}
	
	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}
	
	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}
	
	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}
	
	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}
	
	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}
	
	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}
	
	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}
	
	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 */
	function isStandardBrowserEnv() {
	  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
	    return false;
	  }
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined'
	  );
	}
	
	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }
	
	  // Force an array if not already something iterable
	  if (typeof obj !== 'object' && !isArray(obj)) {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }
	
	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}
	
	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }
	
	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}
	
	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}
	
	module.exports = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isBuffer: isBuffer,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  extend: extend,
	  trim: trim
	};


/***/ }),
/* 49 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};


/***/ }),
/* 50 */
/***/ (function(module, exports) {

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */
	
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	module.exports = function (obj) {
	  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
	}
	
	function isBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}
	
	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
	}


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var defaults = __webpack_require__(52);
	var utils = __webpack_require__(48);
	var InterceptorManager = __webpack_require__(63);
	var dispatchRequest = __webpack_require__(64);
	var isAbsoluteURL = __webpack_require__(67);
	var combineURLs = __webpack_require__(68);
	
	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager(),
	    response: new InterceptorManager()
	  };
	}
	
	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = utils.merge({
	      url: arguments[0]
	    }, arguments[1]);
	  }
	
	  config = utils.merge(defaults, this.defaults, { method: 'get' }, config);
	  config.method = config.method.toLowerCase();
	
	  // Support baseURL config
	  if (config.baseURL && !isAbsoluteURL(config.url)) {
	    config.url = combineURLs(config.baseURL, config.url);
	  }
	
	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);
	
	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }
	
	  return promise;
	};
	
	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});
	
	module.exports = Axios;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var utils = __webpack_require__(48);
	var normalizeHeaderName = __webpack_require__(53);
	
	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};
	
	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}
	
	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = __webpack_require__(54);
	  } else if (typeof process !== 'undefined') {
	    // For node use HTTP adapter
	    adapter = __webpack_require__(54);
	  }
	  return adapter;
	}
	
	var defaults = {
	  adapter: getDefaultAdapter(),
	
	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],
	
	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],
	
	  timeout: 0,
	
	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',
	
	  maxContentLength: -1,
	
	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};
	
	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};
	
	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  defaults.headers[method] = {};
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});
	
	module.exports = defaults;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)))

/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	module.exports = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var utils = __webpack_require__(48);
	var settle = __webpack_require__(55);
	var buildURL = __webpack_require__(58);
	var parseHeaders = __webpack_require__(59);
	var isURLSameOrigin = __webpack_require__(60);
	var createError = __webpack_require__(56);
	var btoa = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || __webpack_require__(61);
	
	module.exports = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;
	
	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }
	
	    var request = new XMLHttpRequest();
	    var loadEvent = 'onreadystatechange';
	    var xDomain = false;
	
	    // For IE 8/9 CORS support
	    // Only supports POST and GET calls and doesn't returns the response headers.
	    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
	    if (process.env.NODE_ENV !== 'test' &&
	        typeof window !== 'undefined' &&
	        window.XDomainRequest && !('withCredentials' in request) &&
	        !isURLSameOrigin(config.url)) {
	      request = new window.XDomainRequest();
	      loadEvent = 'onload';
	      xDomain = true;
	      request.onprogress = function handleProgress() {};
	      request.ontimeout = function handleTimeout() {};
	    }
	
	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
	    }
	
	    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);
	
	    // Set the request timeout in MS
	    request.timeout = config.timeout;
	
	    // Listen for ready state
	    request[loadEvent] = function handleLoad() {
	      if (!request || (request.readyState !== 4 && !xDomain)) {
	        return;
	      }
	
	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }
	
	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        // IE sends 1223 instead of 204 (https://github.com/mzabriskie/axios/issues/201)
	        status: request.status === 1223 ? 204 : request.status,
	        statusText: request.status === 1223 ? 'No Content' : request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };
	
	      settle(resolve, reject, response);
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config, null, request));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
	        request));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies = __webpack_require__(62);
	
	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
	          cookies.read(config.xsrfCookieName) :
	          undefined;
	
	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }
	
	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }
	
	    // Add withCredentials to request if needed
	    if (config.withCredentials) {
	      request.withCredentials = true;
	    }
	
	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
	        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
	        if (config.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }
	
	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }
	
	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }
	
	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }
	
	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }
	
	    if (requestData === undefined) {
	      requestData = null;
	    }
	
	    // Send the request
	    request.send(requestData);
	  });
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)))

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var createError = __webpack_require__(56);
	
	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	module.exports = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  // Note: status is not exposed by XDomainRequest
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response.request,
	      response
	    ));
	  }
	};


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var enhanceError = __webpack_require__(57);
	
	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	module.exports = function createError(message, config, code, request, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, request, response);
	};


/***/ }),
/* 57 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	module.exports = function enhanceError(error, config, code, request, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }
	  error.request = request;
	  error.response = response;
	  return error;
	};


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}
	
	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	module.exports = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }
	
	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];
	
	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }
	
	      if (utils.isArray(val)) {
	        key = key + '[]';
	      }
	
	      if (!utils.isArray(val)) {
	        val = [val];
	      }
	
	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });
	
	    serializedParams = parts.join('&');
	  }
	
	  if (serializedParams) {
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }
	
	  return url;
	};


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	module.exports = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;
	
	  if (!headers) { return parsed; }
	
	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));
	
	    if (key) {
	      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	    }
	  });
	
	  return parsed;
	};


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    var msie = /(msie|trident)/i.test(navigator.userAgent);
	    var urlParsingNode = document.createElement('a');
	    var originURL;
	
	    /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      var href = url;
	
	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }
	
	      urlParsingNode.setAttribute('href', href);
	
	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	                  urlParsingNode.pathname :
	                  '/' + urlParsingNode.pathname
	      };
	    }
	
	    originURL = resolveURL(window.location.href);
	
	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	    };
	  })() :
	
	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })()
	);


/***/ }),
/* 61 */
/***/ (function(module, exports) {

	'use strict';
	
	// btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js
	
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	
	function E() {
	  this.message = 'String contains an invalid character';
	}
	E.prototype = new Error;
	E.prototype.code = 5;
	E.prototype.name = 'InvalidCharacterError';
	
	function btoa(input) {
	  var str = String(input);
	  var output = '';
	  for (
	    // initialize result and counter
	    var block, charCode, idx = 0, map = chars;
	    // if the next str index does not exist:
	    //   change the mapping table to "="
	    //   check if d has no fractional digits
	    str.charAt(idx | 0) || (map = '=', idx % 1);
	    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	  ) {
	    charCode = str.charCodeAt(idx += 3 / 4);
	    if (charCode > 0xFF) {
	      throw new E();
	    }
	    block = block << 8 | charCode;
	  }
	  return output;
	}
	
	module.exports = btoa;


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs support document.cookie
	  (function standardBrowserEnv() {
	    return {
	      write: function write(name, value, expires, path, domain, secure) {
	        var cookie = [];
	        cookie.push(name + '=' + encodeURIComponent(value));
	
	        if (utils.isNumber(expires)) {
	          cookie.push('expires=' + new Date(expires).toGMTString());
	        }
	
	        if (utils.isString(path)) {
	          cookie.push('path=' + path);
	        }
	
	        if (utils.isString(domain)) {
	          cookie.push('domain=' + domain);
	        }
	
	        if (secure === true) {
	          cookie.push('secure');
	        }
	
	        document.cookie = cookie.join('; ');
	      },
	
	      read: function read(name) {
	        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	        return (match ? decodeURIComponent(match[3]) : null);
	      },
	
	      remove: function remove(name) {
	        this.write(name, '', Date.now() - 86400000);
	      }
	    };
	  })() :
	
	  // Non standard browser env (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return {
	      write: function write() {},
	      read: function read() { return null; },
	      remove: function remove() {}
	    };
	  })()
	);


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	function InterceptorManager() {
	  this.handlers = [];
	}
	
	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};
	
	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};
	
	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};
	
	module.exports = InterceptorManager;


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	var transformData = __webpack_require__(65);
	var isCancel = __webpack_require__(66);
	var defaults = __webpack_require__(52);
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}
	
	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	module.exports = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);
	
	  // Ensure headers exist
	  config.headers = config.headers || {};
	
	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );
	
	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers || {}
	  );
	
	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );
	
	  var adapter = config.adapter || defaults.adapter;
	
	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);
	
	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );
	
	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);
	
	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }
	
	    return Promise.reject(reason);
	  });
	};


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(48);
	
	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	module.exports = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });
	
	  return data;
	};


/***/ }),
/* 66 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};


/***/ }),
/* 67 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	module.exports = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};


/***/ }),
/* 68 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	module.exports = function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	};


/***/ }),
/* 69 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}
	
	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};
	
	Cancel.prototype.__CANCEL__ = true;
	
	module.exports = Cancel;


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Cancel = __webpack_require__(69);
	
	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }
	
	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });
	
	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }
	
	    token.reason = new Cancel(message);
	    resolvePromise(token.reason);
	  });
	}
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};
	
	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};
	
	module.exports = CancelToken;


/***/ }),
/* 71 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	module.exports = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};


/***/ })
/******/ ]);
//# sourceMappingURL=behaviours.js.map