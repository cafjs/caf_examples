enyo.kind({
              name: 'DroneItem',
              kind: enyo.Control,
              tag: 'div',
              style: 'border-style: solid; border-width: 2px; ' +
                  'padding: 10px; margin: 10px; min-height: 20px',
              published: {
                  droneId: '',
                  sensorData: ''
              },
              events: {
                  onLock: "",
                  onOutputChange: ""
              },
              components: [
                  {kind: 'DronePopup', name: 'dronePopup'},
                  {tag: 'b', name: 'droneTag'},
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
                   ]},
                  {kind: 'onyx.Button', name: 'commandButton',
                        content: 'New Command', ontap: 'newCommand'}
              ],
              newCommand: function(inSource, inEvent) {
                  this.$.dronePopup.deploy(this.droneId);
                  this.doLock();
                  return true;
              },
              checkboxChanged: function(inSource, inEvent) {
                  this.doLock();
                  var index = parseInt(inSource.getName()
                      .charAt(inSource.getName().length -1));
                  this.doOutputChange({droneId: this.droneId,
                                       pin: index,
                                       isOn: inSource.getValue()});
                  return true;
              },
              droneIdChanged: function() {
                  this.$.droneTag.setContent(this.droneId + ': ');
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
              name: 'DronesList',
              kind: enyo.Control,
              published: {
                  drones: {}
              },
              keys: [],
              lockRefresh: false,
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'DroneItem', name: 'oneDrone', onLock: 'lock',
                        onCommand: 'unlock', onOutputChange: 'unlock'}
                   ]}

              ],
              addDrone: function(name, sensorData) {
                  if (!sensorData) {
                      sensorData = {};
                  }
                  this.drones[name] = sensorData;
                  this.dronesChanged();
              },
              dronesChanged: function(inOldDrones) {
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
                  this.keys = getKeys(this.drones).sort();
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
                  var sensorData = this.drones[key];
                  var oneDrone = rowHandle.item.$.oneDrone;
                  oneDrone.setDroneId(key);
                  oneDrone.setSensorData(sensorData);
                  return true;
              }
          });

enyo.kind({
              name: 'DronePopup',
              kind: 'onyx.Popup',
              centered: true,
              modal: true,
              floating: true,
              events: {
                  onCommand: ""
              },
              droneId: "",
              components: [
                  {kind: 'onyx.InputDecorator',
                   components: [
                      {tag: 'b', name: 'droneIdTag'},
                       {kind: 'onyx.Input', name: 'command',
                        placeholder: ' Command '},
                        {kind: 'onyx.Button', name: 'commandOK',
                         content: 'OK', ontap: 'okCommand'}
                   ]}
              ],
              okCommand: function() {
                  this.doCommand({droneId: this.droneId,
                                  command: this.$.command.getValue()});
                  this.hide();
                  return true;
              },
              deploy: function(droneId) {
                  this.droneId = droneId;
                  this.$.droneIdTag.setContent(this.droneId + ': ');
                  this.show();
              }
          });
