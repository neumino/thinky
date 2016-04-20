---
layout: documentation
permalink: /documentation/virtuals/
---

## Virtual fields




### Introduction

Virtual fields are basically fields that are not saved in the database. Their value can be
automatically set depending on other values, or manually set by you.





### A convenient way to pre-compute fields


Suppose we have the following `User` model:

```js
var User = thinky.createModel('user', {
    firstName: type.string(),
    lastName: type.string(),
    fullName: type.virtual().default(function() {
        return this.firstName+" "+this.lastName;
    }
})
```

When we create an object with the fields `firstName` and `lastName`, thinky will automatically
compute the field `fullName`.

```js
var user = new User({
    firstName: "John",
    lastName: "Doe"
});
console.log(user.fullName); // "John Doe"
```

If you manually change a field, thinky cannot know that you did change it, so the virtual
field will still have its old value. You can however call `generateVirtualValues` to
regenerate them.

```js
var user = new User({
    firstName: "John",
    lastName: "Doe"
});
console.log(user.fullName); // "John Doe"

user.firsName = "Marc";
console.log(user.fullName); // "John Doe"

user.generateVirtualValues();
console.log(user.fullName); // "Marc Doe"
```

If you save a document, the virtual fields will be regenerated:

```js
var user = new User({
    firstName: "John",
    lastName: "Doe"
});
console.log(user.fullName) // "John Doe"

user.firsName = "Marc";
console.log(user.fullName); // "John Doe"

user.save().then(function() {
    console.log(user.fullName) // "Marc Doe"
}).error(console.log);
```

If you do not provide a default function/value for a virtual field, thinky will restore them
after saving the document (the virtual fields are however not saved).


```js
var User = thinky.createModel('user', {
    firstName: type.string(),
    lastName: type.string(),
    fullName: type.virtual()
})

var user = new User({
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe (unknown)"
});
console.log(user.fullName); // "John Doe (unknown)"

user.save().then(function() {
    console.log(user.fullName); // "John Doe (unknown)"
}).error(console.log);
```




### A convenient way to set multiple fields at the same time

Though this is not strictly related to virtual fields in thinky, some ORMs use virtual fields
to set multiple fields at the same time.

This can be achieve with `define` in thinky.

```js
var User = thinky.createModel('user', {
    firstName: type.string(),
    lastName: type.string(),
    fullName: type.virtual()
})

User.define("setFullname", function(fullname) {
    var split = fullname.split(' ');

    this.fullName = fullName;
    this.firstName = split[0];
    this.lastName = split[1];
})

var user = new User({});
user.setFullName("Paul Doe");
// user.fullName === "Paul Doe";
// user.firstName === "Paul";
// user.lastName === "Doe";
```
