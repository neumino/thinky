---
layout: documentation
permalink: thinky/
---

## Thinky

### Import
```
var thinky = require('thinky')([options])
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
- Options for the schema
    - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
    - `enforce_extra`: `Boolean`, `true` to forbid fields not defined in the schema.
    - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`
- Options for thinky
    - `timeFormat`: can be `"native"` or `"raw"`. The default value is `"native"`
    - `validate`: can be `"onsave"` or `"oncreate"`. The default value is `"onsave"`


--------------


<div id="r"></div>
### [thinky.r](#r)

```js
var r = thinky.r;
```

The `thinky` object keeps a reference to the driver in the property `r`.


_Example_: You need a reference to `r` to specify a descending order.

```js
var p = Post.orderBy({index: r.desc("createdAt")}).run()
```

_Example_: You can use `r` to run any query like you would with the driver.

```js
var p = r.table("posts").count().run()
```



--------------


<div id="createmodel"></div>
### [thinky.createModel](#createmodel)

```js
var model = thinky.createModel(tableName, schema, options);
```

Create a model.

The argument `tableName` must be a string composed of `[a-zA-Z0-0_]`.
Two models cannot be created with the same `tableName`.


The schema is represented with an object where each field maps to a type.  
The valid types are:

- `String`
- `Boolean`
- `Number`
- `Date`
- An object with the fields:
    - `_type` (mandatory): Can be `String`/`Boolean`/`Number`/`Date`/`Object`/`Array`
    - `schema` (optional): The schema if the field `_type` is `Object` or `Array`
    - `options` (optional):
        - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
        - `enforce_extra`: `Boolean`, `true` to forbid fields not defined in the schema.
        - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`
    - `default` (optional): can be constant value or a function that will be called with
    the document as context.
- An object that is a valid schema
- An array with one of the previous type


`options` can be an object with the fields:

- `enforce_missing`: `Boolean`, `true` to forbid missing fields.
- `enforce_extra`: `Boolean`, `true` to forbid fields not defined in the schema.
- `enforce_type`: can be `"strict"`, `"loose"`, `"none"`
- `pk`: the primary key of the table. If the primary key is not `"id"`, the `pk`
field is mandatory.

_Example_: Create a basic Model for a `post`.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String,
    email: String,
    age: Number,
    birthdate: Date
})
```

_Example_: Create a model with nested fields

```js
var User = thinky.createModel("User", {
    id: String,
    contact: {
        email: String,
        phone: String
    },
    age: Number
});
```

_Example_: Create a model where the field "scores" is an array of `Number`.

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    scores: [Number]
});
```


_Example_: Create a model for a post where the default value for `createdAt` is the
current date if not specified.

```js
var Post = thinky.createModel("Post",{
    id: String,
    title: String,
    content: String,
    createdAt: {_type: String, default: r.now()}
});
```

_Example_: Create a model for a `post` where the field `title` must be a `String`
(where `null` will not be a valid value).

```js
var Post = thinky.createModel("Post",{
    id: String,
    title: {_type: String, enforce_type: "strict"},
    content: String,
    createdAt: {_type: String, default: r.now()}
});
```



