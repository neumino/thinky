// This file is just to insert some fake data.
// You do not need to run this file before starting app.js
// Since 1.0, thinky will create the tables itself.

var r = require('rethinkdb');
var config = require('./config.js');
var util = require('util');

var connection;

// Connect
var connect = function() {
    r.connect({
        host: config.host,
        port: config.port,
        db: config.db
    }, function(error, conn) {
        if (error) throw error;
        connection = conn;
        createDatabase();
    });
}

// Create the database
var createDatabase = function() {
    r.dbCreate(config.db).run(connection, function(error, result) {
        if (error) console.log(error);
        if ((result != null) && (result.dbs_created === 1)) {
            console.log('Database `blog` created');
        }
        else {
            console.log('Error: Database `blog` not created');
        }
        createTablePost()
    })
}

// Create the table Post
var createTablePost = function() {
    r.db(config.db).tableCreate('Post').run(connection, function(error, result) {
        if (error) console.log(error);
    
        if ((result != null) && (result.tables_created === 1)) {
            console.log('Table `Post` created');
        }
        else {
            console.log('Error: Table `Post` not created');
        }
        createCommentTable()
    });
}

// Create the table Comment
var createCommentTable = function() {
    r.db(config.db).tableCreate('Comment').run(connection, function(error, result) {
        if (error) console.log(error);
    
        if ((result != null) && (result.tables_created === 1)) {
            console.log('Table `Comment` created');
        }
        else {
            console.log('Error: Table `Comment` not created');
        }
        createAuthorTable()
    });
}

// Create the table Author
var createAuthorTable = function() {
    r.db(config.db).tableCreate('Author').run(connection, function(error, result) {
        if (error) console.log(error);
    
        if ((result != null) && (result.tables_created === 1)) {
            console.log('Table `Author` created');
        }
        else {
            console.log('Error: Table `Author` not created');
        }
        createCommentIndex()
    });
}

// Create the index postId on the table Comment
var createCommentIndex = function() {
    r.db(config.db).table('Comment').indexCreate('postId').run(connection, function(error, result) {
        if (error) console.log(error);
    
        if ((result != null) && (result.created === 1)) {
            console.log('Index `postId` created on `Comment`');
        }
        else {
            console.log('Error: Index `postId` not created');
        }
        insertAuthors()
    });
}

// Insert authors
var insertAuthors = function() {
    r.db(config.db).table('Author').insert([{"website":"http://guest.justonepixel.com","name":"Guest","id":"26227111-68fa-45d6-851a-d7e969d3e1f2","email":"guest@justonepixel.com"},{"website":"http://marc.justonepixel.com","name":"Marc","id":"1f54250b-9cb2-4e07-9925-94c5b1df23f5","email":"marc@justonepixel.com"},{"website":"http://blog.justonepixel.com","name":"Michel","id":"79db932d-c74d-4e94-86d9-e665bbc53519","email":"orphee@gmail.com"}]).run(connection, function(error, result) {
        if (error) console.log(error);
    
        if ((result != null) && (result.errors === 0)) {
            console.log('Added authors data');
        }
        else {
            console.log('Error: Failed to add authors data.');
        }
        insertPosts()
    });
}

