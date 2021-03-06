var generate = require("../lib/generate");
var split = require("../lib/split");
var program = require("commander");
var util = require("../lib/util");

function run(args) {
    program
        .arguments("<dir...>")
        .option("-d, --dest <path>", "File or directory path of target file")
        .option("-b, --bower-path <path>", "Path to bower_components directory")
        .option("-n, --name <name>", "Iconset name, if omitted, directory name will be used")
        .option("-s, --size <size>", "Icon size")
        .option("-p, --prefix <prefix>", "Prefix to be added to file names for icon names")
        .option("-o, --omit-prefix <prefix>", "Common filename prefix to be omitted from icon name")
        .option("-c, --clean", "Wheather to clean the svg code via svgo")
        .option("-m, --minify", "Wheather to minimize the svg code via svgo. (only works with --minimize)")
        .option("-1, --monochrome", "Remove fill, stroke and class attributes as well as style elements")
        .option("--comment <comment>", "Comment to add to the generated iconset file")
        .option("--split", "Split mode. Generate svg files from iconset file")
        .option("--demo", "Generate a demo file for icon set")
        // .action(generate)
        .parse(args);

    var opts = program.opts();

    // This is a workaround for to a bug in commander where any option called 'name' gets overwritten by
    // the Command::name function
    // TODO: Remove as soon as it's fixed in commander
    opts.name = typeof opts.name === "function" ? undefined : opts.name;

    if (program.split) {
        program.args.forEach(function(file) {
            split(file, util.extend({}, opts)).done();
        });
    } else {
        program.args.forEach(function(dir) {
            generate(dir, util.extend({}, opts)).done();
        })
    }
}

module.exports = {
    run: run
};
