enyo.kind({
              name: 'AppAdmin',
              classes: 'onyx enyo-unselectable',
              published: {
                  caName: 'root_accounts',
                  caOwner: 'root'
              },
              components: [
                  {kind: 'TroublePopupAdmin', name: 'troublePopupAdmin',
                   onContinue: 'continue'},
                  {kind: 'onyx.Toolbar', classes: 'header-toolbar',
                   components: [
                       {name: 'dot', content: '\u25CF'},
                       {content: 'Setup Accounts'}
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
                       {kind: 'onyx.Button', content: 'Setup',
                        name: 'setup', ontap: 'setupAccounts'},
                       {content: '', name: 'bye'}
                   ]}
              ],
              create: function() {
                  this.inherited(arguments);
                  this.$.caOwner.setValue(this.getCaOwner());
              },

              connected: function(inSource, inEvent) {
                  this.$.dot.setStyle('color: green;');
                  return true;
              },

              disconnected: function(inSource, inEvent) {
                  this.$.dot.setStyle('color: red;');
                  return true;
              },

              askForPassword: function(inSource, inEvent) {
//                  this.$.login.askForPassword();
                  this.$.troublePopupAdmin.trouble('Invalid root password');
                  return true;
              },

              resetToken: function(inSource, inEvent) {
//                  this.$.login.resetToken(inEvent.token);
                  this.$.bye.setContent('Service Accounts Setup OK');
                  return true;
              },


              setupAccounts: function(inSource, inEvent) {
                  this.$.session && this.$.session.destroy();
                  this.createComponent({kind: 'ca.Session', name: 'session',
                                        onOnline: 'connected',
                                        onOffline: 'disconnected',
                                        onBadCredentials: 'askForPassword',
                                        onGoodCredentials: 'resetToken',
                                        password: this.$.password.getValue(),
                                        caOwner: this.$.caOwner.getValue(),
                                        caName: this.getCaName()});
                  return true;
              }
          });

enyo.kind({
              name: 'TroublePopupAdmin',
              kind: 'onyx.Popup',
              published: {
                  showPopup: false
              },
              events: {
                onContinue: ''
              },
              centered: true, modal: true, floating: true,
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
                  this.$.moreInfo.setContent('Invalid credentials please try' +
                                             ' again\n' + msg);
              }
          });
