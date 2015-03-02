/*global describe:false it:false */

'use strict';

require('mocha');
var should = require('should');
var StringSet = require('../lib/stringset.js');

describe('StringSet', function() {
    describe('union', function() {
        it('should return union of lists with non duplicated items', function(done) {
            var set1 = new StringSet(['a', 'b', 'c']);
            var set2 = new StringSet(['a', 'd']);
            set1.union(set2).equalTo(new StringSet(['a', 'b', 'c', 'd']))
                .should.be.true;
            done();
        });
    });

    describe('isSubsetOf', function() {
        it('should return true if every key in this set is in the other set', function(done) {
            var set1 = new StringSet(['a', 'b', 'c']);
            var set2 = new StringSet(['a', 'b', 'c', 'd']);
            set1.isSubsetOf(set2)
                .should.be.true;
            done();
        });
        it('should work if arguments are empty', function(done) {
            var emptyset = new StringSet();
            var set2 = new StringSet(['a', 'b', 'c', 'd']);
            emptyset.isSubsetOf(set2)
                .should.be.true;
            emptyset.isSubsetOf(emptyset)
                .should.be.true;
            done();
        });
    })
});