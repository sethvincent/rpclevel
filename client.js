var rpc = require('rpc-stream')
var Emitter = require('events').EventEmitter
var manifest = require('level-manifest')
var inherits = require('inherits')
var tmpStream = require('tmp-stream')
var MuxDemux = require('mux-demux/jsonb')
var manifest = require('level-manifest')({
    methods: {
        _iteratorCreate: { type: 'async' },
        _iteratorNext: { type: 'async' },
        _iteratorEnd: { type: 'async' }
    }
})

module.exports = RPCLevelClient

function RPCLevelClient () {
  if (!(this instanceof RPCLevelClient)) return new RPCLevelClient()
  Emitter.call(this)

  this.isClient = true
  this._isOpen = false
  this.methods = manifest.methods

  this.muxdemux = null
  this.client = null

  this._buildAll(manifest, this, [], null)
}

inherits(RPCLevelClient, Emitter)

RPCLevelClient.prototype.createRpcStream = function () {
  var self = this
  self._isOpen = true

  var muxdemux = self.muxdemux = MuxDemux()
  var client = self.client = rpc(null, { raw: true })
  var rpcStream = muxdemux.createStream('rpc')
  
  muxdemux.on('end', function () {
    self._isOpen = false
    rpcStream.end()
    self.emit('close')
  })

  rpcStream.on('error', function (err) {
    console.log('rpcStream error', err)
  })
  
  client.pipe(rpcStream).pipe(client)

  setTimeout(function () {
    self.emit('open')
  })

  return muxdemux
}

RPCLevelClient.prototype.close = function (cb) {
  this.muxdemux.end()
  if (cb) process.nextTick(cb)
}

RPCLevelClient.prototype.destroy = function () {
  if (this.muxdemux) this.muxdemux.close()
}

RPCLevelClient.prototype._buildAll = function (_db, db, path, parent) {
  var self = this

  for (var k in this.methods) {
    var method = this.methods[k]
    var type = method.type
    var name = path.concat(k).join('!')

    if (type == 'error') {
      throw new Error(method.message || 'not supported')
    }

    if (/async|sync/.test(type)) {
      self._asyncSync(db, k, name)
    }

    else if (/readable|writable/.test(type)) {
      self._stream(db, k, name, type)
    }
  }

}

RPCLevelClient.prototype._asyncSync = function (db, k, name) {
  var self = this

  db[k] = function () {
    var args = [].slice.call(arguments)
    var cb = typeof args[args.length - 1] == 'function'
      ? args.pop()
      : null

    if (/is(Open|Closed)/.test(k) && !cb) {
      if (k == 'isOpen') return self._isOpen
      else return !self._isOpen
    }

    if (!cb) cb = function (err) {
      if (err) db.emit('error', err)
    }

    self._queue(function () {
      self.client.rpc(name, args, cb)
    })
  }
}

RPCLevelClient.prototype._stream = function (db, k, name, type) {
  var self = this

  db[k] = function () {
    var args = [].slice.call(arguments)
    args.unshift(name)

    var tmp = tmpStream()

    self._queue(function () {
      var muxdemux = self.muxdemux
      
      var ts = (
          type === 'readable'
        ? muxdemux.createReadStream(args)
        : type == 'writable'
        ? muxdemux.createWriteStream(args)
        : type == 'duplex'
        ? muxdemux.createStream(args)
        : (function () { throw new Error('not supported') })()
      )
      
      ts.autoDestroy = false
      tmp.replace(ts)
    })

    return tmp
  }
}

RPCLevelClient.prototype._queue = function (fn) {
  if (this._isOpen) fn()
  else this.once('open', fn)
}