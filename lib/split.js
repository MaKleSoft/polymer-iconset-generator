var path = require("path");
var Promise = require("promise");
var fs = require("fs");
var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);
var libxmljs = require("libxmljs");

function extractDefinitions(html) {
    var match = html.match(/<iron-iconset-svg.*?>[\w\W]*<\/iron-iconset-svg>/);
    var svg = match && match[0];
    if (!svg) {
        return [];
    }

    try {
        var doc = libxmljs.parseXml(svg);
    } catch(e) {
        return [];
    }

    var size = doc.root().attr("size").value();

    return {
        size: size,
        defs: doc.find("//defs/g[@id]").map(function(node) {
            return {
                "name": node.attr("id").value(),
                "svg": node.toString().replace(/(^<g id=".+?">\s*\n)|(\n\s*<\/g>)$/g, "")
            }
        })
    }
}

function wrapSvg(svg, size) {
    return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
        "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n" +
        "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
        "width=\"" + size + "px\" height=\"" + size + "px\">\n" +
        svg +
        "\n</svg>";
}

function split(srcFile, opts) {
    if (path.extname(srcFile) !== ".html") {
        throw "Input file needs to be an html file";
    }

    var dest = opts && opts.dest || path.dirname(srcFile);
    dest = path.join(dest, path.basename(srcFile, ".html"));
    var prefix = opts && opts.prefix || "";

    return readFile(srcFile, {encoding: "utf-8"})
        .then(extractDefinitions)
        .then(function(res) {
            return Promise.all(res.defs.map(function(def) {
                return writeFile(
                    path.join(dest, prefix + def.name + ".svg"),
                    wrapSvg(def.svg, res.size)
                );
            }));
        });
}

module.exports = split;
