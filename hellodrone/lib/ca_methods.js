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
var myutils = caf.myutils;
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
                          console.log(JSON.stringify(result));
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
    'addDrone' : function(droneId, cb) {
        this.$.iot.addIoT(droneId);
        cb(null, "ok");
    },
    'removeDrone' : function(droneId, cb) {
        this.$.iot.removeIoT(droneId);
        cb(null, "ok");
    },
    'configProperty' : function(droneId, props, cb) {
        if (droneId) {
            var map = this.$.iot.getIoT(droneId);
            var fromCloud = map && map.fromCloud;
            if (fromCloud) {
                var config = fromCloud.config || {};
                myutils.mix(config, props || {});
                fromCloud.config = config;
                cb(null, "ok");
            } else {
                cb("Drone id not found:" + droneId);
            }
        } else {
            // null id means all of them
            var self = this;
            async.map(this.$.iot.listDevices(), function(id, cb0) {
                          self.configProperty(id, props, cb0);
                      }, cb);
        }
    },
    'doBundle': function(droneId, when, bundle, cb) {
        var command = {when: when, bundle: bundle};
        if (droneId) {
            this.$.iot.addCommand(droneId, JSON.stringify(command));
            cb(null, "ok");
        } else {
            // null id means all of them
            var self = this;
            async.map(this.$.iot.listDevices(), function(id, cb0) {
                          self.doBundle(id, when, bundle, cb0);
                      }, cb);
        }
    },
    'listDrones': function(cb) {
        cb(null,  this.$.iot.listDevices());
    },
    'getSensorData': function(cb) {
        cb(null, {drones: getDevicesState(this)});
    }
};


caf.init(__dirname, {});

