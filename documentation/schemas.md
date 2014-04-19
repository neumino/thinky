---
layout: documentation
permalink: schemas/
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
- An object with the fields:
    - `_type` (mandatory): Can be `String`/`Boolean`/`Number`/`Date`/`Object`/`Array`.
    - `schema` (optional): The schema if the field `_type` is `Object` or `Array`.
    - `options` (optional), will overwrite the model's options:
        - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
        - `enforce_extra`: `Boolean`, `true` to forbid fields not defined in the schema.
        - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`.
    - `default` (optional): can be constant value or a function that will be called with
    the document as context.
    - `validator`: A function that will be used to validate a field before saving the document. The context is set to the current field.
- An object that is a valid schema.
- An array with one of the previous types.

__Note__: The fields used to store joined documents should not be provided in the schema.



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


