/*
 * Serve JSON to our AngularJS client
 */

var thinky = require('../thinky').thinky;

// Create the models
var Post = thinky.createModel('Post', {
    id: String,
    title: String,
    text: String,
    authorId: String,
    date: {_type: Number, default: function() { return Date.now() }}
});
var Author = thinky.createModel('Author', {
    id: String,
    name: String,
    email: String,
    website: String
});
var Comment = thinky.createModel('Comment', {
    id: String,
    name: String,
    comment: String,
    postId: String,
    date: {_type: Number, default: function() { return Date.now() }}
});


// Specify the joins

// A post has one author that we will keep in the field `author`.
// The join is done on post.authorId == author.id
Post.hasOne(Author, 'author', {leftKey: 'authorId', rightKey: 'id'});

// A post has multiple comments that we will keep in the field `comments`.
// The join is done on post.id == comment.postId.
Post.hasMany(Comment, 'comments', {leftKey: 'id', rightKey: 'postId'}, {orderBy: 'date'});


// Things related to post
exports.posts = function (req, res) {
    // We order by date (desc) and joined the author and comments
    Post.orderBy('-date').getJoin().run(function(error, posts) {
        if (Array.isArray(posts)) {
            // Convert dates to a human readable format
            for(var i=0; i< posts.length; i++) {
                var fullDate = new Date(posts[i].date);
                posts[i].date = fullDate.getMonth()+'/'+
                    fullDate.getDate()+'/'+
                    fullDate.getFullYear();
            }
        }
        res.json({
            error: error,
            posts: posts
        });
       
    })
};
exports.post = function (req, res) {
    var id = req.params.id;
    // Get one post and its author+comments
    Post.get(id).getJoin().run(function(error, post) {
        // Convert dates to a human readable format
        var fullDate;
        if (Array.isArray(post.comments)) {
            for(var i=0; i< post.comments.length; i++) {
                fullDate = new Date(post.comments[i].date);
                post.comments[i].date = fullDate.getMonth()+'/'+
                    fullDate.getDate()+'/'+
                    fullDate.getFullYear();
            }
        }
        fullDate = new Date(post.date);
        post.date = fullDate.getMonth()+'/'+
            fullDate.getDate()+'/'+
            fullDate.getFullYear();


        res.json({
            error: error,
            post: post
        });
    })
};

exports.postAndAuthors = function (req, res) {
    var id = req.params.id;
    // Retrieve a post and all the authors that exist
    // This currently cannot be done in one query with Thinky -- feature on the roadmap
    Post.get(id).run(function(error, post) {
        Author.run(function(error, authors) {
            res.json({
                error: error,
                post: post,
                authors: authors
            });
        })
    })
};

exports.addPost = function (req, res) {
    // Create a new post
    var newPost = new Post(req.body);

    // Save it
    newPost.save(function(error, result) {
        res.json({
            error: error,
            result: result
        });
    });
};
exports.deletePost = function (req, res) {
    var id = req.params.id;

    // Delete the post
    Post.get(id).delete( function(error, result) {
        res.json((error != null) && (result.deleted === 1));
    });
};
exports.editPost = function (req, res) {
    var newPost = new Post(req.body);

    // Update the post
    newPost.update( function(error, post) {
        res.json((error != null) && (post != null));
    });
};


// Post authors
exports.authors = function (req, res) {
    // Get all authors
    Author.run(function(error, authors) {
        res.json({
            error: error,
            authors: authors
        });
    })
};
exports.author = function (req, res) {
    var id = req.params.id;
    // Get an author
    // Instead of calling .get() then .run() we can just pass a callback to get.
    Author.get(id, function(error, author) {
        res.json({
            error: error,
            author: author
        });
    })
};

exports.addAuthor = function (req, res) {
    // Create an author
    var newAuthor = new Author(req.body);

    // Save it
    newAuthor.save(function(error, result) {
        res.json({
            error: error,
            result: result
        });
    });
};
exports.deleteAuthor = function (req, res) {
    var id = req.params.id;
    // Delete an author
    Author.get(id).delete( function(error, result) {
        res.json((error != null) && (result.deleted === 1));
    });
};
exports.editAuthor = function (req, res) {
    // Update an author
    var newAuthor = new Author(req.body);
    newAuthor.update( function(error, post) {
        res.json((error != null) && (post != null));
    });
};



exports.addComment = function (req, res) {
    // Create a comment
    var newComment = new Comment(req.body);

    // Save it
    newComment.save(function(error, result) {
        res.json({
            error: error,
            result: result
        });
    });
};


exports.deleteComment = function (req, res) {
    var id = req.params.id;
    // Delete a comment
    Comment.get(id).delete( function(error, result) {
        res.json((error != null) && (result.deleted === 1));
    });
};
