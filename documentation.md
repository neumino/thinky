---
layout: page
class: documentation
---

## Documentation

### Thinky

<a id="thinky.init" class="anchor-first"></a>
__Thinky.init(__ options __)__ [»](#thinky.init)

`options` is an object that can have the following fields:

- `host`: String, RethinkDB host (default value: "localhost")
- `port`: Number, RethinkDB port (default value: 28015)
- `db`: Default database (default value: "test")
- `poolMax`: Maximum number of connections in the pool (default value: 10)
- `poolMin`: Minimum number of connections in the pool (default value: 1)
- `enforce`: Object with 3 fields:
    - `missing`: Throw an error if a field is missing (default value false)
    - `extra`: Throw an error if an extra field is provided (default value false)
    - `type`: Throw an error if a field does match the expected type (default value true)

_Note_: Passing a boolean for `enforce` will set all three fields of enforce to this value.



<a id="thinky.getoptions" class="anchor"></a>
__Thinky.getOptions()__  [»](#thinky.getoptions)

Returns all the options previously set.



<a id="thinky.getoption" class="anchor"></a>
__Thinky.getOption(__ optionName __)__  [»](#thinky.getoption)

Returns the value for `optionName`. Possible values:

- `host`: RethinkDB host
- `port`: RethinkDB port for client
- `db`: default database
- `poolMax`: The maximum number of connections in the pool
- `poolMin`: The minimum number of connections in the pool
- `enforce`: Object with 3 fields:
    - `missing`: Throw an error if a field is missing (default value false)
    - `extra`: Throw an error if an extra field is provided (default value false)
    - `type`: Throw an error if a field does match the expected type (default value true)




<a id="thinky.setoptions" class="anchor"></a>
__Thinky.setOptions(__ options __)__  [»](#thinky.setoptions)

Overwrite the options defined in _options_.

The argument `options` is an object that can have the following fields

- `host`: String, RethinkDB host (default value: "localhost")
- `port`: Number, RethinkDB port (default value: 28015)
- `db`: Default database (default value: "test")
- `poolMax``: Maximum number of connections in the pool (default value: 10)
- `poolMin: Minimum number of connections in the pool (default value: 1)
- `enforce`: Object with 3 fields:
    - `missing`: Throw an error if a field is missing (default value false)
    - `extra`: Throw an error if an extra field is provided (default value false)
    - `type`: Throw an error if a field does match the expected type (default value true)

_Note_: Passing a boolean for `enforce` will set all three fields of enforce to this value.

_Note_: Setting a value to `null` will set it to the default value.

_Note_: Changing the host/port/poolMax/poolMin will create a new pool (the previous one will be drained).  
The current behavior when changing poolMin/poolMax will be fixed at some point.



<a id="thinky.disconnect" class="anchor"></a>
__Thinky.disconnect()__  [»](#thinky.setoptions)

Close all the connections.


<a id="thinky.disconnect" class="anchor"></a>
__Thinky.createModel(__ name, schema, settings __)__ [»](#thinky.setoptions)

Create a new model

- `name` is the name of the model, which is also the name of the table.
- `schema`: An object which fields can map to the following value
    - `String`
    - `Number`
    - `Boolean`
    - An array with one type (like `[String]`, `[Number]`, `[{name: String, age: Number}]`
    - An object that contains a valid schema
    - An object with a _type field which is `String`, `Number` or `Boolean`. Such object can contains options
        - enforce: That will overwrite the enforce option of the model
        - default: It can be a variable or a function. The function is executed when the object is created.  
        The first argument of the function is the object passed to create the new instance of the model.
    - An object with a _type field which is `Object` or `Array` and a field schema that is a valid schema. Such object can contains options
        - enforce: That will overwrite the enforce option of the model
        - default: It can be a variable or a function. The function is executed when the object is created.  
        The first argument of the function is the object passed to create the new instance of the model.
- `options`: An object that can contains the fields
    - `primaryKey`: The primary key of the table (default to "id")
    - `enforce`: Object with 3 fields:
        - `missing`: Throw an error if a field is missing (default value false)
        - `extra`: Throw an error if an extra field is provided (default value false)
        - `type`: Throw an error if a field does match the expected type (default value true)


When an object with the field `_type` is passed, the enforce field will be use to overwrite the global settings for enforcing the schema


Examples of fields for a schema:

```javascript
{
    stringField: String,
    numberField: Number,
    booleanField: Boolean,
    arrayOfStrings: [String],
    arrayOfNumber: [Number],
    objectField: {
        nestedString: String,
        nestedBoolean: Boolean
    },
    stringFieldWithOptions: {
        _type: String,
        enforce: { missing: false, type: true },
        default: "Constant string as a default" 
    },
    numberFieldWithOptions: {
        _type: Number,
        enforce: { missing: true, type: true } },
        default: function(doc) { return doc["age"] },
    booleanFieldWithOptions: {
        _type: Boolean,
        enforce: { missing: false, type: false }
    },
    objectFieldWithOptions: {
        _type: Object,
        schema: {
            nestedStringField: String,
            nestedNumberField: Number
        },
        enforce: {
            missing: true,
            type: true
        }
    }
    arrayFieldWithOptions: {
        _type: Array,
        schema: [Number],
        enforce: {
            missing: false,
            type: true
        }
    }
}
```

_Note_: the fields `enforce` and `default` are optional.  

_Note_: the value of `enforce` is defined by the most local one.

_Note_: you currently cannot have a field named `_type` in your model.  
This limitation will be removed at some point (by letting the user named the field _type with any available key).

_Note:_ The settings to set a minimum/maximum of elements in an array is on the roadmap.



### Model


<a id="model.define" class="anchor-first"></a>
__Model.define(__ key, method, force=false __)__ [»](#model.define)

Defines a _method_ on the model with the name _key_.
This method can be called by any instances of the model, whether the instances were created
before or after the definition of the method.

_Note_: If a method already exists with such name (including internal methods), an error will be thrown.
If you are sure about what you are doing, you can pass the value `true` for the `force` argument.

_Note_: The methods are bound to the prototype of the object. So if the instance of your model has a field
`hello`, you will be able to create a method named `hello`, but you will not be able to access it
with `object.hello()`. You will have to use `object.__proto__.hello()`


<a id="model.execute" class="anchor"></a>
__Model.execute(__ query, callback __)__ [»](#model.execute)

Executes the `query` and call the `callback` with two arguments

- `error` if any error occured
- an instance of the model or an array of instances

This method lets you execute arbitrary queries as long as they return objects
from the table.



<a id="model.setSchema" class="anchor"></a>
__Model.setSchema(__ schema __)__ [»](#model.setschema)

Change the schema of a model.  

_Note_: When you change the schema, the instances previously created do not change!
And the next updates of the instances will use the new schema (so errors may be thrown).

_Conclusion_: While available, you probably do not want to use this method.


<a id="model.getsettings" class="anchor"></a>
__Model.getSettings()__ [»](#model.getsettings)

Returns the settings of the model.


<a id="model.getprimarykey" class="anchor"></a>
__Model.getPrimaryKey()__ [»](#model.getsettings)

Returns the primary key of the model.



<a id="model.get" class="anchor"></a>
__Model.get(__ id, callback __)__ [»](#model.get)

Retrieves a document (or documents) by primary keys.
Returns the query. The query is not executed if callback is not passed.

- `id` can be
    - The value of the primary key of the object you want to retrieve
    - An array of values of the primary keys of the objects you want to retrieve
- `callback` is the callback that is going to be called. Two arguments are passed to the callback:
    - `error`, which is the error if one occured.
    - `result` an instance of the model or an array of instances.


_Note_: Thinky does not currently keep track of the created objects (to avoid leaks), so
new objects are going to be created even if they somehow already exist.



<a id="model.getall" class="anchor"></a>
__Model.getAll(__ value, options, callback __)__ [»](#model.getall)

Retrieves documents with a secondary index.
Returns the query. The query is not executed if callback is not passed.

- `value` can be
    - The value of the secondary index of the object you want to retrieve
    - An array of values for the secondary indexes
- `indexName` is the name of the index used
- `callback` is the callback that is going to be called. Two arguments are passed to the callback:
    - `error`, which is the error if one occured.
    - `result` an array of instances.
- options can only have the field
    - `index`: The index used. The default value will be the primary key
    will be the instance of the classe with its joined documents.



<a id="model.filter" class="anchor"></a>
__Model.filter(__ filterFunction, callback  __)__ [»](#model.filter)

Retrieve documents based on the filterFunction.
Returns the query. The query is not executed if callback is not passed.

- `filterFunction` is an anynonymous function passed in the query to filter the results we want.
- `callback` is the callback that is going to be called. Two arguments are passed to the callback:
    - `error`, which is the error if one occured.
    - `result` an array of instances.


<a id="model.skip" class="anchor"></a>
__Model.skip(__ skipValue, callback  __)__ [»](#model.skip)

Retrieve documents of the model and skip `skipValue` documents.
Returns the query. The query is not executed if callback is not passed.


<a id="model.limit" class="anchor"></a>
__Model.limit(__ limitValue, callback  __)__ [»](#model.limit)

Retrieve documents and limit to `limitValue` documents.
Returns the query. The query is not executed if callback is not passed.

<a id="model.orderby" class="anchor"></a>
__Model.orderBy(__ field, callback  __)__ [»](#model.orderby)

Order results by `field`.
`field` can be a single field or an array of fields.

Returns the query. The query is not executed if callback is not passed.


<a id="model.getjoin" class="anchor"></a>
__Model.getJoin(__ callback  __)__ [»](#model.getjoin)

Order results by `field`.
`field` can be a single field or an array of fields.

Returns the query. The query is not executed if callback is not passed.



<a id="model.count" class="anchor"></a>
__Model.count()__ [»](#model.count)

Returns the number of elements in the table of your model.
Returns the query. The query is not executed if callback is not passed.


<a id="model.addlistener" class="anchor"></a>
__Model.addListener(__ event, listener __)__ [»](#model.addlistener)

Add a listener on the model.  
Everytime a new instance will be created, the listeners defined on the model
will be added to the document.

_Note_: Previously created document will not have such listeners.


<a id="model.on" class="anchor"></a>
__Model.on(__ event, listener __)__ [»](#model.on)

Alias for addListener



<a id="model.once" class="anchor"></a>
__Model.once(__ event, listener __)__ [»](#model.once)

Add a listener on the model. Everytime a new instance will be created, the listeners defined on the model
will be added to the document.

Such listener can be triggered at most once per document.



<a id="model.off" class="anchor"></a>
__Model.off(__ event, listener __)__ [»](#model.off)

Remove the listener bound to the event.

Other ways to use it:

- If only the event is passed, all listeners of this event will be removed.
- If the event passed is a function, it will be considered as a listener, and thinky will remove this listener from all events of the model.
- If no argument is supplied, all events/listeners are removed.


<a id="model.listeners" class="anchor"></a>
__Model.listeners(__ event, raw __)__ [»](#model.listeners)

Returns all the listeners for this event. These listeners can be

- The listeners passed in `addListener/on`
- Object like this one:

If event is null or undefined, the object containing all the listeners will be returned.

```
{
    once: true,
    listener: listener
}
```

If `raw` is set to false (default is true), the objects are replaced by the listener they contain.



<a id="model.hasone" class="anchor"></a>
__Model.hasOne(__ model, fieldName, joinClause __)__ [»](#model.hasone)

Create a "has one" relation between two models. The arguments are

- `model` the model that is going to be joined
- `fieldName` is the name of the field where the joined document will be saved
- `joinClause` is an object with two fields that define how the join will be performed
    - `leftKey`: The key of this model - the one on which you are calling `hasJoin` -, that will be used to do the join.
    - `rightKey`: The key of the model - that you passed as an argument -, that will be used to do the join.

Example

```javascript
// Create the models
var Cat = thinky.createModel('Cat', {name: String, idHuman: String}); 
var Human = thinky.createModel('Human', {name: String}); 

// Specify the join
Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'})

// Create a new joined document
kitty = new Cat({name: 'Kitty'});
michel = new Human({name: Michel});
kitty.owner = michel;

kitty.save(function(err, result) {
    if (err) throw err;
    console.log(result); // Note: kitty === result
    /* will print:
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
}, {saveJoin: true});


// Retrieve a document with its joined ones
Cat.get('0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a', function(err, result) {
    if (err) throw err;
    console.log(result);
    /*  will print
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
   
}, {getJoin: true})
```


<a id="model.hasmany" class="anchor"></a>
__Model.hasMany(__ model, fieldName, joinClause __)__ [»](#model.hasmany)

Create a "has one" relation between two models. The arguments are

- `model` the model that is going to be joined
- `fieldName` is the name of the field where the joined document will be saved
- `joinClause` is an object with two fields that define how the join will be performed
    - `leftKey`: The key of this model - the one on which you are calling `hasJoin` -, that will be used to do the join.
    This field is an array of values.
    - `rightKey`: The key of the model - that you passed as an argument -, that will be used to do the join.


Example:

```javascript
Cat = thinky.createModel('Cat', {id: String, name: String, taskIds: [String]});
Task = thinky.createModel('Task', {id: String, task: String});
Cat.hasMany(Task, 'tasks', {leftKey: 'taskIds', rightKey: 'id'});

cat = new Cat({name: "Catou"});
task1 = new Task({task: "Catch the red dot"});
task2 = new Task({task: "Eat"});
task3 = new Task({task: "Sleep"});

cat.tasks = [task1, task2, task3];
cat.save( function(err, result) {
    if (err) throw err;
    console.log(result); // Note: cat === result
    /* will print
    {
        id: 'b7588193-7fb7-42da-8ee3-897392df3738',
        name: 'Catou',
        taskIds: [
            'd4333984-f7c6-48cb-a64e-8d9666d9eaf0',
            '09b2eba9-0d26-4e6c-b735-da2442e1caa6',
            '5cc7eb9e-f924-4cae-89b5-95db19753b0b'
        ],
        tasks: [
            {
                id: 'd4333984-f7c6-48cb-a64e-8d9666d9eaf0',
                task: 'Catch the red dot'
            },
            {
                id: '09b2eba9-0d26-4e6c-b735-da2442e1caa6',
                task: 'Eat'
            },
            {
                id: '5cc7eb9e-f924-4cae-89b5-95db19753b0b',
                task: 'Sleep'
            }
        ]
    }
    */
}, {saveJoin: true})

// Retrieve joined documents
Cat.get( 'b7588193-7fb7-42da-8ee3-897392df3738', function(err, result) {
    if (err) throw err;
    console.log(result);
    /* will print
    {
        id: 'b7588193-7fb7-42da-8ee3-897392df3738',
        name: 'Catou',
        taskIds: [
            'd4333984-f7c6-48cb-a64e-8d9666d9eaf0',
            '09b2eba9-0d26-4e6c-b735-da2442e1caa6',
            '5cc7eb9e-f924-4cae-89b5-95db19753b0b'
        ],
        tasks: [
            {
                id: 'd4333984-f7c6-48cb-a64e-8d9666d9eaf0',
                task: 'Catch the red dot'
            },
            {
                id: '09b2eba9-0d26-4e6c-b735-da2442e1caa6',
                task: 'Eat'
            },
            {
                id: '5cc7eb9e-f924-4cae-89b5-95db19753b0b',
                task: 'Sleep'
            }
        ]
    }
    */
}, {saveJoin: true})


```

### Query

_Note_: These methods are the same as the one defined on Model.
The Query function is defined so you can chain methods (like with the
driver).


<a id="query.get" class="anchor-first"></a>
__Query.get(__ id, callback __)__ [»](#query.get)


<a id="query.getAll" class="anchor"></a>
__Query.getAll(__ value, options, callback __)__ [»](#query.getall)


<a id="query.filter" class="anchor"></a>
_Query.filter(__ filterFunction, callback  __)__ [»](#query.filter)


<a id="query.skip" class="anchor"></a>
__Model.skip(__ skipValue, callback  __)__ [»](#model.skip)


<a id="query.limit" class="anchor"></a>
__Model.limit(__ limitValue, callback  __)__ [»](#model.limit)


<a id="query.orderby" class="anchor"></a>
__Query.orderBy(__ field, callback  __)__ [»](#model.orderby)


<a id="query.count" class="anchor"></a>
__Query.count()__ [»](#query.count)

<a id="query.getjoin" class="anchor"></a>
__Query.getJoin(__ callback __)__ [»](#query.getjoin)




### Document

<a id="document.getmodel" class="anchor"></a>
__Document.getModel(__  __)__ [»](#document.getmodel)

Returns the model of the document.


<a id="document.getsettings" class="anchor"></a>
__Document.getSettings(__  __)__ [»](#document.getmodel)

Returns the settings of the document.


<a id="document.definePrivate" class="anchor"></a>
__Document.definePrivate(__ name, method  __)__ [»](#document.defineprivate)

Defines a method accessible through the key _name_.

The method will be accessible only by the document iself and not any other documents (including
those in the same class).


<a id="document.save" class="anchor"></a>
__Document.save(__ callback __)__ [»](#document.save)
__Document.save(__ options, callback __)__ [»](#document.save)

Save the object in the database. Thinky will call insert or update depending
on how the object was created.

The event `save` is triggered if the document is successfully saved.

The argument `options` can have the following fields:

- `saveJoin`, which is a boolean. If set to true, the joined documents will be saved (default value is false).

<a id="document.delete" class="anchor"></a>
__Document.delete(__ callback __)__ [»](#document.delete)
__Document.delete(__ options, callback __)__ [»](#document.delete)

Delete the object in the database. 

The event `delete` is triggered if the document is successfully deleted.

The argument `options` can have the following fields:

- `deleteJoin`, which is a boolean. If set to true, the joined documents will be deleted (default value is false).


<a id="document.merge" class="anchor"></a>
__Document.merge(__ newDoc, replace __)__ [»](#document.merge)

Merges the fields of `newDoc` in the document. The merge is recursive.

If `replace` is set to `true`, the document will be replaced (that is how you can delete fields).

The event 'change' is triggered if the document is changed.

_Note_: The new document is checked agains the schema of the model, so the merge may throw an error.


<a id="document.addlistener" class="anchor"></a>
__Document.addListener(__ event, listener __)__ [»](#document.addlistener)

Add a _listener_ for an event.  
This method is copied from `events.EventEmitter`.



<a id="document.on" class="anchor"></a>
__Document.on(__ event, listener __)__ [»](#document.on)

Add a _listener_ for an event.   
This method is an alias for `Document.addListener`.  


<a id="document.once" class="anchor"></a>
__Document.once(__ event, listener __)__  [»](#document.once)

Add a _listener_ for an event that is going to be removed once it is triggered once.   
Method from `events.EventEmitter`.


<a id="document.removelistener" class="anchor"></a>
__Document.removeListener(__ event, listener __)__  [»](#document.removelistener)

Remove a listener for an event.  
Method from `events.EventEmitter.`


<a id="document.off" class="anchor"></a>
__Document.off(__event, listener __)__ [»](#document.off)

Remove a listener for an event.

This method is slightly different than the one of `events.EventEmitter`.
- If no argument is provided to `off()`, all listeners of the document will be removed.  
- If only an event is provided, all listeners for this event will be removed.  
- If an event and a listener are provided, the listener will be removed from the event provided.


<a id="document.off" class="anchor"></a>
__Document.removeAllListeners(__ event __)__ [»](#document.removealllisteners)

Remove a listener for a particular event.
If no argument is provided, it willremove all the listeners for all events.


<a id="document.setmaxlisteners" class="anchor"></a>
__Document.setMaxListeners(__ n __)__ [»](#document.setmaxlisteners)

Set the maximum of listeners.   
Method from `events.EventEmitter`.


<a id="document.listeners" class="anchor"></a>
__Document.listeners(__ event __)__ [»](#document.listeners)

Returns all the listeners for this event. These listeners can be

- The listeners passed in `addListener/on`
- Object like this one:

```
{
    once: true,
    listener: listener
}
```

If `raw` is set to false (default is true), the objects are replaced by the listener they contain.


<a id="document.emit" class="anchor"></a>
__Document.emit(event, [arg1], [arg2], [...]) [»](#document.emit)

Execute each of the listeners in order with the supplied arguments.




## Internal methods
_Note_: More docs are coming...

### Model
__Model.compile(__ name, schema, settings, thinky __)__

This method is called by `Thinky.createModel` and is the core that creates models.



__Model.createBasedOnSchema(__ result, doc, originalDoc, enforce, prefix, schema __)__

Create an instance of a model based on doc.



__Model.checkType(__ result, doc, originalDoc, schema, key, type, typeOf, prefix, enforce __)__

For every key of an object provided to create an instance of a model, we are going to check
the type of the value and see if it is a valid one or not.


<a id="model.\_execute" class="anchor-first"></a>
__Model.\_execute(__ query, callback __)__ [»](#model._execute)

Similar to `Model.execute` but just call `callback` without wrapping it.


### Document
<a id="document.getdocument" class="anchor"></a>
__Document.getDocument(__  __)__ [»](#document.getdocument)

