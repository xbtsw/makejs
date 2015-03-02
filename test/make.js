/*global describe:false it:false */

'use strict';

require('mocha');

var should = require('should');
var Make = require('../lib/make.js').Make;
var getStat = require('../lib/make.js').getStat;
var fs = require('fs');
var path = require('path');

describe('getStat', function() {
    it('Should get stats of given file which exists', function(done) {
        getStat('test/assets/test1', function(err, stat) {
            should(err).be.null;
            stat.should.be.instanceof(fs.Stats);
            done();
        });
    });

    it('Should return null if given file does not exist', function(done) {
        getStat('test/assets/nonExistFile', function(err, stat) {
            should(err).be.null;
            should(stat).be.null;
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
        it('Should set the cwd if called with arguments', function(done) {
            var make = new Make();
            var cwd = '/test';
            make.cwd().should.be.equal('.');
            make.cwd(cwd);
            make.cwd().should.be.equal(cwd);
            done();
        });

        it('Should have the default cwd be the current directory', function(done) {
            var make = new Make();
            make.cwd().should.be.equal('.');
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
    });

    describe('run', function() {
        it('Should run targets on dependency order', function(done) {
            var make = new Make();

            function popret(done, target) {
                ret.push(target);
                done();
            }
            var ret = [];

            make.define('test', ['test1'], popret);
            make.define('test1', ['test2'], popret);
            make.define('test2', [], popret);

            make.run('test', function(err) {
                should(err).be.null;
                ret.should.be.eql(['test2', 'test1', 'test'].map(make.toAbsolute, make));
                done();
            });
        });
        it('Should throw error on circular dependency', function(done) {
            var make = new Make();

            make.define('test', ['test1']);
            make.define('test1', ['test']);
            make.define('test2', []);

            make.run('test', function(err) {
                err.should.be.Error;
                err.message.should.match(/^Circular dependencies detected$/);
                done();
            });
        });
    });
});