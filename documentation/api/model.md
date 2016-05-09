---
layout: documentation
permalink: /documentation/api/model/
---

## Model

A model is returned from [thinky.createModel](/documentation/api/thinky/#createmodel)


<div id="gettablename"></div>

### [getTableName](#gettablename)

```js
Model.getTableName();
```

Return the name of the table used for this model.


_Example_: Return the name of table used for `PostModel`.

```js
var PostModel = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    author: type.string()
});

PostModel.getTableName(); // returns "Post"
```

--------------

<div id="define"></div>

### [define](#define)

```js
Model.define(key, fn);
```

Define a function that documents will be available for documents of this Model.


_Example_: Add a method `isAdult` on `Users`.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    age: type.number()
});

User.define("isAdult", function() {
    return this.age > 18;
});

var kid = new User({age: 12});
kid.isAdult(); // false

var grownup = new User({age: 23});
grownup.isAdult(); // true
```

--------------

<div id="defineStatic"></div>

### [defineStatic](#defineStatic)

```js
Model.defineStatic(key, fn);
```

Define a function that will be available for this Model and on its query.


_Example_: Add a method `getView` on `Users` to never return the password.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    age: type.number(),
    password: type.string()
});

User.defineStatic("getView", function() {
    return this.without('password');
});

User.get(1).getView().run().then(user) {
    /// user.password === undefined
}).error(function(err) {
    // Handle error
});
```



--------------

<div id="ensureindex"></div>

### [ensureIndex](#ensureindex)

```js
Model.ensureIndex(name, fn, options);
```

Ensure that an index named `"name"` exists.
If it does not, it will create an index based on the name and the function `fn` provided.

If `fn` is undefined, the index will be built on the field `"name"`.

The argument `options` can be `{multi: true}`.

_Example_: Ensure that an index on the field `"createdAt"` exists.

```js
var Posts = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string(),
    createdAt: Date
});

Posts.ensureIndex("createdAt")
```

_Example_: Ensure that an index on the concatenation of `"firstName"` and `"lastName"` exists.

```js
var Users = thinky.createModel("User", {
    id: type.string(),
    firstName: type.string(),
    lastName: type.string()
});

Users.ensureIndex("fullName", function(doc) {
    return doc("firstName").add(doc("lastName"));
})
```




--------------



<div id="hasone"></div>

### [hasOne](#hasone)
```js
Model.hasOne(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "has one" relation between two models. The foreign key is
`rightKey` and will be stored in `OtherModel`.  

If you want to store the foreign key on the model creating the relation, use [belongsTo](#belongsto).   
Do not use the primary key of `OtherModel` as the right key.


The arguments are:

- `OtherModel`: the joined model.
- `fieldName`: the field where the joined document will be stored.
- `leftKey`: the field of `Model` used to perform the join.
- `rightKey`: the field of `OtherModel` used to perform the join.
- `options`: set the field `init` to `false` if the indexes
were already created and do not want `thinky` to try to create them.

Read more about `hasOne` on [the article](/documentation/relations/) dedicated to relations.

_Example_:

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});

var Account = thinky.createModel("Account", {
    id: type.string(),
    userId: type.string(),
    sold: type.number()
});

User.hasOne(Account, "account", "id", "userId")
```

A user with its joined account will look like:

```js
{
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    name: "Michel",
    account: {
        id: "3851d8b4-5358-43f2-ba23-f4d481358901",
        userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        sold: 2420
    }
}
```

--------------

<div id="belongsto"></div>

### [belongsTo](#belongsto)
```js
Model.belongsTo(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "belongs to" relation between two models. The foreign key is
`leftKey` and will be stored in `Model`.

If you want to store the foreign key on the joined model, use [hasOne](#hasone).

The arguments are:

- `OtherModel`: the joined model.
- `fieldName`: the field where the joined document will be stored.
- `leftKey`: the field of `Model` used to perform the join.
- `rightKey`: the field of `OtherModel` used to perform the join.
- `options`: set the field `init` to `false` if the indexes
were already created and do not want `thinky` to try to create them.


Read more about `belongsTo` on [the article](/documentation/relations/) dedicated to relations.   
Do not use the primary key of `Model` as the left key.


_Example_:

```js
var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string(),
    authorId: type.string()
});

