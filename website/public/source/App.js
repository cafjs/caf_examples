/*
 *
 *
 */
enyo.kind({
              name: 'App',
              classes: 'app onyx font-lato enyo-unselectable',
              published: {
                  session: null,
                  caOwner: '',
                  token: ''
              },
              components: [
                  {kind: 'Panels',  narrowFit: false, name: 'mainPanels',
                   classes: 'panels enyo-fit',
                   arrangerKind: 'CollapsingArranger',
                   components: [
                       {kind: 'NavView', name: 'navView',
                        onSession: 'startSession',
                        onLogout: 'stopSession',
                        onNewApp: 'newApp',
                        onReload: 'reloadApps',
                        onSelect: 'selectApp',
                        onRemove: 'deleteApp'},
                       {kind: 'AppView', name: 'appView',
                        onToggleFullScreen: 'toggleFullScreen'}
                   ],
                   statics: {
                       isScreenNarrow: function() {
                           return enyo.dom.getWindowWidth() <= 600;
                       }
                   }}
              ],
              create: function() {
                  // set default local name for this app
                  enyo.cloudassistant.props.caLocalName = 'launcher';
                  this.inherited(arguments);
              },
              // events from navView
              startSession: function(inSource, inEvent) {
                  var self = this;
                  this.setSession(inEvent.session);
                  this.setToken(inEvent.token);
                  this.setCaOwner(inEvent.caOwner);
                  var cbOK = function() {
                      self.reloadApps();
                  };
                  var cbError = function(error) {
                      console.log('Error: Cannot refresh tokens' +
                                  JSON.stringify(error));
                  };
                  this.refreshTokens(cbOK, cbError);
              },
              refreshTokens: function(cbOK, cbError) {
                  this.getSession() &&
                      this.getSession().remoteInvoke('refreshTokens',
                                                     [this.getToken()],
                                                     cbOK, cbError);
              },
              stopSession: function(inSource, inEvent) {
                  this.setSession(null);
                  this.$.navView.clean();
                  this.$.appView.clean();
                  window.location.replace(enyo.cloudassistant.props.baseUrl);
              },
              newApp: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(appToken) {
                      self.$.navView.addApp({appName: inEvent.appName,
                                             caLocalName: inEvent.caLocalName,
                                             token: appToken,
                                             caOwner: self.getCaOwner()});
                      inEvent.token = appToken;
                      self.selectApp(inSource, inEvent);
                  };
                  var cbError = function(error) {
                      console.log('Error: Cannot add App' +
                                  JSON.stringify(error));
                  };
                  this.getSession() &&
                      this.getSession().remoteInvoke('addApp',
                                                     [inEvent.appName,
                                                      this.getCaOwner(),
                                                      inEvent.caLocalName,
                                                      this.getToken()],
                                                     cbOK, cbError);
              },
              selectApp: function(inSource, inEvent) {
                  this.$.appView.loadApp(inEvent.appName,
                                         this.getCaOwner(),
                                         inEvent.token,
                                         inEvent.caLocalName);
              },
              deleteApp: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.appView.cleanIfCurrent(inEvent.appName,
                                                    inEvent.caLocalName);
                      self.$.navView.removeApp({appName: inEvent.appName,
                                                caLocalName:
                                                inEvent.caLocalName});
                  };
                  var cbError = function(error) {
                      console.log('Error: Cannot delete App' +
                                  JSON.stringify(error));
                  };
                  this.getSession() &&
                      this.getSession().remoteInvoke('deleteApp',
                                                     [inEvent.appName,
                                                      inEvent.caLocalName],
                                                     cbOK, cbError);
              },

              // events from AppView
              toggleFullScreen: function(inSource, inEvent) {
                  var index = this.$.mainPanels.getIndex();
                  this.$.mainPanels.setIndex((index === 0 ? 1 : 0));
              },
              reloadApps: function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(apps) {
                      self.$.navView.resetApps();
                      self.$.navView.bulkAddApps(apps);
                  };
                  var cbError = function(error) {
                      console.log('Error: Cannot list Apps' +
                                  JSON.stringify(error));
                  };
                  this.getSession() &&
                      this.getSession().remoteInvoke('listApps',
                                                     [this.getToken()],
                                                     cbOK, cbError);
              }
          });


