var Promise = require('bluebird');
var util = require(__dirname+'/util.js');
var Errors = require(__dirname+'/errors.js');
var schemaUtil = require(__dirname+'/schema.js');
var Feed = require(__dirname+'/feed.js');


/**
 * Constructor for a Query. A Query basically wraps a ReQL queries to keep track
 * of the model returned and if a post-query validation is required.
 * @param {Function=} model Model of the documents returned
 * @param {ReQLQuery=} current ReQL query (rethinkdbdash)
 * @param {boolean=} postValidation whether post query validation should be performed
 */
function Query(model, query, postValidation, error) {
  var self = this;

  this._model = model; // constructor of the model we should use for the results.
  if (model !== undefined) {
    this._r = model._getModel()._thinky.r;
    util.loopKeys(model._getModel()._staticMethods, function(staticMethods, key) {
      (function(_key) {
        self[_key] = function() {
          return staticMethods[_key].apply(self, arguments);
        };
      })(key);
    });
  }

  if (query !== undefined) {
    this._query = query;
   }
  else if (model !== undefined) {
    // By default, we initialize the query to `r.table(<tableName>)`.
    this._query = this._r.table(model.getTableName());
  }

  if (postValidation) {
    this._postValidation = postValidation === true;
  }
  if (error) {
    // Note `Query.prototype.error` is defined because of `r.error`, so we shouldn't
    // defined this.error.
    this._error = error;
  }
}


/**
 * Execute a Query and expect the results to be object(s) that can be converted
 * to instances of the model.
 * @param {Object=} options The options passed to the driver's method `run`
 * @param {Function=} callback
 * @return {Promise} return a promise that will be resolved when the query and
 * the instances of the models will be created (include the potential
 * asynchronous hooks).
 */
Query.prototype.run = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return this._execute(options, true).nodeify(callback);
}


/**
 * Execute a Query
 * @param {Object=} options The options passed to the driver's method `run`
 * @param {Function=} callback
 * @return {Promise} return a promise that will be resolved with the results
 * of the query.
 */
Query.prototype.execute = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return this._execute(options, false).nodeify(callback);
}


/**
 * Internal method to execute a query. Called by `run` and `execute`.
 * @param {Object} options The options passed to the driver's method `run`
 * @param {boolean} parse Whether the results should be converted as instance(s) of the model
 * @param {Function=} callback
 * @return {Promise} return a promise that will be resolved with the results
 * of the query.
 * @private
 */
Query.prototype._execute = function(options, parse) {
  var self = this;
  options = options || {};
  var fullOptions = {groupFormat: 'raw'}
  util.loopKeys(options, function(options, key) {
    fullOptions[key] = options[key]
  });
  if (parse !== true) {
    fullOptions.cursor = true;
  }

  if (self._model._error !== null) {
    return Promise.reject(self._model._error);
  }
  return self._model.tableReady().then(function() {
    return self._executeCallback(fullOptions, parse, options.groupFormat);
  });
}

Query.prototype._executeCallback = function(fullOptions, parse, groupFormat) {
  var self = this;
  if (self._error !== undefined) {
    return Promise.reject(new Error("The partial value is not valid, so the write was not executed. The original error was:\n"+self._error.message));
  }

  return self._query.run(fullOptions).then(function(result) {
    if (result === null && parse) {
      throw new Errors.DocumentNotFound();
    }

    // Expect a write result from RethinkDB
    if (self._postValidation === true) {
      return self._validateQueryResult(result);
    }

    if (result != null && typeof result.getType === 'function') {
      var resultType = result.getType();
      if (resultType === 'Feed' ||
        resultType === 'OrderByLimitFeed' ||
        resultType === 'UnionedFeed'
      ) {
        var feed = new Feed(result, self._model);
        return feed;
      }

      if (resultType === 'AtomFeed') {
        return result.next().then(function(initial) {
          var value = initial.new_val || {};
          return self._model._parse(value).then(function(doc) {
            doc._setFeed(result);
            return doc;
          });
        });
      }
    }

    if (parse === true) {
      return self._model._parse(result);
    }

    if (groupFormat !== 'raw') {
      return Query.prototype._convertGroupedData(result);
    }

    return result;
  }).catch(function(err) {
    var notFoundRegex = new RegExp('^' + new Errors.DocumentNotFound().message);
    if (err.message.match(notFoundRegex)) {
      //Reject with an instance of Errors.DocumentNotFound
      err = new Errors.DocumentNotFound(err.message);
    }
    return Promise.reject(err);
  })
};


