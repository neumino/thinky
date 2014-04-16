---
layout: documentation
permalink: model/
---

## Model

A model is returned from [thinky.createModel](/documentation/thinky/#createmodel)


<div id="getoptions"></div>
### [getOptions](#getoptions)


<div id="getname"></div>
### [getName](#getname)

```js
Model.getName();
```

__TODO__ Rename to getTableName

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
Model.hasOne(OtherModel, fieldName, leftKey, rightKey, [options]);
```

Define a "has one" relation between two model. The foreign key is
`rightKey` and will be stored in `OtherModel`.  

The secondary indexes used to join the document will be automatically created
except if `options` has the field `init` set to `false`.

If you want to store the foreign key on the Model itself, you can
use [belongsTo](#belongsto).


- `OtherModel` is the joined model.
- `fieldName` is the field where the joined document will be stored.
- `leftKey` is the field of `Model` used to perform the join.
- `rightKey` is the field of `OtherModel` used to perform the join.
- `options` can be an object with the field `init` set to a boolean. 


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

Note: The secondary indexes will be automatically created.

<div id="hasone"></div>
### [hasOne](#hasone)
```js
Model.hasOne(OtherModel, fieldName, leftKey, rightKey);
```

Define a "has one" relation between two model. The foreign key is
`rightKey` and will be stored in `OtherModel`.  
If you want to store the foreign key on the Model itself, you can
use [belongsTo](#belongsto).

- `OtherModel` is the joined model.
- `fieldName` is the field where the joined document will be stored.
- `leftKey` is the field of `Model` used to perform the join.
- `rightKey` is the field of `OtherModel` used to perform the join.


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

