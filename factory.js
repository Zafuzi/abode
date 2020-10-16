let Icons = {
    credit: "images/tile.png",
    steel: "images/steel.png",
    oxygen: "images/oxygen.png",
    methane: "images/methane.png",
    rocket: "images/rocket.png",
    station: "images/station.png",
    power: "images/power.png",
    hydrogen: "images/tile.png",
    water: "images/water.png",
    carbon: "images/tile.png",
    grass: "images/tile.png",
    iron: "images/tile.png",
    slag: "images/tile.png",
    trees: "images/tile.png",
    silicate: "images/tile.png"
}

let node_colors = {
    power: "#fff3a6",
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
    trees: "#ffffff",
    carbon_dioxide: "#ffffff",
    food: "#ffffff"
}

let FactoryTypes = {
    solar: {
        name: "Solar Panels",
        icon: Icons["power"],
        inputs: {},
        outputs: {
            power: {}
        }
    },
    water: {
        name: "Big Lake of Fresh Water",
        icon: Icons["water"],
        inputs: {},
        outputs: {
            water: {}
        }
    },
    oxygen: {
        name: "Oxygen Electrolysis Chamber",
        icon: Icons["oxygen"],
        inputs: {
            power: {},
            water: {}
        },
        outputs: {
            hydrogen: {},
            oxygen: {}
        }
    },

    carbon: {
        name: "Charcoal Hut",
        icon: Icons["carbon"],
        inputs: {
            trees: {}
        },
        outputs: {
            carbon: {},
            carbon_dioxide: {}
        }
    },
    iron: {
        name: "Iron Mine",
        icon: Icons["iron"],
        inputs: {},
        outputs: {
            iron: {},
            silicates: {}
        }
    },
    steel: {
        name: "Steel Production Facility",
        icon: Icons["steel"],
        inputs: {
            iron: {},
            carbon: {},
            oxygen: {}
        },
        outputs: {
            steel: {},
            slag: {}
        }
    },
    rocket: {
        name: "Rocket Fabricator",
        icon: Icons["rocket"],
        inputs: {
            steel: {},
            methane: {},
            oxygen: {},
            power: {}
        },
        outputs: {
            rocket: {}
        }
    },
    trees: {
        name: "Synthetic Forest",
        icon: Icons["trees"],
        inputs: {
            power: {},
            water: {}
        },
        outputs: {
            carbon: {},
            carbon_dioxide: {},
            food: {},
            trees: {}
        }
    },
}

// Factory Definition
class Factory {
    constructor(type, x, y) {

        this.name = type.name;
        this.inputs = type.inputs;
        this.outputs = type.outputs;

        let e = new Image();
        e.src = type.icon;
        this.icon = e;

        this.x = x;
        this.y = y;
        this.w = 100;
        this.node_radius = 5;
        this.h = this.icon.height + 40;

        let tallest = Object.keys(this.inputs).length > Object.keys(this.outputs).length ? Object.keys(this.inputs).length : Object.keys(this.outputs).length;

        this.h += tallest * ((this.node_radius * 2) + 5);
        this.h += 10;

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
        ctx.fillStyle = "#223333";
        ctx.fillRect(dx, dy, self.w, self.h);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(dx, dy, self.w, self.h);
        ctx.closePath();

        dx = self.x;
        dy = self.y + self.icon.height - (self.node_radius * 2) - 5;
        Object.keys(self.inputs).forEach(k => {

            let o = self.inputs[k];
            // Only do this the first time
            if (!o.name) {
                o.name = k;
                o.parent = self;
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

            dy += (self.node_radius * 2) + 5;
        });

        dx = self.x + self.w;
        dy = self.y + (self.node_radius * 2) + 10;
        Object.keys(self.outputs).forEach(k => {
            let o = self.outputs[k];
            o.x = dx;
            o.y = dy;
            o.name = k;
            o.parent = self;
            o.r = self.node_radius;

            ctx.beginPath();
            ctx.fillStyle = node_colors[o.name];
            ctx.arc(o.x, o.y, self.node_radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.fillText(o.name, o.x - ctx.measureText(o.name).width - self.node_radius * 2, o.y + self.node_radius / 2);
            ctx.closePath();

            dy += (self.node_radius * 2) + 5;
        });

        ctx.beginPath();
        ctx.drawImage(self.icon, 0, 0, self.icon.width, self.icon.height, self.x + 5, self.y + 10, 18, 18);
        ctx.closePath();
    }
    calc_connections() {
        let self = this;
        let dx = self.x + self.w;
        let dy = self.y + (self.node_radius * 2) + 10;
        Object.keys(self.outputs).forEach(k => {
            let o = self.outputs[k];
            if (!o.name) {
                o.x = dx;
                o.y = dy;
                o.name = k;
                o.parent = self;
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

                if (!p.parent) {
                    return;
                }

                let connection = {};
                let left = o.x > p.x ? p : o;

                connection.remote_node = p;
                connection.parent = self;

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
            }
            dy += self.node_radius * 2 + 5;
        });
    }
}