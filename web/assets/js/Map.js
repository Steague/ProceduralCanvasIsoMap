var Map = function(project) {
    console.log("Init: Map");

    this.project      = project;
    this.canvas       = project.canvas;
    this.context      = this.canvas.getContext("2d");
    this.tiles        = [];
    this.tileHash     = {};
    this.zoom         = 1;
    this.tileWidth    = 64 * (1 / this.zoom);
    this.tileHeight   = this.tileWidth / 2;
    this.dragOffsetX  = 0;
    this.dragOffsetY  = 0;
    this.screenWidth  = project.canvas.width;
    this.screenHeight = project.canvas.height;
    this.regionSize   = 35 * this.zoom;
    this.cameraX      = (this.screenWidth/2);// + (this.tileWidth / 2);
    this.cameraY      = (this.screenHeight/2) - (this.tileHeight * 7.5);
    
    this.addEventListeners();

    if (this.tiles.length === 0) {
        var self = this;
        this.project.appendToQueue("initLoadRegions", function() {
            self.loadRegions(0, 0);
        });
    }
};

Map.prototype.zoomOut = function(end, centerX, centerY) {
    if (this.zoom < end) {
        this.setZoom(this.zoom + 0.1, centerX, centerY);
        var self = this;
        this.project.appendToQueue("zoomUpdate", function() {
            self.zoomOut(end, centerX, centerY);
        });
    }
};

Map.prototype.zoomIn = function(end, centerX, centerY) {
    if (this.zoom > end) {
        this.setZoom(this.zoom - 0.1, centerX, centerY);
        var self = this;
        this.project.appendToQueue("zoomUpdate", function() {
            self.zoomIn(end, centerX, centerY);
        });
    }
};

Map.prototype.setZoom = function(zoom, centerX, centerY) {
    //centerX = (this.screenWidth / 2);
    //centerY = (this.screenHeight / 2);

    var newImageX = ((centerX - this.cameraX) * (zoom / this.zoom)),
        newImageY = ((centerY - this.cameraY) * (zoom / this.zoom));

    this.zoom       = zoom;
    this.tileWidth  = (64 * (1 / this.zoom)) ;
    this.tileHeight = this.tileWidth / 2;
    this.regionSize = 35 * this.zoom;
    this.cameraX    = this.cameraX + (newImageX - (centerX - this.cameraX));
    this.cameraY    = this.cameraY + (newImageY - (centerY - this.cameraY));

    var self = this;
    this.project.appendToQueue("draw", function() {
        self.draw();
    });
};

Map.prototype.sortMap = function (a, b) {
    if (a.x > b.x){
        return 1;
    } else if (a.x < b.x) {
        return -1;
    } else {
        if (a.y > b.y) {
            return 1;
        } else {
            return -1;
        }
    }
};

Map.prototype.draw = function() {
    //console.log("Func: Map::draw", Object.getOwnPropertyNames(this.tiles).length);
    this.clearCanvas();

    var tile;
    for (var t in this.tiles) {
        tile = this.tiles[t];
        this.updateTileHash(tile.x, tile.y, t);
        this.drawTile(tile);
    }

    //this.drawViewer();
    //this.drawCrosshair();
};

Map.prototype.addEventListeners = function() {
    var self    = this;
    var flag    = 0;
    var element = this.canvas;
    var downX, downY;
    var clickEvent, mouseDownEvent, mouseMoveEvent, mouseUpEvent, mouseOutEvent, mouseWheelEvent;

    mouseWheelEvent = element.addEventListener("wheel", function(target) {
        target.preventDefault();
        if (target.wheelDelta < -2) {
            self.zoomOut(Math.min(self.zoom + 0.05, 2), target.x, target.y);
        } else if (target.wheelDelta > 2) {
            self.zoomIn(Math.max(self.zoom - 0.05, 1), target.x, target.y);
        }
    }, false);

    mouseDownEvent = element.addEventListener("mousedown", function(target){
        flag = 1;
        downX = target.clientX;
        downY = target.clientY;
    }, false);

    mouseUpEvent = element.addEventListener("mouseup", function(target){
        if(flag === 2){
            self.dragged();
        } else {
            self.clicked(target.clientX, target.clientY);
        }
        flag = 0;
    }, false);

    mouseMoveEvent = element.addEventListener("mousemove", function(target){
        if (flag === 1) {
            if (Math.abs(target.clientX - downX) + Math.abs(target.clientY - downY) >= 5) {
                flag = 2;
                //console.log("stated dragging now!");
            }
        }

        if (flag === 2) {
            //console.log(Math.abs(target.clientX - downX) + Math.abs(target.clientY - downY), self.screenWidth / 2);
            if (Math.abs(target.clientX - downX) + Math.abs(target.clientY - downY) >= (self.screenWidth / 2) * (1 / self.zoom)) {
                self.project.appendToQueue("loadRegions", function() {
                    console.log("dragged a bunch, get new regions", (self.screenWidth / 2) * (1 / self.zoom));
                    self.loadRegions();
                });
                downX = target.clientX;
                downY = target.clientY;

                self.cameraX += self.dragOffsetX;
                self.cameraY += self.dragOffsetY;
            }

            self.dragOffsetX = (target.clientX - downX);
            self.dragOffsetY = (target.clientY - downY);
            // self.project.appendToQueue("loadRegions", function() {
            //     self.loadRegions();
            // });
            self.project.appendToQueue("draw", function() {
                self.draw();
            });
        }
    }, false);

    mouseOutEvent = element.addEventListener("mouseout", function(target){
        if(flag === 2){
            self.dragged();
        }
        flag = 0;
    }, false);
};

