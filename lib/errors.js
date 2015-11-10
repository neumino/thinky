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
module.exports.DuplicatePrimaryKey = DuplicatePrimaryKey;


module.exports.create = function (message) {
  for(var key in module.exports) {
    if(module.exports[key].prototype instanceof Error) {
      var regex = new RegExp('^' + new module.exports[key]().name);
      if(message.match(regex))
        return new module.exports[key](message);
    }
  }
  return new Error(message);
};