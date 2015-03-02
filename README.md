# makejs
_create declarative, parallel and incremental makefile in javascript_

## Sample makefile.js
```js
var make = require('makejs');
var glob = require('glob').sync;
var concat = require('concat');
var path = require('path');
var fs = require('fs');
var replaceExt = require('replace-ext');
var exec = require('child_process').exec;
var gaze = require('gaze');

// compile each coffeescript in src/js to .tmp/js
// it's a node program, we can just loop
glob('src/js/**/*.coffee').forEach(function(src){
    // replace the extension and folder
    var target = replaceExt(path, '.js').replace('/src/', '/.tmp/');
    
    // each js file will only be recompiled if source changed. 
    // the compilations are parallel since we used async exec.
    make.define(target, [src], function(done, target, deps){
        // just use command-line ;P, you can also call coffee.compile().
        exec('coffee -c ' + src[0] + '-o ' + path.dirname(target), function(err){
            // call done() when done, optionally with err.
            done(err);
        });
    });
});

// concatenate all js file in .tmp/js to dist/all.js
// this will only get rerun if any of js is regenerated
make.define('dist/all.js', glob('.tmp/js/**/*.js'), function(done, target, deps){
    // use whatever generic npm package you like
    concat(deps, target, function(err){
        done(err);
    });
}

// classic makefile phony target
make.define('make_js_files', ['dist/all.js']);

// a quick and dirty watch
make.define('watch', [], function(){
    gaze('src/js/**/*.coffee', function(){
        this.on('all', function(){
            // just run the whole thing, since it's incremental.
            exec('makejs make_js_files', function(){});
            // we don't call 'done()' here because we want to keep watching
        });
    });
});

```

## Philosophy

* Makefile should be file-centric, since it is all about file manipulations.
* Makefile dependencies are best described in declarative style.
* Makefile should be executed in parallel when its' dependencies allow it to.
* Makefile should be incremental such that the targets should only be re-executed when necessary.
* Makefile should leverage the fact that javascript is a comprehensive language.
* Makefile should leverage existing and promote creation of generic purpose npm packages, rather than framework specific plugins.

## License

MIT License, see `LICENSE` file for details.