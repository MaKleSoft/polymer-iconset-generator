# Polymer Icon Set Generator

__polymer-iconset-generator__ is a node module and command line utility for generating icon set files
from directories of svg icons. The result is an svg file that can be used with the
[iron-iconset-svg](https://github.com/PolymerElements/iron-iconset-svg) web component.

## How to use

### Via the cli

Simply install `polymer-iconset-generator` globally via `npm`

```sh
npm install -g polymer-iconset-generator`
```

The tool should then be available via the `polymer-iconset-generator` command or the shorthand `pig`

```sh
Usage: pig [options] <dir>

Options:

    -h, --help                  output usage information
    -d, --dest <path>           File or directory path of target file
    -b, --bower-path <path>     Path to bower_components directory
    -n, --name <name>           Iconset name, if omitted, directory name will be used
    -s, --size <size>           Icon size
    -p, --prefix <prefix>       Prefix to be added to file names for icon names
    -o, --omit-prefix <prefix>  Common filename prefix to be omitted from icon name
    -c, --clean                 Wheather to clean the svg code via svgo
    -m, --minify                Wheather to minimize the svg code via svgo. (only works with --minimize)
    -1, --monochrome            Remove fill, stroke and class attributes as well as style elements
    --comment <comment>         Comment to add to the generated iconset file
    --split                     Split mode. Generate svg files from iconset file
    --demo                      Generate Martins-MacBook:padlock-cloud martin
```

### As a node module

Install locally, then import, same as with any other module.

```sh
npm install --save polymer-iconset-generator
```

```js
var pig = require('polymer-iconset-generator');

// Second argument takes the same options as cli (dash-separated options are converted to camel-case)
pig('some/path', {
    dest: 'target/file.html',
    name: 'my-icon-set',
    size: 200,
    omitPrefix: 'icon-'
}).then(function() {
    console.log("done!");
});
```
