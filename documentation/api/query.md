---
layout: documentation
permalink: /documentation/api/query/
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

The option `modelToGet` can be an object where each field is a joined document that will also be retrieved.
Two options are also available:
- `_apply`: The function to apply on the joined sequence/document
- `_array`: Set it to `false` to not coerce the joined sequence to an array

For example you can have

```js
Users.getJoin({
    account: true // retrieve the joined document that will be stored in account
})
```

```js
Users.getJoin({
    accounts: {
        _apply: function(sequence) {
            return sequence.orderBy("sold") // Retrieve all the accounts ordered by sold
        }
    },
    company: true // Retrieve the company of the user
})

```


_Example_: Retrieve a user and all its joined documents.

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


_Example_: Retrieve a user and the number of accounts

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

User.hasMany(Account, "accounts", "id", "userId")

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({
  _apply: function(seq) { return seq.count() },
  _array: false
}).run().then(function(user) {

    /*
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: 3
     * }
     */
});
```


--------------



_Example_: Retrieve a user and only its account.

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

_Example_ Retrieve a user and all two accounts with the smallest sold.

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

User.hasMany(Account, "accounts", "id", "userId")

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({
    accounts: {
        _apply: function(sequence) {
            return sequence.orderBy('sold').limit(2)
        }
    }
}).run().then(function(user) {
    /*
     * user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     accounts: [{
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }, {
     *         id: "db7ac1e8-0160-4e57-bf98-144ad5f93feb",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 5832
     *     }]
     * }
     */
});
```



_Example_: Retrieve a user, its account and its solds.

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

User.hasOne(Account, "account", "id", "userId");
User.hasAndBelongsToMany(User, "friends", "id", "id");

var Bill = thinky.createModel("Bill", {
    id: type.string(),
    sold: type.number(),
    accountId: type.string()
});

Account.hasMany(Bill, "bills", "id", "accountId");

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({account: {bills: true}})
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

All the methods defined in ReQL can be called on a Query object.

The methods `filter` and `orderBy` can be automatically optimized. A model will
automatically fetch the indexes of its table, and at the time you call `filter`
or `orderBy` (and not when you call `run`), if an index is available, `thinky` will
automatically use an index.

The command `filter` is optimized only in case an object is passed as the first argument.
The first field in lexicographic order that match an index will be replaced with `getAll`.

The command `orderBy` is optimized only when a string is passed as the first argument.


_Note_: The current behavior is to look at the indexes of the model stored in the
query. If you use `r.table(Model.getTableName())` instead of `Model` in a nested
query, you may have unexpected/broken optimizations. Use an anonymous function if you
need to prevent thinky from optimizing your query.

_Note_: If you created your table with `{init: false}` indexes will not be fetched, and
the optimizer will not be as efficient as it could without the `init` option.

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


--------------

<div id="reql"></div>
### Overwritten [ReQL methods](#reql)

A few methods have slightly different behavior than the original ReQL commands.

- The `get` command will return an error if no document is found (instead of `null`). This
lets you easily chain commands after `get` without having to use `r.branch`.

```js
User.get(1).getJoin().run().then(function(result) {
    // ...
});
```


- The commands `update` and `replace` will have their first argument partially validated,
if the first argument is an object. The validation will be performed with all fields set as optional.
Once the queries has been executed, thinky will validate the returned values, and if an
error occur during validation, the changes will be reverted (so another query will be issued).

__Note__: Because reverting the changes require a round trip, this operation
is not atomic and may overwrite another write.

__Note__: If your queries does update something, you will get for a point-write (`.get(...).update/replace(...)`):
- the updated document  if the query did update the document
- `undefined` if no document is updated

For a range write (`table.update/replace`, `table.filter(...).update/replace`), you will get an array of the
updated documents. If no document is updated, you will get an empty array.



Typically, this may result in the document being `{id: 1, foo: "bar"}`.

```js
Model = thinky.createModel("User", {
    id: type.number(),
    age: type.number()
});

var promises = [];
// Suppose that the document is {id: 1, age: 18}
promises.push(Model.get(1).update({age: r.expr("string")}).run());
promises.push(Model.get(1).update({age: 20).run());

/*
What may happen is:
- The document becomes {id: 1, age: "string"}
- The document becomes {id: 1, age: 20}
- The document is reverted to {id: 1, age: 18}
*/
```
