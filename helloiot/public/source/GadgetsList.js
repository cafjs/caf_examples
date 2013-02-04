enyo.kind({
              name: 'GadgetItem',
              kind: enyo.Control,
              tag: 'div',
              style: 'border-style: solid; border-width: 2px; ' +
                  'padding: 10px; margin: 10px; min-height: 20px',
              published: {
                  gadgetId: '',
                  sensorData: ''
              },
              events: {
                  onCommand: ""
              },
              components: [
                  {tag: 'b', name: 'gadgetTag'},
                  {tag: 'span', name: 'sensorTag'},            
                  {kind: 'onyx.InputDecorator',
                   components: [
                       {kind: 'onyx.Input', name: 'commandTag',
                        placeholder: 'Command'},
                       {kind: 'onyx.Button', name: 'commandButton',
                        content: 'Do it!', ontap: 'newCommand'}
                   ]
                  }
              ],
              newCommand: function(inSource, inEvent) {
                  this.doCommand({gadgetId: this.gadgetId, 
                                  command: this.$.commandTag.getValue()});
                  return true;
              },
              gadgetIdChanged: function() {
                  this.$.gadgetTag.setContent(this.gadgetId + ': ');
                  return true;
              },
              sensorDataChanged: function() {
                  this.$.sensorTag.setContent(JSON.stringify(this.sensorData));
                  return true;
              }
          });

enyo.kind({
              name: 'GadgetsList',
              kind: enyo.Control,
              published: {
                  gadgets: {}
              },
              keys: [],
              components: [
                  {kind: 'Repeater', name: 'list', count: 0, onSetupItem: 'setupItem',
                   components: [
                       {kind: 'GadgetItem', name: 'oneGadget' }
                   ]}

              ],
              addGadget: function(name, sensorData) {
                  if (!sensorData) {
                      sensorData = 'unknown';
                  }
                  this.gadgets[name] = sensorData;
                  this.gadgetsChanged();
              },
              gadgetsChanged: function(inOldGadgets) {
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
                  this.keys = getKeys(this.gadgets).sort();
                  this.$.list.setCount(this.keys.length);
                  this.$.list.build();
                  this.render();
              },
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var sensorData = this.gadgets[key];
                  var oneGadget = rowHandle.item.$.oneGadget;
                  oneGadget.setGadgetId(key);
                  oneGadget.setSensorData(sensorData);
              }
          });