var Author = thinky.createModel("Author", {
    id: type.string(),
    name: type.string()
});

Post.belongsTo(Author, "author", "authorId", "id")
```

A post with its joined author will look like:

```js
{
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    title: "Hello world",
    content: "This is the first post",
    authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
    author: {
        id: "3851d8b4-5358-43f2-ba23-f4d481358901",
        name: "Michel"
    }
}
```


--------------

<div id="hasmany"></div>

### [hasMany](#hasmany)
```js
Model.hasMany(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "has many" relation between two models where the reciprocal relation
is a "belongs to".  
The foreign key is `rightKey` and will be stored in `OtherModel`.  

If you need a "many to many" relation between two models, use [hasAndBelongsToMany](#hasAndBelongsToMany).   
Do not use the primary key of `OtherModel` as the right key.


The arguments are:

- `OtherModel`: the joined model.
- `fieldName`: the field where the joined document will be stored.
- `leftKey`: the field of `Model` used to perform the join.
- `rightKey`: the field of `OtherModel` used to perform the join.
- `options`: set the field `init` to `false` if the indexes
were already created and do not want `thinky` to try to create them.


Read more about `hasMany` on [the article](/documentation/relations/) dedicated to relations

_Example_:

```js
var Author = thinky.createModel("Author", {
    id: type.string(),
    name: type.string()
});

var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string(),
    authorId: type.string()
});

Author.hasMany(Post, "posts", "id", "authorId")
```

A user with its joined posts will look like:

```js
{
    id: "3851d8b4-5358-43f2-ba23-f4d481358901",
    name: "Michel",
    posts:[
        {
            id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
            title: "Hello world",
            content: "This is the first post",
            authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
        }, {
            id: "706f7730-8f28-4e57-8555-255b0746919b",
            title: "Second post",
            content: "This is the second post",
            authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
        }, {
            id: "18cadb27-54b6-41ab-b6e2-e1c49603e82f",
            title: "One more post",
            content: "This is the third post",
            authorId: "3851d8b4-5358-43f2-ba23-f4d481358901",
        }
    ]
}
```

--------------

<div id="hasandbelongstomany"></div>

### [hasAndBelongsToMany](#hasAndBelongsToMany)

```js
Model.hasAndBelongsToMany(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "has and belongs to many" relation between two models where the reciprocal relation
is another "has and belongs to many".  

If you need a "one to many" relations between two models, use [hasMany](#hasMany) and [belongsTo](#belongsto).

The join is done via a third table that is automatically created and managed by thinky.

- `OtherModel`: the joined model.
- `fieldName`: the field where the joined document will be stored.
- `leftKey`: the field of `Model` used to perform the join.
- `rightKey`: the field of `OtherModel` used to perform the join.
- `options`:
  - set the field `init` to `false` if the indexes were already created and do not want `thinky` to try to create them.
  - set the field `type` to a string to differentiate two n-n relations for the same two models.
You can also specify a string for `type` which will be used to differentiate
the table if you link multiple times the same mdoels.

We __highly recommend__ to use the primary keys for the fields used to perform the join.  
If you do not, read carefully [the article](/documentation/relations/) dedicated to relations


_Example_: Link two models with `hasAndBelongsTo`.

```js
var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string()
});
var Tag = thinky.createModel("Tag", {
    id: type.string(),
    tag: type.string()
});

