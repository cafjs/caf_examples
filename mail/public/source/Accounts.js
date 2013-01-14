enyo.kind({
              name: 'Accounts',
              kind: 'onyx.Groupbox',
              published: {
                  // type is [{'alias': <string>, 'active': <boolean>}]
                  allAccounts: [],
                  enabled: false
              },
              events: {
                onAccount: ''
              },
              components: [
                  {
                      kind: 'onyx.Popup',
                      name: 'popup',
                      centered: true,
                      modal: true,
                      floating: true,
                      components: [
                          {content: 'Adding a new IMAP e-mail account'},
                          {
                              kind: 'onyx.InputDecorator',
                              name: 'aliasInputDecorator',
                              style: 'display: block;',
                              components: [
                                  {
                                      kind: 'onyx.Input',
                                      placeholder: 'account alias',
                                      style: 'width: 90%;',
                                      name: 'aliasInput'
                                  }
                              ]
                          },
                          {
                              kind: 'onyx.InputDecorator',
                              name: 'nameInputDecorator',
                              style: 'display: block;',
                              components: [
                                  {
                                      kind: 'onyx.Input',
                                      placeholder: 'name',
                                      style: 'width: 90%;',
                                      name: 'nameInput'
                                  }
                              ]
                          },
                          {
                              kind: 'onyx.InputDecorator',
                              name: 'passwordInputDecorator',
                              style: 'display: block;',
                              components: [
                                  {
                                      kind: 'onyx.Input',
                                      placeholder: 'password',
                                      type: 'password',
                                      style: 'width: 90%;',
                                      name: 'passwordInput'
                                  }
                              ]
                          },
                          {
                              kind: 'onyx.InputDecorator',
                              name: 'serverInputDecorator',
                              style: 'display: block;',
                              components: [
                                  {
                                      kind: 'onyx.Input',
                                      placeholder: 'server',
                                      style: 'width: 90%;',
                                      name: 'serverInput'
                                  }
                              ]
                          },
                          {
                              kind: 'onyx.InputDecorator',
                              name: 'portInputDecorator',
                              style: 'display: block;',
                              components: [
                                  {
                                      kind: 'onyx.Input',
                                      placeholder: 'port',
                                      style: 'width: 90%;',
                                      name: 'portInput'
                                  }
                              ]
                          },
                          {
                              kind: 'onyx.Button',
                              content: 'Add',
                              ontap: 'newAccount'
                          }
                      ]
                  },
                  {
                      kind: 'FittableColumns',
                      fit: true,
                      components: [
                          {
                              kind: 'onyx.Button',
                              name: 'addButton',
                              disabled: true,
                              content: 'Add account',
                              classes: 'mail-account-button',
                              ontap: 'showPopup'
                          },
                          {
                              name: 'accContainer' ,
                              defaultKind: 'onyx.Button',
                              components: [
                              ]
                          }
                      ]
                  }
              ],
              newAccount: function(inSource, inEvent) {
                  var result = {};
                  result.alias = this.$.aliasInput.getValue();
                  result.name = this.$.nameInput.getValue();
                  result.passwd = this.$.passwordInput.getValue();
                  result.server = this.$.serverInput.getValue();
                  result.port = parseInt(this.$.portInput.getValue());
                  this.hidePopup();
                  this.doAccount(result);
                  this.$.passwordInput.setValue('');
              },
              showPopup: function() {
                  this.$.popup.show();
              },
              hidePopup: function() {
                  this.$.popup.hide();
              },
              allAccountsChanged: function(oldValue) {
                  var self = this;
                  var conAcc = this.$.accContainer;
                  conAcc.destroyComponents();

                  this.allAccounts.forEach(
                      function(acc) {
                          if (acc.active) {
                              conAcc.createComponent(
                                  {content: acc.alias,
                                   kind: 'onyx.Button',
                                   classes: 'onyx-affirmative' +
                                   '  mail-account-button'},
                                  {owner: conAcc}
                              );
                          } else {
                              conAcc.createComponent(
                                  {content: acc.alias,
                                   kind: 'onyx.Button',
                                   classes: 'onyx-negative' +
                                   ' mail-account-button'},
                                  {owner: conAcc}
                              );
                          }
                      });
                  conAcc.render();
              },
              enabledChanged: function(oldValue) {
                  if (this.enabled && !oldValue) {
                      this.$.addButton.setDisabled(false);
                  }
              }

          });
