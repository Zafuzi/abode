class Body {
    constructor(x, y, r, color, rotate, origin) {
        this.id = utils.makeid();
        this.name = "body_" + this.id;
        this.z_color = color;
        this.x = x, this.y = y, this.r = r, this.color = color, this.rotate = rotate, this.origin = origin;
        this.mines = 1;
        this.mine_rate = 20;
        this.units = 0;
        if(rotate)
            this.angle = origin.angle;
    }
    update() {
        let self = this;
        let origin = self.origin;
        self.x = origin.sol.x - utils.deg2xy(origin.distance, self.angle).x;
        self.y = origin.sol.y - utils.deg2xy(origin.distance, self.angle).y;
        self.angle += game.grand_daddy_rate/100 * origin.rate;
        let income = (self.mines * self.mine_rate)
        let tax = .1;
        game.resources.units += (income * tax)/10;
        self.units += income - (income*tax);
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
            console.log(self);
            replicate("tpl_selected", [{id: self.id, selected_name: self.name}])
            replicate("tpl_actions", actions, (e,d,i) => {
                $(e).on('click', function() {
                    console.log("click");
                    d.action();
                })
            });
            var a = new Audio("./music/plop.wav");
            a.play();
        }
    }
    add(item){
        let self = this;
        switch(item) {
            case "mine":
                if(self.units - 50000 >= 0) {
                    self.mines += 1;
                    self.units -= 50000
                }
                break;
        }
    }
}