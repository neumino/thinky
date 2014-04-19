---
layout: documentation
permalink: introduction/
---

## Introduction

#### What is thinky?

`thinky` is an ORM for Node.js and RethinkDB.

It wraps the `rethinkdbdash` driver and provide a little more features than the native
driver, like models, joins etc.

The point of `thinky` is to make retrieving/saving/deleting data from RethinkDB as
natural as possible.


#### What are the advantages of using thinky?

- It uses `rethinkdbdash` and not the official driver. Therefore all the queries are
executed without the user having to deal with connections.
- It provides Models and handle joins in a nice and efficient way:
    - saving joined documents can be done with a single command: `saveAll`.
    - retrieving joined documents can be done with a single command: `getJoin`.
    - deleting  joined documents can be done with a single command: `deleteAll`.
- It can validate documents before saving them, avoiding you to later deal with
incoherent data.
- All the commands available in the driver are also available with `thinky`.
