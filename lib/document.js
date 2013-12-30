var eventEmitter = require('events').EventEmitter;
var r = require('rethinkdb');

function Document(modelProto, settings) {
    var self = this;
    //this.__proto__.__proto__ = modelProto;
    this.model = modelProto;
    settings = settings || {};
    this.docSettings = {
        saved: settings.saved || false
    }

    for(key in eventEmitter.prototype) {
        this[key] = eventEmitter.prototype[key].bind(self);
    }
    for(key in modelProto) {
        if (this[key] == null) {
            this[key] = modelProto[key];
        }
    }


    // TODO  call listeners()
    var listeners = modelProto._listeners;

    for(var eventKey in listeners){
        for(var i=0; i< listeners[eventKey].length; i++) {
            if (typeof listeners[eventKey][i] === 'function') {
                this.addListener(eventKey, listeners[eventKey][i]);
            }
            else if (listeners[eventKey][i].once === true) {
                this.once(eventKey, listeners[eventKey][i].listener);
            }
        }
    }
}

Document.prototype.getDocument = function() {
    return this.__proto__;
}
Document.prototype.getModel = function() {
    return this.__proto__.model;
}

Document.prototype.getDocSettings = function() {
    return this.docSettings;
}

Document.prototype.definePrivate = function(name, fn) {
    this.__proto__[name] = fn;
}

// In place update
Document.prototype.merge = function(newDoc, replace) {
    replace = replace || false;

    var docCopy = {}; // Contains the checked newDoc
    if (replace === true) {
        this.createBasedOnSchema(docCopy, newDoc, newDoc, this.getModel().settings.enforce);
    }
    else {
        newFullDoc = {}
        for (var key in this) {
            if ((this.hasOwnProperty(key)) && (this.getModel().joins[key] == null)) {
                newFullDoc[key] = this[key];
            }
        }
        for (var key in newDoc) {
            if (newDoc.hasOwnProperty(key)) {
                newFullDoc[key] = newDoc[key];
            }
        }
        this.createBasedOnSchema(docCopy, newFullDoc, newFullDoc, this.getModel().settings.enforce);
    }

    var model = this.getModel();
    var oldDoc = {}
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            oldDoc[key] = this[key];
            if (model.joins[key] == null) {
                delete this[key];
            }
        }
    }

    for (var key in docCopy) {
        if (docCopy.hasOwnProperty(key)) {
            this[key] = docCopy[key];
        }
    }
    this.emit('change', this, oldDoc);
    return this;
}

Document.createCallback = function(args) {
    var doc = args.doc; // Document on which .save was called 
    var callback = args.callback; // callback
    var count = args.count; // When we save join, we need to know when we are done
    var parentDoc = args.parentDoc; // Parent doc to update (in case of join)
    var join = args.join; // join data
    var nextStep = args.nextStep;
    
    // Define some variables for convenience
    if (join == null) {
        var joinClause = null;
        var joinType = null;
    }
    else {
        var joinClause = join.joinClause;
        var joinType = join.type;
    }

    var fn = function(error, result) {
        if (error) {
            if ((callback) && (typeof callback === 'function')) callback(error, null);;
            //TODO Uncomment this emit? or remove it?
            //doc.emit('error', error);
        }
        else if ((result) && (result.errors > 0)) {
            if ((callback) && (typeof callback === 'function')) callback(result, null);
            //TODO Uncomment this emit? or remove it?
            //doc.emit('error', result);
        }
        else {
            if ((result != null) && (result.new_val != null)) {
                doc.merge(result.new_val);
            }
            doc.getDocSettings().saved = true;

            // Update the parent 
            if ((parentDoc != null) && (joinClause != null)) {
                if (joinType === 'hasOne') {
                    parentDoc[joinClause.leftKey] = result.new_val[joinClause.rightKey]
                }
                /*
                else if (joinType === 'hasMany') {
                    if (parentDoc[joinClause.leftKey] == null) {
                        parentDoc[joinClause.leftKey] = [];
                    }
                    parentDoc[joinClause.leftKey].push(result.new_val[joinClause.rightKey])
                }
                */
            }
            count.saved++;
            if (count.saved === count.toSave) {
                if (nextStep === 'saveMain') {
                    parentDoc.save( {saveHasOne: false, saveMain: true, saveHasMany: true}, callback);
                }
                else if (nextStep === 'saveHasMany') {
                    // Update all children
                    var model = doc.getModel();
                    for(var key in model.joins) {
                        if (model.joins[key].type === 'hasMany') {
                            for(var i =0; i<parentDoc[key].length; i++) {
                                count.toSave++;
                                parentDoc[key][i][model.joins[key].joinClause.rightKey] = parentDoc[model.joins[key].joinClause.leftKey]
                            }
                        }
                    }
                    parentDoc.save( {saveHasOne: false, saveMain: false, saveHasMany: true}, callback);
                }
                else if (nextStep === 'saveParent') {
                    // Need to emit other events...
                    if (result != null) {
                        doc.emit('save', doc, result.old_val);
                    }
                    if ((callback) && (typeof callback === 'function')) callback(null, parentDoc);

                }
            }
        }
    }
    // It make things more conveninet to bind a boolean to the function
    // than passing a boolean between calls
    fn.__wrapped = true;

    return fn
}


