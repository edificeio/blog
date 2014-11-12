function resolveMyRights(){
	model.me.myRights = {
		blog: {
			post: _.where(model.me.authorizedActions, { name: "org.entcore.blog.controllers.BlogController|create" }).length > 0
		}
	}
}

routes.define(function($routeProvider){
	$routeProvider
		.when('/view/:blogId', {
			action: 'viewBlog'
		})
		.when('/new-article/:blogId', {
			action: 'newArticle'
		})
		.when('/list-blogs', {
			action: 'list'
		})
		.otherwise({
			redirectTo: '/list-blogs'
		})
});

function Blog($scope, date, _, ui, lang, notify, template, route){
	$scope.translate = lang.translate;

	$scope.blogs = [];
	$scope.currentBlog = undefined;
	$scope.currentPost = {};

	$scope.commentFormPath = '';
	$scope.notify = notify;

	$scope.template = template;
	template.open('blogsList', 'blogs-list');
	template.open('filters', 'filters');

	$scope.me = model.me;

	route({
		viewBlog: function(params){
			refreshBlogList(function(){
				if(_.where($scope.blogs, { _id: params.blogId }).length > 0){
					$scope.currentBlog = _.where($scope.blogs, { _id: params.blogId })[0];
				}
				else{
					notify.error('notfound');
				}

				$scope.defaultView();
			});
		},
		newArticle: function(params){
			refreshBlogList(function(){
				if(_.where($scope.blogs, { _id: params.blogId }).length > 0){
					$scope.currentBlog = _.where($scope.blogs, { _id: params.blogId })[0];
				}
				else{
					notify.error('notfound');
				}

				template.open('main', 'create-post');
			});
		},
		list: function(){
			$scope.defaultView();
			refreshBlogList();
		}
	});

	$scope.displayOptions = {
		showAll: false,
		showPosts: true,
		showSubmitted: false,
		showDrafts: false
	};

	function blogRights(blog){
		blog.myRights = {
			comment: {
				post: true,
				remove: true
			},
			post: {
				post: true,
				remove: true,
				edit: true,
				publish: true
			},
			blog: {
				edit: true
			},
			manager: true
		};
		var ownerRights = _.where(blog.shared, { userId: model.me.userId, manager: true });

		if(ownerRights.length > 0){
			return;
		}
		var currentSharedRights = _.filter(blog.shared, function(sharedRight){
			if(!model.me.profilGroupsIds){
				return false;
			}
			return model.me.profilGroupsIds.indexOf(sharedRight.groupId) !== -1
				|| sharedRight.userId === model.me.userId;
		});

		function setRight(path){
			return (_.find(currentSharedRights, function(right){
					return right[path];
				}) !== undefined) || blog.author.userId === model.me.userId;
		}

		blog.myRights.comment.post = setRight('org-entcore-blog-controllers-PostController|comment');
		blog.myRights.comment.remove = setRight('org-entcore-blog-controllers-PostController|deleteComment');
		blog.myRights.post.post = setRight('org-entcore-blog-controllers-PostController|submit');
		blog.myRights.post.edit = setRight('org-entcore-blog-controllers-PostController|update');
		blog.myRights.post.remove = setRight('org-entcore-blog-controllers-PostController|delete');
		blog.myRights.post.publish = setRight('org-entcore-blog-controllers-PostController|publish');
		blog.myRights.blog.edit = setRight('manager');
		blog.myRights.manager = setRight('manager');
	}

	function shortenedTitle(title){

		var shortened = title || '';
		console.log(shortened);
		if(shortened.length > 40){
			shortened = shortened.substr(0, 38) + '...';
		}
		return shortened;
	}

	function refreshBlogList(callback){
		http().get('/blog/list/all').done(function(data){
			data.forEach(function(blog){
				blogRights(blog);
				blog.shortened = shortenedTitle(blog.title);
			});
			$scope.blogs = data;
			if(typeof callback === 'function'){
				callback(data);
			}

			if(!$scope.currentBlog){
				$scope.currentBlog = $scope.blogs[0];
			}
			$scope.openBlog($scope.currentBlog);
			if(window.location.href.indexOf('print') !== -1){
				setTimeout(function(){
					window.print();
				}, 1000);
			}
			$scope.$apply();
		});
	}

	resolveMyRights(model.me);

	$scope.defaultView = function(){
		template.open('main', 'list-posts');
	};

	$scope.showEverything = function(post){
		post.showEverything = true;
	};

	$scope.currentBlogView  = function(){
		template.close('main');
		$scope.displayBlog($scope.currentBlog);
	};

	$scope.uncheckAll = function(){
		if($scope.displayOptions.showAll){
			$scope.displayOptions.showPosts = false;
			$scope.displayOptions.showDrafts = false;
			$scope.displayOptions.showSubmitted = false;
		}
	};

	$scope.uncheckAllBox = function(){
		$scope.displayOptions.showAll = false;
	};

	$scope.seeMore = function(){
		var slots = 0;
		if(!$scope.currentBlog){
			return false;
		}
		if($scope.currentBlog.posts && ($scope.displayOptions.showAll || $scope.displayOptions.showPosts)){
			slots += $scope.currentBlog.posts.length;
		}
		if($scope.currentBlog.drafts && ($scope.displayOptions.showAll || $scope.displayOptions.showDrafts)){
			slots += $scope.currentBlog.drafts.length;
		}
		if($scope.currentBlog.submitted && ($scope.displayOptions.showAll || $scope.displayOptions.showSubmitted)){
			slots += $scope.currentBlog.submitted.length;
		}
		return $scope.maxResults < slots;
	};

	$scope.publish = function(post){
		if($scope.currentBlog.myRights.manager){
			post.state = 'PUBLISHED';
			http().put('/blog/post/publish/' + $scope.currentBlog._id + '/' + post._id).done(function(){
				$scope.openBlog($scope.currentBlog);
				$scope.$apply();
			});
		}
		else{
			$scope.submit(post);
		}
	};

	$scope.saveAndSubmit = function(post){
		$scope.updatePost(post);
		$scope.publish(post);

		$scope.displayBlog($scope.currentBlog);
	};

	$scope.submit = function(post){
		if($scope.currentBlog['publish-type'] === "IMMEDIATE"){
			post.state = 'PUBLISHED';
		} else {
			post.state = 'SUBMITTED';
		}
		http().put('/blog/post/submit/' + $scope.currentBlog._id + '/' + post._id).done(function(){
			$scope.openBlog($scope.currentBlog);
			$scope.$apply();
		});
	};

	$scope.openBlog = function(blog){
		if(!blog){
			return;
		}
		resetScope();
		$scope.currentBlog = blog;
		http().get('/blog/post/list/all/' + blog._id).done(function(data){
			$scope.currentBlog.posts = data;
			initMaxResults();
			$scope.$apply();
		});

		http().get('/blog/post/list/all/' + blog._id + '?state=SUBMITTED').done(function(data){
			$scope.currentBlog.submitted = data;
			initMaxResults();
			$scope.$apply();
		});

		http().get('/blog/post/list/all/' + blog._id + '?state=DRAFT').done(function(data){
			$scope.currentBlog.drafts = data;
			initMaxResults();
			$scope.$apply();
		});
	};

	$scope.displayBlog = function(blog){
		$scope.openBlog(blog);
		template.open('main', 'list-posts');
	};

	$scope.nbComments = function(post){
		if(!post.comments){
			post.comments = [];
			http().get('/blog/comments/' + $scope.currentBlog._id + '/' + post._id).done(function(comments){
				post.comments = comments;
				$scope.$apply();
			});
			return '-';
		}
		return post.comments.length;
	}

	$scope.isSelected = function(id){
		return id === $scope.currentBlog._id;
	}
	$scope.isVisible = function(){
		return $scope.currentBlog && (!template.contains('main', 'create-blog') && !template.contains('main', 'edit-blog')) && $scope.currentBlog.myRights.post.post;
	}
	$scope.isCurrentView = function(name){
		return template.contains('main', name);
	};

	$scope.switchComments = function(post){
		post.showComments = !post.showComments;
	};

	$scope.showCreatePost = function(){
		resetScope();
		template.open('main', 'create-post');
	};

	$scope.showCreateBlog= function(){
		$scope.currentBlog = '';
		resetScope();
		template.open('main', 'create-blog');
	};

	$scope.showEditBlog = function(blog){
		http().get('/blog/' + blog._id)
			.done(function(data){
				blogRights(data);
				$scope.currentBlog = data;
				template.open('main', 'edit-blog');
				$scope.$apply();

			});
	};

	$scope.postTemplate = function(post){
		if(post === $scope.editPost){
			return '/blog/public/template/edit-post.html';
		}
		if(post.state === 'SUBMITTED' || post.state === 'DRAFT'){
			return '/blog/public/template/view-submitted.html';
		}
		return '/blog/public/template/view-post.html';
	}

	$scope.postTemplateOne = function(post){
		if(post === $scope.editPost){
			template.open('blogPostView', 'edit-post');
		}
		else if(post.state === 'SUBMITTED' || post.state === 'DRAFT'){
			template.open('blogPostView', 'view-submitted');
		}
		else {
			template.open('blogPostView', 'view-post');
		}
		return template.containers.blogPostView;
	}


	$scope.showEditPost = function(post){
		$scope.currentPost = post;
		http().get('/blog/post/' + $scope.currentBlog._id + '/' + $scope.currentPost._id + '?state=' + post.state)
			.done(function(data){
				$scope.currentPost = data;
				$scope.editPost = post;
				$scope.$apply();
			});
	};

	$scope.showCommentPost = function(post){
		post.showComments = true;
		$scope.commentFormPath = "/blog/public/template/comment-post.html";
		$scope.currentPost = post;
		resetScope()
	}
	$scope.hideCommentForm = function(){
		$scope.commentFormPath = "";
	}

	function resetScope(){
		$scope.create = {
			post: {
				state: 'SUBMITTED'
			},
			blog: {
				thumbnail: '',
				'comment-type': 'IMMEDIATE',
				description: ''
			},
			comment: {
				comment: ''
			}
		};
		$scope.editPost = undefined;
	}
	resetScope();

	$scope.formatDate = function(dateString){
		return date.format(dateString, 'dddd LL')
	}

	$scope.isEditing = function(){
		return $scope.editPost;
	};

	$scope.saveDraft = function(){
		$scope.create.post.state = 'DRAFT';
		if(!$scope.create.post.content || !$scope.create.post.title){
			notify.error('post.empty');
			return;
		}
		http().post('/blog/post/' + $scope.currentBlog._id, $scope.create.post).done(function(createdPost){
			$scope.create.post._id = createdPost._id;
			$scope.displayBlog($scope.currentBlog);
		});
		notify.info('draft.saved');
	};

	$scope.savePost = function(){
		$scope.create.post.state = 'SUBMITTED';
		if($scope.create.post._id !== undefined){
			$scope.publish($scope.create.post);
			$scope.displayBlog($scope.currentBlog);
		}
		else{
			$scope.createPost(function(newPost){
				$scope.create.post._id = newPost._id;
				$scope.publish($scope.create.post);
				$scope.displayBlog($scope.currentBlog);
			});
		}

	};

	$scope.createPost = function(callback){
		http().post('/blog/post/' + $scope.currentBlog._id, $scope.create.post).done(callback)
	};

	$scope.blogThumbnail = function(blog){
		if(blog.thumbnail !== ''){
			return blog.thumbnail + '?thumbnail=120x120';
		}
		return '/img/illustrations/blog.png';
	};

	$scope.photo = { file: undefined }
	$scope.updateBlogImage = function(blog){
		blog.thumbnail = '/workspace/document/' + $scope.photo.file._id + '?thumbnail=120x120';
	};

	$scope.updatePost = function(){
		http().put('/blog/post/' + $scope.currentBlog._id + '/' + $scope.currentPost._id, $scope.currentPost).done(function(){
			$scope.displayBlog($scope.currentBlog);
			window.scrollTo(0, 0);
		})
	};

	$scope.commentPost = function(){
		http().post('/blog/comment/' + $scope.currentBlog._id + '/' + $scope.currentPost._id, $scope.create.comment).done(function(e){
			http().get('/blog/comments/' + $scope.currentBlog._id + '/' + $scope.currentPost._id).done(function(comments){
				$scope.currentPost.comments = comments;
				$scope.hideCommentForm();
				$scope.$apply();
			})
		})
	};

	function initMaxResults(){
		$scope.maxResults = 3;
	}
	initMaxResults();
	$scope.addResults = function(){
		$scope.maxResults += 3;
	};

	$scope.nbResults = function(postState){
		var remainingSlots = $scope.maxResults;
		if(!$scope.currentBlog){
			return 0;
		}
		if((postState === 'posts' || postState === 'submitted') &&
			($scope.currentBlog.drafts && ($scope.displayOptions.showDrafts || $scope.displayOptions.showAll))){
			remainingSlots -= $scope.currentBlog.drafts.length;
		}
		if((postState === 'posts') && ($scope.currentBlog.submitted && ($scope.displayOptions.showAll || $scope.displayOptions.showSubmitted))){
			remainingSlots -= $scope.currentBlog.submitted.length;
		}
		if(remainingSlots < 0){
			remainingSlots = 0;
		}
		return remainingSlots;
	}

	$scope.openConfirmView = function(action, args){
		$scope.lightboxPath = '/blog/public/template/confirm.html';
		$scope.onConfirm = {
			func: function(args){
				ui.hideLightbox();
				action(args);
			},
			args: args
		};
		ui.showLightbox();
	}

	$scope.openSharingView = function(){
		$scope.sharedResources = [$scope.currentBlog];
		$scope.lightboxPath = '/blog/public/template/share.html';
		ui.showLightbox();

	};

	$scope.updatePublishType = function(){
		http().put('/blog/' + $scope.currentBlog._id, { 'publish-type': $scope.currentBlog['publish-type'] });
	}

	$scope.removePost = function(post){
		http().delete('/blog/post/' + $scope.currentBlog._id + '/' + post._id).done(function(){
			$scope.displayBlog($scope.currentBlog);
		});
	};

	$scope.removeComment = function(post, comment){
		http().delete('/blog/comment/' + $scope.currentBlog._id + '/' + post._id + '/' + comment.id).done(function(){
			post.comments = undefined;
			$scope.$apply();
		});
	};

	$scope.saveBlogChanges = function(){
		http().put('/blog/' + $scope.currentBlog._id, $scope.currentBlog).done(function(){
			refreshBlogList(function(){
				$scope.displayBlog($scope.currentBlog);
			});
		})
	};

	$scope.createBlog = function(){
		http().post('/blog', $scope.create.blog)
			.done(function(newBlog){
				refreshBlogList(function(){
					$scope.displayBlog(_.where($scope.blogs, { _id: newBlog._id})[0]);
				});
			});
	};

	$scope.removeBlog = function(){
		http().delete('/blog/' + $scope.currentBlog._id).done(function(){
			refreshBlogList(function(){
				$scope.currentBlog = '';
				$scope.defaultView();
			});
		})
	}

	$scope.orderBlogsList = function(blog){
		if(blog.myRights.blog.edit)
			return 0
		if(blog.myRights.post.post)
			return 1
		return 2
	}

	$scope.getPublishButtonI18n = function(){
		return ( $scope.currentBlog.myRights.manager || $scope.currentBlog['publish-type'] === 'IMMEDIATE') ? 'blog.publish' : 'blog.submitPost';
	}
}
