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
    Rockets: 0
}

let Structures = [ // rate is x per tick
    {
        name: "Rocket Fabricator",
        desc: "",
        resource: "Rockets",
        count: 0,
        auto: false,
        timer: 10,
        current_timer: 0,
        cost: 750000,
        ready: false
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
            message: 'Welcome. We have started you off with a few production facilities and we are ready to start constructing our first rocket'
        },
        methods: {
            construct: function(structure, amt) {
                if (structure.cost <= Resources.Credits) {
                    Resources.Credits -= structure.cost;
                    structure.current_timer = structure.timer;
                }
            }
        }
    })

    let loop = function() {
        Resources.Credits += Structures[0].count * 100;
        Structures.forEach(s => {
            if (s.auto) {
                app.construct(s, 1);
            }
            if (s.current_timer > 0) {
                s.ready = false;
                s.current_timer -= numFmt(s.timer * .001, 2);
            } else {
                s.ready = true;
            }

            if (s.ready && s.current_timer < 0) {
                s.count += 1;
                Resources[s.resource] += 1;
                s.current_timer = 0;
                s.ready = false;
            }
        })
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
})