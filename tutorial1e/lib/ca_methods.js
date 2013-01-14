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

var MAX_COUNTER = 50;

var MAX_FINISHED = 2;

var CHANNEL_NAME = 'anybody/tutorial1e:counterchannel';

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counter = -1;
        this.state.finished = {};
        this.$.pubsub.subscribe(CHANNEL_NAME, 'thresholdHandler');
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = (cp && cp.state) || {};
        this.state.finished = this.state.finished || {};
        // The pubsub plug-in transparently re-subscribes to CHANNEL_NAME
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        this.state.counter = this.state.counter + 1;
        if (this.state.counter >= MAX_COUNTER) {
            this.$.pubsub.publish(CHANNEL_NAME, this.$.session.getMyId());
        }

        var nFinished = Object.keys(this.state.finished).length;
        if (nFinished >= MAX_FINISHED) {
            this.$.session.notify([nFinished], 'default');
        }
        cb(null);
    },
    'increment' : function(inc, cb) {
        this.state.counter = this.state.counter + inc;
        if (this.state.counter >= MAX_COUNTER) {
            this.$.pubsub.publish(CHANNEL_NAME, this.$.session.getMyId());
        }
        cb(null, {'counter' : this.state.counter });
    },

    //handler method
    'thresholdHandler' : function(channel, id, cb) {
        this.state.finished[id] = true;
        cb(null);
    }
};


caf.init(__dirname, {});

