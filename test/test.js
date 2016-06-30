var assert = require('chai').assert;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var namedScopesPlugin = require('./../index');

const modelName = (() => {
  var i = 0;
  return () => `Model${i++}`;
})();


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
  var TaskSchema;

  beforeEach(() => {
    UserSchema = new Schema({
      age: Number,
      gender: String,
      lastLogin: Date,
      parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });
    UserSchema.plugin(namedScopesPlugin);

    TaskSchema = new Schema({
      body: String
    });
    TaskSchema.plugin(namedScopesPlugin);
  });

  describe('with a function', () => {
    const olderThan = function (age) {
      return this.where('age').gt(age);
    };
    const populateParent = function() {
      return this.populate('parent');
    };
    const sortByAge = function() {
      return this.sort('age');
    };

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
      const User = mongoose.model(modelName(), UserSchema);

      assert(User.olderThan(20) instanceof mongoose.Query);
      assert(User.olderThan(20).olderThan(30) instanceof mongoose.Query);
      done();
    });

    it('does not register functions for other schemas', done => {
      UserSchema.scope('sortByAge', sortByAge);
      const User = mongoose.model(modelName(), UserSchema);
      const Task = mongoose.model(modelName(), TaskSchema);

      assert.isUndefined(Task.sortByAge);
      assert.throws(Task.find().sortByAge);
      done();
    });

    it('works on discriminators', done => {
      UserSchema.scope('olderThan', olderThan);
      UserSchema.set('discriminatorKey', 'kind');
      const User = mongoose.model(modelName(), UserSchema);
      const Employee = User.discriminator(modelName(), new mongoose.Schema(
        {job: String}, {discriminatorKey: 'kind'}
      ));

      assert(Employee.olderThan(20) instanceof mongoose.Query);
      assert(Employee.olderThan(20).olderThan(30) instanceof mongoose.Query);
      done();
    });

    it('starts chains even on non-.find scopes', done => {
      UserSchema.scope('populateParent', populateParent);
      UserSchema.scope('olderThan', olderThan);
      const User = mongoose.model(modelName(), UserSchema);

      assert(User.populateParent().olderThan(20) instanceof mongoose.Query);
      done();
    });

    it('correctly applies .find and .where', done => {
      UserSchema.scope('olderThan', olderThan);
      const User = mongoose.model(modelName(), UserSchema);

      const q1 = User.olderThan(20);
      const q2 = User.find({age: {$gt: 20}});
      assert.deepEqual(q1._conditions, q2._conditions);
      done();
    });

    it('correctly applies .populate', done => {
      UserSchema.scope('populateParent', populateParent);
      const User = mongoose.model(modelName(), UserSchema);

      const q1 = User.populateParent();
      const q2 = User.find().populate('parent');
      assert.deepEqual(q1._mongooseOptions.populate, q2._mongooseOptions.populate);
      done();
    });

    it('correctly applies .sort', done => {
      UserSchema.scope('sortByAge', sortByAge);
      const User = mongoose.model(modelName(), UserSchema);

      const q1 = User.sortByAge();
      const q2 = User.find().sort('age');
      assert.deepEqual(q1.options, q2.options);
      done();
    });

    it('handles scopes with the same name on different schemas', done => {
      UserSchema.scope('sortByAge', sortByAge);
      const User = mongoose.model(modelName(), UserSchema);
      TaskSchema.scope('sortByAge', function() {
        return this.where('body').equals('age');  // whatever
      });
      const Task = mongoose.model(modelName(), TaskSchema);

      const uq1 = User.sortByAge();
      const uq2 = User.find().sort('age');
      assert.deepEqual(uq1.options, uq2.options);
      assert.deepEqual(uq1._conditions, uq2._conditions);

      const tq1 = Task.sortByAge();
      const tq2 = Task.find({body: 'age'});
      assert.deepEqual(tq1.options, tq2.options);
      assert.deepEqual(tq1._conditions, tq2._conditions);
      
      done();
    });
  });


  describe('with chained operators', () => {
    it('should register a function on the schema\'s statics', done => {
      UserSchema.scope('underage').where('age').lt(18);

      assert.isFunction(UserSchema.statics.underage);
      done();
    });

    it('should register a function on Query.prototype', done => {
      UserSchema.scope('underage').where('age').lt(18);

      assert.isFunction(mongoose.Query.prototype.underage);
      done();
    });

    it('registers a chainable function that keeps returning mongoose.Query', done => {
      UserSchema.scope('underage').where('age').lt(18);
      UserSchema.scope('populateParent').populate('parent');
      const User = mongoose.model(modelName(), UserSchema);

      assert(User.underage() instanceof mongoose.Query);
      assert(User.underage().populateParent() instanceof mongoose.Query);
      done();
    });

    it('correctly applies .find and .where', done => {
      UserSchema.scope('underage').where('age').lt(18);
      const User = mongoose.model(modelName(), UserSchema);

      const q1 = User.underage();
      const q2 = User.find({age: {$lt: 18}});
      assert.deepEqual(q1._conditions, q2._conditions);
      done();
    });

    it('correctly applies .populate', done => {
      UserSchema.scope('populateParent').populate('parent');
      const User = mongoose.model(modelName(), UserSchema);

      const q1 = User.populateParent();
      const q2 = User.find().populate('parent');
      assert.deepEqual(q1._mongooseOptions.populate, q2._mongooseOptions.populate);
      done();
    });

    it('correctly applies .sort', done => {
      UserSchema.scope('sortByAge').sort('age');
      const User = mongoose.model(modelName(), UserSchema);

      const q1 = User.sortByAge();
      const q2 = User.find().sort('age');
      assert.deepEqual(q1.options, q2.options);
      done();
    });
  });
});
