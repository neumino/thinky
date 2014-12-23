var Promise = require('bluebird');
var util = require(__dirname+'/util.js');
var Errors = require(__dirname+'/errors.js');
var schemaUtil = require(__dirname+'/schema.js');

// Arguments are:
// - model (optional): Model of the documents returned
// - query (optional): current ReQL query (rethinkdbdash)
// - postValidation (optional): whether post validation should overwrite the document in case of failure or not
function Query(model, query, postValidation, error) {
  var self = this;
  this._model = model; // constructor

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
    this._query = this._r.table(model.getTableName());
  }
  if (postValidation) {
    this._postValidation = (postValidation === true) ? true: false;
  }
  if (error) {
    // Note `Query.prototype.error` is defined because of `r.error`
    this._error = error;
  }
}

Query.prototype.run = function(options, callback) {
  if (typeof options === 'function') {
    return this._execute({}, true, options);
  }
  else {
    return this._execute(options, true, callback);
  }
}
Query.prototype.execute = function(options, callback) {

  if (typeof options === 'function') {
    return this._execute({}, false, options);
  }
  else {
    return this._execute(options, false, callback);
  }
}

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
        if (self._postValidation === true) {
          var error = null;
          if (result.errors > 0) {
            return reject(new Errors.InvalidWrite("An error occured during the write", result));
          }
          if (!Array.isArray(result.changes)) {
            reject(new Errors.InvalidWrite("Field `changes` of a write query not found."));
          }

          var promises = [];
          var revertAll = false;
          var foundInvalidDocument = false;
          for(var i=0; i<result.changes.length; i++) {
            (function(i) {
              promises.push(self._model._parse(result.changes[i].new_val));
            })(i)
          }
          Promise.all(promises).then(function(result) {
            if (result.length === 0) {
              resolve();
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
              if (revertAll === false) {
                // Revert all the writes. We issue point writes if one of the primary key is not a string
                revertAll = true;
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
            }
          })
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

// By default fetch all joins until it hits a circular reference
// options are passed in modelToGet
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
          innerQuery = innerQuery.getJoin(modelToGet[key], getAll, gotModel).coerceTo("ARRAY")._query
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
            innerQuery = innerQuery.coerceTo("ARRAY");
            return r.branch(
              doc.hasFields(joins[key].leftKey),
              r.object(key, new Query(joins[key].model, innerQuery).getJoin(modelToGet[key], getAll, gotModel)._query),
              {}
            )
          }
          else {
            innerQuery = r.table(joins[key].link).getAll(doc(joins[key].leftKey), {index: model.getTableName()+"_"+joins[key].leftKey}).concatMap(function(link) {
              return r.table(joins[key].model.getTableName()).getAll(link(joins[key].model.getTableName()+"_"+joins[key].rightKey), {index: joins[key].rightKey})
            }).coerceTo("ARRAY")

            if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
              innerQuery = modelToGet[key]._apply(innerQuery)
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
}

Query.prototype.then = function() {
  throw new Error("The method `then` is not defined on Query. Did you forgot `.run()` or `.execute()`?")
};

(function() {
  // Import rethinkdbdash methods
  var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
  util.loopKeys(Term, function(Term, key) {
    // Note: We suppose that no method has an empty name
    if ((key !== 'run') && (key[0] !== '_')) {
      if (key === 'get') {
        (function(key) {
          Query.prototype[key] = function() {
            return new Query(this._model, this._query[key].apply(this._query, arguments)).default(this._r.error("The query did not find a document and returned null."));
          }
        })(key);
      }
      else if ((key === 'update') || (key === 'replace')) {
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

Query.prototype.toString = function() {
  return this._query.toString();
}

module.exports = Query;
