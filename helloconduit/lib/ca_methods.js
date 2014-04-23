/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

"use strict";
var caf = require('caf_core');
var conduit = require('caf_conduit');

var PLUS_DELAY = 50;
var MINUS_DELAY = 100;
var MUL_DELAY = 200;
var DIV_DELAY = 300;
var CONS_DELAY = 0;

var getLeft = function(acc, deps) {
    var left = deps && deps.left && acc[deps.left] &&
        acc[deps.left].data &&  acc[deps.left].data.value || 0;
    return left;
};

var getRight = function(acc, deps) {
    var right = deps && deps.right && acc[deps.right] &&
        acc[deps.right].data &&  acc[deps.right].data.value || 0;
    return right;
};


var methods = exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.opStr = null;
        this.scratch.op = null;
        this.state.acc = {};
        cb(null);
    },
    '__ca_resume__' : function(cp, cb) {
        this.state = (cp && cp.state) || {};
        if (typeof this.state.opStr === 'string') {
            var op = conduit.parse(this.state.opStr);
            this.scratch.op = op.__behavior__(methods);
        }
        cb(null);
    },
    '__ca_pulse__' : function(cb) {
        var self = this;
        if (this.scratch.op) {
            this.state.acc = {};
            this.scratch.op.__fold__(this.state.acc, cb);
        } else {
            cb(null);
        }
    },
    'doPlus' : function(acc, args, deps, label, cb) {
        setTimeout(function() {
                       var left = getLeft(acc, deps);
                       var right = getRight(acc, deps);
                       cb(null, {name:'+', value: left+right});
                   }, PLUS_DELAY);
    },
    'doMinus' : function(acc, args, deps, label,  cb) {
        setTimeout(function() {
                       var left = getLeft(acc, deps);
                       var right = getRight(acc, deps);
                       cb(null, {name:'-', value: left-right});
                   }, MINUS_DELAY);
    },
    'doMul' : function(acc, args, deps, label, cb) {
        setTimeout(function() {
                       var left = getLeft(acc, deps);
                       var right = getRight(acc, deps);
                       cb(null, {name:'*', value: left*right});
                   }, MUL_DELAY);
    },
    'doDiv' : function(acc, args, deps, label, cb) {
        setTimeout(function() {
                       var left = getLeft(acc, deps);
                       var right = getRight(acc, deps)|| 1;
                       cb(null, {name:'/', value: left/right});
                   }, DIV_DELAY);
    },
    'doCons' : function(acc, args, deps, label, cb) {
        setTimeout(function() {
                       cb(null, {name:'constant', value: args.value || 0});
                   }, CONS_DELAY);
    },
    'newOp': function(opStr, cb) {
        this.state.opStr = opStr;
        var op = conduit.parse(opStr);
        this.scratch.op = op.__behavior__(methods);
        this.state.acc = {};
        this.scratch.op.__fold__(this.state.acc, cb);
    },
    // State is {acc:Object, opStr:string}
    'getState' : function(cb) {
        cb(null, this.state);
    }
};


caf.init(__dirname, {});

