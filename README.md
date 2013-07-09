# Thinky

JavaScript ORM for RethinkDB.  
_Note_: Alpha release

### Quick start 

Install:
```
npm install thinky
```

Use
```javascript
var thinky = require('thinky');
thinky.init({});

// Create a model
var Cat = thinky.createModel('Cat', {name: String}); 

// Create custom methods
Cat.define('hello', function() { console.log("Hello, I'm "+this.name) });

// Create a new object
kitty = new Cat({name: 'Kitty'});
kitty.hello(); // Log "Hello, I'm Kitty
kitty.save(function(err, result) {
    if (err) throw err;
    console.log("Kitty has been saved in the database");
})
```

### Docs

See https://github.com/neumino/thinky/tree/master/doc/


### Run the tests

```
mocha
```

### Contribute
You are welcome to do a pull request.


### TODO
- Add events methods on Model
- Add more complex queries
- Decide what to do with null (does it throw when checked against a Number?)
- Joins
- Premises?
- Do not drain the pool when poolMin/poolMax are changed
- Write examples

### About
Author: Michel Tu -- orphee@gmail.com -- www.justonepixel.com

### License
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
