// Import
var thinky = require('../thinky').thinky;

// Create the models
// Note: if we don't provide the field date, the default function will be called
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

// Retrieves a liist of posts with its author and its comments
exports.posts = function (req, res) {
    // We order by date (desc) and joined the author and comments
    Post.orderBy('-date').getJoin().run(function(error, posts) {
        // Convert dates to a human readable format
        if ((posts != null) && (Array.isArray(posts))) {
            for(var i=0; i< posts.length; i++) {
                var fullDate = new Date(posts[i].date);
                posts[i].date = fullDate.getMonth()+'/'+
                    fullDate.getDate()+'/'+
                    fullDate.getFullYear();
            }
        }
        // Send back the data
        res.json({
            error: error,
            posts: posts
        });
       
    })
};

// Retrieves one post with all its data (author and comments)
exports.post = function (req, res) {
    var id = req.params.id;
    // Get one post and its author and comments
    Post.get(id).getJoin().run(function(error, post) {
        // Convert dates to a human readable format
        var fullDate;
        if ((post != null) && (Array.isArray(post.comments))) {
            for(var i=0; i< post.comments.length; i++) {
                fullDate = new Date(post.comments[i].date);
                post.comments[i].date = fullDate.getMonth()+'/'+
                    fullDate.getDate()+'/'+
                    fullDate.getFullYear();
            }
        }
        if (post != null) {
            fullDate = new Date(post.date);
            post.date = fullDate.getMonth()+'/'+
                fullDate.getDate()+'/'+
                fullDate.getFullYear();
        }

        // Send back the data 
        res.json({
            error: error,
            post: post
        });
    })
};

// Retrieves a post and all authors available
exports.postAndAuthors = function (req, res) {
    var id = req.params.id;
    // Retrieve a post and all the authors that exist
    // This currently cannot be done in one query with Thinky -- the feature is on the roadmap

    // Get the post
    Post.get(id).run(function(error_post, post) {
        // Get all authors
        Author.run(function(error_author, authors) {
            // Send back everything
            res.json({
                error_post: error_post,
                error_author: error_author,
                post: post,
                authors: authors
            });
        })
    })
};

// Saves a post in the database
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

// Deletes a post from the database
exports.deletePost = function (req, res) {
    var id = req.params.id;

    // Deletes the post
    Post.get(id).delete( function(error, result) {
        res.json({
            error: error,
            result: result
        });

    });
};

// Updates a post in the database
exports.editPost = function (req, res) {
    var newPost = new Post(req.body);

    // Updates the post
    newPost.update( function(error, post) {
        res.json({
            error: error,
            post: post
        });
    });
};


// Things related to authors

// Retrieves all authors
exports.authors = function (req, res) {
    // Get all authors
    Author.orderBy('name').run(function(error, authors) {
        res.json({
            error: error,
            authors: authors
        });
    })
};

// Retrieves one author
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

// Saves an author in the database
exports.addAuthor = function (req, res) {
    // Creates an author based on req.body
    var newAuthor = new Author(req.body);

    // Saves it
    newAuthor.save(function(error, result) {
        res.json({
            error: error,
            result: result
        });
    });
};
// Deletes an author
exports.deleteAuthor = function (req, res) {
    var id = req.params.id;
    // Deletes an author
    Author.get(id).delete( function(error, result) {
        res.json({
            error: error,
            result: result
        })

    });
};
// Edits an author
exports.editAuthor = function (req, res) {
    // Create the author based on req.body
    var newAuthor = new Author(req.body);

    // Update an author
    newAuthor.update( function(error, author) {
        res.json({
            error: error,
            author: author
        })
    });
};


// Things related to comments
exports.addComment = function (req, res) {
    // Creates a comment based on req.body
    var newComment = new Comment(req.body);

    // Saves it
    newComment.save(function(error, result) {
        res.json({
            error: error,
            result: result
        });
    });
};


// Deletes comment
exports.deleteComment = function (req, res) {
    var id = req.params.id;
    // Deletes a comment
    Comment.get(id).delete( function(error, result) {
        res.json({
            error: error,
            result: result
        })
    });
};
