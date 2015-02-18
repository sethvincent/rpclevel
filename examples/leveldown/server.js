var rpclevel = require('../../server')
var net = require('net')
var level = require('level')

var db = level('/tmp/rpclevel', { valueEncoding: 'json' })

net.createServer(rpc).listen(3000)

function rpc (con) {
  con.pipe(rpclevel(db)).pipe(con)
}