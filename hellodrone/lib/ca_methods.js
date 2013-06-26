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

var MAX_NUM_NOTIF = 2;

var getDevicesState = function(self) {
    var all = {};
    var deviceIds = self.$.iot.listDevices();
    deviceIds.forEach(function(x) {
                          var map = self.$.iot.getIoT(x);
                          var result =
                              {toCloud: myutils.clone(map.toCloud),
                               fromCloud: myutils.clone(map.fromCloud)};
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

/* System properties are:
 *
 *  'control:euler_angle_max' (between 0 and 0.52, i.e., 30 degrees or PI/6).
 *
 *  'control:altitud_max'  in millimeters
 *
 *  'control:control_vz_max' Max vertical speed  in milimeters per second
 * (max 2000)
 *
 *  'control:control_yaw' Max yaw speed in radians per second (max 6.11 rad/s
 * or 350 degrees per second)
 *
 *  'control:outdoor' true to enable wind estimator
 *
 *  'control:flight_without_shell'  true if the outdoor hull is on.
 *
 *  'video:video_codec' set to 'H264_720P_CODEC' for live stream 720P
 * otherwise 360P.
 *
 */
    'setProperty' : function(droneId, name, value, cb) {
        var map = this.$.iot.getIoT(droneId);
        var fromCloud = map && map.fromCloud;
        if (fromCloud) {
            fromCloud[name] = value;
            cb(null, "ok");
        } else {
            cb("Drone id not found:" + droneId);
        }
    },

/*
 *  'command' is a string representing a JSON serialized operation of the form:
 *
 *  Array.<{when: <number>, relative: <boolean>, op: <string>,
 *          args: Array.<JSONSerializableObject>}>
 *
 * 'when' is UTC time (in miliseconds since 1/1/1970) or offset to perform the
 *  task.
 *
 * 'relative' is whether 'when' is wall clock time or an offset from the start
 *  of the previous task.
 *
 * 'op' is one of:
 *      'takeoff'  - no args
 *
 *      'land'     -no args
 *
 *      'emergency'  - no args -  Drone stops by cutting off the engine
 *
 *      'stop' - no args- Drone hovers in place
 *
 *      'move' -with arguments:
 *                 [roll, pitch, gaz, yaw]
 *               all of them are floating point numbers [-1.0...1.0]
 *  representing a relative value to a maximum threshold property:
 *
 *               'roll'  is left/right tilt with maximum angle defined with
 *  property control:euler_angle_max (between 0 and 0.52, i.e., 30 degrees or
 *  PI/6).
 *               'pitch' is front/back tilt with maximum angle defined with
 *  property 'control:euler_angle_max'.
 *               'gaz' is vertical speed with maximum speed defined with
 *  property 'control:control_vz_max' (going up is positive)
 *               'yaw' is angular speed (clockwise is positive) with maximum
 *  angular speed defined with property 'control:control_yaw'
 *
 *      'blink' -with arguments:
 *                  [ledAnimation, rate, duration]
 *
 *       and 'ledAnimation' is any of 'blinkGreenRed', 'blinkGreen', 'blinkRed',
 * 'blinkOrange', 'snakeGreenRed', 'fire', 'standard', 'red', 'green',
 * 'redSnake','blank', 'rightMissile', 'leftMissile', 'doubleMissile',
 * 'frontLeftGreenOthersRed', 'frontRightGreenOthersRed',
 * 'rearRightGreenOthersRed','rearLeftGreenOthersRed', 'leftGreenRightRed',
 * 'leftRedRightGreen','blinkStandard'
 *            'rate' is #blinks per second
 *            'duration' is length of animation in seconds
 *
 *      'video' -with arguments:
 *                 [IP address, port, bottomCamera]
 *       to stream video using a tcp socket with destination <IP, port>
 *       or stop sending video if no arguments.
 *                 'bottomCamera' is true if we control the ground camera.
 *
 *
 * The sequence of tasks in 'command' should be sorted by starting time.
 *
 */
    'doCommand': function(droneId, command, cb) {
        this.$.iot.addCommand(droneId, command);
        cb(null, "ok");
    },
    'listDrones': function(cb) {
        cb(null,  this.$.iot.listDevices());
    },
    'getSensorData': function(cb) {
        cb(null, {drones: getDevicesState(this)});
    }
};


caf.init(__dirname, {});

