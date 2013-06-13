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
 * Finds clicks in a sound file, uploads to a CA instructions to mimic those
 * clicks, and plays the sound file after a globally synchronized delay.
 *
 *
 */
var fs = require('fs');
var Reader = require('wav').Reader;
var Segmenter = require('./Segmenter').Segmenter;
var Uploader = require('./Uploader').Uploader;
var Player = require('./Player').Player;


var DELAY = 5000;


/**
 * Main method.
 *
 * The type cloudSpecType is:
 *
 *  { url: string, // complete CA URL, e.g.,
 *                 //   'http://helloiot.cafjs.com/ca/antonio_h2'
 *    device: string, // ID of the target device
 *    password: string,
 *    accountsUrl: string, //Authentication service url
 *    proxy: string, // http proxy url , e.g.,
 *    delay: number // optional delay before start playing
 * }
 *
 *
 * @param {string} fileName A sound file name.
 * @param {cloudSpecType} cloudSpec A configuration map.
 *
 *
 */
exports.main = function(fileName, cloudSpec) {
    var delay = cloudSpec.delay || DELAY;
    var reader = new Reader();
    reader.on('format', function (format) {
                  //console.error('format:', format);
                  var seg = new Segmenter(format);
                  var uploader = new Uploader(delay, cloudSpec);
                  var player = new Player(fileName, delay);
                  reader.pipe(seg).pipe(uploader).pipe(player);
              });

    reader.on('error', function (err) {
                  console.error('Reader error: %s', err);
              });
    fs.createReadStream(fileName).pipe(reader);

};
