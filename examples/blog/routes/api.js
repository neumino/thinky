// Import
var config = require(__dirname+'/../config.js');
var thinky = require('thinky')(config);
var r = thinky.r;
var type = thinky.type;

// Create the models
// Note: if we don't provide the field date, the default function will be called
var Post = thinky.createModel('Post', {
    id: type.string(),
    title: type.string(),
    text: type.string(),
    authorId: type.string(),
    date: type.date().default(r.now)
});
var Author = thinky.createModel('Author', {
    id: type.string(),
    name: type.string(),
    email: type.string(),
    website: type.string()
});
var Comment = thinky.createModel('Comment', {
    id: type.string(),
    name: type.string(),
    comment: type.string(),
    postId: type.string(),
    date: type.date().default(r.now())
});


// Specify the relations

// A post has one author that we will keep in the field `author`.
Post.belongsTo(Author, "author", "authorId", "id");
Author.hasMany(Post, "posts", "id", "authorId");

// A post has multiple comments that we will keep in the field `comments`.
Post.hasMany(Comment, "comments", "id", "postId");
Comment.belongsTo(Post, "post", "postId", "id");


// Make sure that an index on date is available
Post.ensureIndex("date");
Author.ensureIndex("name");


// Retrieve a list of posts ordered by date with its author and comments
exports.posts = function (req, res) {
    Post.orderBy({index: r.desc('date')}).getJoin({author: true, comments: {_order: "date"}}).run().then(function(posts) {
        res.json({
            posts: posts
        });
    }).error(handleError(res));
};


// Retrieve one post with its author and comments
exports.post = function (req, res) {
    var id = req.params.id;
    Post.get(id).getJoin({author: true, comments: {_order: "date"}}).run().then(function(post) {
        res.json({
            post: post
        });
    }).error(handleError(res));
};


// Retrieve a post and all the available authors
exports.postAndAuthors = function (req, res) {
    var id = req.params.id;
    Post.get(id).run().then(function(post) {
        Author.run().then(function(authors) {
            res.json({
                post: post,
                authors: authors
            });
        }).error(handleError(res));
    }).error(handleError(res));
};


// Save a post in the database
exports.addPost = function (req, res) {
    var newPost = new Post(req.body);

    newPost.save().then(function(result) {
        res.json({
            result: result
        });
    }).error(handleError(res));
};


// Delete a post and its comments from the database
exports.deletePost = function (req, res) {
    var id = req.params.id;

    // Delete a post and all its comments
    Post.get(id).getJoin({comments: true}).run().then(function(post) {
        post.deleteAll({comments: true}).then(function(result) {
            res.json({
                result: result
            });
        }).error(handleError(res));
    }).error(handleError(res));
};


// Update a post in the database
exports.editPost = function (req, res) {
    Post.get(req.body.id).run().then(function(post) {
        post.title = req.body.title;
        post.text = req.body.text;
        post.authorId = req.body.authorId;
        post.save().then(function(post) {
            res.json({
                post: post
            });
        }).error(handleError(res));
    }).error(handleError(res));
};


// Retrieve all authors
exports.authors = function (req, res) {
    Author.orderBy({index: 'name'}).run().then(function(authors) {
        res.json({
            authors: authors
        });
    }).error(handleError(res));
};


// Retrieve one author
exports.author = function (req, res) {
    var id = req.params.id;

    Author.get(id).run().then(function(author) {
        res.json({
            author: author
        });
    }).error(handleError(res));
};


// Save an author in the database
exports.addAuthor = function (req, res) {
    var author = new Author(req.body);

    author.save().then(function(result) {
        res.json({
            result: result
        });
    }).error(handleError(res));
};


// Delete an author
exports.deleteAuthor = function (req, res) {
    var id = req.params.id;

    // Delete an author and update all the post referencing the author
    Author.get(id).getJoin({posts: true}).run().then(function(author) {
        author.delete().then(function(author) {
            res.json({
                result: author
            })
        }).error(handleError(res));
    }).error(handleError(res));
};


// Edit an author
exports.editAuthor = function (req, res) {
    // Update an author
    Author.get(req.body.id).update(req.body).run().then(function(author) {
        res.json({
            author: author
        })
    }).error(handleError(res));
};


// Add a comment
exports.addComment = function (req, res) {
    var newComment = new Comment(req.body);

    newComment.save().then(function(error, result) {
        res.json({
            error: error,
            result: result
        });
    });
};


// Delete comment
exports.deleteComment = function (req, res) {
    var id = req.params.id;

    // We can directly delete the comment since there is no foreign key to clean
    Comment.get(id).delete().execute().then(function(error, result) {
        res.json({
            error: error,
            result: result
        })
    });
};

function handleError(res) {
    return function(error) {
        console.log(error.message);
        return res.send(500, {error: error.message});
    }
}
