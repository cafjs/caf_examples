enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Tutorial 1e'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Last Increment'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Button', name: 'myButton',
                             content: 'inc', ontap: 'callCA'},
                            {name: 'lastcall', content: ''}
                        ]}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox',
                   components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: '# Cloud Assistants that reached threshold'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'notification',
                             style: 'width: 100%', value: ''}
                        ]}
                   ]}

              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  return true;
              },
              callCA: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.lastcall.setContent(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      self.$.lastcall.setContent('ERROR:' +
                                                 JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('increment', [1], cbOK,
                                                  cbError);
                  return true;
              },
              newNotif: function(inSource, inEvent) {
                  var counter = inEvent[0];
                  this.$.notification.setValue(counter);
                  return true;
              }
          });


