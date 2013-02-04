enyo.kind({
              name: 'App',
              classes: 'onyx enyo-fit',
              kind: 'FittableRows',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'IoT Hello World!'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Managing IoT devices'},
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'deviceName',
                             style: 'width: 90%;',
                             placeholder: ' A unique id for your device'},
                            {kind: 'onyx.Button', name: 'myButton',
                             content: 'Add Device', ontap: 'addDevice'}
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
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Toolbar', content: 'Gadgets'},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'GadgetsList', name: 'gadgetsList',
                        onCommand: 'newCommand'}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
                  this.loadGadgetsState();
                  return true;
              },
              newCommand: function(inSource, inEvent) {
                  var cbOK = function(msg) {
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  var deviceId = inEvent.gadgetId;
                  var command = inEvent.command;
                  this.mySession && this.mySession
                      .remoteInvoke('doCommand', [deviceId, command], cbOK, 
                                    cbError);                  
                  return true;
              },
              loadGadgetsState: function() {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.gadgetsList.setGadgets(msg.gadgets);
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('getSensorData', [], cbOK, cbError);
              },
              addDevice: function(inSource, inEvent) {
                  var self = this;
                  var deviceId = this.$.deviceName.getValue();
                  var cbOK = function(msg) {
                      self.$.gadgetsList.addGadget(deviceId);
                      self.$.deviceName.setValue("");
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('addGadget',
                                                  [deviceId],
                                                  cbOK, cbError);
                  return true;
              },
              newNotif: function(inSource, inEvent) {
                  var counter = inEvent[0];
                  this.$.notification.setValue(' got counter ' +
                                               counter);
                  this.$.gadgetsList.setGadgets(inEvent[1]);
                  console.log(' got counter ' + counter);
                  return true;
              }
          });


