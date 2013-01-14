enyo.kind({
              name: 'App',
              classes: 'onyx enyo-unselectable',
              published: {
                  session: null,
                  caName: 'nobody_accounts',
                  caOwner: 'nobody',
                  password: 'nobody'
              },
              components: [
                  {kind: 'TroublePopup', name: 'troublePopup',
                   onContinue: 'continue'},
                  {kind: 'CreatePopup', name: 'createPopup',
                   onCreate: 'created'},
                  {kind: 'FittableColumns',
                   classes: 'header-toolbar onyx-toolbar onyx-toolbar-inline',
                   components: [
                       {name: 'dot', content: '\u25CF'},
                       {content: 'Sign in to'},
                       {kind: 'onyx.InputDecorator', fit: true, components: [
                            {kind: 'onyx.Input', style: 'width: 90%',
                             name: 'goTo',
                             placeholder: 'url of the app'}
                        ]},
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'caLocalName',
                             placeholder: 'CA local name'}
                        ]},
                       {content: 'Unrestricted'},
                       {kind: 'onyx.ToggleButton', onChange: 'toggleChanged',
                        value: false, name: 'unrestricted'}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'caOwner',
                             placeholder: 'username'}
                        ]}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'password',
                             type: 'password', placeholder: 'password'}
                        ]}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.Button', content: 'Sign in',
                        name: 'login', ontap: 'loginAccount'},
                       {kind: 'onyx.Button',
                        content: 'No account? Create one',
                        name: 'createAccountButton', ontap: 'createAccount'}
                   ]}
              ],
              create: function() {
                  this.inherited(arguments);
                  if (enyo.cloudassistant.props.goTo) {
                      this.$.goTo.setValue(enyo.cloudassistant.props.goTo);
                  }
                  if (enyo.cloudassistant.props.caOwner) {
                      this.$.caOwner.setValue(enyo.cloudassistant.props
                                               .caOwner);
                  }
                  if (enyo.cloudassistant.props.caLocalName) {
                      this.$.caLocalName.setValue(enyo.cloudassistant.props
                                                  .caLocalName);
                  }
                  if (enyo.cloudassistant.props.unrestrictedToken) {
                      this.$.unrestricted.setValue(true);
                  }
                  this.createComponent({kind: 'ca.Session', name: 'session',
                                        onOnline: 'connected',
                                        onOffline: 'disconnected',
                                        onBadCredentials: 'askForPassword',
                                        onGoodCredentials: 'resetToken',
                                        password: this.getPassword(),
                                        caOwner: this.getCaOwner(),
                                        caName: this.getCaName()});

              },

              connected: function(inSource, inEvent) {
                  this.$.dot.setStyle('color: green;');
                  return true;
              },

              disconnected: function(inSource, inEvent) {
                  this.$.dot.setStyle('color: red;');
                  return true;
              },

              // password is fixed to 'nobody'
              askForPassword: function(inSource, inEvent) {
                  return true;
              },

              resetToken: function(inSource, inEvent) {
                  return true;
              },


              createAccount: function(inSource, inEvent) {
                  this.$.createPopup.setCaOwner(this.$.caOwner.getValue());
                  this.$.createPopup.setSession(this.$.session);
                  this.$.createPopup.setShowPopup(true);
                  return true;
              },
              loginAccount: function(inSource, inEvent) {
                  var self = this;
                  var caOwner = this.$.caOwner.getValue();
                  var caLocalName = this.$.caLocalName.getValue();
                  var goToUrl = this.$.goTo.getValue();
                  var cbError = function(err) {
                      self.$.password.setValue('');
                      self.$.troublePopup.trouble(err);
                  };
                  var cbOK = function(result) {
                      self.$.password.setValue('');
                      console.log('Got token' + JSON.stringify(result.token));
                      // switch back to target app
                      window.location.replace(result.url);
                  };

                  this.$.session.remoteInvoke('login',
                                              [caOwner,
                                               this.$.password.getValue(),
                                               goToUrl,
                                               caLocalName,
                                               this.$.unrestricted.getValue()],
                                              cbOK, cbError);
                  return true;
              },
              created: function(inSource, inEvent) {
                  this.$.caOwner.setValue(inEvent.caOwner);
                  this.$.password.setValue(inEvent.password);
//                  this.loginAccount(inSource, inEvent);
                  return true;
              }
          });

