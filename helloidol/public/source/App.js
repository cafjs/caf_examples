var IDOL_APIs = ['detectlanguage', 'explodecontainer',
                 'readbarcode','addtotextindex', 'extractentity',
                 'expandterm', 'extracttext', 'findfaces','findsimilar',
                 'highlight', 'detectimage', 'view', 'ocr', 'query',
                 'dynamicthesaurus', 'detectsentiment', 'storeobject',
                 'tokenize','createtextindex','deletetextindex', 'listindex'];
enyo.kind({
              name: 'App',
              classes: 'onyx enyo-fit',
              kind: 'FittableRows',
              caOwner: '',
              op:null,
              history:[],
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Idol Pipes Hello World!'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {kind: 'ErrorPopup', name: 'errorPopup'},
                  {tag: 'br'},
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
                        content: 'Serial', ontap: 'addSerial'},
                       {kind: 'onyx.Button', name: 'parallel',
                        content: 'Parallel', ontap: 'addParallel'}
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
                            {kind: 'onyx.Input', name: 'inputVal',
                             placeholder: 'http://...'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'input',
                        content: 'Add Input', ontap: 'addInput'}
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
                            {kind: 'onyx.Input', name: 'left',
                             placeholder: 'left ID'}
                        ]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'right',
                             placeholder: 'right ID'}
                        ]
                       },
                       {kind: 'onyx.Button', name: 'plus',
                        content: 'Plus', ontap: 'addPlus'},
                       {kind: 'onyx.Button', name: 'minus',
                        content: 'Minus', ontap: 'addMinus'},
                        {kind: 'onyx.Button', name: 'mul',
                        content: 'Mul', ontap: 'addMul'},
                       {kind: 'onyx.Button', name: 'div',
                        content: 'Div', ontap: 'addDiv'}
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
              addSerial: function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      this.op = this.op.__seq__(parseInt(this.$.numSerPar
                                                     .getValue()) || 2);
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
             },
              addParallel: function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      this.op = this.op.__par__(parseInt(this.$.numSerPar
                                                         .getValue()) || 2);
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
              },
              addInput: function(inSource, inEvent) {
                  try {
                      this.history.push(this.op);
                      var val = parseInt(this.$.inputVal.getValue()) || 0;
                      var id = this.$.inputId.getValue() || null;
                      this.op = this.op.doCons({'value' : val}, null,  id);
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
              },
              addBinOp : function(inSource, inEvent, opName) {
                  try {
                      this.history.push(this.op);
                      var id = this.$.id.getValue() || null;
                      var left =  this.$.left.getValue() || null;
                      var right =  this.$.right.getValue() || null;
                      this.op = this.op[opName](null, {'left' : left,
                                                       'right': right}, id);
                      this.display();
                  } catch (e) {
                      this.history.pop();
                      this.notify(e.toString());
                  } finally {
                      return true;
                  }
              },
              addPlus:  function(inSource, inEvent) {
                  return this.addBinOp(inSource, inEvent, 'doPlus');
              },
              addMinus:  function(inSource, inEvent) {
                  return this.addBinOp(inSource, inEvent, 'doMinus');
              },
              addMul:  function(inSource, inEvent) {
                  return this.addBinOp(inSource, inEvent, 'doMul');
              },
              addDiv:  function(inSource, inEvent) {
                  return this.addBinOp(inSource, inEvent, 'doDiv');
              },
              display: function() {
                  this.$.opList.setOp(this.op);
                  var all = this.op.__map__(function(x) { return x;});
                  console.log(JSON.stringify(all));
              },
              nowClear : function(inSource, inEvent) {
                  this.op = conduit.newInstance(IDOL_APIs);
                  this.history = [];
                  this.display();
                  return true;
              },
              writeResults : function(res) {
                  var out = {};
                  Object.keys(res).forEach(function(x) {
                                               out[x] = res[x].data.value;
                                           });
                  this.$.resultTag.setContent(JSON.stringify(out));
              },
              nowSubmit : function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
                      self.writeResults(msg);
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('newOp', [self.op.__stringify__()],
                                    cbOK, cbError);
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
                      self.op && self.history.push(self.op);
                      self.op = conduit.parse(msg.opStr);
                      self.display();
                      self.writeResults(msg.acc || {});
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('getState', [], cbOK, cbError);
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
