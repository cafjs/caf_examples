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

var SLACK = 10;// ten seconds left to expire

var findExpired = function(state) {
    var now = (new Date()).valueOf();
    var nowSlack = now + SLACK * 1000;
    var expired = [];
    if ((state.megaToken) && (state.megaToken.expires > now)) {
        for (var key in state.apps) {
            var val = state.apps[key];
            if (val.token.expires < nowSlack) {
                expired.push(val);
            }
        }
    }
    return expired;
};

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.apps = {};
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = cp && cp.state;
        this.state = this.state || {};
        this.state.apps = this.state.apps || {};
        this.refreshTokens(this.state.megaToken, cb);
    },

    '__ca_pulse__' : function(cb) {
        this.refreshTokens(this.state.megaToken, cb);
    },
    'refreshTokens': function(megaToken, cb) {
        if (megaToken && (megaToken !== this.state.megaToken)) {
            this.state.megaToken = megaToken;
        }
        var self = this;
        var expired = findExpired(this.state);
        var countOK = 0;
        var attenuateF = function(val, cb0) {
            async.waterfall([function(cb1) {
                                 self.$.security
                                     .attenuateToken(self.state.megaToken,
                                                     val.appName,
                                                     val.caLocalName,
                                                     cb1);
                             }],
                            function(err, token) {
                                if (err) {
                                    console.log('Pulse error1:' +
                                                JSON.stringify(err));
                                } else {
                                    val.token = token;
                                    countOK++;
                                }
                                cb0(null); // do not stop others
                            });
        };
        async.forEachSeries(expired, attenuateF, function(err) {
                                if (err) {
                                    console.log('Pulse error2:' +
                                                JSON.stringify(err));
                                }
                                if (countOK > 0) {
                                    self.$.session.notify({'renewed' : countOK},
                                                          'default');
                                }
                                // do not undo the ones renewed OK
                                cb(null);
                            });
    },
    'addApp' : function(appName, caOwner, caLocalName, megaToken, cb) {
        var self = this;
        if (this.$.security && (caOwner !== this.$.security.getOwner())) {
            cb('caOwner:' + caOwner + ' !== getOwner():' +
               this.$.security.getOwner());
        } else {
            this.state.megaToken = megaToken;
            async.waterfall([function(cb0) {
                                self.$.security
                                     .attenuateToken(megaToken, appName,
                                                     caLocalName, cb0);
                             }],
                            function(err, token) {
                                if (err) {
                                    cb(err);
                                } else {
                                    self.state
                                        .apps[appName + '#' + caLocalName] =
                                        {appName: appName, caOwner: caOwner,
                                         caLocalName: caLocalName,
                                         token: token};
                                    cb(null, token);
                                }
                            });
        }
    },
    'deleteApp' : function(appName, caLocalName, cb) {
        delete this.state.apps[appName + '#' + caLocalName];
        cb(null, 'ok');
    },
    // pass unrestricted token to refresh expired tokens
    'listApps' : function(megaToken, cb) {
        this.state.megaToken = megaToken;
        var response = [];
        for (var key in this.state.apps) {
            response.push(this.state.apps[key]);
        }
        cb(null, response);
    }
};


caf.init(__dirname, {});

