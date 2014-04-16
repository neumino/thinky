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
Model.hasOne(OtherModel, field, leftKey, rightKey);
```

Define a relation between two model.

