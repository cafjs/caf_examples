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

exports.methods = {
    '__ca_init__' : function(cb) {
        this.version = 1;
        this.state.counter = -1;
        var fullName = this.$.sharing.fullParsedName(MAP_NAME);
        if (fullName.caLocalName === 'admin') {
            this.state.admin = true;
            this.$.sharing.addMap(true, MAP_NAME, 'w');
        } else {
            fullName.caLocalName = 'admin';
            var mapName = this.$.sharing.stringifyName(fullName);
            this.$.sharing.addMap(false, mapName, 'ro');
        }
        this.$.log.debug('calling init');
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var $$ = this.$.sharing.$;
        this.state.counter = this.state.counter + 1;
        if (this.state.admin) {
            $$.w.num = this.state.counter;
            this.$.log.debug('admin calling PULSE!!!' + $$.w.num);
        } else {
            this.$.log.debug('reader calling PULSE!!!' + $$.ro.num);
        }
        cb(null);
    },
    'hello' : function(name, inc, cb) {
        var $$ = this.$.sharing.$;
        this.state.counter = this.state.counter + inc;
        this.$.log.debug('Hello from ' + name + ' inc:' + inc + ' counter:' +
                         this.state.counter);
        if (this.state.admin) {
            cb(null, {'nameAdmin' : name, 'inc' : inc,
                      'myCounter' : this.state.counter });
        } else {
             cb(null, {'nameAdmin' : name, 'inc' : inc,
                      'myCounter' : this.state.counter,
                      'adminCounter' : $$.ro.num});
        }
    }
};


caf.init(__dirname, {});

