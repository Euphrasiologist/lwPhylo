#!/usr/bin/env bash

# Command that I used to install minify: npm i minify -g

minify ../src/*.js | tr -d "\n" > ./lwPhylo.min.js
