'use strict';


function StringSet(array) {
    var inst = this;
    if (array === undefined) {
        array = [];
    }
    inst.hash = Object.create(null);
    array.forEach(function(key) {
        inst.hash[key] = null;
    });
}

StringSet.prototype.toArray = function toArray() {
    var ret = [];
    for (var key in this.hash) {
        ret.push(key);
    }
    return ret;
};

StringSet.prototype.length = function(){
    var ret = 0;
    for (var key in this.hash) {
        ret++;
    }
    return ret;
}

StringSet.prototype.add = function(key) {
    this.hash[key] = null;
};

StringSet.prototype.remove = function(key) {
    delete this.hash[key];
};

StringSet.prototype.have = function(key) {
    return (key in this.hash);
};

StringSet.prototype.clone = function() {
    var ret = new StringSet();
    for (var key in this.hash) {
        ret.add(key);
    }
    return ret;
}

StringSet.prototype.union = function(other) {
    var ret = this.clone();
    for (var key in other.hash) {
        ret.add(key);
    }
    return ret;
};

StringSet.prototype.absorb = function(array) {
    var inst = this;
    array.forEach(function(key) {
        inst.add(key);
    });
}

StringSet.prototype.isSubsetOf = function(other) {
    for (var key in this.hash) {
        if (!(key in other.hash)) {
            return false;
        }
    }
    return true;
};

StringSet.prototype.equalTo = function(other) {
    return this.isSubsetOf(other) && other.isSubsetOf(this);
}

module.exports = StringSet;