
makejs uses very similar concepts as [makefile](http://en.wikipedia.org/wiki/Makefile), 
if you understand the concept of makefile, you already understand makejs.

#### Target, Dependencies and Action
Each _target_ in makejs have one or more _dependencies_, each _dependency_ 
itself are _targets_ too.
Each _target_ have one function as its _recipe_. The _recipe_ is garenteed to 
be executed only after all of the _target_'s _dependencies_ are fulfilled.

A _target_ is considered fulfilled when:

* If it's a _phony target_: its _action_ is executed in this makejs run, or
* If it's a _file target_:
  * one or more of its dependencies is a _phony target_: its _action_ is executed in this makejs run
  * non of its dependencies is newer than the _target_


### define(target, dependencies, action)
Define a `target` with `dependencies`, with `action` as its recipe.

####target
Type: `string`

A string represent the name of this target, 
when you ask makejs to make a `target`, the `action` is garenteed to be executed
only after all of the dependencies are fulfilled.




dependencies: `[string]`

action: `function`



## Philosophy

* Makefile should be file-centric, since it is all about file manipulations.
* Makefile dependencies are best described in declarative style.
* Makefile should be executed in parallel when its' dependencies allow it to.
* Makefile should be incremental such that the targets should only be re-executed when necessary.
* Makefile should leverage the fact that javascript is a comprehensive language.
* Makefile should leverage existing and promote creation of generic purpose npm packages, rather than framework specific plugins.