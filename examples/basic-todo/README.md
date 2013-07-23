# Basic example for Thinky

## Original code

The original source code is from [dreamerslab](http://dreamerslab.com)
- See their [https://github.com/dreamerslab.com)[github page].
- The tutorial was about express, see their [blog post](http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/).

We merely change a dozen of lines to use thinky and rethinkdb instead of mongoose and mongodb.


## Run the app

Install the dependencies

```
npm install
```


Start RethinkDB
```
rethinkdb
```

If you start RethinkDB running on a remote machine or with a driver port different than 28015, change the
settings in the `config.js` file.

Create the table `Todo`. You can do it yourself with RethinkDB web interface or just run the script
`init.js`.

```
node init.js
```


Start the app

```
node app.js
```

Open your browser to `http://localhost:3001/`


## What has changed?
Four files were modified:
- `db.js`
- `routes/index.js`
- `views/edit.ejs` and `views/index.ejs`

### db.js
This file defines how to connect to the database and the model `Todo`.

We first import thinky, then initialize the pool of connections with `init`.

We define a new model with `thinky.createModel`. 
We have to provide two arguments to this method:

- The first one is the name of the model (and also the name of the table)
- The second argument is the schema. It is just an object whose fields
map to a type.  
Note that we can provide default value in the schema.

```javascript
{
    id         : String,
    user_id    : String,
    content    : String,
    updated_at : {_type: Number , default: function() { return Date.now() } }
}
```

### routes/index.js
The only things that changed are the name of the method:

- `find` is `filter`
- `sort` is `orderBy`
- `exec` is `run`
- `findById` is `get`, 
- `remove` is `delete`

### views/*

The primary key we used is `id` and not `_id`, so we just had to replace a few names.
