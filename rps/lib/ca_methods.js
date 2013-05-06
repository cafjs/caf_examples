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
var async = caf.async;

var MAX_NUM_NOTIF = 2;

var clone = function(map) {
    var result = {};
    for (var key in map) {
        result[key] = map[key];
    }
    return result;
};

var getDevicesState = function(self) {
    var all = {};
    var deviceIds = self.$.iot.listDevices();
    deviceIds.forEach(function(x) {
                          var map = self.$.iot.getIoT(x);
                          var result = 
                              {toCloud: clone(map.toCloud),
                               fromCloud: clone(map.fromCloud)};
//                          console.log(JSON.stringify(result));
                          all[x] = result;
                      });
    return all;
};

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counter = -1;
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var self = this;
        this.state.counter = this.state.counter + 1;
        var deviceIds = this.$.iot.listDevices();
        deviceIds.forEach(function(x) {
                              var map = self.$.iot.getIoT(x);
                              map.fromCloud.counter = self.state.counter;
                          });
        this.$.session.boundQueue(MAX_NUM_NOTIF, 'default');
        this.$.session.notify([this.state.counter,
                               getDevicesState(this)], 'default');
        cb(null);
    },
    'inference' : function(query, cb) {
        this.$.jsonrpc.invoke('cog', 'inference', [query], cb);
    },
    'learn' : function(query, result, cb) {
        this.$.jsonrpc.invoke('cog', 'learn', [query, result], cb);
    },
    'reset' : function(cb) {
        this.$.jsonrpc.invoke('cog', 'reset', [], cb);
    },
    'addGadget' : function(gadgetId, cb) {
        this.$.iot.addIoT(gadgetId);
        cb(null, "ok");
    },
    'changeOutput' : function(gadgetId, pin, isOn, cb) {
        var map = this.$.iot.getIoT(gadgetId);
        var outputs = map.fromCloud.outputs || 0;
        outputs = (isOn ? outputs | (1 << pin) :
                   outputs & (~(1 << pin)));
        map.fromCloud.outputs = outputs;
        cb(null, "ok");
    },
    'listGadgets': function(cb) {
        cb(null,  this.$.iot.listDevices());
    },
    'getSensorData': function(cb) {
        cb(null, {gadgets: getDevicesState(this)});
    }
};


caf.init(__dirname, {});

