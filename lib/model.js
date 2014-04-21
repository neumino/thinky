var util = require(__dirname+'/util.js');
var Document = require(__dirname+'/document.js');
var EventEmitter = require('events').EventEmitter;
var Query = require(__dirname+'/query.js');
var Promise = require('bluebird');

/*
 * document -> {} -> Document.prototype <-cp- model -> Model.prototype
 *
 */
function Model(name, schema, options, thinky) {
    this._name = name; // name of the table

    util.validateSchema(schema)
    this._schema = schema;

    // We want a deep copy
    options = options || {};
    this._options = {};
    this._options.enforce_missing = (options.enforce_missing != null) ? options.enforce_missing : thinky._options.enforce_missing;
    this._options.enforce_extra = (options.enforce_extra != null) ? options.enforce_extra : thinky._options.enforce_extra;
    this._options.enforce_type = (options.enforce_type != null) ? options.enforce_type : thinky._options.enforce_type;
    this._options.timeFormat = (options.timeFormat != null) ? options.timeFormat : thinky._options.timeFormat;
    this._options.validate = (options.validate != null) ? options.validate : thinky._options.validate;

    this._pk = (options.pk != null) ? options.pk : 'id';

    this._thinky = thinky;

    this._validator = options.validator;

    this._tableCreated = false;
    this._tableReady = false;
    this._indexesToCreate = 0;
    this._foreignIndexesToCreate = 0; // many to many indexes left to create

    this._error = null; // If an error occured, we won't let people save things

    this._listeners = {};
    this._maxListeners = 10;
    this._joins = {};

    // This is to track joins that were not directly called by this model but that we still need
    // to purge the database
    this._reverseJoins = {};

    this._methods = {};
}
util.inherits(Model, EventEmitter);

Model.new = function(name, schema, options, thinky) {

    var proto = new Model(name, schema, options, thinky);

    var model = function model(doc, options) {
        if (!util.isPlainObject(doc)) {
            throw new Error("Cannot build a new instance of `"+proto._name+"` without an object")
        }
        doc = util.deepCopy(doc);
        doc.__proto__ = new Document(model, options);

        // Make joins
        for(var key in proto._joins) {
            if (doc[key] != null) {
                if (proto._joins[key].type === 'hasOne') {
                    doc[key] = new proto._joins[key].model(doc[key], options);

                    doc.__proto__._hasOne[key] = {
                        doc: doc[key],
                        foreignKey: doc._getModel()._joins[key].rightKey
                    }

                    if (doc[key].__proto__._parents._hasOne[doc._getModel()._name] == null) {
                        doc[key].__proto__._parents._hasOne[doc._getModel()._name] = [];
                    }
                    doc[key].__proto__._parents._hasOne[doc._getModel()._name].push({
                        doc: doc,
                        key: key
                    });
                }
                else if (proto._joins[key].type === 'belongsTo') {
                    doc[key] = new proto._joins[key].model(doc[key], options);

                    if (doc[key].__proto__._parents._belongsTo[doc._getModel()._name] == null) {
                        doc[key].__proto__._parents._belongsTo[doc._getModel()._name] = [];
                    }
                    doc[key].__proto__._parents._belongsTo[doc._getModel()._name].push({
                        doc: doc,
                        foreignKey: doc._getModel()._joins[key].leftKey,
                        key: key
                    });
                }
                else if (proto._joins[key].type === 'hasMany') {
                    doc.__proto__._hasMany[key] = []

                    for(var i=0; i<doc[key].length; i++) {
                        doc[key][i] = new proto._joins[key].model(doc[key][i], options);
                        doc.__proto__._hasMany[key].push({
                            doc: doc[key][i],
                            foreignKey: doc._getModel()._joins[key].rightKey
                        })

                        if (doc[key][i].__proto__._parents._hasMany[doc._getModel()._name] == null) {
                            doc[key][i].__proto__._parents._hasMany[doc._getModel()._name] = [];
                        }
                        doc[key][i].__proto__._parents._hasMany[doc._getModel()._name].push({
                            doc: doc,
                            key: key
                        });

                    }
                }
                else if (proto._joins[key].type === 'hasAndBelongsToMany') {
                    doc.__proto__._links[model._joins[key].link] = {}

                    for(var i=0; i<doc[key].length; i++) {
                        doc[key][i] = new proto._joins[key].model(doc[key][i], options);

                        doc.__proto__._links[model._joins[key].link][doc[key][i][model._joins[key].rightKey]] = true;

                        if (doc[key][i].__proto__._parents._belongsLinks[doc._getModel()._name] == null) {
                            doc[key][i].__proto__._parents._belongsLinks[doc._getModel()._name] = [];
                        }
                        doc[key][i].__proto__._parents._belongsLinks[doc._getModel()._name].push({
                            doc: doc,
                            key: key
                        });

                    }
                }
            }
        }
        doc.__proto__._generateDefault.apply(doc)

        if (proto._options.validate === 'oncreate') {
            doc.validate();
        }

        return doc;
    }

    model.__proto__ = proto;

    // So people can directly call the EventEmitter from the constructor
    // TOIMPROVE: We should emit everything from the constructor instead of emitting things from
    // the constructor and the instance of Model
    for(var key in EventEmitter.prototype) {
        (function(_key) {
            model[_key] = function() {
                model._getModel()[_key].apply(model._getModel(), arguments);
            }
        })(key)
    }


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
}

