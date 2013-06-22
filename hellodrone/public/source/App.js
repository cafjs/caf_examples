enyo.kind({
              name: 'App',
              classes: 'onyx enyo-fit',
              kind: 'FittableRows',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'AR Drone Hello World!'},
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
                             style: 'width: 70%;',
                             placeholder: ' A unique id for your drone'},
                            {kind: 'onyx.Button', name: 'myButton',
                             content: 'Add Drone', ontap: 'addDevice'}
                        ]}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Toolbar', content: 'Drones'},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'DronesList', name: 'dronesList',
                        onCommand: 'newCommand', onOutputChange: 'newOutput'}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
                  this.loadDronesState();
                  return true;
              },
              newCommand: function(inSource, inEvent) {
                  var cbOK = function(msg) {
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  var deviceId = inEvent.droneId;
                  var command = inEvent.command;
                  this.mySession && this.mySession
                      .remoteInvoke('doCommand', [deviceId, command], cbOK,
                                    cbError);
                  return true;
              },
              newOutput: function(inSource, inEvent) {
                  var cbOK = function(msg) {
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  var deviceId = inEvent.droneId;
                  var pin = inEvent.pin;
                  var isOn = inEvent.isOn;
                  this.mySession && this.mySession
                      .remoteInvoke('changeOutput', [deviceId, pin, isOn],
                                    cbOK, cbError);
                  return true;
              },
              loadDronesState: function() {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.dronesList.setDrones(msg.drones);
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
                      self.$.dronesList.addDrone(deviceId);
                      self.$.deviceName.setValue("");
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('addDrone',
                                                  [deviceId],
                                                  cbOK, cbError);
                  return true;
              },
              newNotif: function(inSource, inEvent) {
                  var counter = inEvent[0];
                  this.$.dronesList.setDrones(inEvent[1]);
                  console.log(' got counter ' + counter);
                  return true;
              }
          });


