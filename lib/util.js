/**
 * Shallow merges `src` into `obj`
 * @param {object} obj - target object
 * @param {object} src - source object
 * @return {object} - the target object
 */
function extend(obj, src, overwrite) {
    Object.keys(src).forEach(function(key) {
        if (overwrite || obj[key] === undefined) {
            obj[key] = src[key];
        }
    });
    return obj;
}

/**
 * Detects a common prefix in an array of strings
 * @param {string[]} strings
 * @return {string}
 */
function detectCommonPrefix(strings) {
    if (strings.length < 2) {
        return "";
    }
    var sorted = strings.concat().sort();
    var first = sorted[0];
    var last = sorted[sorted.length-1];
    var l = first.length;
    var i= 0;

    while (i<l && first.charAt(i) === last.charAt(i)) {
        i++;
    }
    return first.substring(0, i);
}

module.exports = {
    extend: extend,
    detectCommonPrefix: detectCommonPrefix
};
