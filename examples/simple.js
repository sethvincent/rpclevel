var level = require('level')

var DB = level('/tmp/rpclevel')
var server = require('../server')(DB)

var db = require('../client')()
server.pipe(db.createRpcStream()).pipe(server)

db.put('foo', 'weeeeeeee', function (err) {
  if (err) console.log(err)
  db.get('foo', function (err, val) {
    if (err) console.log(err)
    else console.log(val)
  })
})