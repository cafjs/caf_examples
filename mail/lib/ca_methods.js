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
var util = require('util');

var MAX_RETRIES = 10;

exports.methods = {
    // factory methods
    '__ca_init__' : function(cb) {
        this.state.retries = {};
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var acc = this.$.imap.listAccounts();
        var self = this;
        acc.forEach(function(alias) {
                        if (self.$.imap.isAccountActive(alias)) {
                            delete self.state.retries[alias];
                            console.log('Account ' + alias + ' is OK');
                        } else {
                            var nRetries = self.state.retries[alias] || 0;
                            if (nRetries > MAX_RETRIES) {
                                self.$.imap.removeAccount(alias);
                                delete self.state.retries[alias];
                            } else {
                                self.$.imap.retryAccount(alias);
                                self.state.retries[alias] = nRetries + 1;
                            }
                        }
                    });
        cb(null);
    },

    // methods called by the client
    'addAccount' : function(alias, username, password, host, port, cb) {
        this.$.imap.addAccount(alias, username, password,
                               host, port, 'newMessage');
        cb(null);
    },
    'removeAccount' : function(alias, cb) {
        this.$.imap.removeAccount(alias);
        cb(null);
    },
    'getAccounts' : function(cb) {
        var acc = this.$.imap.listAccounts();
        var self = this;
        var result = [];
        acc.forEach(function(alias) {
                        result.push({'alias' : alias, 'active':
                                     self.$.imap.isAccountActive(alias)});
                    });

        // return type is [{'alias' : <string>, 'active' : <boolean>}]
        cb(null, result);
    },
    'getBoxes' : function(cb) {
        var self = this;
        var result = {};
        var acc = this.$.imap.listAccounts();
        acc.forEach(function(alias) {
                        if (self.$.imap.isAccountActive(alias)) {
                            var boxes = self.$.imap.getBoxesInfo(alias) || [];
                            boxes.forEach(function(box) {
                                              var lst = result[box.name] || [];
                                              lst.push(alias);
                                              result[box.name] = lst;
                                          });
                        }
                    });
        var lstResult = [];
        for (var key in result) {
            lstResult.push({'name' : key, 'box' : result[key]});
        }

        // type of lstResult is [{'name': <string>, 'box' : [<string>]}]
        cb(null, lstResult);
    },
    /* boxesInfo is of type {'name': <string>, 'box' : [<string>]} */
    'getHeaders' : function(boxesInfo, cb) {
        var self = this;
        if (typeof boxesInfo === 'object') {
            var aliases = boxesInfo.box || [];
            var headers = {};
            aliases.forEach(function(alias) {
                                var h = self.$.imap.
                                    getHeaders(alias, boxesInfo.name) || [];
                                headers[alias] = h.slice(0).reverse();
                            });
            cb(null, this.sortHeaders(headers, boxesInfo.name));
        } else {
            cb(null);
        }
    },
    'getMsg' : function(header, cb) {
        if (header && header.alias && header.boxName && header.uid) {
            var msg = this.$.imap.getMsgBody(header.alias, header.boxName,
                                              header.uid);
            cb(null, msg);
        } else {
            cb(null);
        }
    },

    /* This is an example of how to eliminate a roundtrip by combining multiple
     * calls. We use the 'async' (caolan) library to compose these calls. */
    'getAccountsAndBoxes': function(cb) {
        var result = {
            'accounts' : [],
            'boxes' : []
        };
        var self = this;
        async.waterfall([
                            function(cb0) {
                                self.getAccounts(cb0);
                            },
                            function(acc, cb0) {
                                result.accounts = acc;
                                self.getBoxes(cb0);
                            }
                        ],
                       function(err, value) {
                           if (err) {
                               cb(err);
                           } else {
                               result.boxes = value;
                               cb(err, result);
                           }
                       });
    },
    // event handling methods
    'accountsChanged' : function(logChanges, cb) {
        console.log('accountsChanged:got log' + JSON.stringify(logChanges));
        this.notifyNoDuplicates({'account': undefined, 'action' : 'refresh'});
        cb(null);
    },
    'newMessage' : function(alias, numMsgs, cb) {
        console.log('got ' + numMsgs + ' new messages in ' + alias);
        this.$.session.notify({'account': alias, 'action' : 'refresh'},
                              'default');
        cb(null);
    },

    // internal helper methods
    'sortHeaders' : function(headers, boxName) {
        // TODO: use Date in header to sort (instead of a shuffle)
        var done = false;
        var result = [];
        while (!done) {
            done = true;
            for (var alias in headers) {
                var next = headers[alias].shift();
                if (next) {
                    next.alias = alias;
                    next.boxName = boxName;
                    result.push(next);
                    done = false;
                }
            }
        }
        return result;
    },
    'notifyNoDuplicates' : function(msg) {
        var pendingMsgs = this.$.session.outq('default') || [];
        var strMsg = JSON.stringify(msg);
        for (var i = 0; i < pendingMsgs.length; i++) {
            if (JSON.stringify(pendingMsgs[i]) === strMsg) {
                return;
            }
        }
        this.$.session.notify(msg, 'default');
    }
};

caf.init(__dirname, {});

