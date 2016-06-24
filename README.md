# mongoose-named-scopes

:four_leaf_clover: Define chainable, semantic and composable Mongoose queries

```javascript
ProductSchema.scope('available').where('available').equals(true);
ProductSchema.scope('mostRecent', function(count) {
  this.sort('-updatedAt').limit(10)
}
// etc

Product.category('men').available().mostRecent(10);
User.male().olderThan(18).sortByAge().populateProfile();
Task.assignedTo(john).highPriority().project('mongoose').limit(5);
```


## Usage

First, you need to register the plugin into the schemas that you want to use it:

```javascript
var namedScopesPlugin = require('mongoose-named-scopes');
UserSchema.plugin(namedScopesPlugin);
```

You can also define it for all schemas at once:

```javascript
var namedScopesPlugin = require('./index');
mongoose.plugin(require('./lastMod'));
```

Then, use `schema.scope` (or `schema.namedScope`) to define your scopes:

```javascript
// You can define scopes by chaining operator calls
UserSchema.scope('male').where('gender').equals('male');

// Or you can pass a function, for when you want to have arguments
// or need to use other statements
UserSchema.scope('olderThan', function (age) {
  // Be sure to return `this`!
  return this.where('age').gt(age);
});

UserSchema.scope('youngerThan', function (age) {
  return this.where('age').lt(age);
});

// Scopes can make use of other scopes!
UserSchema.scope('twenties').olderThan(19).youngerThan(20);

// Heads up! We need to implement this as a function so that the
// date parameter gets evaluated when you actually call the scope
UserSchema.scope('active', function () {
  return this.where('lastLogin').gte(+new Date() - 24*60*60*1000)
});
```

Now, use the named scopes as if they were query functions:

```javascript
// You can use .exec().then().catch()
User.olderThan(20).exec().then(...).catch(...);

// Or just .then().catch()
User.twenties().active().male().then(...).catch(...);

// You can specify more operators
User.populate('children').olderThan(50).sort('age')...

// You can end it findOne
User.olderThan(100).findOne()...
```

Enjoy!


## Contributing

Contributions are greatly appreciated!

This is a very new library that extends Mongoose in some unusual ways.
Please report bugs in the Issues.

Feel free to develop additional features or fix bugs and send them over
as Pull Requests.
