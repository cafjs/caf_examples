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
        this.initState();
        cb(null);
    },

    'initState' : function() {
        this.state.messageSize = this.$.prop.get('messageSize') || 1;
        var msg = [];
         for (var i = 0; i < this.state.messageSize; i++) {
             msg.push(i % 10);
        }
        this.state.msg = msg;
        this.state.checkpointSize = this.$.prop.get('checkpointSize') || 1;
        /* this.state.msg is also part of the checkpoint, so we need to
         * discount their size*/
        this.state.checkpointSize = this.state.checkpointSize -
            this.state.messageSize;
        var rubish = [];
        for (i = 0; i < this.state.checkpointSize; i++) {
            rubish.push(i % 10);
        }
        this.state.rubish = rubish;
        this.state.notifDivider = this.$.prop.get('notifDivider') || 1;
        this.state.cpuOverhead = this.$.prop.get('cpuOverhead') || 1;



    },

    '__ca_resume__' : function(cp, cb) {
        this.state = cp && cp.state;
        this.state = this.state || {};
        this.initState();
        cb(null);
    },


    '__ca_pulse__' : function(cb) {
        this.wasteTime();
        this.state.counter = this.state.counter + 1;
//        console.log('calling PULSE!!!'+ this.state.counter);
        if (this.state.counter % this.state.notifDivider == 0) {
            this.$.session.notify([this.state.msg], 'default');
        }
        cb(null);
    },
    'wasteTime' : function() {
        var result = 1;
        for (var i = 0; i < 1000 * this.state.cpuOverhead; i++) {
            result += (result * 11 + 1) % 13;
        }
        this.state.waste = result; // avoid compiler dead code elimination
        return result;
    },

    'hello' : function(name, inc, cb) {
        this.wasteTime();
        this.state.counter = this.state.counter + inc;
//        console.log('Hello from ' + name + ' inc:' + inc + ' counter:' +
//                    this.state.counter);
//        if (this.state.counter % this.state.notifDivider == 0) {
//            this.$.session.notify([this.state.msg], 'default');
//        }
        cb(null, {'name' : name, 'inc' : inc,
                  'counter' : this.state.msg });
    }
};


caf.init(__dirname, {});

