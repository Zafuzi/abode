let mousedown = false;
let mx = 0,
    my = 0;

let mouse_click = {
    x: 0,
    y: 0
};

let canvas = document.querySelector("#game_canvas");
let ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.font = '18px sans-serif';


let node_colors = {
    power: "#fff3a6",
    oxygen: "#ffa6a6",
    methane: "#a6fffe",
    water: "#a6caff",
    steel: "#d3d7de",
    grass: "#a6ffaf"
}

let connections = [];
let factories = [];

// TODO on init draw a version of the factory that can be stored as an image for later use, and only update when something in the factory changes
class Factory {
    constructor(name, x, y, inputs, outputs, color) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.inputs = inputs;
        this.outputs = outputs;
        this.color = color;
        this.w = 250;

        let tallest = Object.keys(inputs).length > Object.keys(outputs).length ? Object.keys(inputs).length : Object.keys(outputs).length;
        this.h = 45 + ((18 + 15) * tallest)

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.w + 35;
        this.canvas.height = this.h + 3;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.font = "18px sans-serif";
        this.ctx.imageSmoothingEnabled = true;
    }
    init() {

        let self = this;
        let dx = 15;
        let dy = 45 + 9 + 3;

        self.ctx.clearRect(0, 0, self.canvas.w, self.canvas.h);

        // draw the factory box
        self.ctx.beginPath();
        self.ctx.fillStyle = "#333";
        self.ctx.fillRect(dx, 0, self.w, self.h);
        self.ctx.strokeStyle = "#ddd";
        self.ctx.lineWidth = 2;
        self.ctx.strokeRect(dx, 0, self.w, self.h);
        self.ctx.closePath();

        Object.keys(self.inputs).forEach(k => {
            let o = self.inputs[k];
            console.log(self.name, " | input:", k);
            o.x = dx;
            o.y = dy;
            o.name = k;
            o.parent = self;
            self.ctx.beginPath();
            self.ctx.fillStyle = node_colors[o.name];
            self.ctx.arc(o.x, o.y, 10, 0, 2 * Math.PI);
            self.ctx.fill();
            self.ctx.closePath();
            self.ctx.beginPath();
            self.ctx.fillText(o.name, o.x + 18, o.y + 5);
            self.ctx.closePath();
            dy += 25;
        });

        dx = 15 + self.w;
        dy = 20 + 3;
        Object.keys(self.outputs).forEach(k => {
            console.log(self.name, " | output:", k);
            let o = self.outputs[k];
            o.x = dx;
            o.y = dy;
            o.name = k;
            o.parent = self;

            self.ctx.beginPath();
            self.ctx.fillStyle = node_colors[o.name];
            self.ctx.arc(o.x, o.y, 10, 0, 2 * Math.PI);
            self.ctx.fill();
            self.ctx.closePath();
            self.ctx.beginPath();
            self.ctx.fillText(o.name, o.x - self.ctx.measureText(o.name).width - 18, o.y + 5);
            self.ctx.closePath();

            if (!o.connected) {
                o.connected = [];
            }
            dy += 25;
        });

        self.ctx.beginPath();
        self.ctx.fillStyle = "#fff";
        self.ctx.fillText(self.name, 15 + 9, 18 + 9);
        self.ctx.closePath();
        console.log("");
        factories.push(self);
    }
    update() {
        this.connections = [];
        this.calc_connections();
    }
    calc_connections() {
        let self = this;
        let dx = 15 + self.w;
        let dy = 20 + 3;
        Object.keys(self.outputs).forEach(k => {
            let o = self.outputs[k];
            o.x = dx;
            o.y = dy;
            o.name = k;
            o.parent = self;

            if (!o.connected) {
                o.connected = [];
            }
            if (o.connected.length > 0) {
                o.connected.forEach(p => {
                    let connection = {};
                    let left = self.x + o.x > p.x + p.parent.x ? p : o;

                    connection.remote_node = p;
                    connection.parent = self;

                    let middle = (self.x + o.x + p.parent.x + p.x) / 2;

                    if (o == left) {
                        let cp1 = {
                            // ((c.parent.x + c.x) + (c.remote_node.parent.x + c.px)) / 2, ((c.parent.y + c.y)),
                            x: middle,
                            y: o.y + self.y
                        }
                        let cp2 = {
                            x: middle,
                            y: p.parent.y + p.y
                        }
                        connection.x = o.x;
                        connection.y = o.y;
                        connection.cp1 = cp1;
                        connection.cp2 = cp2;
                        connection.px = p.x;
                        connection.py = p.y;
                    } else {
                        let cp1 = {
                            x: middle,
                            y: p.parent.y + p.y
                        }
                        let cp2 = {
                            x: middle,
                            y: self.y + o.y
                        }
                        connection.x = o.x;
                        connection.y = o.y;
                        connection.cp1 = cp1;
                        connection.cp2 = cp2;
                        connection.px = p.x;
                        connection.py = p.y;
                    }

                    var grd = ctx.createLinearGradient(o.x, o.y, p.x, p.y);
                    grd.addColorStop(0, node_colors[o.name]);
                    grd.addColorStop(1, node_colors[p.name]);
                    connection.strokeStyle = grd;
                    self.connections.push(connection);

                })
            }
            dy += 25;
        });
    }
}