Query.prototype._validateQueryResult = function(result) {
  var self = this;
  if (result.errors > 0) {
    return Promise.reject(new Errors.InvalidWrite("An error occured during the write", result));
  }
  if (!Array.isArray(result.changes)) {
    if (self._isPointWrite()) {
      return Promise.resolve();
    }
    return Promise.resolve([]);
  }

  var promises = [];
  for(var i=0; i<result.changes.length; i++) {
    (function(i) {
      if (result.changes[i].new_val !== null) {
        promises.push(self._model._parse(result.changes[i].new_val));
      }
    })(i)
  }
  return Promise.all(promises).then(function(result) {
    if (self._isPointWrite()) {
      return result[0];
    }
    return result;
  }).error(function(error) {
    if (error instanceof Errors.DocumentNotFound) {
      // Should we send back null?
    }
    else {
      var revertPromises = [];
      var primaryKeys = [];
      var keysToValues = {};
      var r = self._model._thinky.r;
      for(var p=0; p<result.changes.length; p++) {
        // Extract the primary key of the document saved in the database
        var primaryKey = util.extractPrimaryKey(
            result.changes[p].old_val,
            result.changes[p].new_val,
            self._model._pk)
        if (primaryKey === undefined) {
          continue;
        }

        if (typeof primaryKey === "string") {
          keysToValues[primaryKey] = result.changes[p].old_val;
          primaryKeys.push(primaryKey);
        }
        else {
          // Replace documents with non-string type primary keys
          // one by one.
          revertPromises.push(r.table(self._model.getTableName())
            .get(primaryKey)
            .replace(result.changes[p].old_val)
            .run());
        }
      }

      // Replace all documents with string-type primary keys
      // in a single replace() operation.
      if (primaryKeys.length) {
        revertPromises.push(
          r.table(self._model.getTableName()).getAll(r.args(primaryKeys)).replace(function(doc) {
            return r.expr(keysToValues)(doc(self._model._pk));
          }).run()
        );
      }

      return Promise.all(revertPromises).then(function(result) {
        throw new Error("The write failed, and the changes were reverted.");
      }).error(function(error) {
        throw new Error("The write failed, and the attempt to revert the changes failed with the error:\n"+error.message);
      });
    }
  })
};


/**
 * Convert GROUPED_DATA results to [group: <group>, reduction: <reduction>]
 * This does the same as the driver. The reduction is not converted to
 * instances of the model.
 */
Query.prototype._convertGroupedData = function(data) {
  if (util.isPlainObject(data) && (data.$reql_type$ === "GROUPED_DATA")) {
    var result = [];
    var reduction;
    for(var i=0; i<data.data.length; i++) {
      result.push({
        group: data.data[i][0],
        reduction: data.data[i][1]
      });
    }
    return result;
  }
  else {
    return data;
  }
}


/**
 * Perform a join given the relations on this._model
 * @param {Object=} modelToGet explicit joined documents to retrieve
 * @param {boolean} getAll Internal argument, if `modelToGet` is undefined, `getAll` will
 * be set to `true` and `getJoin` will be greedy and keep recursing as long as it does not
 * hit a circular reference
 * @param {Object=} gotModel Internal argument, the model we are already fetching.
 * @return {Query}
 */
