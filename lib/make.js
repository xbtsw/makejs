'use strict';

var _ = require('lodash');
var async = require('async');
var fs = require("fs");
var StringSet = require("./stringset.js");
var path = require("path");
path.isAbsolute = require('is-absolute');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

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
        if (err) {
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

util.inherits(Make, EventEmitter);

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
    var active = new StringSet();
    var finished = false;
    var requiredTargets = new StringSet();
    
    // find all the required targets
    function addDepsToRequiredTargets(target){
        if (requiredTargets.have(target)){
            callback(new Error("Circular dependencies detected"));
            return;
        }
        requiredTargets.add(target);
        for(var deps in makeInst.targets[target].dependsOn.hash){
            addDepsToRequiredTargets(deps);
        }
    }
    addDepsToRequiredTargets(target);

    process.on('beforeExit', processListener);
    makeInst.on('done', doneListener);
    runRecursive(target, callbackWrapper);

    function processListener() {
        makeInst.emit('done');
    }

    function doneListener() {
        var notDone = active.toArray();
        if (notDone.length > 0) {
            callback(new Error("Target(s) '" + notDone.toString() + "' did not call done"));
        }
    }

    function callbackWrapper(err) {
        finished = true;
        process.removeListener('beforeExit', processListener);
        makeInst.removeListener('done', doneListener);
        callback(err);
    }

    function runRecursive(target, callback) {
        for (var t in requiredTargets.hash) {
            if (active.have(t) || fulfilled.have(t) || !makeInst.targets[t].dependsOn.isSubsetOf(fulfilled)) {
                continue;
            }

            active.add(t);

            (function(t) {

                getStat(t, function(err, targetStat) {

                    if (finished) {
                        return;
                    }

                    if (err && err.code === 'ENOENT') {
                        targetStat = null;
                    }
                    else if (err) {
                        callback(err);
                    }

                    async.map(makeInst.targets[t].dependsOn.toArray(), getStat, function(err, stats) {

                        //async could send undefined
                        if (err === undefined) err = null;

                        if (finished) {
                            return;
                        }

                        if (err) {
                            callback(err);
                        }

                        var shouldRun = false;

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

                        if (shouldRun) {
                            makeInst.targets[t].action(done, t, makeInst.targets[t].dependsOn.toArray());
                        }
                        else {
                            done();
                        }
                    });
                });

                function done(err) {
                    if (finished) {
                        return;
                    }

                    if (err === undefined) err = null;

                    if (!active.have(t)) {
                        callback(new Error("Done is invoked twice for target '" + t + "'"));
                    }

                    active.remove(t);

                    if (err === null) {
                        fulfilled.add(t);
                        if (!isPhony(t)) {
                            fs.readFile(t, function(e) {
                                if (e !== null && e.code === 'ENOENT') {
                                    callback(new Error("File target '" + t + "' does not exist after its action is performed"));
                                }
                                else if (e !== null) {
                                    callback(e);
                                }
                                else {
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
                            if (t === target) {
                                callback(err);
                            }
                            else {
                                runRecursive(target, callback);
                            }
                        }
                    }
                    else {
                        callback(err);
                    }
                }
            })(t);
        }
    }
};