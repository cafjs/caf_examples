enyo.kind({
              name: 'App',
              classes: 'onyx enyo-fit',
              kind: 'FittableRows',
              caOwner: '',
              op:null,
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Conduit Hello World!'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
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
                            {kind: 'onyx.Input', name: 'constantId',
                             placeholder: 'unique ID'}
                         ]
                       },
                       {kind: 'onyx.InputDecorator',
                        components: [
                            {kind: 'onyx.Input', name: 'constantVal',
                             placeholder: '0'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'constant',
                        content: 'Constant', ontap: 'addConstant'}
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
                  {kind: 'onyx.Toolbar', content: 'Manage'},
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.Button', name: 'submit',
                        content: 'Submit', ontap: 'nowSubmit'},
                       {kind: 'onyx.Button', name: 'query',
                        content: 'Query', ontap: 'nowQuery'},
                       {kind: 'onyx.Button', name: 'clear',
                        content: 'Clear', ontap: 'nowClear'}
                   ]}
              ],
              addSerial: function(inSource, inEvent) {
                  this.op = this.op.__seq__(parseInt(this.$.numSerPar
                                                     .getValue()) || 2);
                  this.display();
                  return true;
              },
              addParallel: function(inSource, inEvent) {
                  this.op = this.op.__par__(parseInt(this.$.numSerPar
                                                     .getValue()) || 2);
                  this.display();
                  return true;
              },
              addConstant: function(inSource, inEvent) {
                  var val = parseInt(this.$.constantVal.getValue()) || 0;
                  var id = this.$.constantId.getValue() || null;
                  this.op = this.op.doCons({'value' : val}, id);
                  this.display();
                  return true;
              },
              addPlus:  function(inSource, inEvent) {
                  var id = this.$.id.getValue() || null;
                  var left =  this.$.left.getValue() || null;
                  var right =  this.$.right.getValue() || null;
                  this.op = this.op.doPlus({'left' : left, 'right': right}, id);
                  this.display();
                  return true;
              },
              addMinus:  function(inSource, inEvent) {
                  var id = this.$.id.getValue() || null;
                  var left =  this.$.left.getValue() || null;
                  var right =  this.$.right.getValue() || null;
                  this.op = this.op.doMinus({'left' : left, 'right': right}, id);
                  this.display();
                  return true;
              },
              addMul:  function(inSource, inEvent) {
                  var id = this.$.id.getValue() || null;
                  var left =  this.$.left.getValue() || null;
                  var right =  this.$.right.getValue() || null;
                  this.op = this.op.doMul({'left' : left, 'right': right}, id);
                  this.display();
                  return true;
              },
              addDiv:  function(inSource, inEvent) {
                  var id = this.$.id.getValue() || null;
                  var left =  this.$.left.getValue() || null;
                  var right =  this.$.right.getValue() || null;
                  this.op = this.op.doDiv({'left' : left, 'right': right}, id);
                  this.display();
                  return true;
              },
              display: function() {
                  this.$.opList.setOp(this.op);
                  var all = this.op.__map__(function(x) { return x;});
                  console.log(JSON.stringify(all));
              },
              nowClear : function(inSource, inEvent) {
                  this.op = conduit.newInstance(['doCons', 'doPlus', 'doMinus',
                                                 'doDiv', 'doMul']);
                  this.display();
                  return true;
              },
              nowSubmit : function(inSource, inEvent) {
                  var self = this;
                  var cbOK = function(msg) {
//                      self.$.opList.setOp(msg.op);
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
                  this.op = conduit.newInstance(['doCons', 'doPlus', 'doMinus',
                                                 'doDiv', 'doMul']);

                  this.nowQuery();
                  return true;
              },
              nowQuery: function() {
                  var self = this;
                  var cbOK = function(msg) {
//                      self.$.opList.setOp(msg.op);
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession && this.mySession
                      .remoteInvoke('getState', [], cbOK, cbError);
              }
          });


