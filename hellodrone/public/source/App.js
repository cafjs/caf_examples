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
                  {kind: 'onyx.Toolbar', content: 'Managing Drones'},
                   {classes:  'onyx-toolbar-inline',
                    components: [
                        {kind: 'onyx.InputDecorator',
                         components: [
                            {kind: 'onyx.Input', name: 'deviceName',
                             placeholder: ' drone Id'}
                         ]
                        },
                        {kind: 'onyx.Button', name: 'myButton',
                         content: 'Add Drone', ontap: 'addDevice'}
                    ]
                   },
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'deviceOne',
                             placeholder: ' first'
                            }]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'deviceTwo',
                             placeholder: ' second'}
                        ]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'deviceThree',
                             placeholder: ' third'}
                        ]
                       },
                       {kind: 'onyx.Button', name: 'myUpDownButton',
                        content: 'Blink Away', ontap: 'upDown'}
                   ]},
                  {kind: 'onyx.Toolbar', content: 'Drones'},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'DronesList', name: 'dronesList'}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
                  this.loadDronesState();
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
              upDown: function(inSource, inEvent) {
                  var self = this;
                  var one = parseInt(this.$.deviceOne.getValue());
                  var two = parseInt(this.$.deviceTwo.getValue());
                  var three = parseInt(this.$.deviceThree.getValue());
                  if (isNaN(one) || isNaN(two) || isNaN(three)) {
                      console.log('upDown:Ignoring bad input');
                      return true;
                  }
                  // index starts by 0
                  one = one -1;
                  two = two -1;
                  three = three -1;
                  var cbOK = function(msg) {
                      self.$.deviceOne.setValue("");
                      self.$.deviceTwo.setValue("");
                      self.$.deviceThree.setValue("");
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  // this.mySession &&
                  //     this.mySession.remoteInvoke('upDown',
                  //                                 [[one,two,three], true],
                  //                                 cbOK, cbError);
                  this.mySession &&
                      this.mySession.remoteInvoke('blinkAway',
                                                  [[one,two,three]],
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


