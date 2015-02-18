# rpclevel

Use leveldb over rpc. Also, use leveldb over rpc as a leveldown-compatible module so that you can use things like subleveldown on the client.

This is a learning project to get a better understanding of rpc and leveldown, and could have some wonky things going on. Feedback via the issues queue would be welcome & helpful.

## Notes

Tests don't work yet.

Setting key/value encoding from the client looks like it will take some work.

The rpcleveldown module should probably be broken out into its own module and tested separately.

## See also

This module started as a stripped down version of [multilevel](http://npmjs.org/multilevel), then took inspiration from [subleveldown](http://npmjs.org/subleveldown), & grabbed the iterator code from [level-party](http://npmjs.org/level-party) to make iterators work.

If you're looking for a more mature levelup-related library that does rpc, multilevel is a good option.

## Install

```
npm i --save sethvincent/rpclevel
```

_(this package is not yet on npm, so you'll be grabbing it directly from the github repo)_


## Examples

### Using the net module

**Server:**

```js
var rpclevel = require('rpclevel/server');
var net = require('net');
var level = require('level');

var db = level('/tmp/rpclevel', { valueEncoding: 'json' });

net.createServer(rpc).listen(3000);

function rpc (con) {
  con.pipe(rpclevel(db)).pipe(con);
}
```

**Client:**

```js
var rpclevel = require('rpclevel/client');
var net = require('net')

var db = rpclevel();
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
```


### using rpcleveldown & subleveldown

**Server:**

The server can be the same as the above example.

**Client:**

```js
var level = require('levelup')
var sublevel = require('subleveldown')
var rpcleveldown = require('rpclevel/rpcleveldown')

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
```


## License
MIT