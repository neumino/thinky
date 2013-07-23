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


    var listeners = modelProto._listeners;
    for(var eventKey in listeners){
        for(var i in listeners[eventKey]) {
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
            if (this.hasOwnProperty(key)) {
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

Document.createCallback = function(doc, callback, count, originalDoc, originalCopyDoc,
        joinClause, joinType, saveJoin) {
    var arg = arguments;
    var docSettings = doc.getDocSettings();
    fn = function(error, result) {
        if (error) {
            if ((callback) && (typeof callback === 'function')) callback(error, null);;
        }
        else if ((result) && (result.errors > 0)) {
            if ((callback) && (typeof callback === 'function')) callback(result, null);
        }
        else {
            doc.merge(result.new_val);
            if (docSettings.saved !== true) {
                doc.getDocSettings().saved = true;

                // Update the parent 
                if ((originalDoc != null) && (joinClause != null)) {
                    if (joinType === 'hasOne') {
                        originalDoc[joinClause.leftKey] = result.new_val[joinClause.rightKey]
                    }
                    else if (joinType === 'hasMany') {
                        if (originalDoc[joinClause.leftKey] == null) {
                            originalDoc[joinClause.leftKey] = [];
                        }
                        originalDoc[joinClause.leftKey].push(result.new_val[joinClause.rightKey])
                    }
                }
            }
            count.saved++;
            if (count.saved === count.toSave) {
                // All sub document have been saved
                // Let's save the parent
                if ((originalDoc != null) && (joinClause != null) && (originalDoc !== doc)) {
                    originalDoc.save( {saveJoin: false}, callback);
                }
                else {
                    if ((callback) && (typeof callback === 'function')) callback(null, doc);

                    // Need to emit other events...
                    doc.emit('save', doc, result.old_val);
                }
            }
        }
    }
    fn.__wrapped = true;
    return fn
}


Document.createCallbackDelete = function(doc, callback, count, originalDoc, originalCopyDoc,
        joinClause, joinType, saveJoin) {
    //TODO remove originalCopyDoc
    //TODO Clean all the dead code...
    var arg = arguments;
    var docSettings = doc.getDocSettings();
    fn = function(error, result) {
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
                // All sub document have been saved
                // Let's save the parent
                if ((originalDoc != null) && (joinClause != null) && (originalDoc !== doc)) {
                    originalDoc.delete({deleteJoin: false}, callback);
                }
                else {
                    if ((callback) && (typeof callback === 'function')) callback(null, doc);

                    // Need to emit other events...
                    doc.emit('delete', doc);
                }
            }
        }
    }
    fn.__wrapped = true;
    return fn
}

//TODO We don't need _save. Clean and merge _save and save
Document.prototype.save =  function(options, callback) {
    // save(callback) is a valid signature
    if ((typeof options === 'function') && (callback == null)) {
        callback = options;
        options = null;
    }

    if ((options == null) || (options.saveJoin == null)) {
        options = {
            saveJoin: false
        }
    }

    var self = this; // The document
    var model = this.getModel();

    var docSettings = self.getDocSettings();
    var query, cb;
    var copyDoc = {}; // The document without the joins fields

    var count = {
        toSave: 0,
        saved: 0
    }
    
    if (options.saveJoin === true) {
        for(var key in self) {
            if (self.hasOwnProperty(key) === true) {
                if ((!model.joins.hasOwnProperty(key)) || (model.joins[key] == null)) {
                    copyDoc[key] = self[key];
                }
                else if (model.joins.hasOwnProperty(key) === true) {
                    if (Object.prototype.toString.call(self[key]) === '[object Array]') {
                        for(var i= 0; i<self[key].length; i++) {
                            count.toSave++;
                            if (typeof model.joins[key].joinClause === 'object') {
                                cb = Document.createCallback(self[key][i], callback, count, self, copyDoc,
                                    model.joins[key].joinClause, 'hasMany', false)
                            }
                            else {
                                cb = Document.createCallback(self[key][i], callback, count, null, null,
                                    null, 'hasMany')
                            }
                            self[key][i].save({saveJoin: true}, cb);
                        }
                    }
                    else if ((typeof self[key] === 'object') && (self[key] != null)) {
                        count.toSave++;
                        if (typeof model.joins[key].joinClause === 'object') {
                            cb = Document.createCallback(self[key], callback, count, self, copyDoc,
                                model.joins[key].joinClause, 'hasOne', false)
                        }
                        else {
                            cb = Document.createCallback(self[key], callback, count, null, null,
                                null, 'hasOne')
                        }
                        self[key].save({saveJoin: true}, cb);
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
    if (count.toSave === 0) {
        count.toSave++;
        if (docSettings.saved === true) {
            query = r.db(model.thinkyOptions.db).table(model.name)
                .get(self[model.getPrimaryKey()])
                .update(r.expr(copyDoc), {returnVals: true})
        }
        else {
            query = r.db(model.thinkyOptions.db).table(model.name)
                    .insert(r.expr(copyDoc), {returnVals: true})
        }

        // We have to wrap the callback if the callback has not been wrapped before.
        if (callback == null) {
            cb = Document.createCallback(self, callback, count)
        }
        else if (callback.__wrapped === true) {
            cb = callback
        }
        else {
            cb = Document.createCallback(self, callback, count)
        }
        this._execute.call(self, query, cb);
    }

    return this;
};

Document.prototype.delete = function(options, callback) {
    var self = this; // The document
    var model = this.getModel();

    if ((options == null) || (options.deleteJoin == null)) {
        options = {
            deleteJoin: false
        }
    }
    
    var docSettings = self.getDocSettings();
    var query, cb;

    var count = {
        toDelete: 0,
        deleted: 0
    }
    
    if (options.deleteJoin === true) {
        for(var key in self) {
            if (self.hasOwnProperty(key) === true) {
                if (model.joins.hasOwnProperty(key) === true) {
                    if (Object.prototype.toString.call(self[key]) === '[object Array]') {
                        for(var i= 0; i<self[key].length; i++) {
                            count.toDelete++;
                            if (typeof model.joins[key].joinClause === 'object') {
                                cb = Document.createCallbackDelete(self[key][i], callback, count, self, null,
                                    model.joins[key].joinClause, 'hasMany', false)
                            }
                            else {
                                cb = Document.createCallbackDelete(self[key][i], callback, count, null, null,
                                    null, 'hasMany')
                            }
                            self[key][i].delete({deleteJoin: true}, cb);
                        }
                    }
                    else if ((typeof self[key] === 'object') && (self[key] != null)) {
                        count.toDelete++;
                        if (typeof model.joins[key].joinClause === 'object') {
                            cb = Document.createCallbackDelete(self[key], callback, count, self, null,
                                model.joins[key].joinClause, 'hasOne', false)
                        }
                        else {
                            cb = Document.createCallbackDelete(self[key], callback, count, null, null,
                                null, 'hasOne')
                        }
                        self[key].delete({deleteJoin: true}, cb);
                    }
                }
            }
        }
    }
    
    // If no sub document to save, we directly save things
    if (count.toDelete === 0) {
        if (docSettings.saved === true) {
            count.toDelete++;
            query = r.db(model.thinkyOptions.db).table(model.name)
                .get(self[model.getPrimaryKey()])
                .delete()

            // we have to wrap the callback if the callback has not been wrapped before.
            if (callback == null) {
                cb = Document.createCallbackDelete(self, callback, count)
            }
            else if (callback.__wrapped === true) {
                cb = callback
            }
            else {
                cb = Document.createCallbackDelete(self, callback, count)
            }
            this._execute.call(self, query, cb);
        }
        else {
            // we have to wrap the callback if the callback has not been wrapped before.
            if (callback == null) {
                cb = Document.createCallbackDelete(self, callback, count)
            }
            else if (callback.__wrapped === true) {
                cb = callback
            }
            else {
                cb = Document.createCallbackDelete(self, callback, count)
            }
            cb(null, {deleted: 1})
        }
    }

    return this;

}

Document.prototype.off = function(eventKey, listener) {
    if (arguments.length <= 1) {
        this.removeAllListeners(eventKey);
    }
    else {
        this.removeListener(eventKey, listener);
    }
}


var document = module.exports = exports = Document;
