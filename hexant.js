'use strict';

var HexAntWorld = require('./world.js');
var Ant = require('./ant.js');
var Hash = require('./hash.js');
var OddQOffset = require('./coord.js').OddQOffset;
var HexTileTree = require('./hextiletree.js');

var BatchLimit = 256;

var RulesLegend = 'W=West, L=Left, A=Ahead, R=Right, E=East, F=Flip';
var Rules = {
    W: -2,
    L: -1,
    A: 0,
    R: 1,
    E: 2,
    F: 3
};

function Hexant() {
    var self = this;
    self.animator = null;
}

Hexant.prototype.add = function (component, id) {
    var self = this;
    if (id === 'view') {
        self.setup(component);
    }
};

Hexant.prototype.setup = function setup(el) {
    var self = this;
    var scope = self.scope;
    var window = scope.window;
    var document = window.document;

    var hash = new Hash(window);
    var paused = true;
    var lastFrameTime = null;
    var frameRate = 0;
    var frameInterval = 0;

    var hexant = new HexAntWorld(el);
    var ant = new Ant(hexant);
    ant.pos = hexant.tile.centerPoint().toCube();
    hash.set('rule', parseRule(ant, hash.get('rule', 'LR')));
    hexant.addAnt(ant);

    el.addEventListener('click', playpause);
    window.hexant = hexant;
    window.addEventListener('keypress', onKeyPress);

    self.animate = tick;
    self.animator = scope.animator.add(self);

    setFrameRate(hash.get('frameRate', 4));
    hexant.setLabeled(hash.get('labeled', false));

    hexant.defaultCellValue = hash.get('drawUnvisited', false) ? 1 : 0;

    function onKeyPress(e) {
        switch (e.keyCode) {
        case 0x20: // <Space>
            playpause();
            break;
        case 0x23: // #
            toggleLabeled();
            break;
        case 0x2a: // *
            console.log(hexant.tile.dump());
            break;
        case 0x2b: // +
            setFrameRate(frameRate * 2);
            hash.set('frameRate', frameRate);
            break;
        case 0x2d: // -
            setFrameRate(Math.max(1, Math.floor(frameRate / 2)));
            hash.set('frameRate', frameRate);
            break;
        case 0x2e: // .
            stepit();
            break;
        case 0x2f: // /
            pause();
            var rule = hash.get('rule');
            rule = prompt('New Rules: (' + RulesLegend + ')', rule).toUpperCase();
            hash.set('rule', parseRule(ant, rule));
            hexant.updateAntColors();
            reset();
            break;
        }
    }

    function toggleLabeled() {
        hexant.setLabeled(!hexant.labeled);
        hexant.redraw();
        hash.set('labeled', hexant.labeled);
    }

    function stepit() {
        if (paused) {
            hexant.stepDraw();
        } else {
            pause();
        }
    }

    function setFrameRate(rate) {
        frameRate = rate;
        frameInterval = 1000 / frameRate;
    }

    function play() {
        lastFrameTime = null;
        paused = false;
        self.animator.requestAnimation();
    }

    function reset() {
        hexant.tile = new HexTileTree(OddQOffset(0, 0), 2, 2);
        hexant.hexGrid.bounds = hexant.tile.boundingBox().copy();
        ant.dir = 0;
        ant.pos = hexant.tile.centerPoint().toCube();
        hexant.tile.set(ant.pos, 1);
        el.width = el.width;
        hexant.hexGrid.updateSize();
        hexant.redraw();
    }

    function pause() {
        self.animator.cancelAnimation();
        lastFrameTime = null;
        paused = true;
    }

    function playpause() {
        if (paused) {
            play();
        } else {
            pause();
        }
    }

    function tick(time) {
        var frames = 1;
        if (!lastFrameTime) {
            lastFrameTime = time;
        } else {
            var progress = time - lastFrameTime;
            frames = Math.min(BatchLimit, progress / frameInterval);
        }

        for (var i = 0; i < frames; i++) {
            lastFrameTime += frameInterval;
            var err = step();
            if (err) {
                pause();
                throw err;
            }
        }
    }

    function step() {
        try {
            hexant.stepDraw();
            return null;
        } catch(err) {
            return err;
        }
    }

    window.addEventListener('resize', onResize);
    onResize();

    function onResize() {
        var width = Math.max(
            document.documentElement.clientWidth,
            window.innerWidth || 0);
        var height = Math.max(
            document.documentElement.clientHeight,
            window.innerHeight || 0);
        hexant.resize(width, height);
    }

}

function parseRule(ant, rule) {
    var rerule = '';
    ant.rules = rule
        .split('')
        .map(function each(part) {
            var r = Rules[part];
            if (r !== undefined) {
                rerule += part;
            }
            return r;
        })
        .filter(function truthy(part) {
            return typeof(part) === 'number';
        })
        ;
    return rerule;
}

module.exports = Hexant;