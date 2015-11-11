/**
 * DocumentNotFound error which is returned when `get` returns `null`.
 * "Extends" Error
 */
function DocumentNotFound(message) {
  Error.captureStackTrace(this, DocumentNotFound);
  this.message = message || "The query did not find a document and returned null.";
};
DocumentNotFound.prototype = new Error();
DocumentNotFound.prototype.name = "The query did not find a document";
var DocumentNotFoundRegex = new RegExp('^' + DocumentNotFound.prototype.name);
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
InvalidWrite.prototype = new Error();
InvalidWrite.prototype.name = "Invalid write";
var InvalidWriteRegex = new RegExp('^' + InvalidWrite.prototype.name);
module.exports.InvalidWriteRegex = InvalidWriteRegex;
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
var ValidationErrorRegex = new RegExp('^' + ValidationError.prototype.name);
module.exports.ValidationErrorRegex = ValidationErrorRegex;
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


module.exports.create = function (message) {
  if(message.match(DocumentNotFoundRegex)) {
    return new DocumentNotFound(message);
  }

  if(message.match(InvalidWriteRegex)) {
    return new InvalidWrite(message);
  }

  if(message.match(ValidationErrorRegex)) {
    return new ValidationError(message);
  }


  if(message.match(DuplicatePrimaryKeyRegex)) {
    return new DuplicatePrimaryKey(message);
  }

  return new Error(message);
};