Map.prototype.dragged = function() {
    this.cameraX += this.dragOffsetX;
    this.cameraY += this.dragOffsetY;

    this.dragOffsetX = 0;
    this.dragOffsetY = 0;   
};

Map.prototype.clicked = function(screenX, screenY) {
    screenX -= this.cameraX;
    screenY -= this.cameraY;
    var halfTileWidth = (this.tileWidth / 2);
    var halfTileHeight = (this.tileHeight / 2);
    var mapX = Math.floor((screenX / halfTileWidth + screenY / halfTileHeight) / 2);
    var mapY = Math.floor((screenY / halfTileHeight - screenX / halfTileWidth) / 2);
    //console.log("Clicked map on tile:", mapX, mapY);

    return {
        x: mapX,
        y: mapY
    };
};

Map.prototype.addTile = function(tile) {
    //console.log("Func: Map::addTile");
    if (this.getTileById(tile.x, tile.y) !== null) {
        return;
    }
    this.updateTileHash(tile.x, tile.y, (this.tiles.push(tile) - 1));
    //this.tileHash[tile.x+":"+tile.y] = (this.tiles.push(tile) - 1);
};

Map.prototype.clearCanvas = function() {
    this.context.clearRect(0, 0, this.screenWidth, this.screenHeight);
};

Map.prototype.drawTile = function(tile) {
    //console.log("Func: Map::drawTile", tile);

    var screenX = ((tile.x - tile.y) * (this.tileWidth / 2)) + this.cameraX + this.dragOffsetX;
    var screenY = ((tile.x + tile.y) * (this.tileHeight / 2)) + this.cameraY + this.dragOffsetY;

    if (screenX < (0 - (this.tileWidth * this.zoom) + (this.tileWidth / 2)) ||
        screenX >= (this.screenWidth + ((this.tileWidth * 2) * (1 / this.zoom))) ||
        screenY < (0 - (this.tileHeight * this.zoom) - (this.tileHeight)) ||
        screenY >= this.screenHeight + ((this.tileHeight * this.zoom) + (tile.get("image").height * (1 / this.zoom)))) {
        return;
    }

    // if (screenX < (0 + (this.tileWidth * this.zoom) - (this.tileWidth / 2)) ||
    //     screenX >= (this.screenWidth - ((this.tileWidth * (1 / this.zoom)) / 2)) ||
    //     screenY < (0 + (this.tileHeight * this.zoom) - (this.tileHeight)) ||
    //     screenY >= this.screenHeight - ((this.tileHeight * this.zoom) - (tile.attr.image.height * (1 / this.zoom)))) {
    //     return;
    // }

    this.context.drawImage(
        tile.get("image"),
        0,
        0,
        tile.get("image").width,
        tile.get("image").height,
        screenX - (this.tileWidth / 2),
        screenY - (52 * (1 / this.zoom)),
        tile.get("image").width * (1 / this.zoom),
        tile.get("image").height * (1 / this.zoom)
    );

    // this.context.beginPath();
    // this.context.moveTo(screenX + (this.tileWidth / 2), screenY + (this.tileHeight / 2));
    // this.context.lineTo(screenX, screenY);
    // this.context.lineTo(screenX - (this.tileWidth / 2), screenY + (this.tileHeight / 2));
    // this.context.lineTo(screenX, screenY);
    // this.context.closePath();
    // this.context.stroke();

    // this.context.beginPath();
    // this.context.moveTo(screenX + (this.tileWidth / 2), screenY + (this.tileHeight / 2));
    // this.context.lineTo(screenX, screenY + this.tileHeight);
    // this.context.lineTo(screenX - (this.tileWidth / 2), screenY + (this.tileHeight / 2));
    // this.context.lineTo(screenX, screenY + this.tileHeight);
    // this.context.closePath();
    // this.context.stroke();

    // this.context.font = "8px Arial";
    // this.context.fillStyle = "#000";
    // this.context.textAlign = "center";
    // this.context.fillText("("+tile.x+","+tile.y+")", screenX, screenY+10);
};

 Map.prototype.drawCrosshair = function() {
    this.context.beginPath();
    this.context.moveTo(this.screenWidth / 2, 0);
    this.context.lineTo(this.screenWidth / 2, this.screenHeight);
    this.context.closePath();
    this.context.stroke();

    this.context.beginPath();
    this.context.moveTo(0, this.screenHeight / 2);
    this.context.lineTo(this.screenWidth, this.screenHeight / 2);
    this.context.closePath();
    this.context.stroke();
 };

