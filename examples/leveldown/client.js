var level = require('levelup')
var sublevel = require('subleveldown')
var rpcleveldown = require('../../rpcleveldown')

var example = level({ 
  db: rpcleveldown,
  remote: {
    port: 3000
  }
})

example.put('wee', 'huh', function (err) {
  example.get('wee', console.log)
})

var example2 = sublevel(example, 'example toooooo', { valueEncoding: 'json' })

example2.put('wat', { ohshit: 'this works?' }, function (err) {
  example2.createReadStream()
    .on('data', console.log)
    .on('end', function () {
      example2.close()
    })
})