var Promise = require('bluebird')
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
    this.__active.query = _.extend(this.__active.query || {}, query)
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
  sort: setter('options.sort'),
  skip: setter('options.skip'),
  limit: setter('options.limit'),
  toArray: finalizer('read', function () {
    this.__active.type = 'toArray'
    return this.dispatch()
  }),
  then: finalizer('read', function () {
    this.__active.type = 'array'
    return this.dispatch()
  }),
  count: finalizer('read', function () {
    this.__active.type = 'count'
    return this.dispatch()
  }),
  first: finalizer('read', function () {
    this.__active.type = 'first'
    return this.dispatch()
  }),
  firstOrDefault: finalizer('read', function () {
    this.__active.type = 'firstOrDefault'
    return this.dispatch()
  }),
  remove: finalizer('write', function () {

  }),
  insert: finalizer('write', function (changes) {
    this.__active.type = 'insert'
    this.set('changes', changes)
  }),
  update: finalizer('write', function (changes) {
    this.__active.type = 'update'
    this.set('changes', changes)
  }),
  upsert: finalizer('write', function (changes) {
    this.__active.type = 'upsert'
    this.set('changes', changes)
  }),
  findAndModify: finalizer('write', function (changes) {
    this.__active.type = 'findAndModify'
    this.set('changes', changes)
    return this.dispatch()
  }),
  modifyAndFind: finalizer('write', function (changes) {
    this.__active.type = 'modifyAndFind'
    this.set('changes', changes)
    return this.dispatch()
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
    return Promise.resolve(next.call(this, val))
  }
}

Spy.prototype.dispatch = function () {
  if (this.__.stubs.length === 1) {
    return this.__.stubs[0].data
  }
  var active = this.__active

  var stubs = _.filter(this.__.stubs, function (stub) {
    return stub.collection == active.collection || !stub.collection
  })
  var stub;
  if (stubs.length > 1 && this.__active.query) {
    var query = this.__active.query
    stub = stubs.filter(function (stub) {
      return Object.keys(query).every(function (key) {
        return query[key] === stub.data[key]
      })
    })[0]
  } else {
    stub = stubs[0]
  }


  if (stub) {
    return stub.data
  }

  //console.log('no collection')
}

function Query() {
  return {db: this.db}
}

module.exports = Spy