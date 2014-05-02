var __prPrintMany__ = function(x, f) {
    var res = {};
    if (x && typeof x === 'object') {
        Object.keys(x).forEach(function(y) {
                                   res[y] = f(x[y]);
                               });
    }
    return JSON.stringify(res);
};

enyo.kind({
              name: 'ResultItem',
              kind: enyo.Control,
              tag: 'div',
              allowHtml: true,
              style: 'border-style: solid; border-width: 1px; ' +
                  'padding: 5px; margin: 5px; min-height: 10px',
              published: {
                  key: '',
                  data: ''
              },
              components: [
                  {tag:'b', name: 'keyTag'},
                  {tag: 'span', allowHtml: true, name: 'dataTag'}
              ],
              keyChanged: function() {
                  var str = this.key + ':';
                  this.$.keyTag.setContent(str);
                  return true;
              },
              dataChanged: function() {
                  var prDefault = function(x) {
                      return JSON.stringify(x);
                  };
                  var prIdeLan = function(x) {
                      return  __prPrintMany__(x, function(y) {
                                                  return y.language ||
                                                      "unknown";
                                              });
                  };
                  var prRecBar = function(x) {
                      var f =  function(y) {
                          var st = [];
                          y = y && (typeof y === 'object') && y.barcode;
                          if (Array.isArray(y)) {
                              y.forEach(function(z) {
                                            st.push({code: z.text,
                                                     type: z.type});
                                        });
                          }
                          return st;
                      };
                      return  __prPrintMany__(x, f);
                  };

                  var prExpCon = function(x) {
                      var files = x.files || [];
                      var result = [];
                      files.forEach(function(y) {
                                        result.push(y.name);
                                    });
                      return  JSON.stringify(result);
                  };

                  var str = '';
                  var resultPr = {'identifylanguage': prIdeLan,
                              'expandcontainer' : prExpCon,
                              'recognizebarcodes': prRecBar,
                              'extractentities': prDefault,
                              'expandterms': prDefault,
                              'extracttext': prDefault,
                              'detectfaces': prDefault,
                              'findsimilar':prDefault,
                              'highlighttext': prDefault,
                              'recognizeimages': prDefault,
                              'viewdocument': prDefault,
                              'ocrdocument': prDefault,
                              'querytextindex':prDefault,
                              'findrelatedconcepts':prDefault,
                              'analyzesentiment':prDefault,
                              'storeobject': prDefault,
                              'tokenizetext': prDefault};
                  var prettyPrint = function(data) {
                      if (data.error) {
                          str = JSON.stringify(data.error);
                      } else {
                          var f = (data.meta && data.meta.name &&
                                   resultPr[data.meta.name]) || prDefault;
                          str = f(data.data);

                      };
                  };
                  prettyPrint(this.data);
//                  str = JSON.stringify(this.data);
                  this.$.dataTag.setContent(str);
                  return true;
              }
          });

enyo.kind({
              name: 'ResultList',
              kind: enyo.Control,
              published: {
                  result: null
              },
              keys: [],
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'ResultItem', name: 'oneResult'}
                   ]}

              ],
              resultChanged: function(inOldResult) {
                  this.keys = (this.result &&
                               (typeof this.result === 'object') &&
                               Object.keys(this.result)) || [];
                  this.$.list.setCount(this.keys.length);
                  this.$.list.build();
                  this.render();
                  return true;
              },
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var val = this.result[key];
                  var oneResult = rowHandle.item.$.oneResult;
                  oneResult.setKey(key);
                  oneResult.setData(val);
                  return true;
              }
          });
