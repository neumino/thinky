var eventEmitter = require('events').EventEmitter;
var r = require('rethinkdb');

/*
 * Constructor for Document
 */
function Document(modelProto, settings) {
    var self = this;
    //this.__proto__.__proto__ = modelProto;
    this.model = modelProto;
    settings = settings || {};
    this.docSettings = {
        saved: settings.saved || false
    }

    for(key in eventEmitter.prototype) {
        var fn = eventEmitter.prototype[key];
        if (typeof fn === 'function') this[key] = fn.bind(self);
    }
    for(key in modelProto) {
        if (this[key] == null) {
            this[key] = modelProto[key];
        }
    }

    var listeners = modelProto._listeners;
    for(var eventKey in listeners){
        for(var i=0; i<listeners[eventKey].length; i++) {
            if (typeof listeners[eventKey][i] === 'function') {
                this.addListener(eventKey, listeners[eventKey][i]);
            }
            else if (listeners[eventKey][i].once === true) {
                this.once(eventKey, listeners[eventKey][i].listener);
            }
        }
    }
}

/*
 * Retrieve the document prototype
 */
Document.prototype.getDocument = function() {
    return this.__proto__;
}

/*
 * Retrieve the model
 */
Document.prototype.getModel = function() {
    return this.__proto__.model;
}

/*
 * Retrieve the document settings
 */
Document.prototype.getDocSettings = function() {
    return this.docSettings;
}

/*
 * Define a private method, only for this document
 */
Document.prototype.definePrivate = function(name, fn) {
    this.__proto__[name] = fn;
}

/*
 * Merge newDoc in `this`
 * If `replace` is `false`, replace this with newDoc but keep the same reference for this.
 * If `replace` is `true`, perform a merge
 */
Document.prototype.merge = function(newDoc, replace) {
    replace = replace || false;

    var docCopy = {}; // Contains the checked newDoc
    // We need it because we call createBasedOnSchema
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

    // Fill oldDoc and clean `this` except the joined documents
    var oldDoc = {}
    for(var key in this) {
        if (this.hasOwnProperty(key)) {
            oldDoc[key] = this[key];
            if (model.joins[key] == null) {
                delete this[key];
            }
        }
    }

    // Fill this with docCopy
    for (var key in docCopy) {
        if (docCopy.hasOwnProperty(key)) {
            this[key] = docCopy[key];
        }
    }
    this.emit('change', this, oldDoc);
    return this;
}

/*
 * Create the approprite callback for save
 *
 * Argument is an object with the fields:
 *   - doc: The document on which `save` was called
 *   - callback: The callback
 *   - count: object containing
 *      - toSave: number of document to save before calling `callback`
 *      - saved: number of document saved - when count.saved === count.toSave, we can execute `callback`
 *   - parentDoc: parent of the document being saved, used in case of a `hasOne` relation
 *   - join: The join relation with `parentDoc`
 *   - nextStep: the next thing to do
 */
