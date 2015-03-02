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
- `Object` with `{...}`
- `Array` with `[...]`
- `"Point"`
- `"virtual"`

There are two more ways to define a type, one is via the methods in `thinky.type`
(referred as `thinky.type`). You can create the previous type this way:

- `type.string()` for a `String`. Additional methods that you can chain for this type are:
  - `min(number)`: set the minimum length of the string
  - `max(number)`: set the maximum length of the string
  - `length(number)`: set the length of the string
  - `alphanum()`: requires the string to be alphanumeric (`[a-zA-Z0-9]`)
  - `regex(regex[, flags])`: requires the string to match the given regex
  - `email()`: requires the string to be an email
  - `lowercase()`: requires the string to be lowercase
  - `uppercase()`: requires the string to be uppercase
  - `enum(values...)` or `enum([enums]): the possible values for this string
- `type.boolean()` for a `Boolean`
- `type.number()` for a `Number`
  - `min(number)`: set the minimum acceptable value
  - `max(number)`: set the maximum acceptable value
  - `integer()`: requires the number to be an integer
- `type.date()` for a `Date`
  - `min(date)`: set the minimum acceptable value. Note that this will not be enforced
    for ReQL types like `r.now()`
  - `max(date)`: set the maximum acceptable value. Note that this will not be enforced
    for ReQL types like `r.now()`
- `type.buffer()` for a `Buffer`
- `type.object()` for an `Object`
- `type.array()` for an `Array`
- `type.point()` for a `"Point"`
- `type.virtual()` for a `"virtual"`

All these types (except `"virtual"`) come with two more methods:

- `options(options)`: set the options for this field
  - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
  - `enforce_extra`: can be `"strict"` to forbid fields not defined in the schema,
    `"remove"` to remove fields
    not declared in the schema, or `"none"`
  - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`.
- `default(valueOrFunction)`: The first argument can be constant value or a function
  that will be called with the document as the context.
- `validator(fn)`: a function that will be used to validate a field before saving the
  document. The function should return `true` if the field is valid, `false` otherwise.
  The function can also throw an error.



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
This format is the one used when you call `JSON.stringify` on a `Date` (or
`toISOString`), which means you can serialize your data between the client
and the server without having to worry about parsing the dates.

__Note__: About points:

You can pass a point as

- an array `[longitude, latitude]`
- an object `{longitude: <number>, latitude: <number>}`
- a ReQL object `r.point(longitude, latitude)`
- a GeoJson point `{type: "Point", coordinates: [longitude, latitude]}`

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

Another way to do it is with `type`:

```js
var type = thinky.type;
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string(),
    email: type.string(),
    age: type.number(),
    birthdate: type.date() 
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

Another way to do it is with:

```js
var type = thinky.type;
var User = thinky.createModel("User", {
    id: type.string(),
    contact: {
        email: type.string(),
        phone: type.string() 
    },
    age: type.number()
});
```

One more is with:

```js
var type = thinky.type;
var User = thinky.createModel("User", {
    id: type.string(),
    contact: type.object().schema({
        email: type.string(),
        phone: type.string() 
    }),
    age: type.number()
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
var type = thinky.type;
var Game = thinky.createModel("Game", {
    id: type.string(),
    name: type.string(),
    scores: type.array().schema(type.number)
});
```

One more is with:

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    scores: [type.number()]
});
```



_Example_: Create a model where the field `game` is an array of objects with two fields &mdash; `score` and `winner`.

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    game: [{
        score: Number,
        winner: String
    }]
});
```

You can also do the same with:

```js
var Game = thinky.createModel("Game", {
    id: String,
    name: String,
    game: type.array().schema(type.object().schema({
        score: Number,
        winner: String
    }))
});
```




_Example_: Create a model for a post where the default value for `createdAt` is the
current date if not specified.

```js
var Post = thinky.createModel("Post",{
    id: String,
    title: String,
    content: String,
    createdAt: type.string().default(r.now())
});
```

_Example_: Create a model for a user where the nickname, if not defined, will be its first
name.

```js
var Post = thinky.createModel("Post",{
    id: String,
    firstname: String,
    lastname: String,
    nickname: type.string().default(function() {
        return this.firstname;
    }}
});
```

_Example_: Create a model for a `post` where the field `title` must be a `String`
(where `null` will not be a valid value).

```js
var Post = thinky.createModel("Post",{
    id: type.string(),
    title: type.string().options({enforce_type: "strict"}),
    content: type.string(),
    createdAt: type.string().default(r.now())
});
```

_Example_: Create a model `User` and make sure that the field email is a valid email
using [validator](https://github.com/chriso/validator.js)

```js
var validator = require('validator');

var User = thinky.createModel("Users",{
    id: type.string(),
    email: type.string().email(),
    age: type.number()
});
```

```js
var validator = require('validator');

var User = thinky.createModel("Users",{
    id: type.string(),
    email: type.string().validator(validator.isEmail)
    age: Number
});
```

================
 
__Note__: With versions prior to 1.15.2, it is possible to declare fields with extra information (options,
validator etc.) with a special object:

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


This way of declaring types is deprecated since 1.15.2, and is still currently
available, but this syntax will eventually be removed.
