#!/usr/bin/env node
var path = require("path"),
    generate = require("../index.js"),
    argv = require("yargs").argv,
    srcDir = argv._[0] && path.normalize(argv._[0]) || "./";

generate(srcDir, {
    dest: argv.dest && path.normalize(argv.dest),
    lib: argv.lib && path.normalize(argv.lib),
    name: argv.name,
    size: argv.size,
    prefix: argv.prefix
});