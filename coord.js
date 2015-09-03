'use strict';

/* eslint no-inline-comments:0 */

module.exports.ScreenPoint = ScreenPoint;
module.exports.CubePoint = CubePoint;
module.exports.OddQOffset = OddQOffset;
module.exports.OddQBox = OddQBox;

function ScreenPoint(x, y) {
    if (!(this instanceof ScreenPoint)) {
        return new ScreenPoint(x, y);
    }
    this.x = x;
    this.y = y;
}
ScreenPoint.prototype.type = 'point.screen';
ScreenPoint.prototype.toString = function toString() {
    return 'ScreenPoint(' + this.x + ', ' + this.y + ')';
};
ScreenPoint.prototype.toScreen = function toScreen() {
    return this;
};

function CubePoint(x, y, z) {
    if (!(this instanceof CubePoint)) {
        return new CubePoint(x, y, z);
    }
    if (x + y + z !== 0) {
        // TODO: assert
        throw new Error(
            'CubePoint invariant violated: ' +
            x + ' + ' +
            y + ' + ' +
            z + ' = ' +
            (x + y + z));
    }
    this.x = x;
    this.y = y;
    this.z = z;
}
CubePoint.basis = [
    CubePoint(1, -1, 0), // SE -- 0, 1
    CubePoint(0, -1, 1), // S  -- 1, 2
    CubePoint(-1, 0, 1), // SW -- 2, 3
    CubePoint(-1, 1, 0), // NW -- 3, 4
    CubePoint(0, 1, -1), // N  -- 4, 5
    CubePoint(1, 0, -1)  // NE -- 5, 0
];
CubePoint.prototype.type = 'point.cube';
CubePoint.prototype.toString = function toString() {
    return 'CubePoint(' + this.x + ', ' + this.y + ', ' + this.z + ')';
};
CubePoint.prototype.copy = function copy() {
    return CubePoint(this.x, this.y, this.z);
};
CubePoint.prototype.add = function add(other) {
    if (other.type !== this.type) {
        other = other.toCube();
    }
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
};
CubePoint.prototype.sub = function sub(other) {
    if (other.type !== this.type) {
        other = other.toCube();
    }
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
};
CubePoint.prototype.toScreen = function toScreen() {
    // TODO: verify
    var screenX = 3 / 2 * this.x;
    var screenY = Math.sqrt(3) * (this.z + this.x / 2);
    return ScreenPoint(screenX, screenY);
};
CubePoint.prototype.toCube = function toCube() {
    return this;
};
CubePoint.prototype.toOddQOffset = function toOddQOffset() {
    var q = this.x;
    var r = this.z + (this.x - (this.x & 1)) / 2;
    return OddQOffset(q, r);
};

function OddQOffset(q, r) {
    if (!(this instanceof OddQOffset)) {
        return new OddQOffset(q, r);
    }
    this.q = q;
    this.r = r;
}
OddQOffset.prototype.type = 'offset.odd-q';
OddQOffset.prototype.toString = function toString() {
    return 'OddQOffset(' + this.q + ', ' + this.r + ')';
};
OddQOffset.prototype.copy = function copy() {
    return OddQOffset(this.q, this.r);
};
OddQOffset.prototype.add = function add(other) {
    if (other.type !== this.type) {
        other = other.toOddQOffset();
    }
    this.q += other.q;
    this.r += other.r;
    return this;
};
OddQOffset.prototype.sub = function sub(other) {
    if (other.type !== this.type) {
        other = other.toOddQOffset();
    }
    this.q -= other.q;
    this.r -= other.r;
    return this;
};
OddQOffset.prototype.mulBy = function mulBy(q, r) {
    this.q *= q;
    this.r *= r;
    return this;
};
OddQOffset.prototype.toScreen = function toScreen() {
    var x = 3 / 2 * this.q;
    var y = Math.sqrt(3) * (this.r + 0.5 * (this.q & 1));
    return ScreenPoint(x, y);
};
OddQOffset.prototype.toOddQOffset = function toOddQOffset() {
    return this;
};
OddQOffset.prototype.toCube = function toCube() {
    var x = this.q;
    var z = this.r - (this.q - (this.q & 1)) / 2;
    var y = -x - z;
    return CubePoint(x, y, z);
};

function OddQBox(topLeft, bottomRight) {
    if (!(this instanceof OddQBox)) {
        return new OddQBox(topLeft, bottomRight);
    }
    this.topLeft = topLeft.toOddQOffset();
    this.bottomRight = bottomRight.toOddQOffset();
}

OddQBox.prototype.toString = function toString() {
    return 'OddQBox(' +
        this.topLeft.toString() + ', ' +
        this.bottomRight.toString() + ')';
};

OddQBox.prototype.screenCount = function screenCount(pointArg) {
    var W = this.bottomRight.q - this.topLeft.q;
    var H = this.bottomRight.r - this.topLeft.r;

    // return the count number of hexes needed in screen x space and screen y
    // space

    // first one is a unit, each successive column backs 1/4 with the last
    // var x = 1 + 3 / 4 * (W - 1);
    var x = (3 * W + 1) / 4;

    // height backs directly, but we need an extra half cell except when we
    // have only one column
    var y = H + (W > 1 ? 0.5 : 0);

    return ScreenPoint(x, y);
};

