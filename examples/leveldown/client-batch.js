var net = require('net')
var level = require('levelup')
var sublevel = require('subleveldown')
var rpcleveldown = require('../../rpcleveldown')

var example = level({ 
  db: rpcleveldown,
  remote: {
    port: 3000
  }
})

var ops = [
    { type: 'del', key: 'father' }
  , { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' }
  , { type: 'put', key: 'dob', value: '16 February 1941' }
  , { type: 'put', key: 'spouse', value: 'Kim Young-sook' }
  , { type: 'put', key: 'occupation', value: 'Clown' }
]

example.batch(ops, function (err) {
  if (err) return console.log('Ooops!', err)
  example.createReadStream()
    .on('data', function (data) {
      console.log('read stream', data)
    })
    .on('end', function (){
      example.close()
    })
})