//package-inspector.js

var async = require('async')
  , fs = require('fs')
  , path = require('path')

var find = exports.find = function (filename,cb){
  var files = filename.split('/')
  var found = false
  async.whilst(
    function test(){
      return !found && files.length
    },
    function doit(next){
      files.pop()
      var tryPackage = [].concat(files).concat('package.json').join('/')
      
      fs.stat(tryPackage, function (err,stat){
        if(!err)
          found = tryPackage
        next()
      })
    },
    function done(err){
      if(found)
        fs.readFile(found,function (err,data){
          var json
          try{
            json = JSON.parse('' + data)
          } catch (err2){
            cb(err || err2)
          }
          cb(err,json,found)
        })
      else cb(err || new Error('no package.json relative to:' + filename + ' was found'))
    })
  //find the package.json for filename
  //first, remove 
}


exports.processDeps = function (deps,cb){
  var simple = []
  var packages = {}
  async.forEach(deps,
    function (e,next){
      find(e.filename,function (err,pack,filename){

        var dir = path.dirname(filename)
        var local = e.filename.replace(dir,'')

        console.log(local)

        e.package = {
          name: pack.name
        , version: pack.version
        }
        e.isTest = !!/^\/?tests?|specs?\/.*?/(local)

        var at = pack.name + '@' + pack.version
        if(!packages[at])
          packages[at] = pack

        next(err)
      })
    },
    function (err){
      cb(err,deps,packages)
    })
}