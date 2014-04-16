---
layout: documentation
permalink: model/
---

## Model

A model is returned from [thinky.createModel](/documentation/thinky/#createmodel)


<!--
<div id="getoptions"></div>
### [getOptions](#getoptions)
-->


<div id="gettablename"></div>
### [getTableName](#gettablename)

```js
Model.getName();
```

Return the name of the table used for this model.


_Example_: Return the name of table used for `PostModel`.

```js
var PostModel = thinky.createModel("Post", {
    id: String,
    title: String,
    author: String
});

PostModel.getName() // returns "Post"
```



<div id="hasone"></div>
### [hasOne](#hasone)
```js
Model.hasOne(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "has one" relation between two models. The foreign key is
`rightKey` and will be stored in `OtherModel`.  

If you want to store the foreign key on the model itself, use [belongsTo](#belongsto).


The arguments are:

- `OtherModel`: the joined model.
- `fieldName`: the field where the joined document will be stored.
- `leftKey`: the field of `Model` used to perform the join.
- `rightKey`: the field of `OtherModel` used to perform the join.
- `options`: optional, you can set the field `init` to `false` if the indexes
were already created and do not want thinky to try to create them.


_Example_: 

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
```

A user with its joined account will look like:

```js
{
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    name: "Michel",
    account: {
        id: "3851d8b4-5358-43f2-ba23-f4d481358901",
        userId: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        sold: 2420
    }
}
```


<div id="belongsto"></div>
### [belongsTo](#belongsto)
```js
Model.belongsTo(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "belongs to" relation between two models. The foreign key is
`leftKey` and will be stored in `OtherModel`.  
If you want to store the foreign key on the joined model, use [hasOne](#hasone).

- `OtherModel` is the joined model.
- `fieldName` is the field where the joined document will be stored.
- `leftKey` is the field of `Model` used to perform the join.
- `rightKey` is the field of `OtherModel` used to perform the join.
- `options`: optional, you can set the field `init` to `false` if the indexes
were already created and do not want thinky to try to create them.



_Example_: 

```js
var Post = thinky.createModel("Post", {
    id: String,
    title: String,
    content: String,
    authorId: String
});

var Author = thinky.createModel("Author", {
    id: String,
    name: String
});

Post.belongsTo(Author, "author", "authorId", "id")
```

A post with its joined author will look like:

```js
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
```

<div id="hasmany"></div>
### [hasMany](#hasmany)
```js
Model.hasMany(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "has many" relation between two models where the reciprocal relation
is a "belongs to".  
If you need a many to many relations between two models, use [hasAndBelongsToMany](#hasAndBelongsToMany).

The foreign key is `rightKey` and will be stored in `OtherModel`.  

- `OtherModel` is the joined model.
- `fieldName` is the field where the joined document will be stored.
- `leftKey` is the field of `Model` used to perform the join.
- `rightKey` is the field of `OtherModel` used to perform the join.
- `options`: optional, you can set the field `init` to `false` if the indexes
were already created and do not want thinky to try to create them.



_Example_: 

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

Author.hasMany(Post, "posts", "id", "authorId")
```

A user with its joined posts will look like:

```js
{
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

<div id="hasandbelongstomany"></div>
### [hasAndBelongsToMany](#hasAndBelongsToMany)
```js
Model.hasMany(OtherModel, fieldName, leftKey, rightKey[, options]);
```

Define a "has and belongs to many" relation between two models where the reciprocal relation
is another "has and belongs to many".  
If you need a one to many relations between two models, use [hasMany](#hasMany) and [belongsTo](#belongsto).

The joined is done via a third table that is automatically created and managed by thinky.

- `OtherModel` is the joined model.
- `fieldName` is the field where the joined document will be stored.
- `leftKey` is the field of `Model` used to perform the join.
- `rightKey` is the field of `OtherModel` used to perform the join.
- `options`: optional, you can set the field `init` to `false` if the indexes
were already created and do not want thinky to try to create them.

__Interals__:
The third table is named `<Model1.getTableName()>_<Model2.getTableName()>` 
where the names are alphabetically order.  

We __highly recommend__ to use the primary keys for the fields uesd to perform the join.
If you do not, while `thinky` will be able to create links, it will not be able to
automatically delete links when documents are deleted.
The only way now to delete a link in this case is to manually do it.


_Example_: 

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
```

A user with its joined posts will look like:

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

