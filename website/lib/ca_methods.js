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
        var cb1 = function(err, newTokens) {
          if (err) {
              cb(err);
          } else {
              newTokens.forEach(function(token, i) {
                                    expired[i].token = token;
                                });
              self.$.session.notify({'renewed' : expired.length}, 'default');
              cb(null);
          }
        };
        if (expired.length > 0) {
            this.$.security.attenuateToken(this.state.megaToken, expired, cb1);
        } else {
            cb(null);
        }
    },
    'addApp' : function(appName, caOwner, caLocalName, megaToken, cb) {
        var self = this;
        if (this.$.security && (caOwner !== this.$.security.getOwner())) {
            cb('caOwner:' + caOwner + ' !== getOwner():' +
               this.$.security.getOwner());
        } else {
            this.state.megaToken = megaToken;
            async.waterfall([function(cb0) {
                                 var tokenDesc = {appName: appName,
                                                  caLocalName: caLocalName};
                                 self.$.security
                                     .attenuateToken(megaToken, tokenDesc, cb0);
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

