
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    api = require('./routes/api');
    thinky = require('./thinky'),
    config = require('./config');


var app = module.exports = express();

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

// Routes

app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API

app.get('/api/posts', api.posts);
app.get('/api/post/:id', api.post);
app.get('/api/post_and_authors/:id', api.postAndAuthors);
app.post('/api/post', api.addPost);
app.delete('/api/post/:id', api.deletePost);
app.put('/api/post/:id', api.editPost);

app.get('/api/authors', api.authors);
app.get('/api/author/:id', api.author);
app.post('/api/author', api.addAuthor);
app.delete('/api/author/:id', api.deleteAuthor);
app.put('/api/author/:id', api.editAuthor);


app.post('/api/comment', api.addComment);

app.delete('/api/comment/:id', api.deleteComment);


// redirect all others to the index (HTML5 history)
//app.get('*', routes.index);

// Start server

app.listen(config.expressPort, function(){
    console.log("Express server listening on port %d in %s mode", config.expressPort, app.settings.env);
});
