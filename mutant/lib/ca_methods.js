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

var MAP_NAME = 'code';

var THE_ANSWER = 42;

// pretty-print the output
var filterDump = function(dump) {
    var result = {version: dump.version};
    dump.properties
        .forEach(function(x) {
                    if (x.key === 'finv') {
                        result.finv = x.value.split('#')[2];
                    } else if (x.key === 'f') {
                        result.f = x.value.split('#')[2];
                    } else if (x.key === 'rand') {
                        result.rand = x.value;
                    }
                 });
    return result;
};


exports.methods = {
    '__ca_init__' : function(cb) {
        this.version = 1;
        this.state.counter = 0;
        this.state.value = THE_ANSWER;
        this.state.iter = 0;

        var fullName = this.$.sharing.fullParsedName(MAP_NAME);
        if (fullName.caLocalName === 'admin') {
            this.state.admin = true;
            this.$.sharing.addMap(true, MAP_NAME, 'w');
        } else {
            fullName.caLocalName = 'admin';
            var mapName = this.$.sharing.stringifyName(fullName);
            this.$.sharing.addMap(false, mapName, 'ro');
        }
        this.$.log && this.$.log.debug('calling init');
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var self = this;
        var $$ = this.$.sharing.$;
        if (this.state.admin) {
            this.state.counter = this.state.counter + 1;
            $$.w.rand = Math.random();
            $$.w.f = function() {
                return 'function(x) { return x + this.rand  + ' +
                    self.state.counter + ';}';
            };
            $$.w.finv = function() {
                return 'function(x) { return x - this.rand - ' +
                    self.state.counter + ';}';
            };

            this.$.log && this.$.log.debug('admin calling PULSE!!!' +
                                           $$.w.__sharing_dump__());
        } else {
            if (this.doit(cb)) {
                this.$.session.notification(['Error: wrong answer is ' +
                                             this.state.value], 'default');
            }
        }
        cb(null);
    },

    'getAnswer' : function(cb) {
        var $$ = this.$.sharing.$;
        var result = {'answer' : this.state.value, 'iter' : this.state.iter};
        result.op = filterDump((this.state.admin ? $$.w.__sharing_dump__() :
                                $$.ro.__sharing_dump__()));
         this.$.log &&
            this.$.log.debug('getAnswer with result:' + JSON.stringify(result));
        cb(null, result);
    },

    'doit' : function() {
        var $$ = this.$.sharing.$;
        if ($$.ro.f) {

            /* Both atomicity of propagated changes and isolation during
             message processing should guarantee that we get the same
             value (i.e., finv(f(x)) = x).

             Also, fairness should allow all CAs to see newer versions
             of f() regardless of the behavior of other CAs.
             */
            this.$.log &&
                this.$.log.trace('f(1):' + $$.ro.f(1));
            this.$.log &&
                this.$.log.trace('finv(1):' + $$.ro.finv(1));

            for (var i = 0; i < 1000; i++) {
                var newVal = $$.ro.f(this.state.value);
                this.state.value = $$.ro.finv(newVal);
                this.state.iter = this.state.iter + 1;
            }
            return (this.state.value !== THE_ANSWER);
        } else {
             this.$.log && this.$.log.debug('f() not initialized yet.');
            return false;
        }
    }
};


caf.init(__dirname, {});

