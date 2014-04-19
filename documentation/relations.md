---
layout: documentation
permalink: relations/
---

## Relations

### Introduction

Thinky lets you create Models that you can join. Four relations are defined:

- [hasOne](/documentation/api/model/#hasone)
- [belongsTo](/documentation/api/model/#belongsto)
- [hasMany](/documentation/api/model/#hasmany)
- [hasAndBelongsToMany](/documentation/api/model/#hasandbelongstomany)

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
    id: String,
    name: String
});
var Account = thinky.createModel("Account", {
    id: String,
    sold: Number,
    userId: String
});

User.hasOne(Account, "account", "id", "userId");
Account.belongs(User, "user", "userId", "id");
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
    id: String,
    name: String
});
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String,
    authorId: String
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
`B` also possesses multiple instances of B.

In terms of actual code, it means that you have:

```
A.hasAndBelongsToMany(B, ...)
B.hasAndBelongsToMany(A, ...)
```

The relation `hasAndBelongsToMany` is symmetric, meaning that if `a` "has" `b`, then `b` also "has" `a`.

```js
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String
});
var Tag = thinky.createModel("Tag", {
    id: String,
    tag: String
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

The `saveAll` command will save the local document to the database and will recurse in joined documents to save them.
The foreign keys and links will be automatically saved by `thinky.

_Note_: To avoid infinite recursion with circular references, `saveAll` will not recurse in a field containing document(s)
of a previously saved model.

_Example_:

Suppose we have the following code:

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
});
var Account = thinky.createModel("Account", {
    id: String,
    sold: Number,
    userId: String
});

User.hasOne(Account, "account", "id", "userId");
Account.belongs(User, "user", "userId", "id");

var user = new User({...});
var account = new Account({...});

user.account = account;
account.user = user;

```

```
user.saveAll().then(...);
```

We will first save `user`, then copy `user`'s id in `account.userId`, then save `account`.
The `saveAll` command will not recurse in the field `account.user` since we previously already saved an instance of `User` (`user`).


Executing `account.saveAll()` will save things in the same order since we need to save `user` first
to fill the foreign key in `account`. Using the appropriate order to save documents will be done by `thinky`.


_Advanced saveAll_  
You can force `thinky` to save joined documents by explicitly specifying in which fields `saveAll` should
recurse into.   
A common example is when a Model is linked with itself.

_Example_:

```js
var Human = thinky.createModel("Human", {
    id: String,
    name: String,
    contactId: String
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


------------------------

### Retrieve documents

Use the `getJoin` command to retrieve joined documents.

Like for `saveAll`, `getJoin` will recurse in a field as long as it does not contain 
a Model previously fetched in another field.
You can manually force `getJoin` to retrieve a joined document by manually specifying the field.

_Example_: Basic usage.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
});
var Account = thinky.createModel("Account", {
    id: String,
    sold: Number,
    userId: String
});

User.hasOne(Account, "account", "id", "userId");
Account.belongs(User, "user", "userId", "id");


User.getJoin().run().then(function(result) {
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
    id: String,
    name: String,
    partnerId: String
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
    id: String,
    name: String
});
var Account = thinky.createModel("Account", {
    id: String,
    sold: Number,
    userId: String
});

User.hasOne(Account, "account", "id", "userId");
Account.belongs(User, "user", "userId", "id");

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

#### deleteAll

Like for `saveAll` and `getJoin`, `deleteAll` will recurse in a field as long as it does not contain 
a Model previously deleted in another field.
You can manually force `deleteAll` to delete a joined document by manually specifying the field.


_Example_: Delete a user and its associated account.

```js
var User = thinky.createModel("User", {
    id: String,
    name: String
});
var Account = thinky.createModel("Account", {
    id: String,
    sold: Number,
    userId: String
});

User.hasOne(Account, "account", "id", "userId");
Account.belongs(User, "user", "userId", "id");

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
    id: String,
    name: String,
    partnerId: String
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

