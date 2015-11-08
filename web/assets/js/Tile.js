var Tile = function (x, y, data) {
    //console.log("Init: Tile", x, y, data);

    this.x    = x;
    this.y    = y;
    this.attr = data;
};

Tile.prototype.set = function(key, value) {
    this.attr[key] = value;
};

Tile.prototype.get = function(key) {
    return this.attr[key];
};