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

var MAX_NUM_NOTIF = 5;

var methods = exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.opStr = null;
        this.scratch.op = null;
        this.state.acc = {};
        this.scratch.inputs = {};
        this.state.autoOn = false;
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = (cp && cp.state) || {};
        if (typeof this.state.opStr === 'string') {
            var op = conduit.parse(this.state.opStr);
            var m  = utils.cloneAndMix(this.$.idol, utils.bind(this, methods));
            this.scratch.op = op.__behavior__(m);
        }
        this.scratch.inputs = {};
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        if (this.state.autoOn && this.scratch.op) {
            this.forceRefresh(cb);
        } else {
            cb(null);
        }
    },
    'clearAll': function(deleteKey, cb) {
        var self = this;
        if (deleteKey) {
            this.$.idol.deleteKey();
        }
        this.state.opStr = null;
        this.scratch.op = null;
        this.state.acc = {};
        this.scratch.inputs = {};
        var all = this.$.pull.listResources() || [];
        all.forEach(function(x) {
                        self.$.pull.removeResource(x);
                    });
        cb(null);
    },
    'addKey' : function(key, cb) {
        this.$.idol.addKey(key);
        cb && cb(null);
    },
    'deleteKey' : function(cb) {
        this.$.idol.deleteKey();
        cb && cb(null);
    },
    'newOp': function(opStr, cb) {
        if (opStr && (typeof opStr === 'string')) {
            this.state.opStr = opStr;
            var op = conduit.parse(opStr);
            var m  = utils.cloneAndMix(this.$.idol, utils.bind(this, methods));
            this.scratch.op = op.__behavior__(m);
            this.state.acc = {};
            this.scratch.op.__fold__(this.state.acc, cb);
        } else {
            cb('newOp: Ignoring input' + JSON.stringify(opStr));
        }
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
    },

    // Managing inputs
    'addInput' : function(alias, url, cb) {
        this.$.pull.addResource(alias, url, 'updatedFile');
        cb && cb(null, 'ok');
    },
    'removeInput' : function(alias, cb) {
        this.$.pull.removeResource(alias);
        cb && cb(null, 'ok');
    },
    'listInputs' : function(cb) {
        var all = this.$.pull.listResources();
        cb(null, {inputs: all, autoOn: this.state.autoOn});
    },
    'forceRefresh' : function(cb) {
        // check files for changes
        var self = this;
        var inputs = this.$.pull.listResources();
        inputs.forEach(function(alias) {
                              self.$.pull.refreshResource(alias);
                          });
        cb(null);
    },
    'autoMode' : function(autoOn, cb) {
        this.state.autoOn = autoOn;
        cb(null);
    },
    'updatedFile' : function(alias, fileName, version, cb) {
        var self = this;
        console.log('Got updated file notification: alias:' + alias +
                    ' fileName:' + fileName + ' version:' + version);
        if (this.scratch.inputs[alias] &&
            this.scratch.inputs[alias].version === version) {
            console.log('No Change for ' + fileName);
            cb(null);  // next message
        } else {
            if (this.scratch.op) {
                var cb0 = function(err, val) {
                    if (err) {
                        cb(err, val);
                    } else {
                        if (val && !self.$.idol.isError(val)) {
                        // Do not retry until file changes (or explicit call)
                            self.scratch.inputs[alias] = {'version' : version};
                        }
                        self.$.session.boundQueue(MAX_NUM_NOTIF, 'default');
                        self.$.session.notify(val, 'default');
                        cb(err, val);
                    }
                };
                this.executeOp(cb0);
            } else {
                cb(null);
            }
        }
    },
    // override idol proxy methods
    'expandcontainer' : function(acc, args, deps, label, cb) {
        var self = this;
        if (args && typeof args.url === 'string') {
            var cb1 = function(err, acc) {
                if (err) {
                    cb(err, acc);
                } else {
                    self.addInput(label, args.url);
                    cb(err, acc);
                }
            };
            this.$.idol.expandcontainer(acc, args, deps, label, cb1);
        } else {
            cb('Error: expandcontainer: missing URL in ' +
               JSON.stringify(args));
        }
    }
};

caf.init(__dirname, {});

