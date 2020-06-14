#!/usr/bin/env bash

# Command that I used to install minify: npm i minify -g

minify ../src/*.js > ./lwPhylo.min.js

# remove trailing white-spaces

cat lwPhylo.min.js | tr -d "\n" > lwPhylo.min.js
