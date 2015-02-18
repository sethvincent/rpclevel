var net = require('net')
var inherits = require('inherits')
var abstract = require('abstract-leveldown')

var client = require('./client')

module.exports = function (opts) { return new RPCLevelDown(opts) }

function RPCLevelDown() {
  if (!(this instanceof RPCLevelDown)) return new RPCLevelDown()
  abstract.AbstractLevelDOWN.call(this, 'no-location')
}

inherits(RPCLevelDown, abstract.AbstractLevelDOWN)

RPCLevelDown.prototype._open = function(opts, cb) {
  var db = this.db = client()
  this.remote = opts.remote
  var server = net.connect(opts.remote)
  server.pipe(db.createRpcStream()).pipe(server)
  process.nextTick(cb)
}

RPCLevelDown.prototype._close = function(cb) {
  this.db.close(cb)
}

RPCLevelDown.prototype._put = function(key, value, opts, cb) {
  this.db.put(key, value, opts, cb)
}

RPCLevelDown.prototype._get = function(key, opts, cb) {
  this.db.get(key, opts, cb)
}

RPCLevelDown.prototype._del = function(key, opts, cb) {
  this.db.del(key, opts, cb)
}

RPCLevelDown.prototype._iterator = function (opts) {
  var self = this
  var iteratorIx = 0
  var ix = iteratorIx++
  this.db._iteratorCreate(ix, opts)

  return { next: next, end: end }
  function next (cb) { self.db._iteratorNext(ix, cb) }
  function end (cb) { self.db._iteratorEnd(ix, cb) }
}

RPCLevelDown.prototype._batch = function(operations, opts, cb) {
  this.db.batch(operations, opts, cb)
}

RPCLevelDown.prototype.approximateSize = function(start, end, cb) {
  this.db.approximateSize(start, end, cb)
}