Document.createCallback = function(args) {
    var doc = args.doc;
    var callback = args.callback;
    var count = args.count;
    var parentDoc = args.parentDoc;
    var join = args.join;
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

    // The callback
    var fn = function(error, result) {
        if (error) {
            //TODO: Should we execute the callback just once in case of multiple errors?
            if ((callback) && (typeof callback === 'function')) callback(error, null);;
        }
        else if ((result) && (result.errors > 0)) {
            if ((callback) && (typeof callback === 'function')) callback(result, null);
        }
        else {
            // Update the fields
            if ((result != null) && (result.new_val != null)) {
                doc.merge(result.new_val);
            }
            doc.getDocSettings().saved = true; // Update the internal status of the document

            // Update the parent 
            if ((parentDoc != null) && (joinClause != null) && (joinType === 'hasOne')) {
                parentDoc[joinClause.leftKey] = result.new_val[joinClause.rightKey]
            }

            doc.emit('save', doc, result.old_val);

            count.saved++;
            if (count.saved === count.toSave) { // All documents are saved, let's go to the next step
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
                else if (nextStep === 'nothing') {
                    // We just execute the callback
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

/*
 * Create the appropriate callback for delete
 *
 * Argument is an object with the fields:
 *   - doc: The document on which `delete` was called
 *   - callback: The callback
 *   - count: object containing
 *      - toDelete: number of document to delete before calling `callback`
 *      - deleted: number of document deleted - when count.deleted === count.toDelete, we can execute `callback`
 *
 */
Document.createCallbackDelete = function(args) {
    var doc = args.doc;
    var callback = args.callback;
    var count = args.count;

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


// Check if the document was already saved by this stack
Document.prototype._wasSaved = function(savedDocs, doc) {
    for(var j=0; j<savedDocs.length; j++) {
        if (savedDocs[j] === doc) {
            return true;
        }
    }
    return false;
}

/*
 * Save the document
 * Two signatures are available:
 *   - save(callback)
 *   - save(options, callback)
 *
 * The argument options can be an object with
 *    - saveJoin: <boolean> (default false) - set to true to save joined documents
 *    - saveHasOne, saveMain, saveHasMany: internal options used to keep track of what's left to save
 *
 * This method does:
 *    - Save hasOne docs
 *    - Save the doc
 *    - Save hasMany docs and update doc if a hasOne doc linked to it
 */
Document.prototype.save =  function(options, callback) {
    // Check if the signature used is save(callback)
    if ((typeof options === 'function') && (callback == null)) {
        callback = options;
        options = null;
    }

    // Set the default options
    if (options == null) {
        options = { saveJoin: false }
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

    // Used to track circular references
    var savedDocs = options.savedDocs || [];
    savedDocs.push(this);

    var self = this; // The document
    var model = this.getModel();

    var query, cb, saved, otherModel;

    var copyDoc = {}; // The document without the joins fields

    var count = {
        toSave: 0,
        saved: 0
    }

    // We first save the documents joined with `hasOne`
    if (options.saveHasOne === true) {
        for(var key in self) {
            if (self.hasOwnProperty(key) === true) {
                if ((!model.joins.hasOwnProperty(key)) || (model.joins[key] == null)) {
                    copyDoc[key] = self[key];
                }
                else if ((model.joins.hasOwnProperty(key) === true) && ((model.joins[key].type === 'hasOne') && (Object.isPlainObject(self[key])))) {
                    if (this._wasSaved(savedDocs, self[key]) === false) {
                        count.toSave++;
                        cb = Document.createCallback({
                            doc: self[key],
                            callback: callback,
                            count: count,
                            parentDoc: self,
                            join: model.joins[key],
                            nextStep: 'saveMain'
                        })
                        self[key].save({saveJoin: true, savedDocs: savedDocs}, cb);
                    }
                }
            }
        }
    }
    else {
        // We just make a copy of the document
        for(key in self) {
            if (self.hasOwnProperty(key)) {
                if (model.joins[key] == null) {
                    copyDoc[key] = self[key];
                }
            }
        }
    }
    
    if ((options.saveMain === true) && (count.toSave === 0)) {
        // No joined documents with `hasOne` to save, we save the main one (the one on which we called `save`
        count.toSave++;

        if (self.getDocSettings().saved === true) {
            try{
                query = r.db(model.thinkyOptions.db).table(model.name)
                    .get(self[model.getPrimaryKey()])
                    .update(copyDoc, {returnVals: true})
            }
            catch(err) {
                if (err.msg === "Nesting depth limit exceeded")
                    throw new Error("Nesting depth limit exceeded\nYou probably have a circular reference somewhere, outside joined fields.");
                else
                    throw err;
            }
        }
        else {
            try{
                query = r.db(model.thinkyOptions.db).table(model.name)
                        .insert(copyDoc, {returnVals: true})
            }
            catch(err) {
                if (err.msg === "Nesting depth limit exceeded")
                    throw new Error("Nesting depth limit exceeded\nYou probably have a circular reference somewhere, outside joined fields.");
                else
                    throw err;
            }
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
                    nextStep: 'nothing'
                })
            }
        }
        this._execute.call(self, query, cb);
    }
    else if (options.saveHasMany === true) {
        // The last step, we have to save the documents joined with `hasMany`
        for(var key in self) {
            if (self.hasOwnProperty(key) === true) {
                if (((model.joins.hasOwnProperty(key) === true) && (model.joins[key].type === 'hasMany')) && (Array.isArray(self[key]))) {
                    for(var i= 0; i<self[key].length; i++) {
                        if (this._wasSaved(savedDocs, self[key][i]) === false) {
                            count.toSave++;
                            cb = Document.createCallback({
                                doc: self[key][i],
                                callback: callback,
                                count: count,
                                nextStep: 'nothing',
                                parentDoc: self
                            })
                            self[key][i].save({saveHasOne: true, saveMain: true, saveHasMany: true, savedDocs: savedDocs}, cb);
                        }
                    }
                }
                else if (model.joins.hasOwnProperty(key) === true) {
                    // Fire an update in case two documents are linked to each other both ways
                    if ((model.joins[key].type === 'hasOne') && (Object.isPlainObject(self[key]))) {
                        otherModel = self[key].getModel()
                        for(var otherKey in self[key]) {
                            if ((self[key][otherKey] === self) && ((self[key][otherModel.joins[key].joinClause.leftKey] != self[otherModel.joins[key].joinClause.rightKey]) && (self[otherModel.joins[key].joinClause.rightKey] != null))) {
                                // There is a mismatch between joinKeys, that can happen if a document is linked with another document of the same model in two ways

                                // Copy the key
                                self[key][otherModel.joins[key].joinClause.leftKey] = self[otherModel.joins[key].joinClause.rightKey];

                                count.toSave++;
                                if (typeof model.joins[key].joinClause === 'object') {
                                    cb = Document.createCallback({
                                        doc: self[key],
                                        callback: callback,
                                        count: count,
                                        nextStep: 'nothing',
                                        parentDoc: self
                                    })
                                }
                                self[key].save({saveHasOne: false, saveMain: true, saveHasMany: false, savedDocs: savedDocs}, cb);
                            }
                            break;
                        }
                    }
                }
            }
        }
        // Nothing more to save, execute callback
        if (count.toSave === 0) {
            callback();
        }
    }

    return this;
};

/*
 * Delete the document
 * Two signatures are available:
 *   - delete(callback)
 *   - delete(options, callback)
 *
 * The argument options can be an object with
 *    - deleteJoin: <boolean> (default false) - set to true to delete joined documents
 *
 */

Document.prototype.delete = function(options, callback, count) {
    // Check if the signature used is delete(callback)
    if ((typeof options === 'function') && (callback == null)) {
        callback = options;
        options = null;
    }

    // Set default options
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
                    if (Array.isArray(self[key])) {
                        if (model.joins[key] === 'hasOne') {
                            //TODO write a test about that
                            throw 'Unexpected type for a join'
                        }

                        for(var i= 0; i<self[key].length; i++) {
                            self[key][i].delete({deleteJoin: true}, callback, count);
                        }
                    }
                    else if (Object.isPlainObject(self[key])) {
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

    count.toDelete++;
    if (docSettings.saved === true) {
        query = r.db(model.thinkyOptions.db).table(model.name)
            .get(self[model.getPrimaryKey()])
            .delete()

        this._execute.call(self, query, cb);
    }
    else {
        throw new Error("The document was not saved and therefore cannot be deleted.")
    }

    return this;

}

/*
 * Force to update a document
 */
Document.prototype.update = function(callback ) {
    this.getDocSettings().saved = true;
    this.save(callback);
};

/*
 * Implement off that remove:
 *   - all listeners if no argument is provided
 *   - all listeners for an event if the event is provided
 *   - one listener if the eventKey and listener are provided
 */
Document.prototype.off = function(eventKey, listener) {
    if (arguments.length <= 1) {
        this.removeAllListeners(eventKey);
    }
    else {
        this.removeListener(eventKey, listener);
    }
}

var document = module.exports = exports = Document;
