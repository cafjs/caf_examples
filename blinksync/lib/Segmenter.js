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
 * Stream that analyzes sound to detect clicks.
 *
 * It uses a very crude algorithm that only works when there is no significant
 * background noise.
 *
 * It first estimates the average power and thresholds sound snippets
 *  based on that average. Then, it patches the output to eliminate or extend
 * short clicks.
 *
 *
 */
var Stream = require('stream').Stream;
var util = require('util');

var WINDOW_SIZE_MSEC = 10;
var MIN_INTERVAL = 4; // minimum number of WINDOW_SIZE_MSEC in an interval


var Segmenter = exports.Segmenter = function(format) {
    Stream.call(this);
    this.readable = true;
    this.writable = true;
    this.bitDepth = format.bitDepth;
    if (this.bitDepth !== 16) {
        console.log("Bit depth not supported: " + this.bitDepth);
        process.exit(1);
    }
    this.sampleRate = format.sampleRate;
    this.nWindow = Math.round((WINDOW_SIZE_MSEC *this.sampleRate)/1000);
    this.channels = format.channels;
    this.allBuf = [];
    this.allChunks = [];

};

util.inherits(Segmenter, Stream);

Segmenter.prototype.write = function (data) {
    if (Buffer.isBuffer(data)) {
        var nSamples = data.length/(2*this.channels);
        var dataI16 = new Int16Array(data);
        for (var i=0; i< nSamples; i++) {
            var power = 0;
            for (var j =0; j < this.channels; j++) {
                power = power + dataI16[this.channels*i+j]*
                    dataI16[this.channels*i+j];
            }
            power = power/this.channels;
            this.allBuf.push(power);
            if (this.allBuf.length === this.nWindow) {
                var total = 0;
                this.allBuf.forEach(function(x) { total = total + x; });
                total = total/this.nWindow;
                this.allChunks.push(total);
                this.allBuf = [];
            }
        }
    } else {
        console.log("Ignoring: " + data);
    }
    return true;
};

/*
 * Data emitted only after processing all the input.
 *
 * Format is Array.<{start: integer, duration: integer}>
 *
 */
Segmenter.prototype.end = function() {
    /* Ignore last non-completed buffer*/
    var all = 0;
    this.allChunks.forEach(function(x) { all = all +x;});
    var meanPower = all/this.allChunks.length;
    var levels = [];
    this.allChunks.forEach(function(x) {
                               var level =  (x > meanPower ? 1 : 0);
                               levels.push(level);
                           });
    for (var i=1; i< levels.length-1; i++) {
        if (!levels[i] && levels[i-1] && levels[i+1]) {
            levels[i] = 1;
        }
    }

    var intervals = [];
    var up = false;
    var count = 0;
    var start = 0;
    for (i =0; i< levels.length; i++) {
        if (up) {
            if (levels[i]) {
                count = count + 1;
            } else {
                if (count < MIN_INTERVAL) {
                    levels[i] = 1;
                    i = i - 1;
                } else {
                    up = false;
                    intervals.push({start: start*WINDOW_SIZE_MSEC,
                                    duration: count*WINDOW_SIZE_MSEC});
                    start = 0;
                    count = 0;
                }
            }
        } else {
            if (levels[i]) {
                start = i;
                count = 1;
                up = true;
            }
        }
    }
    if (up) {
        intervals.push({start: start*WINDOW_SIZE_MSEC,
                        duration: count*WINDOW_SIZE_MSEC});
    }
    this.emit('data', intervals);
    this.emit('end');

};
