<html>
	<head>
	</head>
	<body>
		<canvas id="myCanvas" width="800" height="600" style="border:1px solid #000000;"></canvas>

		<script type="text/javascript">
			String.prototype.hashCode = function() {
				var hash = 0, i, chr, len;
				if (this.length == 0) return hash;
				for (i = 0, len = this.length; i < len; i++) {
					chr   = this.charCodeAt(i);
					hash  = ((hash << 5) - hash) + chr;
					hash |= 0; // Convert to 32bit integer
				}
				return hash;
			};

			var Project = function(canvasId) {
				console.log("Init: Project", canvasId);

				if (!canvasId) {
					return;
				}

				this.canvas = document.getElementById(canvasId);

				this.map = new Map(this);
				this.heartBeatsPerSec = 60;
				this.queue = {};
				this.heart;
				this.startHeart();
			};

			Project.prototype.startHeart = function() {
				var delay = Math.floor(1000 / this.heartBeatsPerSec);
				var self = this;
				this.heart = setInterval(function() {
					self.proccessQueue()
				}, delay);
			};

			Project.prototype.proccessQueue = function() {
				var callback;
				for (var i in this.queue) {
					callback = this.queue[i];
					delete this.queue[i];
					if (typeof callback == "function") {
						callback();
					}
				}
			};

			var Map = function(project) {
				console.log("Init: Map");

				this.project      = project;
				this.canvas       = project.canvas;
				this.context      = this.canvas.getContext("2d");
				this.tiles        = {};
				this.zoom         = 1;
				this.tileWidth    = 64 * (1 / this.zoom);
				this.tileHeight   = this.tileWidth / 2;
				this.cameraX      = project.canvas.width/2;
				this.cameraY      = -300;
				this.dragOffsetX  = 0;
				this.dragOffsetY  = 0;
				this.screenWidth  = project.canvas.width;
				this.screenHeight = project.canvas.height;
				this.regionSize   = 19 * this.zoom;

				this.addEventListeners();

				if (Object.getOwnPropertyNames(this.tiles).length === 0) {
					console.log("NEED TO LOAD A REGION");
					this.loadRegions();
				}
			};



			Map.prototype.draw = function() {
				//console.log("Func: Map::draw", Object.getOwnPropertyNames(this.tiles).length);
				this.clearCanvas();

				var tile;
				for (var t in this.tiles) {
					tile = this.tiles[t];
					this.drawTile(tile);
				}

				this.drawViewer();
			};

			Map.prototype.addEventListeners = function() {
				var self    = this;
				var flag    = 0;
				var element = this.canvas;
				var downX, downY;
				var clickEvent, mouseDownEvent, mouseMoveEvent, mouseUpEvent, mouseOutEvent;

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
						self.dragOffsetX = (target.clientX - downX);
						self.dragOffsetY = (target.clientY - downY);
						self.project.queue["mapUpdate"] = function() {
							self.loadRegions();
							self.draw();
						};
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
				var mapX = Math.floor((screenX / (this.tileWidth / 2) + screenY / (this.tileHeight / 2)) / 2);
				var mapY = Math.floor((screenY / (this.tileHeight / 2) - (screenX / (this.tileWidth / 2))) / 2);
				//console.log("Clicked map on tile:", mapX, mapY);

				return {
					x: mapX,
					y: mapY
				};
			};

			Map.prototype.addTile = function(tile) {
				//console.log("Func: Map::addTile");

				this.tiles[(tile.x + ":" + tile.y).hashCode()] = tile;
			};

			Map.prototype.clearCanvas = function() {
				this.context.clearRect(0, 0, this.screenWidth, this.screenHeight);
			};

			Map.prototype.drawTile = function(tile) {
				//console.log("Func: Map::drawTile", tile);

				var screenX = ((tile.x - tile.y) * (this.tileWidth / 2)) + this.cameraX + this.dragOffsetX;
				var screenY = ((tile.x + tile.y) * (this.tileHeight / 2)) + this.cameraY + this.dragOffsetY;

				if (screenX < (0 - (this.tileWidth * 2)) ||
					screenX >= (this.screenWidth + (this.tileWidth * 2)) ||
					screenY < (0 - (this.tileHeight * 2)) ||
					screenY >= (this.screenHeight + (this.tileHeight * 2))) {
					return;
				}

				if (screenX < this.tileWidth / 2 ||
					screenX >= (this.screenWidth - (this.tileWidth / 2)) ||
					screenY < 0 ||
					screenY >= (this.screenHeight - this.tileHeight)) {
					return;
				}

				// this.context.fillStyle = tile.attr.color; //'#f00'; //#'+Math.floor(Math.random()*16777215).toString(16);;
				// this.context.beginPath();
				// this.context.moveTo(screenX, screenY);
				// this.context.lineTo(screenX + (this.tileWidth / 2), screenY + (this.tileHeight / 2));
				// this.context.lineTo(screenX, screenY + this.tileHeight);
				// this.context.lineTo(screenX - (this.tileWidth / 2), screenY + (this.tileHeight / 2));
				// this.context.closePath();
				// this.context.fill();
				// this.context.stroke();
				// this.context.font = "8px Arial";
				// this.context.fillStyle = "#000";
				// this.context.textAlign = "center";
				// this.context.fillText("("+tile.x+","+tile.y+")", screenX, screenY+10);

				this.context.drawImage(
					tile.attr.image,
					0,
					0,
					tile.attr.image.width,
					tile.attr.image.height,
					screenX-(tile.attr.image.width / 2),
					screenY-(tile.attr.image.height - 48),
					tile.attr.image.width,
					tile.attr.image.height
				);

				// this.context.font = "8px Arial";
				// this.context.fillStyle = "#000";
				// this.context.textAlign = "center";
				// this.context.fillText("("+tile.x+","+tile.y+")", screenX, screenY+10);
			};

			Map.prototype.drawViewer = function() {
				this.context.beginPath();
				this.context.moveTo(this.tileWidth, this.tileHeight);
				this.context.lineTo(this.screenWidth-this.tileWidth, this.tileHeight);
				this.context.lineTo(this.screenWidth-this.tileWidth, this.screenHeight-this.tileHeight);
				this.context.lineTo(this.tileWidth, this.screenHeight-this.tileHeight);
				this.context.closePath();
				this.context.stroke();
			};

			Map.prototype.getTileById = function(x, y) {
				return this.tiles[(x+":"+y).hashCode()] || null;
			};

			Map.prototype.loadRegions = function() {
				// Find the region(s) that should be on the screen
				var clickedTileCoords = this.clicked(this.screenWidth/2, this.screenHeight/2);
				var regionCoords = this.tileCoordsToRegion(clickedTileCoords.x, clickedTileCoords.y);

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
				
				// this.generateRegion(regionCoords.x-1, regionCoords.y-1); // 0,0
				// this.generateRegion(regionCoords.x-1, regionCoords.y);   // 0,1
				// this.generateRegion(regionCoords.x-1, regionCoords.y+1); // 0,2
				// this.generateRegion(regionCoords.x, regionCoords.y-1);   // 1,0
				this.generateRegion(regionCoords.x, regionCoords.y);     // 1,1
				// this.generateRegion(regionCoords.x, regionCoords.y+1);   // 1,2
				// this.generateRegion(regionCoords.x+1, regionCoords.y-1); // 2,0
				// this.generateRegion(regionCoords.x+1, regionCoords.y);   // 2,1
				// this.generateRegion(regionCoords.x+1, regionCoords.y+1); // 2,2

				var count = 0;
				for (var i in this.tiles) {
					count++;
				}

				//console.log("Tiles in memory",count);

				var regionQuadrant = this.regionQuadrant(clickedTileCoords.x, clickedTileCoords.y);

				//console.log("Quadrant IS", regionQuadrant);

				// Unload regions that should be out of the viewport
			};

			Map.prototype.regionQuadrant = function(x, y) {
				var region = this.tileCoordsToRegion(x, y);

				// am I in the N/W or E/S?
				//console.log(x, (this.regionSize * (region.x + 1)) / 2);
				// if (x <= (this.regionSize * (region.x + 1)) / 2) {
				// 	console.log("I am in the NW", x, (this.regionSize * (region.x + 1)) / 2);
				// } else {
				// 	console.log("I am in the ES", x, (this.regionSize * (region.x + 1)) / 2);
				// }
			};

			Map.prototype.regionExists = function(x, y) {
				var tileX = this.regionSize * x;
				var tileY = this.regionSize * y;

				return this.getTileById(tileX, tileY) || false;
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

				for (var i = this.regionSize * regionX; i < maxX; i++) {
					for (var j = this.regionSize * regionY; j < maxY; j++) {
						delete this.tiles[(i+":"+j).hashCode()];
					}
				}
			};

			Map.prototype.generateRegion = function(regionX, regionY) {
				if (this.regionExists(regionX, regionY)) {
					return;
				}

				// Create Tiles
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
							type  : 'grass',
							image : image
						});
						this.addTile(tile);
					}
				}

				// // Seed edge tile with dirt patch
				// var seed = this.tiles[("0:8").hashCode()];
				// console.log("Got me a seed tile", seed);

				// seed.set("color", '#994A40');
				// seed.set("type", 'dirt');

				// // Determine state of edge tiles
				
				// // Start simple and create dirt trail (Drunkard Walk)
				// // 1 Find trail start
				// var neighbors = this.findNeighbors(seed);
				// //console.log("SEED NEIGHBORS", neighbors);
				// for (var i = 0; i < 500; i++) {
				// 	var neighbor = this.pickRandomNeighbor(neighbors);
				// 	neighbors[neighbor].set("color", '#994A40');
				// 	neighbors[neighbor].set("type", 'dirt');
				// 	neighbors = this.findNeighbors(neighbors[neighbor]);
				// 	//console.log("NEXT SEED NEIGHBORS", neighbors, neighbor);
				// }
				// // 2 Pick a valid random direction
				// // 3 Make new dirt patch
				// // 4 Repeat 2 and 3 until edge of region
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

			var myProject = new Project("myCanvas");

			myProject.map.draw();
		</script>
	</body>
</html>