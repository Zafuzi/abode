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
    Credits: 100000000,
    Rockets: 0,
    Stations: 0,
    Steel: 0,
    Oxygen: 0,
    Methane: 0
}

let Prices = {
    Steel: 622,
    Oxygen: 3,
    Methane: 1.35,
    Rockets: 50000000
}

let Structures = [ // rate is x per tick
    {
        name: "Steel Mine",
        desc: "",
        resource: "Steel",
        count: 0,
        auto: false,
        timer: 12, // Based on 400,000 tonnes / year
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
        timer: 5,
        cost: 500000,
        ready: false
    },
    {
        name: "Farting Cows",
        desc: "",
        resource: "Methane",
        count: 0,
        auto: false,
        timer: 2,
        cost: 750000,
        ready: false
    },
    {
        name: "Rocket Fabricator",
        desc: "",
        resource: "Rockets",
        count: 0,
        auto: false,
        timer: 10,
        cost: 62000000,
        ready: false
    },
    {
        name: "Orbital Station",
        desc: "",
        resource: "Stations",
        count: 0,
        auto: false,
        timer: 25,
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
            Bot: Bot,
            numFmt: numFmt,
            bots: bots,
            tasks: tasks.holding,
            autosell_resources: [],
            message: 'Welcome. We have started you off with a few production facilities and we are ready to start constructing our first rocket'
        },
        methods: {
            create_bot: function() {
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
                let price = Prices[key];
                if (Resources[key] >= val) {
                    Resources.Credits += val * price;
                    Resources[key] -= val;
                }
            },
            construct: function(structure, amt) {
                if (structure.cost <= Resources.Credits) {
                    Resources.Credits -= structure.cost;
                    let t = new Task(structure.name, () => { structure.count += amt }, structure.timer);
                    tasks.add(t);
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

        Structures.forEach(s => {
            if (s.auto) {
                app.construct(s, 1);
            }
            Resources[s.resource] += s.count;
        })

        bots.forEach(bot => {
            bot.tick();
        })

        app.autosell_resources.forEach(r => {
            app.sell(r);
        })

        requestAnimationFrame(FPS_LOCK);
    }

    requestAnimationFrame(FPS_LOCK);
})