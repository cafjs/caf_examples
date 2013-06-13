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

/**
 * Uploads a timed sequence of events to a CA.
 *
 *
 */


var Stream = require('stream').Stream;
var util = require('util');
var cli = require('caf_cli');

var PIN_NUMBER = 0;

var Uploader = exports.Uploader = function(delay, cloudSpec) {
    Stream.call(this);
    this.readable = true;
    this.writable = true;
    this.delay = delay;
    this.data = "";
    this.cloudSpec = cloudSpec;
    this.cloudSpec.disableBackChannel = true;
};

util.inherits(Uploader, Stream);

Uploader.prototype.write = function (data) {
    this.data = data;
    return true;
};

Uploader.prototype.end = function() {

    var zeroTime = new Date().getTime();
    var startTime = zeroTime + this.delay;
    if (this.data) {
        var command = [];
        this.data.forEach(function(x) {
                              var time = startTime + x.start;
                              command.push({op: 'blink',
                                            args: [time, x.duration,
                                                   PIN_NUMBER]});
                          });
        var session = new cli.Session(this.cloudSpec);
        var self = this;
        var cb = function(err, data) {
            if (err) {
                console.log("Got error: " + JSON.stringify(err));
                self.emit('error', err);
            } else {
                console.log("Response: " + JSON.stringify(data));
                self.emit('data', zeroTime);
                self.emit('end');
            }
        };
        session.remoteInvoke('doCommand', [this.cloudSpec.device,
                                           JSON.stringify(command)], cb);
    } else {
        console.log("Error: No data to upload");
        this.emit('error',"Error: No data to upload");
    }
};
