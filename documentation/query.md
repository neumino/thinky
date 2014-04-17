---
layout: documentation
permalink: query/
---

## Query

A query object is returned when you call `Model[ReQL_method]`. It is an object
that contains two fields
- `_model`: The model that will be used to parse the results if the query
is executed with `run`
- `_query`: A RethinkDB query


<div id="run"></div>
### [run](#run)

<div id="execute"></div>
### [execute](#execute)

<div id="getjoin"></div>
### [getJoin](#getjoin)

```js
query.getJoin(modelToGet) -> query
```

Retrieve all the joined documents of the current query based on the model stored in the
query.
If `modelToGet` is undefined, it will recurse and add all the joined document but it will
not add a document from a model that was previously added.
If you want to force it, you have to manually specifiy the joined documents it has to
retrieve.

_Note_: Chaining `getJoin` on `null` will produce an error since `getJoin` uses the `merge`
command under the hood.


_Example_: Retrieved a document and all its joined documents.

Suppose you have defined two models `Post` and `Author` where a post
belongs to an author.

```js
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String,
    authorId: String
});

var Author = thinky.createModel("Author", {
    id: String,
    name: String
});

Post.belongsTo(Author, "author", "authorId", "id")
```

We can retrieve the post whose `id` is `"0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a"`
with its joined author with:

```js
Post.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin().then(function(result ) {
    console.log(result);
    /* Will log:
     * {
     *    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *    title: "Hello world",
     *    content: "This is the first post",
     *    authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *    author: {
     *        id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *        name: "Michel"
     *    }
     * }
     */
}).error(console.log);
```

_Example_: Retrieved a document and a specific joined documents.

Suppose you have defined many models including `Post` and `Author` where a post
belongs to an author.

```js
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String,
    authorId: String
});

var Author = thinky.createModel("Author", {
    id: String,
    name: String
});

Post.belongsTo(Author, "author", "authorId", "id")

/* More relations are defined on Post
 * Post.hasAndBelongsToMany(Tag, "tags", "id", "id")
 */
```

We can retrieve the post whose `id` is `"0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a"`
with its joined author and not the other joinde documents by manually specifying
the joined documents we want to get.

```js
Post.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({"author": true}).then(function(result ) {
    console.log(result);
    /* Will log:
     * {
     *    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *    title: "Hello world",
     *    content: "This is the first post",
     *    authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *    author: {
     *        id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *        name: "Michel"
     *    }
     * }
     */
}).error(console.log);
```

_Example_: Retrieved a document and a specific joined documents.

Suppose we define a relations `hasAndBelongsToMany` between the same model.

```
User.hasAndBelongsToMany(User, "friends", "id", "id");
```

If we want to retrieve a user and its friends, we must explicitly pass `modelToGet` the value
`{friends: true}`

```js
User.get("").getJoin({friends: true})
```

__TODO nested joins__


__TODO__: Change model

<div id="otherreqlmethods"></div>
### [Other ReQL methods](#otherreqlmethods)

```js
query[reqlMethod] -> query
```

Any method provided by the driver is also available on a Query object. It will
be applied on the field `_query`.

_Example_: Retrieve all the users that are older than 18 years old.

```js
User.filter(function(user) {
    return user("age").ge(18);
}).run().then(function(result) {
    console.log(result);
});
```

_Example_: Count the number of users

```js
User.count().execute().then(function(result) {
    console.log(result);
});
```
