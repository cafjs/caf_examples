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

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counter = -1;
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        this.state.counter = this.state.counter + 1;
//        console.log('calling PULSE!!!'+ this.state.counter);
        if (this.state.counter % 5 == 0) {
            this.$.session.notify([this.state.counter], 'default');
        }
        cb(null);
    },
    'hello' : function(name, inc, cb) {
        console.log('Authenticated Caller:' + this.$.security.getCaller());
        this.state.counter = this.state.counter + inc;
//        console.log('Hello from ' + name + ' inc:' + inc + ' counter:' +
//                    this.state.counter);
        if (this.state.counter % 5 == 0) {
            this.$.session.notify([this.state.counter], 'default');
        }
        cb(null, {'name' : name, 'inc' : inc,
                  'counter' : this.state.counter });
    }
};


caf.init(__dirname, {});

