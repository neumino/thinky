---
layout: documentation
permalink: /documentation/relations/
---

## Relations

### Introduction

Thinky lets you create Models that you can join. Four relations are defined:

- [hasOne](/thinky/documentation/api/model/#hasone)
- [belongsTo](/thinky/documentation/api/model/#belongsto)
- [hasMany](/thinky/documentation/api/model/#hasmany)
- [hasAndBelongsToMany](/thinky/documentation/api/model/#hasandbelongstomany)

These four relations are usually used in three different ways.   
Suppose we have two models `A` and `B`, we can have:

- __1-1 relation__

A 1-1 relation means that each instance of a Model `A` has and belongs to __one instance__ of a model `B`.  
In terms of actual code, it means that you have:

```
A.hasOne(B, ...)
B.belongsTo(A, ...)
```


The `hasOne` and `belongsTo` relations are similar.    
The difference is that for `A.hasOne(B, ...)`, the foreign key is stored in `B`, while
in `A.belongsTo(B, ...)`, the foreign key is stored in `A`.


_Example_: Each user has exactly one account, and each account belongs to exactly one user.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});
var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

User.hasOne(Account, "account", "id", "userId");
Account.belongsTo(User, "user", "userId", "id");
```

A user with its joined account will be:

```js
var user = {
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    name: "Michel",
    account: {
        id: "3851d8b4-5358-43f2-ba23-f4d481358901",
        userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        sold: 2420
    }
}
```


An account with its joined user will be:

```js
var account = {
    id: "3851d8b4-5358-43f2-ba23-f4d481358901",
    userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    sold: 2420
    user: {
        id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        name: "Michel",
    }
}
```

<div class="space"></div>

- __1-n relation__

A 1-n relation means that a each instance of a Model `A` possesses multiple instance of `B`, but each instance of
`B` belongs to only one instance of `A`.    
In terms of actual code, it means that you have:

```
A.hasMany(B, ...)
B.belongsTo(A, ...)
```

_Example_: An author has many posts, but each post is written by only one author.

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

Author.hasMany(Post, "posts", "id", "authorId");
Post.belongsTo(Author, "author", "authorId", "id");
```

An author with its posts will look like

```js
var author = {
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

A post with its author will look like

```js
var post = {
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
}
```



<div class="space"></div>

- __n-n relation__

A n-n relation means that each instance of a Model `A` possesses multiple instances of `B`, and that each instance of
`B` also possesses multiple instances of `A`.

In terms of actual code, it means that you have:

```
A.hasAndBelongsToMany(B, ...)
B.hasAndBelongsToMany(A, ...)
```

The relation `hasAndBelongsToMany` is symmetric, meaning that if `A` "has" `B`, then `B` also "has" `A`.

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

A tag with its joined posts will look like:

```js
{
    id: "3851d8b4-5358-43f2-ba23-f4d481358901",
    tag: "test",
    posts: [
        {
            id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
            title: "Hello world",
            content: "This is the first post.",
        }, {
            id: "eaed7d80-5205-488c-aedc-eb91e9f77d6b",
            title: "Second test",
            content: "Trying another post.",
        },
    ]
}
```



------------------------

### Save documents

#### save

The `save` command saves the local document to the database but does not the joined documents and does not copy (and save) the
foreign keys and links.

Use `save` only when you want to save local changes of document.


#### saveAll

The `saveAll` command will save the local document to the database and will recurse in joined documents for the provided keys.
The foreign keys and links will be automatically saved by `thinky.

__Note__: `saveAll` can delete foreign keys if the joined document is not present. The "rule"
to make sure that such thing does not happen is to call `saveAll` on a document only if
you retrieved it with `getJoin` with the same argument.

__Note__: A notable exception is for `hasAndBelongsToMany` relations. In this case you can provide
an array with keys to link. `saveAll` will only create the relations between the document
and not verify that the document actually do exist. This makes building an API more convenient (similiar
to what `update` provides).


_Example_:

Suppose we have the following code:

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});
var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

User.hasOne(Account, "account", "id", "userId");
Account.belongsTo(User, "user", "userId", "id");

var user = new User({...});
var account = new Account({...});

user.account = account;
account.user = user;

```

```
user.saveAll({account: true}).then(...);
```

We will first save `user`, then copy `user`'s id in `account.userId`, then save `account`.

Executing `account.saveAll({user: true})` will save things in the same order since we need to save `user` first
to fill the foreign key in `account`. Using the appropriate order to save documents will be done by `thinky`.


_Advanced saveAll_  
You can force `thinky` to save joined documents by explicitly specifying in which fields `saveAll` should
recurse into.   
A common example is when a Model is linked with itself.

_Example_:

```js
var Human = thinky.createModel("Human", {
    id: type.string(),
    name: type.string(),
    contactId: type.string()
});
Human.belongsTo(Human, "emergencyContact", "contactId", "id");

var michel = new Human({
    name: "Michel"
});
var sophia = new Human({
    name: "Sophia"
});

