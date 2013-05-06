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
                  onLock: "",
                  onOutputChange: ""
              },
              components: [
                  {tag: 'b', name: 'gadgetTag'},
                  {tag: 'span', name: 'sensorTag'},
                  {kind: "onyx.Groupbox", components: [
                       {kind: "onyx.GroupboxHeader",
                        content: "Inputs |7|6|5|4|3|2|1|0|"},
                       {kind: enyo.Control, components: [
                            {kind:"onyx.Checkbox", name: "input7", 
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input6",
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input5",
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input4",
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input3",
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input2",
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input1",
                             disabled: true},
                            {kind:"onyx.Checkbox", name: "input0",
                             disabled: true}
                        ]}
                   ]},
                  {kind: "onyx.Groupbox", components: [
                       {kind: "onyx.GroupboxHeader",
                        content: "Outputs |7|6|5|4|3|2|1|0|"},
                       {kind: enyo.Control, components: [
                            {kind:"onyx.Checkbox", name: "output7",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output6",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output5",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output4",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output3",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output2",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output1",
                             onchange:"checkboxChanged"},
                            {kind:"onyx.Checkbox", name: "output0",
                             onchange:"checkboxChanged"}
                        ]}
                   ]}
              ],
              checkboxChanged: function(inSource, inEvent) {
                  this.doLock();
                  var index = parseInt(inSource.getName()
                      .charAt(inSource.getName().length -1));
                  this.doOutputChange({gadgetId: this.gadgetId,
                                       pin: index,
                                       isOn: inSource.getValue()});
                  return true;
              },
              gadgetIdChanged: function() {
                  this.$.gadgetTag.setContent(this.gadgetId + ': ');
                  return true;
              },
              sensorDataChanged: function() {
                  this.$.sensorTag.setContent(JSON.stringify(this.sensorData));
                  var toCloud = (this.sensorData && this.sensorData.toCloud) 
                      || {};
                  var fromCloud = (this.sensorData && this.sensorData.fromCloud)
                      || {};
                  this.setInputs(toCloud.inputs);
                  this.setOutputs(fromCloud.outputs);
                  this.setPending(fromCloud.outputs ^ toCloud.outputs);
                  return true;
              },
              setInputs: function(inputs) {
                  this.setCheckboxes(inputs, 'input');
              },
              setOutputs: function(outputs) {
                  this.setCheckboxes(outputs, 'output');
              },
              setPending: function(pending) {
                  this.setCheckboxes(pending, 'output', 'yellow');
              },
              setCheckboxes: function(data, label, color) {
                  if ((typeof data === 'number') && (data >= 0) && 
                      (data <= 255)) {
                      var mask = 1;
                      for (var i = 0; i < 8; i++) {
                          var target = label + i;
                          if (color) {
                              if (mask & data) {
                                  this.$[target].applyStyle("background-color",
                                                            color);
                              }
                          } else {
                              this.$[target].setChecked(mask & data);
                          }
                          mask = mask << 1;
                      }
                  } else {
                      console.log('Ignoring bad ' +  label + ':' + data);
                  }
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
                  {kind: 'Repeater', name: 'list', count: 0, 
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'GadgetItem', name: 'oneGadget', onLock: 'lock',
                        onOutputChange: 'unlock'}
                   ]}

              ],
              addGadget: function(name, sensorData) {
                  if (!sensorData) {
                      sensorData = {};
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
