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
let connections = [];
let factories = [];
let grid_size = 1;

let font_size = 18;
let then = performance.now();
let FPS = 120;
let t = 0;
let scale = 1;

let dragging;

let add_factory = function(name) {
    console.log("click")
    var pt = ctx.transformedPoint(canvas.width / 2, canvas.height / 2);
    new Factory(FactoryTypes[name], pt.x, pt.y);
}

add_factory("solar");

let noder = rplc8("#noder");
let a = [];
Object.keys(FactoryTypes).forEach(k => {
    let t = clone(FactoryTypes[k]);
    t.type = k;
    a.push(t);
});
noder.update(a);

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

    factories.forEach(f => {
        f.draw();
    })

    if (mousedown) {
        if (dragging) {
            if (dragging.name) {
                dragging.x = mx;
                dragging.y = my;
            } else {
                dragging.f.x = Math.round((mx - dragging.diffx) / grid_size) * grid_size;
                dragging.f.y = Math.round((my - dragging.diffy) / grid_size) * grid_size;
            }
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
                Object.keys(f.outputs).forEach(k => {
                    let o = f.outputs[k];

                    if (hit_rad({
                            x: o.x,
                            y: o.y,
                            r: o.r
                        })) {
                        let p = {
                            remove_on_mouse_up: true,
                            name: o.name,
                            x: mx,
                            y: my,
                            parent: {
                                name: "mouse",
                                x: mx,
                                y: my
                            }
                        }
                        f.outputs[k].connected = p;
                        dragging = p
                    }
                });
            }
        }
    }


    /*
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
console.log(context_wheel)

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