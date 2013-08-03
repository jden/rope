var Spy = require('./spy')
var ObjectId = require('objectid')

function rope() {
  if (!(this instanceof rope)) {
    return new rope()
  }
  this.stubs = []
}

rope.prototype.stub = function (config) {
  this.stubs.push(new Stub(config))
  return this
}

rope.prototype.minq = function () {
  return Spy(this)
}


var oids = {}
rope.$oid = function (key) {
  oids[key] = oids[key] || ObjectId()
  return oids[key]
}


// (Dictionary<collectionName: String, documents: Array<Object>) => DbService
rope.fakeDb = function (collections) {
  var minq = rope()

  // stub data
  Object.keys(collections).forEach(function (name) {
    collections[name].forEach(function (doc) {
      minq.stub({collection: name, data: doc})
    })
  })
  var db = minq = minq.minq()

  // add props to db
  Object.keys(collections).forEach(function (name) {
    Object.defineProperty(db, name, {
          enumerable: true,
          get: function () { return minq.from(name) }
        })
  })
  return db
}

function Stub(config) {
  this.collection = config.collection
  this.data = config.data
}


module.exports = rope