enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Hello World!'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Last Remote Call'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Button', name: 'myButton',
                             content: 'Call Cloud Assistant', ontap: 'callCA'},
                            {name: 'lastcall', content: ''}
                        ]}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox',
                   components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Last Notification from Cloud Assistant'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'notification',
                             style: 'width: 100%', value: ''}
                        ]}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
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
                      this.mySession.remoteInvoke('hello',
                                                  [this.caOwner + 'CA',
                                                   1], cbOK, cbError);
                  return true;
              },
              newNotif: function(inSource, inEvent) {
                  var counter = inEvent[0];
                  this.$.notification.setValue(' got counter ' +
                                               counter);
                  console.log(' got counter ' + counter);
                  return true;
              }
          });


