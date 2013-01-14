enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Tutorial 1b'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession'},
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
              }
          });


