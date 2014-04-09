var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('schema', function(){
    it('Create a new model', function(done){
        var name = util.s8();
        try {
            thinky.createModel(name, {id: 1}, {init: false})
        }
        catch(err) {
            done();
        }
    });
});
