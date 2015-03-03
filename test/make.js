/*global describe:false it:false beforeEach:false afterEach:false*/

'use strict';

require('mocha');

var should = require('should');
var Make = require('../lib/make.js').Make;
var getStat = require('../lib/make.js').getStat;
var fs = require('fs-extra');
var path = require('path');

describe('getStat', function() {
    it('Should get stats of given file which exists', function(done) {
        getStat('test/assets/test1', function(err, stat) {
            should(err).be.null;
            stat.should.be.instanceof(fs.Stats);
            done();
        });
    });

    it('Should return error if given file does not exist', function(done) {
        getStat('test/assets/nonExistFile', function(err, stat) {
            should(err).not.be.null;
            err.code.should.be.equal('ENOENT');
            done();
        });
    });

    it('Should return null if given string begin with colon', function(done) {
        getStat(':dummy', function(err, stat) {
            should(err).be.null;
            should(stat).be.null;
            done();
        });
    });
});

describe('make', function() {
    describe('cwd', function() {
        it('Should default to current working directory', function(done) {
            var make = new Make();
            make.cwd().should.be.equal(process.cwd());
            done();
        });
        it('Should set the cwd if called with arguments', function(done) {
            var make = new Make();
            var cwd = '/test';
            make.cwd(cwd);
            make.cwd().should.be.equal(cwd);
            done();
        });
    });

    describe('toAbsolute', function() {
        it('Should resolve to the absolute path based on cwd', function(done) {
            var make = new Make();
            make.cwd(__dirname);
            make.toAbsolute('test')
                .should.be.eql(path.resolve(__dirname, 'test'));
            done();
        });
        it('Should resovle phony target to itself', function(done) {
            var make = new Make();
            var target = ':test';
            make.toAbsolute(target)
                .should.be.eql(target);
            done();
        });
    });

    describe('run', function() {
        var tmp = path.resolve(__dirname, '../.tmp');
        beforeEach('clean up .tmp dir', function(done) {
            fs.remove(tmp, function(err) {
                if (err !== null && err.code !== 'ENOENT') {
                    done(err);
                }

                fs.mkdirs(tmp, function(err) {
                    done(err);
                });
            });
        });
        afterEach('clean up .tmp dir', function(done) {
            fs.remove(tmp, function(err) {
                done(err);
            });
        });

        it('Should guarantee that the dependencies are always executed before target', function(done) {
            var make = new Make();

            function popret(done, target) {
                ret.push(target);
                done();
            }
            var ret = [];

            make.rule(':test', [':test1'], popret);
            make.rule(':test1', [':test2'], popret);
            make.rule(':test2', [], popret);

            make.run(':test', function(err) {
                should(err).be.null;
                ret.should.be.eql([':test2', ':test1', ':test']);
                done();
            });
        });
        it('Should throw error on circular dependency', function(done) {
            var make = new Make();

            make.rule(':test', [':test1']);
            make.rule(':test1', [':test']);

            make.run(':test', function(err) {
                err.should.be.Error;
                err.message.should.match(/^Circular dependencies detected$/);
                done();
            });
        });
        it('Should silently success on phony targets that have no action defined', function(done) {
            var make = new Make();

            make.rule(':test', []);

            make.run(':test', function(err) {
                should(err).be.null;
                done();
            });
        });
        it('Should silently success on file targets that exists and have no action defined', function(done) {
            var make = new Make();
            make.cwd(__dirname);

            make.rule('assets/test1', []);

            make.run('assets/test1', function(err) {
                should(err).be.null;
                done();
            });
        });
        it('Should not run the action if no dependencies are newer than target', function(done) {
            var executed = false;
            var make = new Make();
            var src = path.resolve(__dirname, 'assets/test1');
            var target = path.resolve(tmp, 'test1');
            fs.copy(src, target, function(err) {
                if (err !== null) {
                    done(err);
                }

                make.rule(target, [src], function(done) {
                    executed = true;
                    done();
                });

                make.run(target, function(err) {
                    should(err).be.null;
                    executed.should.be.false;
                    done();
                });
            });
        });
    });
});