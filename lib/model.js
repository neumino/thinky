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

    //util.validateSchema(schema)
    this._schema = schema;

    // We want a deep copy
    options = options || {};
    this._options = {};
    this._options.enforce_missing = (typeof options.enforce_missing != null) ? options.enforce_missing : thinky._options.enforce_missing;
    this._options.enforce_extra = (typeof options.enforce_extra != null) ? options.enforce_extra : thinky._options.enforce_extra;
    this._options.enforce_type = (typeof options.enforce_type != null) ? options.enforce_type : thinky._options.enforce_type;
    this._options.timeFormat = (typeof options.timeFormat != null) ? options.timeFormat : thinky._options.timeFormat;
    this._options.validate = (typeof options.validate != null) ? options.validate : thinky._options.validate;

    this._pk = (options.pk != null) ? options.pk : 'id';

    this._thinky = thinky;

    this._tableCreated = false;
    this._tableReady = false;
    this._indexesToCreate = 0; // does not always match this._onTableCreated.length because of the hasAndBelongsToMany relation
    this._onTableCreated = []; // query, resolve, reject)
    this._foreignIndexesToCreate = 0; // many to many indexes left to create

    this._error = null; // If an error occured, we won't let people save things

    this._listeners = [];
    this._joins = {};
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

        return doc;
    }

    model.__proto__ = proto;
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
    if (self._onTableCreated.length > 0) {
        // Create indexes, 
        // self._getModel()._indexesToCreate += self._onTableCreated.length
        for(var i = 0; i<self._indexesToCreate; i++) {
            if (i < self._onTableCreated.length) {
                self._onTableCreated[i].query.run().then(self._onTableCreated[i].resolve).error(self._onTableCreated[i].reject);
            }
        }
    }
    else {
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
 * Return the options of the model
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
 */
Model.prototype.hasOne = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `hasOne` must be a Model")
    }
    if (fieldDoc in self._getModel()._joins) {
        throw new Error("The field `"+fieldDoc+"` is already used by another relation.");
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
                joinedModel._getModel()._error = error;
                self._getModel()._error = error;
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
                    joinedModel._getModel()._error = error;
                    self._getModel()._error = error;
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

    self._getModel()._joins[fieldDoc] = {
        model: joinedModel,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'belongsTo'
    }

    joinedModel._getModel()._reverseJoins[self.getName()] = {
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

        //TODO Refactor
        if (self._getModel()._tableCreated === true) {
            r.table(tableName).indexList().contains(leftKey).do(function(result) {
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
            }).run().then(function(result) {
                self._indexWasCreated('local');
                joinedModel._indexWasCreated('foreign');
            }).error(function(error) {
                self._getModel()._error = error;
            })
        }
        else {
            self._getModel()._onTableCreated.push({
                query: r.table(tableName).indexList().contains(leftKey).do(function(result) {
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
                }),
                resolve: function() {
                    self._indexWasCreated('local');
                    joinedModel._indexWasCreated('foreign');
                },
                reject: function(error) {
                    self._getModel()._error = error;
                    joinedModel._getModel()._error = error;
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
                joinedModel._getModel()._error = error;
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
                    joinedModel._getModel()._error = error;
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
                return r.branch(
                    r.table(link).indexList().contains(self.getName()+'_'+leftKey),
                    r.table(link).indexWait(self.getName()+'_'+leftKey),
                    r.table(link).indexCreate(self.getName()+'_'+leftKey).do(function() {
                        return r.table(link).indexWait(self.getName()+'_'+leftKey)
                    })
                )
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
                self._getModel()._error = error;
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
                    self._getModel()._error = error;
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
                joinedModel._getModel()._error = error;
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
                    joinedModel._getModel()._error = error;
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
                self._getModel()._error = error;
                joinedModel._getModel()._error = error;
                reject(error);
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

Model.prototype.run = function() {
    var query = new Query(this);
    return query.run();
}
Model.prototype.execute = function() {
    var query = new Query(this);
    return query.execute();
}



Model.prototype._parse = function(data, makeDocument) {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        if (data.__proto__.next !== undefined) { // Checking if a cursor
            data.toArray().then(function(result) {
                if (makeDocument === false) {
                    resolve(result);
                }
                else {
                    try{
                        for(var i=0; i<result.length; i++) {
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
                }
            }).error(reject)
        }
        else {
            if (makeDocument === false) {
                resolve(data)
            }
            else {
                try{
                    data = new self(data)
                    data.validate();
                    data._setSaved(true);
                    resolve(data)
                }
                catch(error) {
                    reject(error);
                }
            }
        }
    })
    return p;
}


module.exports = Model;