Post.hasAndBelongsToMany(Tag, "tags", "id", "id")
```

A post with its joined tags will look like:

```js
{
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    title: "Hello world",
    content: "This is the first post",
    tags: [
        {
            id: "3851d8b4-5358-43f2-ba23-f4d481358901",
            tag: "test"
        }, {
            id: "706f7730-8f28-4e57-8555-255b0746919b",
            tag: "blog"
        }, {
            id: "18cadb27-54b6-41ab-b6e2-e1c49603e82f",
            tag: "random"
        }
    ]
}
```

_Note_: The links saved in the database are hidden from the result.

_Example_: Link two models with `hasAndBelongsTo` both ways.

```js
var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string()
});
var Tag = thinky.createModel("Tag", {
    id: type.string(),
    tag: type.string()
});

Post.hasAndBelongsToMany(Tag, "tags", "id", "id")
Tag.hasAndBelongsToMany(Post, "posts", "id", "id")
```

A post with its joined tags will look like:

```js
{
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    title: "Hello world",
    content: "This is the first post.",
    tags: [
        {
            id: "3851d8b4-5358-43f2-ba23-f4d481358901",
            tag: "test"
        }, {
            id: "706f7730-8f28-4e57-8555-255b0746919b",
            tag: "blog"
        }, {
            id: "18cadb27-54b6-41ab-b6e2-e1c49603e82f",
            tag: "random"
        }
    ]
}
```

A tag with its joined posts will look like:

```js
{
    id: "3851d8b4-5358-43f2-ba23-f4d481358901",
    tag: "test"
    posts: [
    {
        id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        title: "Hello world",
        content: "This is the first post.",
    }, {
        id: "eaed7d80-5205-488c-aedc-eb91e9f77d6b",
        title: "Second test",
        content: "Trying another post.",
    }
    ]
}
```


_Example_: Link documents of the same models between them.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string(),
    email: type.string()
});

User.hasAndBelongsToMany(User, "friends", "id", "id")
```

A user with its friends will look like:

```js
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
```


_Example_: Use `type` to create multiple relations.

```js
var Class = thinky.createModel("Class", {
    id: type.string(),
});
var People = thinky.createModel("People", {
    id: type.string(),
    name: type.string()
});

Class.hasAndBelongsToMany(People, "teachers", "id", "id", {type: "teacher"})
People.hasAndBelongsToMany(Class, "classes", "id", "id", {type: "teacher"})

Class.hasAndBelongsToMany(People, "students", "id", "id", {type: "student"})
People.hasAndBelongsToMany(Class, "classes", "id", "id", {type: "student"})
```


--------------

<div id="pre"></div>
### [pre](#pre)

```js
Model.pre(event, hook)
```

Add a hook that will be execcuted just before an event. The available pre-hooks are
`save`, `delete`, `validate`.

The argument `hook` is a function that takes no argument if it is synchrone. If it as asynchrone,
it takes exactly one argument `function(next) { ... }`. Call `next` when the hook is
executed, and call it with an error if you want the current event to be aborted.
The context of the hook will be set to the document triggering the event.

__Note 1__: The method `Document.validate` is by default synchronous but will become asynchronous
if an asynchonous hook is set on `validate` (and therefore will return a promise).

__Note 2__: If you set the option `validate` to `oncreate` for a Model, `new Model(...)` will
return a promise. This behavior is probably not something you want.


_Example_: Make sure that the age of a user is greater than 18 before saving a document.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    age: type.number()
});
User.pre('save', function(next) {
    if (this.age < 18) {
        next(new Error("A user must be at least 18 years old."));
    }
    else {
        next();
    }
});
```

_Example_: Make sure that the website of of a user works.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    website: type.string()
});
User.pre('save', true, function(next) {
    var self = this;
    r.http(self.website).run().then(function() {
        next();
    }).error(next);
});
```

--------------

<div id="post"></div>
### [post](#post)

```js
Model.post(event, hook)
```

Add a hook that will be execcuted just after an event. The available post-hooks are
`save`, `delete`, `validate`, `init`, `retrieve`.

The argument `hook` is a function that takes no argument if it is synchrone. If it as asynchrone,
it takes exactly one argument `function(next) { ... }`. Call `next` when the hook is
executed, and call it with an error if you want the current event to be aborted.
The context of the hook will be set to the document triggering the event.

