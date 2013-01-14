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

"use strict";
var caf = require('caf_core');

var MAX_CRASH_TIME = 5; // seconds
var MAX_PROCESSING_TIME = 2; // seconds

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counters = {};
        cb(null);
    },

    'beginSpree' : function(cb) {
        cb(null, this.$.session.begin());
    },

    'endSpree' : function(nonce, cb) {
        if (this.$.session.end(nonce)) {
            cb(null, true);
        } else {
            cb('Error: end: nonce does not match');
        }
    },
    'buy' : function(nonce, whateverToBuy, cb) {
        var self = this;
        var buyTime = Math.random() * MAX_PROCESSING_TIME * 1000;
        setTimeout(function() {
                       var count = self.state.counters[whateverToBuy];
                       count = (count ? count : 0) + 1;
                       self.state.counters[whateverToBuy] = count;
                       if (self.$.session.remember(nonce, whateverToBuy)) {
                           cb(null, self.state.counters);
                       } else {
                           cb('Error: remember: nonce  does not match');
                       }
                   }, buyTime);
    },
    'getCounters' : function(cb) {
        cb(null, this.state.counters);
    },
    'crash' : function(cb) {
        var nextCrashTime = Math.random() * MAX_CRASH_TIME * 1000;
        setTimeout(function() {
                       console.log('Forced crash');
                       /* The node process is shared by many CAs and killing it
                        *  will affect all co-located clients, creating the
                        * illusion of random failures.
                        *
                        * Recovery may wait for the lease to expire (a few
                        * seconds), and repeated crashes may preclude further
                        * progress.
                        *
                        * Killing is not scalable...
                        */
                       process.kill(process.pid, 'SIGKILL');
                   }, nextCrashTime);
        cb(null);
    }
};


caf.init(__dirname, {});

