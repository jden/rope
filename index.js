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


function Stub(config) {
  this.collection = config.collection
  this.data = config.data
}


module.exports = rope