__Note 1__: The method `Document.validate` is by default synchronous but will become asynchronous
if an asynchonous hook is set on `validate` (and therefore will return a promise).

__Note 2__: If you set an asynchronous hook for `init`, `new Model(...)` will return a
promise. This behavior is probably not something you want.   
If you want to set a hook only when a document is retrieved from the database, use the
event `retrieve`.


_Example_: Add an extra field `isAdult` but do not save it in the database.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    age: type.number()
});
User.pre('save', function(next) {
    delete this.isAdult;
    next();
});
User.post('save', function(next) {
    this.isAdult = this.age >= 18;
    next();
});
User.post('init', function(next) {
    this.isAdult = this.age >= 18;
    next();
});
```


--------------

<div id="save"></div>
### [save](#save)

```js
Model.save(object, options) -> Promise
Model.save(array, options) -> Promise
```


Insert documents in the database.
If an array of documents is provided, `thinky` will execute a batch insert with only
one `insert` command. The object `options` can be the options provided to `insert`,
that is to say `{conflict: 'error'/'replace'/'update'}`.

If one error is produced by the server, the promise will be rejected.

_Note_: This method does not save joined documents and does not perform an update
like `document.save()` can.


_Example_: Insert 3 new users at the same time.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});

User.save([
    {name: "Michel"},
    {name: "John"},
    {name: "Jessie"}
]).then(function(result) {
    // Michel, John and Jessie are saved
}).error(function(error) {
    // Handle error
});

```



--------------

<div id="querysmethods"></div>
### [Query's methods](#querysmethods)

All the methods defined on a [Query](/documentation/api/query/) object are also available on a Model.

In terms of `Query`, a model is equivalent to

```js
r.table(model.getTableName())
```

_Example_: Returns all the posts using [run](/documentation/api/query/#run).

Suppose the model `Post` is defined with:

```js
var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string()
})
```


Retrieve all the posts.

```js
Post.run().then(function(posts) {
    // `posts` is an array of all the posts.
});
```


Order all the posts with the field `createdAt`.

```js
Post.orderBy({index: {createdAt}).run().then(function(posts) {
    // `posts` is an array of all the posts order by date
});
```


Map each post to its title.

```js
Post.map(function(post) {
    return post("title")
}).execute().then(function(posts) {
    // `posts` is an array of all the titles
});
```


--------------

<div id="eventemittersmethods"></div>
### [EventEmitter's methods](#eventemittersmethods)

All the methods defined on
[EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter)
are available on a model.

The events that can be emited are:
- `"ready"`: when the table and all the indexes are created.
- `"retrieved"`: when a document is retrieved from the database.


_Example_: Log when a table is ready to use:

```js
var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string(),
    authorId: type.string()
});

Post.addListener('ready', function(model) {
    console.log("Table "+model.getTableName()+" is ready");
});
```

_Example_: Update a document every time it is retrieved from the database with
a field "retrieved" mapped to the current date.

```js
Post.addListener('retrieved', function(doc) {
    doc.retrieved = new Date();
});
```

--------------

<div id="doceventemittersmethods"></div>
### [EventEmitter's methods for documents](#doceventemittersmethods)

All the methods defined on
[EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) are available
on a [document](/documentation/api/document/).

For convenience purposes, you can define listeners on the model that will be transmitted on each
newly created documents. All the methods are the same as in EventEmitter, except that they
are prefixed with `"doc"` (using camelCase).

The events that can be emited on a document are:

- `"saving"`: just before a document is saved
- `"saved"`: once a document is saved
- `"delete"`: once a document is deleted


_Example_: Log every post that we save in the database.

```js
var Post = thinky.createModel("Post", {
    id: type.string(),
    title: type.string(),
    content: type.string(),
    authorId: type.string()
});

Post.docAddListener('save', function(post) {
    console.log("A new post has been saved.");
    console.log("Saved post'id: "+post.id);
});

var post = new Post({
    title: "Hello",
    content: "First post."
});

post.save().then(function) {
    // A message has been logged.
}).error(console.log);
```
