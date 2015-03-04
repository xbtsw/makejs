# makejs
_create declarative, parallel and incremental makefile in javascript_

## Documentation
For detailed documentation of main API `make.rule()`, recipes and tips writing makefile.js, visit [documentation page](/doc/README.md)

## Sample makefile.js
How does makefile in node look like?
```js
var make = require('make-js');

var path = require('path');
var exec = require('child_process').exec;

// these awesome generic purpose packages are all pre-existing on npm
var glob = require('globule');
var concat = require('concat');
var Gaze = require('gaze').Gaze;

/* 
 * compile each coffeescript in src/js to .tmp/js
 */

// use simple javascript variables to hold your settings, in whatever
// data structure you feel like
var coffeeScripts = glob.findMapping('js/**/*.coffee', {
    srcBase: 'src',
    destBase: '.tmp',
    ext: '.js'
});

// makefile.js is just another node program, we can just loop through our files
// and create rules for all of them
coffeeScripts.forEach(function(f) {
    // on subsequent runs, each js file will only be recompiled if
    // source is changed since last compile
    make.rule(f.dest, f.src, function(done, target, deps) {
        // just use command-line ;P, you can also call coffee.compile().
        // the compilations of the files will be parallel since we used async exec.
        exec('coffee -o ' + path.dirname(target) + ' -c ' + deps[0], function(err) {
            // call done() when done, optionally with err.
            done(err);
        });
    });
});

/* 
 * concatenate all js file compiled to dist/all.js
 */

// this will only get rerun if any of js is regenerated
make.rule('dist/all.js', coffeeScripts.map(function(f) {
    return f.dest;
}), function(done, target, deps) {
    // use whatever generic npm package you like
    concat(deps, target, function(err) {
        done(err);
    });
});

// A phony target works just as in classic makefile
// except we made it explicit that it must start with colon
// we create a phony target for dist/all.js so that we don't need to type
// the whole filename when invoking makejs
make.rule(':js', ['dist/all.js']);

/*
 * A quick and dirty incremental and parallel watch
 */

// A phony target is just a target, it can have dependencies and actions just 
// like others
make.rule(':watch', [], function(done) {
    new Gaze('src/js/**/*.coffee').on('all', function(){
        // Just invoke makejs again so it by its nature incremental and parallel
        exec('makejs :js');
        // We want to keep watching, so not calling done() here
    });
});
```

## Then?

To incrementally rebuild your js files:
```
makejs :js
```

To watch and automatically rebuild js files as you edit the coffeescripts:
```
makejs :watch
```

Just want to build one specific file?
```
makejs .tmp/js/user.js
```

## License

MIT License, see `LICENSE` file for details.