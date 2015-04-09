var util = require(__dirname+'/util.js');
var schemaUtil = require(__dirname+'/schema.js');
var Document = require(__dirname+'/document.js');
var EventEmitter = require('events').EventEmitter;
var Query = require(__dirname+'/query.js');
var Promise = require('bluebird');
var Errors = require(__dirname+'/errors.js');

/*
 * Constructor for a Model. Note that this is not what `thinky.createModel`
 * returns. It is the prototype of what `thinky.createModel` returns.
 * The whole chain being:
 * document.__proto__ = new Document(...)
 * document.__proto__.constructor = model (returned by thinky.createModel
 * document.__proto__._model = instance of Model
 * document.__proto__.constructor.__proto__ = document.__proto__._model
 */
function Model(name, schema, options, thinky) {
  /**
   * Name of the table used
   * @type {string}
   */
  this._name = name;

  // We want a deep copy
  options = options || {};
  this._options = {};
  this._options.enforce_missing = (options.enforce_missing != null) ? options.enforce_missing : thinky._options.enforce_missing;
  this._options.enforce_extra = (options.enforce_extra != null) ? options.enforce_extra : thinky._options.enforce_extra;
  this._options.enforce_type = (options.enforce_type != null) ? options.enforce_type : thinky._options.enforce_type;
  this._options.timeFormat = (options.timeFormat != null) ? options.timeFormat : thinky._options.timeFormat;
  this._options.validate = (options.validate != null) ? options.validate : thinky._options.validate;

  this._schema = schemaUtil.parse(schema, '', this._options, this);
  //console.log(JSON.stringify(this._schema, null, 2));

  this.virtualFields = [];
  this.defaultFields = [];
  this._schema._getDefaultFields([], this.defaultFields, this.virtualFields)

  this.needToGenerateFields = (this.defaultFields.length+this.virtualFields.length) !== 0;

  this._pk = (options.pk != null) ? options.pk : 'id';

  this._thinky = thinky;

  this._validator = options.validator;

  this._tableCreated = false;
  this._tableReady = false;
  this._onTableCreated = [];
  this._onTableReady = [];
  this._indexesFetched = false; // Whether the indexes were fetched or not
  this._indexesToCreate = 0;
  this._foreignIndexesToCreate = 0; // many to many indexes left to create
  this._indexes = {}; // indexName -> true

  this._error = null; // If an error occured, we won't let people save things

  this._listeners = {};
  this._maxListeners = 10;
  this._joins = {};
  this._localKeys = {}; // key used as a foreign key by another model

  // This is to track joins that were not directly called by this model but that we still need
  // to purge the database
  this._reverseJoins = {};

  this._methods = {};
  this._staticMethods = {};
  this._async = {
    init: false,
    retrieve: false,
    save: false,
    validate: false
  };

  this._pre = {
    save: [],
    delete: [],
    validate: []
  };
  this._post = {
    init: [],
    retrieve: [],
    save: [],
    delete: [],
    validate: []
  };
}
util.inherits(Model, EventEmitter);

Model.new = function(name, schema, options, thinky) {

  var proto = new Model(name, schema, options, thinky);

  var model = function model(doc, options) {
    if (!util.isPlainObject(doc)) {
      throw new Error("Cannot build a new instance of `"+proto._name+"` without an object")
    }
    // We create a deepcopy only if doc was already used to create a document
    if (doc instanceof Document) {
      doc = util.deepCopy(doc);
    }

    util.changeProto(doc, new Document(model, options));

    // Create joins document. We do it here because `options` are easily available
    util.loopKeys(proto._joins, function(joins, key) {
      if (doc[key] != null) {
        if ((joins[key].type === 'hasOne') && (doc[key] instanceof Document === false)) {
          doc[key] = new joins[key].model(doc[key], options);
        }
        else if ((joins[key].type === 'belongsTo') && (doc[key] instanceof Document === false)) {
          doc[key] = new joins[key].model(doc[key], options);
        }
        else if (joins[key].type === 'hasMany') {
          doc.__proto__._hasMany[key] = []

          for(var i=0; i<doc[key].length; i++) {
            if (doc[key][i] instanceof Document === false) {
              doc[key][i] = new joins[key].model(doc[key][i], options);
            }
          }
        }
        else if (joins[key].type === 'hasAndBelongsToMany') {
          for(var i=0; i<doc[key].length; i++) {
            if (doc[key][i] instanceof Document === false) {
              doc[key][i] = new joins[key].model(doc[key][i], options);
            }
          }
        }
      }
    });
    if (proto.needToGenerateFields === true) {
      doc._generateDefault();
    }

    var promises = [];
    var promise;
    if (proto._options.validate === 'oncreate') {
      promise = doc.validate(options);
      if (promise instanceof Promise) promises.push(promise);
    }

    if (proto._post.init.length > 0) {
      promise = util.hook({
        postHooks: doc._getModel()._post.init,
        doc: doc,
        async: doc._getModel()._async.init,
        fn: function() {}
      })
      if (promise instanceof Promise) promises.push(promise);
    }

    if (promises.length > 0) {
      return Promise.all(promises);
    }
    return doc;
  }

  model.__proto__ = proto;

  // So people can directly call the EventEmitter from the constructor
  // TOIMPROVE: We should emit everything from the constructor instead of emitting things from
  // the constructor and the instance of Model
  util.loopKeys(EventEmitter.prototype, function(emitter, key) {
    (function(_key) {
      model[_key] = function() {
        model._getModel()[_key].apply(model._getModel(), arguments);
      }
    })(key)
  });


  return model
}

