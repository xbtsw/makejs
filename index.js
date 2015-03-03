'use strict';

var Make = require('./lib/make.js').Make;

module.exports = (function() {
    var make = new Make();
    make.extraArgs = process.argv.slice(3);

    return {
        rule: make.rule.bind(make),
        run: make.run.bind(make),
        cwd: make.cwd.bind(make),
        args: make.args.bind(make),
        Make: Make
    };
})();