var mongoose = require('mongoose');
var Query = mongoose.Query;

module.exports = exports = function namedScopesPlugin (schema, options) {
  schema.namedScope = schema.scope = function(name, fn) {
    // Add static function on the Schema. Wrap it so it calls .find() before.
    this.statics[name] = function() {
      return fn.apply(this.find(), arguments);
    };

    // Save this before we override it.
    var oldQueryFn = Query.prototype[name];
  
    // Add function on the Query
    Query.prototype[name] = function() {
      // We are adding to Query.prototype, which is shared across all Schemas.
      // We need to check if this query's schema is the one we are operating on.
      if (this.schema === schema) {
        // Good! Now apply the function.
        return fn.apply(this, arguments);
      } else {
        // Not the schema we want. Luckily we saved the old function, so apply that.
        // (Different schemas could have defined scopes that are named the same but operate differently.)
        oldQueryFn.apply(this, arguments);
      }
    }
  };
};
