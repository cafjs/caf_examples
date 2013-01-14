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
var path = require('path');
var sec_util = require('caf_security').util;
var async = caf.async;

var loadKeys = function(self, cb) {
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

/*
 * Tokens are the primary mechanism to implement constrained delegation
 * in CAF. A token is typically used by the front-end of an app (running in
 * the client device) to create a secure session with its corresponding CA
 * (running in the cloud). A simple way to do that would be to authenticate
 *  with the client's credentials (e.g., username/password). However,
 * we want to create instances of apps (with CAs) implemented by less trusted
 * third parties, and we may not want to share login credentials with them.
 *
 * Instead, we just create and handover a token that can only be used to
 * authenticate the client in a restricted context. For example, for a limited
 * period of time or just for a particular app or just for a particular CA in
 * an app or for all the apps published by certain trusted party...
 *
 *  The first time a user  logs in it gets an unrestricted token for
 * his/her account. Then, before handing this token to a third party, it could
 * restrict it using  'restrictToken'. This third-party could restrict
 * it further before giving it to someone else and so on...
 *
 * Tokens are signed with a private key and all apps supporting single sign-on
 * should have its corresponding public key in the file rsa_pub.pem in its
 * ./lib directory
 *
 *  See comments in caf_lib/caf_security/lib/util_security.js for details.
 *
 */
exports.methods = {
    /*
     * The 'nobody' user has always password 'nobody'
     * and represents a non-authenticated user that needs a session
     * with this CA.
     *
     * The CA name with all the accounts is 'nobody_accounts',
     *  and these methods should not trust the caller.
     *
     */

    // framework methods
   '__ca_init__' : function(cb) {
       this.state.accounts = {};
       this.scratch = {};
       helper.loadKeys(this, cb);
    },

    '__ca_resume__' : function(cp, cb) {
        this.state = cp && cp.state;
        this.state = this.state || {};
        this.state.accounts = this.state.accounts || {};
        this.scratch = {};
        helper.loadKeys(this, cb);
    },

    // client methods
    'addAccount' : function(loginName, password, cb) {
        if (sec_util.validName(loginName)) {
            if (!this.state.accounts[loginName]) {
                this.state.accounts[loginName] =
                    sec_util.newPasswordHash(password);
                cb(null, 'ok');
            } else {
                cb('Invalid login name: already in use');
            }
        } else {
            cb('Invalid login name: should not contain #, _, $ or |');
        }
    },

    'login' : function(caOwner, password, serviceUrl, caLocalName,
                       unrestricted, cb) {
        if (sec_util.validName(caOwner)) {
            var hash = this.state.accounts[caOwner];
            if (hash) {
                if (sec_util.verifyPasswordHash(password, hash)) {
                    var duration = this.$.prop.get('duration') || 100000000;
                    var expires = (new Date()).valueOf() + duration * 1000;
                    var con = sec_util.urlToConstraints(serviceUrl);
                    if (con) {
                        var newToken = (unrestricted ?
                                        // 'all powers' token for caOwner
                                        sec_util.newToken(undefined, undefined,
                                                          caOwner,
                                                          undefined, expires) :
                                        sec_util.newToken(con.appPublisher,
                                                          con.appLocalName,
                                                          caOwner,
                                                          caLocalName,
                                                          expires));
                        var res = sec_util.signToken(this.scratch.keys.pubKey,
                                                     this.scratch.keys.privKey,
                                                     'RSA-SHA256', newToken);
                        if (res) {
                            var goToUrl = sec_util.goToUrl(serviceUrl,
                                                           caOwner,
                                                           caLocalName, res);
                            cb(null, {token: res, url: goToUrl});
                        } else {
                            cb('Cannot sign token');
                        }
                    } else {
                        cb('Invalid url' + serviceUrl);
                    }
                } else {
                    cb('Invalid password');
                }
            } else {
                cb('Invalid login name' + caOwner);
            }
        } else {
           cb('Invalid login name: should not contain #, _, $ or |');
       }
    },

    'restrictToken' : function(token, con, cb) {
        if (sec_util.validateSignedToken(this.scratch.keys.pubKey, token)) {
            var newExpires = token.expires;
            if ((typeof con.expires === 'number') &&
                (con.expires <= token.expires)) {
                newExpires = con.expires;
            }
            var newToken =
                sec_util.newToken(con.appPublisher, con.appLocalName,
                                  token.caOwner,
                                  con.caLocalName, newExpires);
            if (sec_util.lessOrEqual(newToken, token)) {
                var res = sec_util.signToken(this.scratch.keys.pubKey,
                                             this.scratch.keys.privKey,
                                             token.algo, newToken);
                if (res) {
                    cb(null, res);
                } else {
                    cb('Cannot sign restricted token');
                }
            } else {
                cb('Original token too weak');
            }
        } else {
            cb('Invalid token');
        }
    }
};

caf.init(__dirname, {});
