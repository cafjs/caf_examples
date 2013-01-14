enyo.kind({
              name: 'App',
              classes: 'enyo-fit onyx',
              kind: 'Control',
              mySession: null,
              components: [
                  {kind: 'FittableRows', classes: 'enyo-fit',
                   components: [
                       {kind: 'onyx.Toolbar', content: 'Turtles App Deployer'},
                       {kind: 'ca.LoginContext', name: 'login',
                        onSession: 'newSession',
                        onNotification: 'handleNotification'},
                       {kind: 'ConfirmPopup', name: 'okPopup',
                        onDeploy: 'deployApp'},
                       {tag: 'br'},
                       {kind: 'onyx.Groupbox',
                        components: [
                            {kind: 'onyx.GroupboxHeader',
                             content: 'Deploying a New App'},
                            {kind: 'onyx.Toolbar',
                             components: [
                                 {kind: 'onyx.InputDecorator',
                                  components: [
                                      {kind: 'onyx.Input',
                                       name: 'appName',
                                       style: 'width: 90%;',
                                       placeholder: ' App local name'
                                      }
                                  ]},
                                 {kind: 'onyx.InputDecorator',
                                  components: [
                                      {kind: 'onyx.Input', name: 'appURL',
                                      style: 'width: 90%;',
                                       placeholder: ' A public URL to' +
                                       ' download your app'}
                                  ]},
                                 {kind: 'onyx.Button', content: 'Upload app',
                                  name: 'addAppButton', disabled: true,
                                  ontap: 'addApp'}
                             ]}
                        ]},
                       {tag: 'br'},
                       {kind: 'FittableColumns',
                        classes: 'onyx-toolbar onyx-toolbar-inline',
                        components: [
                            {content: 'Apps'},
                            {fit: true},
                            {kind: 'onyx.Button', content: 'Refresh',
                             ontap: 'forceRefresh'},
                            {kind: 'onyx.ToggleButton', onChange: 'autoToggled',
                             onContent: 'auto', offContent: 'manual',
                             value: true, name: 'autoSwitch'}
                        ]},
                       {fit: true, kind: 'Scroller', components: [
                            {kind: 'AppsList', name: 'appsList',
                             onRemove: 'removeApp'}
                        ]}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.$.appsList.setAppRootName(inEvent.caOwner + '_' +
                                                 inEvent.caLocalName);
                  this.mySession = inEvent.session;
                  this.$.addAppButton.setDisabled(false);
                  this.loadApps();
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
              loadApps: function() {
                  var self = this;
                  var cbOK = function(apps) {
                      self.$.appsList.setApps(apps.apps);
                      self.$.autoSwitch.setValue(apps.autoOn);
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('listApps', [], cbOK,
                                                  this.cbError);
              },
              addApp: function(inSource, inEvent) {
                  var alias = this.$.appName.getValue();
                  var url = this.$.appURL.getValue();
                  if (!alias || !url) {
                      return true;
                  }
                  var appItem = {'name' : alias, 'url' : url};
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.appsList.addApp(appItem);
                      console.log(JSON.stringify(msg));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('addApp', [appItem],
                                                  cbOK, this.cbError);
                  return true;
              },
              removeApp: function(inSource, inEvent) {
                  var appItem = {'name' : inEvent.name,
                                 'hash' : inEvent.hash,
                                 'state' : inEvent.state,
                                 'url' : inEvent.url};
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.appsList.removeApp(appItem);
                      console.log(JSON.stringify(msg));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('removeApp', [appItem],
                                    cbOK, this.cbError);
                  return true;
              },
              handleNotification: function(inSource, inEvent) {
                  /* inEvent is [{'op' : (deploy | refresh),
                   *                'appInfo' : <appItem>]
                   * with just one element.
                   */
                  if (Array.isArray(inEvent) && inEvent[0]) {
                      var item = inEvent[0];
                      if (item.op === 'deploy') {
                          console.log('confirm:' + JSON.stringify(inEvent));
                          this.$.okPopup.confirm(item.appInfo);
                      } else if (item.op === 'refresh') {
                          console.log('forceRefresh:' +
                                      JSON.stringify(inEvent));
                          this.loadApps();
                      } else {
                          console.log('ignoring op:' +
                                      JSON.stringify(inEvent));
                      }
                  }
                  return true;
              },
              // inEvent is {'appInfo' : <appItem>, ...}
              deployApp: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      console.log(JSON.stringify(msg));
                      self.loadApps();
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('deployApp',
                                                  [inEvent.appInfo], cbOK,
                                                  this.cbError);
                  return true;
              },
              cbError: function(error) {
                  console.log('ERROR:' + JSON.stringify(error));
              }
          });


