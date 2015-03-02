#!/usr/bin/env node

'use strict';
try {
    require(require('path').resolve('makefile.js'));
    if (process.argv.length < 3) {
        throw new Error('target argument is not provided');
    }
    require('makejs').run(process.argv[2], function(err) {
        if (err != null) {
            throw err;
        }
    });
}
catch (err){
    console.error(require('chalk').red.bold(err));
}