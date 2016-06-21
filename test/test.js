var assert = require('chai').assert;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var namedScopesPlugin = require('./../index');

mongoose.connect('mongodb://localhost/mongoose-named-scopes_test');

//
// UserSchema.scope('olderThan', function (age) {
//   return this.where('age').gt(age);
// });
//
// UserSchema.scope('youngerThan', function (age) {
//   return this.where('age').lt(age);
// });
//
// UserSchema.scope('twenties', function() {
//   return this.olderThan(19).youngerThan(30);
// });
//
// UserSchema.scope('male', function() {
//   return this.where('gender', 'male');
// });
//
// UserSchema.scope('active', function () {
//   return this.where('lastLogin').gte(+new Date - 24*60*60*1000)
// });
//
// var User = mongoose.model('User', UserSchema);


describe('namedScopesPlugin', () => {
  it('should be registarable as a plugin', done => {
    var UserSchema = new Schema({
      age: Number,
      gender: String,
      lastLogin: Date,
      parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });
    UserSchema.plugin(namedScopesPlugin);

    assert.isFunction(UserSchema.scope);
    assert.isFunction(UserSchema.namedScope);
    assert.equal(UserSchema.scope, UserSchema.namedScope);

    done();
  });
});

describe('namedScope', () => {
  var UserSchema;
  const olderThan = function (age) {
    return this.where('age').gt(age);
  };

  beforeEach(() => {
    UserSchema = new Schema({
      age: Number,
      gender: String,
      lastLogin: Date,
      parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });
    UserSchema.plugin(namedScopesPlugin);
  });

  it('should register a function on the schema\'s statics', done => {
    UserSchema.scope('olderThan', olderThan);

    assert.isFunction(UserSchema.statics.olderThan);
    done();
  });

  it('should register a function on Query.prototype', done => {
    UserSchema.scope('olderThan', olderThan);

    assert.isFunction(mongoose.Query.prototype.olderThan);
    done();
  });

  it('registers a chainable function that keeps returning mongoose.Query', done => {
    UserSchema.scope('olderThan', olderThan);
    const User = mongoose.model('User1', UserSchema);

    assert(User.olderThan(20) instanceof mongoose.Query);
    assert(User.olderThan(20).olderThan(30) instanceof mongoose.Query);
    done();
  });

  it('starts chains even on non-.find scopes', done => {
    UserSchema.scope('populateParent', function() {
      return this.populate('parent');
    });
    UserSchema.scope('olderThan', olderThan);
    const User = mongoose.model('User3', UserSchema);

    assert(User.populateParent().olderThan(20) instanceof mongoose.Query);
    done();
  });

  it('correctly applies .find and .where', done => {
    UserSchema.scope('olderThan', olderThan);
    const User = mongoose.model('User2', UserSchema);

    const q1 = User.olderThan(20);
    const q2 = User.find({age: {$gt: 20}});
    assert.deepEqual(q1._conditions, q2._conditions);
    done();
  });

  it('correctly applies .populate', done => {
    UserSchema.scope('populateParent', function() {
      return this.populate('parent');
    });
    const User = mongoose.model('User5', UserSchema);

    const q1 = User.populateParent();
    const q2 = User.find().populate('parent');
    assert.deepEqual(q1._mongooseOptions.populate, q2._mongooseOptions.populate);
    done();
  });

  it('correctly applies .populate', done => {
    UserSchema.scope('sortByAge', function() {
      return this.sort('age');
    });
    const User = mongoose.model('User6', UserSchema);

    const q1 = User.sortByAge();
    const q2 = User.find().sort('age');
    assert.deepEqual(q1.options, q2.options);
    done();
  });
});
