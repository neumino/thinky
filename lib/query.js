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
    this._postValidation = (postValidation === true) ? true: false;
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
    return this._execute({}, true, options);
  }
  else {
    return this._execute(options, true, callback);
  }
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
    return this._execute({}, false, options);
  }
  else {
    return this._execute(options, false, callback);
  }
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
Query.prototype._execute = function(options, parse, callback) {
  var self = this;
  options = options || {};
  var fullOptions = {groupFormat: 'raw'}
  util.loopKeys(options, function(options, key) {
    fullOptions[key] = options[key]
  });
  if (parse !== true) {
    fullOptions.cursor = true;
  }

  var p;
  if (self._model._error !== null) {
    p = new Promise(function(resolve, reject) {
      reject(self._model._error);
    })
  }
  else {
    var executeCallback = function(resolve, reject) {
      if (self._error !== undefined) {
        return reject(new Error("The partial value is not valid, so the write was not executed. The original error was:\n"+self._error.message));
      }
      self._query.run(fullOptions).then(function(result) {
        // Expect a write result from RethinkDB
        if (self._postValidation === true) {
          var error = null;
          if (result.errors > 0) {
            return reject(new Errors.InvalidWrite("An error occured during the write", result));
          }
          if (!Array.isArray(result.changes)) {
            reject(new Errors.InvalidWrite("Field `changes` of a write query not found."));
          }

          var promises = [];
          var foundInvalidDocument = false;
          for(var i=0; i<result.changes.length; i++) {
            (function(i) {
              if (result.changes[i].new_val !== null) {
                promises.push(self._model._parse(result.changes[i].new_val));
              }
            })(i)
          }
          Promise.all(promises).then(function(result) {
            if (result.length === 0) {
              resolve([]);
            }
            else if (result.length === 1) {
              resolve(result[0])
            }
            else if (result.length > 1) {
              resolve(result)
            }
          }).error(function(error) {
            foundInvalidDocument = true;
            if (error instanceof Errors.DocumentNotFound) {
              // Should we send back null?
            }
            else {
              var primaryKeyString = true; // whether all the primary keys are strings or not
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
                  primaryKeyString = false
                  break;
                }
              }
              if (primaryKeyString === true) {
                r.table(self._model.getTableName()).getAll(r.args(primaryKeys)).replace(function(doc) {
                  return r.expr(keysToValues)(doc(self._model._pk));
                }).run().then(function(result) {
                  reject(new Errors.InvalidWrite("The write failed, and the changes were reverted"));
                }).error(function(error) {
                  reject(new Error("The write failed, and the attempt to revert the changes failed with the error:\n"+error.message));
                });
              }
              else {
                var revertPromises = [];
                for(var p=0; p<result.changes.length; p++) {
                  var primaryKey = util.extractPrimaryKey(
                      result.changes[p].old_val,
                      result.changes[p].new_val,
                      self._model._pk)
                  if (primaryKey === undefined) {
                    continue;
                  }

                  revertPromises.push(r.table(self._model.getTableName())
                    .get(primaryKey)
                    .replace(result.changes[p].old_val)
                    .run());
                }
                Promise.all(revertPromises).then(function(result) {
                  reject(new Error("The write failed, and the changes were reverted."));
                }).error(function(error) {
                  reject(new Error("The write failed, and the attempt to revert the changes failed with the error:\n"+error.message));
                });
              }
            }
          })
        }
        else if ((result != null) && (typeof result.getType === 'function') && (result.getType() === 'feed')) {
          var feed = new Feed(result, self._model);
          resolve(feed);
        }
        else if ((result != null) && (typeof result.getType === 'function') && (result.getType() === 'atomFeed')) {
          result.next().then(function(initial) {
            var value = initial.new_val || {};
            self._model._parse(value).then(function(doc) {
              doc._setFeed(result);
              resolve(doc);
            }).error(reject);
          });
        }
        else {
          if (parse === true) {
            if (result === null) {
              reject(new Errors.DocumentNotFound())
            }
            else {
              self._model._parse(result).then(resolve).error(reject);
            }
          }
          else {
            if (options.groupFormat !== 'raw') {
              resolve(Query.prototype._convertGroupedData(result));
            }
            else {
              resolve(result);
            }
          }
        }
      }).error(function(err) {
        if (err.message.match(/^The query did not find a document and returned null./)) {
          //Reject with an instance of Errors.DocumentNotFound
          reject(new Errors.DocumentNotFound(err.message))
        }
        else {
          reject(err)
        }
      })
    };

    if (self._model._getModel()._tableReady === true) {
      p = new Promise(executeCallback);
    }
    else {
      p = new Promise(function(resolve, reject) {
        self._model._onTableReady.push(function() {
          executeCallback(resolve, reject);
        });
      });
    }
  }
  return p.nodeify(callback);
}


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

  var getAll = (modelToGet === undefined) ? true: false;
  if (util.isPlainObject(modelToGet) === false) {
    modelToGet = {};
  }
  var innerQuery;

  gotModel = gotModel || {};
  gotModel[model.getTableName()] = true;

  util.loopKeys(joins, function(joins, key) {
    if (util.recurse(key, joins, modelToGet, getAll, gotModel)) {
      if (joins[key].type === 'hasOne') {
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
      }
      else if (joins[key].type === 'belongsTo') {
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
      }
      else if (joins[key].type === 'hasMany') {
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
      }
      else if (joins[key].type === 'hasAndBelongsToMany') {
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
      }
    }
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
    // Note: We suppose that no method has an empty name
    if ((key !== 'run') && (key[0] !== '_')) {
      if (key === 'get') {
        // `get` in thinky returns an error if the document is not found.
        // The driver currently just returns `null`.
        (function(key) {
          Query.prototype[key] = function() {
            return new Query(this._model, this._query[key].apply(this._query, arguments)).default(this._r.error("The query did not find a document and returned null."));
          }
        })(key);
      }
      else if ((key === 'update') || (key === 'replace')) {
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
            if (error === null) {
              return new Query(this._model, this._query[key].call(this._query, value, options), true);
            }
            else {
              return new Query(this._model, this._query[key].call(this._query, value, options), true, error);
            }
          }
        })(key);
      }
      else if (key === 'changes') {
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
      }
      else {
        (function(key) {
          Query.prototype[key] = function() {
            // Create a new query to let people fork it
            return new Query(this._model, this._query[key].apply(this._query, arguments));
          }
        })(key);
      }
    }
  });
})();


/**
 * Convert the query to its string representation.
 * @return {string}
 */
Query.prototype.toString = function() {
  return this._query.toString();
}

module.exports = Query;
