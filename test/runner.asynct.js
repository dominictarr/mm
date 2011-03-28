

var model = require('../model')
  , it = require('it-is')
  , Platform = require('../model/platform')
  , Test = require('../model/test')
  , db =  model.connection('test1')
  , ctrl = require('ctrlflow')
  , curry = require('curry')
  , Runner = require('../runner')
  , mm = 'mm'
  , tests = [
      new Test(mm + '/test/examples/error.node.js')
    , new Test(mm + '/test/examples/fail.node.js')
    , new Test(mm + '/test/examples/pass.node.js')
    ]
  , platforms = Platform.all().filter(function (e){
      return -1 != ['v0.2.6','v0.3.2','v0.4.2'].indexOf(e.version)
    })


exports.__setup = function (test){

  ctrl.seq([
    curry([db],model.clean)
  , curry([platforms.concat(tests)],db.save,db)
  , curry([db], model.rollout)
  , test.done
  ]).go()
  
}


exports ['run tests'] = function (test){

  var runner = new Runner(db)

  runner.on('completed',function (err,item){
    console.log(item)
    var test = /examples\/(\w+)\.node\.js/(item.filename)[1]
    var map = {
      pass: 'success'
    , fail: 'failure'
    , error: 'error'
    }
    
    it(item).has({
      report: {status: map[test]}
    })
  })  
  
  runner.on('drain',function (){
    test.done()  
    runner.stop()
  })
  runner.start()

}

exports ['check test results'] = function (test){

    db.view('trials/results', function (err,data){
      it(err).equal(null)
      it(data.rows).every(function (e){
        it(e.value).has({
          filename: it.typeof('string')
        , platform: it.typeof('string')
        , status: it.matches(/success|failure|error/)
        })
        
      })

      it(data).property('total_rows',tests.length * platforms.length)

      test.done()
    })
}


exports ['check test depends'] = function (test){

    db.view('trials/results', {include_docs: true}, function (err,data){
      it(err).equal(null)
      it(data.rows).every(function (e){
        it(e.doc).has({report: {meta: {depends: it.ok()}}})
        
        var depends = e.doc.report.meta.depends
        
        it(depends).every(
          it.has({
            filename : it.typeof('string')
          , resolves : it.typeof('object')
          , package:
            { name   : it.typeof('string')
            , version: it.typeof('string') }
          })
        )
      })

      it(data).property('total_rows',tests.length * platforms.length)

      test.done()
    })
}

//*/

