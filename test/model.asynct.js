

var model = require('../model')
  , it = require('it-is')
  , Platform = require('../model/platform')
  , Test = require('../model/test')
  , db =  model.connection('test1')
  , ctrl = require('ctrlflow')
  , curry = require('curry')
  , mm = 'mm'
   , tests = [
      new Test(mm + '/test/examples/simple.node.js')
    , new Test(mm + '/test/examples/simple2.node.js')
    , new Test(mm + '/test/examples/simple3.node.js')
    ]
  , platforms = Platform.all().filter(function (e){
      return -1 != ['v0.2.6','v0.3.2','v0.4.2'].indexOf(e.version)
    })

/*
  initialize database:
  
  load views, save platforms, 
  
  for the test, save 

*/

exports.__setup = function (test){

  model.clean(db,test.done) 
}

exports['inialize -> exists'] = function (test){

  db.exists(function (err,exists){
    it(err).ifError()
    it(exists).ok()
    test.done()
  })
}

exports['save platforms'] = function (test){
  var plats = platforms
  ctrl.seq([
    curry([plats],db.save,db),
    function (err,saved,next){
      it(err).ifError()
      db.view('platforms/new',next)
    },
    function newPlatform(err,data,next){
      it(err).equal(null)
      it(data).property('total_rows',plats.length)
      it(data.rows.map(function (e){
          return e.value
        })).has(plats)
      test.done()
    }
  ]).go()
}

function compare (x,y,sorter){

  function sort(x,y){
    return x[sorter] < y[sorter]
      ? 1 
      : (x[sorter] > y[sorter] 
        ? -1
        : 0 )
  }

  it(x.sort(sort)).has(y.sort(sort))

}

exports['save tests'] = function (test){
  ctrl.seq([
    curry([tests],db.save,db),
    function (err,saved,next){
      it(err).ifError()
      db.view('tests/new',next)
    },
    function (err,data,next){
      it(err).equal(null)
      it(data).property('total_rows',tests.length)
      
      var items = data.rows.map(function (e){
          return e.value
        })
      compare(items,tests,'filename')
      test.done()
    }
  ]).go()
}

exports ['rollout!'] = function (test){
  ctrl.seq([
    curry([db], model.rollout)
  , function (err,count,next){
    db.view('trials/init', next)
  }
  , function (err,data){
    it(err).equal(null)

    console.log(data)

    it(data).property('total_rows',tests.length * platforms.length)
    test.done()
  }]).onError(test.error).go()
}

/*
can't run tests because these are

*/
