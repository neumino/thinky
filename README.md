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
_Note_: Work in progress. 

#### Thinky

__Thinky.init(__ options __)__

options (object): object with the fields

- host: RethinkDB host (default "localhost")
- port: RethinkDB port for client (default to 28015)
- db: default database (default to "test")
- poolMax: The maximum number of connections in the pool (default to 10)
- poolMin: The minimum number of connections in the pool (default to 1)
- enforce: represents if the schemas should be enforced or not. Its value can be:
    - an object with the 3 fields:
        - missing -- throw on missing fields -- default to false
        - extra -- throw if extra fields are provided -- default to false
        - type -- throw if the type is not the one expected -- default to true
    - a boolean that set all 3 parameters to the same value


__Thinky.getOptions()__  

Returns all the options previously set.



__Thinky.getOption(__ optionName __)__  

Returns the value for _optionName_. Possible values:

- host: RethinkDB host
- port: RethinkDB port for client
- db: default database
- poolMax: The maximum number of connections in the pool
- poolMin: The minimum number of connections in the pool
- enforce: Boolean that represent if the schemas should be enforced or not



__Thinky.setOptions(__ options __)__

Overwrite the options defined in _options_.

The argument _options_ is an object that can have the following fields

- host: RethinkDB host (default "localhost")
- port: RethinkDB port for client (default to 28015)
- db: default database (default to "test")
- poolMax: The maximum number of connections in the pool (default to 10)
- poolMin: The minimum number of connections in the pool (default to 1)
- enforce: represents if the schemas should be enforced or not. Its value can be:
    - an object with the 3 fields:
        - missing -- throw on missing fields -- default to false
        - extra -- throw if extra fields are provided -- default to false
        - type -- throw if the type is not the one expected -- default to true
    - a boolean that set all 3 parameters to the same value

Setting a value to `null` will delete the value and the default value will be used.

_Note_: Changing the host/port/poolMax/poolMin will create a new pool (the previous one will be drained).  
This behavior will be fixed when generic pool will be able to resize the pool at will (or when I'll fork it)



__Thinky.disconnect()__

Close all the connections.



__Thinky.createModel(__ name, schema, settings __)__

Create a new model

- name: name of the model
- schema: An object which fields can map to the following value
    - String
    - Number
    - Boolean
    - Array with one type (like [String], [Number], [{name: String, age: Number}]
    - Object that contains a valid schema
    - {\_type: String, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Number, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Boolean, enforce: { missing: <boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Array, schema: _schema_, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Object, schama: _schema_, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
- settings (object): settings for the model
    - enforce: represents if the schemas should be enforced or not. Its value can be:
        - an object with the 3 fields:
            - missing -- throw on missing fields -- default to false
            - extra -- throw if extra fields are provided -- default to false
            - type -- throw if the type is not the one expected -- default to true
        - a boolean that set all 3 parameters to the same value

_Note 1_: the fields enforce and default are optional.  
_Note 2_: the value of enforce is the lower one (thinky -> model -> field).  
_Note 3_: if enforce is provided as an object, the three fields missing/extra/type have to be defined. This limitation will be lifted when more important issues will be solved.  
_Note 4_: you currently cannot have a field named _type in your model. This limitation will be removed at some point.  

Examples of valid schema:

```
{ name: String }
{ name: { _type: String } }
{ name: { _type: String, default: "Unknown name" } }
{ age: { _type: Number, default: function() { return Math.random()*100 } } }
{ name: {_type: String, enforce: { missing: false, extra: false, type: true } }, age: { _type: Number, enforce: { missing: false, extra: false, type: true } }
{ user: { name: String, age: Number }}
{ comments: [ {author: String, comment: String} ] }
{ comments: {_type: Array, schema: {author: String, comment: String} } }
```

_Note:_ The settings to set a minimum/maximum of elements in an array is on the roadmap.


#### Model
__Model.compile(__ name, schema, settings, thinky __)__

_Internal method_



__Model.createBasedOnSchema(__ result, doc, originalDoc, enforce, prefix, schema __)__

_Internal method_



__Model.checkType(__ result, doc, originalDoc, schema, key, type, typeOf, prefix, enforce __)__

_Internal method_



__Model.define(__ key, method, force __)__

Define a _method_ on the model with the name _key_.
This method can be called by any instances of the model, whether the instances were created
before or after the definition of the method.

_Note_: If a method already exists with such name, an error will be thrown except if you pass force=true.  
We still recommand not to overwrite a method since it may be an internal one and can trigger an undefined behavior.


__Model.setSchema(__ schema __)__

Change the schema.

_Note_: When you change the schema, the instances previously created do not change.
We do not keep a reference of all objects now. We may add an option to do it later. 


__Model.getSettings(__  __)__

Return the settings of the model.



__Model.getPrimaryKey(__  __)__

Return the primary key of the model.



__Model.get(__ id or [ids], callback __)__

Retrieve one or more documents using their primary keys.


__Model.getAll(__ value or [values], indexName, callback __)__

Retrieve one or more documents using a secondary index


__Model.filter(__ filterFunction  __)__

Retrieve document based on the filter.


__Model.count(__  __)__

Return the number of element in the table of your model.



#### Document


__Document.getDocument(__  __)__

_Internal method?_



__Document.getModel(__  __)__

Return the model of the document.



__Document.getSettings(__  __)__



__Document.definePrivate(__ name, method  __)__

Define a method accessible through the key _name_.

The method will be accessible only by the document iself and not any other documents (including
those in the same class).


__Model.save(__ callback __)__

Save the object in the database. Thinky will call insert or update depending
on whether how the object was created.



__Document.merge(__ newDoc, replace __)

Merge newDoc in the document.
If _replace_ is set to _true_, the document will be replaced.

_Note_: The new document is checked agains the schema of the model.


All method of EventEmitter are available on Document. They do not pollute the document itself.

### Internals
When you create a new object from a model, the object has the following chain of prototypes
object -> DocumentObject -> Document -> model

Run the tests

```
mocha
```

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
