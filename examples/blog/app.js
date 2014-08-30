// Import
var express = require('express');
var routes = require('./routes');
var api = require('./routes/api');
var config = require('./config.js');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static')

var app = express();


app.use(serveStatic('public', {'index': ['index.html', 'index.htm']}))
//app.use(express.static(__dirname + '/public'));
//app.use(bodyParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// // parse application/json
app.use(bodyParser.json())

app.set('views', __dirname + '/views');
app.set('view options', { layout: false });
app.engine('jade', require('jade').__express);


/*
// Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {
        layout: false
    });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});


app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});
*/

// Routes
app.route('/').get(routes.index);
app.route('/partials/:name').get(routes.partials);

// Post API
app.route('/api/posts').get(api.posts);
app.route('/api/post/:id').get(api.post);
app.route('/api/post_and_authors/:id').get(api.postAndAuthors);
app.route('/api/post').post(api.addPost);
app.route('/api/post/:id').delete(api.deletePost);
app.route('/api/post/:id').put(api.editPost);

// Author API
app.route('/api/authors').get(api.authors);
app.route('/api/author/:id').get(api.author);
app.route('/api/author').post(api.addAuthor);
app.route('/api/author/:id').delete(api.deleteAuthor);
app.route('/api/author/:id').put(api.editAuthor);

// Comment API
app.route('/api/comment').post(api.addComment);
app.route('/api/comment/:id').delete(api.deleteComment);

// Redirect all others to the index
// A 404 page is probably a better move
app.route('*').get(routes.index);

// Start server
app.listen(config.expressPort, function(){
    console.log("Express server listening on port %d in %s mode",
        config.expressPort, app.settings.env);
});
