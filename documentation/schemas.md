---
layout: documentation
permalink: /documentation/schemas/
---

## Schemas

Schemas are structures that describe a Model. They are used to validate the
data before saving it.   
It can also specify generate some default values if needed.

A schema in thinky is define with an object that is passed to [thinky.createModel](/documentation/api/thinky/#createmodel).   
Each field of the object maps to a type. The valid types are:

- `String`
- `Boolean`
- `Number`
- `Date`
- `Buffer`
- An object with the fields:
    - `_type` (mandatory): Can be `String`/`Boolean`/`Number`/`Date`/`Object`/`Array`/`Buffer`/`'virtual'`.
    - `schema` (optional): The schema if the field `_type` is `Object` or `Array`.
    - `options` (optional), will overwrite the model's options:
        - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
        - `enforce_extra`: can be `"strict"` to forbid fields not defined in the schema, `"remove"` to remove fields
        not declared in the schema, or `"none"`
        - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`.
    - `default` (optional): can be constant value or a function that will be called with the document as the context.
    - `enum` (optional): An array of _strings_ that represent all the possible values for this fields.
    the document as context.
    - `validator`: A function that will be used to validate a field before saving the document.
    The function should return `true` if the field is valid, `false` otherwise. The function can also
    throw an error.
- An object that is a valid schema.
- An array with one of the previous types.
- `'Point'`: A ReQL object for point
- `'virtual`: the field will never be saved


__Note__: About fields for joined documents:

They should not be declared. The schema of the joined Model will be automatically used.

__Note__: About dates:

There are three valid values for a `Date`:

- A JavaScript Date object - like `new Date()`.
- A ReQL raw date object like:

```js
{
    $reql_type$: "TIME",
    epoch_time: 1397975461.797,
    timezone:"+00:00"
}
```
- An ISO 8601 string like `"2014-04-20T06:32:18.616Z"`.   
This format is the one used when you call `JSON.stringify` on a `Date` (or `toISOString`), which means you can serialize your data between the client
and the server without having to worry about parsing the dates.

__Note__: About points:

You can pass a point as an array `[longitude, latitude]`, an object `{longitude: <number>, latitude: <number>}`, a ReQL object
`r.point(longitude, latitude)`, a GeoJson point `{type: "Point", coordinates: [longitude, latitude]}`

For the moment, `thinky` supports only the geometry point. This is mostly because the most common case from far is to store
locations are points, not polygons/lines.


__Note__: About virtual fields:  

Virtual fields are not saved in the database and thinky will therefore not enforce any type on such fields.


__Note__: About default values:

The default value for a virtual field will be generated once all the other non-virtual values will have been generated.
This is the only guarantee. A default value should not rely on another default value.


__Note__: About options:

The options used to enforce the schema will be the most localized one. That is to say, in order:

- The field's options
- The model's options
- thinky's options


_Example_: Create a basic Model for a `user`.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String,
    email: String,
    age: Number,
    birthdate: Date
})
```

__Note__: About validator:

The reason behind the validator field is that you can import modules that are good at validating data like
[validator](https://github.com/chriso/validator.js).


----------------------


_Example_: Create a model with nested fields.

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

_Example_: Create a model where the field `scores` is an array of `Number`.

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    scores: [Number]
});
```

Another way to do it is with:

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    scores: [{_type: Number}]
});
```

One more is with:

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    scores: {_type: Array, schema: Number}
});
```




_Example_: Create a model where the field `game` is an array of objects with two fields &mdash; `score` and `winner`.

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    game: {_type: Array,
        schema: {score: Number, winner: String}
    }
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

_Example_: Create a model for a user where the nickname, if not defined, will be its first
name.

```js
var Post = thinky.createModel("Post",{
    id: String,
    firstname: String,
    lastname: String,
    nickname: {_type: String, default: function() {
        return this.firstname;
    }}
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

_Example_: Create a model User and make sure that the field email is a valid email
using [validator](https://github.com/chriso/validator.js)

```js
var validator = require('validator');

var User = thinky.createModel("Users",{
    id: String,
    email: {
        _type: String,
        validator: validator.isEmail
    },
    age: Number
});
```