Map.prototype.drawViewer = function() {
    this.context.beginPath();
    this.context.moveTo(this.tileWidth * this.zoom, this.tileHeight * this.zoom);
    this.context.lineTo(this.screenWidth-(this.tileWidth * this.zoom), this.tileHeight * this.zoom);
    this.context.lineTo(this.screenWidth-(this.tileWidth * this.zoom), this.screenHeight-(this.tileHeight * this.zoom));
    this.context.lineTo(this.tileWidth * this.zoom, this.screenHeight-(this.tileHeight * this.zoom));
    this.context.closePath();
    this.context.stroke();
};

Map.prototype.updateTileHash = function(x, y, tileIndex) {
    if (this.tileHash[x+":"+y] != tileIndex) {
        return this.tileHash[x+":"+y] = tileIndex;
    }
}

Map.prototype.getTileById = function(x, y) {
    // var tile;
    // for (var t in this.tiles) {
    //     tile = this.tiles[t];
    //     if (tile.x == x &&
    //         tile.y == y) {
    //         return tile;
    //     }
    // }

    // return null;

    if (!this.tileHash.hasOwnProperty(x+":"+y)) {
        return null;
    }

    var tileIndex = this.tileHash[x+":"+y];
    
    return this.tiles[tileIndex] || null;
};

Map.prototype.getTileIdByCoords = function(x, y) {
    // var tile;
    // for (var t in this.tiles) {
    //     tile = this.tiles[t];
    //     if (tile.x == x &&
    //         tile.y == y) {
    //         return t;
    //     }
    // }

    // return null;

    if (!this.tileHash.hasOwnProperty(x+":"+y)) {
        return null;
    }

    var tileIndex = this.tileHash[x+":"+y];
    
    return tileIndex || null;
};

Map.prototype.createStartZone = function() {
    var startZoneCoords = [];
    var tile, image;
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            tileId = this.getTileIdByCoords((i+5),(j+5));
            image = new Image();
            image.src = 'img/basic1.png';
            if (i == 2 && j == 2) {
                image.src = "img/house1.png";
            } else if (i > 2 && j == 2) {
                image.src = "img/path_ew.png";
            }
            image.width = '64';
            image.height = '100';
            this.tiles[tileId].set("image", image);
        }
    }
};

Map.prototype.loadRegions = function(defaultX, defaultY) {
    // Find the region(s) that should be on the screen
    var clickedTileCoords = this.clicked(this.screenWidth/2, this.screenHeight/2);
    var regionCoords = (defaultX !== undefined && defaultY !== undefined ? { x: defaultX, y: defaultY } : this.tileCoordsToRegion(clickedTileCoords.x, clickedTileCoords.y));

    // Generate regions that are not already generated

    // //this.destroyRegion(regionCoords.x-2, regionCoords.y-2);
    // this.destroyRegion(regionCoords.x-2, regionCoords.y-1);
    // this.destroyRegion(regionCoords.x-2, regionCoords.y);
    // this.destroyRegion(regionCoords.x-2, regionCoords.y+1);
    // //this.destroyRegion(regionCoords.x-2, regionCoords.y+2);
    // this.destroyRegion(regionCoords.x-1, regionCoords.y-2);
    // this.destroyRegion(regionCoords.x-1, regionCoords.y+2);
    // this.destroyRegion(regionCoords.x, regionCoords.y-2);
    // this.destroyRegion(regionCoords.x, regionCoords.y+2);
    // this.destroyRegion(regionCoords.x+1, regionCoords.y-2);
    // this.destroyRegion(regionCoords.x+1, regionCoords.y+2);
    // //this.destroyRegion(regionCoords.x+2, regionCoords.y-2);
    // this.destroyRegion(regionCoords.x+2, regionCoords.y-1);
    // this.destroyRegion(regionCoords.x+2, regionCoords.y);
    // this.destroyRegion(regionCoords.x+2, regionCoords.y+1);
    // //this.destroyRegion(regionCoords.x+2, regionCoords.y+2);
    
    var regionLoaded = false;

    if (this.generateRegion(regionCoords.x-1, regionCoords.y-1) == true) { regionLoaded = true; } // 0,0
    if (this.generateRegion(regionCoords.x-1, regionCoords.y)   == true) { regionLoaded = true; } // 0,1
    if (this.generateRegion(regionCoords.x-1, regionCoords.y+1) == true) { regionLoaded = true; } // 0,2
    if (this.generateRegion(regionCoords.x,   regionCoords.y-1) == true) { regionLoaded = true; } // 1,0
    if (this.generateRegion(regionCoords.x,   regionCoords.y)   == true) { regionLoaded = true; } // 1,1
    if (this.generateRegion(regionCoords.x,   regionCoords.y+1) == true) { regionLoaded = true; } // 1,2
    if (this.generateRegion(regionCoords.x+1, regionCoords.y-1) == true) { regionLoaded = true; } // 2,0
    if (this.generateRegion(regionCoords.x+1, regionCoords.y)   == true) { regionLoaded = true; } // 2,1
    if (this.generateRegion(regionCoords.x+1, regionCoords.y+1) == true) { regionLoaded = true; } // 2,2

    if (regionLoaded === true) {
        var self = this;
        this.project.appendToQueue("sort", function() {
            self.tiles = self.tiles.sort(self.sortMap);
        });
    }

    console.log("Tiles in memory",this.tiles.length);

    var regionQuadrant = this.regionQuadrant(clickedTileCoords.x, clickedTileCoords.y);

    //console.log("Quadrant IS", regionQuadrant);

    // Unload regions that should be out of the viewport

    if (defaultX === 0 &&
        defaultY === 0) {
        // var self = this;
        // setTimeout(function() { self.createStartZone(); self.draw(); }, 100);
        //console.log("Finished loadRegions");
    }
};

