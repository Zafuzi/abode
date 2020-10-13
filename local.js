let Employees = 45;

let Icons = {
    Credits: "images/wallet.png",
    Steel: "images/steel.png",
    Oxygen: "images/oxygen.png",
    Methane: "images/methane.png",
    Rockets: "images/rocket.png"
}

let Resources = {
    Credits: 1000000,
    Steel: 4000000,
    Methane: 300000,
    Oxygen: 1000000,
    Rockets: 0
}

let Structures = [ // rate is x per tick
    { name: "Big Shovel and Stove", desc: "", resource: "Steel", rate: 10, count: 1, costs: { Credits: 2000000 }, multiplier: 1, active: true },
    { name: "Methane Farm", desc: "", resource: "Methane", rate: 1, count: 1, costs: { Credits: 5000000 }, multiplier: 1, active: true },
    { name: "Glorified Air Compressor", desc: "", resource: "Oxygen", rate: 2, count: 1, costs: { Credits: 3000000 }, multiplier: 1, active: true },
    {
        name: "Rocket Fabricator",
        desc: "",
        resource: "Rockets",
        rate: 0,
        count: 0,
        active: false,
        multiplier: 1,
        costs: {
            Credits: 750000,
            Steel: 2000000,
            Methane: 250000,
            Oxygen: 800000
        }
    },
]

document.addEventListener("DOMContentLoaded", () => {
    var app = new Vue({
        el: '#app',
        data: {
            Resources: Resources,
            Structures: Structures,
            Icons: Icons,
            numFmt: numFmt,
            Tiles: [],
            message: 'Welcome. We have started you off with a few production facilities and we are ready to start constructing our first rocket'
        },
        methods: {
            construct: function(structure, amt) {
                console.log(structure.costs.Credits * amt);
                if (structure.costs.Credits * amt <= Resources.Credits) {
                    structure.count += 1;
                    structure.rate += .0001;
                    structure.active = true;
                    Resources.Credits -= structure.costs.Credits * amt;
                }
            }
        }
    })

    let loop = function() {
        Structures.forEach(s => {
            if (s.active) {
                Object.keys(s.costs).forEach(k => {
                    let v = s.costs[k];
                    if (k != "Credits" && Resources[k] >= v * s.rate * s.multiplier) {
                        Resources[k] -= v * s.rate * s.multiplier;
                    } else {
                        s.funding = false;
                    }
                })
                if (!s.funding) {
                    Resources[s.resource] += s.rate * s.multiplier * s.count;
                }
            }
        })

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
})