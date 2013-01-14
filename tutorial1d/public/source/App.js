enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              caOwner: '',
              mySession: null,
              published: {
                  sessionId: null
              },
              components: [
                  {kind: 'onyx.Toolbar', content: 'Tutorial 1d'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Input Session Name'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'sessionName',
                             placeholder: ' Your session name'},
                            {kind: 'onyx.Button', name: 'myStartButton',
                             content: 'Start', ontap: 'loadSession'}
                        ]}
                   ]},
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
                        content: 'Last Notification from Cloud Assistant'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'notification',
                             style: 'width: 100%', value: ''}
                        ]}
                   ]}

              ],
              loadSession: function(inSource, inEvent) {
                  this.sessionId = this.$.sessionName.getValue();
                  this.createComponent({kind: 'ca.LoginContext',
                                        name: 'login',
                                        sessionId: this.getSessionId(),
                                        onSession: 'newSession',
                                        onNotification: 'newNotif'});
                  this.$.myStartButton.setDisabled(true);
                  this.render();
                  this.$.sessionName.setValue(this.sessionId);
                  return true;
              },
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
                  this.$.notification.setValue(' got counter ' + counter);
                  return true;
              }
          });


