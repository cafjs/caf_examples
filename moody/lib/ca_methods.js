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

var initState = function(state, myId) {
    state.friends = state.friends || {};
    state.myName = state.myName || myId;
    state.myMood = state.myMood || 'unknown';

};

exports.methods = {
    // framework methods
    '__ca_init__' : function(cb) {
        this.state = this.state || {};
        initState(this.state, this.$.session.getMyId());
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = cp && cp.state;
        this.state = this.state || {};
        initState(this.state, this.$.session.getMyId());
        cb(null);
    },
    '__ca_terminate__' : function(cb) {
        this.$.pubsub.unsubscribe();
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        if (this.state.myMood !== 'unknown') {
            this.$.pubsub.publish(this.state.myName + '/mood',
                                  this.state.myMood);
        }
        cb(null);
    },
    //handler methods
    'changeFriendMoodHandler' : function(friendSub, newMood, cb) {
        var friend = ((friendSub.substr(-5) === '/mood') ?
                      friendSub.substr(0, friendSub.length - 5) : friendSub);
        if (this.state.friends[friend]) {
            this.state.friends[friend] = newMood;
            var newMsg = {'name': friend, 'mood' : newMood,
                          'friends' : this.state.friends};
            var pendingMsgs = this.$.session.outq('default') || [];
            var done = false;
            for (var i = pendingMsgs.length - 1; (i >= 0) && !done; i--) {
                var pendingMsg = pendingMsgs[i];
                if (pendingMsg.name === newMsg.name) {
                    done = true;
                    if (JSON.stringify(pendingMsg) !== JSON.stringify(newMsg)) {
                        this.$.session.notify(newMsg, 'default');
                    }
                }
            }
            if (!done) {
                 this.$.session.notify(newMsg, 'default');
            }
        }
        cb(null);
    },

    // Externally visible methods
    'getState' : function(cb) {
      cb(null, {'name': this.state.myName, 'mood' : this.state.myMood,
                'friends' : this.state.friends});
    },
    'changeMood' : function(newMood, cb) {
        this.state.myMood = newMood;
        this.$.pubsub.publish(this.state.myName + '/mood', newMood);
        cb(null, 'ok');
    },
    'addFriend' : function(newFriend, cb) {
        if (!this.state.friends[newFriend]) {
            this.state.friends[newFriend] = 'unknown';
            this.$.pubsub.subscribe(newFriend + '/mood',
                                    'changeFriendMoodHandler');
        }
        cb(null, 'ok');
    },
    'removeFriend' : function(friend, cb) {
        if (this.state.friends[friend]) {
            delete this.state.friends[friend];
            this.$.pubsub.unsubscribe(friend + '/mood');
        }
        cb(null, 'ok');
    }
};

caf.init(__dirname, {});

