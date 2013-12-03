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
var caf_ardrone =require('caf_ardrone');

var MAX_HISTORY = 10;

var MAX_NUM_NOTIF = 2;

var SHUFFLE_DELAY= 5000;  // 5 seconds

var FRONT_BACK_SPEED = 0.5;

var FRONT_BACK_TIME = 1000;

var LEFT_RIGHT_SPEED = [0, 0.5, 0.5];

var LEFT_RIGHT_TIME = [0, 1000, 1500];

var UP_DOWN_SPEED = 0.8; //Speed of UP and DOWN

var UP_DOWN_DELAY = 5000; //Time from when command is sent until movement starts

var UP_DOWN_TIME = 1500; //How long the drone moves up/down for

var UP_DOWN_WAIT = 1000; //Time between moving up and moving down

var DOWN_START = UP_DOWN_TIME + UP_DOWN_WAIT; //Time when the drone 1 starts moving down and drone 2 starts moving up

var TAKEOFF_WAIT=5000; // wait until stabilizes

var MAX_DRONES = 5;
var LAND_WAIT= MAX_DRONES*DOWN_START;

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
                          var result = {};
                          if (map) {
                              result.toCloud = (map.toCloud ?
                                                clone(map.toCloud) : {});
                              result.fromCloud = (map.fromCloud ?
                                                  clone(map.fromCloud) : {});
                          }
//                          console.log(JSON.stringify(result));
                          all[x] = result;
                      });
    return all;
};

// shuffle a drone by first moving to the front or back (or stay put)
var shuffleOne = function(front, back, start, end) {
    var shift = end -start;
    if ((shift == 0) || (front && back)) {
        return null;
    } else {
        var b =  new caf_ardrone.ArDroneBundle();
        var nextDelay = 0;
        if (front) {
            b.move(0, -FRONT_BACK_SPEED, 0, 0, nextDelay);
            nextDelay = FRONT_BACK_TIME;
        }
        if (back) {
            b.move(0, FRONT_BACK_SPEED, 0, 0, nextDelay);
            nextDelay = FRONT_BACK_TIME;
        }

        if (shift < 0) {
            b.move(LEFT_RIGHT_SPEED[-shift], 0, 0, 0, nextDelay);
            nextDelay = LEFT_RIGHT_TIME[-shift];
        } else {
            b.move(-LEFT_RIGHT_SPEED[shift], 0, 0, 0, nextDelay);
            nextDelay = LEFT_RIGHT_TIME[shift];
        }

        if (front) {
            b.move(0, FRONT_BACK_SPEED, 0, 0, nextDelay);
            nextDelay = FRONT_BACK_TIME;
        }
        if (back) {
            b.move(0, -FRONT_BACK_SPEED, 0, 0, nextDelay);
            nextDelay = FRONT_BACK_TIME;
        }
        b.stop(nextDelay);
        return b.toJSON();
    }
};


var computeShuffle = function(startPos, endPos) {
    var response = [];
    if (!Array.isArray(startPos) || !Array.isArray(endPos) ||
        (startPos.length !== endPos.length) || (startPos.length !== 3)) {
        return null;
    } else {
        var shuffle = [];
        for (var i = 0; i < startPos.length; i++) {
            for (var j = 0; j < endPos.length; j++) {
                if (startPos[i] === endPos[j]) {
                    shuffle.push(j);
                    break;
                }
            }
        }
        if (shuffle.length !== startPos.length) {
             return null;
        } else {
            response.push(shuffleOne(true, false, 0, shuffle[0]));
            response.push(shuffleOne(false, false, 1, shuffle[1]));
            response.push(shuffleOne(false, true, 2, shuffle[2]));
            return response;
        }
    }

};


var newUpDownBundle = function(takeoff, i) {
    var b =  (new caf_ardrone.ArDroneBundle());
    if (takeoff) {
	b.takeoff(0)
            .move(0,0,UP_DOWN_SPEED,0,TAKEOFF_WAIT+i*DOWN_START)
	    .stop(UP_DOWN_TIME)
	    .move(0,0,-UP_DOWN_SPEED,0,UP_DOWN_WAIT)
	    .stop(UP_DOWN_TIME)
            .land(LAND_WAIT-i*DOWN_START);

    } else {
	b.move(0,0,UP_DOWN_SPEED,0,i*DOWN_START)
	    .stop(UP_DOWN_TIME)
	    .move(0,0,-UP_DOWN_SPEED,0,UP_DOWN_WAIT)
	    .stop(UP_DOWN_TIME);
    }
	//.blink('blinkGreen',1,10,0)
    return b.toJSON();
};


