class Body {
    constructor(x, y, r, color, rotate, origin) {
        this.id = utils.makeid();
        this.name = "body_" + this.id;
        this.z_color = color;
        this.x = x, this.y = y, this.r = r, this.color = color, this.rotate = rotate, this.origin = origin;
        if(rotate)
            this.angle = origin.angle;
    }
    update() {
        let self = this;
        let origin = self.origin;
        self.x = origin.sol.x - utils.deg2xy(origin.distance, self.angle).x;
        self.y = origin.sol.y - utils.deg2xy(origin.distance, self.angle).y;
        self.angle += game.grand_daddy_rate/100 * origin.rate;

        game.resources.iron += self.metal_rate/100 || 0;
        game.resources.ore += self.ore_rate/10 || 0;
        game.resources.gold += self.gold_rate/100 || 0;
    }
    draw() {
        let self = this;
        ctx.beginPath();
        ctx.arc(self.x, self.y, self.r, 0, 2 * Math.PI);
        let rgba = utils.hexToRgbA(self.z_color);
        if(!self.selected)
            rgba.a = 1;
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
        let rgba = utils.hexToRgbA(self.z_color);
        rgba.a = 1;
        self.color = "rgba(" + [rgba.r, rgba.g, rgba.b, rgba.a].join(',') +")";
        let selected_element = $('#current_body');
        let ok = selected_element.text() != self.name;
        if(ok) {
            replicate("tpl_selected", [{id: self.id, selected_name: self.name}])
            var a = new Audio("./music/plop.wav");
            a.play();
        }
    }
}