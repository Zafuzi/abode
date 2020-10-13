let Employees = 45;

let Icons = {
    Steel: "images/steel.png",
    Oxygen: "images/oxygen.png",
    Methane: "images/methane.png",
    "Methane Farm": "🐄",
    "Glorified Air Compressor": "☁",
    "Big Shovel and Stove": "🗻"
}

let Resources = {
    Steel: 4000000,
    Methane: 300000,
    Oxygen: 1000000
}

let Structures = [ // rate is x per tick
    { name: "Methane Farm", desc: "", resource: "Methane", rate: 100 },
    { name: "Glorified Air Compressor", desc: "", resource: "Oxygen", rate: 100 },
    { name: "Big Shovel and Stove", desc: "", resource: "Steel", rate: 100 }
]

document.addEventListener("DOMContentLoaded", () => {
    console.log("hello")
    var app = new Vue({
        el: '#app',
        data: {
            Resources: Resources,
            Structures: Structures,
            Icons: Icons,
            numFmt: numFmt,
            message: 'Welcome. We have started you off with a few production facilities and we are ready to start constructing our first rocket'
        }
    })

    let loop = function() {
        Structures.forEach(s => {
            Resources[s.resource] += s.rate;
        })
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
})