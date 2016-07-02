# mongoose-named-scopes

:four_leaf_clover: Define chainable, semantic and composable Mongoose queries

```javascript
// Definition (placed in Scheme)
ProductSchema.scope('available').where('available').equals(true);
ProductSchema.scope('mostRecent', function(count) {
  return this.sort('-updatedAt').limit(count);
});
ProductSchema.scope('category', function(cat) {
  return this.where('category').equals(cat);
};
// etc

// Usage (called from anywhere)
Product.category('men').available().mostRecent(10);
User.male().olderThan(18).sortByAge().populateProfile();
Task.assignedTo(john).highPriority().project('mongoose').limit(5);
```


## Usage

Install it with npm:

```bash
npm install --save mongoose-named-scopes
```

First, you need to register the plugin into the schemas that you want to use it:

```javascript
var namedScopesPlugin = require('mongoose-named-scopes');

// For one Schema
UserSchema.plugin(namedScopesPlugin);

// For all Schemas at once
mongoose.plugin(namedScopesPlugin);
```

Then, use `schema.scope` (or `schema.namedScope`) to define your scopes:

```javascript
// You can define scopes by chaining operator calls
UserSchema.scope('male').where('gender').equals('male');

// Or you can pass a function, for when you want to have parameters
// or need to use other statements
UserSchema.scope('olderThan', function (age) {
  // Be sure to return `this`!
  return this.where('age').gt(age);
});

UserSchema.scope('youngerThan', function (age) {
  return this.where('age').lt(age);
});

// Scopes can make use of other scopes!
UserSchema.scope('twenties').olderThan(19).youngerThan(30);

// Heads up! We need to implement this by passing a function so that the
// date parameter gets evaluated when you actually call the scope
UserSchema.scope('active', function () {
  const yesterday = +new Date() - 24*60*60*1000;
  return this.where('lastLogin').gte(yesterday);
});
```

Now, use the named scopes as if they were query functions:

```javascript
// You can specify more operators
User.populate('children').olderThan(50).sort('age'); // ...

// Returning array results
User.olderThan(20).exec().then((users) => {}).catch(err);

// Returning single results
User.olderThan(100).findOne().exec().then((users) => {}).catch(err);
```

Enjoy!


## Contributing

Contributions are greatly appreciated!

This is a very new library that extends Mongoose in some unusual ways.
Please report bugs in the Issues.

Feel free to develop additional features or fix bugs and send them over
as Pull Requests.
