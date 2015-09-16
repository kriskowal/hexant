'use strict';

var gens = {};
module.exports.gens = gens;
module.exports.parse = parse;
module.exports.toString = toString;

function parse(str) {
    var match = /^(\w+)(?:\((.+)\))?$/.exec(str);
    if (!match) {
        return HueWheelGenerator;
    }

    var name = match[1];
    var gen = gens[name];
    if (!gen) {
        return HueWheelGenerator;
    }

    var args = match[2] ? match[2].split(/, */) : [];
    if (args) {
        /* eslint no-try-catch: [0] */
        try {
            return gen.apply(null, args);
        } catch(e) {
            return HueWheelGenerator;
        }
    }

    return gen;
}

function toString(gen) {
    return gen.genString || 'hue';
}

gens.light = LightWheelGenerator;
gens.hue = HueWheelGenerator;

// TODO: husl too

function LightWheelGenerator(hue) {
    hue = parseInt(hue, 10) || 0;

    wheelGenGen.genString = 'light(' + hue.toString() + ')';
    return wheelGenGen;

    function wheelGenGen(intensity) {
        var h = hue * (1 + (intensity - 1) / 3);
        var sh = h.toString();
        var prefix = 'hsl(' + sh + ', 65%, ';
        var suffix = ')';
        return function wheelGen(ncolors) {
            var step = 100 / (ncolors + 1);
            var r = [];
            var l = step;
            for (var i = 0; i < ncolors; l += step, i++) {
                var sl = l.toFixed(1) + '%';
                r.push(prefix + sl + suffix);
            }
            return r;
        };
    }
}

function HueWheelGenerator() {
    hueWheelGenGen.genString = 'hue';

    return hueWheelGenGen;

    function hueWheelGenGen(intensity) {
        var ss = (65 + 10 * intensity).toFixed(1) + '%';
        var sl = (30 + 10 * intensity).toFixed(1) + '%';

        var suffix = ', ' + ss + ', ' + sl + ')';
        return function wheelGen(ncolors) {
            var scale = 360 / ncolors;
            var r = [];
            for (var i = 0; i < ncolors; i++) {
                var sh = Math.floor(i * scale).toString();
                r.push('hsl(' + sh + suffix);
            }
            return r;
        };
    }
}
