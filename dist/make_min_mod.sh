#!/usr/bin/env bash

# a script to add exports to the end of the minified script.
# this is because I want to import these functions to Observable (observablehq.com)
# but also means I need to upload to npm, to access via https://www.jsdelivr.com/.

# minify as before.
minify ../src/*.js | tr -d "\n" > ./lwPhylo.min_mod.js

# get names of all of the functions.
exports=$(grep -o "function [[:alpha:]][^(]*" ./lwPhylo.min_mod.js | awk 'length $0 > 11' | sed 's/function //' | paste -s -d, -)

# strings to add at beginning and end.
prefix="export {"
suffix=" };"

# the full string -> "export { ...functions... };
append="$prefix $exports $suffix"

# write to file
echo "$(cat ./lwPhylo.min_mod.js)" "$(echo $append)" > ./lwPhylo.min_mod.js
