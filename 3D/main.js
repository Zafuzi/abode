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
var scale = 1;

var grand_daddy_rate = .5;
var selection = null;
var me;

var clicked = false;
var main_music;

$(function () {
    replicate("tpl_selected", [{selected_name: ""}])
    replicate("tpl_body_selector", [])
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

    generate_bodies(getRandomInt(3,15));
    window.requestAnimationFrame(update);
    let p = setInterval(function() {
        if(!clicked) return;
        main_music = new Audio('../music/01.mp3');
        main_music.play();
        clearInterval(p);
    }, 100);
})

function bodySelector(){
    replicate("tpl_body_selector", bodies, (e,d,i) => {
        $(e).on('click', () => {
            selection = d;
        });
    })
    $("#current_body_chevron").toggleClass('flipped')
    $("#body_list").toggleClass('hid');
}

document.addEventListener("click", e => {
    clicked = true;
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
        body.selected = false;
    })
    if (selection) {
        selection.click()
        selection.selected = true;
        // move camera to focus on body x and y
        let targetX = selection.x - widthView/2;
        let targetY = selection.y - heightView/2;
        // lerp to target
        xleftView = Math.lerp(xleftView, targetX, .1);
        ytopView = Math.lerp(ytopView, targetY, .1);
    }
    let s_rate = 0;
    if(selection&&selection.rotate) s_rate = grand_daddy_rate/100 / selection.origin.rate;
    replicate("tpl_info", [{body_count: bodies.length, selected_name: selection ? selection.name : "", rate: s_rate}])
    replicate("tpl_sim_rate", [{rate: grand_daddy_rate}])
    window.requestAnimationFrame(update);
}

var mouseDown = false;

function handleMouseDown(e) {
    console.log("mouse down")
    mouseDown = true;
    selection = null;

    var local_scale = {x: canvas.width/widthView, y: canvas.height/heightView}

    var X = parseInt(e.clientX)/local_scale.x
    var Y = parseInt(e.clientY)/local_scale.y
    // this will also work for ui elements
    bodies.forEach(body => {
        let xlow = body.x - body.r - xleftView;
        let xhigh = body.x + body.r - xleftView;
        let ylow = body.y - body.r - ytopView;
        let yhigh = body.y + body.r - ytopView;

        if (X > xlow && X < xhigh) {
            if (Y > ylow && Y < yhigh) {
                selection = body;
                console.log(body.x, body.y);
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
    X = event.clientX - this.offsetLeft - this.clientLeft + this.scrollLeft;
    Y = event.clientY - this.offsetTop - this.clientTop + this.scrollTop;

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

    scale = (event.wheelDelta < 0 || event.detail > 0) ? 1.1 : .9;
    widthView *= scale;
    heightView *= scale;
    console.log(widthView, heightView)

    // reset camera to max view
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
        this.id = makeid();
        this.name = "body_" + this.id;
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
        self.angle += grand_daddy_rate/100 * origin.rate;
    }
    draw() {
        let self = this;

        // Shadow?
        // ctx.beginPath();
        // ctx.arc(self.x+4, self.y+4, self.r, 0, 2 * Math.PI);

        // ctx.fill();
        // ctx.closePath();

        ctx.beginPath();
        ctx.arc(self.x, self.y, self.r, 0, 2 * Math.PI);
        let rgba = hexToRgbA(self.z_color);
        if(!self.selected)
            rgba.a = .2;
        ctx.fillStyle = "rgba(" + [rgba.r, rgba.g, rgba.b, rgba.a].join(',') +")";
        ctx.fill();
        if(self.selected) {
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 5;
            ctx.stroke()
        }
        ctx.closePath();
    }
    click() {
        let self = this;
        // convert original color from hex first then opacity
        let rgba = hexToRgbA(self.z_color);
        rgba.a = 1;
        self.color = "rgba(" + [rgba.r, rgba.g, rgba.b, rgba.a].join(',') +")";
        let selected_element = $('#current_body');
        let ok = selected_element.text() != self.name;
        console.log(ok)
        if(ok) {
            replicate("tpl_selected", [{id: self.id, selected_name: self.name}])
        }
    }
}

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return { r: (c>>16)&255, g: (c>>8)&255, b: c&255,a: 1};
    }
    throw new Error('Bad Hex');
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
            let b = new Body(sol.x, sol.y, sol.r, getRandomColor())
            b.name = "star_" + b.id
            bodies.push(b)
        }
        console.log(x)
    }
    me = getRandomInt(1,bodies.length);
    selection = bodies[me]
    selection.name = "Home World"
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

Math.lerp = function (value1, value2, amount) {
	amount = amount < 0 ? 0 : amount;
	amount = amount > 1 ? 1 : amount;
	return value1 + (value2 - value1) * amount;
};