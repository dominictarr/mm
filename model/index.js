var cradle = require('cradle')
  , ctrl = require('ctrlflow')
  , Trial = require('./trial')
  , curry = require('curry')  
  /*
    
    options
      name
      host
      port
      clobber
    
    save
      list of items to save, starting the database (i.e, views)
  */
  
exports.connection = function (opts){

  opts = 'string' === typeof opts ? {name: opts} : opts

  if(!opts.name)
    throw new Error("need a database name")

  var c = 
    new(cradle.Connection)(opts.host || 'http://localhost', opts.port || 5984, {
      cache: true,
      raw: false
    });

  return c.database(opts.name)
}

exports.views = [
  { _id: '_design/platforms'
  , views: {
      'new': {
        map: function(doc) {
          if(doc.type == 'platform' && !doc.rolledout)
            emit(doc._id, doc);
        }
      },
      'all': {
        map: function(doc) {
          if(doc.type == 'platform' && doc.rolledout)
            emit(doc._id, doc);
        }
      }
    }
  },
  { _id: '_design/tests'
  , views: {
      'new': {
        map: function(doc) {
          if(doc.type == 'test' && !doc.rolledout)
            emit(doc._id, doc);
        }
      },
      'all': {
        map: function(doc) {
          if(doc.type == 'test' && doc.rolledout)
            emit(doc._id, doc);
        }
      }
    }
  },
  { _id: '_design/trials'
  , views: {
      init: {
        map: function(doc) {
          if('trial' === doc.type && 'init' === doc.status)
           emit(null, doc);
        }
      },
      results: {
        map: function(doc) {
          if('trial' === doc.type && 'completed' === doc.status){
           var status = doc.report ? doc.report.status : doc.status
           emit(status, 
            { filename: doc.filename
            , platform: doc.platform + '-' + doc.version
            , status: status} );                  
          }
        }
      }
    }
  },
  { _id: '_design/packages'
  , views: {
      all: {
        map: function(doc) {
          if('package' === doc.type)
           emit(doc.name, doc);
        }
        
      },
      trials: {
        map: function(doc) {
          if('trial' === doc.type && doc.report && doc.report.meta && doc.report.meta.simpleDeps){
            doc.report.meta.simpleDeps.forEach(function (pack){
              emit(pack, {
                test: doc.test
              , filename: doc.filename
              , status: doc.report.status
              , platform: doc.platform + '-' + doc.version 
              })
            })
          }
        }
      },
      tests: {
        map: function(doc) {
          var emitted = false
          if('trial' === doc.type && doc.report && doc.report.meta && doc.report.meta.depends){
            doc.report.meta.depends.reverse().forEach(function (dep){
              if(dep.isTest && !emitted){
                emit(dep.package.name + '@' + dep.package.version,{
                  test: doc.test
                , filename: doc.filename
                , platform: doc.platform + '-' + doc.version
                })
                emitted = true
              }
            })
          }
        },
        reduce: function (key,values){
          var seen = {}
            , found = []
          values.forEach(function (v,k){
            if(!seen[v.test]){
              seen[v.test] = true
              found.push({filename:v.filename, test:v.test})
            }
          })
          return found
        }
      }    
    }
  }
]
exports.initialize = function (db,cb){
  ctrl.seq([
    curry(db.create,db)
  , curry([exports.views],db.save,db)
  , function (){process.nextTick(cb)}
  ]).onError(cb).go()
//  db.create(cb)
}
exports.clean = function (db,cb){
  db.destroy(function (e){
    exports.initialize (db,cb)  
  })
}

exports.rollout = function (db,done){
    var g = ctrl.group()
    done = [].pop.call(arguments)
        
    db.view('platforms/new',g())
    db.view('platforms/all',g())
    db.view('tests/new',g())
    db.view('tests/all',g())

    function ex (data){
      console.log(data)
      return data.rows.map(function (e){
        e.value.rolledout = true
        return e.value
      })
    }

    g.done(function (err,data){
      var platforms = {
            new:ex(data[0][1])
          , all:ex(data[1][1])
          }
        , tests = {
            new:ex(data[2][1])
          , all:ex(data[3][1])
          }
      var trials = 
        Trial.generate(tests.new,platforms.all)
        .concat(Trial.generate(tests.all,platforms.new))
        .concat(Trial.generate(tests.new,platforms.new))
      var g = ctrl.group()

      db.save(trials,function (){
        db.save(platforms.new,g())
        db.save(tests.new,g())
      })
      
      g.done(function (err,res){
        done(err,trials.length)
      })
    })
  }


/*module.exports = 
function init(_obj){
  var obj = 
  { models: {
      trials: [
        { _id: '_design/views'
        , views: {
            init: {
              map: function(doc) {
                if(doc.status == 'init')
                 emit(null, doc);
              }
            },
            results: {
              map: function(doc) {
                if(doc.status != 'init'){
                 var status = doc.report ? doc.report.status : doc.status
                 emit(status, 
                  { filename: doc.filename
                  , platform: doc.platform + '-' + doc.version
                  , status: status} );                  
                }
              }
            }
          }
        }
      ],
      modules: [
        { _id: '_design/platforms'
        , views: {
            'new': {
              map: function(doc) {
                if(doc.type == 'platform' && !doc.rolledout)
                  emit(doc._id, doc);
              }
            },
            'all': {
              map: function(doc) {
                if(doc.type == 'platform' && doc.rolledout)
                  emit(doc._id, doc);
              }
            }
          }
        },
        { _id: '_design/tests'
        , views: {
            'new': {
              map: function(doc) {
                if(doc.type == 'test' && !doc.rolledout)
                  emit(doc._id, doc);
              }
            },
            'all': {
              map: function(doc) {
                if(doc.type == 'test' && doc.rolledout)
                  emit(doc._id, doc);
              }
            }
          }
        }
      ]
    }
  }
  
  obj.host = _obj.host 
  obj.port = _obj.port 
  obj.prefix = _obj.prefix || ''

  var model = odm(obj)
  
  
  return model
}*/