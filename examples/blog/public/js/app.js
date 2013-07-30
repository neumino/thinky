'use strict';

// Main app
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'partials/index',
        controller: IndexCtrl
      }).
      when('/addPost', {
        templateUrl: 'partials/addPost',
        controller: AddPostCtrl
      }).
      when('/fullPost/:id', {
        templateUrl: 'partials/fullPost',
        controller: fullPostCtrl 
      }).
      when('/editPost/:id', {
        templateUrl: 'partials/editPost',
        controller: EditPostCtrl
      }).
      when('/deletePost/:id', {
        templateUrl: 'partials/deletePost',
        controller: DeletePostCtrl
      }).
      when('/authors', {
        templateUrl: 'partials/authors',
        controller: AuthorCtrl
      }).
      when('/editAuthor/:id', {
        templateUrl: 'partials/editAuthor',
        controller: EditAuthorCtrl
      }).
      when('/addAuthor', {
        templateUrl: 'partials/addAuthor',
        controller: AddAuthorCtrl
      }).
      when('/readAuthor/:id', {
        templateUrl: 'partials/readAuthor',
        controller: ReadAuthorCtrl
      }).
      when('/deleteAuthor/:id', {
        templateUrl: 'partials/deleteAuthor',
        controller: DeleteAuthorCtrl
      }).
      otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  }]);