Query.prototype.getJoin = function(modelToGet, getAll, gotModel) {
  var self = this;
  var r = self._model._getModel()._thinky.r;

  var model = this._model;
  var joins = this._model._getModel()._joins;

  var getAll = modelToGet === undefined;
  if (util.isPlainObject(modelToGet) === false) {
    modelToGet = {};
  }
  var innerQuery;

  gotModel = gotModel || {};
  gotModel[model.getTableName()] = true;

  util.loopKeys(joins, function(joins, key) {
    if (util.recurse(key, joins, modelToGet, getAll, gotModel)) {
      switch (joins[key].type) {
        case 'hasOne':
        case 'belongsTo':
          self._query = self._query.merge(function(doc) {
            return r.branch(
              doc.hasFields(joins[key].leftKey),
              r.table(joins[key].model.getTableName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY").do(function(result) {
                innerQuery = new Query(joins[key].model, result.nth(0));

                if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
                  innerQuery = modelToGet[key]._apply(innerQuery);
                }
                innerQuery = innerQuery.getJoin(modelToGet[key], getAll, gotModel)._query;
                return r.branch(
                  result.count().eq(1),
                  r.object(key, innerQuery),
                  r.branch(
                    result.count().eq(0),
                    {},
                    r.error(r.expr("More than one element found for ").add(doc.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                  )
                )
              }),
              {}
            )
          });
          break;

        case 'hasMany':
          self._query = self._query.merge(function(doc) {
            innerQuery = new Query(joins[key].model,
                       r.table(joins[key].model.getTableName())
                      .getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}))

            if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
              innerQuery = modelToGet[key]._apply(innerQuery);
            }
            innerQuery = innerQuery.getJoin(modelToGet[key], getAll, gotModel);
            if ((modelToGet[key] == null) || (modelToGet[key]._array !== false)) {
              innerQuery = innerQuery.coerceTo("ARRAY");
            }
            innerQuery = innerQuery._query;

            return r.branch(
              doc.hasFields(joins[key].leftKey),
              r.object(key, innerQuery),
              {}
            )
          });
          break;

        case 'hasAndBelongsToMany':
          self._query = self._query.merge(function(doc) {
            if ((model.getTableName() === joins[key].model.getTableName()) && (joins[key].leftKey === joins[key].rightKey)) {
              // In case the model is linked with itself on the same key

              innerQuery = r.table(joins[key].link).getAll(doc(joins[key].leftKey), {index: joins[key].leftKey+"_"+joins[key].leftKey}).concatMap(function(link) {
                return r.table(joins[key].model.getTableName()).getAll(
                  r.branch(
                    doc(joins[key].leftKey).eq(link(joins[key].leftKey+"_"+joins[key].leftKey).nth(0)),
                    link(joins[key].leftKey+"_"+joins[key].leftKey).nth(1),
                    link(joins[key].leftKey+"_"+joins[key].leftKey).nth(0)
                  )
                , {index: joins[key].rightKey})
              });

              if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
                innerQuery = modelToGet[key]._apply(innerQuery);
              }

              if ((modelToGet[key] == null) || (modelToGet[key]._array !== false)) {
                innerQuery = innerQuery.coerceTo("ARRAY");
              }

              return r.branch(
                doc.hasFields(joins[key].leftKey),
                r.object(key, new Query(joins[key].model, innerQuery).getJoin(modelToGet[key], getAll, gotModel)._query),
                {}
              )
            }
            else {
              innerQuery = r.table(joins[key].link).getAll(doc(joins[key].leftKey), {index: model.getTableName()+"_"+joins[key].leftKey}).concatMap(function(link) {
                return r.table(joins[key].model.getTableName()).getAll(link(joins[key].model.getTableName()+"_"+joins[key].rightKey), {index: joins[key].rightKey})
              });

              if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
                innerQuery = modelToGet[key]._apply(innerQuery)
              }

              if ((modelToGet[key] == null) || (modelToGet[key]._array !== false)) {
                innerQuery = innerQuery.coerceTo("ARRAY");
              }

              return r.branch(
                doc.hasFields(joins[key].leftKey),
                r.object(key,
                  new Query(joins[key].model, innerQuery).getJoin(modelToGet[key], getAll, gotModel)._query),
                {}
              )
            }
          });
          break;
      }
    }
  });

  return self;
};

/**
 * Remove the provided relation
 * @param {Object=} relationsToRemove explicit joined documents to retrieve
 * @return {Query}
 */
