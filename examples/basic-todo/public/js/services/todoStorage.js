/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function ($http) {
	var STORAGE_ID = 'todos-angularjs';

	return {
		get: function () {
		    var url = "/todo/get";
		    return $http.get(url);
		},
		create: function (todo) {
		    var url = "/todo/new";
		    return $http.put(url, todo);
		},
		update: function (todo) {
		    var url = "/todo/update";
		    return $http.post(url, JSON.stringify(todo));
		},
	    delete: function(id) {
	        var url = "/todo/delete";
		    return $http.post(url, JSON.stringify({id: id}));
        }

	};
});
