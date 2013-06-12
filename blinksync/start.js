#!/usr/bin/env node
var client = require('./index.js');

if (process.argv.length === 3) {
    client.main(process.argv[2]);
} else {
    console.log('Error: Wrong number of arguments: start.js fileName' +
                ' ');
}
