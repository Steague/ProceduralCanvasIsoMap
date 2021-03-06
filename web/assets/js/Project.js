var Project = function(canvasId) {
    console.log("Init: Project", canvasId);

    if (!canvasId) {
        return;
    }

    this.canvas = document.getElementById(canvasId);

    this.heartBeatsPerSec = 60;
    this.queue = [];
    this.heart;
    this.startHeart();
    this.map = new Map(this);

    var map = this.map;
    this.appendToQueue("createStartZone", function() {
        map.createStartZone();
        map.draw();
    });
};

Project.prototype.queue = function() {
    return this.queue;
};

Project.prototype.appendToQueue = function(key, callback) {
    this.queue.push([key,callback]);
};

Project.prototype.startHeart = function() {
    if (typeof requestAnimationFrame == "function") {
        console.log("requestAnimationFrame supported.");
        this.proccessQueue();
        return;
    }

    var delay = Math.floor(1000 / this.heartBeatsPerSec);
    var self = this;
    this.heart = setInterval(function() {
        self.proccessQueue()
    }, delay);
};

Project.prototype.proccessQueue = function() {
    //console.log("Beat", this);
    var callback;
    var queueToProcess = this.queue.slice();
    this.queue = [];
    for (var i in queueToProcess) {
        callback = queueToProcess[i][1];
        if (queueToProcess[i][0] != "draw") {console.log("Proccessing", queueToProcess[i][0]);};
        if (typeof callback == "function") {
            callback();
        }
        if (queueToProcess[i][0] != "draw") {console.log("Finished proccessing", queueToProcess[i][0]);};
    }

    if (typeof requestAnimationFrame == "function") {
        var self = this;
        requestAnimationFrame(function() {
            self.proccessQueue();
        });
    }
};