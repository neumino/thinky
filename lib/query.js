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
function Query(model, query, options, error) {
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

  if (util.isPlainObject(options)) {
    if (options.postValidation) {
      this._postValidation = options.postValidation === true;
    }
    if (options.ungroup) {
      this._ungroup = options.ungroup === true;
    }
    else {
      this._ungroup = false;
    }
  }
  else { // let the user rework the result after ungroup
    this._ungroup = false;
  }
  if (error) {
    // Note `Query.prototype.error` is defined because of `r.error`, so we shouldn't
    // defined this.error.
    this._error = error;
  }
  this._pointWrite = false;
}

Query.prototype.setPostValidation = function() {
  this._postValidation = true;
}

Query.prototype.setPointWrite = function() {
  this._pointWrite = true;
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
* Bind Query.prototype.run() for later use
* @param {Object=} options The options passed to the driver's method `run`
* @param {Function=} callback
* @return {Function} return a `this` bound Query.prototype.run()
*/

Query.prototype.bindRun = function () {
  var curriedArgs = Array.prototype.slice.call(arguments);
  return Function.prototype.bind.apply( Query.prototype.run, [ this ].concat( curriedArgs ) );
}

/**
 * Bind Query.prototype.execute() for later use
 * @param {Object=} options The options passed to the driver's method `run`
 * @param {Function=} callback
 * @return {Function} return a `this` bound Query.prototype.execute()
 */

Query.prototype.bindExecute = function () {
  var curriedArgs = Array.prototype.slice.call(arguments);
  return Function.prototype.bind.apply( Query.prototype.execute, [ this ].concat( curriedArgs ) );
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
  if (parse === true) {
    fullOptions.cursor = false;
  }

  if (self._model._error !== null) {
    return Promise.reject(self._model._error);
  }
  return self._model.ready().then(function() {
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
      return self._model._parse(result, self._ungroup);
    }

    if (groupFormat !== 'raw') {
      return Query.prototype._convertGroupedData(result);
    }

    return result;
  }).catch(function(err) {
    return Promise.reject(Errors.create(err));
  })
};

Query.prototype._validateUngroupResult = function(result) {
}

