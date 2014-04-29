var cli = require('caf_cli');
var conduit = require('caf_conduit');
var async = require('async');
var REPO_PREFIX='https://region-a.geo-1.objects.hpcloudsvc.com/v1/87595414183311/CloudAssistant/';
var MY_KEY='e9372328-6985-4652-8aea-c8966bb86c6d';


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

var session = new cli.Session({url:"http://helloidol.vcap.me:3000/ca/antonio_xx",
                               password: "pleasechange",
//                               log: log,
                               disableBackChannel:true})


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






