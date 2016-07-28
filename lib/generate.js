var fs = require("fs"),
    path = require("path"),
    svgPattern = /<svg[\w\W]*?>([\w\W]*)<\/svg>/;

/**
 * Read a svg file and extract it's contents (groups, paths and such without the boilerplate)
 *
 * @param {string} file - The filename
 * @param {object} opts - Object containing various options
 */
function readFile(file, opts) {
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
    var content = fs.readFileSync(file, {encoding: "utf-8"});
    var match = content.match(svgPattern);

    if (!match) {
        console.log("File " + file + " did not contain a valid svg element!");
        return "";
    }

    return "\n<g id=\"" + name + "\">\n" + match[1] + "\n</g>";
}

/**
 * Read a directories contents and extract svg definitions from all .svg files within
 * For details on the options object see the documentation for `readFile()`
 *
 * @param {string} dir
 * @param {object} opts
 */
function readDir(dir, opts) {
    var defs = [];
    fs.readdirSync(dir).forEach(function(entry) {
        var fullPath = path.join(dir, entry);
        if (path.extname(entry) == ".svg") {
            defs.push(readFile(fullPath, opts));
        }
    });
    return defs;
}

/**
 * Generates html for icon set file from a set of icon definitions
 *
 * @param {Array} defs - Array of icon definitions
 * @param {object} opts - Options object
 */
function generateHTML(defs, opts) {
    opts = opts || {};
    var setName = opts.name;
    var importPath = opts.importPath || "../bower_components/iron-iconset-svg/iron-iconset-svg.html";
    var size = opts.size || "100";
    var libImport = "<link rel=\"import\" href=\"" + importPath + "\">";

    return libImport + "\n\n" +
        "<core-iconset-svg id=\"" + setName + "\" iconSize=\"" + size + "\">\n" +
        "<svg>\n" +
        "<defs>\n" +
        defs.join("\n") +
        "\n</defs>\n" +
        "</svg>\n" +
        "</core-icon-set>";
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
 */
function generate(srcDir, opts) {
    opts = opts || {};
    var setName = opts.name || path.basename(srcDir);
    var dest = opts.dest || srcDir;
    dest = path.extname(dest) == ".html" ? dest : path.join(dest, setName + ".html");

    var defs = readDir(srcDir, opts);
    var html = generateHTML(defs, opts);
    fs.writeFileSync(dest, html);
}

module.exports = generate;
