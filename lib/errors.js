function DocumentNotFound(message) {
    Error.captureStackTrace(this, DocumentNotFound);
    this.message = message || "The query did not find a document and returned null.";
};
DocumentNotFound.prototype = new Error();
DocumentNotFound.prototype.name = "Document not found";

function InvalidWrite(message, raw) {
    Error.captureStackTrace(this, InvalidWrite);
    this.message = message;
    this.raw = raw;
};
InvalidWrite.prototype = new Error();
InvalidWrite.prototype.name = "Invalid write";

module.exports.DocumentNotFound = DocumentNotFound;
module.exports.InvalidWrite = InvalidWrite;
