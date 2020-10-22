let mousedown = false;
let rightmousedown = false;
let middlemousedown = false;
let mx = 0,
    my = 0;

let static_mx = 0,
    static_my = 0;

let mouse_click = {
    x: 0,
    y: 0
};

let lastX = 0;
let lastY = 0;
let dragStart = null;
let dragged = false;
let scaleFactor = 1.025;

let canvas = document.querySelector("#game_canvas");
let ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.lineWidth = 3;

let menu = document.querySelector("#add_menu");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

trackTransforms(ctx);
lastX = canvas.width / 2;
lastY = canvas.height / 2;

// GAME START
let grid_size = 1;

let font_size = 18;
let then = performance.now();
let FPS = 120;
let t = 0;
let scale = 1;

let dragging;

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
    combiner: "images/tile.png",
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
    food: "#ffffff",
    tile: "pink",
}

let rates = {
    solar: {
        power: {
            production_rate: 20
        }
    },
    water_pump: {
        power: {
            usage_rate: 10
        },
        water: {
            production_rate: 100
        }
    },
    combiner: {
        any: {
            usage_rate: 0,
            production_rate: 0
        }
    }
}

let factories = [];
let factory_font_size = 24;
let factory_icon_size = 24;
let factory_padding = 5;
let factory_font = factory_font_size + "px monospace";

let factory = function(type = "empty", name = "Empty and Useless", icon = Icons.tile, inputs = [], outputs = [], x = 100, y = 100) {
    let o = {
        type: type,
        name: name,
        icon: icon,
        inputs: inputs,
        outputs: outputs,
        x: x,
        y: y,
        w: 100,
        h: 0,
        resources: {},
        connections: []
    }

    let img = new Image();
    img.src = icon;
    o.icon = img;

    o.update = function() {

        let self = this;
        self.connections = [];

        let name_height = ctx.measureText(self.name).actualBoundingBoxAscent;
        self.h = (factory_icon_size + factory_padding * 4) - (name_height / 2);
        self.header_height = self.h;
        self.dy = self.y + self.header_height + 20;

        // calc inputs positions
        self.inputs.forEach(input => {
            self.update_node(input)
        })

        // calc output positions
        self.outputs.forEach(output => {
            self.update_node(output)
        })

        self.calc_connections();

    }

    o.draw = function() {

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

        // draw inputs
        self.inputs.forEach(input => {
            self.draw_node(input);
        })

        // draw outputs
        self.outputs.forEach(output => {
            self.draw_node(output);
        })

    }

    o.update_node = function(n) {
        let self = this;
        let name = (n.type == "input" ? n.usage_rate : n.production_rate) + (n.unit || "u/s") + " | " + n.name
        let name_width = ctx.measureText(name).width + (n.r * 2) + 10;
        if (name_width > self.w) {
            self.w = name_width
        }

        n.x = n.type == "input" ? self.x : self.x + self.w;
        n.y = self.dy;

        // Make sure that my factory is tall enough for every input
        self.dy += (n.r * 2) + 10;
        self.h += ((factory_padding * 3) + (n.r * 2));

        if (!self.resources[n.id]) {
            self.resources[n.id] = rates[n.id] || {};
        }
    }

    o.draw_node = function(n) {
        ctx.beginPath();
        ctx.fillStyle = node_colors[n.id];
        ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();

        let name = (n.type == "input" ? n.usage_rate : n.production_rate) + (n.unit || "u/s") + " | " + n.name
        if (n.type == "input") {
            ctx.beginPath();
            ctx.fillText(name, n.x + n.r * 2, n.y + n.r / 2);
            ctx.closePath();
        } else {
            ctx.beginPath();
            ctx.fillText(name, n.x - ctx.measureText(name).width - n.r * 2, n.y + n.r / 2);
            ctx.closePath();
        }
    }

    o.calc_connections = function() {
        let self = this;
        let m = self.outputs;
        m.forEach(o => {
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

                let middle = (o.x + p.x) / 2; // The extact middle between these two connections


                // Bezier curve needs
                // X, Y, Control Point 1, Control Point 2
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
            }
        });
    }

    o.add_connection = function(
        io,
        type = "input",
        id = "tile",
        name = "Empty Connector",
        unit = "u",
        production_rate = 0,
        usage_rate = 0
    ) {
        let self = this;
        let o = {
            type: type,
            id: id,
            name: name,
            unit: unit,
            production_rate: production_rate,
            usage_rate: usage_rate,
            r: 10,
            any: id == "any" ? true : false
        }
        self[io].push(o);
    }

    return o;
}

var water_pump = function() {
    let fac = factory("water_pump", "Water Pump");
    fac.add_connection("inputs", "input", "power", "power", "kW", 0, 10);
    fac.add_connection("outputs", "output", "water", "Water", "L", 100, 0);
    factories.push(fac);
}

var solar = function() {
    let fac = factory("solar", "Solar Panels");
    fac.add_connection("outputs", "output", "power", "Solar Power", "kW", 20, 0);
    factories.push(fac);
}

