var mongoose = require('mongoose');
var Query = mongoose.Query;

module.exports = exports = function namedScopesPlugin (schema, options) {
  schema.namedScope = schema.scope = function(name, fn) {
    var ret;

    // If fn is not a function, we're trying to create a scope by chaining
    // e.g., UserSchema.scope('underage').where('age').lt(18);
    // Note: if fn is a function, it's something like:
    // e.g., UserSchema.scope('underage', function() { return this.where('age').lt(18) });
    if (typeof(fn) !== 'function') {

      // The return of this whole function call is gonna be this proxy
      const proxy = new Proxy({
        // This is the target. We are gonna keep track of the calls to the proxy object
        __calls: []
      }, {
        // This is the handler. When someone does proxy.whatever, the return of this
        // `get` function is what the person receives back
        get: function (target, name) {
          if (name in target || name === 'inspect' || name === 'constructor') {
            // If we're asking for a name that exists, like __call, just give that to them
            return target[name];
          } else {
            // Else, we are gonna return this nifty function
            return function() {
              // The function adds to the list of calls
              // e.g., proxy.where('age') -> proxy.__calls == [['where', ['age']]]
              target.__calls.push([name, Array.prototype.slice.call(arguments)]);
              // Return the proxy so we can keep on chaining!
              // e.g., proxy.where('age').lt(18) -> proxy.__calls = [['where', ['age']], ['lt', [18]]]
              return proxy;
            }
          }
        }
      });

      // Remember how we didn't have a fn? And how the fn is what gets applies operators to the query?
      // Well, we can construct a fn based on the calls that were made to the proxy object.
      fn = function() {
        // this is the Model or a Query
        var that = this;
        for (call of proxy.__calls) {
          // We are gonna replay each call that was made to the proxy.
          that = that[call[0]].apply(that, call[1]);
        }
        // In the end, if we did proxy.where('age').lt(18), the fn does this.where('age').lt(18) :)
        return that;
      };


      ret = proxy;
    }

    // Add static function on the Schema. Wrap it so it calls .find() before.
    this.statics[name] = function() {
      return fn.apply(this.find(), arguments);
    };

    // Add function on the Query
    Query.prototype[name] = function() {
      // We are adding to Query.prototype, which is shared across all Schemas.
      if (this.schema.statics[name]) {
        // If this schema has a static with the same name, then apply that function.
        return this.schema.statics[name].apply(this, arguments);
      } else {
        throw new TypeError('This Schema does not have a ' + name + ' named scope.')
      }
    };

    return ret;
  };
};