Query.prototype._validateQueryResult = function(result) {
  var self = this;
  if (result.errors > 0) {
    console.log(result);
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
      if (result.length > 1) {
        throw new Error('A point write returned multiple values')
      }
      return result[0];
    }
    return result;
  }).catch(function(error) {
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
 * Add a relation
 * @param {string} field The field of the joined document(s)
 * @param {Object} joinedDocument An object with the primary key defined or the related key
 * @return {Promise}
 *
 * hasOne, primary key required
 * User.get(1).addRelation("account", {id: 2, sold: 2132})
 * The promise resolved the document on which addRelation is called
 *
 * hasMany, primary key required
 * User.get(1).addRelation("accounts", {id: 2, sold: 2132})
 * The promise resolved the updated joined document
 *
 * belongsTo, right joined key OR primary key required
 * User.get(1).addRelation("account", {id: 2, sold: 2132})
 * The promise resolved the document on which addRelation is called
 *
 * hasAndBelongsToMany, right joined key required
 * User.get(1).addRelation("accounts", {id: 2, sold: 2132})
 * The promise resolved with true
 */

Query.prototype.addRelation = function(field, joinedDocument) {
  var self = this;
  var model = self._model;
  var joins = self._model._getModel()._joins;
  var joinedModel = joins[field].model;
  var r = self._model._thinky.r;

  switch (joins[field].type) {
    case 'hasOne':
    case 'hasMany':
      if (joinedDocument[joinedModel._pk] === undefined) {
        return new Query(model, self, {},
            new Error('Primary key for the joined document not found for a `hasOne/hasMany` relation.')
        );
      }
      var updateValue = {};
      updateValue[joins[field].rightKey] = self._query(joins[field].leftKey);
      return joinedModel.get(joinedDocument[joinedModel._pk]).update(updateValue, {nonAtomic: true}).run()
    case 'belongsTo':
      var updateValue = {};
      if (joinedDocument[joins[field].rightKey] === undefined) {
        if (joinedDocument[joinedModel._pk] === undefined) {
          return new Query(model, self, {},
              new Error('The primary key or the joined key must be defined in the joined document for a `belongsTo` relation.')
          );
        }
        updateValue[joins[field].leftKey] = joinedModel.get(joinedDocument[joinedModel._pk]).bracket(joins[field].rightKey)._query;
      }
      else {
        updateValue[joins[field].leftKey] = joinedDocument[joins[field].rightKey];
      }
      return self.update(updateValue, {nonAtomic: true}).run();
    case 'hasAndBelongsToMany':
      var linkModel = joins[field].linkModel;
      var linkValue;
      var link;
      if (joinedDocument[joins[field].rightKey] === undefined) {
        if (joinedDocument[joinedModel._pk] === undefined) {
          return new Query(model, self, {},
              new Error('The primary key or the joined key must be defined in the joined document for a `hasAndBelongsToMany` relation.')
          );
        }
        link = joinedModel.get(joinedDocument[joinedModel._pk]).bracket(joins[field].rightKey)._query
      }
      else {
        link = r.expr(joinedDocument[joins[field].rightKey]);
      }

      if ((model.getTableName() === joinedModel.getTableName())
          && (joins[field].leftKey === joins[field].rightKey)) {
        linkValue = self._query(joins[field].leftKey).do(function(leftKey) {
          return link.do(function(rightKey) {
            return r.branch(
                rightKey.lt(leftKey),
                r.object(
                  'id', rightKey.add('_').add(leftKey),
                  joins[field].leftKey+"_"+joins[field].leftKey, [leftKey, rightKey]
                ),
                r.object(
                  'id', leftKey.add('_').add(rightKey),
                  joins[field].leftKey+"_"+joins[field].leftKey, [leftKey, rightKey]
                )
            )
          });
        });
      }
      else {
        linkValue = self._query(joins[field].leftKey).do(function(leftKey) {
          return link.do(function(rightKey) {
            if (model.getTableName() < joinedModel.getTableName()) {
              return r.object(
                'id', leftKey.add('_').add(rightKey),
                model.getTableName()+"_"+joins[field].leftKey, leftKey,
                joinedModel.getTableName()+"_"+joins[field].rightKey,rightKey 
              )
            }
            else if (model.getTableName() > joinedModel.getTableName()) {
              return r.object(
                'id', rightKey.add('_').add(leftKey),
                model.getTableName()+"_"+joins[field].leftKey, leftKey,
                joinedModel.getTableName()+"_"+joins[field].rightKey,rightKey 
              )
            }
            else {
              return r.branch(
                rightKey.lt(leftKey),
                r.object(
                  'id', leftKey.add('_').add(rightKey),
                  model.getTableName()+"_"+joins[field].leftKey, leftKey,
                  joinedModel.getTableName()+"_"+joins[field].rightKey,rightKey 
                ),
                r.object(
                  'id', rightKey.add('_').add(leftKey),
                  model.getTableName()+"_"+joins[field].leftKey, leftKey,
                  joinedModel.getTableName()+"_"+joins[field].rightKey,rightKey 
                )
              )
            }
          });
        });
      }

      return linkModel.insert(linkValue, {conflict: "replace", returnChanges: 'always'}).do(function(result) {
        return r.branch(
            result('errors').eq(0),
            true, // not relevant value
            r.error(result('errors'))
        )
      }).execute()
    default:
      return new Query(model, self, {},
          new Error('The provided field `'+field+'` does not store joined documents.')
      ).run()
  }
}

/**
 * Remove the provided relation
 * @param {string} field The field of the joined document(s) to remove
 * @param {Array} joinedDocument The document with who the relation should be removed
 * @return {Promise}
 */
//TODO Support an array of joinedDocuments?
Query.prototype.removeRelation = function(field, joinedDocument) {
  var self = this;
  var model = self._model;
  var joins = self._model._getModel()._joins;
  var joinedModel = joins[field].model;
  var r = self._model._thinky.r;

  var query;
  switch (joins[field].type) {
    case 'hasOne':
      query = joinedModel.getAll(self._query(joins[field].leftKey), {index: joins[field].rightKey}).replace(function(row) {
        return row.without(joins[field].rightKey)
      });
      query.setPostValidation();
      query.setPointWrite();
      return query;
    case 'hasMany':
      if (joinedDocument === undefined) {
        query = joinedModel.getAll(self._query(joins[field].leftKey), {index: joins[field].rightKey}).replace(function(row) {
          return row.without(joins[field].rightKey)
        })
      }
      else {
        query = joinedModel.getAll(r.expr(joinedDocument)(joinedModel._pk)).replace(function(row) {
          return row.without(joins[field].rightKey)
        })
      }
      query.setPostValidation();
      return query;
    case 'belongsTo':
      query = self.replace(function(row) {
        return row.without(joins[field].leftKey)
      })
      query.setPostValidation();
      return query;
    case 'hasAndBelongsToMany':
      var linkModel = joins[field].linkModel;
      if (joinedDocument === undefined) {
        query = self._query(joins[field].leftKey).do(function(leftKey) {
          // range are not supported at the moment, so keys is an object and we don't have to worry about empty sequences
          if ((model.getTableName() === joinedModel.getTableName())
              && (joins[field].leftKey === joins[field].rightKey)) {
            return linkModel.getAll(leftKey, {index: joins[field].leftKey+'_'+joins[field].leftKey}).delete()._query
          }
          else {
            return linkModel.getAll(leftKey, {index: model.getTableName()+'_'+joins[field].leftKey}).delete()._query
          }
        }).do(function(result) {
          return r.branch(
              result('errors').eq(0),
              true, // not relevant value
              r.error(result('errors'))
           )
        })
      }
      else {
        if (joinedDocument[joins[field].rightKey] === undefined) {
          if (joinedDocument[joinedModel._pk] === undefined) {
            return new Query(model, self, {},
                new Error('The primary key or the joined key must be defined in the joined document for a `hasAndBelongsToMany` relation.')
            );
          }

          if ((model.getTableName() === joinedModel.getTableName())
              && (joins[field].leftKey === joins[field].rightKey)) {
            query = self._query(joins[field].leftKey).do(function(leftKey) {
              return joinedModel.get(joinedDocument[joinedModel._pk]).bracket(joins[field].rightKey).do(function(rightKey) {
                if (model.getTableName() < joinedModel.getTableName()) {
                  return linkModel.getAll(leftKey.add('_').add(rightKey)).delete()._query;
                }
                else if (model.getTableName() > joinedModel.getTableName()) {
                  return linkModel.getAll(rightKey.add('_').add(leftKey)).delete()._query;
                }
                else {
                  return r.branch(
                    leftKey.lt(rightKey),
                    linkModel.getAll(leftKey.add('_').add(rightKey)).delete()._query,
                    linkModel.getAll(rightKey.add('_').add(leftKey)).delete()._query
                  )
                }
              });
            })
          }
          else {
            query = self._query(joins[field].leftKey).do(function(leftKey) {
              return joinedModel.get(joinedDocument[joinedModel._pk]).bracket(joins[field].rightKey).do(function(rightKey) {
                if (model.getTableName() < joinedModel.getTableName()) {
                  return linkModel.getAll(leftKey.add('_').add(rightKey)).delete()._query
                }
                else if (model.getTableName() > joinedModel.getTableName()) {
                  return linkModel.getAll(rightKey.add('_').add(leftKey)).delete()._query
                }
                else {
                  return r.branch(
                    leftKey.lt(rightKey),
                    linkModel.getAll(leftKey.add('_').add(rightKey)).delete()._query,
                    linkModel.getAll(rightKey.add('_').add(leftKey)).delete()._query
                  )

                }
              });
            })
          }
        }
        else {
          query = self._query(joins[field].leftKey).do(function(leftKey) {
            var rightKey = r.expr(joinedDocument[joins[field].rightKey]);
            if (model.getTableName() < joinedModel.getTableName()) {
              return linkModel.getAll(leftKey.add('_').add(rightKey)).delete()._query
            }
            else if (model.getTableName() > joinedModel.getTableName()) {
              return linkModel.getAll(rightKey.add('_').add(leftKey)).delete()._query
            }
            else {
              return r.branch(
                leftKey.lt(rightKey),
                linkModel.getAll(leftKey.add('_').add(rightKey)).delete()._query,
                linkModel.getAll(rightKey.add('_').add(leftKey)).delete()._query
              )

            }
          })
        }
      }
      return query;
    default:
      return new Query(model, self, {},
          new Error('The provided field `'+field+'` does not store joined documents.')
      );
  }
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
        // Copy it in `_get` without `default`.
        (function(key) {
          Query.prototype['_get'] = function() {
            // Create a new query to let people fork it
            return new Query(this._model, this._query[key].apply(this._query, arguments));
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
            options.returnChanges = 'always';
            var error = null;
            var self = this;
            util.tryCatch(function() {
              if (util.isPlainObject(value)) {
                schemaUtil.validate(value, self._model._schema, '', {enforce_missing: false});
              }
            }, function(err) {
              error = err;
            });
            return new Query(this._model, this._query[key].call(this._query, value, options), {postValidation: true}, error);
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

      case 'ungroup':
        (function(key) {
          Query.prototype[key] = function() {
            return new Query(this._model, this._query[key].apply(this._query, arguments), {ungroup: true});
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
  return this._pointWrite || (Array.isArray(this._query._query) &&
      (this._query._query.length > 1) &&
      Array.isArray(this._query._query[1]) &&
      (this._query._query[1].length > 0) &&
      Array.isArray(this._query._query[1][0]) &&
      (this._query._query[1][0].length > 1) &&
      Array.isArray(this._query._query[1][0][1]) &&
      (this._query._query[1][0][1].length > 0) &&
      Array.isArray(this._query._query[1][0][1][0]) &&
      (this._query._query[1][0][1][0][0] === 16))
}

/**
 * Convert the query to its string representation.
 * @return {string}
 */
Query.prototype.toString = function() {
  return this._query.toString();
}

module.exports = Query;
