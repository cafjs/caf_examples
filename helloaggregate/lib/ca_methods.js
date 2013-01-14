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

var MAP_NAME = 'external';

var DEFAULT_LINK_KEY = '__link_key__';

exports.methods = {
    '__ca_init__' : function(cb) {
        this.version = 1;
        this.state.counter = -1;
        var fullName = this.$.sharing.fullParsedName(MAP_NAME);
        if (fullName.caLocalName === 'admin') {
            this.state.admin = true;
            this.$.sharing.addMap(true, MAP_NAME, 'x1');
            this.$.sharing.addMap(true, MAP_NAME + 'x2', 'x2');
            this.$.sharing.addMap(true, MAP_NAME + 'x3', 'x3');
        } else {
            fullName.caLocalName = 'admin';
            var mapName = this.$.sharing.stringifyName(fullName);
            this.$.sharing.addAggregate(mapName, 'ro');
        }
        this.$.log.debug('calling init');
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var $$ = this.$.sharing.$;
        this.state.counter = this.state.counter + 1;
        if (this.state.admin) {
            if (!$$.x1[DEFAULT_LINK_KEY]) {
                var x1Name = this.$.sharing.fullName(MAP_NAME);
                var x2Name = this.$.sharing.fullName(MAP_NAME + 'x2');
                var x3Name = this.$.sharing.fullName(MAP_NAME + 'x3');
                // x1->[x2] and x2-> [x1, x3] to add a loop
                $$.x1[DEFAULT_LINK_KEY] = [x2Name];
                $$.x2[DEFAULT_LINK_KEY] = [x1Name, x3Name];
            }
            $$.x1['antonio'] = this.state.counter;
            $$.x1['joe'] = this.state.counter;

            $$.x2['antonio'] = this.state.counter + 1;
            $$.x2['joe'] = this.state.counter + 1;

            $$.x3['john'] = this.state.counter + 2;

            this.$.log.debug('admin calling PULSE!!!' + this.state.counter);
        } else {
            this.$.log.debug('reader calling PULSE!!!');
        }
        cb(null);
    },
    'lookup' : function(name, cb) {
        var $$ = this.$.sharing.$;
        this.$.log.debug('Looking up ' + name);
        if (this.state.admin) {
            var result = {};
            result.x1 = $$.x1[name];
            result.x2 = $$.x2[name];
            result.x3 = $$.x3[name];
            cb(null, result);
        } else {
            cb(null, $$.ro.lookup(name));
        }
    }
};


caf.init(__dirname, {});

