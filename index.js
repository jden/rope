var Spy = require('./spy')

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
  return new Spy(this)
}





function Stub(config) {
  this.collection = config.collection
  this.data = config.data
}


module.exports = rope