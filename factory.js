let Icons = {
    credit: "images/tile.png",
    steel: "images/steel.png",
    oxygen: "images/oxygen.png",
    methane: "images/methane.png",
    rocket: "images/rocket.png",
    station: "images/station.png",
    power: "images/power.png",
    solar: "images/power.png",
    hydrogen: "images/tile.png",
    water: "images/water.png",
    carbon: "images/carbon.png",
    grass: "images/tile.png",
    iron: "images/iron.png",
    slag: "images/tile.png",
    trees: "images/trees.png",
    silicate: "images/tile.png",
    factory: "images/factory.png",
    tank: "images/tile.png",
    tile: "images/tile.png",
    splitter: "images/tile.png",
}

let node_colors = {
    any: "#fff",
    power: "#fff3a6",
    solar: "#fff3a6",
    oxygen: "#ffa6a6",
    hydrogen: "#fff",
    methane: "#a6fffe",
    water: "#a6caff",
    steel: "#999",
    grass: "#a6ffaf",
    carbon: "#58637a",
    slag: "#c9bbab",
    iron: "#ba7254",
    rocket: "#ff99e6",
    silicates: "#b6c9a5",
    trees: "#2E6230",
    carbon_dioxide: "#ffffff",
    food: "#ffffff"
}

let add_factory = function(type, name, inputs, outputs) {
    var pt = ctx.transformedPoint(canvas.width / 2 - 50, canvas.height / 2 - 50);
    new Factory(type, name, Icons[type], inputs, outputs, pt.x, pt.y);
}

let master_tick_rate = 1000; // one second

let input_connectors = {
    any: ["input", "any", "Any", 0, "u"],
    power: ["input", "power", "Power", 10 / master_tick_rate, "kW"],
    water: ["input", "water", "Water", 10 / master_tick_rate, "L"],
}

let output_connectors = {
    any: ["output", "any", "Any", 0, "u"],
    power: ["output", "power", "Power", 20 / master_tick_rate, "kW"],
    oxygen: ["output", "oxygen", "Oxygen", 5 / master_tick_rate, "L"],
    hydrogen: ["output", "hydrogen", "Hydrogen", 5 / master_tick_rate, "L"],
    water: ["output", "water", "Water", 1000 / master_tick_rate, "L"],
}

let add_input = function(name) {
    return new Connector(
        input_connectors[name][0],
        input_connectors[name][1],
        input_connectors[name][2],
        input_connectors[name][3],
        input_connectors[name][4],
    )
}

