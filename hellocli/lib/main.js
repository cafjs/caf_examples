/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var cli = require('caf_cli');
var http = require('http');
http.globalAgent.maxSockets = 4;


var log = {
    debug: function(msg) {
        console.log('DEBUG:' + msg);
    },
    error: function(msg) {
        console.log('ERROR:' + msg);
    },
    trace: function(msg) {
        console.log('TRACE:' + msg);
    },
    warn: function(msg) {
        console.log('WARN:' + msg);
    }

};

//var url = 'http://helloworld.cf-external.dnsalias.com/ca/me_hello';
var url1 = process.argv[3] || 'http://helloworld.cf.bfc.hpl.hp.com/ca/me_hello';
var MAX_PENDING = 2;
var wakeUpTime = 1000;
var password = process.argv[4] || 'pleasechange';
var username = process.argv[5] || undefined;
var newCA = function(url) {
    var cbObject = {
        dispatcher: function(counter) {
            //        console.log('got counter=' + counter);
        }

    };

    var options = {
        cbObject: cbObject,
        log: log,
        url: url,
        password: password,
        username: username
    };

    var session = new cli.Session(options);
    session.on('error', function(err) {
                   console.log('something bad happened:' + err);
               });
    var pending = 0;

    setInterval(function() {
                    var cb = function(err, data) {
                        if (err) {
                            log.error('Got invocation error' +
                                      JSON.stringify(err));
                        } else {
                            pending = pending - 1;
                        }
                    };
                    if (pending < MAX_PENDING) {
                        pending = pending + 1;
                        session.remoteInvoke('hello', ['Hello CA', 1], cb);
                    }
                }, wakeUpTime);
};

var numAgents = 1;
var delay = wakeUpTime / numAgents;
var count = 0;
var cron;
var offset = (process.argv[2] && parseInt(process.argv[2])) || 0;
cron = setInterval(function() {
                       if (count < numAgents) {
                           newCA(url1 + (count + offset));
                           count = count + 1;
                       } else {
                           clearInterval(cron);
                       }
                   }, delay);


