/**
 * DocumentNotFound error which is returned when `get` returns `null`.
 * "Extends" Error
 */
function DocumentNotFound(message) {
  Error.captureStackTrace(this, DocumentNotFound);
  this.message = message || "The query did not find a document and returned null.";
};
DocumentNotFound.prototype = new Error();
DocumentNotFound.prototype.name = "Document not found";
module.exports.DocumentNotFound = DocumentNotFound;


/**
 * InvalidWrite error which is returned when an inplace update/replace return
 * anon valid document.
 * "Extends" Error
 */
function InvalidWrite(message, raw) {
  Error.captureStackTrace(this, InvalidWrite);
  this.message = message;
  this.raw = raw;
};
InvalidWrite.prototype = new Error();
InvalidWrite.prototype.name = "Invalid write";
module.exports.InvalidWrite = InvalidWrite;


/**
 * ValidationError error which is returned when validation of a document fails.
 * "Extends" Error
 */
function ValidationError(message) {
    Error.captureStackTrace(this, ValidationError);
    this.message = message;
};
ValidationError.prototype = new Error();
ValidationError.prototype.name = "Document failed validation";
module.exports.ValidationError = ValidationError;
