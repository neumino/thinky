var config = require('./config.js');
// Import thinky
var thinky = require( 'thinky' );

// Initialize the pool of connections
thinky.init({
    host: config.host,
    port: config.port,
    db: config.db
}); 

// Define the schema for a Todo
var Todo = thinky.createModel('Todo', {
    id         : String,
    user_id    : String,
    content    : String,
    updated_at : {_type: Number , default: function() { return Date.now() } }
});
