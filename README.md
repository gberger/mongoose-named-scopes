# mongoose-named-scopes
:four_leaf_clover: Define reusable, semantic Mongoose queries that can be chained


## Desired API

```
var UserSchema = new Schema({
  age: Number,
  gender: String,
  lastLogin: Date
});


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
  return this.where('lastLogin').gte(+new Date - _24hours)
});

var User = mongoose.model('User', UserSchema);


User.olderThan(20).exec().then().catch();
User.twenties().active().male().exec().then().catch();

```
