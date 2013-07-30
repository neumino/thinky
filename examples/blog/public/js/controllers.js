'use strict';

/* Controllers */

// Helper to pluralize `comment`
var commentForms = {
    0: 'No comment',
    one: '{} comment',
    other: '{} comments'
};

// Controller for the list of posts
function IndexCtrl($scope, $http) {
    $scope.commentForms = commentForms;
    // Get data
    $http.get('/api/posts').
        success(function(data, status, headers, config) {
            $scope.posts = data.posts;
        });
}

// Controller for the full view of a post
function fullPostCtrl($scope, $http, $routeParams, $route) {
    $scope.form = {};
    $scope.commentForms = commentForms;

    // Get data
    $http.get('/api/post/' + $routeParams.id).
        success(function(data) {
            $scope.post = data.post;
        });

    // Triggered when the user submit a comment
    $scope.submitComment = function () {
        $scope.form.postId = $routeParams.id;
        $http.post('/api/comment', $scope.form).
            success(function(data) {
                $route.reload();
            });
        };

    // When the user delete a comment
    $scope.deleteComment = function (id, $event) {
        $event.preventDefault();
        $event.stopPropagation();
        $http.delete('/api/comment/' + id).
        success(function(data) {
            $route.reload();
        });
        return false;
    }
}

// Controller to add a post
function AddPostCtrl($scope, $http, $location) {
    //TODO Remove this empty option...
    $scope.form = {};

    // Get data
    $http.get('/api/authors').
        success(function(data, status, headers, config) {
            $scope.authors = data.authors;
        });

    // Add a new post
    $scope.submitPost = function () {
        $http.post('/api/post', $scope.form).
            success(function(data) {
                $location.path('/');
            });
        };
}

// Controller to edit a post
function EditPostCtrl($scope, $http, $location, $routeParams) {
    $scope.form = {};

    // Get the post and all the authors available
    $http.get('/api/post_and_authors/' + $routeParams.id).
        success(function(data) {
            $scope.form = data.post;
            $scope.form.authors = data.authors;
        });

    // Update the post
    $scope.editPost = function () {
        $http.put('/api/post/' + $routeParams.id, $scope.form).
            success(function(data) {
                $location.url('/fullPost/' + $routeParams.id);
            });
    };
}

// Controller to delete a post
function DeletePostCtrl($scope, $http, $location, $routeParams) {
    // Get data
    $http.get('/api/post/' + $routeParams.id).
        success(function(data) {
            $scope.post = data.post;
        });

    // When the user confirm the deletion
    $scope.deletePost = function () {
        $http.delete('/api/post/' + $routeParams.id).
        success(function(data) {
            $location.url('/');
        });
    };

    // When the user cancel the action, he go back to /
    $scope.home = function () {
        $location.url('/');
    };
}

// Controller to read an author
function AuthorCtrl($scope, $http) {
    // Get data
    $http.get('/api/authors').
        success(function(data, status, headers, config) {
            $scope.authors = data.authors;
        });
}

// Controller to read just an author
function ReadAuthorCtrl($scope, $http, $routeParams) {
    // Get data
    $http.get('/api/author/' + $routeParams.id).
        success(function(data) {
            $scope.author = data.author;
        });
}

// Controller to read just an author
function AddAuthorCtrl($scope, $http, $location) {
    $scope.form = {}

    // Add an author
    $scope.submitAuthor = function () {
        $http.post('/api/author', $scope.form).
        success(function(data) {
            $location.path('/authors');
        });
    };
}

// Controller to edit an author
function EditAuthorCtrl($scope, $http, $location, $routeParams) {
    $scope.form = {};

    // Get data
    $http.get('/api/author/' + $routeParams.id).
        success(function(data) {
            $scope.form = data.author;
        });

    // Update the author
    $scope.editAuthor = function () {
        $http.put('/api/author/' + $routeParams.id, $scope.form).
            success(function(data) {
                $location.url('/readAuthor/' + $routeParams.id);
            });
    };
}

// Controller to delete an author
function DeleteAuthorCtrl($scope, $http, $location, $routeParams) {
    // Get data
    $http.get('/api/author/' + $routeParams.id).
        success(function(data) {
            $scope.author = data.author;
        });

    // Delete the author
    $scope.deleteAuthor = function () {
        $http.delete('/api/author/' + $routeParams.id).
            success(function(data) {
                $location.url('/authors');
            });
    };

    // Redirect to the list of authors (if the user doesn't confirm the deletion)
    $scope.home = function () {
        $location.url('/authors');
    };
}
