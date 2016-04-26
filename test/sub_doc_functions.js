var config = require(__dirname+'/../config.js');

var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var type = thinky.type;

var util = require(__dirname+'/util.js');
var assert = require('assert');
var Promise = require('bluebird');
var Errors = thinky.Errors;


var modelNameSet = {};
modelNameSet[util.s8()] = true;
modelNameSet[util.s8()] = true;

var modelNames = Object.keys(modelNameSet);

var cleanTables = function(done) {
  var promises = [];
  var name;
  for(var name in modelNameSet) {
    promises.push(r.table(name).delete().run());
  }
  Promise.settle(promises).error(function () {/*ignore*/}).finally(function() {
    // Add the links table
    for(var model in thinky.models) {
      modelNameSet[model] = true;
    }
    modelNames = Object.keys(modelNameSet);
    thinky._clean();
    done();
  });
}



describe('Sub Document Functions', function(){

  afterEach(cleanTables);

  var basicModelOneSpec = {
    id: String,
    name: String,
    email: type.string(),
    address: {
      street: String,
      geoCode: function() {
        return this.street;
      }
    },
    topLevelFunc: function() {
      return "topLevel";
    }
  }
  var basicModelOne = null;

  it('can create a basic model', function(done){
    var testModelOne = thinky.createModel("TestModelOne", basicModelOneSpec);
    assert.equal(type.isObject(testModelOne._schema._schema.address), true);
    assert.equal(typeof testModelOne._schema._schema.address._methods, 'object');
    assert.equal(Object.keys(testModelOne._schema._schema.address._methods).length, 1);
    assert.equal(testModelOne._schema._schema.address._methods.geoCode, basicModelOneSpec.address.geoCode);
    basicModelOne = testModelOne;
    done();
  });

  var basicModelTwoSpec = {
    id: String,
    name: String,
    email: type.string(),
    addresses: [{
      street: String,
      geoCode: function() {
        return this.street;
      }
    }]
  }
  var basicModelTwo = null;

  it('can create a basic model with object array', function(done){
    var testModelTwo = thinky.createModel("TestModelTwo", basicModelTwoSpec);
    assert.equal(type.isArray(testModelTwo._schema._schema.addresses), true);
    assert.equal(typeof testModelTwo._schema._schema.addresses._schema._methods, 'object');
    assert.equal(Object.keys(testModelTwo._schema._schema.addresses._schema._methods).length, 1);
    assert.equal(testModelTwo._schema._schema.addresses._schema._methods.geoCode, basicModelTwoSpec.addresses[0].geoCode);
    basicModelTwo = testModelTwo;
    done();
  });

  it('can instantiate basic objects correctly', function(done){
    var one =  new basicModelOne({
      id: 'db15e340-1ebf-4c24-871b-c383330cef7f',
      name: 'Tester',
      email: 'tester@test.com',
      address: {
        street: "123 Fake Street"
      }
    });
    assert.equal(typeof one.address, 'object');
    assert.equal(one.topLevelFunc(), 'topLevel');
    assert.equal(one.address.geoCode(), "123 Fake Street");
    var two =  new basicModelTwo({
      id: '7777b2c1-26ac-45e0-a0f2-f11e613265b9',
      name: 'Tester2',
      email: 'tester2@test.com',
      addresses: [{
        street: "456 Fake Street"
      }]
    });
    assert.equal(Array.isArray(two.addresses), true);
    assert.equal(two.addresses.length, 1);
    assert.equal(two.addresses[0].geoCode(), "456 Fake Street");
    done();
  });

  var basicModelThreeSpec = {
    id: String,
    name: String,
    email: type.string(),
    address: {
      street: String,
      geoCode: function() {
        return this.street;
      },
      zipCode: {
        num: Number,
        lookup: function() {
          return "North Pole";
        },
        source: {
          name: String,
          rep: function() {
            return 24;
          }
        }
      }
    }
  }
  var basicModelThree = null;

  it('can build nested object models', function(done){
    var testModelThree = thinky.createModel("TestModelThree", basicModelThreeSpec);
    basicModelThree = testModelThree;
    done();
  });

  it('can create nested object models', function(done){
    var three = new basicModelThree({
      id: 'e9c8111e-a09a-4268-b25e-e42583113058',
      name: 'Tester3',
      email: 'tester3@test.com',
      address: {
        street: "123 Fake Street",
        zipCode: {
          num: 4000,
          source: {
            name: "Test Source"
          }
        }
      }
    });
    assert.equal(three.address.zipCode.lookup(), "North Pole");
    assert.equal(three.address.zipCode.source.rep(), 24);
    three.save().then(function(result) {
      assert.equal(three.isSaved(), true);
      basicModelThree.get(three.id).then(function(dbResult) {
        assert.equal(dbResult.address.zipCode.lookup(), "North Pole");
        assert.equal(dbResult.address.zipCode.source.rep(), 24);
        done();
      }).error(done);
    }).error(done);
  });

});