michel.emergencyContact = sophia;
```

Save both documents and the relation.

```js
michel.saveAll({emergencyContact: true}).then(...);
```

#### Update
If you call `save` on a document that you previously saved or that you retrieved from
the database, the `save` command will update the document.

Calling `saveAll` on a saved document will also update the relations (foreign keys, links etc.).


_Example_: Update a hasOne relation.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});
var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

User.hasOne(Account, "account", "id", "userId");

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a")
    .getJoin({account: true}).run().then(function(user) {
    /*
     * var user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }
     * }
     */
     user.account = null;
     user.saveAll().then(function(user) {
        /*
         * var user = {
         *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
         *     name: "Michel",
         * }
         */
        Account.get("3851d8b4-5358-43f2-ba23-f4d481358901").run()
            .then(function(account) {

            /*
             *  // The foreign key in account was deleted.
             *  var account: {
             *      id: "3851d8b4-5358-43f2-ba23-f4d481358901",
             *      sold: 2420
             *  }
             */
        });

     });
}):
```


------------------------

### Retrieve documents

Use the `getJoin` command to retrieve joined documents.

_Example_: Basic usage.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});
var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

User.hasOne(Account, "account", "id", "userId");
Account.belongsTo(User, "user", "userId", "id");


User.getJoin({account: true}).run().then(function(result) {
    /*
     * All the documents in `result` will be like
     * var user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     account: {
     *         id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *         userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *         sold: 2420
     *     }
     * }
     */
}):
```


_Example_: You can manually set the joined documents to retrieve.

```js
var Human = thinky.createModel("Human", {
    id: type.string(),
    name: type.string(),
    partnerId: type.string()
});
Human.belongsTo(Human, "emergencyContact", "contactId", "id");

var michel = new Human({
    name: "Michel"
});
var sophia = new Human({
    name: "Sophia"
});

michel.emergencyContact = sophia;

Human.getJoin({emergencyContact: true}).then(function(result) {
    /*
     * All the documents in `result` will be like
     * var user = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     contactId: "4650ad62-fabb-4cd6-8672-dd68cdda77a1"
     *     emergencyContact: {
     *         id: "4650ad62-fabb-4cd6-8672-dd68cdda77a1"
     *         name: "Sophia"
     *         
     *     }
     * }
     */
});
```


------------------------

### Delete documents

#### delete

The `delete` command deletes the local document to the database and will keep the data consistent without doing range updates.

_Example_:

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});
var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

User.hasOne(Account, "account", "id", "userId");
Account.belongsTo(User, "user", "userId", "id");

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").run().then(function(user) {
    /*
     *  var user = {
     *      id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *      name: "Michel",
     *      account: {
     *          id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *          userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *          sold: 2420
     *      }
     *  }
     */
    user.delete().then(function(result) {
        /*
         * user.isSaved() === false
         * user.account.isSaved() === false
         *
         *  var user = {
         *      id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
         *      name: "Michel",
         *      account: {
         *          id: "3851d8b4-5358-43f2-ba23-f4d481358901",
         *          sold: 2420
         *      }
         *  }
         */
    });
});
```

_Example_: Update a `belongsTo` relation.

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

Post.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a")
    .getJoin({author: true}).run().then(function(post) {

    /*
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
    post.author.delete().then(function() {
        Post.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a")
            .getJoin({author: true}).run().then(function(post) {

            /*
             * post = {
             *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
             *     title: "Hello world",
             *     content: "This is the first post"
             * }
             */
        });
    });
});
```


#### deleteAll

Like for `saveAll` and `getJoin`, `deleteAll` will recurse in a field as long as it does not contain
a Model previously deleted in another field.
You can manually force `deleteAll` to delete a joined document by manually specifying the field.


_Example_: Delete a user and its associated account.

```js
var User = thinky.createModel("User", {
    id: type.string(),
    name: type.string()
});
var Account = thinky.createModel("Account", {
    id: type.string(),
    sold: type.number(),
    userId: type.string()
});

User.hasOne(Account, "account", "id", "userId");
Account.belongsTo(User, "user", "userId", "id");

User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").run().then(function(user) {
    /*
     *  var user = {
     *      id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *      name: "Michel",
     *      account: {
     *          id: "3851d8b4-5358-43f2-ba23-f4d481358901",
     *          userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *          sold: 2420
     *      }
     *  }
     */
    user.deleteAll().then(function(result) {
        /*
         * user.isSaved() === false
         * user.account.isSaved() === false
         */
    });
});
```

_Example_: You can manually set the joined documents to delete.

```js
var Human = thinky.createModel("Human", {
    id: type.string(),
    name: type.string(),
    partnerId: type.string()
});
Human.belongsTo(Human, "emergencyContact", "contactId", "id");

Human.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a")
    .getJoin({emergencyContact: true}).then(function(human) {

    /*
     * var human = {
     *     id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
     *     name: "Michel",
     *     contactId: "4650ad62-fabb-4cd6-8672-dd68cdda77a1"
     *     emergencyContact: {
     *         id: "4650ad62-fabb-4cd6-8672-dd68cdda77a1"
     *         name: "Sophia"
     *         
     *     }
     * }
     */
    human.deleteAll({emergenctyContact: true}).then(function(human) {
        // human.isSaved === false
        // human.emergencyContact === false
    });
});
```


#### purge

The `purge` command works like the `delete` one except that it will run range update/delete in the database to keep data
consistent.