Document.createCallbackDelete = function(args) {
    var doc = args.doc;
    var callback = args.callback;
    var count = args.count;

    // TODO: This check is not needed anymore... Let's just test it and remove it
    if ((typeof callback === 'function') && (callback.__wrapped === true)) {
        return callback
    }


    //TODO remove originalCopyDoc
    //TODO Clean all the dead code...
    var docSettings = doc.getDocSettings();
    var fn = function(error, result) {
        if (error) {
            if ((callback) && (typeof callback === 'function')) callback(error, null);;
        }
        else if ((result) && (result.errors > 0)) {
            if ((callback) && (typeof callback === 'function')) callback(result, null);
        }
        else {
            count.deleted++;
            doc.getDocSettings().saved = false;

            if (count.deleted === count.toDelete) {
                // Need to emit other events...
                doc.emit('delete', doc);

                if ((callback) && (typeof callback === 'function')) callback(null, count.deleted);
            }
        }
    }
    fn.__wrapped = true;
    return fn
}

Document.prototype.save =  function(options, callback) {
    // save(callback) is a valid signature
    if ((typeof options === 'function') && (callback == null)) {
        callback = options;
        options = null;
    }

    if (options == null) {
        options = {
            saveJoin: false
        }
    }
    else if (options.saveJoin == null) {
        options.saveJoin = false
    }

    if (options.saveHasOne == null) {
        options.saveHasOne = options.saveJoin
    }
    if (options.saveMain == null) {
        options.saveMain = true
    }
    if (options.saveHasMany == null) {
        options.saveHasMany = options.saveJoin
    }

    var savedDocs = options.savedDocs || [];
    savedDocs.push(this);

    var self = this; // The document
    var model = this.getModel();

    var query, cb;
    var copyDoc = {}; // The document without the joins fields

    var count = {
        toSave: 0,
        saved: 0
    }
    // We just save the hasOne docs
    if (options.saveHasOne === true) {
        for(var key in self) {
            if (self.hasOwnProperty(key) === true) {
                if ((!model.joins.hasOwnProperty(key)) || (model.joins[key] == null)) {
                    copyDoc[key] = self[key];
                }
                else if (model.joins.hasOwnProperty(key) === true) {
                    if ((model.joins[key].type === 'hasOne') && (typeof self[key] === 'object') && (self[key] != null)) {
                        var saved = false;
                        for(var i=0; i<savedDocs.length; i++) {
                            if (savedDocs[i] === self[key]) {
                                saved = true;
                                break;
                            }
                        }
                        if (saved === false) {
                            count.toSave++;
                            if (typeof model.joins[key].joinClause === 'object') {
                                cb = Document.createCallback({
                                    doc: self[key],
                                    callback: callback,
                                    count: count,
                                    parentDoc: self,
                                    join: model.joins[key],
                                    nextStep: 'saveMain'
                                })
                            }
                            else {
                                //TODO Implement join with lambda functions
                            }
                            self[key].save({saveJoin: true, savedDocs: savedDocs}, cb);
                        }
                    }
                }
            }
        }
    }
    else {
        for(key in self) {
            if (self.hasOwnProperty(key)) {
                if (model.joins[key] == null) {
                    copyDoc[key] = self[key];
                }
            }
        }
    }
    
    // If no sub document to save, we directly save things
    // TODO Use a flag... count.toSave is not safe...
    if ((options.saveMain === true) && (count.toSave === 0)) {
        count.toSave++;

        if (self.getDocSettings().saved === true) {
            //TODO Remove the r.expr() in insert when circular references will be fixed
            query = r.db(model.thinkyOptions.db).table(model.name)
                .get(self[model.getPrimaryKey()])
                .update(r.expr(copyDoc), {returnVals: true})
        }
        else {
            //TODO Remove the r.expr() in insert when circular references will be fixed
            query = r.db(model.thinkyOptions.db).table(model.name)
                    .insert(r.expr(copyDoc), {returnVals: true})
        }

        // We have to wrap the callback if the callback has not been wrapped before.
        if ((typeof callback === 'function') && (callback.__wrapped === true)) {
            cb = callback
        }
        else {
            if (options.saveHasMany === true) {
                cb = Document.createCallback({
                    doc: self,
                    callback: callback,
                    count: count,
                    parentDoc: self,
                    join: model.joins[key],
                    nextStep: 'saveHasMany'
                })
            }
            else {
                cb = Document.createCallback({
                    doc: self,
                    callback: callback,
                    count: count,
                    parentDoc: self,
                    join: model.joins[key],
                    nextStep: 'saveParent'
                })
            }
        }
        this._execute.call(self, query, cb);
    }
    else if (options.saveHasMany === true) {
        for(var key in self) {
            //TODO mere the conditions
            if (self.hasOwnProperty(key) === true) {
                if ((model.joins.hasOwnProperty(key) === true) && (model.joins[key].type === 'hasMany')) {
                    if (Object.prototype.toString.call(self[key]) === '[object Array]') {
                        for(var i= 0; i<self[key].length; i++) {
                            var saved = false;
                            for(var j=0; j<savedDocs.length; j++) {
                                if (savedDocs[j] === self[key][i]) {
                                    saved = true;
                                }
                            }
                            if (saved === false) {
                                count.toSave++;
                                if (typeof model.joins[key].joinClause === 'object') {
                                    cb = Document.createCallback({
                                        doc: self[key][i],
                                        callback: callback,
                                        count: count,
                                        nextStep: 'saveParent',
                                        parentDoc: self
                                    })
                                }
                                else {
                                    //TODO Implement join with lambda functions
                                }
                                self[key][i].save({saveHasOne: true, saveMain: true, saveHasMany: true, savedDocs: savedDocs}, cb);
                            }
                        }
                    }
                }
                else if (model.joins.hasOwnProperty(key) === true) {
                    if ((model.joins[key].type === 'hasOne') && (typeof self[key] === 'object') && (self[key] != null)) {
                        var otherModel = self[key].getModel()
                        for(var otherKey in self[key]) {
                            if (self[key][otherKey] === self) {
                                if ((self[key][otherModel.joins[key].joinClause.leftKey] != self[otherModel.joins[key].joinClause.rightKey]) && (self[otherModel.joins[key].joinClause.rightKey] != null)) {
                                    // There is a mismatch between joinKeys, that can happen if a document is linked with another document of the same model in two ways
                                    self[key][otherModel.joins[key].joinClause.leftKey] = self[otherModel.joins[key].joinClause.rightKey];

                                    count.toSave++;
                                    if (typeof model.joins[key].joinClause === 'object') {
                                        cb = Document.createCallback({
                                            doc: self[key],
                                            callback: callback,
                                            count: count,
                                            nextStep: 'saveParent',
                                            parentDoc: self
                                        })
                                    }
                                    self[key].save({saveHasOne: false, saveMain: true, saveHasMany: false, savedDocs: savedDocs}, cb);
                                }
                                break;
                            }
                        }
                        // if joined doc hasOne relation with self and leftKey is undefined, fire an update
                    }
                }
            }
        }
        if (count.toSave === 0) {
            callback();
            //TODO just call the callback
        }
    }



    return this;
};

