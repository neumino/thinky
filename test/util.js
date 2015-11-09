function s4() {
  return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
};
module.exports.s4 = s4;

function s8() {
  return s4()+s4();
};
module.exports.s8 = s8;

function uuid() {
  return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
}
module.exports.uuid = uuid;

function random() {
  return Math.floor(Math.random()*10000);
}
module.exports.random = random;

function bool() {
  return Math.random() > 0.5
}
module.exports.bool = bool;


function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
module.exports.isPlainObject = isPlainObject;

function sortById(ar) {
  return ar.sort(function(a, b) {
    if (a.id<b.id) {
      return -1;
    }
    else if (a.id>b.id) {
      return 1;
    }
    else {
      return 0;
    }
  })
}
module.exports.sortById = sortById;

function deepCopy(value) {
  var result;
  if (isPlainObject(value) === true) {
    result = {};
    for(var key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = deepCopy(value[key]);
      }
    }
    return result;
  }
  else if (Array.isArray(value)) {
    result = []
    for(var i=0; i<value.length; i++) {
      result.push(deepCopy(value[i]));
    }
    return result;
  }
  else {
    return value;
  }
}
module.exports.deepCopy = deepCopy;

function log(value) {
  console.log(JSON.stringify(value, null, 2));
}
module.exports.log = log;

// pseudo computational chain helper
function passThru (fn) {
  return fn();
}
module.exports.passThru = passThru;