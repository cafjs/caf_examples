enyo.kind({
              name: 'OpItem',
              kind: enyo.Control,
              tag: 'div',
              style: 'border-style: solid; border-width: 2px; ' +
                  'padding: 10px; margin: 10px; min-height: 20px',
              published: {
                  opId: '',
                  sensorData: ''
              },
              components: [
                  {tag: 'b', name: 'opTag'},
                  {tag: 'span', name: 'sensorTag'}
              ],
              opIdChanged: function() {
                  this.$.opTag.setContent(this.opId + ': ');
                  return true;
              },
              sensorDataChanged: function() {
                  this.$.sensorTag.setContent(JSON.stringify(this.sensorData));
                  var toCloud = (this.sensorData && this.sensorData.toCloud)
                      || {};
                  var fromCloud = (this.sensorData && this.sensorData.fromCloud)
                      || {};
                  return true;
              }
          });

enyo.kind({
              name: 'OpList',
              kind: enyo.Control,
              published: {
                  op: {}
              },
              keys: [],
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'OpItem', name: 'oneOp'}
                   ]}

              ],
              addOp: function(name, sensorData) {
                  if (!sensorData) {
                      sensorData = {};
                  }
                  this.op[name] = sensorData;
                  this.opChanged();
              },
              opChanged: function(inOldOp) {
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
                  this.keys = getKeys(this.op).sort();
                  this.$.list.setCount(this.keys.length);
                  this.$.list.build();
                  this.render();
                  return true;
              },
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var sensorData = this.op[key];
                  var oneOp = rowHandle.item.$.oneOp;
                  oneOp.setOpId(key);
                  oneOp.setSensorData(sensorData);
                  return true;
              }
          });
