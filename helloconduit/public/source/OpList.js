enyo.kind({
              name: 'OpItem',
              kind: enyo.Control,
              tag: 'div',
              style: 'border-style: solid; border-width: 1px; ' +
                  'padding: 5px; margin: 5px; min-height: 10px',
              published: {
                  opId: '',
                  data: ''
              },
              components: [
                  {tag: 'b', name: 'opIdTag'},
                  {tag: 'span', name: 'dataTag'}
              ],
              opIdTagChanged: function() {
                  this.$.opIdTag.setContent(this.opId + ': ');
                  return true;
              },
              dataChanged: function() {
                  var str = '';
                  var opCh = {'doPlus': '+', 'doMinus': '-', 'doMul': '*',
                              'doDiv': '/'};
                  var prettyPrint = function(data) {
                      if (typeof data === 'object') {
                          switch (data.type) {
                          case 'seq':
                              // really slow for large strings...
                              str = str + '( ';
                              data.children.forEach(function(x) {
                                                        prettyPrint(x);
                                                         str = str + '; ';
                                                    });
                              str = str + ' )';
                              break;
                          case 'par':
                              str = str + '( ';
                              var last = data.children.length -1;
                              data.children.forEach(function(x, i) {
                                                        prettyPrint(x);
                                                        if (i !== last) {
                                                            str = str + ' | ';
                                                        }
                                                    });
                              str = str + ' )';
                              break;
                          case 'method':
                              str = str + '<' + data.label +'>: ';
                              if (data.name === 'doCons') {
                                   str = str + data.args.value;
                              } else {
                                  str = str + '<' + data.deps.left + '>';
                                  str = str + opCh[data.name];
                                  str = str + '<' + data.deps.right + '>';
                              }
                              break;
                          }
                      }
                  };
                  prettyPrint(this.data);
                  this.$.dataTag.setContent(str);
                  return true;
              }
          });

enyo.kind({
              name: 'OpList',
              kind: enyo.Control,
              published: {
                  op: null
              },
              stack: [],
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'OpItem', name: 'oneOp'}
                   ]}

              ],
              opChanged: function(inOldOp) {
                  this.stack = (this.op &&
                               this.op.__map__(function(x) { return x;})) || [];
                  this.$.list.setCount(this.stack.length);
                  this.$.list.build();
                  this.render();
                  return true;
              },
              setupItem: function(inSender, rowHandle) {
                  var entry = this.stack[rowHandle.index];
                  var oneOp = rowHandle.item.$.oneOp;
                  //oneOp.setOpId(key);
                  oneOp.setData(entry);
                  return true;
              }
          });
