#!/usr/bin/env node

var generate = require("../lib/generate");
var program = require("commander");

program
    .arguments("<dir>")
    .option("-d, --dest <path>", "File or directory path of target file")
    .option("-i, --import-path <path>", "Import path for iron-iconset-svg element")
    .option("-n, --name <name>", "Iconset name, if omitted, directory name will be used")
    .option("-s, --size <size>", "Icon size")
    .option("-p, --prefix <prefix>", "Prefix to be added to file names for icon names")
    .option("-o, --omit-prefix <prefix>", "Common filename prefix to be omitted from icon name")
    // .action(generate)
    .parse(process.argv);

var opts = program.opts();

// This is a workaround for to a bug in commander where any option called 'name' gets overwritten by
// the Command::name function
// TODO: Remove as soon as it's fixed in commander
opts.name = typeof opts.name === "function" ? undefined : opts.name;

generate(program.args[0], opts);
