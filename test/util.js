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

