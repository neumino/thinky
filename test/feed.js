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

describe('Atom feeds', function() {
  var Model;
  //after(cleanTables);
  before(function(done) {
    Model = thinky.createModel(modelNames[1], {
      id: String,
      str: String,
      num: Number
    })
    Model.on('ready', function() {
      done();
    });
  });

  it('get().changes() should work - and remove default(r.error)', function(done){
    Model.get(1).changes({includeInitial: true}).run().then(function(doc) {
      assert(doc)
      assert.deepEqual(doc, {});
      return doc.closeFeed();
    }).then(function() {
      done();
    }).error(done);
  });

  it('change events should be emitted - insert', function(done){
    var data = {id: 'foo', str: 'bar', num: 3};
    Model.get(data.id).changes({includeInitial: true}).run().then(function(doc) {
      assert(doc)
      assert.deepEqual(doc, {});
      doc.on('change', function() {
        assert.deepEqual(doc.getOldValue(), null);
        assert.deepEqual(doc, data);
        doc.closeFeed().then(function() {
          done();
        }).error(done);
      });
      Model.save(data);
    }).error(done);
  });
  it('change events should be emitted - update', function(done){
    var data = {id: 'buzz', str: 'bar', num: 3};
    Model.save(data).then(function() {
      Model.get(data.id).changes({includeInitial: true}).run().then(function(doc) {
        assert.deepEqual(doc, data);
        doc.on('change', function() {
          assert.deepEqual(doc.getOldValue(), data);
          assert.deepEqual(doc, {id: 'buzz', str: 'foo', num: 3});
          doc.closeFeed().then(function() {
            done();
          }).error(done);
        });
        Model.get(data.id).update({str: "foo"}).run().error(done);
      }).error(done);
    })
  });
  it('change events should be emitted - delete', function(done){
    var data = {id: 'bar', str: 'bar', num: 3};
    Model.save(data).then(function() {
      Model.get(data.id).changes({includeInitial: true}).run().then(function(doc) {
        assert.deepEqual(doc, data);
        doc.on('change', function() {
          assert.deepEqual(doc.getOldValue(), data);
          assert.deepEqual(doc, {});
          assert.equal(doc.isSaved(), false)
          doc.closeFeed().then(function() {
            done();
          }).error(done);
        });
        Model.get(data.id).delete().run().error(done);
      }).error(done);

    })
  });
  it('change events should be emitted - all', function(done){
    var data = {id: 'last', str: 'bar', num: 3};
    Model.get(data.id).changes({includeInitial: true}).run().then(function(doc) {
      assert(doc)
      assert.deepEqual(doc, {});
      var count = 0;
      doc.on('change', function() {
        if (count === 0) {
          assert.deepEqual(doc.getOldValue(), null);
          assert.deepEqual(doc, data);
        }
        else if (count === 1) {
          assert.deepEqual(doc, {id: 'last', str: 'foo', num: 3});
        }
        else if (count === 2) {
          assert.deepEqual(doc, {});
          assert.equal(doc.isSaved(), false)
          doc.closeFeed().then(function() {
            done();
          }).error(done);
        }
        count++;
      });
      Model.save(data).then(function() {
        return Model.get(data.id).update({str: 'foo'}).run();
      }).then(function() {
        Model.get(data.id).delete().run();
      }).error(done);
    }).error(done);
  });
});

