enyo.kind({
              name: 'RPSIcon',
              kind: enyo.Control,
              classes: 'rps-icon',
              tag: "img"
          });

enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              caOwner: '',
              mySession: null,
              selected: -1,
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
                       {kind: 'onyx.InputDecorator',
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
                             content: 'Submit', ontap: 'callCA'}
                        ]}
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
                            {kind: 'onyx.Button', name: 'resetButton',
                             content: 'Reset', ontap: 'callReset'}
                        ]}
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
                      this.mySession.remoteInvoke('learn', [this.selected,
                                                            inEvent.userChoice],
                                                  cbOK, cbError);
                   return true;

              },
              groupActivated: function(inSender, inEvent) {
		if (inEvent.originator.getActive()) {
			this.selected = inEvent.originator.indexInContainer();
		}
	      },
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
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
                      this.mySession.remoteInvoke('inference', [this.selected],
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
              }

          });


enyo.kind({
              name: 'LearnPopup',
              events: {
                  onLearned: ''
              },
              selected: -1,
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
                               {kind: 'onyx.InputDecorator',
                                components: [
                                    {kind: "Group",  classes: "labeled-group",
                                     onActivate:"learnActivated",
                                     highlander: true,
                                     components: [
	                                 {kind:"onyx.Checkbox",
                                          checked: true, components: [
                                              { kind: "RPSIcon",
                                                src: "images/rock.png"}
                                          ]
                                         },
	                                 {kind:"onyx.Checkbox",
                                          components: [
                                              { kind: "RPSIcon",
                                                src: "images/paper.png"}
                                          ]
                                         },
	                                 {kind:"onyx.Checkbox",
                                          components: [
                                              { kind: "RPSIcon",
                                                src: "images/scissors.png"}
                                          ]
                                         }
		                     ]},
                                    {kind: 'onyx.Button',
                                     content: 'Submit', ontap: 'callT'}
                                ]}
                           ]}
                      ]}
              ],
              learnActivated: function(inSender, inEvent) {
		  if (inEvent.originator.getActive()) {
		      this.selected = inEvent.originator.indexInContainer();
		  }
                  return true;
	      },
              learn: function() {
                  this.$.popup.show();
              },
              callT: function(inSender, inEvent) {
                  this.$.popup.hide();
                  this.doLearned({userChoice: this.selected});
                  return true;
              }
          });

