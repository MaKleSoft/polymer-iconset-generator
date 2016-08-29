var fs = require("fs"),
    path = require("path"),
    svgPattern = /<svg[\w\W]*?>([\w\W]*)<\/svg>/,
    SVGO = require('svgo'),
    svg2js = require('svgo/lib/svgo/svg2js'),
    Promise = require('promise'),
    util = require('./util'),
    readFile = Promise.denodeify(fs.readFile),
    writeFile = Promise.denodeify(fs.writeFile),
    readDir = Promise.denodeify(fs.readdir);

/**
 * Parse dimensions from svg code by looking for `width` and `height` attributes on svg tag
 * @param {string} svg
 * @return {Promise}
 */
function parseDimensions(svg) {
    return new Promise(function(resolve) {
        svg2js(svg, function(result) {
            var ret = {
                svg: svg
            };
            try {
                var svgElem = result.content.filter(function(el) {
                    return el.elem === 'svg';
                })[0];
                ret.dimensions = {
                    width: parseInt(svgElem.attr('width').value.replace('px', ''), 10),
                    height: parseInt(svgElem.attr('height').value.replace('px', ''), 10)
                };
            } catch (e) {
                // Leave dimensions undefined
            }
            resolve(ret);
        });
    });
}

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
    return new Promise(function(resolve, reject) {
        svgo.optimize(svg, function(result) {
            if (result.error) {
                reject(result.error);
            }
            var ret = {
                svg: result.data
            };
            try {
                ret.dimensions = {
                    width: parseInt(result.info.width, 10),
                    height: parseInt(result.info.height, 10)
                };
            } catch(e) {
                // Leave dimensions undefined
            }
            resolve(ret);
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
            // If `clean` option is set, run the svg code through the optimizer. If not, only parse the icon
            // dimensions, but only if the size is not already provided through the options
            return opts.clean ? clean(content, opts) :
                opts.size ? {svg: content} : parseDimensions(content);
        })
        .then(function(result) {
            var match = result.svg.match(svgPattern);
            var svg = match ? "\n<g id=\"" + name + "\">\n" + match[1] + "\n</g>" : "";
            return {
                svg: svg,
                dimensions: result.dimensions
            }
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

            // If no explicit prefix is provided for omission, try to detect the longest common prefix
            // automatically
            opts.omitPrefix = opts.omitPrefix !== undefined ?
                opts.omitPrefix : util.detectCommonPrefix(svgFiles);

            var promises = svgFiles.map(function(file) {
                var fullPath = path.join(dir, file);
                return processFile(fullPath, opts);
            });

            return Promise.all(promises);
        });
}

/**
 * Returns the maximum size from a list of icon definitions
 * @param {object[]} defs
 * @return {number}
 */
function maxSize(defs) {
    return defs.reduce(function(curr, def) {
        return def.dimensions ? Math.max(curr, def.dimensions.width, def.dimensions.height) : curr;
    }, 0);
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
    var size = opts.size || maxSize(defs) || 100;
    var libImport = "<link rel=\"import\" href=\"" + importPath + "\">";
    var svg = defs.map(function(def) {
        return def.svg;
    }).join("\n");

    return libImport + "\n\n" +
        "<iron-iconset-svg name=\"" + setName + "\" size=\"" + size + "\">\n" +
        "<svg>\n" +
        "<defs>\n" +
        svg +
        "\n\n</defs>\n" +
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

    // If there is a config file in this directory, use it
    try {
        var cfg = require(path.resolve(srcDir, "pigcfg.json"));
        util.extend(opts, cfg, false);
    } catch (e) {
        // No config file found, do nothing
    }

    opts.name = opts.name || path.basename(srcDir);
    var dest = opts.dest || srcDir;
    dest = path.extname(dest) == ".html" ? dest : path.join(dest, opts.name + ".html");

    return processDir(srcDir, opts)
        .then(function(defs) {
            if (!defs.length) {
                return Promise.resolve();
            }

            var html = generateHTML(defs, opts);
            return writeFile(dest, html);
        });
}

module.exports = generate;