OddQBox.prototype.contains = function contains(pointArg) {
    var point = pointArg.toOddQOffset();
    return point.q >= this.topLeft.q && point.q < this.bottomRight.q &&
           point.r >= this.topLeft.r && point.r < this.bottomRight.r;
};

/*

 * var directions = [
 *    Hex(+1,  0), Hex(+1, -1), Hex( 0, -1),
 *    Hex(-1,  0), Hex(-1, +1), Hex( 0, +1)
 * ]
 *
 * function hex_direction(direction):
 *     return directions[direction]
 *
 * function hex_neighbor(hex, direction):
 *     var dir = hex_direction(direction)
 *     return Hex(hex.q + dir.q, hex.r + dir.r)

 * // odd-r
 * var directions = [
 *   [ Hex(+1,  0), Hex( 0, -1), Hex(-1, -1),
 *     Hex(-1,  0), Hex(-1, +1), Hex( 0, +1) ],
 *   [ Hex(+1,  0), Hex(+1, -1), Hex( 0, -1),
 *     Hex(-1,  0), Hex( 0, +1), Hex(+1, +1) ]
 * ]
 *
 * function offset_neighbor(hex, direction):
 *     var parity = hex.row & 1
 *     var dir = directions[parity][direction]
 *     return Hex(hex.col + dir.col, hex.row + dir.row)

 * // odd-q
 * var directions = [
 *   [ Hex(+1,  0), Hex(+1, -1), Hex( 0, -1),
 *     Hex(-1, -1), Hex(-1,  0), Hex( 0, +1) ],
 *   [ Hex(+1, +1), Hex(+1,  0), Hex( 0, -1),
 *     Hex(-1,  0), Hex(-1, +1), Hex( 0, +1) ]
 * ]
 *
 * function offset_neighbor(hex, direction):
 *     var parity = hex.col & 1
 *     var dir = directions[parity][direction]
 *     return Hex(hex.col + dir.col, hex.row + dir.row)

 * var diagonals = [
 *     Cube(+2, -1, -1), Cube(+1, +1, -2), Cube(-1, +2, -1),
 *     Cube(-2, +1, +1), Cube(-1, -1, +2), Cube(+1, -2, +1)
 * ]
 *
 * function cube_diagonal_neighbor(hex, direction):
 *     return cube_add(hex, diagonals[direction])

 * function cube_distance(a, b):
 *     return (abs(a.x - b.x) + abs(a.y - b.y) + abs(a.z - b.z)) / 2
 *
 * // An equivalent way to write this is by noting that one of the three
 * // coordinates must be the sum of the other two, then picking that one as the
 * // distance. You may prefer the “divide by two” form above, or the “max” form
 * // here, but they give the same result:
 *
 * function cube_distance(a, b):
 *     return max(abs(a.x - b.x), abs(a.y - b.y), abs(a.z - b.z))

 * function hex_distance(a, b):
 *     var ac = hex_to_cube(a)
 *     var bc = hex_to_cube(b)
 *     return cube_distance(ac, bc)
 *
 * // If your compiler inlines hex_to_cube and cube_distance, it will generate
 * // this code:
 *
 * function hex_distance(a, b):
 *     return ( abs(a.q - b.q)
 *              + abs(a.q + a.r - b.q - b.r)
 *              + abs(a.r - b.r)) / 2

 * function cube_lerp(a, b, t):
 *     return Cube(
 *         a.x + (b.x - a.x) * t,
 *         a.y + (b.y - a.y) * t,
 *         a.z + (b.z - a.z) * t)
 *
 * function cube_linedraw(a, b):
 *     var N = cube_distance(a, b)
 *     var results = []
 *     for each 0 ≤ i ≤ N:
 *         results.append(cube_round(cube_lerp(a, b, 1.0/N * i)))
 *     return results

 * # convert cube to even-q offset
 * col = x
 * row = z + (x + (x&1)) / 2
 *
 * # convert even-q offset to cube
 * x = col
 * z = row - (col + (col&1)) / 2
 * y = -x-z
 *
 * # convert cube to odd-q offset
 * col = x
 * row = z + (x - (x&1)) / 2
 *
 * # convert odd-q offset to cube
 * x = col
 * z = row - (col - (col&1)) / 2
 * y = -x-z
 *
 * # convert cube to even-r offset
 * col = x + (z + (z&1)) / 2
 * row = z
 *
 * # convert even-r offset to cube
 * x = col - (row + (row&1)) / 2
 * z = row
 * y = -x-z
 *
 * # convert cube to odd-r offset
 * col = x + (z - (z&1)) / 2
 * row = z
 *
 * # convert odd-r offset to cube
 * x = col - (row - (row&1)) / 2
 * z = row
 * y = -x-z
 */
