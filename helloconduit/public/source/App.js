enyo.kind({
              name: 'App',
              classes: 'onyx enyo-fit',
              kind: 'FittableRows',
              caOwner: '',
              mySession: null,
              components: [
                  {kind: 'onyx.Toolbar', content: 'Conduit Hello World!'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession', onNotification: 'newNotif'},
                  {tag: 'br'},
                  {kind: 'onyx.Toolbar', content: 'Operations'},
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
                            {kind: 'onyx.Input', name: 'constant',
                             placeholder: '0'}
                         ]
                       },
                       {kind: 'onyx.Button', name: 'constantButton',
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
                  {classes:  'onyx-toolbar-inline',
                   components: [
                       {kind: 'onyx.Button', name: 'submit',
                        content: 'Submit', ontap: 'nowSubmit'},
                       {kind: 'onyx.Button', name: 'query',
                        content: 'Query', ontap: 'nowQuery'},
                       {kind: 'onyx.Button', name: 'clear',
                        content: 'Clear', ontap: 'nowClear'}
                   ]},
                  {kind: 'onyx.Toolbar', content: 'Op'},
                  {fit: true, kind: 'Scroller', components: [
                       {kind: 'OpList', name: 'opList'}
                   ]}
              ],
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.caOwner = inEvent.caOwner;
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
              },
              addDevice: function(inSource, inEvent) {
                  var self = this;
                  var deviceId = this.$.deviceName.getValue();
                  var cbOK = function(msg) {
                      self.$.opList.addOp(deviceId);
                      self.$.deviceName.setValue("");
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  this.mySession &&
                      this.mySession.remoteInvoke('addOp',
                                                  [deviceId],
                                                  cbOK, cbError);
                  return true;
              },
              upDown: function(inSource, inEvent) {
                  var self = this;
                  var one = parseInt(this.$.deviceOne.getValue());
                  var two = parseInt(this.$.deviceTwo.getValue());
                  var three = parseInt(this.$.deviceThree.getValue());
                  if (isNaN(one) || isNaN(two) || isNaN(three)) {
                      console.log('upDown:Ignoring bad input');
                      return true;
                  }
                  // index starts by 0
                  one = one -1;
                  two = two -1;
                  three = three -1;
                  var cbOK = function(msg) {
                      self.$.deviceOne.setValue("");
                      self.$.deviceTwo.setValue("");
                      self.$.deviceThree.setValue("");
                      console.log(JSON.stringify(msg));
                  };
                  var cbError = function(error) {
                      console.log('ERROR:' + JSON.stringify(error));
                  };
                  // this.mySession &&
                  //     this.mySession.remoteInvoke('upDown',
                  //                                 [[one,two,three], true],
                  //                                 cbOK, cbError);
                  this.mySession &&
                      this.mySession.remoteInvoke('blinkAway',
                                                  [[one,two,three]],
                                                  cbOK, cbError);
                  return true;
              }
          });


