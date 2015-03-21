# Thinky
===============================
<a href="https://app.wercker.com/project/bykey/e5ab679f3412f8f86ef6488b31004fed"><img alt="Wercker status" src="https://app.wercker.com/status/e5ab679f3412f8f86ef6488b31004fed/m/master" align="right"></a>
Light Node.js ORM for RethinkDB.  

### Quick start 

Install:

```
npm install thinky
```

Use:

```javascript
var thinky = require('thinky')();

// Create a model - the table is automatically created
var Post = thinky.createModel("Post", {
  id: String,
  title: String,
  content: String,
  idAuthor: String
}); 

// You can also add constraints on the schema
var Author = thinky.createModel("Author", {
  id: type.string(),      // a normal string
  name: type.string().min(2)  // a string of at least two characters
  email: type.string().email()  // a string that is a valid email
});

// Join the models
Post.belongsTo(Author, "author", "idAuthor", "id");
```

Save a new post with its author.

```js
// Create a new post
var post = new Post({
  title: "Hello World!",
  content: "This is an example."
});

// Create a new author
var author = new Author({
  name: "Michel",
  email: "orphee@gmail.com"
});

// Join the documents
post.author = author;


post.saveAll().then(function(result) {
  /*
  post = result = {
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    title: "Hello World!",
    content: "This is an example.",
    idAuthor: "3851d8b4-5358-43f2-ba23-f4d481358901",
    author: {
      id: "3851d8b4-5358-43f2-ba23-f4d481358901",
      name: "Michel",
      email: "orphee@gmail.com"
    }
  }
  */
});
```

Retrieve the post with its author.

```js
Post.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin().run().then(function(result) {
  /*
  result = {
    id: "0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a",
    title: "Hello World!",
    content: "This is an example.",
    idAuthor: "3851d8b4-5358-43f2-ba23-f4d481358901",
    author: {
      id: "3851d8b4-5358-43f2-ba23-f4d481358901",
      name: "Michel",
      email: "orphee@gmail.com"
    }
  }
  */
});
```



### Docs

http://thinky.io


### Run the tests

```
npm test
```

### Contribute

You are welcome to do a pull request.


### Roadmap

The roadmap is defined with the issues/feedback on GitHub. Checkout:  
[https://github.com/neumino/thinky/issues](https://github.com/neumino/thinky/issues)


### Author
- Michel Tu -- orphee@gmail.com -- [blog](http://blog.justonepixel.com) -- [twitter](https://twitter.com/neumino)

### Contributors

- [chrisfosterelli](https://github.com/chrisfosterelli)
- [colprog](https://github.com/colprog)
- [dulichan](https://github.com/dulichan)
- [flienteen](https://github.com/flienteen)
- [marshall007](https://github.com/marshall007)
- [mindjuice](https://github.com/mindjuice)
- [Morhaus](https://github.com/Morhaus)
- [primitive-type](https://github.com/primitive-type)
- [nikaspran](https://github.com/nikaspran)
- [simonratner](https://github.com/simonratner)
- [wezs](https://github.com/wezs)


### License
Copyright (c) 2013-2014 Michel Tu <orphee@gmail.com>

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
