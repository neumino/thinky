---
layout: documentation
permalink: /documentation/feeds/
---

## Changefeeds


There are currently two types of changefeeds (the result of the `changes`
command):

- A feed that represents the changes happening on a range of documents or a whole table.
- A feed that represents the changes happening on a single document.



### Range feeds

In the case of a feed representing the changes on a range of documents,
thinky will return a feed object that will behave like the one returned by
the driver. The only difference is that instead of returning values in this format:

```js
{
  new_val: ...,
  old_val: ...
}
```

It will return instances of the document. If the document was deleted, an empty
document will be returned.


_Note_: Feeds can be created on an ordered sequence of documents. Once RethinkDB
will implement a [few niceties](https://github.com/rethinkdb/rethinkdb/issues/3714),
thinky will return an array of documents that get
automatically updated.

### Point feeds

Point feeds are returned if you chain the `get` and `changes` command. In this
case, thinky will return a document that will emit the event `change` when
an update is sent by the database.

Documents that get updated by a point feed implements two new methods:

- `getFeed` that returns the feed created by the driver.
- `closeFeed` that will close the feed associated with the document.

### Examples

For a range feed, you can call `each` on the feed to get all the documents:

```js
var stringify = function(doc) {
  return JSON.stringify(doc, null, 2);
}

var Users = thinky.createModel("Users", {
  id: type.string(),
  name: type.string()
});

Users.changes().then(function(feed) {
  feed.each(function(error, doc) {
    if (error) {
      console.log(error);
      process.exit(1);
    }

    if (doc.isSaved() === false) {
      console.log("The following document was deleted:");
      console.log(stringify(doc.getOldValue()));
    }
    else if (doc.getOldValue() == null) {
      console.log("A new document was inserted:");
      console.log(stringify(doc));
    }
    else {
      console.log("A document was updated.");
      console.log("Old value:");
      console.log(stringify(doc.getOldValue()));
      console.log("New value:");
      console.log(stringify(doc));
    }
  });
}).error(function(error) {
  console.log(error);
  process.exit(1);
});
```


For a point feed, you can call listen on the `change` event.

```js
var stringify = function(doc) {
  return JSON.stringify(doc, null, 2);
}

var Users = thinky.createModel("Users", {
  id: type.string(),
  name: type.string()
});

Users.get("3851d8b4").changes().then(function(doc) {
  console.log();
  console.log(JSON.stringify(doc, null, 2));
  doc.on('change', function(newDoc) {
    // doc === newDoc === this;
    if (doc.isSaved() === false) {
      console.log("The document was deleted.");
    }
    else if (doc.getOldValue() == null) {
      console.log("The document was inserted.");
    }
    else {
      console.log("The document was updated.");
      console.log("Old value:");
      console.log(stringify(doc.getOldValue()));
      console.log("New value:");
      console.log(stringify(doc));
    }
  });
  doc.on('error', function(error) {
    console.log(error);
    process.exit(1);
  });
}).error(function(error) {
  console.log(error);
  process.exit(1);
});
```
