enyo.kind({
    name: 'FriendItem',
    kind: enyo.Control,
    tag: 'div',
    style: 'border-style: solid; border-width: 2px; ' +
            'padding: 10px; margin: 10px; min-height: 20px',
    published: {
        friend: '',
        mood: ''
    },
    components: [
        {tag: 'b', name: 'friendTag'},
        {tag: 'span', name: 'moodTag'}
    ],
    friendChanged: function() {
        this.$.friendTag.setContent(this.friend + ': ');
    },
    moodChanged: function() {
        this.$.moodTag.setContent(this.mood);
    }
});

enyo.kind({
    name: 'FriendsList',
    kind: enyo.Control,
    published: {
        friends: {}
    },
    keys: [],
    components: [
        {kind: 'Repeater', name: 'list', count: 0, onSetupItem: 'setupItem',
         components: [
             {kind: 'FriendItem', name: 'oneFriend' }
         ]}

    ],
    addFriend: function(name, mood) {
        if (!mood) {
            mood = 'unknown';
        }
        this.friends[name] = mood;
        this.friendsChanged();
    },
    friendsChanged: function(inOldFriends) {
        // Object.keys not supported in IE8
        var getKeys = Object.keys || function(obj) {
            var result = [];
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    result.push(name);
                }
            }
            return result;
        };
        this.keys = getKeys(this.friends).sort();
        this.$.list.setCount(this.keys.length);
        this.$.list.build();
        this.render();
    },
    setupItem: function(inSender, rowHandle) {
        var key = this.keys[rowHandle.index];
        var mood = this.friends[key];
        var oneFriend = rowHandle.item.$.oneFriend;
        oneFriend.setFriend(key);
        oneFriend.setMood(mood);
    }
});
