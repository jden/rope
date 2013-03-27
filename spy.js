var Q = require('q')
var _ = require('lodash')

function Spy(config) {
  this.__ = config
  this.queries = []
  this.readQueries = []
  this.writeQueries = []
}

Spy.prototype = {
  from: function (collection) {
    this.__active = {collection: collection}
    return this
  },
  select: function () { return this },
  where: function (query) {
    this.__active.query = query
    return this
  },
  byId: function (id) {
    this.set('options.query', {_id: id})
    return this
  },
  byIds: function (ids) {
    this.set('options.query', {_id: {$in: ids}})
    return this
  },
  expect: setter('options.expect'),
  sort: setter('options.sort'),
  skip: setter('options.skip'),
  limit: setter('options.limit'),
  toArray: finalizer('read', function () {
    return this.dispatch()
  }),
  one: finalizer('read', function () {
    this.__active.type = 'one'
    return this.dispatch()
  }),
  remove: finalizer('write', function () {

  }),
  set: function (prop, val) {
    var prop = prop.split('.').reduce(function (up, prop) {
      up[prop] = up[prop] || {}
      return up[prop]
    }, this.__active)
    if (typeof val === 'object') {
      for(var p in val) {
        prop[p] = val[p]
      }
    } else {
      prop = val
    }
    return this
  }
}

function setter(option) {
  return function (val) {
    this.set(option, val)
    return this
  }
}

function finalizer(type, next) {
  return function () {
    this.queries.push(this.__active)
    this[type + 'Queries'].push(this)
    return Q.resolve(next.call(this))
  }
}

Spy.prototype.dispatch = function () {
  var active = this.__active

  var stub = _.find(this.__.stubs, function (stub) {
    return stub.collection == active.collection
  })

  if (stub) {
    return stub.data
  }
  //console.log('no collection')
}

module.exports = Spy