Model.prototype.isReady = function() {
  return this._getModel()._tableReady;
}

Model.prototype._setError = function(error) {
  this._getModel()._error = error;
  this.emit('error', error);
}

Model.prototype._setReady = function() {
  this._getModel()._tableReady = true;
  this.emit('ready', this);
  while (this._getModel()._onTableReady.length > 0) {
    this._getModel()._onTableReady.shift()();
  }
}

Model.prototype._indexWasCreated = function(type) {
  if (type === 'local') {
    this._getModel()._indexesToCreate--;
  }
  else if (type === 'foreign') {
    this._getModel()._foreignIndexesToCreate--;
  }
  // We need to check tableCreated because _indexWasCreated can be called when a foreign index is built.
  if ((this._getModel()._tableCreated === true)
    && (this._getModel()._indexesToCreate === 0)
    && (this._getModel()._foreignIndexesToCreate === 0)
    && (this._getModel()._indexesFetched === true)) {

    this._setReady();
  }
}


Model.prototype._tableWasCreated = function() {
  var self = this;

  self._getModel()._tableCreated = true;
  while (this._getModel()._onTableCreated.length > 0) {
    this._getModel()._onTableCreated.shift()();
  }

  self.emit('created');

  self.fetchIndexes().then(function() {
    if ((self._getModel()._indexesToCreate === 0)
      && (self._getModel()._foreignIndexesToCreate === 0)) {
      // Will trigger the queries waiting
      this._setReady();
    }
  }).error(function(error) {
    self._error = error;
  })
};

/*
 * Return the options of the model -- call from an instance of Model
 */
Model.prototype.getOptions = function() {
  return this._options;
}


/*
 * Return the instance of Model **when called on the function**
 */
Model.prototype._getModel = function() {
  return this.__proto__;
}

/*
 * Return the instance of Model
 */
Model.prototype.getTableName = function() {
  return this._getModel()._name;
}


Model.prototype.fetchIndexes = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    var fetch = function() {
      var r = self._thinky.r;
      var query = new Query(self);
      r.table(self.getTableName()).indexList().do(function(indexes) {
        return r.table(self.getTableName()).indexWait(r.args(indexes))  
      }).run().then(function(indexes) {
        for(var i=0; i<indexes.length; i++) {
          self._getModel()._indexes[indexes[i].index] = true;
        }
        self._getModel()._indexesFetched = true;

        if ((self._getModel()._tableCreated === true)
          && (self._getModel()._indexesToCreate === 0)
          && (self._getModel()._foreignIndexesToCreate === 0)) {

          self._setReady();
        }

      }).error(function(error) {
        self._getModel()._setError(error);
      });

    }

    if (self._getModel()._tableCreated === true) {
      fetch();
    }
    else {
      self._getModel()._onTableCreated.push(fetch);
    }

  });
}

