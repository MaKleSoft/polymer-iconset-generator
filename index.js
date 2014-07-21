var fs = require("fs"),
    path = require("path"),
    svgPattern = /<svg[\w\W]*?>([\w\W]*)<\/svg>/;

function read(file, prefix) {
    var name = path.basename(file, ".svg").replace(prefix, ""),
        content = fs.readFileSync(file, {encoding: "utf-8"}),
        match = content.match(svgPattern);

    if (!match) {
        console.log("File " + file + " did not contain a valid svg element!");
        return "";
    }

    return "\n<g id=\"" + name + "\">\n" + match[1] + "\n</g>";
}

function readDir(dir, prefix) {
    var defs = [];
    fs.readdirSync(dir).forEach(function(entry) {
        var fullPath = path.join(dir, entry);
        if (path.extname(entry) == ".svg") {
            defs.push(read(fullPath, prefix));
        }
    });
    return defs;
}

function generate(srcDir, opts) {
    opts = opts || {};
    var setName = opts.name || path.basename(srcDir),
        dest = opts.dest || setName + ".html",
        libPath = opts.lib || "core-iconset-svg.html",
        relLibPath = path.extname(dest) == ".html" ?
            path.relative(path.dirname(dest), libPath) : path.relative(dest, libPath),
        size = opts.size || "100",
        prefix = opts.prefix || "",
        libImport = "<link rel=\"import\" href=\"" + relLibPath + "\">",
        defs, html;

    dest = path.extname(dest) == ".html" ? dest : path.join(dest, setName + ".html");

    defs = readDir(srcDir, prefix);
    html = libImport + "\n\n<core-iconset-svg id=\"" + setName + "\" iconSize=\"" + size + "\">\n" +
        "<svg>\n<defs>\n" + defs.join("\n") + "\n</defs>\n</svg>\n</core-icon-set>";
    fs.writeFileSync(dest, html);
}

module.exports = generate;