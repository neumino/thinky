var Promise = require('bluebird');

var p = new Promise(function(resolve, reject) {
    (function() {
        var p = new Promise(function(resolve1, reject) {
            reject(new Error("Catch me"));
        });
        p.then(resolve).error(function(err) {
            console.log(err);
            reject(err);
        });
    })();

}).then(function() {
    console.log("Was expecting an error")
}).error(function(err) {
    console.log(err);
    console.log("Done")
});
