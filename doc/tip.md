# Tips for writing a good makefile.js

## Make all file path relative to current makefile.js

Specify all file path for `make.rule()` relative to the makefile.js itself strikes good 
balance between clarity and readability. Following line can easily achieve that:

```js
make.baseDir(__dirname);
```

This is especially useful if you have multi-makefile setup which each makefile govern a subtree.

Before working with commandline utilities, or npm package that relies on `process.cwd()` It's 
also helpful to change the current working directory to the same directory as your makefile.js
to make your makefile more robust.

```js
process.chdir(__dirname);
```

## Make use of functions!

Don't forget the fact that you are just writing up a node module. If you find that you are 
repeating yourself in makefile, make a function!

```js
var image_src = glob.findMapping('*.jpg', {
    srcBase: 'src',
    destBase: 'dist/assets/images
});

var css_src = glob.findMapping('*.css', {
    srcBase: 'src',
    destBase: 'dist/assets/css
});

copyAll(image_src);
copyAll(css_src);

function copyAll(mapping) {
    mapping.forEach(function (f) {
        make.rule(f.dest, f.src, function (done, target, deps) {
            fs.copy(deps[0], target, function (err) {
                done(err);
            });
        });
    });
}
```

## Make use of modules!

Got a multi-makefile setup? There's piece of logic (like the `copyAll()` above) you always use across
multiple makefiles? Make a module and `require()` it. Again, it's just a node module.

## Make use of existing npm packages whenever possible.

makejs promote the use and creation of general purpose npm packages, rather than framework specific 
plugins. 

When coding your makefile, if you got a very project specific requirement. Go ahead and code the
logic in your makefile. If the logic is too complex to implement inline in makefile, make a module 
and `require` it.

If you find a solution to a common problem that no package exist on npm solves it well, feel free to
create a npm package. When creating the package, keep in mind that it may also be useful for purposes 
other than makefile (for example, server, web page, etc). Make a fluid API, focus on one problem when 
make your package. In particular, avoid creating a catch-all function with countless options 
configuered with a json object ;]

## Debug your makefile with node debugger

makefile.js is just another node module. Got a tricky bug in your makefile? Just fire up the debugger, 
drop breakpoints, step thru, repl, do whatever you like.

## Avoid phony targets as dependencies

By its nature, phony targets makes your build less incremental. Use file dependencies as much
as possible. As a rule of thumb, phony target is most suited to create a alias for easier
commandline invocation, sitting on the tip of the dependency tree. (i.e. nothing depends on it)

Assume you have:
```js
var src = ['jade/file1.jade', 'jade/file2.jade'];
var dest = ['html/file1.html', 'html/file2.html'];

// This is a good use of phony target for easy invocation
// so instead of:
//
// makejs html/file1.html
// makejs html/file2.html
//
// we can do both with
// 
// makejs :jade
make.rule(':jade', dest);
```

**Good**

Each of your html file only got recompiled if the corresponding jade file is changed.

```js
src.forEach(function(s, index){
  make.rule(dest[index], [s], function(done){
    //compile jade
  });
});
```

**Bad**

Trying to use phony target as "variable", why not just use javascript variables?
This leads all html being recompiled every single build

```js
make.rule(':jade_src', src);
src.forEach(function(d){
  make.rule(d, [':jade_src'], function(done){
    //compile jade
  });
});
```

## Use async functions to make your build more parallel

One advantage of writing a makefile in node is that you can naturally make your
build parallel with clear logic. By simply using async functions inside your `action` 
function, targets that don't depend on each other will be executed in parallel, 
increase build efficiency and utilize your awesome multi-core CPU better.
