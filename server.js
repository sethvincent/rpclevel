var rpc = require('rpc-stream')
var manifest = require('level-manifest')
var MuxDemux = require('mux-demux/jsonb')
var has = require('has')

module.exports = function (db, opts) {
  var muxdemux = MuxDemux({ error: true })
  opts = opts || {}

  var m = manifest(db)
  var server = rpc(null, { raw: true })
  var iterators = {}
  var handlers = {}

  m.methods._iteratorCreate = { type: 'async' }
  db._iteratorCreate = function (ix, opts) {
    iterators[ix] = (db.iterator && db.iterator(opts)) 
      || (db.db && db.db.iterator && db.db.iterator(opts))
  }

  m.methods._iteratorNext = { type: 'async' }
  db._iteratorNext = function (ix, cb) {
    if (!has(iterators, ix)) cb(new Error('no such iterator'))
    else iterators[ix].next(cb)
  }

  m.methods._iteratorEnd = { type: 'async' }
  db._iteratorEnd = function (ix, cb) {
    if (!has(iterators, ix)) cb(new Error('no such iterator'))
    else iterators[ix].end(cb)
  }

  for (var k in m.methods) (function (k) {
    var method = m.methods[k]

    if (method.type == 'async') {
      server.createLocalCall(k, function (args, cb) {
        args.push(cb)
        db[k].apply(db, args)
      })
    } 

    else if (method.type == 'sync') {
      server.createLocalCall(k, function (args, cb) {
        var out
        try { out = db[k].apply(db, args) }
        catch (err) { return cb(err) }
        cb(null, out)
      })
    } 

    else {
      handlers[k] = function (args) {
        return db[k].apply(db, args)
      }
    }
  })(k)

  muxdemux.on('connection', function (con) {
    con.on('error', function (err) {
      console.log('muxdemux connection error', err)
    })

    if (con.meta == 'rpc') return con.pipe(server).pipe(con)

    try {
      var stream = handlers[con.meta[0]](con.meta.slice(1))

      con.once('error', function () {
        stream[stream.readable ? 'destroy' : 'end']()
      })

      if (stream.readable) stream.pipe(con)
      if (stream.writable) con.pipe(stream)
    } catch (err) {
      muxdemux.emit('error', err)
    }
  })

  return muxdemux
}