Query.prototype.removeRelations = function(relationsToRemove) {
  var self = this;
  var queries = [];
  var originalQuery = self._query;
  util.loopKeys(relationsToRemove, function(joins, key) {
    var join = self._model._getModel()._joins[key];
    if (join === undefined) {
      return;
    }
    switch (join.type) {
      case 'hasOne':
      case 'hasMany':
        queries.push(self._query(join.leftKey).do(function(keys) {
          return self._r.branch(
            self._r.expr(["ARRAY", "STREAM", "TABLE_SLICE"]).contains(keys.typeOf()).not(),
            // keys is a single value
            join.model.getAll(keys, {index: join.rightKey}).replace(function(row) {
              return row.without(join.rightKey)
            })._query,
            self._r.branch( // keys.typeOf().eq("ARRAY")
              keys.isEmpty(),
              {errors: 0},
              join.model.getAll(self._r.args(keys), {index: join.rightKey}).replace(function(row) {
                return row.without(join.rightKey)
              })._query
            )
          )
        }))
        break;

      case 'belongsTo':
        queries.push(self._query.replace(function(row) {
          return row.without(join.leftKey)
        }));
        break;

      case 'hasAndBelongsToMany':
        queries.push(self._query(join.leftKey).do(function(keys) {
          return self._r.branch(
            self._r.expr(["ARRAY", "STREAM", "TABLE_SLICE"]).contains(keys.typeOf()).not(),
            // keys is a single value
            self._r.table(join.link).getAll(keys, {index: self._model.getTableName()+"_"+join.leftKey}).delete(),
            self._r.branch( // keys.typeOf().eq("ARRAY")
              keys.isEmpty(),
              {errors: 0},
              self._r.table(join.link).getAll(self._r.args(keys), {index: self._model.getTableName()+"_"+join.leftKey}).delete()
            )
          )
        }));
        break;
    }
  });
  if (queries.length > 0) {
    self._query = self._r.expr(queries).forEach(function(result) {
      return result;
    })
  }
  else {
    self._query = self._r.expr({errors: 0});
  }
  self._query = self._query.do(function(results) {
    return self._r.branch(
      results('errors').eq(0),
      originalQuery,
      self._r.error(results('errors'))
    )
  });
  return self;
};

/**
 * Import all the methods from rethinkdbdash, expect the private one (the one
 * starting with an underscore).
 * Some method are slightly changed: `get`, `update`, `replace`.
 */
(function() {
  var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
  util.loopKeys(Term, function(Term, key) {
    if (key === 'run' || key[0] === '_') return;
    // Note: We suppose that no method has an empty name
    switch (key) {
      case 'get':
        // `get` in thinky returns an error if the document is not found.
        // The driver currently just returns `null`.
        (function(key) {
          Query.prototype[key] = function() {
            return new Query(this._model, this._query[key].apply(this._query, arguments)).default(this._r.error(new Errors.DocumentNotFound().message));
          }
        })(key);
        break;

      case 'update':
      case 'replace':
        // `update` and `replace` can be used. A partial validation is performed before
        // sending the query, and a full validation is performed after the query. If the
        // validation fails, the document(s) will be reverted.
        (function(key) {
          Query.prototype[key] = function(value, options) {
            options = options || {};
            options.returnChanges = true;
            var error = null;
            var self = this;
            util.tryCatch(function() {
              if (util.isPlainObject(value)) {
                schemaUtil.validate(value, self._model._schema, '', {enforce_missing: false});
              }
            }, function(err) {
              error = err;
            });
            return new Query(this._model, this._query[key].call(this._query, value, options), true, error);
          }
        })(key);
        break;

      case 'changes':
        (function(key) {
          Query.prototype[key] = function() {
            // In case of `get().changes()` we want to remove the default(r.errror(...))
            // TODO: Do not hardcode this?
            if ((typeof this._query === 'function') && (this._query._query[0] === 92)) {
              this._query._query = this._query._query[1][0];
            }
            return new Query(this._model, this._query[key].apply(this._query, arguments));
          }
        })(key);
        break;

      case 'then':
      case 'error':
      case 'catch':
      case 'finally':
        (function(key) {
          Query.prototype[key] = function() {
            var promise = this.run();
            return promise[key].apply(promise, arguments);
          }
        })(key);
        break;

      default:
        (function(key) {
          Query.prototype[key] = function() {
            // Create a new query to let people fork it
            return new Query(this._model, this._query[key].apply(this._query, arguments));
          }
        })(key);
        break;
      }
  });
})();

Query.prototype._isPointWrite = function() {
  return Array.isArray(this._query._query) &&
      (this._query._query.length > 1) &&
      Array.isArray(this._query._query[1]) &&
      (this._query._query[1].length > 0) &&
      Array.isArray(this._query._query[1][0]) &&
      (this._query._query[1][0].length > 1) &&
      Array.isArray(this._query._query[1][0][1]) &&
      (this._query._query[1][0][1].length > 0) &&
      Array.isArray(this._query._query[1][0][1][0]) &&
      (this._query._query[1][0][1][0][0] === 16)
}

/**
 * Convert the query to its string representation.
 * @return {string}
 */
Query.prototype.toString = function() {
  return this._query.toString();
}

module.exports = Query;
