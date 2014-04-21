var cli = require('caf_cli');
var conduit = require('caf_conduit');

var session = new cli.Session({url:"http://localhost:3000/ca/antonio_xx",
                               password: "changeme",
                               disableBackChannel:true})

var c = conduit.newInstance(['doCons', 'doPlus', 'doMinus', 'doDiv', 'doMul']);

c = c.doCons({'value':1}, 'cons1')
    .doCons({'value':2}, 'cons2')
    .__par__()
    .doPlus({'left':'cons1', 'right':'cons2'}, 'plus1')
    .__seq__()
    .doCons({'value':3}, 'cons11')
    .doCons({'value':5}, 'cons21')
    .__par__()
    .doMul({'left':'cons11', 'right':'cons21'}, 'mul1')
    .__seq__()
    .__par__()
    .doPlus({'left':'plus1', 'right':'mul1'}, 'plus11')
    .__seq__();

session.remoteInvoke('newOp',[c.__stringify__()], function(err, val) {
                         console.log("got " + JSON.stringify(val));
                     });

var f = function() {
    session.remoteInvoke('getAcc',[], function(err, val) {
                             console.log("got " + JSON.stringify(val));
                         });
};

setTimeout(f, 1000);

setTimeout(f, 1000);

setTimeout(f, 1000);

setTimeout(f, 1000);