Model.prototype.ensureIndex = function(name, fn, opts) {
  var self = this;
  var r = self._getModel()._thinky.r;

  if ((opts === undefined) && (util.isPlainObject(fn))) {
    opts = fn;
    fn = undefined;
  }

  self._getModel()._indexesToCreate++;
  self._getModel()._tableReady = false;

  return new Promise(function(resolve, reject) {
    var ensureIndex = function() {
      if (fn === undefined) {
        fn = function(doc) { return doc(name) };
      }
      var tableName = self.getTableName();
      return r.branch(
        r.table(tableName).indexList().contains(name),
        r.table(tableName).indexWait(name),
        r.branch(
          r.table(tableName).info()("primary_key").eq(name),
          r.table(tableName).indexWait(name),
          r.table(tableName).indexCreate(name, fn, opts || {}).do(function() {
            return r.table(tableName).indexWait(name)
          })
        )
      ).run().then(function(result) {
        self._getModel()._indexes[name] = true; 
        self._indexWasCreated('local');

        resolve();
      }).error(function(error) {
        if (error.message.match(/^Index `/)) {
          self._indexWasCreated('local');
        }
        else {
          self._getModel()._setError(error);
        }

        reject(error)
      })

    }

    if (self._getModel()._tableCreated === true) {
      ensureIndex();
    }
    else {
      self._getModel()._onTableCreated.push(ensureIndex);
    }
  })
}

/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * The foreign key is stores in the joinedModel
 *
 * Post.hasOne(Author, "author", "id", "postId"
 *                ^- post.id
 *
 * options can be:
 * - init: Boolean (create an index or not)
 * - timeFormat: 'raw'/'native'
 * - enforce_extra: 'strict'/'remove'/'none'
 * - enforce_missing: Boolean
 * - enforce_type: 'strict'/'loose'/'none'
 * - validate: 'oncreate'/'onsave'
 */
Model.prototype.hasOne = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
  var self  = this;

  if ((joinedModel instanceof Model) === false) {
    throw new Error("First argument of `hasOne` must be a Model")
  }
  if (fieldDoc in self._getModel()._joins) {
    throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
  }
  if (fieldDoc === "_apply") {
    throw new Error("The field `_apply` is reserved by thinky. Please use another one.");
  }
  self._getModel()._joins[fieldDoc] = {
    model: joinedModel,
    leftKey: leftKey,
    rightKey: rightKey,
    type: 'hasOne'
  }
  joinedModel._getModel()._localKeys[rightKey] = true;

  options = options || {};
  if (options.init !== false) {
    var tableName = joinedModel.getTableName();
    var r = joinedModel._getModel()._thinky.r;

    joinedModel._getModel()._indexesToCreate++;
    self._getModel()._foreignIndexesToCreate++;

    self._getModel()._tableReady = false;
    joinedModel._getModel()._tableReady = false;

    if (joinedModel._getModel()._tableCreated === true) {
      return r.branch(
        r.table(tableName).indexList().contains(rightKey),
        r.table(tableName).indexWait(rightKey),
        r.branch(
          r.table(tableName).info()("primary_key").eq(rightKey),
          r.table(tableName).indexWait(rightKey),
          r.table(tableName).indexCreate(rightKey).do(function() {
            return r.table(tableName).indexWait(rightKey)
          })
        )
      ).run().then(function(result) {
        joinedModel._indexWasCreated('local');
        joinedModel._getModel()._indexes[rightKey] = true;
        self._indexWasCreated('foreign');
      }).error(function(error) {
        if (error.message.match(/^Index `/)) {
          joinedModel._indexWasCreated('local');
          self._indexWasCreated('foreign');
        }
        else {
          joinedModel._getModel()._setError(error);
          self._getModel()._setError(error);
        }
      })
    }
    else {
      joinedModel._getModel()._onTableCreated.push(function() {
        r.branch(
          r.table(tableName).indexList().contains(rightKey),
          r.table(tableName).indexWait(rightKey),
          r.branch(
            r.table(tableName).info()("primary_key").eq(rightKey),
            r.table(tableName).indexWait(rightKey),
            r.table(tableName).indexCreate(rightKey).do(function() {
              return r.table(tableName).indexWait(rightKey)
            })
          )
        ).run().then(function() {
          joinedModel._indexWasCreated('local');
          joinedModel._getModel()._indexes[rightKey] = true;
          self._indexWasCreated('foreign');
        }).error(function(error) {
          if (error.message.match(/^Index `/)) {
            joinedModel._indexWasCreated('local');
            self._indexWasCreated('foreign');
          }
          else {
            joinedModel._getModel()._setError(error);
            self._getModel()._setError(error);
          }
        })
      })
    }
  }
}

/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * The foreign key is store in the model calling belongsTo
 *
 * Post.belongsTo(Author, "author", "authorId", "id"
 *                        ^- author.id
 */
Model.prototype.belongsTo = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
  var self  = this;

  if ((joinedModel instanceof Model) === false) {
    throw new Error("First argument of `belongsTo` must be a Model")
  }
  if (fieldDoc in self._getModel()._joins) {
    throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
  }
  if (fieldDoc === "_apply") {
    throw new Error("The field `_apply` is reserved by thinky. Please use another one.");
  }

  self._getModel()._joins[fieldDoc] = {
    model: joinedModel,
    leftKey: leftKey,
    rightKey: rightKey,
    type: 'belongsTo'
  };
  self._getModel()._localKeys[leftKey] = true;

  joinedModel._getModel()._reverseJoins[fieldDoc] = {
    model: self,
    leftKey: leftKey,
    rightKey: rightKey,
    type: 'belongsTo',
  }

  options = options || {};
  if (options.init !== false) {
    var tableName = self.getTableName();
    var r = self._getModel()._thinky.r;

    self._getModel()._indexesToCreate++;
    joinedModel._getModel()._foreignIndexesToCreate++;

    self._getModel()._tableReady = false;
    joinedModel._getModel()._tableReady = false;

    var query = r.branch(
      r.table(tableName).indexList().contains(leftKey),
      r.table(tableName).indexWait(leftKey),
      r.branch(
        r.table(tableName).info()("primary_key").eq(leftKey),
        {index: leftKey, ready: true},
        r.table(tableName).indexCreate(leftKey).do(function() {
          return r.table(tableName).indexWait(leftKey)
        })
      )
    )
    
    if (self._getModel()._tableCreated === true) {
      query.run().then(function(result) {
        self._indexWasCreated('local');
        joinedModel._indexWasCreated('foreign');
      }).error(function(error) {
        if (error.message.match(/^Index `/)) {
          self._indexWasCreated('local');
          self._getModel()._indexes[leftKey] = true;
          joinedModel._indexWasCreated('foreign');
        }
        else {
          joinedModel._getModel()._setError(error);
          self._getModel()._setError(error);
        }
      })
    }
    else {
      self._getModel()._onTableCreated.push(function() {
        query.run().then(function() {
          self._indexWasCreated('local');
          self._getModel()._indexes[leftKey] = true;
          joinedModel._indexWasCreated('foreign');
        }).error(function(error) {
          if (error.message.match(/^Index `/)) {
            self._indexWasCreated('local');
            joinedModel._indexWasCreated('foreign');
          }
          else {
            joinedModel._getModel()._setError(error);
            self._getModel()._setError(error);
          }
        });
      })
    }
  }
}


/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * A post has one author, and an author can write multiple posts
 * Author.hasMany(Post, "posts", "id", "authorId"
 *                 ^- author.id
 */
Model.prototype.hasMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
  var self  = this;

  if ((joinedModel instanceof Model) === false) {
    throw new Error("First argument of `hasMany` must be a Model")
  }
  if (fieldDoc in self._getModel()._joins) {
    throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
  }
  if (fieldDoc === "_apply") {
    throw new Error("The field `_apply` is reserved by thinky. Please use another one.");
  }

  this._getModel()._joins[fieldDoc] = {
    model: joinedModel,
    leftKey: leftKey,
    rightKey: rightKey,
    type: 'hasMany'
  };
  joinedModel._getModel()._localKeys[rightKey] = true;
  
  options = options || {};
  if (options.init !== false) {
    var tableName = joinedModel.getTableName();
    var r = self._getModel()._thinky.r;

    var query = r.branch(
      r.table(tableName).indexList().contains(rightKey),
      r.table(tableName).indexWait(rightKey),
      r.branch(
        r.table(tableName).info()("primary_key").eq(rightKey),
        {index: rightKey, ready: true},
        r.table(tableName).indexCreate(rightKey).do(function() {
          return r.table(tableName).indexWait(rightKey)
        })
      )
    )

    joinedModel._getModel()._indexesToCreate++;
    self._getModel()._foreignIndexesToCreate++;

    self._getModel()._tableReady = false;
    joinedModel._getModel()._tableReady = false;

    if (joinedModel._getModel()._tableCreated === true) {
      query.run().then(function(result) {
        joinedModel._indexWasCreated('local');
        joinedModel._getModel()._indexes[rightKey] = true;
        self._indexWasCreated('foreign');
      }).error(function(error) {
        if (error.message.match(/^Index `.*` already exists/)) {
          joinedModel._indexWasCreated('local');
          self._indexWasCreated('foreign');
        }
        else {
          self._getModel()._setError(error);
          joinedModel._getModel()._setError(error);
        }
      })
    }
    else {
      joinedModel._getModel()._onTableCreated.push(function() {
        query.run().then(function() {
          joinedModel._indexWasCreated('local');
          joinedModel._getModel()._indexes[rightKey] = true;
          self._indexWasCreated('foreign');
        }).error(function(error) {
          if (error.message.match(/^Index `.*` already exists/)) {
            joinedModel._indexWasCreated('local');
            self._indexWasCreated('foreign');
          }
          else {
            self._getModel()._setError(error);
            joinedModel._getModel()._setError(error);
          }
        })
      })
    }
  }
}


/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * Patient.hasAndBelongsToMany(Doctor, "doctors", "id", "id"
 *                     patient.id-^  ^-doctor.id
 *
 * It automatically creates a table <modelName>_<joinedModel> or <joinedModel>_<modelName> (alphabetic order)
 */
Model.prototype.hasAndBelongsToMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
  var self = this;
  var link, query;
  var thinky = this._getModel()._thinky;
  options = options || {};

  if ((joinedModel instanceof Model) === false) {
    throw new Error("First argument of `hasAndBelongsToMany` must be a Model")
  }
  if (fieldDoc in self._getModel()._joins) {
    throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
  }
  if (fieldDoc === "_apply") {
    throw new Error("The field `_apply` is reserved by thinky. Please use another one.");
  }

  if (this._getModel()._name < joinedModel._getModel()._name) {
    link = this._getModel()._name+"_"+joinedModel._getModel()._name;
  }
  else {
    link = joinedModel._getModel()._name+"_"+this._getModel()._name;
  }
  if (typeof options.type === 'string') {
    link = link+"_"+options.type;
  }
  else if (typeof options.type !== 'undefined') {
    throw new Error('options.type should be a string or undefined.')
  }

  this._getModel()._joins[fieldDoc] = {
    model: joinedModel,
    leftKey: leftKey,
    rightKey: rightKey,
    type: 'hasAndBelongsToMany',
    link: link
  }

  joinedModel._getModel()._reverseJoins[self.getTableName()] = {
    leftKey: leftKey,
    rightKey: rightKey,
    type: 'hasAndBelongsToMany',
    link: link
  }

  if (thinky.models[link] === undefined) {
    var linkModel = thinky.createModel(link, {}); // Create a model, claim the namespace and create the table
  }
  else {
    linkModel = thinky.models[link];
  }

  if (options.init !== false) {
    var r = self._getModel()._thinky.r;

    // Create the two indexes on two models
    var queryIndex1 = r.branch(
      r.table(self.getTableName()).indexList().contains(leftKey),
      r.table(self.getTableName()).indexWait(leftKey),
      r.branch(
        r.table(self.getTableName()).info()('primary_key').eq(leftKey),
        {index: leftKey, ready: true},
        r.table(self.getTableName()).indexCreate(leftKey).do(function() {
          return r.table(self.getTableName()).indexWait(leftKey)
        })
      )
    );

    // This could try to create the same index, but that's ok
    var queryIndex2 = r.branch(
      r.table(joinedModel.getTableName()).indexList().contains(rightKey),
      r.table(joinedModel.getTableName()).indexWait(rightKey),
      r.branch(
        r.table(joinedModel.getTableName()).info()('primary_key').eq(rightKey),
        {index: rightKey, ready: true},
        r.table(joinedModel.getTableName()).indexCreate(rightKey).do(function() {
          return r.table(joinedModel.getTableName()).indexWait(rightKey)
        })
      )
    );

    self._getModel()._tableReady = false;
    joinedModel._getModel()._tableReady = false;
    self._getModel()._indexesToCreate++;
    joinedModel._getModel()._foreignIndexesToCreate++;
    if (self._getModel()._tableCreated === true) {
      queryIndex1.run().then(function(result) {
        self._indexWasCreated('local');
        joinedModel._indexWasCreated('foreign');
      }).error(function(error) {
        if (error.message.match(/^Index `/)) {
          self._indexWasCreated('local');
          joinedModel._indexWasCreated('foreign');
        }
        else {
          self._getModel()._setError(error);
          joinedModel._getModel()._setError(error);
        }
      })
    }
    else {
      self._getModel()._onTableCreated.push(function() {
        queryIndex1.run().then(function() {
          self._indexWasCreated('local');
          joinedModel._indexWasCreated('foreign');
        }).error(function(error) {
          if (error.message.match(/^Index `/)) {
            self._indexWasCreated('local');
            joinedModel._indexWasCreated('foreign');
          }
          else {
            self._getModel()._setError(error);
          }
        });
      });
    }

    joinedModel._getModel()._indexesToCreate++;
    self._getModel()._foreignIndexesToCreate++;
    if (joinedModel._getModel()._tableCreated === true) {
      queryIndex2.run().then(function(result) {
        joinedModel._indexWasCreated('local');
        self._indexWasCreated('foreign');
      }).error(function(error) {
        if (error.message.match(/^Index `/)) {
          joinedModel._indexWasCreated('local');
          self._indexWasCreated('foreign');
        }
        else {
          self._getModel()._setError(error);
          joinedModel._getModel()._setError(error);
        }
      })
    }
    else {
      joinedModel._getModel()._onTableCreated.push(function() {
        queryIndex2.run().then(function() {
          joinedModel._indexWasCreated('local');
          self._indexWasCreated('foreign');
        }).error(function(error) {
          if (error.message.match(/^Index `/)) {
            joinedModel._indexWasCreated('local');
            self._indexWasCreated('foreign');
          }
          else {
            self._getModel()._setError(error);
            joinedModel._getModel()._setError(error);
          }
        });
      });
    }

    if ((this.getTableName() === joinedModel.getTableName())
      && (leftKey === rightKey)) {
      // The relation is built for the same model, using the same key
      // Create a multi index
      query = r.branch(
        r.table(link).indexList().contains(leftKey+"_"+rightKey),
        r.table(link).indexWait(leftKey+"_"+rightKey),
        r.table(link).indexCreate(leftKey+"_"+rightKey, function(doc) {
          return doc(leftKey+"_"+rightKey)
        }, {multi: true}).do(function() {
          return r.table(link).indexWait(leftKey+"_"+rightKey)
        })
      )
    }
    else {
      query = r.branch(
        r.table(link).indexList().contains(self.getTableName()+'_'+leftKey),
        r.table(link).indexWait(self.getTableName()+'_'+leftKey),
        r.table(link).indexCreate(self.getTableName()+'_'+leftKey).do(function() {
          return r.table(link).indexWait(self.getTableName()+'_'+leftKey)
        })
      ).do(function() {
        return r.branch(
          r.table(link).indexList().contains(joinedModel.getTableName()+'_'+rightKey),
          r.table(link).indexWait(joinedModel.getTableName()+'_'+rightKey),
          r.table(link).indexCreate(joinedModel.getTableName()+'_'+rightKey).do(function() {
            return r.table(link).indexWait(joinedModel.getTableName()+'_'+rightKey)
          })
        )
      })

    }

    return new Promise(function(resolve, reject) {
      var successCb = function() {
        self._indexWasCreated('foreign');
        joinedModel._indexWasCreated('foreign');
        self._getModel()._indexes[leftKey] = true;
        joinedModel._getModel()._indexes[rightKey] = true;
        resolve();
      }

      var errorCb = function(error) {
        if (error.message.match(/^Index `/)) {
          self._indexWasCreated('foreign');
          joinedModel._indexWasCreated('foreign');
          resolve();
        }
        else if (error.message.match(/^Table `.*` already exists/)) {
          self._indexWasCreated('foreign');
          joinedModel._indexWasCreated('foreign');
          resolve();
        }

        else {
          self._getModel()._setError(error);
          joinedModel._getModel()._setError(error);
          reject(error);
        }
      }

      self._getModel()._foreignIndexesToCreate++;
      joinedModel._getModel()._foreignIndexesToCreate++;
      if (linkModel._getModel()._tableReady === true) {
        query.run().then(successCb).error(errorCb)
      }
      else {
        linkModel._getModel()._onTableCreated.push(function() {
          query.run().then(successCb).error(errorCb)
        });
      }
    })
  }
};

(function() {
  // Import rethinkdbdash methods
  var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
  util.loopKeys(Term, function(Term, key) {
    if ((Term.hasOwnProperty(key)) && (key !== 'run') && (key[0] !== '_')) {
      (function(key) {
        switch (key) {
          case 'orderBy':
            Model.prototype[key] = function() {
              var query = new Query(this);
              if ((arguments.length === 1)
                && (typeof arguments[0] === 'string')
                && (this._getModel()._indexes[arguments[0]] === true)) {

                  query = query[key]({index: arguments[0]});
                  return query;
              }
              else {
                query = query[key].apply(query, arguments);
                return query;
              }
            }
            break;
          case 'filter':
            Model.prototype[key] = function() {
              var query = new Query(this);
              if ((arguments.length === 1)
                && (util.isPlainObject(arguments[0]))) {

                // Optimize a filter with an object
                // We replace the first key that match an index name
                var filter = arguments[0];

                var keys = Object.keys(filter).sort(); // Lexicographical order
                for(var i=0 ; i<keys.length; i++) {
                  var index = keys[i];

                  if (this._getModel()._indexes[index] === true) { // Index found
                    query = query.getAll(filter[index], {index: index});
                    delete filter[index];
                    break;
                  }
                }
              }

              query = query[key].apply(query, arguments);
              return query;
            }
            break;
          default:
            Model.prototype[key] = function() {
              var query = new Query(this);
              query = query[key].apply(query, arguments);
              return query;
            }
          }

      })(key);
    }
  });
})();

Model.prototype.getJoin = function() {
  var query = new Query(this);
  return query.getJoin.apply(query, arguments)
}

Model.prototype.run = function(options) {
  var query = new Query(this);
  return query.run(options);
}
Model.prototype.execute = function(options) {
  var query = new Query(this);
  return query.execute(options);
}

Model.prototype.save = function(docs, options) {
  var self = this;
  var r = self._getModel()._thinky.r;

  if (Array.isArray(docs) === false) {
    docs = [docs];
  }

  var p = new Promise(function(mainResolve, mainReject) {
    var toSave = docs.length;

    var resolves = [];
    var rejects = [];
    var executeInsert = function (resolve, reject) {
      toSave--;
      resolves.push(resolve);
      rejects.push(reject);

      if (toSave === 0) {
        var copies = [];
        for(var i=0; i<docs.length; i++) {
          copies.push(docs[i]._makeSavableCopy());
        }
        var _options;
        if (util.isPlainObject(options)) {
          _options = util.deepCopy(options);
        }
        else {
          _options = {};
        }
        _options.returnChanges = true;
        r.table(self.getTableName()).insert(copies, _options).run().then(function(results) {
          if (results.errors === 0) {
            // results.changes currently does not enforce the same order as docs
            for(var i=0; i<results.changes.length; i++) {
              docs[i]._merge(results.changes[i].new_val);
              if (docs[i]._getModel().needToGenerateFields === true) {
                docs[i]._generateDefault();
              }
              docs[i]._setOldValue(util.deepCopy(results.changes[i].old_val));
              docs[i].setSaved();
              docs[i].emit('saved', self);
            }
            for(i=0; i<resolves.length; i++) {
              resolves[i]();
            }
          }
          else {
            //TODO Expand error with more information
            for(var i=0; i<rejects.length; i++) {
              rejects[i](new Error("An error occurred during the batch insert. Original results:\n"+JSON.stringify(results, null, 2)));
            }
          }
        }).error(reject);
      }
    };

    var promises = [];
    var foundNonValidDoc = false;
    for(var i=0; i<docs.length; i++) {
      if (foundNonValidDoc === true) {
        return;
      }
      if (docs[i] instanceof Document === false) {
        docs[i] = new self(docs[i]);
      }
      var promise;
      util.tryCatch(function() {
        promise = docs[i].validate();
        if (promise instanceof Promise) {
          promises.push(promise)
        }
      }, function(error) {
        foundNonValidDoc = true;
        mainReject(new Errors.ValidationError("One of the documents is not valid. Original error:\n"+error.message))
      });
    }

    if (foundNonValidDoc === false) {
      Promise.all(promises).then(function() {
        var promises = [];
        for(var i=0; i<docs.length; i++) {
          promises.push(docs[i]._batchSave(executeInsert));
        }
        Promise.all(promises).then(function() {
          mainResolve(docs);
        }).error(function(error) {
          mainReject(error)
        });
      }).error(function(error) {
        mainReject(new Errors.ValidationError("One of the documents is not valid. Original error:\n"+error.message))
      });
    }
  })
  return p;
}


Model.prototype.define = function(key, fn) {
  this._methods[key] = fn;
}
Model.prototype.defineStatic = function(key, fn) {
  this._staticMethods[key] = fn;

  this[key] = function() {
    return fn.apply(this, arguments);
  };
}



Model.prototype._parse = function(data) {
  var self = this;
  var promises = [];
  var promise;

  var p = new Promise(function(resolve, reject) {
    if (Array.isArray(data)) {
      util.tryCatch(function() {
        for(var i=0; i<data.length; i++) {
          data[i] = new self(data[i])
          data[i].setSaved(true);

          self.emit('retrieved', data[i]);

          // Order matters here, we want the hooks to be executed *before* calling validate
          promise = util.hook({
            postHooks: data[i]._getModel()._post.retrieve,
            doc: data[i],
            async: data[i]._getModel()._async.retrieve,
            fn: function() {}
          })
          if (promise instanceof Promise) {
            promise.then(function() {
              var promise = data[i].validate();
              if (promise instanceof Promise) {
                promise.then(resolve).error(reject);
              }
              else {
                resolve();
              }
            }).error(reject);
            promises.push(promise);
          }
          else {
            promise = data[i].validate();
            if (promise instanceof Promise) promises.push(promise);
          }
        }
      }, function(error) {
        var newError = new Error("The results could not be converted to instances of `"+self.getTableName()+"`\nDetailed error: "+error.message);
      
        return reject(newError);
      });

      if (promises.length > 0) {
        Promise.all(promises).then(function() {
          resolve(data);
        }).error(reject);
      }
      else {
        resolve(data);
      }
    }
    else {
      // If we get a GROUPED_DATA, we convert documents in each group
      if (util.isPlainObject(data) && (data.$reql_type$ === "GROUPED_DATA")) {
        var result = [];
        util.tryCatch(function() {
          var reduction, newDoc;
          for(var i=0; i<data.data.length; i++) {
            reduction = [];
            if (Array.isArray(data.data[i][1])) {
              for(var j=0; j<data.data[i][1].length; j++) {
                newDoc = new self(data.data[i][1][j]);
                newDoc.setSaved(true);

                newDoc._emitRetrieve();

                promise = util.hook({
                  postHooks: newDoc._getModel()._post.retrieve,
                  doc: newDoc,
                  async: newDoc._getModel()._async.retrieve,
                  fn: function() {}
                })
                if (promise instanceof Promise) {
                  promise.then(function() {
                    var promise = newDoc.validate();
                    if (promise instanceof Promise) {
                      promise.then(resolve).error(reject);
                    }
                    else {
                      resolve();
                    }
                  }).error(reject);
                  promises.push(promise);
                }
                else {
                  promise = newDoc.validate();
                  if (promise instanceof Promise) promises.push(promise);
                }

                reduction.push(newDoc)

              }
              result.push({
                group: data.data[i][0],
                reduction: reduction
              })
            }
            else {
              newDoc = new self(data.data[i][1]);
              newDoc.setSaved(true);

              newDoc._emitRetrieve();

              promise = util.hook({
                postHooks: newDoc._getModel()._post.retrieve,
                doc: newDoc,
                async: newDoc._getModel()._async.retrieve,
                fn: function() {}
              })
              if (promise instanceof Promise) {
                promise.then(function() {
                  var promise = newDoc.validate();
                  if (promise instanceof Promise) {
                    promise.then(resolve).error(reject);
                  }
                  else {
                    resolve();
                  }
                }).error(reject);
                promises.push(promise);
              }
              else {
                promise = newDoc.validate();
                if (promise instanceof Promise) promises.push(promise);
              }

              result.push({
                group: data.data[i][0],
                reduction: newDoc
              })
            }
          }
        }, reject);
        if (promises.length > 0) {
          Promise.all(promises).then(function() {
            resolve(result)
          }).error(reject);
        }
        else {
          resolve(result);
        }
      }
      else {
        if (data === null) { // makeDocument is true, but we got `null`
          reject(new Error("Cannot build a new instance of `"+self.getTableName()+"` with `null`."))
        }
        else {
          util.tryCatch(function() {
            var newDoc = new self(data);
            newDoc.setSaved(true);

            newDoc._emitRetrieve();

            promise = util.hook({
              postHooks: newDoc._getModel()._post.retrieve,
              doc: newDoc,
              async: newDoc._getModel()._async.retrieve,
              fn: function() {}
            })
            if (promise instanceof Promise) {
              promise.then(function() {
                var promise = newDoc.validate();
                if (promise instanceof Promise) {
                  promise.then(resolve).error(reject);
                }
                else {
                  resolve(newDoc);
                }
              }).error(reject);
            }
            else {
              promise = newDoc.validate();
            }

            if (promise instanceof Promise) {
              promise.then(function() {
                resolve(newDoc)
              }).error(function(err) {
                reject(err)
              });
            }
            else {
              resolve(newDoc);
            }
          }, reject);
        }
      }
    }
  })
  return p;
}

/*
 * Implement an interface similar to events.EventEmitter
 */
Model.prototype.docAddListener = function(eventKey, listener) {
  var listeners = this._getModel()._listeners;
  if (listeners[eventKey] == null) {
    listeners[eventKey] = [];
  }
  listeners[eventKey].push({
    once: false,
    listener: listener
  });
}
Model.prototype.docOn = Model.prototype.docAddListener;

Model.prototype.docOnce = function(eventKey, listener) {
  var listeners = this._getModel()._listeners;
  if (listeners[eventKey] == null) {
    listeners[eventKey] = [];
  }
  listeners[eventKey].push({
    once: true,
    listener: listener
  });
}

Model.prototype.docListeners = function(eventKey, raw) {
  if (eventKey == null) {
    return this._getModel()._listeners
  }

  raw = raw || true;
  if (raw === true) {
    return this._getModel()._listeners[eventKey];
  }
  else {
    return this._getModel()._listeners[eventKey].map(function(fn) {
      return fn.listener;
    });
  }
}

Model.prototype.docSetMaxListeners = function(n) {
  this._getModel()._maxListeners = n;
}

Model.prototype.docRemoveListener = function(ev, listener) {
  if (Array.isArray(this._getModel()._listeners[ev])) {
    for(var i=0; i<this._getModel()._listeners[ev].length; i++) {
      if (this._getModel()._listeners[ev][i] === listener) {
        this._getModel()._listeners[ev].splice(i, 1);
        break;
      }
    }
  }
}

Model.prototype.docRemoveAllListeners = function(ev) {
  if (ev === undefined) {
    delete this._getModel()._listeners[ev]
  }
  else {
    this._getModel()._listeners = {};
  }
}

Model.prototype.pre = function(ev, fn) {
  if (typeof fn !== "function") {
    throw new Error("Second argument to `pre` must be a function");
  }
  if (fn.length > 1) {
    throw new Error("Second argument to `pre` must be a function with at most one argument.");
  }
  if (Array.isArray(this._pre[ev]) === false) {
    throw new Error("No pre-hook available for the event `"+ev+"`.")
  }
  this._getModel()._async[ev] = this._getModel()._async[ev] || (fn.length === 1)
  this._getModel()._pre[ev].push(fn);
}

Model.prototype.post = function(ev, fn) {
  if (typeof fn !== "function") {
    throw new Error("Second argument to `pre` must be a function");
  }
  if (fn.length > 1) {
    throw new Error("Second argument to `pre` must be a function with at most one argument.");
  }
  if (Array.isArray(this._post[ev]) === false) {
    throw new Error("No post-hook available for the event `"+ev+"`.")
  }
  this._getModel()._async[ev] = this._getModel()._async[ev] || (fn.length === 1)
  this._getModel()._post[ev].push(fn);
}

module.exports = Model;
