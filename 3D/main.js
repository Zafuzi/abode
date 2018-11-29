var canvas, ctx;
var $canvas = $("#canvas");
var canvasOffset = $canvas.offset();
var offsetX = canvasOffset.left;
var offsetY = canvasOffset.top;
var scrollX = $canvas.scrollLeft();
var scrollY = $canvas.scrollTop();

// View parameters
var xleftView = 0;
var ytopView = 0;
var widthViewOriginal = 1.0; //actual width and height of zoomed and panned display
var heightViewOriginal = 1.0;
var widthView = widthViewOriginal; //actual width and height of zoomed and panned display
var heightView = heightViewOriginal;


var selection = null;

$(function () {
    replicate("tpl_modal_controls", [])
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d')
    canvas.addEventListener("mousedown", handleMouseDown, false); // click and hold to pan
    canvas.addEventListener("touchstart", handleMouseDown, false);
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("touchmove", handleMouseMove, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    canvas.addEventListener("touchend", handleMouseUp, false);
    canvas.addEventListener("mousewheel", handleMouseWheel, false); // mousewheel duplicates dblclick function
    canvas.addEventListener("DOMMouseScroll", handleMouseWheel, false); // for Firefox
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    generate_bodies(8);
    window.requestAnimationFrame(update);
})

function update() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    widthViewOriginal = canvas.width;
    heightViewOriginal = canvas.height;
    if(widthView == 1.0) widthView = widthViewOriginal, heightView = heightViewOriginal;
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(canvas.width/widthView, canvas.height/heightView);
    ctx.translate(-xleftView, -ytopView);
    bodies.forEach(body => {
        if(body.rotate) {
            body.update();
        }
        body.draw()
    })
    bodies.forEach(body => {
        body.color = body.z_color;
    })
    if (selection) {
        selection.click()
    }
    window.requestAnimationFrame(update);
}

var mouseDown = false;

function handleMouseDown(e) {
    console.log("mouse down")
    mouseDown = true;
    selection = null;

    var scale = {x: canvas.width/widthView, y: canvas.height/heightView}

    var X = parseInt(e.clientX)/scale.x
    var Y = parseInt(e.clientY)/scale.y
    // this will also work for ui elements
    bodies.forEach(body => {
        let xlow = body.x - body.r - xleftView;
        let xhigh = body.x + body.r - xleftView;
        let ylow = body.y - body.r - ytopView;
        let yhigh = body.y + body.r - ytopView;

        if (X > xlow && X < xhigh) {
            if (Y > ylow && Y < yhigh) {
                selection = body;
            }
        }
    })
}

function handleMouseUp(event) {
    mouseDown = false;
}
var lastX = 0;
var lastY = 0;

function handleMouseMove(e) {
    e.preventDefault();
    var X, Y;
    if(e.type == "touchmove"){
        let touch = event.touches[0]
        let target = event.target
        let c = $('#canvas')[0]
        X = touch.pageX - c.offsetLeft - c.clientLeft + c.scrollLeft;
        Y = touch.pageY - c.offsetTop - c.clientTop + c.scrollTop;
        console.log(X,Y, e)
    }else {
        X = event.clientX - this.offsetLeft - this.clientLeft + this.scrollLeft;
        Y = event.clientY - this.offsetTop - this.clientTop + this.scrollTop;
    }

    if (mouseDown) {
        var dx = (X - lastX) / canvas.width * widthView;
        var dy = (Y - lastY) / canvas.height * heightView;
        xleftView -= dx;
        ytopView -= dy;
    }
    lastX = X;
    lastY = Y;

}

function handleMouseWheel(e) {

    var x = widthView / 2 + xleftView; // View coordinates
    var y = heightView / 2 + ytopView;

    var scale = (event.wheelDelta < 0 || event.detail > 0) ? 1.1 : .9;
    widthView *= scale;
    heightView *= scale;
    console.log(widthView, heightView)


    if (widthView > widthViewOriginal || heightView > heightViewOriginal) {
        widthView = widthViewOriginal;
        heightView = heightViewOriginal;
        x = widthView / 2;
        y = heightView / 2;
    }

    // scale about center of view, rather than mouse position. This is different than dblclick behavior.
    xleftView = x - widthView / 2;
    ytopView = y - heightView / 2;
}

var bodies = [];

class Body {
    constructor(x, y, r, color, rotate, origin) {
        this.z_color = color;
        this.x = x, this.y = y, this.r = r, this.color = color, this.rotate = rotate, this.origin = origin;
        if(rotate)
            this.angle = origin.angle;
    }
    update() {
        let self = this;
        let origin = self.origin;
        self.x = origin.sol.x - deg2xy(origin.distance, self.angle).x;
        self.y = origin.sol.y - deg2xy(origin.distance, self.angle).y;
        self.angle += 1 / origin.rate;
    }
    draw() {
        let self = this;
        ctx.beginPath();
        ctx.arc(self.x, self.y, self.r, 0, 2 * Math.PI);
        ctx.fillStyle = self.color;
        ctx.fill();
        ctx.closePath();
    }
    click() {
        let self = this;
        // convert original color from hex first then opacity
        self.color = "rgba(255, 255, 255, 0.5)";
    }
}

// var canvas_elements = [];

// var bodies = []

function generate_bodies(amount) {
    let sol = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: 0
    }
    for (let i = 0; i < amount; i++) {
        let id = makeid();
        // make this a range
        let r = getRandomInt(60, 100);
        let x = 0;
        if (i > 0) {
            r = getRandomInt(10, 40);
            let d = getRandomInt(2, amount);
            bodies.push(new Body(
                sol.x + deg2xy(sol.r * d, i * (360/amount)).x, 
                sol.y + deg2xy(sol.r * d, i * (360/amount)).y, 
                r, getRandomColor(), true, {sol: sol, distance: sol.r * d, angle: i * (360/amount), rate: getRandomInt(10/d, 100/d)}
            ))
        } else {
            sol.r = r;
            bodies.push(new Body(sol.x, sol.y, sol.r, getHue(sol.r, 0, 60)))
        }
        console.log(x)

    }
}

function getHue(percent, start, end) {
    var a = percent / 100,
        b = (end - start) * a,
        c = b + start;
  
    // Return a CSS HSL string
    return 'hsl('+c+', 100%, 50%)';
  }

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomColor() {
    return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)
}

function deg2xy(radius, angle) {
    let x = radius * Math.cos(Math.PI * 2 * angle / 360);
    let y = radius * Math.sin(Math.PI * 2 * angle / 360);
    return {
        x: x,
        y: y
    }
}