let add_output = function(name) {
    return new Connector(
        output_connectors[name][0],
        output_connectors[name][1],
        output_connectors[name][2],
        output_connectors[name][3],
        output_connectors[name][4],
    )
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

let connector_radius = 10;
class Connector {
    constructor(type = "input", id = "tile", name = "Empty Connector", rate = 0, unit = "u") {
        // don't store the parent in here, just pass it as an arg when needed
        this.name = name;
        this.rate = rate;
        this.type = type;
        this.unit = unit;
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.r = connector_radius;
        if (this.id == "any") {
            this.any = true; // special connector
        }
    }
    update(parent = Factory, offset = Number) {
        // figure out where to draw me x, y offset from the parent and my position in the object array
        let self = this;
        self.x = self.type == "input" ? parent.x : parent.x + parent.w;
        //self.y = parent.y + parent.header_height + ((factory_padding * 3) + (self.r * offset));
        self.y = parent.dy + ((factory_padding * 3) + (self.r * 2 * offset));
        if (offset == 0) {
            self.y += self.r * 2;
        }
        let n = (self.rate || 0) + (self.unit || "u/s") + " | " + self.name
        if (ctx.measureText(n).width + self.r * 2 > parent.w) {
            parent.w += (ctx.measureText(n).width + (self.r * 2) + factory_padding * 2) / 2;
        }

        parent.dy += ((factory_padding * 3) + (self.r * 2 * offset));
        parent.h += ((factory_padding * 3) + (self.r * 2));
        if (offset == 0) {
            parent.dy += (self.r * 2);
            if (self.type == "output") {
                parent.h += (self.r * 2);
            }
        }

        if (parent.type == "splitter" || parent.type == "storage") {
            if (self.type == "output") {
                let o = parent.inputs[0];
                self.rate = parent.type == "splitter" ? o.rate / 2 : o.rate;
                self.unit = o.unit;
                self.id = o.id;
            } else {
                // Splitter input type "any"
                if (self.connected) {
                    self.id = self.connected.id;
                    self.rate = self.connected.rate;
                    self.unit = self.connected.unit;
                } else {
                    self.id = "any";
                    self.rate = 0;
                    self.unit = "u";
                }
            }
        }
    }
    draw() {
        let self = this;

        ctx.beginPath();
        ctx.fillStyle = node_colors[self.id];
        ctx.arc(self.x, self.y, self.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();

        let n = (self.rate || 0) + (self.unit || "u/s") //+ " | " + self.name
        if (self.type == "input") {
            ctx.beginPath();
            ctx.fillText(n, self.x + self.r * 2, self.y + self.r / 2);
            ctx.closePath();
        } else {
            ctx.beginPath();
            ctx.fillText(n, self.x - ctx.measureText(n).width - self.r * 2, self.y + self.r / 2);
            ctx.closePath();
        }
    }
}

let factories = [];
let factory_font_size = 24;
let factory_icon_size = 24;
let factory_padding = 5;
let factory_font = factory_font_size + "px monospace";
class Factory {
    constructor(
        type = "empty",
        name = "Empty and Useless",
        icon = Icons.tile,
        inputs = [],
        outputs = [],
        x = 0,
        y = 0
    ) {
        this.type = type;
        this.name = name;
        this.inputs = inputs;
        this.outputs = outputs;
        this.x = x;
        this.y = y;
        if (this.type == "storage") {
            this.capacity = 1000;
            this.amount_stored = 0;
        }

        let e = new Image();
        e.src = icon;
        this.icon = e;

        this.w = 100;
        let name_height = ctx.measureText(self.name).actualBoundingBoxAscent;
        this.h = (factory_icon_size + factory_padding * 2) - (name_height / 2);
        this.header_height = this.h;
        this.dy = this.y + this.header_height;

        factories.push(this);
    }
    update() {
        let self = this;
        self.connections = [];

        let name_height = ctx.measureText(self.name).actualBoundingBoxAscent;
        self.h = (factory_icon_size + factory_padding * 4) - (name_height / 2);
        self.header_height = self.h;
        self.dy = self.y + self.header_height;

        self.outputs.forEach((output, offset) => {
            output.update(self, offset);
            if (self.type == "storage" && output.connected) {
                if (self.amount_stored > 0) {
                    // TODO limit the output to my max output rate
                    if (output.connected.rate) {
                        self.amount_stored -= output.connected.rate;
                    }
                }
            }
        });

        self.inputs.forEach((input, offset) => {
            input.update(self, offset)
            if (self.type == "storage") {
                if (self.amount_stored < self.capacity) {
                    self.amount_stored += input.rate;
                }
            }
        });

        this.calc_connections();
    }
    draw() {
        let self = this;

        // draw the factory box
        ctx.beginPath();
        ctx.fillStyle = "#222233";
        ctx.fillRect(self.x, self.y, self.w, self.h);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(self.x, self.y, self.w, self.h);
        ctx.closePath()

        // Draw the header
        ctx.fillStyle = "#fff";
        ctx.font = factory_font;
        let name_height = ctx.measureText(self.name).actualBoundingBoxAscent;
        ctx.fillText(
            self.name,
            self.x + factory_icon_size + (factory_padding * 3),
            self.y + (factory_icon_size + factory_padding * 2) - name_height / 2 // trying to align the image and font vertically in the center
        );
        if (ctx.measureText(self.name).width + factory_font_size + factory_padding >= self.w) {
            self.w = ctx.measureText(self.name).width + factory_font_size + (factory_padding * 4); // 3 paddings : 1 for the image, 1 for the title, 1 for the end
        }

        // Draw the icon
        ctx.beginPath();
        ctx.drawImage(
            self.icon,
            0, 0,
            self.icon.width, self.icon.height,
            self.x + factory_padding, self.y + factory_padding,
            factory_icon_size, factory_icon_size
        );
        ctx.closePath();

        self.inputs.forEach(input => { input.draw() });
        self.outputs.forEach(output => { output.draw() });

        if (self.capacity) {
            let n = parseInt(self.amount_stored) + "/" + self.capacity;
            ctx.fillText(
                n,
                self.x + factory_icon_size + (factory_padding * 3) - (ctx.measureText(n).width / 2),
                self.y + self.h + factory_font_size
            );
        }
    }

    calc_connections() {
        let self = this;

        self.outputs.forEach(o => {
            if (o.connected) {
                let p = o.connected; // whatever I am connected to
                if (p.remove_on_mouse_up && !mousedown) {
                    // This only occurs when I am dragging from a connector to attach it somewhere
                    // So the connector in this case is my mouse
                    // start by clearing the connection
                    // TODO make some allow multiple connections??
                    o.connected = null;

                    // first check if I am dropping this onto another connector
                    factories.forEach(f => {
                        f.inputs.forEach(i => {
                            if (i.id == o.id || i.any) {
                                if (hit_rad(i)) {
                                    if (i.connected && i.connected.connected == i) {
                                        // Tell the ouput we are connected to, to forget about our connection
                                        // It's over Brian. Seriously, move on.
                                        i.connected.connected = null;
                                        o.connected = null;
                                        i.connected = null;
                                    }
                                    o.connected = i; // connect them
                                    i.connected = o;
                                }
                            }
                        })
                    })

                    return;
                }

                let connection = {};
                let left = o.x > p.x ? p : o;

                connection.remote_node = p;

                let middle = (o.x + p.x) / 2;

                if (o == left) {
                    let cp1 = {
                        x: middle,
                        y: o.y
                    }
                    let cp2 = {
                        x: middle,
                        y: p.y
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
                        y: p.y
                    }
                    let cp2 = {
                        x: middle,
                        y: o.y
                    }
                    connection.x = o.x;
                    connection.y = o.y;
                    connection.cp1 = cp1;
                    connection.cp2 = cp2;
                    connection.px = p.x;
                    connection.py = p.y;
                }
                connection.strokeStyle = node_colors[o.id];
                self.connections.push(connection);
            } else {}
        });
    }
}

let FactoryTypes = {
    solar: function() {
        add_factory("solar", "Solar Panels", [], [
            add_output("power")
        ])
    },
    splitter: function() {
        add_factory("splitter", "Single Splitter", [
            add_input("any")
        ], [
            add_output("any"),
            add_output("any")
        ])
    },
    storage: function() {
        add_factory("storage", "Storage", [
            add_input("any")
        ], [
            add_output("any")
        ])
    },
    water: function() {
        add_factory("water", "Water Pump", [
            add_input("power")
        ], [
            add_output("water")
        ])
    },
    oxygen: function() {
        add_factory("oxygen", "Electrolysis Chamber", [
            add_input("power"),
            add_input("water")
        ], [
            add_output("oxygen"),
            add_output("hydrogen")
        ])
    },
}

/*
// Factory Definition
class Factory {
    constructor(type, x, y) {

        let t = clone(type);
        this.name = t.name
        this.inputs = t.inputs;
        this.outputs = t.outputs;

        let e = new Image();
        e.src = t.icon;
        this.icon = e;

        this.x = x;
        this.y = y;
        this.w = 150;
        this.node_radius = 5;
        this.h = 62;
        this.header_height = 18;

        factories.push(this);
    }
    update() {
        this.connections = [];
        this.calc_connections();
    }
    draw() {
        let self = this;
        let dx = self.x;
        let dy = self.y;

        // draw the factory box
        ctx.beginPath();
        ctx.fillStyle = "#222233";
        ctx.fillRect(dx, dy, self.w, self.h);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(dx, dy, self.w, self.h);
        ctx.closePath();

        // Draw the header
        ctx.fillStyle = "#fff";
        ctx.fillText(self.name, self.x + 5 + 34, self.y + 10 + 12);
        if (5 + 34 + ctx.measureText(self.name).width >= self.w) {
            self.w = 5 + 34 + ctx.measureText(self.name).width + 10;
        }

        ctx.beginPath();
        ctx.drawImage(self.icon, 0, 0, self.icon.width, self.icon.height, self.x + 5, self.y + 10, 24, 24);
        ctx.closePath();

        let lowest = 0;

        dx = self.x;
        dy = self.y + self.header_height + font_size / 1.2 + (self.node_radius * 2) + 10;

        Object.keys(self.inputs).forEach(k => {
            if (dy > lowest) {
                lowest = dy;
            }
            let o = self.inputs[k];
            // Only do this the first time
            if (!o.name) {
                o.name = k;
                o.r = self.node_radius;
            }

            o.x = dx;
            o.y = dy;

            ctx.beginPath();
            ctx.fillStyle = node_colors[o.name];
            ctx.arc(o.x, o.y, self.node_radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.fillText(o.name, o.x + font_size, o.y + 5);
            ctx.closePath();
            dy += (self.node_radius * 2) + 10;
        });

        dx = self.x + self.w;
        dy = self.y + self.header_height + font_size / 1.2 + (self.node_radius * 2) + 10;
        Object.keys(self.outputs).forEach(k => {
            if (dy > lowest) {
                lowest = dy;
            }
            let o = self.outputs[k];
            o.x = dx;
            o.y = dy;
            o.name = k;
            o.r = self.node_radius;

            ctx.beginPath();
            ctx.fillStyle = node_colors[o.name];
            ctx.arc(o.x, o.y, self.node_radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            let n = (o.rate || 0) + (o.units || "u/s") + " | " + o.name
            ctx.fillText(n, o.x - ctx.measureText(n).width - self.node_radius * 2, o.y + self.node_radius / 2);
            ctx.closePath();

            dy += (self.node_radius * 2) + 10;
        });

        if (this.h == 62) {
            this.h += (lowest - self.y) - (self.header_height + font_size / 1.2 + (self.node_radius * 2)) + 5;
        }
    }
    calc_connections() {
        let self = this;
        let dx = self.x + self.w;
        let dy = self.y + self.header_height + font_size / 1.2 + (self.node_radius * 2) + 10;
        Object.keys(self.outputs).forEach(k => {
            let o = self.outputs[k];
            if (!o.name) {
                o.x = dx;
                o.y = dy;
                o.name = k;
                o.r = self.node_radius;
            }

            if (o.connected) {
                let p = o.connected;
                if (p.remove_on_mouse_up && !mousedown) {
                    o.connected = null;
                    // check all the other factories for a place to connect to
                    factories.forEach(f => {
                        Object.keys(f.inputs).forEach(k => {
                            let m = f.inputs[k];
                            if (hit_rad({
                                    x: m.x,
                                    y: m.y,
                                    r: self.node_radius
                                })) {
                                if (k == p.name) {
                                    if (m.connected) {
                                        m.connected.connected = null;
                                    }
                                    o.connected = m;
                                    m.connected = o;
                                }
                            }
                        });
                    })
                    return;
                }

                let connection = {};
                let left = o.x > p.x ? p : o;

                connection.remote_node = p;

                let middle = (o.x + p.x) / 2;

                if (o == left) {
                    let cp1 = {
                        x: middle,
                        y: o.y
                    }
                    let cp2 = {
                        x: middle,
                        y: p.y
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
                        y: p.y
                    }
                    let cp2 = {
                        x: middle,
                        y: o.y
                    }
                    connection.x = o.x;
                    connection.y = o.y;
                    connection.cp1 = cp1;
                    connection.cp2 = cp2;
                    connection.px = p.x;
                    connection.py = p.y;
                }
                connection.strokeStyle = node_colors[o.name];
                self.connections.push(connection);
            } else {
                if (!resources[k]) {
                    resources[k] = 0;
                }
                if (o.rate && o.generator) {
                    resources[k] += o.rate / master_tick_rate;
                }
            }
            dy += self.node_radius * 2 + 5;
        });
    }
}
*/