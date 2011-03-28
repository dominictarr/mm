
var pi = require('../package-inspector')
  , join = require('path').join
  , read = require('fs').readFileSync
  , it = require('it-is')

exports ['find package.json'] = function (test){
  var _filename = join(__dirname,'../package.json')
  var _pack = JSON.parse(read(_filename))

  pi.find(__filename,function (err,pack,filename){
    it(err).equal(null)
    console.log(_pack)
    it(filename).deepEqual(_filename)
    it(pack).deepEqual(_pack)
    test.done()  
  })
}
var exampleDeps = 
[ { filename: '/home/dominic/.node_libraries/.npm/async/0.1.8/package/lib/async.js',
    resolves: {} },
  { filename: '/home/dominic/.node_libraries/.npm/async/0.1.8/package/index.js',
    resolves: { './lib/async': '/home/dominic/.node_libraries/.npm/async/0.1.8/package/lib/async.js' } },
  { filename: '/home/dominic/dev/mm/package-inspector.js',
    resolves: { async: '/home/dominic/.node_libraries/.npm/async/0.1.8/package/index.js' } },
  { filename: '/home/dominic/.node_libraries/.npm/render/0.0.2/package/render.js',
    resolves: { traverser: '/home/dominic/.node_libraries/.npm/traverser/0.0.1/package/index.js' } },
  { filename: '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/assert.js',
    resolves: 
     { traverser: '/home/dominic/.node_libraries/.npm/traverser/0.0.1/package/index.js',
       render: '/home/dominic/.node_libraries/.npm/render/0.0.2/package/render.js' } },
  { filename: '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/renderer.js',
    resolves: 
     { render: '/home/dominic/.node_libraries/.npm/render/0.0.2/package/render.js',
       trees: '/home/dominic/.node_libraries/.npm/trees/0.0.2/package/trees.js' } },
  { filename: '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/styles.js',
    resolves: { render: '/home/dominic/.node_libraries/.npm/render/0.0.2/package/render.js' } },
  { filename: '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/it-is.js',
    resolves: 
     { './assert': '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/assert.js',
       './renderer': '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/renderer.js',
       render: '/home/dominic/.node_libraries/.npm/render/0.0.2/package/render.js',
       './styles': '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/styles.js' } },
  { filename: '/home/dominic/dev/mm/test/package-inspector.asynct.js',
    resolves: 
     { '../package-inspector': '/home/dominic/dev/mm/package-inspector.js',
       'it-is': '/home/dominic/.node_libraries/.npm/it-is/0.0.1/package/it-is.js' } },
  { filename: '/home/dominic/.node_libraries/.npm/meta-test/0.0.3/package/loader.js',
    resolves: { '/home/dominic/dev/mm/test/package-inspector.asynct.js': '/home/dominic/dev/mm/test/package-inspector.asynct.js' } } ]


exports['add package info to depends'] = function (test){

  pi.processDeps(exampleDeps,function (err,deps,simple){
    it(err).equal(null)
    it(exampleDeps).every(function (e){
      it(e).has({
        package: {
          name: it.typeof('string')
        , version: it.typeof('string')
        }
      , isTest: !!/\/tests?|specs?\//(e.filename)
      })
    })
    console.log(simple)
    
    console.log(exampleDeps)
    test.done()
  })

}