Document.prototype.delete = function(options, callback, count) {
    // save(callback) is a valid signature
    if ((typeof options === 'function') && (callback == null)) {
        callback = options;
        options = null;
    }

    if ((options == null) || (options.deleteJoin == null)) {
        options = {
            deleteJoin: false
        }
    }

    var self = this; // The document
    var model = this.getModel();

    var docSettings = self.getDocSettings();
    var query, cb, countUndefined = false;
    if (count == null) {
        countUndefined = true
        count = {
            toDelete: 0,
            deleted: 0
        }
    }

    if (options.deleteJoin === true) {
        for(var key in self) {
            if (self.hasOwnProperty(key) === true) {
                if (model.joins.hasOwnProperty(key) === true) {
                    //TODO test jointype and throw if it doesn't match
                    if (Object.prototype.toString.call(self[key]) === '[object Array]') {
                        if (model.joins[key] === 'hasOne') {
                            //TODO write a test about that
                            throw 'Unexpected type for a join'
                        }

                        for(var i= 0; i<self[key].length; i++) {
                            self[key][i].delete({deleteJoin: true}, callback, count);
                        }
                    }
                    else if ((typeof self[key] === 'object') && (self[key] != null)) {
                        if (model.joins[key] === 'hasMany') {
                            //TODO write a test about that
                            throw 'Unexpected type for a join'
                        }

                        self[key].delete({deleteJoin: true}, callback, count);
                    }
                }
            }
        }
    }

    cb = Document.createCallbackDelete({
        doc: self,
        callback: callback,
        count: count
    })

    //TODO Move before?
    count.toDelete++;

    if (docSettings.saved === true) {
        query = r.db(model.thinkyOptions.db).table(model.name)
            .get(self[model.getPrimaryKey()])
            .delete()

        this._execute.call(self, query, cb);
    }
    else {
        //TODO write a test for that
        cb(null, {errors: 0})
    }

    return this;

}

Document.prototype.update = function(callback ) {
    this.getDocSettings().saved = true;
    this.save(callback);
};

Document.prototype.off = function(eventKey, listener) {
    if (arguments.length <= 1) {
        this.removeAllListeners(eventKey);
    }
    else {
        this.removeListener(eventKey, listener);
    }
}

var document = module.exports = exports = Document;
