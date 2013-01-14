/*
 * appItem is of type {'name' : <string>, 'hash': <string>,
 * 'state': <string>, 'url': <string>}
 *
 */
enyo.kind({
              name: 'AppItem',
              kind: onyx.Groupbox,
//              tag: 'div',
//              style: 'border-style: solid; border-width: 2px; ' +
//                  'padding: 10px; margin: 10px; min-height: 20px',
              style: 'margin: 10px;',
              published: {
                  appItem: ''
              },
              events: {
                  onRemove: ''
              },
              components: [
                  {kind: 'onyx.GroupboxHeader', name: 'nameTag', content: ''},
                  {classes: 'onyx-toolbar-inline', components: [

                       {name: 'remove', kind: 'onyx.IconButton',
                        classes: 'remove-button',
                        src: 'images/remove-icon.png',
                        ontap: 'removeTap'},
                       {name: 'stateTag'}//, classes: 'description'},
                   ]},
                  {name: 'hashTag'},//, classes: 'description'},
                  {name: 'urlTag'}//, classes: 'description'}
              ],
              appItemChanged: function() {
                  this.$.nameTag.setContent('App Name: ' +
                                            this.appItem.appRootName + '_' +
                                            this.appItem.name);
                  this.$.hashTag.setContent('SHA1 Hash: ' +
                                            this.appItem.hash || 'unknown');
                  this.$.stateTag.setContent('State: ' +
                                              this.appItem.state || 'unknown');
                  this.$.urlTag.setContent('URL: ' + this.appItem.url);
                  this.render();
              },
              removeTap: function(inSender, inEvent) {
                  this.doRemove(this.appItem);
              }
});

enyo.kind({
              name: 'AppsList',
              kind: enyo.Control,
              published: {
                  apps: {},
                  appRootName: ''
              },
              keys: [],
              components: [
                  {kind: 'Repeater', name: 'list', count: 0,
                   onSetupItem: 'setupItem',
                   components: [
                       {kind: 'AppItem', name: 'oneApp'}
                   ]
                   }
                  ],
              addApp: function(appItem) {
                  this.apps[appItem.name] = appItem;
                  this.appsChanged();
              },

              removeApp: function(appItem) {
                  delete this.apps[appItem.name];
                  this.appsChanged();
              },
              appsChanged: function(inOldApps) {
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
                  this.keys = getKeys(this.apps).sort();
                  this.$.list.setCount(this.keys.length);
                  this.$.list.build();
                  this.render();
              },

              setupItem: function(inSender, rowHandle) {
                  var key = this.keys[rowHandle.index];
                  var appItem = this.apps[key];
                  appItem.appRootName = this.getAppRootName();
                  var oneApp = rowHandle.item.$.oneApp;
                  oneApp.setAppItem(appItem);
              }
});
