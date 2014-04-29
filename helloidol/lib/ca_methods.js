/*!
Copyright 2014 Hewlett-Packard Development Company, L.P.

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
var utils = caf.myutils;

var conduit = require('caf_conduit');


var methods = exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.opStr = null;
        this.scratch.op = null;
        this.state.acc = {};
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = (cp && cp.state) || {};
        if (typeof this.state.opStr === 'string') {
            var op = conduit.parse(this.state.opStr);
            this.scratch.op = op.__behavior__(utils.cloneAndMix(this.$.idol, methods));
        }
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var self = this;
        if (this.scratch.op) {
// DEBUG...
//            this.state.acc = {};
//            this.scratch.op.__fold__(this.state.acc, cb);
        } else {
            cb(null);
        }
    },
    'addKey' : function(key, cb) {
        this.$.idol.addKey(key);
        cb(null);
    },
    'deleteKey' : function(cb) {
        this.$.idol.deleteKey();
        cb(null);
    },
    'newOp': function(opStr, cb) {
        this.state.opStr = opStr;
        var op = conduit.parse(opStr);
        this.scratch.op = op.__behavior__(utils.cloneAndMix(this.$.idol, methods));
        this.state.acc = {};
        this.scratch.op.__fold__(this.state.acc, cb);
    },
    'executeOp': function(cb) {
        if (this.scratch.op) {
            this.state.acc = {};
            this.scratch.op.__fold__(this.state.acc, cb);
        } else {
            cb('Error: executeOp: No operation installed');
        }
    },
    // State is {acc:Object, opStr:string}
    'getState' : function(cb) {
        cb(null, this.state);
    }
};


caf.init(__dirname, {});

