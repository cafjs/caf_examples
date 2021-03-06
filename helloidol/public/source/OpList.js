enyo.kind({
              name: 'OpItem',
              kind: enyo.Control,
              tag: 'div',
              allowHtml: true,
              style: 'border-style: solid; border-width: 1px; ' +
                  'padding: 5px; margin: 5px; min-height: 10px',
              published: {
                  data: ''
              },
              components: [
                  {tag: 'span', allowHtml: true, name: 'dataTag'}
              ],
              dataChanged: function() {
                  var str = '';
                  var opCh = {
                      'identifylanguage': 'IdeLan',
                      'expandcontainer' : 'ExpCon',
                      'recognizebarcodes': 'RecBar',
                      'extractentities': 'ExtEnt',
                      'expandterms': 'ExpTer',
                      'extracttext': 'ExtTex',
                      'detectfaces': 'DetFac',
                      'findsimilar':'FinSim',
                      'highlighttext': 'HigTex',
                      'recognizeimages': 'RecIma',
                      'viewdocument': 'ViewDoc',
                      'ocrdocument': 'OCRDoc',
                      'querytextindex':'Query',
                      'findrelatedconcepts':'FinRel',
                      'analyzesentiment':'AnaSen',
                      'storeobject': 'StoObj',
                      'tokenizetext': 'TokTex'};
                  var prettyPrint = function(data) {
                      var findDeps = function(deps) {
                          var result = [];
                          if (deps && typeof deps === 'object') {
                              Object.keys(deps).forEach(function(x) {
                                                            result.push(deps[x]);
                                                        });
                          }
                          return result;
                      };
                      var findFilter = function(args) {
                          return (args && args.filter) || [];
                      };
                      var findProps = function(args) {
                          var result = {};
                          if (args && typeof args === 'object') {
                              var keys = Object.keys(args);
                              keys.forEach(function(x) {
                                               if (x !== 'filter') {
                                                   result[x] = args[x];
                                               }
                                           });
                          }
                          return result;
                      };
                      if (typeof data === 'object') {
                          switch (data.type) {
                          case 'seq':
                              // really slow for large strings...
                              str = str +  '<span style="color:blue">(</span>';
                              var last = data.children.length -1;
                              data.children.forEach(function(x, i) {
                                                        prettyPrint(x);
                                                        if (i !== last) {
                                                            str = str + '<span style="color:blue">; </span>';
                                                        }
                                                    });
                              str = str + '<span style="color:blue">)</span>';
                              break;
                          case 'par':
                              str = str +  '<span style="color:red">(</span>';
                              last = data.children.length -1;
                              data.children.forEach(function(x, i) {
                                                        prettyPrint(x);
                                                        if (i !== last) {
                                                            str = str + '<span style="color:red"> | </span>';
                                                        }
                                                    });
                              str = str + '<span style="color:red">)</span>';
                              break;
                          case 'method':
                              str = str  + data.label +': ';
                              str = str + opCh[data.name];
                              str = str + "(";
                              str = str + JSON.stringify(findDeps(data.deps));
                              str = str + "/";
                              str = str + JSON.stringify(findFilter(data.args));
                              str = str + ",";
                              str = str + JSON.stringify(findProps(data.args));
                              str = str + ")";
                              break;
                          }
                      }
                  };
                  prettyPrint(this.data);
//                  str = JSON.stringify(this.data);
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
                  oneOp.setData(entry);
                  return true;
              }
          });
