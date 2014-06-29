function DocumentNotFound() {
    Error.captureStackTrace(this, DocumentNotFound);
    this.message = "The query did not find a document and returned null.";
};
DocumentNotFound.prototype = new Error();
DocumentNotFound.prototype.name = "Document not found";

module.exports.DocumentNotFound = DocumentNotFound;
