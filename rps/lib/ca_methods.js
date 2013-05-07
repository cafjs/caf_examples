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

var NUM_PIN_INPUT = 3;
var inputFromPin = function(pins) {
    for (var i =0; i< NUM_PIN_INPUT ; i++) {
        if ((1<< i) & pins) {
            // lower non-zero pin wins
            return i;
        }
    }
    return -1;
};

var PIN_OUTPUT_SHIFT = 5;
var pinFromOutput = function(newOut, lastPin) {
    lastPin = lastPin || 0;
    var mask = (1 <<  PIN_OUTPUT_SHIFT) -1;
    if (newOut < 0) {
        return (lastPin & mask);
    } else {
        // leave lower pins untouched, output pins are 7,6 and 5
        return ((1 << (newOut +  PIN_OUTPUT_SHIFT)) | (lastPin & mask));
    }
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
        async.forEach(deviceIds, function(x, cb0) {
                       var map = self.$.iot.getIoT(x);
                       var cb1 = function (err, newOut) {
                           if (err) {
                               cb0(err);
                           } else {
                               map.fromCloud.counter = self.state.counter;
                               map.fromCloud.outputs =
                                   pinFromOutput(newOut, map.fromCloud.outputs);
                               cb0(null);
                           }
                       };
                       var input = inputFromPin(map.toCloud.inputs);
                       if (input >= 0) {
                           self.inference(input, cb1);
                       } else {
                           cb1(null, input);
                       }
                   }, function (err) {
                       if (err) {
                           console.log("Got error " + JSON.stringify(err));
                           cb(err);
                       } else {
                           self.$.session.boundQueue(MAX_NUM_NOTIF, 'default');
                           self.$.session.notify([self.state.counter,
                                                  getDevicesState(self)],
                                                 'default');
                           cb(null);
                       }
                   });
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

