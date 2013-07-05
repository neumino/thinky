# Thinky

JavaScript ORM for RethinkDB.  
_Note_: Alpha release

### Quick start 

```javascript
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

### Docs
_Note_: Work in progress. 

#### Thinky

__Thinky.connect(__ options __)__

options (object): object with the fields
- host: RethinkDB host (default "localhost")
- port: RethinkDB port for client (default to 28015)
- db: default database (default to "test")
- poolMax: The maximum number of connections in the pool (default to 10)
- poolMin: The minimum number of connections in the pool (default to 1)


__Thinky.getOptions()__  

Returns all the options previously set.


__Thinky.setOptions(__ options, overwrite __)__

- options: object with the fields
    - host: RethinkDB host (default "localhost")
    - port: RethinkDB port for client (default to 28015)
    - db: default database (default to "test")
    - poolMax: The maximum number of connections in the pool (default to 10)
    - poolMin: The minimum number of connections in the pool (default to 1)
- overwrite (boolean): flag to delete not declared options, default to false.
_Note_: the overwrite flag will probably be removed.
_Note bis_: overwriting poolMax and poolMin does not affect the pool for now. I'll probably end
up forking generic-pool for that.

__Thinky.getOption(__ optionName __)__

- optionName (string): possible values:
    - host: RethinkDB host
    - port: RethinkDB port for client
    - db: default database
    - poolMax: The maximum number of connections in the pool
    - poolMin: The minimum number of connections in the pool


__Thinky.disconnect()__

Close all the connections.

__Thinky.createModel(__ name, schema, settings __)__
Create a new model
- name: name of the model
- schema: An object which fields can have the following values:
    - String
    - Number
    - Boolean
    - Array
    - Object
- settings (object): settings for the model
    - enforce (boolean)
    Enforce or not the schema. Error will be thrown if extra fields are provided/missing.

_Note_: The behavior of enforce may change. Since I can imagine four cases
- Be flexible
- Forbid extra fields
- Forbid missing fields
- Forbid extra AND missing fields

#### Model
__Model.comple(__ name, schema, settings, thinky __)__
Compile the model

__Model.createBasedOnSchema(__ result, doc, originalDoc, enforce, prefix, schema __)__
Internal method


__Model.checkType(__ result, doc, originalDoc, schema, key, type, typeOf, prefix, enforce __)__
Internal method for createBasedOnSchema


__Model.define(__ key, method __)__
Save a method

__Model.setSchema(__ schema __)__
Change the schema -- Not tested (I think)


__Model.getSettings(__  __)__

__Model.getDocument(__  __)__

__Model.getPrimaryKey(__  __)__

__Model.save(__ callback  __)__

__Model.save(__ id or [ids]  __)__

__Model.filter(__ filterFunction  __)__

__Model.mapReduce(__ filterFunction  __)__
Not yet

__Model.filter(__ filterFunction  __)__
Not yet

#### Document

__Document.getDocument(__  __)__

__Document.getModel(__  __)__

__Document.getSettings(__  __)__

__Document.define(__ name, method  __)__

__Document.replace(__ newDoc  __)__

__Document.update(__ newDoc  __)__
Not yet

All method of EventEmitter are available on Document. They do not pollute the document itself.

### Contribute
You are welcome to do a pull request.


### TODO
- Write the docs
- Add more complex queries
- Update pool when poolMax/poolMin changes

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
