# makejs API documentation

makejs have very simple API, there's only one main API `make.rule()` you will 
use regularly.

### rule(target, dependencies[, action])
create a rule for a `target` with `dependencies`, with `action` as its action.

##### target
Type: `string`

A string represent the target.
* if the string start with a colon `:` it is treated as a _phony_target_
* otherwise the string is considered a file target, if the path is relative
it will be resolved to absolute path based on `make.baseDir()` setting.

##### dependencies
Type: `[string]`

A array of `string` represent the dependencies of this target.
* if the string start with a colon `:` it is treated as a _phony_target_
* otherwise the string is considered a file target, if the path is relative
it will be resolved to absolute path based on `make.baseDir()` setting.

##### action
Type: `function(done, target, dependencies)`

A function will be called when the all of the dependencies are fulfilled and the 
target is being make.

The function will receive three arguments:
* `done(err)` when the action is finished executing, you must call `done()`. 
Pass `err` if you got any.
* `target` is the absolute path of the target. If target is phony, will be 
the name of the target (with colon).
* `dependencies` is an array of absolute path of the _dependencies_ of the target.
the _dependencies_ is not guaranteed to have the same order as you provided to
`make.rule()`, and any duplication is removed.

### baseDir(path)

Set baseDir to `path`, the `path` must be absolute path. Use `path.resolve()`
if you need to. Any future call to `make.rule()` with non-absolute file path
will be resolved based on this path.

### baseDir()

Get current baseDir.

### args()

Get a array of arguments that you passed when calling makejs from command line. 
The first argument is the name of makejs command (typically 'makejs'), the second 
argument is the target you are building. The rest are passed as-is.