enyo.kind({
              name: 'NavView',
              kind: 'FittableRows', classes: 'onyx',
              published: {
              },
              events: {
                  onNewApp: '',
                  onReload: ''
                  // onRemove and onSelect bubble from AppItem
                  // onLogout and onSession bubbles from LoginContext
              },
              components: [
                  {kind: 'onyx.Toolbar', classes: 'header-toolbar',
                   content: 'Launcher'},
                  {kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout',
                   components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'appName',
                             placeholder: 'App Name'}
                        ]},
                       {fit: true},
                       {kind: 'onyx.MenuDecorator', onSelect: 'appSelected',
                        components: [
                            {content: 'Find'},
                            {kind: 'onyx.Menu', floating: true, components: [
                                 {content: 'helloworld'},
                                 {content: 'moody'},
                                 {content: 'turtles'},
                                 {content: 'mail'},
                                 {content: 'pull'},
                                 {content: 'justonce'},
                                 {content: 'mutant'},
                                 {content: 'tutorial1a'},
                                 {content: 'tutorial1b'},
                                 {content: 'tutorial1c'},
                                 {content: 'tutorial1d'},
                                 {content: 'tutorial1e'}
                             ]}
                        ]}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'caLocalName',
                             placeholder: 'Give a name to your CA'}
                        ]}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.Button', content: 'Load App',
                        name: 'loadButton', ontap: 'loadApp'}
                   ]},
                  {kind: 'AppsList', fit: true, name: 'appList'},
                  {kind: 'ca.LoginContext', name: 'loginCtx',
                   onSession: 'newSession', classes: 'footer-toolbar',
                   onNotification: 'newNotif'}
              ],
              appSelected: function(inSource, inEvent) {
                  this.$.appName.setValue(inEvent.originator.content);
                  return true;
              },
              loadApp: function(inSource, inEvent) {
                  this.doNewApp({appName: this.$.appName.getValue(),
                                 caLocalName: this.$.caLocalName.getValue()});
                   this.$.appName.setValue('');
                   this.$.caLocalName.setValue('');
              },
              /* app type is {appName : <string>, caLocalName : <string>,
                              token:<string>, caOwner:<string>}
               */
              addApp: function(app) {
                  this.$.appList.addApp(app);
              },
              bulkAddApps: function(apps) {
                  this.$.appList.bulkAddApps(apps);
              },
              removeApp: function(app) {
                  this.$.appList.removeApp(app);
              },
              resetApps: function() {
                  this.$.appList.resetApps();
              },
              clean: function() {
                  this.$.appList.resetApps();
              },
              newNotif: function(inSource, inEvent) {
                  this.doReload();
              }
          });

enyo.kind({
              name: 'AppsList',
              kind: 'enyo.Scroller',
              apps: {},
              keys: [],
              onSetupItem: 'setupItem',
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {name: 'oneApp', kind: 'AppItem'}
                   ]
                  }
              ],
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var appItem = this.apps[key];
                  var oneApp = rowHandle.item.$.oneApp;
                  oneApp.setAppItem(appItem);
              },
              addApp: function(app) {
                  var index = app.appName + '#' + app.caLocalName;
                  this.apps[index] = app;
                  this.refreshList();
              },
              bulkAddApps: function(apps) {
                  var self = this;
                  apps.forEach(function(app) {
                                   var index = app.appName + '#' +
                                       app.caLocalName;
                                   self.apps[index] = app;
                               });
                  this.refreshList();
              },
              removeApp: function(app) {
                  var index = app.appName + '#' + app.caLocalName;
                  delete this.apps[index];
                  this.refreshList();
              },
              resetApps: function() {
                  this.apps = {};
                  this.refreshList();
              },
              refreshList: function() {
                  // Object.keys not supported in IE8
                  var getKeys = Object.keys || function(obj) {
                      var result = [];
                      for (var name in obj) {
                          if (obj.hasOwnProperty(name)) {
                              result.push(name);
                          }
                      }
                      return result;
                  };
                  this.keys = getKeys(this.apps).sort();
                  this.$.list.setCount(this.keys.length);
                  this.$.list.build();
                  this.render();
              }
          });

