# Thinky

JavaScript ORM for RethinkDB.  

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
var Cat = thinky.createModel('Cat', {name: String, idHuman: String}); 

// Create custom methods
Cat.define('hello', function() { console.log("Hello, I'm "+this.name) });

// Join models
var Human = thinky.createModel('Human', {name: String}); 
Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'})

// Create a new object
kitty = new Cat({name: 'Kitty'});
michel = new Human({name: Michel});
kitty.owner = michel;

kitty.hello(); // Log "Hello, I'm Kitty
kitty.save({saveJoin: true}, function(err, result) {
    if (err) throw err;
    console.log("Kitty and Michel have been saved in the database");
    /*
    console.log(kitty);
    {
        id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
        name: "Catou",
        idHuman: "3851d8b4-5358-43f2-ba23-f4d481358901",
        owner: {
            id: "3851d8b4-5358-43f2-ba23-f4d481358901",
            name: Michel
        }
    }
    */
})
```

### Docs

http://neumino.github.io/thinky/documentation.html


### Run the tests

```
node init.js
mocha
```

### Contribute
You are welcome to do a pull request.


### Roadmap
- Clean/reorganize tests and add more tests.
- Add examples on how to use Thinky.
- Let Thinky cache results so objects so there are no copies of the same document.
- Joins with lambda functions.
- Decide what to do with null (does it throw when checked against a Number?)
- Do not drain the pool when poolMin/poolMax are changed
- Promises?
- Need something? Just ask :-)


### About
Author: Michel Tu -- orphee@gmail.com -- [blog](http://blog.justonepixel.com) -- [twitter](https://twitter.com/neumino)

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
