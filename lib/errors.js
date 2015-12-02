/**
 * DocumentNotFound error which is returned when `get` returns `null`.
 * "Extends" Error
 */
function DocumentNotFound(message) {
  Error.captureStackTrace(this, DocumentNotFound);
  this.message = message || "The query did not find a document and returned null.";
};
DocumentNotFound.prototype = Object.create(Error.prototype);
DocumentNotFound.prototype.constructor = DocumentNotFound;
DocumentNotFound.prototype.name = "Document not found";
var DocumentNotFoundRegex = new RegExp('^The query did not find a document and returned null.');
module.exports.DocumentNotFoundRegex = DocumentNotFoundRegex;
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
InvalidWrite.prototype = Object.create(Error.prototype);
InvalidWrite.prototype.constructor = InvalidWrite;
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
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;
ValidationError.prototype.name = "Document failed validation";
module.exports.ValidationError = ValidationError;


/**
 * DuplicatePrimaryKey error which is returned when the primary key unique constraint of a document fails.
 * "Extends" Error
 */
function DuplicatePrimaryKey(message) {
    Error.captureStackTrace(this, DuplicatePrimaryKey);
    this.message = message;
};
DuplicatePrimaryKey.prototype = new Error();
DuplicatePrimaryKey.prototype.name = "Duplicate primary key";
var DuplicatePrimaryKeyRegex = new RegExp('^' + DuplicatePrimaryKey.prototype.name);
module.exports.DuplicatePrimaryKeyRegex = DuplicatePrimaryKeyRegex;
module.exports.DuplicatePrimaryKey = DuplicatePrimaryKey;


module.exports.create = function (error) {
  if(!(error instanceof Error)) {
    return error;
  }

  if(error.message.match(DocumentNotFoundRegex)) {
    return new DocumentNotFound(error.message);
  }

  if(error.message.match(DuplicatePrimaryKeyRegex)) {
    return new DuplicatePrimaryKey(error.message);
  }

  return error;
};