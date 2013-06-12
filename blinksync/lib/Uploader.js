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

var Uploader = exports.Uploader = function(delay) {
    Stream.call(this);
    this.readable = true;
    this.writable = true;
    this.delay = delay;
    this.data = "";

};

util.inherits(Uploader, Stream);

Uploader.prototype.write = function (data) {

    this.data = data;
    return true;
};

Uploader.prototype.end = function() {

    var zeroTime = new Date().getTime();
    console.log(JSON.stringify(this.data));
    this.emit('data', zeroTime);
    this.emit('end');

};
