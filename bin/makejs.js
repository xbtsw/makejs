#!/usr/bin/env node

'use strict';

var path = require('path');
var make = require('make-js');
var chalk = require('chalk');

try {
    require(path.resolve('makefile.js'));
    if (process.argv.length < 3) {
        throw new Error('target argument is not provided');
    }
    make.run(process.argv[2], function(err) {
        if (err) {
            throw err;
        }
    });
}
catch (err){
    console.error(chalk.red.bold(err));
}
