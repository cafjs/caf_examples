enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Mutant'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Answer to the Ultimate Question'},
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Button', name: 'myButton',
                             content: 'Get Answer',
                             ontap: 'callCA'},
                            {name: 'answer', content: ''}
                        ]
                       },
                       {name: 'f', content: '', style: 'padding: 8px;'},
                       {name: 'finv', content: '', style: 'padding: 8px;'},
                       {name: 'rand', content: '', style: 'padding: 8px;'},
                       {name: 'version', content: '', style: 'padding: 8px;'},
                       {name: 'iter', content: '', style: 'padding: 8px;'}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Error messages'},
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'notification',
                             style: 'width: 100%', value: 'None'}
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
                      self.$.answer.setContent(' The answer is ' +
                                               JSON.stringify(msg.answer));
                      self.$.f.setContent('f =  ' +
                                          JSON.stringify(msg.op.f));
                      self.$.finv.setContent('finv =  ' +
                                             JSON.stringify(msg.op.finv));
                      self.$.rand.setContent('rand =  ' +
                                             JSON.stringify(msg.op.rand));
                      self.$.version.setContent('version =  ' +
                                                JSON.stringify(msg.op.version));
                      self.$.iter.setContent('iterations =  ' +
                                             JSON.stringify(msg.iter));
                  };
                  var cbError = function(error) {
                      self.$.lastcall.setContent('ERROR:' +
                                                 JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('getAnswer', [], cbOK,
                                                  cbError);
              },
              newNotif: function(inSource, inEvent) {
                  var value = inEvent[0];
                  this.$.notification.setValue('Oops! got wrong value ' +
                                               value);
                  console.log(' got value ' + value);
                  return true;
              }
          });


