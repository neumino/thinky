---
layout: documentation
permalink: query/
---

## Query

A query is created when you call a method on a Model or by calling

```js
var query = new thinky.Query(Model, rawQuery);
```

A `Query` object is a wrapper of an actual ReQL query and a model.  
The model is used only if you call the `run` method. The results returned by the
database will be converted to instances of the model stored.

--------------

<div id="getjoin"></div>
### [getJoin](#getjoin)

```js
query.getJoin([modelToGet]) -> query
```

Retrieve the joined documents of the given model.

By default, if `modelToGet` is not provided, `getJoin` will keep recursing and will
retrieve all the joined documents.   
To avoid infinite recursion, `getJoin` will not recurse in a field that contains a document from
a model that was previously fetched.

The option `modelToGet` can be an object where each field is a joined document that will also be saved.


_Example_: Retrieve a user and all its joined documents.

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
});
```

--------------



_Example_: Retrieve a user and only its account.

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

User.hasAndBelongsToMany(User, "friends", "id", "id")


User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({account: true})
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
});
```

_Example_: Retrieve a user, its account and its 

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

User.hasOne(Account, "account", "id", "userId");
User.hasAndBelongsToMany(User, "friends", "id", "id");

var Bill = thinky.createModel("Bill", {
    id: String,
    sold: Number,
    accountId: String
});

Account.hasMany(Bill, "bills", "id", "accountId");

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({account: {sold: true}})
    .run().then(function(user) {

    /*
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *         bills: [
     *             {
     *                 id: "6b48ca51-6363-4065-8acf-497454da9616",
     *                 sold: 421,
     *                 accountId: "3851d8b4-5358-43f2-ba23-f4d481358901"
     *             },
     *             {
     *                 id: "d2d79e33-e65f-4043-b214-ca190f5e7d52",
     *                 sold: 921,
     *                 accountId: "3851d8b4-5358-43f2-ba23-f4d481358901"
     *             },
     *             {
     *                 id: "279ac0f5-b249-4a34-a873-ecd318468dac",
     *                 sold: 185,
     *                 accountId: "3851d8b4-5358-43f2-ba23-f4d481358901"
     *             }
     *         ]
     *     }
     * }
     */
});
```

--------------

<div id="run"></div>
### [run](#run)

```
query.run([callback]) -> Promise
```


Execute the query and convert the results as instances of the model.
A cursor will automatically be replaced by the array of all the results.

If you do not want to use a promise, you can directly pass a callback to `run`.

_Example_: Retrieve all the users
```
User.run().then(function(result) {
    // process `result`
})
```

--------------

<div id="execute"></div>
### [execute](#execute)

```
query.execute([callback]) -> Promise
```

Execute the query but do not parse the response from the server, for example
a raw cursor can be returned.

If you do not want to use a promise, you can directly pass a callback to `execute`.

_Example_: Return all the ids of the users

```js
User.map(r.row("id")).execute().then(function(cursor) {
    cursor.each(function(userId) {
        console.log(userId);
    }
})
```

_Note_: The same query with `run` would have thrown an error because a string
cannot be converted to an instance of `User`.

--------------

<div id="reql"></div>
### [ReQL methods](#reql)

All the methods defined in ReQL can be called  on a Query object.


_Example_: Return the number of users

```js
User.count().execute().then(function(total) {
    console.log(total+" users in the database");
});
```

_Example_: Return the users who are exactly 18 years old.

```js
User.filter({age: 18}).run().then(function(result) {
    // result is an array of instances of `User`
});
```
