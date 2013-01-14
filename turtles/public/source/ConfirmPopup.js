/*
 * appItem is of type {'name' : <string>, 'hash': <string>,
 *  'url': <string>...}
 *
 */
enyo.kind({
              name: 'AppDescription',
              kind: enyo.Control,
              tag: 'div',
              style: 'border-style: solid; border-width: 2px; ' +
                  'padding: 10px; margin: 10px; min-height: 50px',
              published: {
                  appItem: ''
              },
              components: [
                  { tag: 'h3', name: 'name' },
                  { tag: 'h3', name: 'url' },
                  { tag: 'h3', name: 'hash' }
              ],
              appItemChanged: function() {
                  this.$.name.setContent('Name: ' + this.appItem.name);
                  this.$.url.setContent('Url: ' + this.appItem.url);
                  this.$.hash.setContent('SHA1 Hash: ' + this.appItem.hash);
              }
          });

enyo.kind({
              name: 'ConfirmPopup',
              events: {
                  onDeploy: ''
              },
              pending: [],
              busy: false,
              components: [
                  {
                      kind: 'onyx.Popup',
                      name: 'popup',
                      centered: true,
                      modal: true,
                      floating: true,
                      components: [
                          {tag: 'h1',
                           content: 'Do you want to deploy this app?'},
                          {tag: 'br'},
                          { kind: 'AppDescription', name: 'appdesc'},
                          {tag: 'br'},
                          {kind: 'Group', defaultKind: 'onyx.Button',
                           highlander: true, components: [
                               {content: 'Cancel', classes: 'onyx-negative',
                                ontap: 'cancelTap'},
                               {content: 'OK', classes: 'onyx-affirmative',
                                ontap: 'okTap'}
                           ]
                          }
                      ]
                  }
              ],
              confirm: function(app) {
                  if (this.busy) {
                      this.pending.push(app);
                  } else {
                      this.busy = true;
                      this.$.appdesc.setAppItem(app);
                      this.showPopup();
                  }
              },
              cancelTap: function(inSender, inEvent) {
                  this.hidePopup();
                  this.flush();
              },
              okTap: function(inSender, inEvent) {
                  this.doDeploy({'appInfo' : this.$.appdesc.getAppItem()});
                  this.hidePopup();
                  this.flush();
              },
              flush: function() {
                  this.busy = false;
                  var nextApp = this.pending.shift();
                  if (nextApp) {
                      this.confirm(nextApp);
                  }
              },
              showPopup: function() {
                  this.$.popup.show();
              },
              hidePopup: function() {
                  this.$.popup.hide();
              }

          });
