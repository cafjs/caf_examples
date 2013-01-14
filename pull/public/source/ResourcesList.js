enyo.kind({
    name: 'ResourceItem',
    kind: enyo.Control,
    tag: 'div',
    style: 'border-style: solid; border-width: 2px; ' +
            'padding: 10px; margin: 10px; min-height: 20px',
    published: {
        alias: '',
        hash: ''
    },
    components: [
        {tag: 'b', name: 'aliasTag'},
        {tag: 'span', name: 'hashTag'}
    ],
    aliasChanged: function() {
        this.$.aliasTag.setContent(this.alias + ': ');
    },
    hashChanged: function() {
        this.$.hashTag.setContent(this.hash);
    }
});

enyo.kind({
    name: 'ResourcesList',
    kind: enyo.Control,
    published: {
        resources: {}
    },
    keys: [],
    components: [
        {kind: 'Repeater', name: 'list', count: 0, onSetupItem: 'setupItem',
         components: [
             {kind: 'ResourceItem', name: 'oneResource' }
         ]}

    ],
    addResource: function(alias, hash) {
        if (!hash) {
            hash = 'unknown';
        }
        this.resources[alias] = hash;
        this.resourcesChanged();
    },
    resourcesChanged: function(inOldResources) {
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
        this.keys = getKeys(this.resources).sort();
        this.$.list.setCount(this.keys.length);
        this.$.list.build();
        this.render();
    },
    setupItem: function(inSender, rowHandle) {
        var key = this.keys[rowHandle.index];
        var hash = this.resources[key];
        var oneResource = rowHandle.item.$.oneResource;
        oneResource.setAlias(key);
        oneResource.setHash(hash);
    }
});
