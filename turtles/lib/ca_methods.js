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
var helper = require('./ca_methods_helper');

/*
 * Life-cycle of an app:
 *
 * 1) Client calls addAp and that triggers a file pull in the background.
 * 2) When tar file is locally cached, this CA gets an 'updatedFile' message.
 * 3) If new version: Compute hash of file and notify client of a candidate
 *    app for deployment.
 *
 *   Otherwise just ignore it.
 *
 * 4) Client calls deployApp to asynchronously trigger the deployment
 *
 * Periodically the CA checks for new versions of registered apps and the
 * state of  deployed ones. If anything changes it notifies the client
 * (with 'refresh') and the client  will call 'listApps' to get the latest
 * state.
 *
 * When done with the app the client calls 'removeApp'.
 *
 */

exports.methods = {
    // framework methods

    /*
     * 'apps' is of type {<string>: <appItem> }  where appItem is
     * {'name' : <string>, 'hash': <string>, 'state': <string>,
     * 'url': <string>, 'version' : <string>, 'confirmed' : boolean}
     *
     * and the <string> key is the same as appItem.name.
     *
     * 'version' is not necessarily based on file contents (ETag http header
     * field) and we need a hash to guarantee no corruption. However, we use it
     * as a cheap mechanism to filter duplicates.
     *
     * 'confirmed' means that the client has given permission to deploy
     * this version of the app.
     *
     */
    '__ca_init__' : function(cb) {
        this.state.apps = {};
        this.state.autoOn = true;
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = cp && cp.state;
        this.state = this.state || {};
        this.state.apps = this.state.apps || {};
        cb(null);
    },

    '__ca_pulse__' : function(cb) {
        if (this.state.autoOn) {
            this.forceRefresh(cb);
        } else {
            // check deployed apps for state changes
            this.$.deploy.refreshInfo('updatedDeployedApps');
            cb(null);
        }
    },

    //handler methods
    'updatedFile' : function(alias, fileName, version, cb) {
        this.$.log && this.$.log.trace('Got updated file notification: alias:' 
                                       + alias + ' fileName:' + fileName
                                       + ' version:' + version);
        var appInfo = this.state.apps[alias];
        if (!appInfo) {
            console.log('Ignoring unknown app ' + alias);
            cb(null);  // next message
        } else if (appInfo.version === version) {
            console.log('No Change for ' + fileName);
            cb(null);  // next message
        } else {
            var self = this;
            helper.hashFile(fileName, function(err, hash) {
                                if (err) {
                                    console.log('got hash file error' +
                                                JSON.stringify(err));
                                    cb(null);
                                } else {
                                    appInfo.version = version;
                                    appInfo.fileName = fileName;
                                    appInfo.hash = hash;
                                    var res = {'op' : 'deploy',
                                               'appInfo' : appInfo};
                                    self.$.session.notify(res, 'default');
                                    cb(null);   // next message
                                }
                            });
        }
    },
    'updatedDeployedApps': function(cb) {
        var appsInfo = this.$.deploy.getAppsInfo();
        this.$.log && this.$.log.trace('Got deployed app notification:' +
                                       JSON.stringify(appsInfo));
        var changed = false;
        for (var appName in appsInfo) {
            var appInfo = this.state.apps[appName];
            if (appInfo) {
                if (appInfo.state !== appsInfo[appName].state) {
                    changed = true;
                    appInfo.state = appsInfo[appName].state;
                }
            }
        }
        if (changed) {
            this.$.session.notify({'op' : 'refresh'}, 'default');
        }
        cb(null);
    },

    // Externally visible methods
    'addApp' : function(appItem, cb) {
        this.state.apps[appItem.name] = appItem;
        this.$.pull.addResource(appItem.name, appItem.url, 'updatedFile');
        cb(null, 'ok');
    },
    'removeApp' : function(appItem, cb) {
        if (!this.state.apps[appItem.name] ||
            (this.state.apps[appItem.name].hash !== appItem.hash)) {
            cb(null, 'not found');
        } else {
            this.$.pull.removeResource(appItem.name);
            if (this.state.apps[appItem.name].confirmed) {
                this.$.deploy.deleteApp(appItem.name);
            }
            delete this.state.apps[appItem.name];
            cb(null, 'ok');
        }
    },
    'deployApp' : function(appItem, cb) {
        if (!this.state.apps[appItem.name] ||
            (this.state.apps[appItem.name].hash !== appItem.hash)) {
            cb(null, 'not found');
        } else {
            this.state.apps[appItem.name].confirmed = true;
            this.$.deploy.deployApp(appItem.name,
                                    this.state.apps[appItem.name].fileName);
            this.$.log && this.$.log.trace("ca_methods:deployApp: " 
                                           + JSON.stringify(appItem));
            cb(null, 'ok');
        }
    },
    'listApps' : function(cb) {
        this.$.log && this.$.log.trace("ca_methods:listApps " +
                                       JSON.stringify(this.state.apps));
        cb(null, {apps: this.state.apps, autoOn: this.state.autoOn});
    },
    'forceRefresh' : function(cb) {
       // check files for changes
        var self = this;
        var resources = this.$.pull.listResources();
        resources.forEach(function(alias) {
                              self.$.pull.refreshResource(alias);
                          });
        // check deployed apps for state changes
        this.$.deploy.refreshInfo('updatedDeployedApps');
        cb(null);
    },
    'autoMode' : function(autoOn, cb) {
        this.state.autoOn = autoOn;
        cb(null);
    }

};

caf.init(__dirname, {});

