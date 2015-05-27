---
layout: documentation
permalink: /documentation/api/thinky/
---

## thinky

### Import

```js
var thinky = require('thinky')([options]);
var r = thinky.r;
```

The `options` argument is optional and can have the fields:

- Options for the drivers:
    - `min`: the minimum number of connections in the pool, default `50`
    - `max`: the maximum number of connections in the pool, default `1000`
    - `bufferSize`: the minimum number of connections available in the pool, default `50`
    - `timeoutError`: number of milliseconds before reconnecting in case of an error,   
    default `1000`
    - `timeoutGb`: number of milliseconds before removing a connection that has not been used,   
    default `60*60*1000`
    - `host`: host of the RethinkDB server, default `"localhost"`
    - `port`: client port of the RethinkDB server, default `28015`
    - `db`: the default database, default `"test"`
    - `authKey`: the authentification key to the RethinkDB server, default `""`
- Options for the schemas
    - `validate`: can be `"onsave"` or `"oncreate"`. The default value is `"onsave"`
    - `timeFormat`: can be `"native"` or `"raw"`. The default value is `"native"`

All the options for the schemas can be overwritten when creating them.



_Note_: If you import `thinky` multiple times, the models will not be shared
between instances.

_Note_: The following options are deprecated:

- `enforce_missing`: `Boolean`, `true` to forbid missing fields, default: `false`.
- `enforce_extra`: can be `"strict"`, `"remove"` (delete the extra fields on validation), `"none"`, default `"none"`
- `enforce_type`: can be `"strict"`, `"loose"`, `"none"`, default `"loose"`


--------------


<div id="r"></div>
### [thinky.r](#r)

```js
var thinky = require('thinky')();
var r = thinky.r;
```

The `thinky` object keeps a reference to the driver in the property `r`.


_Example_: You need a reference to `r` to specify a descending order.

```js
var p = Post.orderBy({index: r.desc("createdAt")}).run()
```

_Example_: You need a reference to `r` to build a sub-query/predicate.

```js
var p = Post.filter(function(post) {
    return r.expr([1,2,3,4]).contains(post("id"))
}).run()
```


_Example_: You can use `r` to run any query like you would with the driver.

```js
var p = r.table("posts").count().run()
```

--------------


<div id="errors"></div>
### [thinky.Errors](#errors)

```js
var thinky = require('thinky')();
var Errors = thinky.Errors;
```

Custom errors created by `thinky`. For now the only error that thinky will
create is a `DocumentNotFound`, and is triggered when a query returns `null`
while it expects to get back a full document.


_Example_: Retrieve a document with its primary key and print a message
if the document was not found.

```js
Post.get(1).run().then(function(post) {
    // Do something with the post
}).catch(Errors.DocumentNotFound, function(err) {
    console.log("Document not found");
}).error(function(error) {
    // Unexpected error
});
```

--------------


<div id="query"></div>
### [thinky.Query](#query)

```js
var thinky = require('thinky')();
var r = thinky.r;
var Query = thinky.Query;
```

Let you create a query that does not start with `r.table("...")`.


_Example_: Create a query that returns `Users`.

```js
var query = new Query(User, r);
query.expr([1,2,3]).map(function(id) {
    return r.table(User.getTableName()).get(id)
}).run().then(function(result) {
    // result is an array of Users
}).error(console.log);
```


--------------


<div id="createmodel"></div>
### [thinky.createModel](#createmodel)

```js
var model = thinky.createModel(tableName, schema, options);
```

Create a model.

The arguments are:

- `tableName` is the name of the table used for the model.   
It must be a string composed of `[a-zA-Z0-0_]`.    
Two models cannot be created with the same `tableName`.
- `schema` which must be a valid schema.  
Read more about schemas on [this article](/documentation/schemas/)
- `options` can be an object with the fields:
    - `pk`: the primary key of the table.   
    If the primary key is not `"id"`, the `pk` field is __mandatory__.
    - `enforce_missing`: `Boolean`, `true` to forbid missing fields, default `"false"`.
    - `enforce_extra`: can be `"strict"`, `"remove"` (delete the extra fields on validation), `"none"`, default `"none"`
    - `enforce_type`: can be `"strict"`, `"loose"` or `"none"`.
    - `validator`: A function that will be used to validate a document before saving it. The context is set to the whole document.

Read more about `enforce_missing`/`enforce_extra`/`enforce_type` on [the article](/documentation/schemas/) about schemas.

_Example_: Create a basic Model for a `user`.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string(),
    email: type.string(),
    age: type.number(),
    birthdate: Date
})
```

_Example_: Create a model with nested fields

```js
var User = thinky.createModel("User", {
    id: type.string(),
    contact: {
        email: type.string(),
        phone: type.string()
    },
    age: type.number()
});
```

_Example_: Create a model where the field `"scores"` is an array of `Number`.

```js
var Game = thinky.createModel("Game", {
    id: type.string(),
    name: type.string(),
    scores: [type.number()]
});
```


_Example_: Create a model for a post where the default value for `createdAt` is the
current date if not specified.

```js
var Post = thinky.createModel("Post",{
    id: type.string(),
    title: type.string(),
    content: type.string(),
    createdAt: type.date().default(r.now())}
});
```

_Example_: Create a model for a user where the nickname, if not defined, will be its first
name.

```js
var Post = thinky.createModel("Post",{
    id: type.string(),
    firstname: type.string(),
    lastname: type.string(),
    nickname: type.string().default(function() {
        return this.firstname;
    })
});
```

_Example_: Create a model for a `post` where the field `title` must be a `String`
(where `null` will not be a valid value).

```js
var Post = thinky.createModel("Post",{
    id: type.string(),
    title: {_type: type.string(), enforce_type: "strict"},
    content: type.string(),
    createdAt: type.date().default(r.now())
});
```
