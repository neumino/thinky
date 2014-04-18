---
layout: documentation
permalink: relations/
---

## Relations

### Introduction

Thinky lets you create Models that you can later join. Four relations are defined:

- [hasOne](/documentation/api/model/#hasone)
- [belongsTo](/documentation/api/model/#belongsto)
- [hasMany](/documentation/api/model/#hasmany)
- [hasAndBelongsToMany](/documentation/api/model/#hasandbelongstomany)

These four relations are usually used in three different ways.   
Suppose we have two models `A` and `B`, we can have:

- a 1-1 relation
- a 1-n relation
- a n-n relation


### 1-1 relation

A 1-1 relation means that each instance of a Model `A` has and belongs to one instance of a model `B`.  
In terms of actual code, it means that you have:

```
A.hasOne(B, ...)
B.belongsTo(A, ...)
```


`hasOne` and `belongsTo` are similar relations. The difference is that for `A.hasOne(B, ...)`, the foreign
key is stored in `B`, while in `A.belongsTo(B, ...)`, the foreign key is stored in `A`.


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


### 1-n relation

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
var author = {
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




### n-n relation

A n-n relation means that a each instance of a Model `A` possesses multiple instances of `B`, and that each instance of
`B` also possesses multiple instances of B.

In terms of actual code, it means that you have:

```
A.hasAndBelongsToMany(B, ...)
B.hasAndBelongsToMany(A, ...)
```

The relation `hasAndBelongsToMany` is currently symmetric, meaning that if `a` "has" `b`, then `b` also "has" `a`.

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
    tag: [
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
    tag: "test"
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




### Save


### Retrieve

### Delete

### Internals

__Interals__:
The third table is named `<Model1.getTableName()>_<Model2.getTableName()>` 
where the names are alphabetically order.  

If you do not, while `thinky` will be able to create/save links, it will not be able to
automatically delete links when documents are deleted.
The only way now to delete a link in this case is to manually do it.

