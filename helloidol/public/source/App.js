
var IDOL_APIs =  ['identifylanguage', 'expandcontainer',
                  'recognizebarcodes', 'extractentities',
                  'expandterms', 'extracttext', 'detectfaces',
                  'findsimilar', 'highlighttext', 'recognizeimages',
                  'viewdocument', 'ocrdocument', 'querytextindex',
                  'findrelatedconcepts', 'analyzesentiment', 'storeobject',
                  'tokenizetext'];

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
                            {kind: 'onyx.Input', name: 'expandVal',
                             placeholder: 'http://...'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'expand',
                        content: 'Expand Container', ontap: 'addExpand'}
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
                                 {content: 'identifylanguage'},
                                 {content: 'expandcontainer'},
                                 {content: 'recognizebarcodes'},
                                 {content: 'extractentities'},
                                 {content: 'expandterms'},
                                 {content: 'extracttext'},
                                 {content: 'detectfaces'},
                                 {content: 'findsimilar'},
                                 {content: 'highlighttext'},
                                 {content: 'recognizeimages'},
                                 {content: 'viewdocument'},
                                 {content: 'ocrdocument'},
                                 {content: 'querytextindex'},
                                 {content: 'findrelatedconcepts'},
                                 {content: 'analyzesentiment'},
                                 {content: 'storeobject'},
                                 {content: 'tokenizetext'}
                             ]}
                        ]}

                   ]},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'OpList', name: 'opList'}
                   ]
                  },
                  {kind: 'onyx.Toolbar', content: 'Results'},
                  {kind: 'Scroller', style: " height: 200px;", components: [
                       {kind: 'ResultList', name: 'resultList'}
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
              addExpand: function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      var url = this.$.expandVal.getValue();
                      var id = this.$.inputId.getValue() || null;
                      this.op = this.op.expandcontainer({'url' : url}, null,
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
                      self.writeResults({});
                      self.display();
                  };
                 this.mySession && this.mySession
                      .remoteInvoke('clearAll', [false],
                                    cbOK, this.cbError);
                  return true;
              },
              writeResults : function(res) {
                  this.$.resultList.setResult(res);
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
                      if (msg.opStr) {
                          var newOp = conduit.parse(msg.opStr);
                          if (newOp) {
                              self.op && self.history.push(self.op);
                              self.op = newOp;
                          }
                      };
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
