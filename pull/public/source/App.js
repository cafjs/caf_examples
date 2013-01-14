enyo.kind({
              name: 'App',
              classes: 'enyo-fit onyx',
              kind: 'Control',
              mySession: null,
              components: [
                  {kind: 'FittableRows', classes: 'enyo-fit',
                   components: [
                       {kind: 'onyx.Toolbar', content: 'Grab that File!'},
                       {kind: 'ca.LoginContext', name: 'caSession',
                        onSession: 'newSession',
                        onNotification: 'displayRefresh'},
                       {kind: 'onyx.Groupbox',
                        components: [
                            {kind: 'onyx.GroupboxHeader',
                             content: 'Grabbing a New File'},
                            {kind: 'onyx.Toolbar',
                             components: [
                                 {kind: 'onyx.InputDecorator',
                                  components: [
                                      {kind: 'onyx.Input',
                                       name: 'resourceName',
                                       placeholder: ' An alias for your file'
                                      }
                                  ]},
                                 {kind: 'onyx.InputDecorator',
                                  components: [
                                      {kind: 'onyx.Input', name: 'resourceURL',
                                       placeholder: ' A url for your file'}
                                  ]},
                                 {kind: 'onyx.Button', content: 'Grab it!',
                                  name: 'addResourceButton', disabled: true,
                                  ontap: 'addResource'}
                             ]}
                        ]},
                       {kind: 'FittableColumns',
                        classes: 'onyx-toolbar onyx-toolbar-inline',
                        components: [
                            {content: 'Resources'},
                            {fit: true},
                            {kind: 'onyx.Button', content: 'Refresh',
                             ontap: 'forceRefresh'},
                            {kind: 'onyx.ToggleButton', onChange: 'autoToggled',
                             onContent: 'auto', offContent: 'manual',
                             value: true, name: 'autoSwitch'}
                        ]},
                       {fit: true, kind: 'Scroller', components: [
                            {kind: 'ResourcesList', name: 'resourcesList',
                             onRemove: 'removeApp'}
                        ]}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.$.addResourceButton.setDisabled(false);
                  this.loadResources();
                  return true;
              },
              loadResources: function() {
                  var self = this;
                  var cbOK = function(state) {
                      self.$.resourcesList.setResources(state.resources);
                      self.$.autoSwitch.setValue(state.autoOn);
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('listResources', [], cbOK, this.cbError);
              },
              addResource: function(inSource, inEvent) {
                  var alias = this.$.resourceName.getValue();
                  var url = this.$.resourceURL.getValue();
                  if (!alias || !url) {
                      return true;
                  }
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.resourcesList.addResource(alias);
                      console.log(JSON.stringify(msg));
                  };

                  this.mySession && this.mySession
                      .remoteInvoke('addResource', [alias, url],
                                    cbOK, this.cbError);
                  return true;
              },
              displayRefresh: function(inSource, inEvent) {
                  console.log('displayRefresh:' + JSON.stringify(inEvent));
                  this.loadResources();
                  return true;
              },
              forceRefresh: function(inSource, inEvent) {
                  var cbOK = function() {
                      console.log('forceRefresh OK!');
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('forceRefresh', [], cbOK,
                                                  this.cbError);
              },
              autoToggled: function(inSource, inEvent) {
                  var autoOn = this.$.autoSwitch.getValue();
                  var cbOK = function() {
                      console.log('autoToggled OK:' + autoOn);
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('autoMode', [autoOn], cbOK,
                                                  this.cbError);
              },
              cbError: function(error) {
               console.log('ERROR:' + JSON.stringify(error));
              }
          });