Map.prototype.regionQuadrant = function(x, y) {
    var region = this.tileCoordsToRegion(x, y);

    // am I in the N/W or E/S?
    //console.log(x, (this.regionSize * (region.x + 1)) / 2);
    // if (x <= (this.regionSize * (region.x + 1)) / 2) {
    //  console.log("I am in the NW", x, (this.regionSize * (region.x + 1)) / 2);
    // } else {
    //  console.log("I am in the ES", x, (this.regionSize * (region.x + 1)) / 2);
    // }
};

Map.prototype.regionExists = function(x, y) {
    var tileX = this.regionSize * x;
    var tileY = this.regionSize * y;

    return (this.getTileById(tileX, tileY) !== null ? true : false);
};

Map.prototype.tileCoordsToRegion = function(x, y) {
    var regionX = Math.floor(x / this.regionSize);
    var regionY = Math.floor(y / this.regionSize);

    return {
        x: regionX,
        y: regionY
    };
};

Map.prototype.destroyRegion = function(regionX, regionY) {
    var maxX = this.regionSize * (regionX + 1);
    var maxY = this.regionSize * (regionY + 1);
    // TODO: figure this bit out
};

Map.prototype.generateRegion = function(regionX, regionY) {
    var regionExists = this.regionExists(regionX, regionY);
    if (regionExists !== false) {
        return false;
    }

    var maxX = this.regionSize * (regionX + 1);
    var maxY = this.regionSize * (regionY + 1);

    var tile, image;
    for (var i = this.regionSize * regionX; i < maxX; i++) {
        for (var j = this.regionSize * regionY; j < maxY; j++) {
            image = new Image();
            image.src = 'img/trees'+Math.ceil(Math.random()*18)+'.png';
            image.width = '64';
            image.height = '100';
            tile = new Tile(i,j, {
                color : '#070',
                type  : 'trees',
                image : image
            });
            this.addTile(tile);
        }
    }

    return true;
};

Map.prototype.pickRandomNeighbor = function(obj) {
    var result;
    var count = 0;
    for (var prop in obj) {
        if (Math.random() < 1/++count) {
           result = prop;
        }
    }
    return result;
}

Map.prototype.findNeighbors = function(tile) {
    var neighbors = {};

    if (this.tiles[((tile.x-1)+":"+(tile.y)).hashCode()]) {
        neighbors["NW"] = (this.tiles[((tile.x-1)+":"+(tile.y)).hashCode()]);
    }
    if (this.tiles[((tile.x+1)+":"+(tile.y)).hashCode()]) {
        neighbors["SW"] = (this.tiles[((tile.x+1)+":"+(tile.y)).hashCode()]);
    }
    if (this.tiles[((tile.x)+":"+(tile.y-1)).hashCode()]) {
        neighbors["NE"] = (this.tiles[((tile.x)+":"+(tile.y-1)).hashCode()]);
    }
    if (this.tiles[((tile.x)+":"+(tile.y+1)).hashCode()]) {
        neighbors["SE"] = (this.tiles[((tile.x)+":"+(tile.y+1)).hashCode()]);
    }

    return neighbors;
};