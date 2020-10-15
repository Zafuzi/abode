let Employees = 45;

let Icons = {
    Credits: "images/wallet.png",
    Steel: "images/steel.png",
    Oxygen: "images/oxygen.png",
    Methane: "images/methane.png",
    Rockets: "images/rocket.png",
    Stations: "images/station.png"
}

let Resources = {
    Credits: 10000000,
    Rockets: 0,
    Stations: 0,
    Steel: 0,
    Oxygen: 0,
    Methane: 0
}

let Prices = {
    Steel: 622,
    Oxygen: 300,
    Methane: 135,
    Rockets: 50000000,
    Stations: 5000000000
}

let Structures = [ // rate is x per second
    {
        name: "Steel Mine",
        desc: "",
        resource: "Steel",
        count: 0,
        auto: false,
        rate: 5,
        timer: 30,
        current_timer: 0,
        cost: 50000000,
        ready: false,
        self_production: true
    },
    {
        name: "Oxygen Storage Facility",
        desc: "",
        resource: "Oxygen",
        count: 0,
        auto: false,
        timer: 15,
        rate: 25,
        cost: 5000000,
        ready: false
    },
    {
        name: "Farting Cows",
        desc: "",
        resource: "Methane",
        count: 0,
        auto: false,
        timer: 12,
        rate: 35,
        cost: 7500000,
        ready: false
    },
    {
        name: "Rocket Fabricator",
        desc: "",
        resource: "Rockets",
        count: 0,
        auto: false,
        timer: 120,
        rate: .001,
        cost: 120000000,
        ready: false
    },
    {
        name: "Orbital Station",
        desc: "",
        resource: "Stations",
        count: 0,
        auto: false,
        timer: 240,
        rate: .0001,
        cost: 150000000000,
        ready: false
    },
]

let SteelMine;

document.addEventListener("DOMContentLoaded", () => {

    var app = new Vue({
        el: '#app',
        data: {
            Resources: Resources,
            Structures: Structures,
            Icons: Icons,
            Prices: Prices,
            Bot: Bot,
            numFmt: numFmt,
            bots: bots,
            tasks: tasks.holding,
            autosell_resources: [],
            message: 'Welcome. We have started you off with a few production facilities and we are ready to start constructing our first rocket'
        },
        methods: {
            create_bot: function() {
                if (bots.length == 10) return;
                if (Resources.Credits >= 30000000) {
                    Resources.Credits -= 30000000;
                    bots.push(new Bot(1));
                }
            },
            autosell: function(key) {
                this.autosell_resources.indexOf(key) == -1 ? this.autosell_resources.push(key) : this.autosell_resources.splice(this.autosell_resources.indexOf(key), 1);
            },
            sell: function(key) {
                let val = QS("input[name=" + key + "]")[0].value;
                if (val == 0) {
                    val = Resources[key] //sell all
                }
                val = Math.floor(val);
                let price = Prices[key];
                if (Resources[key] >= val) {
                    Resources.Credits += val * price;
                    Resources[key] -= val;
                }
            },
            construct: function(structure, amt) {
                if (tasks.holding.length == 20) return;
                if (structure.cost <= Resources.Credits) {

                    let t = new Task(structure.name, () => { structure.count += amt }, structure.timer);
                    tasks.add(t);

                    Resources.Credits -= structure.cost;
                }
            }
        }
    })

    let then = performance.now();
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

    let loop = function() {
        T += 1;

        bots.forEach(bot => {
            bot.tick();
        })

        if (T % FPS == 0) {
            app.autosell_resources.forEach(r => {
                app.sell(r);
            })

            Structures.forEach(s => {
                if (s.auto) {
                    app.construct(s, 1);
                }
                Resources[s.resource] += s.count * s.rate * FPS;
            })
        }

        requestAnimationFrame(FPS_LOCK);
    }

    requestAnimationFrame(FPS_LOCK);
})