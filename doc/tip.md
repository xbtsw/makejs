# Tips for writing a good makefile.js

## Make all file path relative to current makefile.js

Specify all file path inside a makefile.js relative to the makefile.js itself strikes good 
balance between clarity and readability. With following line you can easily achieve that:

```js
make.baseDir(__dirname);
```

This is especially useful if you have multi-makefile setup which each makefile govern a subtree.

You can also change the current working directory to the same directory as your makefile.js
to avoid any surprise.

```js
process.chdir(__dirname);
```

## Make use of existing npm packages as much as possible.

makejs promote use and creation of general purpose npm packages, rather than framework specific 
plugins. 

When coding your makefile, if you got a very project specific requirement. Go ahead and code the
logic in your makefile, if too long to code directly inside makefile, make a module and `require`
it.

If you find a solution to a common problem that no package exist on npm solves it well, feel free to
create a npm package for the problem. When creating the package, keep in mind that it may also be 
useful for other purpose other than makefile (for server, web page, etc). So it is recommended to 
make your API as fluid as possible, focus on one problem as much as possible. In particular, avoid
creating a catch-all function with countless options configuered with a json object ;]

## Debug your makefile with node debugger

makefile.js is just another node module. Got a tricky bug in your makefile? Just fire up the debugger, 
put breakpoints, step thru, do whatever you like.

## Avoid phony targets as much as possible

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
