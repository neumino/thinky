/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, todoStorage, filterFilter) {
    $scope.todos = [];

	todoStorage.get().success(function(todos) {
	    $scope.todos = todos;
    }).error(function(error) {
        alert("Failed to load TODOs");

    });

	$scope.newTodo = '';
	$scope.editedTodo = null;

	$scope.$watch('todos', function (newValue, oldValue) {
		$scope.remainingCount = filterFilter($scope.todos, { completed: false }).length;
		$scope.completedCount = $scope.todos.length - $scope.remainingCount;
		$scope.allChecked = !$scope.remainingCount;
	}, true);

	// Monitor the current route for changes and adjust the filter accordingly.
	$scope.$on('$routeChangeSuccess', function () {
		var status = $scope.status = $routeParams.status || '';

		$scope.statusFilter = (status === 'active') ?
			{ completed: false } : (status === 'completed') ?
			{ completed: true } : null;
	});

	$scope.addTodo = function () {
		var newTitle = $scope.newTodo.trim();
		if (!newTitle.length) {
			return;
		}
		var newTodo = {
            title: newTitle,
            completed: false
        }
        todoStorage.create(newTodo).success(function(savedTodo) {
            $scope.todos.push(savedTodo);
        }).error(function(error) {
            alert("Failed to save the new TODO");
        });
		$scope.newTodo = '';
	};

	$scope.toggleTodo = function (todo) {
		var copyTodo = angular.extend({}, todo);
		copyTodo.completed = !copyTodo.completed
        todoStorage.update(copyTodo).success(function(newTodo) {
            $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
            $scope.editedTodo = null;
        }).error(function() {
            alert("Failed to update the status of this TODO");
        });
    
    };
	$scope.editTodo = function (todo) {
		$scope.editedTodo = todo;
		// Clone the original todo to restore it on demand.
		$scope.originalTodo = angular.extend({}, todo);
	};

	$scope.doneEditing = function (todo, $event) {
		todo.title = todo.title.trim();
        if ((todo._saving !== true) && ($scope.originalTodo.title !== todo.title)) {
            todo._saving = true; // submit and blur trigger this method. Let's save the document just once
            todoStorage.update(todo).success(function(newTodo) {
                $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
                $scope.editedTodo = null;
            }).error(function() {
                todo._saving = false;
                alert("Failed to update this TODO");
            });
        }
        else {
            $scope.editedTodo = null;
        }
	};

	$scope.revertEditing = function (todo) {
		$scope.todos[$scope.todos.indexOf(todo)] = $scope.originalTodo;
		$scope.doneEditing($scope.originalTodo);
	};

	$scope.removeTodo = function (todo) {
	    todoStorage.delete(todo.id).success(function() {
            $scope.todos.splice($scope.todos.indexOf(todo), 1);
        }).error(function() {
            alert("Failed to delete this TODO");
        });
	};

	$scope.clearCompletedTodos = function () {
		$scope.todos = todos.filter(function (val) {
			return !val.completed;
		});
	};

	$scope.markAll = function (completed) {
		$scope.todos.forEach(function (todo) {
		    if (todo.completed !== !completed) {
		        $scope.toggleTodo(todo);
            }
			//todo.completed = !completed;
		});
	};
});
