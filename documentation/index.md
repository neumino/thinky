---
layout: documentation
---

## Quickstart

### Install

Install via `npm`.

```bash
npm install thinky
```

### Example

Create models with schemas.

```javascript
var thinky = require('thinky')();

// Create a model - the table is automatically created
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String,
    idAuthor: String
}); 

var Author = thinky.createModel("Author", {
    id: String,
    name: String
});

// Join the models
Post.belongsTo(Author, "author", "idAuthor", "id");
```

Save a new post with its author.

```js
// Create a new post
var post = new Post({
    title: "Hello World!",
    content: "This is an example."
});

// Create a new author
var author = new Author({
    name: "Michel"
});

// Join the documents
post.author = author;

post.saveAll().then(function(result) {
    /*
    post = result = {
        id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        title: "Hello World!",
        content: "This is an example.",
        idAuthor: "3851d8b4-5358-43f2-ba23-f4d481358901",
        author: {
            id: "3851d8b4-5358-43f2-ba23-f4d481358901",
            name: "Michel"
        }
    }
    */
});
```

Retrieve the post with its author.

```js
Post.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a")
    .getJoin().then(function(result) {

    /*
    result = {
        id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        title: "Hello World!",
        content: "This is an example.",
        idAuthor: "3851d8b4-5358-43f2-ba23-f4d481358901",
        author: {
            id: "3851d8b4-5358-43f2-ba23-f4d481358901",
            name: "Michel"
        }
    }
    */
});
```

And there is more! Here is a non exhaustive list:

- Enforce schemas.
- Multiple relations: `hasOne`, `belongsTo`, `hasMany` and `hasAndBelongsToMany`.
- Automatically create table and indexes.
- Automatically remove relations when a document is deleted.

Take a look at the <a href="/documentation/thinky">documentation</a> to read more!
