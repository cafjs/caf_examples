enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'Control',
              mySession: null,
              components: [
                  {kind: 'FittableRows', classes: 'enyo-fit',
                   components: [
                       {kind: 'onyx.Toolbar', content: 'Moody'},
                       {tag: 'br'},
                       {kind: 'ca.LoginContext', name: 'login',
                        onSession: 'newSession', onNotification: 'newNotif'},
                       {tag: 'br'},

                       {kind: 'onyx.Groupbox', components: [
                            {kind: 'onyx.GroupboxHeader', content: 'My Mood'},
                            {kind: 'onyx.RadioGroup', name: 'myMoodButton',
                             ontap: 'callCA',
                             components: [
                                 {content: 'Unknown', name: 'Unknown',
                                  active: true},
                                 {content: 'Ecstatic', name: 'Ecstatic'},
                                 {content: 'Happy', name: 'Happy'},
                                 {content: 'OK', name: 'OK'},
                                 {content: 'Sad', name: 'Sad'},
                                 {content: 'Down with the Blues',
                                  name: 'Down with the Blues'}
                             ]}
                        ]},
                       {tag: 'br'},
                       {kind: 'onyx.Groupbox', components: [
                            {kind: 'onyx.GroupboxHeader',
                             content: 'Adding a New Friend'},
                            {kind: 'onyx.Toolbar', components: [
                                 {kind: 'onyx.InputDecorator', components: [
                                      {kind: 'onyx.Input', name: 'friendName',
                                       placeholder: ' Your friend\'s user name'}
                                  ]},
                                 {kind: 'onyx.InputDecorator', components: [
                                      {kind: 'onyx.Input', name: 'friendId',
                                       placeholder: ' Your friend\'s CA id'}
                                  ]},
                                 {kind: 'onyx.Button', content: 'Add',
                                  name: 'addFriendButton', ontap: 'addFriend'}
                             ]}
                        ]},
                       {tag: 'br'},
                       {kind: 'onyx.Toolbar', content: 'Friends'},
                       {fit: true, kind: 'Scroller', components: [
                            {kind: 'FriendsList', name: 'friendsList'}
                        ]}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.loadCAState();
                  return true;
              },
              addFriend: function(inSource, inEvent) {
                  if ((!this.$.friendName.getValue()) ||
                      (!this.$.friendName.getId())) {
                      return true;
                  }
                  var name = this.$.friendName.getValue() + '_' +
                      this.$.friendId.getValue();
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.friendsList.addFriend(name);
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('addFriend', [name], cbOK, cbError);
                  return true;
              },
              loadCAState: function() {
                  var self = this;
                  var cbOK = function(msg) {
                      if (self.$[msg.mood]) {
                          self.$[msg.mood].tap();
                      }
                      if (msg.friends) {
                          self.$.friendsList.setFriends(msg.friends);
                      }
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('getState', [], cbOK, cbError);
              },
              callCA: function(inSource, inEvent) {
                  var cbOK = function(msg) {
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('changeMood',
                                    [inSource.getActive().getContent()], cbOK,
                                    cbError);
              },
              newNotif: function(inSource, inEvent) {
                  var msg = inEvent[0];
                  if (msg.friends) {
                      this.$.friendsList.setFriends(msg.friends);
                  }
                  console.log(' got message ' + JSON.stringify(msg));
                  return true;
              }
          });