Model.prototype._indexWasCreated = function(type) {
    if (type === 'local') {
        this._getModel()._indexesToCreate--;
    }
    else if (type === 'foreign') {
        this._getModel()._foreignIndexesToCreate--;
    }
    // We need to check tableCreated because _indexWasCreated can be called when a foreign index is built.
    if ((this._getModel()._tableCreated === true) && (this._getModel()._indexesToCreate === 0) && (this._getModel()._foreignIndexesToCreate === 0)) {
        this._setReady();
    }
}


Model.prototype._tableWasCreated = function() {
    var self = this;

    self._getModel()._tableCreated = true;
    self.emit('created');

    if ((self._getModel()._indexesToCreate === 0) && (self._getModel()._foreignIndexesToCreate === 0)) {
        // Will trigger the queries waiting
        this._setReady();
    }
};

/*
 * Make a shallow copy of docValues in doc
 */
Model.prototype.create = function(docValues) {
    var doc = {};
    for(var key in docValues) {
        doc[key] = docValues[key];
    }
    return doc;
}

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




Model.prototype.ensureIndex = function(name, fn) {
    var self = this;
    var r = self._getModel()._thinky.r;

    self._getModel()._indexesToCreate++;
    self._getModel()._tableReady = false;

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
                r.table(tableName).indexCreate(name, fn).do(function() {
                    return r.table(tableName).indexWait(name)
                })
            )
        ).run().then(function(result) {
            self._indexWasCreated('local');
        }).error(function(error) {
            if (error.message.match(/^Index `/)) {
                self._indexWasCreated('local');
            }
            else {
                self._getModel()._setError(error);
            }
        })

    }

    if (self._getModel()._tableCreated === true) {
        ensureIndex();
    }
    else {
        self.once('created', function() {
            ensureIndex();
        });
    }
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
 *                                ^- post.id
 *
 * options can be:
 * - init: Boolean (create an index or not)
 * - timeFormat: 'raw'/'native'
 * - enforce_extra: Boolean
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
    if (fieldDoc === "_order") {
        throw new Error("The field `_order` is reserved by thinky. Please use another one.");
    }
    self._getModel()._joins[fieldDoc] = {
        model: joinedModel,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasOne'
    }

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
            joinedModel.once('created', function() {
                query: r.branch(
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
 *                                                ^- author.id
 */
Model.prototype.belongsTo = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `belongsTo` must be a Model")
    }
    if (fieldDoc in self._getModel()._joins) {
        throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
    }
    if (fieldDoc === "_order") {
        throw new Error("The field `_order` is reserved by thinky. Please use another one.");
    }

    self._getModel()._joins[fieldDoc] = {
        model: joinedModel,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'belongsTo'
    }

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
                    joinedModel._indexWasCreated('foreign');
                }
                else {
                    joinedModel._getModel()._setError(error);
                    self._getModel()._setError(error);
                }
            })
        }
        else {
            self.once('created', function() {
                query.run().then(function() {
                    self._indexWasCreated('local');
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
 *                                 ^- author.id
 */
Model.prototype.hasMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `hasMany` must be a Model")
    }
    if (fieldDoc in self._getModel()._joins) {
        throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
    }
    if (fieldDoc === "_order") {
        throw new Error("The field `_order` is reserved by thinky. Please use another one.");
    }

    this._getModel()._joins[fieldDoc] = {
        model: joinedModel,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasMany'
    }

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
            joinedModel.on('created', function() {
                query.run().then(function() {
                    joinedModel._indexWasCreated('local');
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
 *                                       patient.id-^    ^-doctor.id
 *
 * It automatically creates a table <modelName>_<joinedModel> or <joinedModel>_<modelName> (alphabetic order)
 */
Model.prototype.hasAndBelongsToMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    var self = this;
    var link;
    var thinky = this._getModel()._thinky;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `hasAndBelongsToMany` must be a Model")
    }
    if (fieldDoc in self._getModel()._joins) {
        throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
    }
    if (fieldDoc === "_order") {
        throw new Error("The field `_order` is reserved by thinky. Please use another one.");
    }

    if (this._getModel()._name < joinedModel._getModel()._name) {
        link = this._getModel()._name+"_"+joinedModel._getModel()._name;
    }
    else {
        link = joinedModel._getModel()._name+"_"+this._getModel()._name;
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
        linkModel = thinky.createModel(link, {}); // Create a model, claim the namespace and create the table
    }

    options = options || {};
    if (options.init !== false) {
        var r = self._getModel()._thinky.r;

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
        )
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
        )

        var query = r.branch(
            r.table(link).indexList().contains(self.getTableName()+'_'+leftKey),
            r.table(link).indexWait(self.getTableName()+'_'+leftKey),
            r.table(link).indexCreate(self.getTableName()+'_'+leftKey).do(function() {
                return r.table(link).indexWait(self.getTableName()+'_'+leftKey)
            })
        ).do(function() {
            return r.branch(
                r.table(link).indexList().contains(self.getTableName()+'_'+leftKey),
                r.table(link).indexWait(self.getTableName()+'_'+leftKey),
                r.table(link).indexCreate(self.getTableName()+'_'+leftKey).do(function() {
                    return r.table(link).indexWait(self.getTableName()+'_'+leftKey)
                })
            )
        }).do(function() {
            return r.branch(
                r.table(link).indexList().contains(joinedModel.getTableName()+'_'+rightKey),
                r.table(link).indexWait(joinedModel.getTableName()+'_'+rightKey),
                r.table(link).indexCreate(joinedModel.getTableName()+'_'+rightKey).do(function() {
                    return r.table(link).indexWait(joinedModel.getTableName()+'_'+rightKey)
                })
            )
        })

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
            self.on('created', function() {
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

        joinedModel._getModel()._tableReady = false;
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
            joinedModel.on('created', function() {
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


        return new Promise(function(resolve, reject) {
            var successCb = function() {
                self._indexWasCreated('foreign');
                joinedModel._indexWasCreated('foreign');
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
                linkModel.on('ready', function() {
                    query.run().then(successCb).error(errorCb)
                });
            }
        })
    }
}

// Import rethinkdbdash methods
var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
for(var key in Term) {
    if ((Term.hasOwnProperty(key)) && (key !== 'run') && (key[0] !== '_')) {
        (function(key) {
            Model.prototype[key] = function() {
                var query = new Query(this);
                query = query[key].apply(query, arguments);
                return query;
            }
        })(key);
    }
}

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

Model.prototype.define = function(key, fn) {
    this._methods[key] = fn;
}



Model.prototype._parse = function(data) {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        if ((util.isPlainObject(data)) && (data.__proto__.next !== undefined)) { // Checking if a cursor
            data.toArray().then(function(result) {
                try{
                    for(var i=0; i<result.length; i++) {
                        self.emit('retrieved', result[i]);
                        result[i] = new self(result[i])
                        result[i].validate();
                        result[i]._setSaved(true);
                    }
                    resolve(result);
                }
                catch(error) {
                    var newError = new Error();
                    newError.message = "The results could not be converted to instances of `"+self.getTableName()+"`\nDetailed error: "+error.message
                
                    return reject(newError);
                }
            }).error(reject)
        }
        else {
            // If we get a GROUPED_DATA, we convert documents in each group
            if (util.isPlainObject(data) && (data.$reql_type$ === "GROUPED_DATA")) {
                try{
                    var result = [];
                    var reduction, newDoc;
                    for(var i=0; i<data.data.length; i++) {
                        reduction = [];
                        for(var j=0; j<data.data[i][1].length; j++) {
                            self.emit('retrieved', data.data[i][1][j]);
                            newDoc = new self(data.data[i][1][j]);
                            newDoc.validate();
                            newDoc._setSaved(true);

                            reduction.push(newDoc)
                        }
                        result.push({
                            group: data.data[i][0],
                            reduction: reduction
                        })
                    }
                    resolve(result)
                }
                catch(err) {
                    reject(err)
                }
            }
            else {
                if (data === null) { // makeDocument is true, but we got `null`
                    reject(new Error("Cannot build a new instance of `"+self.getTableName()+"` with `null`."))
                }
                else {
                    try{
                        self.emit('retrieved', data);
                        data = new self(data);
                        data.validate();
                        data._setSaved(true);
                        resolve(data)
                    }
                    catch(error) {
                        reject(error);
                    }
                }
            }
        }
    })
    return p;
}

Model.prototype.pre = function(ev, fn) {
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
        delete this._getModel()._listeners = {};
    }
}

module.exports = Model;


