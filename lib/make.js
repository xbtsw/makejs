'use strict';

var _ = require('lodash');
var async = require('async');
var fs = require("fs");
var StringSet = require("./stringset.js");
var path = require("path");
path.isAbsolute = require('is-absolute');

exports.isPhony = isPhony;

function isPhony(target) {
    return target[0] === ':';
}

exports.getStat = getStat;

function getStat(target, callback) {
    if (isPhony(target)) {
        callback(null, null);
        return;
    }
    fs.stat(target, function(err, stat) {
        if (err !== null) {
            callback(err);
        }
        else {
            callback(null, stat);
        }
    });
}

function noop(done) {
    done();
}

exports.Make = Make;

function Make() {
    this.targets = Object.create(null);
    this.workingDir = process.cwd();
    this.extraArgs = [];
}

Make.prototype.toAbsolute = function(target) {
    if (isPhony(target)) {
        return target;
    }
    return path.resolve(this.workingDir, target);
};

Make.prototype.cwd = function(newcwd) {
    if (newcwd === undefined) {
        return this.workingDir;
    }
    else {
        if (!path.isAbsolute(newcwd)) {
            throw new Error('For clarity, please assign a absolute path to cwd');
        }
        this.workingDir = newcwd;
    }
};

Make.prototype.args = function() {
    return this.extraArgs;
};

Make.prototype.initTarget = function(target) {
    if (!(target in this.targets)) {
        this.targets[target] = {
            dependsOn: new StringSet(),
            action: noop
        };
    }
};

Make.prototype.rule = function(target, dependencies, action) {
    var makeInst = this;

    if (!_.isString(target)) throw new Error("Target must be string, but '" + target.toString() + "' given");

    target = makeInst.toAbsolute(target);
    this.initTarget(target);

    if (!_.isArray(dependencies)) throw new Error("Dependencies must be array, but '" + dependencies.toString() + "' given");

    dependencies = dependencies.map(function(dep) {

        if (!_.isString(dep)) throw new Error("Dependencies must all be string, but '" + dep.toString() + "' given");

        dep = makeInst.toAbsolute(dep);
        makeInst.initTarget(dep);
        return dep;
    });

    makeInst.targets[target].dependsOn.absorb(dependencies);

    if (action !== null && action !== undefined) {

        if (!_.isFunction(action)) throw new Error("Action must be function, but '" + action.toString() + "' given");

        makeInst.targets[target].action = action;
    }

};

Make.prototype.run = function(target, callback) {
    var makeInst = this;

    // validate input
    if (!_.isString(target)) callback(new Error("Target must be string, but '" + target.toString() + "' given"));

    target = makeInst.toAbsolute(target);
    if (!(target in makeInst.targets)) callback(new Error("No rule to make target '" + target + "'\n"));

    var fulfilled = new StringSet();
    var activeTasks = Object.create(null);
    var finished = false;

    process.on('exit', processListener);

    runRecursive(target, callbackWrapper);

    function processListener() {
        var didNotCallDone = [];
        for (var t in activeTasks) {
            if (!activeTasks[t].doneCalled) {
                didNotCallDone.push(t);
            }
        }
        if (didNotCallDone.length > 0) {
            callback(new Error("Target(s) '" + didNotCallDone.toString() + "' did not call done"));
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

                async.map([t].concat(makeInst.targets[t].dependsOn.toArray()), getStat, function(err, stats) {

                    //async could send undefined
                    if (err === undefined) err = null;

                    if (finished) {
                        return;
                    }

                    if (err !== null) {
                        finished = true;
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
                    else if (stats.length === 0) {
                        shouldRun = true;
                    }

                    activeTasks[t] = {
                        doneCalled: false
                    };
                    if (shouldRun) {
                        makeInst.targets[t].action(done, t, makeInst.targets[t].dependsOn.toArray());
                    }
                    else {
                        done();
                    }
                });

                function done(err) {
                    if (finished) {
                        return;
                    }

                    if (err === undefined) err = null;

                    if (activeTasks[t].doneCalled) {
                        finished = true;
                        callback(new Error("Done is invoked twice for target '" + t + "'"));
                    }

                    activeTasks[t].doneCalled = true;

                    if (err === null) {
                        if (!isPhony(t)) {
                            fs.readFile(t, function(e) {
                                if (e !== null && e.code === 'ENOENT') {
                                    finished = true;
                                    callback(new Error("File target '" + t + "' does not exist after its action is performed"));
                                }
                                else if (e !== null) {
                                    finished = true;
                                    callback(e);
                                }
                                else {
                                    fulfilled.add(t);
                                    if (t === target) {
                                        callback(err);
                                    }
                                    else {
                                        runRecursive(target, callback);
                                    }
                                }
                            });
                        }
                        else {
                            fulfilled.add(t);
                            if (t === target) {
                                finished = true;
                                callback(err);
                            }
                            else {
                                runRecursive(target, callback);
                            }
                        }
                    }
                    else {
                        finished = true;
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