var combiner = function() {
    let fac = factory("combiner", "Combiner");
    fac.add_connection("outputs", "output", "any", "Any", "u", 0, 0);
    fac.add_connection("inputs", "input", "any", "Any", "u", 0, 0);
    fac.add_connection("inputs", "input", "any", "Any", "u", 0, 0);
    factories.push(fac);
}

addEventListener("load", () => {
    let s = document.querySelectorAll(".create_factory");
    s.forEach(b => {
        b.addEventListener("click", (e) => {
            let type = b.dataset.type;
            console.log(type);
            if (window[type]) {
                window[type]();
            } else {
                console.error("Did you forget to make the create function for: ", type)
            }
        })
    });
})

let resources = {};

let loop = function() {
    t++;

    // Clear the entire canvas
    var p1 = ctx.transformedPoint(0, 0);
    var p2 = ctx.transformedPoint(canvas.width, canvas.height);
    ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    factories.forEach(f => {
        f.update();
        ctx.lineWidth = 3;
        f.connections.forEach(c => {
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.bezierCurveTo(
                c.cp1.x, c.cp1.y,
                c.cp2.x, c.cp2.y,
                c.px, c.py
            );
            ctx.strokeStyle = c.strokeStyle;
            ctx.stroke();
            ctx.closePath();
        });
    });
    factories.forEach(f => { f.draw() });

    if (mousedown) {
        if (dragging) {
            if (dragging.remove_on_mouse_up) {
                // this is connected to the mouse location until we let go of the mouse
                dragging.x = mx;
                dragging.y = my;
            } else {
                dragging.f.x = Math.round((mx - dragging.diffx) / grid_size) * grid_size;
                dragging.f.y = Math.round((my - dragging.diffy) / grid_size) * grid_size;
            }
        } else {
            // move a single factory around
            factories.forEach(f => {
                if (hit(f)) {
                    dragging = {
                        f: f,
                        diffx: (mx - f.x),
                        diffy: (my - f.y)
                    }
                }
                f.outputs.concat(f.inputs).forEach(o => {
                    if (hit_rad(o)) {

                        // create a dummy "connector" for the output to draw a curve to
                        // it's the mouses position
                        let p = {
                            remove_on_mouse_up: true,
                            id: o.id,
                            x: mx,
                            y: my,
                        }
                        if (o.connected) {
                            o.connected.connected = null;
                        }
                        o.connected = p;
                        dragging = p;
                    }
                })

            })
        }
    }

    /* // This is the code for the context wheel
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // draw the menu
    if (rightmousedown) {
        ctx.fillStyle = "#5e5e5e";
        context_wheel.forEach((c, i) => {
            c.update();
            if (hit_poly(c.shape)) {
                c.hovering = true;
            } else {
                c.hovering = false;
            }
            c.draw();
        })
        ctx.beginPath();
        ctx.moveTo(static_mx, static_my);
        //ctx.arc(static_mx, static_my, wheel_inner_radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
    ctx.restore();
    */

    requestAnimationFrame(FPS_LOCK);
}

function d2r(degrees) {
    return degrees * (Math.PI / 180);
}

let wheel_radius = 75;
let wheel_inner_radius = 25;
let context_wheel = [];

//context_wheel.push({ name: "add" });
let d = 60;
for (let i = 0; i < 360 / d; i++) {
    context_wheel.push({
        name: "add",
        deg: d,
        hovering: false,
        clicked: false,
        shape: [],
        update: function() {
            let self = this;
            let padding = (self.deg / 2);
            let deg = i * self.deg;
            self.shape = [
                [
                    static_mx + Math.cos(d2r(deg - padding)) * wheel_inner_radius,
                    static_my + Math.sin(d2r(deg - padding)) * wheel_inner_radius
                ],
                [
                    static_mx + Math.cos(d2r(deg - padding)) * (wheel_radius + 10),
                    static_my + Math.sin(d2r(deg - padding)) * (wheel_radius + 10)
                ],
                [
                    static_mx + Math.cos(d2r(deg + padding)) * (wheel_radius + 10),
                    static_my + Math.sin(d2r(deg + padding)) * (wheel_radius + 10)
                ],
                [
                    static_mx + Math.cos(d2r(deg + padding)) * wheel_inner_radius,
                    static_my + Math.sin(d2r(deg + padding)) * wheel_inner_radius
                ],
                [
                    static_mx + Math.cos(d2r(deg - padding)) * wheel_inner_radius,
                    static_my + Math.sin(d2r(deg - padding)) * wheel_inner_radius
                ]
            ]
        },
        draw: function() {
            let self = this;
            let padding = (self.deg / 2);
            let deg = i * self.deg;
            if (self.hovering) {
                ctx.strokeStyle = "#fff";
            } else {
                ctx.strokeStyle = "#5e5e5e";
            }
            ctx.beginPath();
            ctx.moveTo(
                static_mx + Math.cos(d2r(deg - padding)) * wheel_inner_radius,
                static_my + Math.sin(d2r(deg - padding)) * wheel_inner_radius
            );
            ctx.lineTo(
                static_mx + Math.cos(d2r(deg - padding)) * wheel_radius,
                static_my + Math.sin(d2r(deg - padding)) * wheel_radius
            );
            ctx.arc(
                static_mx + Math.cos(d2r(deg + padding)),
                static_my + Math.sin(d2r(deg + padding)),
                wheel_radius,
                d2r(deg - padding),
                d2r(deg + padding),
                false
            );
            ctx.lineTo(
                static_mx + Math.cos(d2r(deg + padding)) * wheel_inner_radius,
                static_my + Math.sin(d2r(deg + padding)) * wheel_inner_radius
            );
            ctx.lineTo(
                static_mx + Math.cos(d2r(deg - padding)) * wheel_inner_radius,
                static_my + Math.sin(d2r(deg - padding)) * wheel_inner_radius
            );
            ctx.stroke();
            ctx.closePath();
        }
    });
}

