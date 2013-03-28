var Q = require('q')
var _ = require('lodash')
var FunctionCreate = require('functioncreate')


Spy = FunctionCreate(function Spy(config) {
  this.__ = config
  this.queries = []
  this.readQueries = []
  this.writeQueries = []

  return function (db) {
    if (db) {
      this.db = db
    }
    return this
  }
})


Spy.prototype = {
  from: function (collection) {
    this.__active = Query.call(this)
    this.__active.collection = collection
    return this
  },
  select: function () { return this },
  where: function (query) {
    this.__active.query = query
    return this
  },
  byId: function (id) {
    this.set('query', {_id: id})
    return this
  },
  byIds: function (ids) {
    this.set('query', {_id: {$in: ids}})
    return this
  },
  select: setter('options.select'),
  expect: function (val) {
    if (typeof val !== 'number') {
      val = 1
    }
    this.set('options.expect', val)
    return this
  },
  sort: setter('options.sort'),
  skip: setter('options.skip'),
  limit: setter('options.limit'),
  toArray: finalizer('read', function () {
    this.__active.type = 'toArray'
    return this.dispatch()
  }),
  one: finalizer('read', function () {
    this.__active.type = 'one'
    return this.dispatch()
  }),
  remove: finalizer('write', function () {

  }),
  insert: finalizer('write', function (changes) {
    this.__active.type = 'insert'
    this.set('changes', changes)
  }),
  upsert: finalizer('write', function (changes) {
    this.__active.type = 'upsert'
    this.set('changes', changes)
  }),
  set: function (prop, val) {
    prop = prop.split('.')
    var end = prop.pop()
    if (!prop.length) {
      this.__active[end] = val
      return this
    }

    var prop = prop.reduce(function (up, prop) {
      up[prop] = up[prop] || {}
      return up[prop]
    }, this.__active)

    prop[end] = val
    return this
  }
}

Spy.prototype.collection = function () {
  return Spy.prototype.from.apply(this, arguments)
}
function setter(option) {
  return function (val) {
    this.set(option, val)
    return this
  }
}

function finalizer(type, next) {
  return function (val) {
    this.queries.push(this.__active)
    this[type + 'Queries'].push(this.__active)
    return Q.resolve(next.call(this, val))
  }
}

Spy.prototype.dispatch = function () {
  var active = this.__active

  var stub = _.find(this.__.stubs, function (stub) {
    return stub.collection == active.collection
  })

  stub = stub || _.find(this.__.stubs, function (stub) {
    return !stub.collection
  })

  if (stub) {
    return stub.data
  }

  //console.log('no collection')
}

function Query() {
  return {db: this.db}
}

module.exports = Spy