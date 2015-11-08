var MapObject = function(x, y, data) {
    this.x    = x;
    this.y    = y;
    this.attr = data;

    this.set("facing", 180);
};

MapObject.prototype.set = function(key, value) {
    this.attr[key] = value;
};

MapObject.prototype.get = function(key) {
    return this.attr[key];
};

MapObject.prototype.moveTo = function(tileX, tileY) {
    // where am I now?
    //this.x and this.y

    // what direction am I facing?
    var facing = this.get("facing");

    // what direction do I need to face?

    // turn to face correct direction

    // when facing correct direction, move "velocity" towards end tile.
};