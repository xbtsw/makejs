# makejs concepts

makejs uses very similar concepts as [makefile](http://en.wikipedia.org/wiki/Makefile), 
if you understand the concept of makefile, you already understand makejs.

## Target, Dependencies and Action
Each _target_ in makejs have one or more _dependencies_, each _dependency_ 
itself are _targets_ too.
Each _target_ have one function as its _recipe_. The _recipe_ is garenteed to 
be executed only after all of the _target_'s _dependencies_ are fulfilled.

A _target_ is considered fulfilled when:

* If it's a _phony target_: its _action_ is executed in this makejs run, or
* If it's a _file target_:
  * one or more of its dependencies is a _phony target_: its _action_ is executed in this makejs run
  * non of its dependencies is newer than the _target_

## Phony target
A _phony target_ is a _target_ which start its name by a colon `:`. Phony targets share the same concept as 
classic makefile phony target. During a build, a _phony target_ always get rebuild; if a _phony target_ is 
among a dependencies of a target, the target always get rebuild.

For this reason, a _phony target_ is only recommanded to be used as alias of a _file target_ to ease commandline 
invocation, or used when a target doesn't produce a file as its outcome. Excessive use of _phony target_ will 
make your build less incremental.
