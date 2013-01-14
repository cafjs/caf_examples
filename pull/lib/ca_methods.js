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
var crypto = require('crypto');
var fs = require('fs');

exports.methods = {
    // framework methods
    '__ca_init__' : function(cb) {
        this.scratch.resources = {};
        this.state.autoOn = false;
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.scratch.resources = {};
        cb(null);
    },

    '__ca_pulse__' : function(cb) {
        if (this.state.autoOn) {
            this.forceRefresh(cb);
        } else {
            cb(null);
        }
    },

    //handler methods
    'updatedFile' : function(alias, fileName, version, cb) {
        console.log('Got updated file notification: alias:' + alias +
                    ' fileName:' + fileName + ' version:' + version);
        if (this.scratch.resources[alias] &&
            this.scratch.resources[alias].version === version) {
            console.log('No Change for ' + fileName);
            cb(null);  // next message
        } else {
            var shasum = crypto.createHash('sha1');
            var self = this;
            // TO DO: should stream instead...
            fs.readFile(fileName, function(err, data) {
                            if (err) {
                                console.log('cannot read' + fileName);
                            } else {
                                shasum.update(data);
                                var hash = shasum.digest('hex');
                                self.scratch.resources[alias] =
                                    {'version' : version, 'hash': hash};
                            }
                            self.$.session.notify({'fileName' : fileName,
                                                   'version' : version},
                                                  'default');
                            cb(null);   // next message
                        });
        }
    },

    // Externally visible methods
    'addResource' : function(alias, url, cb) {
        this.$.pull.addResource(alias, url, 'updatedFile');
        cb(null, 'ok');
    },
    'removeResource' : function(alias, cb) {
        this.$.pull.removeResource(alias);
        cb(null, 'ok');
    },

    'listResources' : function(cb) {
        var all = this.$.pull.listResources();
        var result = {};
        for (var i = 0; i < all.length; i++) {
            var hash = this.scratch.resources[all[i]] &&
                this.scratch.resources[all[i]].hash;
            result[all[i]] = (hash ? hash : 'no idea');
        }
        cb(null, {resources: result, autoOn: this.state.autoOn});
    },
    'forceRefresh' : function(cb) {
       // check files for changes
        var self = this;
        var resources = this.$.pull.listResources();
        resources.forEach(function(alias) {
                              self.$.pull.refreshResource(alias);
                          });
        cb(null);
    },
    'autoMode' : function(autoOn, cb) {
        this.state.autoOn = autoOn;
        cb(null);
    }
};

caf.init(__dirname, {});

