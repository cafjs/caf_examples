
var IDOL_APIs = ['detectlanguage', 'explodecontainer',
                 'readbarcode','addtotextindex', 'extractentity',
                 'expandterm', 'extracttext', 'findfaces','findsimilar',
                 'highlight', 'detectimage', 'view', 'ocr', 'query',
                 'dynamicthesaurus', 'detectsentiment', 'storeobject',
                 'tokenize','createtextindex', 'deletetextindex', 'listindex'];
enyo.kind({
              name: 'App',
              classes: 'onyx enyo-fit',
              kind: 'FittableRows',
              caOwner: '',
              op:null,
              history:[],
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'IDOL Pipes Hello World!'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {kind: 'ErrorPopup', name: 'errorPopup'},
                  {tag: 'br'},
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'apiKey',
                             type: 'password',
                             placeholder: 'd214cf98-XXXX-XXXX-XXXX-XXXXXXXXXXXX'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'addKey',
                        content: 'Add API Key', ontap: 'addKey'}
                   ]
                  },
                  {kind: 'onyx.Toolbar', content: 'Build'},
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'numSerPar',
                             placeholder: '2'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'serial',
                        content: 'Serial', ontap: 'addSerPar'},
                       {kind: 'onyx.Button', name: 'parallel',
                        content: 'Parallel', ontap: 'addSerPar'}
                   ]
                  },
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'inputId',
                             placeholder: 'unique ID'}
                         ]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'explodeVal',
                             placeholder: 'http://...'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'explode',
                        content: 'Explode Container', ontap: 'addExplode'}
                   ]},
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'id',
                             placeholder: 'unique ID'}
                        ]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'opInputs',
                             placeholder: '["in1","in2",...]'}
                        ]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'opFilters',
                             placeholder: '["*.jpg","*/foo/*.txt",...]'}
                        ]
                       },

                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'opArgs',
                             placeholder: '{"mode": "photo",...}'}
                        ]
                       },
                       {kind: 'onyx.MenuDecorator', onSelect: 'addOp',
                        components: [
                            {content: 'API'},
                            {kind: 'onyx.Menu', floating: true, components: [
                                 {content:'detectlanguage'},
                                 {content:'readbarcode'},
                                 {content:'addtotextindex'},
                                 {content:'extractentity'},
                                 {content: 'expandterm'},
                                 {content:  'extracttext'},
                                 {content: 'findfaces'},
                                 {content: 'findsimilar'},
                                 {content: 'highlight'},
                                 {content:  'detectimage'},
                                 {content:  'view'},
                                 {content:  'ocr'},
                                 {content:  'query'},
                                 {content:  'dynamicthesaurus'},
                                 {content:  'detectsentiment'},
                                 {content:  'storeobject'},
                                 {content:  'tokenize'},
                                 {content: 'createtextindex'},
                                 {content:  'deletetextindex'},
                                 {content:  'listindex'}
                             ]}
                        ]}

                   ]},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'OpList', name: 'opList'}
                   ]
                  },
                  {kind: 'onyx.Toolbar', content: 'Results'},
                  {kind: 'enyo.Control', tag:'div',
                   style: 'border-style: solid; border-width: 1px; ' +
                   'padding: 5px; margin: 5px; min-height: 40px',
                   components: [
                       {tag: 'span', name: 'resultTag'}
                   ]
                  },
                  {kind: 'onyx.Toolbar', content: 'Manage'},
                  {kind: 'FittableColumns', classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.Button', name: 'submit',
                        content: 'Submit', ontap: 'nowSubmit'},
                       {kind: 'onyx.Button', name: 'undo',
                        content: 'Undo', ontap: 'undo'},
                       {kind: 'onyx.Button', name: 'clear',
                        content: 'Clear', ontap: 'nowClear'},
                       {fit: true},
                       {kind: 'onyx.Button', name: 'query',
                        content: 'Refresh', ontap: 'nowQuery'},
                       {kind: 'onyx.ToggleButton', onChange: 'autoToggled',
                        onContent: 'auto', offContent: 'manual',
                        value: true, name: 'autoSwitch'}

                   ]}
              ],
              addSerPar: function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      if (inSource.name === 'serial') {
                          this.op = this.op.__seq__(parseInt(this.$.numSerPar
                                                             .getValue()) || 2);
                      } else if (inSource.name === 'parallel') {
                          this.op = this.op.__par__(parseInt(this.$.numSerPar
                                                             .getValue()) || 2);
                      } else {
                          throw new Error('addSerPar: unknown source name' +
                                          inSource.name);
                      }
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
              },
              addExplode: function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      var url = this.$.explodeVal.getValue();
                      var id = this.$.inputId.getValue() || null;
                      this.op = this.op.explodecontainer({'url' : url}, null,
                                                         id);
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
              },
              addOp : function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      var opName = inEvent.originator.content;
                      var id = this.$.id.getValue() || null;
                      var inputs =  JSON.parse(this.$.opInputs.getValue());
                      var filters =  JSON.parse(this.$.opFilters.getValue() ||
                                                '[]');
                      var args = JSON.parse(this.$.opArgs.getValue() ||
                                                '{}');
                      if (filters.length > 0) {
                          args.filter = filters;
                      }
                      var inputObj = {};
                      Array.isArray(inputs) &&
                          inputs.forEach(function(x, i) {
                                             inputObj['in_'+ i] = x;
                                         });
                      this.op = this.op[opName](args, inputObj, id);
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
              },
              display: function() {
                  this.$.opList.setOp(this.op);
                  var all = this.op.__map__(function(x) { return x;});
                  console.log(JSON.stringify(all));
              },
              nowClear : function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.op = conduit.newInstance(IDOL_APIs);
                      self.history = [];
                      self.display();
                  };
                 this.mySession && this.mySession
                      .remoteInvoke('clearAll', [false],
                                    cbOK, this.cbError);
                  return true;
              },
              writeResults : function(res) {
                  var out = {};
                  Object.keys(res).forEach(function(x) {
                                               out[x] = res[x].data;
                                           });
                  this.$.resultTag.setContent(JSON.stringify(out));
              },
              newNotif :function(inSource, inEvent) {
                  var msg = inEvent[0];
                  this.writeResults(msg);
                  console.log(JSON.stringify(msg));
                  return true;
              },
              nowSubmit : function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.writeResults(msg);
                      console.log(JSON.stringify(msg));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('newOp', [self.op.__stringify__()],
                                    cbOK, this.cbError);
                  return true;
              },
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
                  this.op = conduit.newInstance(IDOL_APIs);

                  this.nowQuery();
                  return true;
              },
              nowQuery: function() {
                  var self = this;
                  var cbOK = function(msg) {
                      self.$.autoSwitch.setValue(msg.autoOn);
                      self.op && self.history.push(self.op);
                      self.op = conduit.parse(msg.opStr);
                      self.display();
                      self.writeResults(msg.acc || {});
                      console.log(JSON.stringify(msg));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('getState', [], cbOK, this.cbError);
                  return true;
              },
              notify: function(msg) {
                  this.$.errorPopup.notify(msg);
              },
              undo: function(inSource, inEvent) {
                  var last = this.history.pop() ||
                      conduit.newInstance(IDOL_APIs);
                  this.op = last;
                  this.display();
                  return true;
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
              addKey:  function(inSource, inEvent) {
                  var self = this;
                  var key = this.$.apiKey.getValue();
                  var cbOK = function() {
                      console.log('key changed OK');
                      self.$.apiKey.setValue('');
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('addKey', [key], cbOK,
                                                  this.cbError);
              },
              cbError: function(error) {
               console.log('ERROR:' + JSON.stringify(error));
              }

          });


enyo.kind({
              name: 'ErrorPopup',
              components: [
                  {
                      kind: 'onyx.Popup',
                      name: 'popup',
                      centered: true,
                      modal: true,
                      floating: true,
                      components: [
                          {tag: 'b', name: 'msgTag'},
                          {kind: 'onyx.Button', name: 'ok',
                           content: 'OK', ontap: 'popHide'}
                      ]
                  }
              ],
              notify: function(msg) {
                  this.$.msgTag.setContent(msg);
                  this.$.popup.show();
              },
              popHide: function(inSender, inEvent) {
                  this.$.popup.hide();
                  return true;
              }
          });
