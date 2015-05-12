'use strict';

var TestFixture = require('./test-fixture'),
    Document = require('../lib/document'),

    assert = require('assert'),
    util = require('./util');

var test = new TestFixture();
describe('Feeds', function() {
  before(function(done) {
    test.Model = test.createModel(util.s8(), {
      id: String,
      str: String,
      num: Number
    });

    test.Model.on('ready', function() {
      done();
    });
  });

  after(function() {
    return test.dropTables();
  });

  it('should work after changes()', function() {
    return test.Model.changes().run().then(function(feed) {
      assert(feed);
      assert.equal(feed.toString(), '[object Feed]');
      feed.close();
    });
  });

  it('should implement each', function(done) {
    var data = [{}, {}, {}];
    test.Model.changes().run().then(function(feed) {
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
          });
        }
      });

      test.Model.save(data);
    });
  });

  it('should implement next', function(done) {
    var data = [{}, {}, {}];
    test.Model.changes().run().then(function(feed) {
      feed.next().then(function(doc) {
        assert(doc instanceof Document);
        return feed.next();
      }).then(function(doc) {
        assert(doc instanceof Document);
        return feed.next();
      }).then(function(doc) {
        assert(doc instanceof Document);
        return feed.close();
      }).then(function() {
        done();
      });

      test.Model.save(data);
    });
  });

  it('should handle events', function(done) {
    var data = [{}, {}, {}];
    test.Model.changes().run().then(function(feed) {
      var count = 0;
      feed.on('data', function(doc) {
        assert(doc instanceof Document);
        count++;
        if (count === data.length) {
          feed.removeAllListeners();
          feed.close().then(function() {
            done();
          });
        }
      });

      test.Model.save(data);
    });
  });
});

describe('Atom feeds', function() {
  before(function(done) {
    test.Model = test.createModel(util.s8(), {
      id: String,
      str: String,
      num: Number
    });

    test.Model.on('ready', function() {
      done();
    });
  });

  after(function() {
    return test.dropTables();
  });

  it('get().changes() should work - and remove default(r.error)', function() {
    test.Model.get(1).changes().run().then(function(doc) {
      assert(doc);
      assert.deepEqual(doc, {});
      return doc.closeFeed();
    });
  });

  it('change events should be emitted - insert', function(done) {
    var data = {id: 'foo', str: 'bar', num: 3};
    test.Model.get(data.id).changes().run().then(function(doc) {
      assert(doc);
      assert.deepEqual(doc, {});
      doc.on('change', function() {
        assert.deepEqual(doc.getOldValue(), null);
        assert.deepEqual(doc, data);
        doc.closeFeed().then(function() {
          done();
        });
      });
      test.Model.save(data);
    });
  });

  it('change events should be emitted - update', function(done) {
    var data = {id: 'buzz', str: 'bar', num: 3};
    test.Model.save(data).then(function() {
      test.Model.get(data.id).changes().run().then(function(doc) {
        assert.deepEqual(doc, data);
        doc.on('change', function() {
          assert.deepEqual(doc.getOldValue(), data);
          assert.deepEqual(doc, {id: 'buzz', str: 'foo', num: 3});
          doc.closeFeed().then(function() {
            done();
          });
        });
        test.Model.get(data.id).update({str: "foo"}).run();
      });
    });
  });

  it('change events should be emitted - delete', function(done) {
    var data = {id: 'bar', str: 'bar', num: 3};
    test.Model.save(data).then(function() {
      test.Model.get(data.id).changes().run().then(function(doc) {
        assert.deepEqual(doc, data);
        doc.on('change', function() {
          assert.deepEqual(doc.getOldValue(), data);
          assert.deepEqual(doc, {});
          assert.equal(doc.isSaved(), false);
          doc.closeFeed().then(function() {
            done();
          });
        });
        test.Model.get(data.id).delete().run();
      });
    });
  });

  it('change events should be emitted - all', function(done) {
    var data = {id: 'last', str: 'bar', num: 3};
    return test.Model.get(data.id).changes().run().then(function(doc) {
      assert(doc);
      assert.deepEqual(doc, {});
      var count = 0;
      doc.on('change', function() {
        if (count === 0) {
          assert.deepEqual(doc.getOldValue(), null);
          assert.deepEqual(doc, data);
        } else if (count === 1) {
          assert.deepEqual(doc, {id: 'last', str: 'foo', num: 3});
        } else if (count === 2) {
          assert.deepEqual(doc, {});
          assert.equal(doc.isSaved(), false);
          doc.closeFeed().then(function() {
            done();
          });
        }

        count++;
      });

      test.Model.save(data).then(function() {
        return test.Model.get(data.id).update({str: 'foo'}).run();
      }).then(function() {
        return test.Model.get(data.id).delete().run();
      });
    });
  });
});
