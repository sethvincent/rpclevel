var rpclevel = require('../../client')
var net = require('net')

var db = rpclevel()
var con = net.connect(3000)
con.pipe(db.createRpcStream()).pipe(con)

db.put('example', { pizza: 'yum' }, function (err) {  
  db.createReadStream()
    .on('data', function (data) {
      console.log('read stream', data)
    })
    .on('end', function (){
      db.close()
    })
})