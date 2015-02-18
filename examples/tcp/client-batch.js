var levelrpc = require('../../client')
var net = require('net')

var db = levelrpc()
var con = net.connect(3000)
con.pipe(db.createRpcStream()).pipe(con)

con.on('error', function (err) {
  console.log(err)
})

var ops = [
    { type: 'del', key: 'father' }
  , { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' }
  , { type: 'put', key: 'dob', value: '16 February 1941' }
  , { type: 'put', key: 'spouse', value: 'Kim Young-sook' }
  , { type: 'put', key: 'occupation', value: 'Clown' }
]

db.batch(ops, function (err) {
  if (err) return console.log('Ooops!', err)
  db.createReadStream()
    .on('data', function (data) {
      console.log('read stream', data)
    })
    .on('end', function (){
      db.close()
    })
})