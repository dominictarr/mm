
var EventEmitter = require ('events').EventEmitter
  , metatest = require('meta-test/runner')
  , _ = require('underscore')
  , pi = require('./package-inspector')
  , ctrl = require('ctrlflow')
    
module.exports = Runner 

Runner.prototype = new EventEmitter
function Runner (db){
  var self = this
    , timeout
  self.running = false

  self.start = function (){
    console.log("START")
  
    self.running = true

    self.loop()
  }

  self.stop = function (){
    self.running = false
    clearTimeout(timeout)
  }

  self.run = function (doc,done){
    doc.status = 'started'
/*    
    ctrl.seq([
      function (next){//register that the test has started.
        console.log("!")
        db.save(doc,next)

      }, function (err,__doc){//start test

        var next = [].pop.call(arguments)
        if(err)
          throw err
        doc._rev = _doc._rev

        self.emit('started',null,doc)
        metatest.run(doc,next)

      }, function (err,report,next){//process test results

        var next = [].pop.call(arguments)
        doc.report = report
        doc.status = 'completed'
        pi.processDeps(doc.report.meta.depends,next)

      }, function (err,deps,packages){//save test results

        var next = [].pop.call(arguments)

        db.save(_.values(packages).map(function (e){
          e._id = e.name + '@' + e.version
          e.type = 'package'
          return e
        }),console.log)

        doc.report.meta.simpleDeps = Object.keys(packages)
        db.save(doc,next)

      }, function (err){//
        var next = [].pop.call(arguments)
        self.emit('completed',null,doc)
        return process.nextTick(done)

      }]).onError(function (){setTimeout(done,100)}).go()
    //*/
    
    db.save(doc,function (err,_doc){
      if(err)//if another runner has started this already.
        return timeout = setTimeout(done,100)

      doc._rev = _doc._rev

      self.emit('started',null,doc)

      metatest.run(doc,function (err,report){
        doc.report = report
        doc.status = 'completed'
        pi.processDeps(doc.report.meta.depends,function (err,deps,packages){

          db.save(_.values(packages).map(function (e){
            e._id = e.name + '@' + e.version
            e.type = 'package'
            return e
          }),console.log)

          doc.report.meta.simpleDeps = Object.keys(packages)
                      
          db.save(doc,function (err){
            self.emit('completed',null,doc)
            return process.nextTick(done)
          })
        })
      })
    })
    //*/
  }

  self.loop = function (){
    db.view('trials/init', {limit: 1}, function (err,data){
      if(!self.running)
        return
      
      if(!data.length){
          self.emit('drain')
          timeout = setTimeout(self.loop,1e3)
        }
      else {

        var doc = data[0].value
        self.run(doc,self.loop)
      }
    })
  }
}
