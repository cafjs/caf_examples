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
              components: [
                  {tag: 'b', name: 'droneTag'},
                  {tag: 'span', name: 'sensorTag'}
              ],
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
                  return true;
              }
          });

enyo.kind({
              name: 'DronesList',
              kind: enyo.Control,
              published: {
                  drones: {}
              },
              keys: [],
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'DroneItem', name: 'oneDrone'}
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
              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var sensorData = this.drones[key];
                  var oneDrone = rowHandle.item.$.oneDrone;
                  oneDrone.setDroneId(key);
                  oneDrone.setSensorData(sensorData);
                  return true;
              }
          });
