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

var DIVIDER = 5;
var MAX_NUM_SESSIONS = 3;
var MAX_NUM_NOTIF = 5;

var limitNumSessions = function(self) {
    var keys = Object.keys(self.state.logicalSessions);
    if (keys.length > MAX_NUM_SESSIONS) {
        var oldest = null;
        var minCounter = 10000000000;
        for (var key in self.state.logicalSessions) {
            if (self.state.logicalSessions[key] < minCounter) {
                minCounter = self.state.logicalSessions[key];
                oldest = key;
            }
        }
        delete self.state.logicalSessions[oldest];
    }
};

var notifyAll = function(self) {
    if (self.state.counter % DIVIDER === 0) {
        for (var sessionId in self.state.logicalSessions) {
            self.$.session.boundQueue(MAX_NUM_NOTIF, sessionId);
            self.$.session.notify([self.state.counter], sessionId);
        }
    }
};

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counter = -1;
        this.state.logicalSessions = {};
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = (cp && cp.state) || {};
        this.state.logicalSessions = this.state.logicalSessions || {};
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        this.state.counter = this.state.counter + 1;
        notifyAll(this);
        cb(null);
    },
    'increment' : function(inc, cb) {
        this.state.counter = this.state.counter + inc;
        this.state.logicalSessions[this.$.session.getSessionId()] =
            this.state.counter;
        limitNumSessions(this);
        notifyAll(this);
        cb(null, {'counter' : this.state.counter });
    }
};

caf.init(__dirname, {});

