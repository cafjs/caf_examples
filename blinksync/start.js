#!/usr/bin/env node
var client = require('./index.js');

if (process.argv.length === 4) {
    var cloudSpec = require(process.argv[3]);
    client.main(process.argv[2], cloudSpec);
} else {
    console.log('Error: Wrong number of arguments: start.js fileName ' +
                'jsonPropFileName (should have extension .json and contain' +
                ' object with url, password, accountsUrl fields)');
}
