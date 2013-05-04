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

exports.methods = {
    '__ca_init__' : function(cb) {
        cb(null);
    },
    'inference' : function(query, cb) {
        this.$.jsonrpc.invoke('cog', 'inference', [query], cb);
    },
    'learn' : function(query, result, cb) {
        this.$.jsonrpc.invoke('cog', 'learn', [query, result], cb);
    },
    'reset' : function(cb) {
        this.$.jsonrpc.invoke('cog', 'reset', [], cb);
    }
};


caf.init(__dirname, {});

