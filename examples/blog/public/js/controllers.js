'use strict';

/* Controllers */
var commentForms = {
    0: 'No comment',
    one: '{} comment',
    other: '{} comments'
};

function IndexCtrl($scope, $http) {
    $scope.commentForms = commentForms;
    $http.get('/api/posts').
        success(function(data, status, headers, config) {
            $scope.posts = data.posts;
        });
}
function fullPostCtrl($scope, $http, $routeParams, $route) {
    $scope.form = {};
    $scope.commentForms = commentForms;
    $http.get('/api/post/' + $routeParams.id).
        success(function(data) {
            $scope.post = data.post;
        });

    $scope.submitComment = function () {
        $scope.form.postId = $routeParams.id;
        $http.post('/api/comment', $scope.form).
            success(function(data) {
                $route.reload();
            });
        };

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
function AddPostCtrl($scope, $http, $location) {
    //TODO Remove this empty option...
    $scope.form = {};
    $http.get('/api/authors').
        success(function(data, status, headers, config) {
            $scope.authors = data.authors;
        });

    $scope.submitPost = function () {
        $http.post('/api/post', $scope.form).
            success(function(data) {
                $location.path('/');
            });
        };
}
function EditPostCtrl($scope, $http, $location, $routeParams) {
    $scope.form = {};

    $http.get('/api/post_and_authors/' + $routeParams.id).
        success(function(data) {
            $scope.form = data.post;
            $scope.form.authors = data.authors;
        });

    $scope.editPost = function () {
        $http.put('/api/post/' + $routeParams.id, $scope.form).
            success(function(data) {
                $location.url('/fullPost/' + $routeParams.id);
            });
    };
}
function DeletePostCtrl($scope, $http, $location, $routeParams) {
  $http.get('/api/post/' + $routeParams.id).
    success(function(data) {
      $scope.post = data.post;
    });

  $scope.deletePost = function () {
    $http.delete('/api/post/' + $routeParams.id).
      success(function(data) {
        $location.url('/');
      });
  };

  $scope.home = function () {
    $location.url('/');
  };
}


function AuthorCtrl($scope, $http) {
  $http.get('/api/authors').
    success(function(data, status, headers, config) {
      $scope.authors = data.authors;
    });
}
function ReadAuthorCtrl($scope, $http, $routeParams) {
  $http.get('/api/author/' + $routeParams.id).
    success(function(data) {
      $scope.author = data.author;
    });
}
function AddAuthorCtrl($scope, $http, $location) {
  $scope.form = {}
  $scope.submitAuthor = function () {
    $http.post('/api/author', $scope.form).
      success(function(data) {
        $location.path('/authors');
      });
  };
}
function EditAuthorCtrl($scope, $http, $location, $routeParams) {
  $scope.form = {};
  $http.get('/api/author/' + $routeParams.id).
    success(function(data) {
      $scope.form = data.author;
    });

  $scope.editAuthor = function () {
    $http.put('/api/author/' + $routeParams.id, $scope.form).
      success(function(data) {
        $location.url('/readAuthor/' + $routeParams.id);
      });
  };
}
function DeleteAuthorCtrl($scope, $http, $location, $routeParams) {
  $http.get('/api/author/' + $routeParams.id).
    success(function(data) {
      $scope.author = data.author;
    });

  $scope.deleteAuthor = function () {
    $http.delete('/api/author/' + $routeParams.id).
      success(function(data) {
        $location.url('/authors');
      });
  };

  $scope.home = function () {
    $location.url('/authors');
  };
}