enyo.kind({
              name: 'TroublePopup',
              kind: 'onyx.Popup',
              published: {
                  showPopup: false
              },
              events: {
                onContinue: ''
              },
              centered: true, modal: true, floating: true, scrim: true,
              scrimWhenModal: false, autoDismiss: false,
              style: 'text-align: center;',
              components: [
                  {content: '', name: 'moreInfo'},
                  {kind: 'onyx.Button', content: 'OK', ontap: 'continue'}
              ],
              continue: function(inSource, inEvent) {
                  this.$.moreInfo.setContent('');
                  this.setShowPopup(false);
                  this.doContinue({});
              },
              showPopupChanged: function(inSender, inEvent) {
                  if (this.showPopup) {
                      this.show();
                  } else {
                      this.hide();
                  }
              },
              trouble: function(msg) {
                  this.setShowPopup(true);
                  this.$.moreInfo.setContent(msg);
              }
          });


enyo.kind({
              name: 'CreatePopup',
              kind: 'onyx.Popup',
              published: {
                  session: null,
                  caOwner: '',
                  showPopup: false
              },
              events: {
                onCreate: ''
              },
              centered: true, modal: true, floating: true, scrim: true,
              scrimWhenModal: false, autoDismiss: false,
              style: 'text-align: center;',
              components: [
                  {kind: 'TroublePopup', name: 'troublePopup2',
                   onContinue: 'continue'},
                 {kind: 'onyx.Toolbar', classes: 'header-toolbar',
                   content: 'Create a New Account'},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'caOwner',
                             placeholder: 'caOwner'}
                        ]}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'password',
                             type: 'password', placeholder: 'password'}
                        ]}
                   ]},
                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.InputDecorator', components: [
                            {kind: 'onyx.Input', name: 'password2',
                             type: 'password',
                             placeholder: 'type password again'}
                        ]}
                   ]},

                  {kind: 'onyx.Toolbar', components: [
                       {kind: 'onyx.Button', content: 'Create Account',
                        name: 'createButton', ontap: 'createAccount'}
                   ]}
              ],
              createAccount: function(inSource, inEvent) {
                  if (this.$.password.getValue() !==
                      this.$.password2.getValue()) {
                      this.$.password.setValue('');
                      this.$.password2.setValue('');
                      this.$.troublePopup2
                          .trouble('Typed passwords do not match');
                  } else {
                      var self = this;
                      var result = {};
                      var password = this.$.password.getValue();
                      this.$.password.setValue('');
                      this.$.password2.setValue('');
                      var cbOK = function(msg) {
                          self.setShowPopup(false);
                          self.$.troublePopup2.trouble('Account created OK.' +
                                                       ' \nSign in now');
                          self.doCreate({password: password,
                                         caOwner: self.$.caOwner.getValue()});
                      };
                      var cbError = function(err) {
                          self.$.troublePopup2.trouble(err);
                      };

                      this.getSession()
                          .remoteInvoke('addAccount',
                                        [this.$.caOwner.getValue(),
                                         password],
                                        cbOK, cbError);
                  }
                  return true;
              },
              continue: function(inSource, inEvent) {
                  return true;
              },
              showPopupChanged: function(inSender, inEvent) {
                  if (this.showPopup) {
                      if (this.getCaOwner()) {
                          this.$.caOwner.setValue(this.getCaOwner());
                      }
                      this.show();
                  } else {
                      this.hide();
                  }
              }
          });