context_wheel.forEach(c => {
    c.x = 0;
    c.y = 0;
})

function hit_poly(poly_array) {
    var inside = false;
    var test_x = mx;
    var test_y = my;
    for (var i = 0; i < (poly_array.length - 1); i++) {
        var p1_x = poly_array[i][0];
        var p1_y = poly_array[i][1];
        var p2_x = poly_array[i + 1][0];
        var p2_y = poly_array[i + 1][1];
        if ((p1_y < test_y && p2_y >= test_y) || (p2_y < test_y && p1_y >= test_y)) { // this edge is crossing the horizontal ray of testpoint
            if ((p1_x + (test_y - p1_y) / (p2_y - p1_y) * (p2_x - p1_x)) < test_x) { // checking special cases (holes, self-crossings, self-overlapping, horizontal edges, etc.)
                inside = !inside;
            }
        }
    }
    return inside;
}

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
requestAnimationFrame(FPS_LOCK);

addEventListener("contextmenu", e => {
    e.preventDefault();
})

addEventListener("mousedown", e => {

    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

    let btn = e.button;

    mouse_click.x = e.pageX;
    mouse_click.y = e.pageY
    switch (btn) {
        case 0: // left button
            mousedown = true;
            middlemousedown = false;
            rightmousedown = false;
            break;
        case 1: // middle button
            e.preventDefault();
            middlemousedown = true;
            mousedown = false;
            rightmousedown = false;
            lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
            lastY = e.offsetY || (e.pageY - canvas.offsetTop);
            dragStart = ctx.transformedPoint(lastX, lastY);
            dragged = false;
            break;
        case 2: // right mouse click
            e.preventDefault();
            rightmousedown = true;
            middlemousedown = false;
            mousedown = false;
            static_mx = e.clientX;
            static_my = e.clientY;
            break;
        default: // default to left button
            mousedown = true;
            mouse_click.x = e.pageX;
            mouse_click.y = e.pageY
            break;
    }

})

addEventListener("mouseup", e => {
    e.preventDefault();
    dragging = false;
    mousedown = false;
    rightmousedown = false;
    middlemousedown = false;
})

addEventListener("mousemove", e => {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();
    // get the current mouse position
    let p = ctx.transformedPoint(e.clientX, e.clientY);
    mx = p.x;
    my = p.y;

    if (!middlemousedown) {
        return;
    } else {
        lastX = e.offsetX || (e.pageX - canvas.offsetLeft);
        lastY = e.offsetY || (e.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart) {
            var pt = ctx.transformedPoint(lastX, lastY);
            ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
        }
    }

})

addEventListener("mouseout", e => {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();
    mousedown = false;
    rightmousedown = false;
    middlemousedown = false;
    dragStart = null;
});

addEventListener("wheel", e => {
    var delta = e.wheelDelta ? e.wheelDelta / 40 : e.detail ? -e.detail : 0;
    if (delta) zoom(delta);
    return false;
})

let zoom = function(clicks) {
    var pt = ctx.transformedPoint(canvas.width / 2, canvas.height / 2);
    ctx.translate(pt.x, pt.y);
    scale = Math.pow(scaleFactor, clicks);
    ctx.scale(scale, scale);
    ctx.translate(-pt.x, -pt.y);
}

let hit = function(f) {
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

// Radius to radius collision test
let hit_rad = function(o) {
    let mouse_radius = 10;
    let rHit = (mouse_radius * o.r) + (o.r * o.r);
    let xx = Math.abs(o.x - mx);
    let yy = Math.abs(o.y - my);
    let rDist = (xx * xx) + (yy * yy);
    return rDist < rHit;
}

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
function trackTransforms(ctx) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function() {
        return xform;
    };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function() {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
    };

    var restore = ctx.restore;
    ctx.restore = function() {
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx, sy) {
        xform = xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
    };

    var rotate = ctx.rotate;
    ctx.rotate = function(radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    };

    var translate = ctx.translate;
    ctx.translate = function(dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    };

    var transform = ctx.transform;
    ctx.transform = function(a, b, c, d, e, f) {
        var m2 = svg.createSVGMatrix();
        m2.a = a;
        m2.b = b;
        m2.c = c;
        m2.d = d;
        m2.e = e;
        m2.f = f;
        xform = xform.multiply(m2);
        return transform.call(ctx, a, b, c, d, e, f);
    };

    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function(x, y) {
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }
}