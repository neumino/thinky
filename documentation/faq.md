---
layout: documentation
permalink: /documentation/faq/
---

## FAQ

#### What version of RethinkDB supports?

Thinky currently requires RethinkDB 1.12 to works.

Thinky uses `merge` with an anonymous function under the hood to perform joins and this feature was shipped only in 1.12.    
[https://github.com/rethinkdb/rethinkdb/issues/1345](https://github.com/rethinkdb/rethinkdb/issues/1345). 


<div class="space"></div>

#### How do I migrate from v0.2?

There is no easy way to migrate. The whole API changed. The changes include:

- lazy execution of a query
- different relations (the previous `hasOne` is now `belongsTo` - to follow Active Record models)
- `null` can be accepted is the option `enforce_type` is set to `"loose"`

I __sincerely__ apologize for breaking the API, but given the feedback I got, these changes
were necessary.


<div class="space"></div>

#### What is the difference with [Reheat](http://reheat.codetrain.io/)?

That is actually a tough question. I personally haven't really use Reheat, but the main difference
is probably about the syntax. Reheat's syntax is closer to MongoDB's one.

A few more differences:

- All the connections are automatically managed in thinky.
- More relations are available in thinky.

If you have used both ORMs, I would love to hear from your experience.


<div class="space"></div>

#### How can I enforce uniqueness in a field?

If you must be sure that a field is unique, you must use it as
the primary key.

For example, suppose you want the name to be unique.

```js
var Model = thinky.createModel("user", 
    name: String
}, {
    pk: "name"
});
```

_Note:_ If you use a field as a primary key, you will not be able to
update the field. You will have to delete and re-insert the document.

RethinkDB does not provide unique secondary indexes (like any distributed
databases), mostly because as soon as you shard your table, uniqueness cannot be
enforced without a huge cost in performance -- See
[this discussion](https://github.com/rethinkdb/rethinkdb/issues/1716)
for more details.


<div class="space"></div>

#### What is thinky's license

MIT license.


<div class="space"></div>

#### How can I contact you?

- Ping me on twitter at [@neumino](https://twitter.com/neumino).
- I hang out as `neumino` on [freenode/rethinkdb](irc://irc.freenode.org/rethinkdb).
- If you run into a problem, please open an issue on [GitHub](https://github.com/neumino/thinky/issues?direction=desc&sort=created&state=open).
