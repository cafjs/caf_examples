enyo.kind({name: 'App',
           mySession: null,
           classes: 'enyo-fit enyo-unselectable',
           components: [
               {kind: 'FittableRows', classes: 'enyo-fit', components: [
                    {kind: 'ca.LoginContext', name: 'caSession', onSession: 'newSession', onNotification: 'forceRefresh'},
                    {kind: 'Accounts', name: 'imapAcc', onAccount: 'addAccount'},
                    {kind: 'FittableColumns', fit: true, components: [
                         {name: 'left', kind: 'FittableRows', components: [
                              {kind: 'onyx.Toolbar', content: 'Accounts', style: 'text-align: center; padding: 13px 0 14px;'},
                              {content: 'MAILBOXES', classes: 'divider'},
                              {kind: 'Scroller', fit: true, components: [
                                   {kind: 'Repeater', count: 0, onSetupItem: 'setupItem', ontap: 'mailboxTap', components: [
                                        {name: 'item', kind: 'ToolDecorator', classes: 'mailbox-item', components: [
                                             {kind: 'Image', src: 'images/mailbox_empty.png'},
                                             {tag: 'span', name: 'caption', style: 'padding-left: 8px;'}
                                         ]}
                                    ]}
                               ]}
                          ]},
                         {name: 'left2', kind: 'FittableRows', components: [
                              {kind: 'onyx.Toolbar', content: 'Messages', style: 'text-align: center; padding: 13px 0 14px;'},
                              {kind: 'onyx.InputDecorator', style: 'display: block;', components: [
                                   {kind: 'Input', placeholder: 'search', style: 'width: 90%;', name: 'input'},
                                   {kind: 'Image', src: 'images/search.png'}
                               ]},
                              {name: 'boxName', content: '(no mailbox)', classes: 'divider'},
                              {kind: 'Scroller', fit: true, components: [
                                   {kind: 'Repeater', count: 0, onSetupItem: 'setupHeaderItem', ontap: 'headerTap',
                                    ondown: 'headerDown', components: [
                                        {name: 'item', kind: 'HeaderItem'}
                                    ]}
                               ]}
                          ]},
                         {name: 'body', fit: true, kind: 'FittableRows', components: [
                              {kind: 'onyx.Toolbar', components: [
                                   {kind: 'onyx.Button', name: 'sourceButton', content: '%', ontap: 'testTap'}
                               ]},
                              {content: 'From', name: 'from', style: 'padding: 8px;'},
                              {content: 'Subject', name: 'subject', style: 'padding: 8px;'},
                              {content: 'Attachments', name: 'attachments', style: 'padding: 8px;'},
                              {fit: true, kind: 'Scroller', components: [
                                   {name: 'mailBody', allowHtml: true, style: 'padding: 8px;'}
                               ]}
                          ]}
                     ]}
                ]}
           ],
           loadAccAndBoxes: function() {
               var self = this;
               var cbOK = function(accBox) {
                   self.$.imapAcc.setAllAccounts(accBox.accounts);
                   self.receiveBoxes(this, accBox.boxes);
               };
               this.mySession && this.mySession
                   .remoteInvoke('getAccountsAndBoxes', [], cbOK, this.cbError);

           },
           newSession: function(inSource, inEvent) {
               this.mySession = inEvent.session;
               this.$.imapAcc.setEnabled(true);
               this.loadAccAndBoxes();
               return true;
           },

           forceRefresh: function(inSource, inEvent) {
               var self = this;
               console.log('forceRefresh:' + JSON.stringify(inEvent));
               this.loadAccAndBoxes();
               if (this.mailbox && this.mailbox.lastBox) {
                   this.loadHeaders();
               }
               return true;
           },
           cbError: function(error) {
               console.log('ERROR:' + JSON.stringify(error));
           },
           addAccount: function(inSource, acc) {
               var self = this;
               var cbOK = function(msg) {
                   var accAll = self.$.imapAcc.getAllAccounts().slice(0);
                   accAll.push({'alias': acc.alias, 'active': false});
                   self.$.imapAcc.setAllAccounts(accAll);
                   console.log('Added account OK:' + JSON.stringify(msg));
               };
               if (acc.alias && acc.name && acc.passwd && acc.server && (acc.port >= 0)) {
                   this.mySession && this.mySession
                       .remoteInvoke('addAccount',
                                     [acc.alias, acc.name, acc.passwd,
                                      acc.server, acc.port],
                                     cbOK, this.cbError);
               }
           },

           create: function() {
               this.inherited(arguments);
           },
           receiveBoxes: function(inSender, inBoxes) {
               //this.log(inBoxes);
               this.boxes = inBoxes;
               this.$.repeater.count = this.boxes.length;
               this.$.repeater.build();
               this.$.repeater.render();
           },
           setupItem: function(inSender, inEvent) {
               var item = this.boxes[inEvent.index];
               inEvent.item.$.caption.setContent(item.name);
           },
           mailboxTap: function(inSender, inEvent) {
               var o = inEvent.originator.owner;
               if ('index' in o) {
                   this.selectMailbox(o);
               }
           },
           loadHeaders: function() {
               var box = this.mailbox.lastBox;
               this.$.boxName.setContent(box.name);
               var self = this;
               var cbOK = function(headers) {
                   self.receiveHeaders(self, headers);
               };
               this.mySession && this.mySession
                   .remoteInvoke('getHeaders', [box], cbOK, this.cbError);
           },
           selectMailbox: function(inMailbox) {
               if (this.mailbox) {
                   this.mailbox.$.item && this.mailbox.$.item.removeClass('selected-item');
               }
               this.$.repeater2.count = 0;
               this.$.repeater2.build();
               this.$.repeater2.render();
               //
               this.mailbox = inMailbox;
               if (this.mailbox) {
                   this.mailbox.$.item.addClass('selected-item');
                   this.mailbox.lastBox = this.boxes[this.mailbox.index];
                   //
                   this.loadHeaders();
               }
           },
           receiveHeaders: function(inSender, inResponse) {
               enyo.asyncMethod(this, '_receiveHeaders', inSender, inResponse);
           },
           _receiveHeaders: function(inSender, inResponse) {
               //this.log(inResponse);
               this.headers = inResponse;
               this.$.repeater2.count = Math.min(this.headers.length, 500);
               //
               var box = this.mailbox.lastBox;
               this.$.boxName.setContent(box.name + ' (' + this.$.repeater2.count + ')');
               //
               this.$.repeater2.build();
               this.$.repeater2.render();
           },
           setupHeaderItem: function(inSender, inEvent) {
               inEvent.item.$.item.setItem(this.headers[inEvent.index]);
           },
           headerTap: function(inSender, inEvent) {
               //console.log('delay between dispatch and handler:', new Date().getTime() - inEvent.time);
               var o = inEvent.originator.owner;
               if (!('index' in o)) {
                   o = inEvent.originator.owner.owner;
               }
               if ('index' in o) {
                   this.selectHeader(o);
               }
           },
           selectHeader: function(inHeader) {
               if (this.header && this.header.$.item) {
                   this.header.$.item.removeClass('selected-item');
               }
               this.header = inHeader;
               if (this.header) {
                   this.header.$.item.addClass('selected-item');
               }
               enyo.asyncMethod(this, function() {
                                    this.$.mailBody.setContent('');
                                    //
                                    var box = this.mailbox.lastBox;
                                    var header = this.headers[this.header.index];
                                    //this.log(header.msgno);
                                    this.$.sourceButton.setContent(header.alias);
                                    this.$.from.setContent(' From:' + header.from);
                                    this.$.subject.setContent(' Subject:' + header.subject);


                                    //
                                    var self = this;
                                    var cbOK = function(msg) {
                                        self.receiveBody(self, msg);
                                    };
                                    this.mySession &&
                                        this.mySession.remoteInvoke('getMsg',
                                                                    [header],
                                                                    cbOK,
                                                                    this.cbError);
                                });
           },
           receiveBody: function(inSender, inResponse) {
               //this.$.mailBody.show();
               //this.$.bodySpinner.hide();
               //this.log();
               this.$.mailBody.setContent('<pre>' + inResponse + '</pre>');
           }
          });
