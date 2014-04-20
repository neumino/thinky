---
layout: documentation
permalink: document/
---

## Document

A document is returned from calling `new` on a [Model](/documentation/api/model/).


<div id="getmodel"></div>
### [getModel](#getmodel)

```
document.getModel() -> Model
```

Return the constructor of this document.

_Example_: Get the constructor of a post document and create a new one.

```js
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String,
    authorId: String
});

var post = new Post({
    title: "Hello",
    content: "First post."
});

var Model = post.getModel();
// Model === Post

var newPost = new Model({
    title: "New post",
    content: "More content."
});
```

_Example_: Get the name of the table where the document is stored.

```js
post.getModel().getTableName();
```

--------------

<div id="merge"></div>
### [merge](#merge)

```
document.merge(doc);
```

Merge `doc` in the `document`.  
This is especially useful when you need to update a document with partial data before saving it.

_Example_: Update a user.

```js
var data = req.body; // Data posted by the user
Post.get(data.id).run().then(function(post) {
    post.merge(data).save().then(function(result) {
        // post was updated with `data`
    });
});
```

--------------

<div id="validate"></div>
### [validate](#validate)

```
document.validate([modelToValidate, options]);
```

The method `validate` is called before saving a document.
Return the constructor of this document.

The arguments are all optionals:

- `modelToValidate`: the joined documents that should be validated.
- `options` can be an object with the fields:
    - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
    - `enforce_extra`: `Boolean`, `true` to forbid fields not defined in the schema.
    - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`  
    It will overwrite the options set on the document, but not the one set on the
    schema.


If the model's option `validate` is set to `"oncreate"`, the method `validate` will
also be executed every time a new document is created.

_Example_: Validate a new user.

```js
try{
    user.validate()
}
catch(err) {
    console.log("The user is not valid."); 
}
```

--------------

<div id="save"></div>
### [save](#save)

```
document.save() -> Promise
```

Save the document but not the joined ones.

If you want to also save the joined documents, use [saveAll](#saveAll).

The promise will be resolved with the document and the document will
be updated in place.


_Example_: Save a new user.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
})

var user = new User({
    name: "Michel"
});

user.save().then(function(doc) {
    /*
     * doc === user
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel"
     * }
     */
});
```

--------------

<div id="saveall"></div>
### [saveAll](#saveall)

```
document.saveAll([modelToSave]) -> Promise
```

Save the document and the joined document.
The joined documents will be saved in the appropriate order and the foreign key values
will be set.

By default, if `modelToSave` is not provided, `saveAll` will keep recursing and will
save all the joined documents.   
To avoid infinite recursion, `saveAll` will not recurse in a field that contains a document from
a model that was previously saved.

The option `modelToSave` can be an object where each field is a joined document that will also be saved.

The promise will be resolved with the document and the document will
be updated in place.


_Example_: Save a user and its account.

Suppose the models `User` and `Account` are linked with a
"hasOne" relation.

```
var User = thinky.createModel("User", {
    id: String,
    name: String
});

var Account = thinky.createModel("Account", {
    id: String,
    userId: String,
    sold: Number
});

User.hasOne(Account, "account", "id", "userId")
```

Save

```js
var user = new User({
    name: "Michel",
    account: {
        sold: 2420
    }
})

user.saveAll().then(function(result) {
    /*
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }
     * }
     */
});
```

_Example_: Save a user and its account.

Suppose the models `User` and `Account` are linked with a
"hasOne" relation.

```
var User = thinky.createModel("User", {
    id: String,
    name: String
});

var Account = thinky.createModel("Account", {
    id: String,
    userId: String,
    sold: Number
});

User.hasOne(Account, "account", "id", "userId")
```

Save the two documents. The `user` is saved first.

```js
var user = new User({
    name: "Michel",
    account: {
        sold: 2420
    }
})

user.saveAll().then(function(result) {
    /* result === user
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }
     * }
     */
});
```

_Example_: Save a document and a joined document with `belongsTo`.

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

Savet the two documents. The `author` is saved first.

```js
var post = new Post({
    {
        title: "Hello world",
        content: "This is the first post",
        author: {
            name: "Michel"
        }
    }
});

post.save().then(function(result) {
    /* result === post
     * post = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     title: "Hello world",
     *     content: "This is the first post",
     *     authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *     author: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         name: "Michel"
     *     }
     * }
     */
});
```

_Example_: Save a user and all its friends.

```js
var User = thinky.createModel("Post", {
    id: String,
    name: String
});

User.hasAndBelongsToMany(User, "friends", "id", "id")

var michel = new User({
    name: "Michel"
});
var marc = new User({
    name: "Marc"
});
var sophia = new User({
    name: "Sophia"
});
var ben = new User({
    name: "Ben"
});

michel.friends = [marc, sophia, ben]
```

Because the field `friends` contains instances of `User` and
that `michel` is also an instance of `User`, we must explicitly
specify the field `friends` in `modelToSave`.

```js
michel.saveAll({friends: true}).then(function(result) {
    {
        id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        name: "Michel",
        email: "michel@example.com",
        friends: [
            {
                id: "3851d8b4-5358-43f2-ba23-f4d481358901",
                name: "Marc",
                email: "marc@example.com"
            }, {
                id: "706f7730-8f28-4e57-8555-255b0746919b",
                name: "Sophia",
                email: "sophia@example.com"
            }, {
                id: "18cadb27-54b6-41ab-b6e2-e1c49603e82f",
                name: "Ben",
                email: "ben@example.com"
            }
        ]
    }
});
```

