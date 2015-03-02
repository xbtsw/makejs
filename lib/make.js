'use strict';

var _ = require('lodash');
var async = require('async');
var fs = require("fs");
var StringSet = require("./stringset.js");
var path = require("path");
var chalk = require("chalk");

exports.getStat = getStat;

function getStat(target, callback) {
    if (target[0] === ':') {
        callback(null, null);
        return;
    }
    fs.stat(target, function(err, stat) {
        if (err !== null && err.code === 'ENOENT') {
            callback(null, null);
        }
        else if (err !== null) {
            callback(err);
        }
        else {
            callback(null, stat);
        }
    });
}

exports.Make = Make;

function Make() {
    this.targets = Object.create(null);
    this.workingDir = '.';
    this.extraArgs = [];
}

Make.prototype.toAbsolute = function toAbsolute(target) {
    return path.resolve(this.workingDir, target);
};

Make.prototype.cwd = function cwd(path) {
    if (path === undefined) {
        return this.workingDir;
    }
    else {
        this.workingDir = path;
    }
};

Make.prototype.args = function() {
    return this.extraArgs;
}

Make.prototype.initTarget = function initTarget(target) {
    if (!(target in this.targets)) {
        this.targets[target] = {
            dependsOn: new StringSet(),
            action: function(done) {
                done();
            }
        };
    }
};

Make.prototype.define = function define(target, dependencies, action) {
    var makeInst = this;

    if (!_.isString(target)) throw "Target must be string, '" + target.toString() + "' given";

    target = makeInst.toAbsolute(target);
    this.initTarget(target);

    if (dependencies !== null) {
        if (!_.isArray(dependencies)) throw "Dependencies must be array, '" + dependencies.toString() + "' given";

        dependencies = dependencies.map(function(dep) {
            if (!_.isString(dep)) throw "Dependencies must all be string, but '" + dep.toString() + "' given";
            return makeInst.toAbsolute(dep);
        });

        makeInst.targets[target].dependsOn.absorb(dependencies);
    }

    if (action !== undefined) {
        if (!_.isFunction(action)) throw "Action must be function, '" + action.toString() + "' given";
        makeInst.targets[target].action = action;
    }

};

Make.prototype.run = function run(target, callback) {
    var makeInst = this;

    if (!_.isString(target)) callback(new Error("Target must be string, '" + target.toString() + "' given"));

    target = makeInst.toAbsolute(target);
    if (!(target in makeInst.targets)) callback(new Error("Target definition not found for target '" + target + "'\n"));

    var fulfilled = new StringSet();
    var activeTasks = Object.create(null);

    process.on('exit', processListener);

    runRecursive(target, callbackWrapper);

    function processListener() {
        for (var t in activeTasks) {
            if (!activeTasks[t].doneCalled) {
                console.log(chalk.red.bold("Target '" + t + "' did not call this.done()"));
            }
        }
    }

    function callbackWrapper(err) {
        process.removeListener('exit', processListener);
        callback(err);
    }

    function runRecursive(target, callback) {
        var targetsFound = false;
        for (var t in makeInst.targets) {
            if (fulfilled.have(t) || !makeInst.targets[t].dependsOn.isSubsetOf(fulfilled)) {
                continue;
            }
            targetsFound = true;
            (function(t) {

                async.map([t] + makeInst.targets[t].dependsOn.toArray(), getStat, function(err, stats) {

                    if (err != null) {
                        callback(err);
                    }

                    var shouldRun = false;
                    var targetStat = stats[0];
                    stats.splice(0, 1);
                    if (targetStat === null || stats.some(function(s) {
                            return s === null;
                        })) {
                        shouldRun = true;
                    }
                    else if (stats.some(function(s) {
                            return s.mtime > targetStat.mtime;
                        })) {
                        shouldRun = true;
                    }

                    if (shouldRun) {
                        activeTasks[t] = {
                            doneCalled: false
                        };
                        makeInst.targets[t].action(done, t, makeInst.targets[t].dependsOn.toArray());
                    }
                });

                function done(err) {
                    if (err === undefined) err = null;

                    if (activeTasks[t].doneCalled) callback(new Error("Done is invoked twice for target '" + t + "'"));

                    activeTasks[t].doneCalled = true;

                    if (err === null) {
                        fulfilled.add(t);
                        if (t === target) {
                            callback(err);
                        }
                        else {
                            runRecursive(target, callback);
                        }
                    }
                    else {
                        callback(err);
                    }
                }
            })(t);
        }
        if (!targetsFound) {
            callback(new Error("Circular dependencies detected"));
        }
    }
};