var cli = require('caf_cli');
var conduit = require('caf_conduit');

var session = new cli.Session({url:"http://localhost:3000/ca/antonio_xx",
                               password: "pleasechange",
                               disableBackChannel:true})

var c = conduit.newInstance(['doCons', 'doPlus', 'doMinus', 'doDiv', 'doMul']);

c = c.doCons({'value':1}, null,  'cons1')
    .doCons({'value':2}, null, 'cons2')
    .__par__()
    .doPlus(null, {'left':'cons1', 'right':'cons2'}, 'plus1')
    .__seq__()
    .doCons({'value':3}, null,  'cons11')
    .doCons({'value':5}, null, 'cons21')
    .__par__()
    .doMul(null, {'left':'cons11', 'right':'cons21'}, 'mul1')
    .__seq__()
    .__par__()
    .doPlus(null, {'left':'plus1', 'right':'mul1'}, 'plus11')
    .__seq__();

session.remoteInvoke('newOp',[c.__stringify__()], function(err, val) {
                         console.log("got " + JSON.stringify(val));
                     });

var f = function() {
    session.remoteInvoke('getState',[], function(err, val) {
                             console.log("got " + JSON.stringify(val));
                         });
};

setTimeout(f, 1000);

setTimeout(f, 1000);

setTimeout(f, 1000);

setTimeout(f, 1000);





