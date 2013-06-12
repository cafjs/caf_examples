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
 * Starts playing the sound file after certain delay.
 *
 *
 */

var Speaker = require('speaker');
var Stream = require('stream').Stream;
var Reader = require('wav').Reader;
var util = require('util');
var fs = require('fs');

var Player = exports.Player = function(fileName, delay) {
    Stream.call(this);
    this.readable = false;
    this.writable = true;
    this.fileName = fileName;
    this.zeroTime = new Date().getTime();
    this.delay = delay;
};

util.inherits(Player, Stream);

Player.prototype.write = function (data) {
    this.zeroTime = data;
    return true;
};

Player.prototype.end = function() {
    var self = this;
    var fn = function() {
        var reader = new Reader();
        reader.on('format', function (format) {
                      var s = new Speaker(format);
                      reader.pipe(s);
                  });
        reader.on('error', function (err) {
                      console.error('Reader error: %s', err);
                  });
        fs.createReadStream(self.fileName).pipe(reader);
    };
    var now = new Date().getTime();
    var realDelay = this.delay - (now - this.zeroTime);
    if (realDelay > 0) {
        setTimeout(fn, realDelay);
    } else {
        console.log("Error: delay " + this.delay + " is too short");
    }
};
