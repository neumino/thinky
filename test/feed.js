var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var Document = require(__dirname+'/../lib/document.js');

var util = require(__dirname+'/util.js');
var assert = require('assert');
var Promise = require('bluebird');

var modelNameSet = {};
modelNameSet[util.s8()] = true;
modelNameSet[util.s8()] = true;
var modelNames = Object.keys(modelNameSet);

var cleanTables = function(done) {
  var promises = [];
  var name;
  for(var name in modelNameSet) {
    promises.push(r.table(name).delete().run());
  }
  Promise.settle(promises).finally(function() {
    // Add the links table
    for(var model in thinky.models) {
      modelNameSet[model] = true;
    }
    modelNames = Object.keys(modelNameSet);
    thinky._clean();
    done();
  });
}

describe('Feeds', function() {
  var Model;
  after(cleanTables);
  before(function(done) {
    Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number
    })
    Model.on('ready', function() {
      done();
    });
  });

  it('should work after changes()', function(done){
    Model.changes().run().then(function(feed) {
      assert(feed)
      assert.equal(feed.toString(), '[object Feed]')
      feed.close();
      done();
    }).error(done);
  });
  it('should implement each', function(done){
    var data = [{}, {}, {}]
    Model.changes().run().then(function(feed) {
      var count = 0;
      feed.each(function(err, doc) {
        if (err) {
          return done(err);
        }
        assert(doc instanceof Document);
        count++;
        if (count === data.length) {
          feed.close().then(function() {
            done();
          }).error(done);
        }
      })
      //Model.insert(data).execute().error(done);
      Model.save(data).error(done);
    }).error(done);
  });
  it('should implement next', function(done){
    var data = [{}, {}, {}]
    Model.changes().run().then(function(feed) {
      var count = 0;
      feed.next().then(function(doc) {
        assert(doc instanceof Document);
        return feed.next();
      }).then(function(doc) {
        assert(doc instanceof Document);
        return feed.next();
      }).then(function(doc) {
        assert(doc instanceof Document);
        return feed.close()
      }).then(function() {
        done();
      }).error(done);

      Model.save(data).error(done);
    }).error(done);
  });
  it('should handle events', function(done){
    var data = [{}, {}, {}]
    Model.changes().run().then(function(feed) {
      var count = 0;
      feed.on('data', function(doc) {
        assert(doc instanceof Document);
        count++;
        if (count === data.length) {
          feed.removeAllListeners();
          feed.close().then(function() {
            done();
          }).error(done);
        }
      });

      Model.save(data).error(done);
    }).error(done);
  });



});
