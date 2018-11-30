const utils = {
    deg2xy: function(radius, angle) {
        let x = radius * Math.cos(Math.PI * 2 * angle / 360);
        let y = radius * Math.sin(Math.PI * 2 * angle / 360);
        return {
            x: x,
            y: y
        }
    },

    getHue: function(percent, start, end) {
        var a = percent / 100,
            b = (end - start) * a,
            c = b + start;

        // Return a CSS HSL string
        return 'hsl(' + c + ', 100%, 50%)';
    },

    getRandomColor: function() {
        return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)
    },

    getRandomInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    hexToRgbA: function(hex){
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
    },

    makeid: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    lerp: function (value1, value2, amount) {
        amount = amount < 0 ? 0 : amount;
        amount = amount > 1 ? 1 : amount;
        return value1 + (value2 - value1) * amount;
    }
}