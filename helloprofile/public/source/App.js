enyo.kind({
    name: 'App',
    classes: 'onyx',
    kind: 'Control',
    components: [
        {kind: 'onyx.Toolbar', content: 'Hello World!'},
        {tag: 'br'},
        {kind: 'onyx.Toolbar', components: [
             {name: 'dot', content: '\u25CF'}, // solid circle character
             {kind: 'onyx.InputDecorator', components: [
                  {kind: 'onyx.Input', name: 'user', placeholder: 'User'}
              ]},
             {kind: 'onyx.InputDecorator', components: [
                  {kind: 'onyx.Input', name: 'name', placeholder: 'CA Name'}
              ]},
             {kind: 'onyx.Button', content: 'Activate', name: 'activateButton',
              ontap: 'activate'}
         ]},
        {tag: 'br'},
        {kind: 'onyx.Groupbox', components: [
             {kind: 'onyx.GroupboxHeader', content: 'Last Remote Call'},
             {kind: 'onyx.InputDecorator', components: [
                  {kind: 'onyx.Button', name: 'myButton',
                   content: 'Call Cloud Assistant',
                   ontap: 'callCA'},
                  {name: 'lastcall', content: ''}
              ]}
         ]},
        {tag: 'br'},
        {kind: 'onyx.Groupbox', components: [
             {kind: 'onyx.GroupboxHeader',
              content: 'Last Notification from Cloud Assistant'},
             {kind: 'onyx.InputDecorator', components: [
                  {kind: 'onyx.Input', name: 'notification',
                   style: 'width: 100%', value: ''}
              ]}
         ]}
    ],
    activate: function(inSource, inEvent) {
        this.$.activateButton.setDisabled(true);
        var caName = this.$.user.getValue() + '_' + this.$.name.getValue();
        var cbObject = this.newDispatcher();
        this.createComponent({kind: 'ca.Session', name: 'mySession',
                              onOnline: 'connected', onOffline: 'disconnected',
                              caName: caName, callbackObject: cbObject});

    },
    callCA: function(inSource, inEvent) {
        var self = this;
        var cbOK = function(msg) {
            self.$.lastcall.setContent(JSON.stringify(msg));
        };
        var cbError = function(error) {
            self.$.lastcall.setContent('ERROR:' + JSON.stringify(error));
        };
        this.$.mySession.remoteInvoke('hello', [this.$.user.getValue() + 'CA',
                                                1], cbOK, cbError);
    },

    newDispatcher: function() {
        var self = this;
        return {
          dispatcher: function(counter) {
              self.$.notification.setValue(' got counter ' + counter);
              console.log(' got counter ' + counter);
          }
        };
    },
    connected: function(inSource, inEvent) {
        this.$.dot.setStyle('color: green;');

    },

    disconnected: function(inSource, inEvent) {
        this.$.dot.setStyle('color: red;');
    }
});


