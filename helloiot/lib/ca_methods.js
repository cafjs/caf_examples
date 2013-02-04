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

var getDevicesState = function(self) {
    var all = {};
    var deviceIds = self.$.iot.listDevices();
    deviceIds.forEach(function(x) {                              
                          var map = self.$.iot.getIoT(x);
                          var result = {};
                          var keys =  Object.keys(map.toCloud);
                          console.log(JSON.stringify(keys));
                          keys.forEach(function(key) {
                                           result[key] = map.toCloud[key];
                                       });
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
        if (this.state.counter % 5 == 0) {
            this.$.session.notify([this.state.counter,
                                   getDevicesState(this)], 'default');
        }
        cb(null);
    },
    'addGadget' : function(gadgetId, cb) {        
        this.$.iot.addIoT(gadgetId);
        cb(null, "ok");
    },
    'doCommand': function(gadgetId, command, cb) {
        this.$.iot.addCommand(gadgetId, command);
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