var addToHistory = function(self, record) {
    if (!self.state.history) {
        self.state.history = [];
    }
    var history = self.state.history;

    if (history.length >= MAX_HISTORY) {
        history.shift();
    }
    history.push(record);
};


exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counter = -1;
        this.state.history = [];
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
        var record = [this.state.counter, getDevicesState(this)];
        addToHistory(this, record);
        this.$.session.notify(record, 'default');
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
        if (typeof droneId === 'string') {
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
            var all = (Array.isArray(droneId) ? droneId :
                       this.$.iot.listDevices());
            async.map(all, function(id, cb0) {
                          if (typeof id === 'string') {
                              self.configProperty(id, props, cb0);
                          }
                      }, cb);
        }
    },
    'doBundle': function(droneId, when, bundle, cb) {
        var command = {when: when, bundle: bundle};
        if (typeof droneId === 'string') {
            this.$.iot.addCommand(droneId, JSON.stringify(command));
            cb(null, "ok");
        } else {
            // null id means all of them
            var self = this;
            var all = (Array.isArray(droneId) ? droneId :
                       this.$.iot.listDevices());
            async.map(all, function(id, cb0) {
                          if (typeof id === 'string') {
                              self.doBundle(id, when, bundle, cb0);
                          }
                      }, cb);
        }
    },
    'listDrones': function(cb) {
        cb(null,  this.$.iot.listDevices());
    },
    'getSensorData': function(cb) {
        cb(null, {drones: getDevicesState(this)});
    },
    'getHistorySensorData' : function(cb) {
        // 'history' is an array of tuples [timestamp, devicesState]
        cb(null, this.state.history || []);
    },
    'shuffle': function(startPos, endPos, cb) {
        var self = this;
        var bundles = computeShuffle(startPos, endPos);
        if (!Array.isArray(bundles) || (bundles.length !== startPos.length)) {
            cb('Error: Cannot shuffle: start ' + JSON.stringify(startPos) +
               ' end ' + JSON.stringify(endPos));
        } else {
            var when = (new Date()).getTime() + SHUFFLE_DELAY;
            var all = [];
            startPos.forEach(function(id, i) {
                                 all.push({id: id, bundle: bundles[i]});
                             });
            async.mapSeries(all, function(p, cb0) {
                                if ((typeof p.id === 'string') &&
                                    (typeof p.bundle === 'string')) {
                                    self.doBundle(p.id, when, p.bundle, cb0);
                                } else {
                                    // Ignore
                                    cb0(null);
                                }
                            }, cb);
        }
    },
    'registerUpDown': function(droneSequence, cb) {
        if (!Array.isArray(droneSequence) ) {
	    cb('registerUpDown:Error: bad input' + droneSequence);
	} else {
            this.state.droneSequence = droneSequence;
            cb(null, 'ok');
        }
    },
    // order is an array with index numbers in droneSequence
    'upDown': function(order, takeoff, cb) {
	var self = this;
	if ( !Array.isArray(order) ) {
	    cb('upDown: Error: Bad input' + order);
	} else if (!Array.isArray(this.state.droneSequence)) {
            cb('upDown: Error: Register drone sequence first');
        } else {
            var when = (new Date()).getTime() + UP_DOWN_DELAY;
	    var all = [];
	    order.forEach(function(index, i) {
		              var bundle = newUpDownBundle(takeoff, i);
                              var id = self.state.droneSequence[index];
		              all.push({id: id, bundle: bundle, when: when});
                          });
            async.mapSeries(all, function(p, cb0) {
		                if (typeof p.id === 'string') {
		                    self.doBundle(p.id, p.when, p.bundle, cb0);
		                } else {
                                    // ignore
		                    cb0(null);
		                }
	                    }, cb);
        }
    }
};


caf.init(__dirname, {});

