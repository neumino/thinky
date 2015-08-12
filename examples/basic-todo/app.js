// Import express and co
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// Load config for RethinkDB and express
var config = require(__dirname+"/config.js")

// Import rethinkdbdash
//var thinky = require('thinky')(config.rethinkdb);
var thinky = require('thinky')(config.rethinkdb);
var r = thinky.r;
var type = thinky.type;

// Create the model
var Todo = thinky.createModel("todos", {
    id: type.string(),
    title: type.string(),
    completed: type.boolean(),
    createdAt: type.date().default(r.now())
});

// Ensure that an index createdAt exists
Todo.ensureIndex("createdAt");


app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.route('/todo/get').get(get);
app.route('/todo/new').put(create);
app.route('/todo/update').post(update);
app.route('/todo/delete').post(del);


// Retrieve all todos
function get(req, res, next) {
    Todo.orderBy({index: "createdAt"}).run().then(function(result) {
        res.send(JSON.stringify(result));
    }).error(handleError(res));
}

// Create a new todo
function create(req, res, next) {
    var todo = new Todo(req.body);
    todo.save().then(function(result) {
        res.send(JSON.stringify(result));
    }).error(handleError(res));
}

// Update a todo
function update(req, res, next) {
    var todo = new Todo(req.body);
    Todo.get(todo.id).update({
       title: req.body.title,
       completed: req.body.completed
    }).run().then(function(todo) {
        res.send(JSON.stringify(todo));
    }).error(handleError(res));

    // Another way to update a todo is with
    // Todo.get(req.body.id).update(todo).execute()
}

// Delete a todo
function del(req, res, next) {
    Todo.get(req.body.id).run().then(function(todo) {
        todo.delete().then(function(result) {
            res.send("");
        }).error(handleError(res));
    }).error(handleError(res));

    // Another way to delete a todo is with
    // Todo.get(req.body.id).delete().execute()
}

function handleError(res) {
    return function(error) {
        return res.send(500, {error: error.message});
    }
}

// Start express
app.listen(config.express.port);
console.log('listening on port '+config.express.port);