--------------

<div id="issaved"></div>
### [isSaved](#issaved)
```
document.isSaved() -> Boolean
```

Return whether the document is saved in the database.

_Example_: Get the constructor of a post document and create a new one.

```js
var post = new Post({
    title: "Hello",
    content: "First post."
});

post.isSaved(); // false

post.save().then(function() {
    post.isSaved(); // true
});
```


--------------

<div id="delete"></div>
### [delete](#delete)
```
document.delete() -> Promise
```

Delete a document from the database.

The `delete` method does not delete the joined documents, but  may update them if:

- they were created in relation with the current document (via `getJoin`, `saveAll` etc.)
- they contain a foreign key that links to the document being deleted.

If you want to delete the joined documents too, use [deleteAll](#deleteall).


_Example_: Delete a single document.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
})

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").then(function(user) {
    user.delete().then(function(result) {
        // user === result
        // user was deleted from the database
        user.isSaved(); // false
    });
});
```

_Example_: Delete a single document and update a joined document.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
});

var Account = thinky.createModel("Account", {
    id: String,
    userId: String,
    sold: Number
});

User.hasOne(Account, "account", "id", "userId")

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin().run()
    .then(function(user) {

    /*
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }
     * }
     */
    user.delete().then(function(result) {
        user.isSaved(); // false;
        account.isSaved(); // true;
        /*
         * user.account = {
         *     id: "3851d8b4-5358-43f2-ba23-f4d481358901",
         *     sold: 2420
         * }
         */
        Account.get("3851d8b4-5358-43f2-ba23-f4d481358901").run()
            .then(function(account) {

            /*
             * account = {
             *     id: "3851d8b4-5358-43f2-ba23-f4d481358901",
             *     sold: 2420
             * }
             */
        });
    });
});

```

--------------

<div id="deleteall"></div>
### [deleteAll](#deleteall)
```
document.deleteAll([modelToDelete]) -> Promise
```

Delete a document from the database and all the joined documents it has that are
currently linked with it.

By default, if `modelToDelete` is not provided, `deleteAll` will keep recursing and will
delete all the joined documents.   
To avoid infinite recursion, `deleteAll` will not recurse in a field that contains a document from
a model that was previously deleted.

The option `modelToDelete` can be an object where each field is a joined document that will also be deleted.

The promise will be resolved with the document.

To delete joined documents that are not directly linked to the document but could
be in the database, use [purge](#purge).



_Example_: Delete a single document and its account.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
});

var Account = thinky.createModel("Account", {
    id: String,
    userId: String,
    sold: Number
});

User.hasOne(Account, "account", "id", "userId")

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin()
    .run().then(function(user) {

    /*
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }
     * }
     */
    user.delete().then(function(result) {
        // result === user
        user.isSaved(); // false;
        account.isSaved(); // false;
    });
});
```

_Example_: Delete a user and all its friends.

```js
var User = thinky.createModel("Post", {
    id: String,
    name: String
});

User.hasAndBelongsToMany(User, "friends", "id", "id")

var michel = new User({
    name: "Michel"
});
var marc = new User({
    name: "Marc"
});
var sophia = new User({
    name: "Sophia"
});
var ben = new User({
    name: "Ben"
});

michel.friends = [marc, sophia, ben]
```

Because the field `friends` contains instances of `User` and
that `michel` is also an instance of `User`, we must explicitly
specify the field `friends` in `modelToDelete`.

```js
Users.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").run().then(function(michel) {
    /*
     * {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     email: "michel@example.com",
     *     friends: [
     *         {
     *             id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *             name: "Marc",
     *             email: "marc@example.com"
     *         }, {
     *             id: "706f7730-8f28-4e57-8555-255b0746919b",
     *             name: "Sophia",
     *             email: "sophia@example.com"
     *         }, {
     *             id: "18cadb27-54b6-41ab-b6e2-e1c49603e82f",
     *             name: "Ben",
     *             email: "ben@example.com"
     *         }
     *     ]
     * }
     */

     user.deleteAll({friends: true}).then(function(result) {
        // michel, marc, sophia and ben are deleted from the database
     });
});
```


--------------

<div id="purge"></div>
### [purge](#purge)

```
document.purge() -> Promise
```

Delete a document and will run a range update on the database to remove all
the references to the current document.
Joined documents that were not retrieved will also be updated.

The point of this method is to keep your data consitent.

The promise will be resolved with the document.

_Example_: Delete a user and make sure that no reference to it still exists in
the database.


```js
var User = thinky.createModel("Post", {
    id: String,
    name: String
});

User.hasAndBelongsToMany(User, "friends", "id", "id")

var michel = new User({
    name: "Michel"
});
var marc = new User({
    name: "Marc"
});
var sophia = new User({
    name: "Sophia"
});
var ben = new User({
    name: "Ben"
});

michel.friends = [marc, sophia, ben]

michel.saveAll().then(function(michel) {
    User.get(michel.id).then(function(michel) {
        // michel.friends === undefined
        michel.purge().then(function(michel) {
            // michel is deleted
            // marc, sophia and ben relations with michel have been deleted 
        }):
    }):
});
```


<div id="eventemittersmethods"></div>
### [EventEmitter's methods](#eventemittersmethods)

All the methods defined on
[EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter)
are available on a model.

The events that can be emited are:

- `"saving"`: just before a document is saved
- `"save"`: once a document is saved
- `"delete"`: once a document is deleted

__TODO__ Rename save to saved.
