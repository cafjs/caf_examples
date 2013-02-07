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
                  onLock: ""
              },
              components: [
                  {kind: 'GadgetPopup', name: 'gadgetPopup'},
                  {tag: 'b', name: 'gadgetTag'},
                  {tag: 'span', name: 'sensorTag'},
                  {kind: 'onyx.Button', name: 'commandButton',
                        content: 'New Command', ontap: 'newCommand'}

              ],
              newCommand: function(inSource, inEvent) {
                  this.$.gadgetPopup.deploy(this.gadgetId);
                  this.doLock();
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
              lockRefresh: false,
              components: [
                  {kind: 'Repeater', name: 'list', count: 0, onSetupItem: 'setupItem',
                   components: [
                       {kind: 'GadgetItem', name: 'oneGadget', onLock: 'lock',
                        onCommand: 'unlock'}
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
                  if (this.lockRefresh) {
                      return true;
                  }
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
                  return true;
              },
              lock: function() {
                  this.lockRefresh = true;
                  return true;
              },
              unlock: function() {
                  this.lockRefresh = false;
                  // propagate onCommand
              },
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var sensorData = this.gadgets[key];
                  var oneGadget = rowHandle.item.$.oneGadget;
                  oneGadget.setGadgetId(key);
                  oneGadget.setSensorData(sensorData);
                  return true;
              }
          });

enyo.kind({
              name: 'GadgetPopup',
              kind: 'onyx.Popup',
              centered: true,
              modal: true,
              floating: true,
              events: {
                  onCommand: ""
              },
              gadgetId: "",
              components: [
                  {kind: 'onyx.InputDecorator',
                   components: [
                      {tag: 'b', name: 'gadgetIdTag'},
                       {kind: 'onyx.Input', name: 'command',
                        placeholder: ' Command '},
                        {kind: 'onyx.Button', name: 'commandOK',
                         content: 'OK', ontap: 'okCommand'}
                   ]}
              ],
              okCommand: function() {
                  this.doCommand({gadgetId: this.gadgetId,
                                  command: this.$.command.getValue()});
                  this.hide();
                  return true;
              },
              deploy: function(gadgetId) {
                  this.gadgetId = gadgetId;
                  this.$.gadgetIdTag.setContent(this.gadgetId + ': ');
                  this.show();
              }
          });