let SolarPanel = new Factory("Solar Panel", 100, 300, {}, { power: {} }, "#333");
SolarPanel.init();

let OxygenMine = new Factory("Oxygen Mine", 400, 300, { power: {}, water: {} }, { oxygen: {} }, "#333");
OxygenMine.init();

let RainCollector = new Factory("Rain Collector", 100, 400, {}, { water: {} }, "#333");
RainCollector.init();

let GrassField = new Factory("GrassField", 100, 500, {}, { grass: {} }, "#333");
GrassField.init();

let MethaneMine = new Factory("Farting Cows", 400, 450, { grass: {}, water: {} }, { methane: {} }, "#333");
MethaneMine.init();

let SteelMine = new Factory("Steel Mine", 800, 250, { oxygen: {}, methane: {} }, { steel: {} }, "#333");
SteelMine.init();

SolarPanel.outputs.power.connected.push(OxygenMine.inputs.power);
OxygenMine.outputs.oxygen.connected.push(SteelMine.inputs.oxygen);
RainCollector.outputs.water.connected.push(OxygenMine.inputs.water, MethaneMine.inputs.water);
GrassField.outputs.grass.connected.push(MethaneMine.inputs.grass);
MethaneMine.outputs.methane.connected.push(SteelMine.inputs.methane);

let then = performance.now();
let FPS = 120;
let t = 0;
let FPS_LOCK = function() {
    let now = performance.now();
    let delta = now - then;

    if (delta > 1000 / FPS) {
        then = now - (delta % (1000 / FPS));
        loop();
    } else {
        requestAnimationFrame(FPS_LOCK);
    }
}

let hit = function(f = Factory) {
    let x = f.x,
        y = f.y;
    let w2 = f.w;
    let h2 = f.h;
    if (mx < x) { return false; }
    if (mx > x + f.w) { return false; }
    if (my < y) { return false; }
    if (my > y + f.h) { return false; }
    return true;
}

let dragging;
ctx.imageSmoothingEnabled = true;

let loop = function() {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    connections = [];

    factories.forEach(f => {
        f.update();
        f.connections.forEach(c => {
            ctx.beginPath();
            ctx.moveTo(c.parent.x + c.x, c.parent.y + c.y);
            ctx.bezierCurveTo(
                c.cp1.x, c.cp1.y,
                c.cp2.x, c.cp2.y,
                c.remote_node.parent.x + c.px, c.remote_node.parent.y + c.py
            );
            ctx.strokeStyle = c.strokeStyle;
            ctx.stroke();
            ctx.closePath();
        });
    });

    factories.forEach(f => {
        ctx.drawImage(f.canvas, f.x, f.y);
    })



    if (mousedown) {
        if (dragging) {
            dragging.f.x = mx - dragging.diffx;
            dragging.f.y = my - dragging.diffy;
        } else {
            for (let i = 0; i < factories.length; i++) {
                let f = factories[i];
                if (hit(f)) {
                    dragging = {
                        f: f,
                        diffx: (mx - f.x),
                        diffy: (my - f.y)
                    }
                }
            }
        }
    }

    requestAnimationFrame(FPS_LOCK);
}

requestAnimationFrame(FPS_LOCK);

addEventListener("mousedown", e => {
    mousedown = true;
    mouse_click.x = e.pageX;
    mouse_click.y = e.pageY
})

addEventListener("mouseup", e => {
    mousedown = false;
    dragging = false;
})

addEventListener("mousemove", e => {
    mx = e.pageX;
    my = e.pageY;
})