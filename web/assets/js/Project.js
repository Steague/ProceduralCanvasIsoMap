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
    for (var i in this.queue) {
        callback = this.queue[i][1];
        //console.log("Proccessing", this.queue[i][0]);
        if (typeof callback == "function") {
            callback();
        }
    }
    this.queue = [];

    if (typeof requestAnimationFrame == "function") {
        var self = this;
        requestAnimationFrame(function() {
            self.proccessQueue();
        });
    }
};