'use strict';

var lagSample = [];
var lagD1Sample = [];
var lagD2Sample = [];

function recordLag(lag) {
    if (lag <= frameInterval) {
        lagSample = [];
        lagD1Sample = [];
        lagD2Sample = [];
        return false;
    }

    var lastLag = addSample(lagSample, 11, lag);
    if (isNaN(lastLag)) {
        return false;
    }

    var delta = lag - lastLag;
    var lastDelta = addSample(lagD1Sample, 10, delta);
    if (isNaN(lastDelta)) {
        return false;
    }
    addSample(lagD2Sample, 9, delta - lastDelta);

    if (lagD2Sample.length < 9) {
        return false;
    }

    var n = 0;
    for (var i = 0; i < lagD2Sample.length; i++) {
        if (lagD2Sample[i] > 0) {
            n++;
        }
    }

    var p = n / lagD2Sample.length;
    return p > 0.6;
}

function addSample(sample, limit, value) {
    var last = sample[sample.length - 1];
    sample.push(value);
    while (sample.length > limit) {
        sample.shift();
    }
    return last || NaN;
}

// if (recordLag(progress - frameInterval)) {
//     lagEl.innerText = 'lag:\n' +
//     lagD2Sample
//         .map(function roundEm(n) {
//             return Math.round(n);
//         })
//         .toString();
//     slowdown();
//     // pause();
//     return;
// }
