---
layout: documentation
permalink: /documentation/architecture/
---

## Importing thinky

### Introduction

This document suggests how to import and use the `thinky` module. This article
just gives hint on how to architect your application. You are free to try
another architecture if it works better for your needs.


### Architecture

- We recommend users to create a file `util/thinky.js` with the following content:

```js
// file: util/thinky.js
var thinky = require('thinky')({
    // thinky's options
})

module.exports = thinky;
```

- Then for each model, create a `.js` file in a `models` directory.
For example to declare a model `User`:


```js
// file: models/user.js
var thinky = require(__dirname+'/util/thinky.js');
var type = thinky.type;

var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string(),
    age: type.number()
});

module.exports = User;
```


If you need to create a relation, add it after calling `createModel`.

Suppose that a `User` has one `Account`. You would have two files:


```js
// file: models/account.js
var thinky = require(__dirname+'/util/thinky.js');
var type = thinky.type;

var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

module.exports = Account;

var User = require(__dirname+'/models/user.js');
Account.belongsTo(User, "user", "userId", "id");

```

```js
// file: models/user.js
var thinky = require(__dirname+'/util/thinky.js');
var type = thinky.type;

var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string(),
    age: type.number()
});

module.exports = User;

var Account = require(__dirname+'/models/account.js');
User.hasOne(Account, "user", "id", "userId");
```


- Then you can import the model you need anywhere you need.

If you find yourselves importing all your models in multiple files, you can create a
file `models/all.js` with the following content:


```js
// file: models/all.js
module.exports = {
    Account: require(__dirname+'/models/account.js');
    User: require(__dirname+'/models/user.js');
};
```


### Explanations

The reason behind the architecture suggested above comes from the fact that when you execute
the module `thinky`, you create a new instance of `thinky`.

__You should not import and call the module mulitple times__ as it will result in multiple
instances of `thinky` that will not share the same models.
