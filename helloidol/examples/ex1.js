var cli = require('caf_cli');
var conduit = require('caf_conduit');
var async = require('async');
var REPO_PREFIX='https://region-a.geo-1.objects.hpcloudsvc.com/v1/87595414183311/CloudAssistant/';
var MY_KEY=process.env['MY_KEY'];


var log = {
    'debug': function(x) {
        console.log("DEBUG:" + x);
    },
    'warn': function(x) {
        console.log("WARN:" + x);
    },
    'info': function(x) {
        console.log("INFO:" + x);
    },
    'error': function(x) {
        console.log("ERROR:" + x);
    },
    'trace': function(x) {
        console.log("TRACE:" + x);
    }
};

var cbObject = {
    'dispatcher' : function(notification) {
        console.log("NOTIF: got " + JSON.stringify(notification));
    }
};
var session = new cli.Session({url:"http://helloidol.vcap.me:3000/ca/antonio_xx",
                               cbObject : cbObject,
                               password: "pleasechange"
                               //,
                               //log: log
                              })


var IDOL_APIs = ['detectlanguage', 'explodecontainer',
                 'readbarcode','addtotextindex', 'extractentity',
                 'expandterm', 'extracttext', 'findfaces','findsimilar',
                 'highlight', 'detectimage', 'view', 'ocr', 'query',
                 'dynamicthesaurus', 'detectsentiment', 'storeobject',
                 'tokenize','createtextindex','deletetextindex', 'listindex'];

var c = conduit.newInstance(IDOL_APIs);

c = c.explodecontainer({'url': REPO_PREFIX + 'foo.tar'}, null,  'c1')
    .detectlanguage({'filter' : ['*.txt']}, {'input': 'c1'} , 'c2')
    .readbarcode({'filter':['photos/*.jpg']}, {'input': 'c1'} , 'c3')
    .__par__()
    .__seq__();


async.series([
                 function(cb) {
                     session.remoteInvoke('autoMode',[true], cb);
                 },
                 function(cb) {
                     session.remoteInvoke('addInput',['i1', REPO_PREFIX +
                                                      'foo.tar'], cb);
                 },
                 function(cb) {
                     session.remoteInvoke('addKey',[MY_KEY], cb);
                 },
                 function(cb) {
                     session.remoteInvoke('newOp',[c.__stringify__()], cb);
                 }
             ], function(err, data) {
                 if (err) {
                     console.log("error: " + JSON.stringify(err));
                 } else {
                     console.log("got " + JSON.stringify(data));
                 }
             });


var f = function() {
    session.remoteInvoke('getState',[], function(err, val) {
                             console.log("got " + JSON.stringify(val));
                         });
};






