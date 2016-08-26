var fs = require("fs"),
    path = require("path"),
    svgPattern = /<svg[\w\W]*?>([\w\W]*)<\/svg>/,
    SVGO = require('svgo'),
    Promise = require('promise'),
    readFile = Promise.denodeify(fs.readFile),
    writeFile = Promise.denodeify(fs.writeFile),
    readDir = Promise.denodeify(fs.readdir);

/**
 * Clean up svg code via svgo
 * @param {string} svg
 * @param {object} opts
 * @return {Promise}
 */
function clean(svg, opts) {
    opts = opts || {};
    var svgo = new SVGO({
        quiet: true,
        js2svg: {
            pretty: !opts.minify
        }
    });
    return new Promise(function(resolve) {
        svgo.optimize(svg, function(result) {
            resolve(result.data);
        });
    });
}

/**
 * Read a svg file and extract it's contents (groups, paths and such without the boilerplate)
 *
 * @param {string} file - The filename
 * @param {object} opts - Object containing various options
 * @return {Promise}
 */
function processFile(file, opts) {
    opts = opts || {};
    var prefix = opts.prefix || "";
    var omitPrefix = opts.omitPrefix || "";
    // Icon names are derived from file names
    var name = path.basename(file, ".svg");
    // Remove common prefix if option is provided
    if (omitPrefix && name.startsWith(omitPrefix)) {
        name = name.substr(omitPrefix.length);
    }
    // Add provided prefix
    name = prefix + name;

    return readFile(file, {encoding: "utf-8"})
        .then(function(content) {
            return opts.clean ? clean(content, opts) : content;
        })
        .then(function(svg) {
            var match = svg.match(svgPattern);
            return match ? "\n<g id=\"" + name + "\">\n" + match[1] + "\n</g>" : "";
        });
}

/**
 * Read a directories contents and extract svg definitions from all .svg files within
 * For details on the options object see the documentation for `processFile()`
 *
 * @param {string} dir
 * @param {object} opts
 * @return {Promise}
 */
function processDir(dir, opts) {
    return readDir(dir)
        .then(function(files) {
            var svgFiles = files.filter(function(file) {
                return path.extname(file) == ".svg";
            });

            var promises = svgFiles.map(function(file) {
                var fullPath = path.join(dir, file);
                return processFile(fullPath, opts);
            });

            return Promise.all(promises);
        });
}

/**
 * Generates html for icon set file from a set of icon definitions
 *
 * @param {Array} defs - Array of icon definitions
 * @param {object} opts - Options object
 * @return {string}
 */
function generateHTML(defs, opts) {
    opts = opts || {};
    var setName = opts.name;
    var importPath = opts.importPath || "../bower_components/iron-iconset-svg/iron-iconset-svg.html";
    var size = opts.size || "100";
    var libImport = "<link rel=\"import\" href=\"" + importPath + "\">";

    return libImport + "\n\n" +
        "<iron-iconset-svg name=\"" + setName + "\" size=\"" + size + "\">\n" +
        "<svg>\n" +
        "<defs>\n" +
        defs.join("\n") +
        "\n</defs>\n" +
        "</svg>\n" +
        "</iron-icon-set>";
}

/**
 * Generates a iconset file for a given directory of svg icons
 *
 * The options argument may contain the following options:
 *
 *     {
 *         name: [name of source dir], // Name for the icon set
 *         size: 100, // Icon size
 *         dest: "[srcDir]/[name].html", // File or directory path of destination file
 *         // Path to icon-iconset-svg element
 *         importPath: "../bower_components/iron-iconset-svg/iron-iconset-svg.html",
 *         prefix: "", // Prefix to add to file names for icon names
 *         omitPrefix: "" // Common prefix in file name to be omitted from icon names
 *     }
 *
 * @param {string} srcDir - Directory containing the icons
 * @param {object} opts - Options object
 * @return {Promise}
 */
function generate(srcDir, opts) {
    opts = opts || {};
    opts.name = opts.name || path.basename(srcDir);
    var dest = opts.dest || srcDir;
    dest = path.extname(dest) == ".html" ? dest : path.join(dest, opts.name + ".html");

    return processDir(srcDir, opts)
        .then(function(defs) {
            var html = generateHTML(defs, opts);
            return writeFile(dest, html);
        });
}

module.exports = generate;
