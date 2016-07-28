var fs = require("fs"),
    path = require("path"),
    svgPattern = /<svg[\w\W]*?>([\w\W]*)<\/svg>/;

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

function generateSvg(defs, opts) {
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

function generate(srcDir, opts) {
    opts = opts || {};
    var setName = opts.name || path.basename(srcDir);
    var dest = opts.dest || srcDir;
    dest = path.extname(dest) == ".html" ? dest : path.join(dest, setName + ".html");

    var defs = readDir(srcDir, opts);
    var html = generateSvg(defs, opts);
    fs.writeFileSync(dest, html);
}

module.exports = generate;
