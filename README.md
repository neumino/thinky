# Thinky
====

JavaScript ORM for RethinkDB.
_Note_: Alpha release

## Quick start 

```
var thinky = require('thinky');
thinky.connect({});

var Cat = thinky.createModel('Cat', {name: String}); // Create a model
Cat.define('hello', function() { console.log("Hello, I'm "+this.name) }); // Create custom methods

kitty = new Cat({name: 'Kitty'}); // Create a new object
kitty.hello(); // Log "Hello, I'm Kitty
kitty.save(function(err, result) {
    if (err) throw err;
    console.log("Kitty has been saved in the database");
})
```

## Docs
_Note_: Work in progress. 

### Thinky

#### Thinky.connect( options )
options is an object with the fields
- host: RethinkDB host (default "localhost")
- port: RethinkDB port for client (default to 28015)
- db: default database (default to "test")
- poolMax: The maximum number of connections in the pool (default to 10)
- poolMin: The minimum number of connections in the pool (default to 1)


#### Thinky.getOptions()
Returns all the options previously set.


### Model


### Document

Contribute
====
You are welcome to do a pull request

TODO
====
- Fully test insert/update/replace
- Add filter
- Write the docs
- Get a cake


About
====
Author: Michel Tu -- orphee@gmail.com -- www.justonepixel.com

License
====
Copyright (c) 2013 Michel Tu <orphee@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the 'Software'), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