enyo.kind({
              name: 'AppItem',
              kind: 'onyx.Groupbox',
              classes: 'app-item',
              events: {
                  onRemove: '',
                  onSelect: ''
              },
              published: {
                  appItem: {}
              },
              components: [
                  {kind: 'onyx.GroupboxHeader', name: 'headerTag',
                   content: '_'},
                  {classes: 'onyx-toolbar-inline', components: [
                       {kind: 'onyx.Button', content: 'Show',
                        classes: 'onyx-affirmative', ontap: 'showApp'},
                       {kind: 'onyx.Button', content: 'Remove',
                        classes: 'onyx-negative', ontap: 'removeApp'}
                   ]}
              ],
              showApp: function(inSender, inEvent) {
                  this.doSelect(this.appItem);
                  return true;
              },
              removeApp: function(inSender, inEvent) {
                  this.doRemove(this.appItem);
                  return true;
              },
              appItemChanged: function(inSender, inEvent) {
                  this.$.headerTag.setContent(this.appItem.appName + '#' +
                                               this.appItem.caOwner + '_' +
                                               this.appItem.caLocalName);
                  this.render();
                  return true;
              }
          });


enyo.kind({
              name: 'AppView',
              kind: 'FittableRows', classes: 'enyo-fit',
              style: 'background: #F0F0F0;',
              published: {
                  appName: 'My cool app',
                  srcUrl: ''
              },
              events: {
                  onToggleFullScreen: ''
              },
              current: {},
              components: [
                  {name: 'iframe', fit: true, tag: 'iframe',
                   src: '',
                   classes: 'wide',
                   attributes: {onload: enyo.bubbler, frameBorder: 0}
                  },
                  {kind: 'FittableColumns', name: 'viewSourceToolbar',
                   noStretch: true, classes: 'onyx-toolbar footer-toolbar',
                   components: [
                       {kind: 'onyx.Grabber',
                        ontap: 'doToggleFullScreen'},
                       {fit: true}, // Spacer
                       {name: 'appLabel', content: ''}
                   ]}
              ],
              create: function() {
                  this.inherited(arguments);
                  this.setSrcUrl(enyo.cloudassistant.props.origin +
                                 '/blank.html');
              },
              appNameChanged: function(inSender, inEvent) {
                  this.$.appLabel.setContent(this.getAppName());
                  this.render();
              },
              srcUrlChanged: function(inSender, inEvent) {
                  var newUrl = this.getSrcUrl();
                  newUrl = (newUrl ? newUrl :
                            enyo.cloudassistant.props.origin + '/blank.html');
                  this.$.iframe.setSrc(newUrl);
              },
              loadApp: function(appName, caOwner, token, caLocalName) {
                  var caProps = enyo.cloudassistant.props || {};
                  this.current = {appName: appName, caLocalName: caLocalName};
                  var hostLst = caProps.appHost.split('.');
                  hostLst.shift();
                  hostLst.unshift(appName);
                  var hostName = hostLst.join('.');
                  var url = caProps.appProtocol + '//' + hostName +
                      '/app.html?caOwner=' + encodeURIComponent(caOwner);
                  token = token || caProps.token;
                  if (token) {
                      url = url + '&token=' +
                          encodeURIComponent(JSON.stringify(token));
                  }
                  caLocalName = caLocalName || caProps.caLocalName;
                  if (caLocalName) {
                      url = url + '&caLocalName=' +
                          encodeURIComponent(caLocalName);
                  }
                  this.setSrcUrl(url);
                  this.setAppName(appName + '#' + caOwner + '_' + caLocalName);
              },
              cleanIfCurrent: function(appName, caLocalName) {
                  if (this.current && (this.current.appName === appName) &&
                      (this.current.caLocalName == caLocalName)) {
                      this.clean();
                  }
              },
              clean: function() {
                  this.setAppName('');
                  this.setSrcUrl('');
              }
          });
