function Document(modelProto) {
    this.__proto__.__proto__ = modelProto
}
Document.prototype.getDocument = function() {
    return this.__proto__;
}
Document.prototype.define = function(name, fn) {
    this.__proto__[name] = fn;
}


var document = module.exports = exports = Document;
