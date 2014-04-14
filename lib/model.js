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
    this._name = name;

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
    this._indexesToCreate = 0; // does not always match this._onTableCreated.length because of the hasAndBelongsToMany relation
    this._onTableCreated = []; // query, resolve, reject)
    this._foreignIndexesToCreate = 0; // many to many indexes left to create

    this._error = null; // If an error occured, we won't let people save things

    this._listeners = {};
    this._maxListeners = 10;
    this._joins = {};

    // This is to track joins that were not directly called by this model but that we still need
    // to purge the database
    this._reverseJoins = {};
}
util.inherits(Model, EventEmitter);

Model.new = function(name, schema, options, thinky) {

    var proto = new Model(name, schema, options, thinky);

    var model = function model(doc, options) {
        if (!util.isPlainObject(doc)) {
            throw new Error("Cannot build a new instance of `"+proto._name+"` without an object")
        }
        doc = util.deepCopy(doc);
        // Make joins
        for(var key in proto._joins) {
            if (doc[key] != null) {
                if ((proto._joins[key].type === 'hasOne') || (proto._joins[key].type === 'belongsTo')) {
                    doc[key] = new proto._joins[key].model(doc[key], options)
                }
                else if ((proto._joins[key].type === 'hasMany') || (proto._joins[key].type === 'hasAndBelongsToMany')) {
                    for(var i=0; i<doc[key].length; i++) {
                        doc[key][i] = new proto._joins[key].model(doc[key][i], options)
                    }
                }
            }
        }
        doc.__proto__ = new Document(model, options);
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

    if ((this._getModel()._indexesToCreate === 0) && (this._getModel()._foreignIndexesToCreate === 0)) {
        this._setReady();
    }
}


Model.prototype._tableWasCreated = function() {
    var self = this;

    self._getModel()._tableCreated = true;
    if (self._getModel()._onTableCreated.length > 0) {
        // Create indexes, 
        // self._getModel()._indexesToCreate += self._onTableCreated.length
        for(var i = 0; i<self._getModel()._onTableCreated.length; i++) {
            if (i < self._getModel()._onTableCreated.length) {
                self._getModel()._onTableCreated[i].query.run().then(self._getModel()._onTableCreated[i].resolve).error(self._getModel()._onTableCreated[i].reject);
            }
        }
    }
    else if ((self._getModel()._indexesToCreate === 0) && (self._getModel()._foreignIndexesToCreate === 0)) {
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
Model.prototype.getName = function() {
    return this._getModel()._name;
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
        var tableName = joinedModel.getName();
        var r = joinedModel._getModel()._thinky.r;

        joinedModel._getModel()._indexesToCreate++;
        self._getModel()._foreignIndexesToCreate++;

        self._getModel()._tableReady = false;
        joinedModel._getModel()._tableReady = false;

        if (joinedModel._getModel()._tableCreated === true) {
            r.table(tableName).indexList().contains(rightKey).do(function(result) {
                return r.branch(
                    result,
                    r.table(tableName).indexWait(rightKey),
                    r.branch(
                        r.table(tableName).info()("primary_key").eq(rightKey),
                        r.table(tableName).indexWait(rightKey),
                        r.table(tableName).indexCreate(rightKey).do(function() {
                            return r.table(tableName).indexWait(rightKey)
                        })
                    )
                )
            }).run().then(function(result) {
                joinedModel._indexWasCreated('local');
                self._indexWasCreated('foreign');
            }).error(function(error) {
                if (error.message.match(/^Index `/)) {
                    joinedModel._indexWasCreated('local');
                    self._indexWasCreated('foreign');
                }
                else {
                    joinedModel._getModel()._error = error;
                    self._getModel()._error = error;
                }
            })
        }
        else {
            joinedModel._getModel()._onTableCreated.push({
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
                ),
                resolve: function() {
                    joinedModel._indexWasCreated('local');
                    self._indexWasCreated('foreign');
                },
                reject: function(error) {
                    if (error.message.match(/^Index `/)) {
                        joinedModel._indexWasCreated('local');
                        self._indexWasCreated('foreign');
                    }
                    else {
                        joinedModel._getModel()._error = error;
                        self._getModel()._error = error;
                    }
                }
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
        var tableName = self.getName();
        var r = self._getModel()._thinky.r;

        self._getModel()._indexesToCreate++;
        joinedModel._getModel()._foreignIndexesToCreate++;

        self._getModel()._tableReady = false;
        joinedModel._getModel()._tableReady = false;

        var query = r.table(tableName).indexList().contains(leftKey).do(function(result) {
            return r.branch(
                result,
                r.table(tableName).indexWait(leftKey),
                r.branch(
                    r.table(tableName).info()("primary_key").eq(leftKey),
                    {index: leftKey, ready: true},
                    r.table(tableName).indexCreate(leftKey).do(function() {
                        return r.table(tableName).indexWait(leftKey)
                    })
                )
            )
        })
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
                    joinedModel._getModel()._error = error;
                    self._getModel()._error = error;
                }
            })
        }
        else {
            self._getModel()._onTableCreated.push({
                query: query,
                resolve: function() {
                    self._indexWasCreated('local');
                    joinedModel._indexWasCreated('foreign');
                },
                reject: function(error) {
                    if (error.message.match(/^Index `/)) {
                        self._indexWasCreated('local');
                        joinedModel._indexWasCreated('foreign');
                    }
                    else {
                        joinedModel._getModel()._error = error;
                        self._getModel()._error = error;
                    }
                }
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
        var tableName = joinedModel.getName();
        var r = self._getModel()._thinky.r;

        var query = r.table(tableName).indexList().contains(rightKey).do(function(result) {
            return r.branch(
                result,
                r.table(tableName).indexWait(rightKey),
                r.branch(
                    r.table(tableName).info()("primary_key").eq(rightKey),
                    {index: rightKey, ready: true},
                    r.table(tableName).indexCreate(rightKey).do(function() {
                        return r.table(tableName).indexWait(rightKey)
                    })
                )
            )
        })

        joinedModel._getModel()._indexesToCreate++;
        self._getModel()._foreignIndexesToCreate++;

        self._getModel()._tableReady = false;
        joinedModel._getModel()._tableReady = false;

        if (joinedModel._getModel()._tableCreated === true) {
            query.run().then(function(result) {
                joinedModel._indexWasCreated('local');
                self._indexWasCreated('foreign');
            }).error(function(error) {
                if (error.message.match(/^Index `/)) {
                    joinedModel._indexWasCreated('local');
                    self._indexWasCreated('foreign');
                }
                else {
                    self._getModel()._error = error;
                    joinedModel._getModel()._error = error;
                }
            })
        }
        else {
            joinedModel._getModel()._onTableCreated.push({
                query: query,
                resolve: function() {
                    joinedModel._indexWasCreated('local');
                    self._indexWasCreated('foreign');
                },
                reject: function(error) {
                    if (error.message.match(/^Index `/)) {
                        joinedModel._indexWasCreated('local');
                        self._indexWasCreated('foreign');
                    }
                    else {
                        self._getModel()._error = error;
                        joinedModel._getModel()._error = error;
                    }
                }
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

    joinedModel._getModel()._reverseJoins[self.getName()] = {
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasAndBelongsToMany',
        link: link
    }


    options = options || {};
    if (options.init !== false) {
        var r = self._getModel()._thinky.r;

        var queryIndex1 = r.branch(
            r.table(self.getName()).indexList().contains(leftKey),
            r.table(self.getName()).indexWait(leftKey),
            r.branch(
                r.table(self.getName()).info()('primary_key').eq(leftKey),
                {index: leftKey, ready: true},
                r.table(self.getName()).indexCreate(leftKey).do(function() {
                    return r.table(self.getName()).indexWait(leftKey)
                })
            )
        )
        var queryIndex2 = r.branch(
            r.table(joinedModel.getName()).indexList().contains(rightKey),
            r.table(joinedModel.getName()).indexWait(rightKey),
            r.branch(
                r.table(joinedModel.getName()).info()('primary_key').eq(rightKey),
                {index: rightKey, ready: true},
                r.table(joinedModel.getName()).indexCreate(rightKey).do(function() {
                    return r.table(joinedModel.getName()).indexWait(rightKey)
                })
            )
        )

        var query = r.branch( // Create link
            r.tableList().contains(link),
            r.branch(
                r.table(link).indexList().contains(self.getName()+'_'+leftKey),
                r.table(link).indexWait(self.getName()+'_'+leftKey),
                r.table(link).indexCreate(self.getName()+'_'+leftKey).do(function() {
                    return r.table(link).indexWait(self.getName()+'_'+leftKey)
                })
            ),
            r.tableCreate(link).do(function() {
                // TODO: This takes about one second to execute and is a dirty patch for https://github.com/rethinkdb/rethinkdb/issues/2226
                return r.js('var i = 0; while (i<300000000) { i++}').do(function() {
                return r.branch(
                    r.table(link).indexList().contains(self.getName()+'_'+leftKey),
                    r.table(link).indexWait(self.getName()+'_'+leftKey),
                    r.table(link).indexCreate(self.getName()+'_'+leftKey).do(function() {
                        return r.table(link).indexWait(self.getName()+'_'+leftKey)
                    })
                )
                })
            })
        ).do(function() {
            return r.branch(
                r.table(link).indexList().contains(self.getName()+'_'+leftKey),
                r.table(link).indexWait(self.getName()+'_'+leftKey),
                r.table(link).indexCreate(self.getName()+'_'+leftKey).do(function() {
                    return r.table(link).indexWait(self.getName()+'_'+leftKey)
                })
            )
        }).do(function() {
            return r.branch(
                r.table(link).indexList().contains(joinedModel.getName()+'_'+rightKey),
                r.table(link).indexWait(joinedModel.getName()+'_'+rightKey),
                r.table(link).indexCreate(joinedModel.getName()+'_'+rightKey).do(function() {
                    return r.table(link).indexWait(joinedModel.getName()+'_'+rightKey)
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
                    self._getModel()._error = error;
                    joinedModel._getModel()._error = error;
                }
            })
        }
        else {
            self._getModel()._onTableCreated.push({
                query: queryIndex1,
                resolve: function() {
                    self._indexWasCreated('local');
                    joinedModel._indexWasCreated('foreign');
                },
                reject: function(error) {
                    if (error.message.match(/^Index `/)) {
                        self._indexWasCreated('local');
                        joinedModel._indexWasCreated('foreign');
                    }
                    else {
                        self._getModel()._error = error;
                    }
                }
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
                    self._getModel()._error = error;
                    joinedModel._getModel()._error = error;
                }
            })
        }
        else {
            joinedModel._getModel()._onTableCreated.push({
                query: queryIndex2,
                resolve: function() {
                    joinedModel._indexWasCreated('local');
                    self._indexWasCreated('foreign');
                },
                reject: function(error) {
                    if (error.message.match(/^Index `/)) {
                        joinedModel._indexWasCreated('local');
                        self._indexWasCreated('foreign');
                    }
                    else {
                        self._getModel()._error = error;
                        joinedModel._getModel()._error = error;
                    }
                }
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
                    self._getModel()._error = error;
                    joinedModel._getModel()._error = error;
                    reject(error);
                }
            }

            self._getModel()._foreignIndexesToCreate++;
            joinedModel._getModel()._foreignIndexesToCreate++;

            query.run().then(successCb).error(errorCb)
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
                    newError.message = "The results could not be converted to instances of `"+self.getName()+"`\nDetailed error: "+error.message
                
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
                    reject(new Error("Cannot build a new instance of `"+self.getName()+"` with `null`."))
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


