
var remoteInvoke2Node = function(self, method) {
    var cbOK2Node = function(cb) {
        return function(data) {
            cb(null, data);
        };
    };

    var cbError2Node = function(cb) {
        return function(err) {
            cb(err);
        };
    };

    return function(args, cb) {
        if (!self.mySession) {
            cb('Error: no session');
        } else {
            self.mySession.remoteInvoke(method, args, cbOK2Node(cb),
                                        cbError2Node(cb));
        }
    };
};

enyo.kind({
              name: 'App',
              classes: 'onyx',
              kind: 'FittableRows',
              mySession: null,
              stuff: ['bicycle', 'book', 'car', 'comb', 'fan', 'flight',
                       'laptop', 'shirt', 'toaster', 'toothbrush'],
              components: [
                  {kind: 'onyx.Toolbar', content: 'JustOnce'},
                  {tag: 'br'},
                  {kind: 'ca.LoginContext', name: 'login',
                   onSession: 'newSession'},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader',
                        content: 'Weapons of Mass Destruction'},
                       {kind: 'onyx.Toolbar',
                        components: [

                            {kind: 'onyx.Button', name: 'crashClientButton',
                             content: 'Crash Client', ontap: 'crashClient'},
                            {kind: 'onyx.Button', name: 'crashServerButton',
                             content: 'Crash Server', ontap: 'crashServer'}
                        ]}
                   ]},
                  {tag: 'br'},
                  {kind: 'onyx.Groupbox', components: [
                       {kind: 'onyx.GroupboxHeader', content: 'Buying Spree'},
                       {kind: 'onyx.Button', name: 'startBuyingButton',
                        content: 'Start', ontap: 'startBuying'}
                   ]},
                   {kind: 'BuyList', fit: true, name: 'buyList'}
              ],
              create: function() {
                  this.inherited(arguments);
                  var index = {};
                  this.stuff.forEach(function(item, n) {
                                         index[item] = n;
                                     });
                  this.stuffIndex = index;
                  this.beginSpreeF = remoteInvoke2Node(this, 'beginSpree');
                  this.buyF = remoteInvoke2Node(this, 'buy');
                  this.getCountersF = remoteInvoke2Node(this, 'getCounters');
                  this.endSpreeF = remoteInvoke2Node(this, 'endSpree');

              },
              newSession: function(inSource, inEvent) {
                  this.mySession = inEvent.session;
                  this.startBuying(); // recover
                  return true;
              },
              crashClient: function(inSource, inEvent) {
                  window.location.replace('crash.html' +
                                          window.location.search);
                  return true;
              },

              crashServer: function(inSource, inEvent) {
                  var cbOK = function() {
                      console.log('Server crash request OK');
                  };
                  var cbFail = function(err) {
                      console.log('Error: Cannot crash server' +
                                   JSON.stringify(err));
                  };
                  this.mySession && this.mySession.remoteInvoke('crash', [],
                                                                cbOK, cbFail);
                  return true;

              },
              startBuying: function(inSource, inEvent) {
                  var self = this;
                  var nonce;
                  // invoked from newSession
                  var justRecover = ((inSource === undefined) &&
                                     (inEvent === undefined));
                  async.waterfall([
                                      function(cb) {
                                          self.beginSpreeF([], cb);
                                      },
                                      function(data, cb) {
                                          nonce = data.nonce;
                                          var tasksF = self
                                              .assembleTasks(data, justRecover);
                                          tasksF(cb);
                                      },
                                      function(ignore, cb) {
                                          self.endSpreeF([nonce], cb);
                                      }
                                  ], function(err, ignore) {
                                      if (err) {
                                          var str = JSON.stringify(err);
                                          console.log('Buying error:' + str);
                                      }
                                  });
                  return true;
              },
              // data is {nonce: string, memento : string}
              assembleTasks: function(data, justRecover) {
                  var self = this;
                  var nonce = data.nonce;
                  var memento = data.memento;
                  var startSlice = (memento ? this.stuffIndex[memento] + 1 : 0);
                  var shopList = this.stuff.slice(startSlice);

                  if (justRecover && !memento) {
                      return function(cb) {
                          var cb1 = function(err, counters) {
                              if (err) {
                                  cb(err);
                              } else {
                                  self.updateBuyList(counters);
                                  cb(null, true);
                              }
                          };
                          self.getCountersF([], cb1);
                      };
                  } else {
                      return function(cb) {
                          async.mapSeries(shopList,
                                          function(item, cb0) {
                                              var cb1 = function(err, cnt) {
                                                  if (err) {
                                                      cb0(err);
                                                  } else {
                                                      self.updateBuyList(cnt);
                                                      cb0(null, true);
                                                  }
                                              };
                                              self.buyF([nonce, item], cb1);
                                          }, cb);
                      };
                  }
              },
              updateBuyList: function(counters) {
                  this.$.buyList.update(counters);
              }
          });


enyo.kind({
              name: 'BuyList',
              kind: 'enyo.Scroller',
              buys: {},
              keys: [],
              onSetupItem: 'setupItem',
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {name: 'oneBuy', kind: 'BuyItem'}
                   ]
                  }
              ],
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var buyItem = this.buys[key];
                  var oneBuy = rowHandle.item.$.oneBuy;
                  oneBuy.setBuyItem(buyItem);
              },
              update: function(counters) {
                  for (var itemName in counters) {
                      this.buys[itemName] = {name: itemName,
                                             counter: counters[itemName]};
                  }
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
                  this.keys = getKeys(this.buys).sort();
                  this.$.list.setCount(this.keys.length);
                  this.$.list.build();
                  this.render();
              }
          });

enyo.kind({
              name: 'BuyItem',
              kind: 'onyx.Groupbox',
              classes: 'buy-item',
              style: 'margin: 10px;',
              published: {
                  buyItem: {}
              },
              components: [
                  {name: 'itemTag', content: ''}

              ],
              buyItemChanged: function(inSender, inEvent) {
                  this.$.itemTag.setContent(this.buyItem.name + '#' +
                                            this.buyItem.counter);
                  this.render();
                  return true;
              }
          });
