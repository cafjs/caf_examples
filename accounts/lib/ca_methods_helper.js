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
var sec_util = require('caf_security').util;

exports.loadKeys = function(self, cb) {
    var pubFile = self.$.prop.get('pubFile') || 'rsa_pub.pem';
    var privFile = self.$.prop.get('privFile') || 'rsa_priv.pem';
    var keysDir = self.$.prop.get('keysDir') || __dirname;
    async.parallel({
                       pubKey: function(cb0) {
                           sec_util.loadKey(pubFile, keysDir, cb0);
                       },
                       privKey: function(cb0) {
                           sec_util.loadKey(privFile, keysDir, cb0);
                     }
                   },
                   function(err, results) {
                       if (err) {
                           cb(err);
                       } else {
                           self.scratch.keys = results;
                           cb(null);
                       }
                   });
};
