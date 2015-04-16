var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var util = require(__dirname+'/util.js');

function Feed(feed, model) {
  this.feed = feed;
  this.model = model;
  this._closed = false;

  this.each = this._each;
  this.next = this._next;
}

Feed.prototype.toString = function() {
  return '[object Feed]'
}


Feed.prototype._next = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.feed.next().then(function(data) {
      util.tryCatch(function() {
        if (data.new_val !== null) {
          self.model._parse(data.new_val).then(function(doc) {
            doc._setOldValue(data.old_val);
            resolve(doc);
          }).error(reject);
        }
        else if (data.old_val !== null) { // new_val is null
          self.model._parse(data.old_val).then(function(doc) {
            doc._setUnSaved();
            resolve(doc);
          }).error(reject);
        }
      }, function(err) {
        reject(err);
      })
    }).error(reject);
  });
}

Feed.prototype.toArray = function() {
  throw new Error("The `toArray` method is not available on feeds.");
}

Feed.prototype.close = function(callback) {
  this._closed = true;
  return this.feed.close(callback);
}

Feed.prototype._each = function(callback, onFinish) {
  var self = this;
  self.feed.each(function(err, data) {
    if (err) {
      if (self._closed === true) {
        return;
      }
      return callback(err);
    }
    util.tryCatch(function() {
      if (data.new_val !== null) {
        self.model._parse(data.new_val).then(function(doc) {
          doc._setOldValue(data.old_val);
          callback(null, doc);
        }).error(function(err) {
          callback(err);
        });
      }
      else if (data.old_val !== null) { // new_val is null
        self.model._parse(data.old_val).then(function(doc) {
          doc._setUnSaved();
          callback(null, doc);
        }).error(function(err) {
          callback(err);
        });
      }
    }, function(err) {
      callback(err);
    })
  }, onFinish);
};

Feed.prototype._makeEmitter = function() {
  this.next = function() {
    throw new Error("You cannot called `next` once you have bound listeners on the feed")
  }
  this.each = function() {
    throw new Error("You cannot called `each` once you have bound listeners on the feed")
  }
  this.toArray = function() {
    throw new Error("You cannot called `toArray` once you have bound listeners on the feed")
  }
  this._eventEmitter = new EventEmitter();
}

Feed.prototype._eachCb = function(err, data) {
  var self = this;
  if (err != null) {
    if ((this._closed !== false) || (err.message !== "You cannot retrieve data from a cursor that is closed")) {
      self._eventEmitter.emit('error', err);
    }
  }
  else {
    util.tryCatch(function() {
      if (data.new_val !== null) {
        self.model._parse(data.new_val).then(function(doc) {
          doc._setOldValue(data.old_val);
          self._eventEmitter.emit('data', doc);
        }).error(function(err) {
          self._eventEmitter.emit('error', err);
        });
      }
      else if (data.old_val !== null) { // new_val is null
        self.model._parse(data.old_val).then(function(doc) {
          doc._setUnSaved();
          self._eventEmitter.emit('data', doc);
        }).error(function(err) {
          self._eventEmitter.emit('error', err);
        });
      }
    }, function(err) {
      self._eventEmitter.emit('error', err);
    })
  }
}

var methods = [
    'addListener',
    'on',
    'once',
    'removeListener',
    'removeAllListeners',
    'setMaxListeners',
    'listeners',
    'emit'
];

for(var i=0; i<methods.length; i++) {
  (function(n) {
    var method = methods[n];
    Feed.prototype[method] = function() {
      var self = this;
      if (self._eventEmitter == null) {
        self._makeEmitter();
        setImmediate(function() {
          self.feed._each(self._eachCb.bind(self), function() {
            self._eventEmitter.emit('end');
          });
        });
      }
      self._eventEmitter[method].apply(self._eventEmitter, util.toArray(arguments));
    };
  })(i);
}

module.exports = Feed;
