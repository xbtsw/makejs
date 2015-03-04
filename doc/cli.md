# Commandline documentation

makejs have very simple commandline interface:
```
makejs <target> ...
```

The first argument is required and is the target you want to make.

* if it is a file target with relative path, it will be resolved to absolute path 
based on current directory
* if it is a file target with absolute path, it will be used as-is
* if it is a _phony target_, it will be used as-is


The rest of the arguments will be made available on `make.args()` during runtime.