# mongoose-named-scopes

:four_leaf_clover: Define reusable, semantic Mongoose queries that can be chained


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
UserSchema.scope('olderThan', function (age) {
  return this.where('age').gt(age);
});

UserSchema.scope('youngerThan', function (age) {
  return this.where('age').lt(age);
});

UserSchema.scope('twenties', function() {
  return this.olderThan(19).youngerThan(30);
});

UserSchema.scope('male', function() {
  return this.where('gender', 'male');
});

UserSchema.scope('active', function () {
  return this.where('lastLogin').gte(+new Date - 24*60*60*1000)
});
```

Now, use the named scopes as if they were query functions:

``javascript
User.olderThan(20).exec().then(...).catch(...);
User.twenties().active().male().exec().then(...).catch(...);
```

Enjoy!