// Insert posts
var insertPosts = function() {
    r.db(config.db).table('Post').insert([{"title":"Lorem ipsum dolor sit amet","text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis facilisis pulvinar convallis. Phasellus ac consectetur nunc, ac convallis elit. Maecenas vitae leo luctus, euismod lorem at, consectetur leo. Fusce interdum fringilla massa, tristique semper elit varius sit amet. Praesent nibh sem, elementum vel euismod nec, posuere ut ipsum. Phasellus convallis rutrum orci eget suscipit. Fusce turpis diam, lacinia sit amet tortor ac, mattis sagittis libero. In et laoreet orci. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Fusce eleifend euismod nulla nec dapibus. Maecenas at mi ut purus tristique tempor. Ut ac pellentesque urna. Donec placerat purus sed rhoncus blandit. Nam nunc dui, hendrerit a placerat quis, sagittis eget tellus.","id":"e6e8a00b-4a20-4b09-8bff-6ca4bd80778c","date":r.now().sub(Math.random()*365*24*60*60),"authorId":"79db932d-c74d-4e94-86d9-e665bbc53519"},{"title":"Pellentesque non congue erat","text":"Pellentesque non congue erat, sit amet tincidunt erat. Fusce justo leo, facilisis ac semper sit amet, luctus vel est. Nulla adipiscing tincidunt purus, vitae pulvinar mauris sagittis eget. Proin vulputate pulvinar feugiat. Sed vitae ornare lacus. Suspendisse dolor sem, semper ac magna at, fringilla tristique mauris. Aenean purus nibh, bibendum ut risus commodo, consequat euismod justo. Nullam feugiat commodo sagittis. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec nec velit elit. Curabitur sit amet justo sapien. Praesent vel purus id justo volutpat faucibus quis ut dolor. Morbi ut tellus in magna pellentesque rutrum ut non felis. Morbi condimentum enim nec pellentesque aliquam.","id":"431bedba-2c65-464a-a07f-a77270ba0266","date":r.now().sub(Math.random()*365*24*60*60),"commentIds":[],"authorId":"26227111-68fa-45d6-851a-d7e969d3e1f2"},{"title":"Cras placerat vitae lacus","text":"Cras placerat vitae lacus ut imperdiet. Nulla tempus placerat nibh, eget sollicitudin ligula mattis quis. Sed lobortis libero id elit rhoncus, molestie vestibulum dui consequat. Pellentesque dapibus vel sapien eget laoreet. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam vulputate ligula id sodales luctus. Nam at purus tempus, bibendum mauris vitae, feugiat velit. Etiam vitae vestibulum metus, in faucibus nibh. Maecenas sollicitudin lacus tortor, sit amet aliquet nisi porttitor a. Ut euismod, dui aliquam molestie ultricies, velit risus tincidunt purus, ut vulputate nunc odio id nunc.","id":"936c9b54-1914-49ea-ba39-b41b00b9e463","date":r.now().sub(Math.random()*365*24*60*60),"commentIds":[],"authorId":"1f54250b-9cb2-4e07-9925-94c5b1df23f5"},{"title":"Sed arcu tortor, accumsan non quam eget","text":"Sed arcu tortor, accumsan non quam eget, faucibus porttitor nulla. Morbi vel elit commodo, ultrices mauris id, ultrices eros. Suspendisse nec ante quis mi hendrerit sodales. Sed ipsum nibh, sagittis sed tristique eu, facilisis ut erat. Proin suscipit, ligula ut mattis auctor, sapien mauris aliquet velit, nec pretium mi eros vel libero. Aenean ornare tellus sed nunc ultricies, a commodo turpis sollicitudin. Integer rhoncus aliquam odio at faucibus. Vestibulum vulputate, mi a varius viverra, ante justo consectetur leo, imperdiet iaculis orci nunc sit amet metus. Quisque consectetur ligula in lorem pellentesque, lobortis imperdiet ante ullamcorper","id":"ee471f2e-619a-45c0-a3fa-91b246f87bee","date":r.now().sub(Math.random()*365*24*60*60),"authorId":"1f54250b-9cb2-4e07-9925-94c5b1df23f5"}]).run(connection, function(error, result) {
        if (error) console.log(error);

        if ((result != null) && (result.errors === 0)) {
            console.log('Added posts data');
        }
        else {
            console.log('Error: Failed to add posts data');
        }
        insertComments()
    });
}

// Insert comments
var insertComments = function() {
    r.db(config.db).table('Comment').insert([{"postId":"431bedba-2c65-464a-a07f-a77270ba0266","name":"Maecenas","id":"10b8173c-2f4b-4d77-97bc-84f52292048e","date":r.now().sub(Math.random()*365*24*60*60),"comment":"Ut fringilla tincidunt rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi vitae hendrerit arcu, nec accumsan magna. Aenean a vehicula ligula. Phasellus dapibus ultricies velit, a viverra diam pulvinar a."},{"postId":"936c9b54-1914-49ea-ba39-b41b00b9e463","name":"Callus","id":"d3110239-7120-437b-8e6c-f4630d24b2ed","date":r.now().sub(Math.random()*365*24*60*60),"comment":"Uis. Sed lobortis libero id elit rhoncus, molestie vestibulum dui consequat. Pellentesque dapibus vel sapien eget laoreet."},{"postId":"936c9b54-1914-49ea-ba39-b41b00b9e463","name":"Marcus","id":"df8386fb-f148-4c6c-b382-022c08b2a640","date":r.now().sub(Math.random()*365*24*60*60),"comment":"Vulputate ligula id sodales luctus. Nam at purus tempus, bibendum mauris vitae, feugiat velit. Etiam vitae vestibulum metus, in faucibus nibh. Maecenas sollicitudin lacus tortor, sit amet aliquet nisi porttitor a. Ut euismod, dui aliquam molestie ultricies, velit risus tincid,"},{"postId":"936c9b54-1914-49ea-ba39-b41b00b9e463","name":"Seneque","id":"663d4bfb-e1ad-48b7-901c-e8b4acf75b0f","date":r.now().sub(Math.random()*365*24*60*60),"comment":"Per inceptos himenaeos. Nam vulputate ligula id sodales luctus. Nam at purus tempus, bibendum mauris vitae, feugiat velit. Etiam vitae vestibulum."}]).run(connection, function(error, result) {
        if (error) console.log(error);

        if ((result != null) && (result.errors === 0)) {
            console.log('Added comments data');
        }
        else {
            console.log('Error: Failed to add comment data');
        }
        connection.close();
        process.exit();
    });
}

// Roll out everything
connect();
