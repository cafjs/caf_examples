enyo.kind({
              name: 'RPSIcon',
              kind: enyo.Control,
              classes: 'rps-icon',
              tag: "img"
          });

enyo.kind({
              name: 'RPSGroup',
              kind: 'onyx.InputDecorator',
              published: {
                  selected: -1
              },
              events: {
                  onSelect: ''
              },
              components: [
                  {kind: "Group",  classes: "labeled-group",
                   onActivate:"groupActivated", highlander: true,
                   components: [
	               {kind:"onyx.Checkbox",
                        checked: true, components: [
                            { kind: "RPSIcon",  name: "iconrock",
                              src: "images/rock.png"}
                        ]
                       },
	               {kind:"onyx.Checkbox",
                        components: [
                            { kind: "RPSIcon",  name: "iconpaper",
                              src: "images/paper.png"}
                        ]
                       },
	               {kind:"onyx.Checkbox",
                        components: [
                            { kind: "RPSIcon",  name: "iconscissors",
                              src: "images/scissors.png"}
                        ]
                       }
		   ]},
                  {kind: 'onyx.Button', name: 'myButton',
                   content: 'Submit', ontap: 'callSelect'}
              ],
              groupActivated: function(inSender, inEvent) {
		  if (inEvent.originator.getActive()) {
		      this.selected = inEvent.originator.indexInContainer();
		  }
                  return true;
	      },
              callSelect: function(inSource, inEvent) {
                  this.doSelect({choice: this.selected});
                  return true;
              }
          });

enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'FittableRows',
              classes: "enyo-fit",
              caOwner: '',
              mySession: null,
              icons: ["images/rock.png","images/paper.png",
                      "images/scissors.png" ],
              components: [
                  {kind: 'onyx.Toolbar', content: 'Rock Paper Scissors'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {kind: 'LearnPopup', name: 'learnPopup',
                   onLearned: 'learnedSelected'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Pick one!'},
                       {kind: 'RPSGroup', name: 'rpsGroup', onSelect: 'callCA'}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox',
                   components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Response'},
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: "RPSIcon",   name: "iconresponse"},
                            {kind: 'onyx.Button', name: 'wrongButton',
                             content: 'Bad Choice?', ontap: 'callLearn'}
                        ]}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox',
                   components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Manage'},
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'FittableColumns', style: 'width: 100%;',
                             components: [
                                 {kind: 'onyx.Button', name: 'myButton',
                                  content: 'Add Device', ontap: 'addDevice'},
                                 {kind: 'onyx.Input', fit:true, 
                                  name: 'deviceName',
                                  style: 'margin: 6px;',
                                  placeholder: ' A unique id for your device'}
                             ]}
                        ]},
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Button', name: 'resetButton',
                             content: 'Reset', ontap: 'callReset'}
                        ]}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Toolbar', content: 'Devices'},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'GadgetsList', name: 'gadgetsList',
                        onOutputChange: 'newOutput'}
                   ]}
              ],
              learnedSelected: function(inSender, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.iconresponse.setSrc("images/blank.png");
                  };
                  var cbError = function(error) {
                      self.$.iconresponse.setSrc("images/blank.png");
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession
                      .remoteInvoke('learn', [this.$.rpsGroup.getSelected(),
                                              inEvent.userChoice],
                                    cbOK, cbError);
                   return true;

              },
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
                  this.loadGadgetsState();
                  return true;
              },
              callCA: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.iconresponse.setSrc(self.icons[msg]);
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('inference', [inEvent.choice],
                                                  cbOK, cbError);
                  return true;
              },
              callReset: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.iconresponse.setSrc("images/blank.png");
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('reset', [],
                                                  cbOK, cbError);
                  return true;
              },

              callLearn:  function(inSource, inEvent) {
                  this.$.learnPopup.learn();
                  return true;
              },
              newOutput: function(inSource, inEvent) {
                  var cbOK = function(msg) {
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  var deviceId = inEvent.gadgetId;
                  var pin = inEvent.pin;
                  var isOn = inEvent.isOn;
                  this.mySession && this.mySession
                      .remoteInvoke('changeOutput', [deviceId, pin, isOn],
                                    cbOK, cbError);                  
                  return true;
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
              newNotif: function(inSource, inEvent) {
                  var counter = inEvent[0];
                  this.$.gadgetsList.setGadgets(inEvent[1]);
                  console.log(' got counter ' + counter);
                  return true;
              }

          });

enyo.kind({
              name: 'LearnPopup',
              events: {
                  onLearned: ''
              },
              components: [
                  {
                      kind: 'onyx.Popup',
                      name: 'popup',
                      centered: true,
                      modal: true,
                      floating: true,
                      components: [
                          {kind: 'onyx.Groupbox', components: [
                               {kind: 'onyx.GroupboxHeader',
                                content: 'Select correct one'},
                               {kind: 'RPSGroup', name: 'rpsPopupGroup', 
                                onSelect: 'callT'}
                           ]}
                      ]}
              ],
              learn: function() {
                  this.$.popup.show();
              },
              callT: function(inSender, inEvent) {
                  this.$.popup.hide();
                  this.doLearned({userChoice: inEvent.choice});
                  return true;
              }
          });

