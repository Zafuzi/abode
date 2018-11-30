var canvas, ctx;

var canvasState = {
    lastX: 0,
    lastY: 0,
    dragStart: null,
    dragged: false,
    scaleFactor: 1.025,
    init: function () {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        trackTransforms(ctx);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        this.lastX = canvas.width / 2;
        this.lastY = canvas.height / 2;

        canvas.addEventListener('mousedown', this.mouseDown);
        canvas.addEventListener('touchstart', this.mouseDown)
        canvas.addEventListener('mousemove', this.mouseMove);
        canvas.addEventListener('touchmove', this.mouseMove)
        canvas.addEventListener('mouseup', this.mouseUp);
        canvas.addEventListener('DOMMouseScroll', this.handleScroll);
        canvas.addEventListener('mousewheel', this.handleScroll);
    },
    mouseDown: function (evt) {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        console.log(evt.type)
        if(evt.type == "touchstart"){
            canvasState.lastX = evt.touches[0].pageX - canvas.offsetLeft;
            canvasState.lastY = evt.touches[0].pageY - canvas.offsetTop;
        } else {
            canvasState.lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            canvasState.lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        }
        canvasState.dragStart = ctx.transformedPoint(canvasState.lastX, canvasState.lastY);
        canvasState.dragged = false;
        console.log(canvasState.dragStart)
        canvasState.handleMouseCollision();
    },
    mouseMove: function (evt) {
        if(evt.type == "touchmove"){
            canvasState.lastX = evt.touches[0].offsetX || (evt.touches[0].pageX - canvas.offsetLeft);
            canvasState.lastY = evt.touches[0].offsetY || (evt.touches[0].pageY - canvas.offsetTop);
        } else {
            canvasState.lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            canvasState.lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        }
        
        canvasState.dragged = true;
        if (canvasState.dragStart) {
            var pt = ctx.transformedPoint(canvasState.lastX, canvasState.lastY);
            ctx.translate(pt.x - canvasState.dragStart.x, pt.y - canvasState.dragStart.y);
        }
    },
    mouseUp: function (evt) {
        canvasState.dragStart = null;
        // if (!canvasState.dragged) canvasState.zoom(evt.shiftKey ? -10 : 10);
    },
    handleScroll: function (evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) canvasState.zoom(delta);
        return evt.preventDefault() && false;
    },
    handleMouseCollision: function () {
        game.selection = null;
        var X = this.dragStart.x;
        var Y = this.dragStart.y;
        let bodies = game.bodies;
        // this will also work for ui elements
        bodies.forEach(body => {
            let xlow = body.x - body.r;
            let xhigh = body.x + body.r;
            let ylow = body.y - body.r;
            let yhigh = body.y + body.r;

            if (X > xlow && X < xhigh) {
                if (Y > ylow && Y < yhigh) {
                    game.selection = body;
                }
            }
        })
    },
    zoom: function (clicks) {
        var pt = ctx.transformedPoint(canvas.width / 2, canvas.height / 2);
        ctx.translate(pt.x, pt.y);
        var factor = Math.pow(canvasState.scaleFactor, clicks);
        ctx.scale(factor, factor);
        ctx.translate(-pt.x, -pt.y);
    }
}

var game = {
    selection: null,
    me: null,
    bodies: [],
    grand_daddy_rate: 1,
    resources: {
        ore: 0,
        iron: 0,
        gold: 0,
        units: 500000
    },
    initBodies(amount) {
        let sol = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            r: 0
        }
        for (let i = 0; i < amount; i++) {
            let id = utils.makeid();
            // make this a range
            let r = utils.getRandomInt(60, 100);
            let x = 0;
            if (i > 0) {
                r = utils.getRandomInt(10, 40);
                let d = utils.getRandomInt(2, amount);
                game.bodies.push(new Body(
                    sol.x + utils.deg2xy(sol.r * d, i * (360 / amount)).x,
                    sol.y + utils.deg2xy(sol.r * d, i * (360 / amount)).y,
                    r, utils.getRandomColor(), true, {
                        sol: sol,
                        distance: sol.r * d,
                        angle: i * (360 / amount),
                        rate: utils.getRandomInt(10 / d, 100 / d)
                    }
                ))
            } else {
                sol.r = r;
                let b = new Body(sol.x, sol.y, sol.r, utils.getRandomColor())
                b.name = "star_" + b.id
                b.discovered = true;
                game.bodies.push(b)
            }
        }
        game.me = utils.getRandomInt(1, game.bodies.length);
        game.selection = game.bodies[game.me]
        game.selection.name = "Home World"
        game.selection.discovered = true;
        game.selection.ore_rate = utils.getRandomInt(5, 10);
        game.selection.metal_rate = utils.getRandomInt(1, 5);
        game.selection.gold_rate = utils.getRandomInt(1, 3);
    },
    redrawBodies() {
        let bodies = this.bodies;
        let selection = this.selection;

        bodies.forEach(body => {
            if (body.rotate) {
                body.update();
            }
            // if (body.discovered) 
            body.draw()
        })
        bodies.forEach(body => {
            body.color = body.z_color;
            body.selected = false;
        })
        if (selection) {
            selection.click()
            selection.selected = true;
            // move camera to focus on body x and y
            if(canvasState.dragStart == null) return;
            let targetX = canvasState.dragStart.x;
            let targetY = canvasState.dragStart.y;
        }

    },
    redraw() {
        let resources = game.resources;
        replicate("tpl_resources", [{
            ore: Math.floor(resources.ore),
            iron: Math.floor(resources.iron),
            units: Math.floor(resources.units),
            gold: Math.floor(resources.gold)
        }])
        this.redrawBodies();
    },
    init() {
        this.initBodies(utils.getRandomInt(4,12));
    }
}

var sound = {
    clicked: false,
    length: 6,
    current_song: utils.getRandomInt(0, 6),
    main: null
}

$(function () {
    canvasState.init();
    game.init();
    requestAnimationFrame(redraw);
    console.log(sound.current_song)
    let p = setInterval(function() {
        if(!sound.clicked) return;
        playMusic();
        clearInterval(p);
    }, 100);
})

function playMusic(){
    sound.main = new Audio('../music/' + sound.current_song + '.mp3');
    sound.main.play();
    sound.main.addEventListener('ended', function(){
        sound.current_song += 1;
        if(sound.current_song > sound.length) sound.current_song = 0;
        playMusic();
    })
}

$(window).on('resize', e => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})
document.addEventListener('click', function() {
    sound.clicked = true;
})

function redraw() {
    // Clear the entire canvas
    var p1 = ctx.transformedPoint(0, 0);
    var p2 = ctx.transformedPoint(canvas.width, canvas.height);
    ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    game.redraw();
    requestAnimationFrame(redraw)
}

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
function trackTransforms(ctx) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function () {
        return xform;
    };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function () {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
    };

    var restore = ctx.restore;
    ctx.restore = function () {
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function (sx, sy) {
        xform = xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
    };

    var rotate = ctx.rotate;
    ctx.rotate = function (radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    };

    var translate = ctx.translate;
    ctx.translate = function (dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    };

    var transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
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
    ctx.setTransform = function (a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) {
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }
}