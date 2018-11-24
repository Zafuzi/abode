window.raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
};

var balance = 500000;
var tick = 0;
var year = 1000 * 12;
var budget = 500000;
var overall_cost = 10000;

// Array of celestial bodies to include in the map
var bodies = [];

var engines = [
    {
        id: "prb",
        name: "Probe ION",
        power: 1,
        weight: 10,
        cost: 10000
    }, 
    {
        id: "mk1",
        name: "MK I",
        power: 5,
        weight: 100,
        cost: 100000
    },
    {
        id: "mk2",
        name: "MK II",
        power: 10,
        weight: 500,
        cost: 500000
    }
]

var computers = [{
    id: "volta",
    name: "Volta",
    tflops: 120,
    cost: 25000
}]

var payloads = [
    {
        id: "probe",
        name: "Body Probe",
        weight: 5,
        income: 25,
        cost: 25000
    },
    {
        id: "mesh",
        name: "Mesh Network Sattelite",
        weight: 15,
        income: 50,
        cost: 75000
    },
    {
        id: "fat_guy",
        name: "Fat guy in a little coat",
        weight: 35,
        income: 500,
        cost: 100000
    }
]

var destinations = [{
        id: "earth",
        name: "Earth",
        distance: 2000
    },
    {
        id: "earth_moon",
        name: "The Moon",
        distance: 380000
    },
    {
        id: "mars",
        name: "Mars",
        distance: 54600000
    },
]

var research = [{
    id: "imn",
    active: false,
    name: "Improve Mesh Network",
    cost: 50000,
    result: function () {
        payloads.filter(p => {
            if (p.id == "mesh") p.income += 50
        })
    }
}]

var rockets = [];


function do_research(target) {
    let research_target;
    research.forEach(r => {
        if (target === r.id) research_target = r
    });
    if (research_target.active) return;
    balance -= research_target.cost;
    research_target.result();
    research_target.active = true;
}

class Rocket {
    constructor(name, engine, computer, payload, destination, cost) {
        this.id = name.hashCode();
        this.name = name, this.engine = engine, this.computer = computer,
            this.payload = payload, this.destination = destination, this.cost = cost;
    }
}

class Body {
    constructor(id, name) {
        this.id = id, this.name = name, this.income = 0,
            this.satellites = [], this.installations = [], this.mesh = 0,
            this.buildings = 0, this.explored = false;
    }
}

function makeBuild(e) {
    e.preventDefault();
    let form = document.querySelector('#build_form');
    form = objectifyForm(form);
    form.computer = computers.filter(computer => {
        return computer.id == form.build_computer;
    })[0]
    form.engine = engines.filter(engine => {
        return engine.id == form.build_engine;
    })[0]
    form.payload = payloads.filter(payload => {
        return payload.id == form.build_payload;
    })[0]
    form.destination = destinations.filter(destination => {
        return destination.id == form.build_destination;
    })[0]
    form.fuel = ((form.engine.weight + form.payload.weight) / form.engine.power) * (form.destination.distance / Math.pow(1.496, 8));
    form.cost = Math.floor(form.computer.cost + form.engine.cost + form.payload.cost + (form.fuel * .16));
    if (!rockets.filter(rocket => {
            return rocket.id == form.name.hashCode()
        }).length > 0) {
        rockets.push(new Rocket(form.name, form.engine, form.computer, form.payload, form.destination, form.cost));
        balance -= Math.floor(form.cost);
    } else {
        alert("A rocket with that name already exists")
    }
    update_balance();
}

function calcBuildCost() {
    let form = document.querySelector('#build_form');
    form = objectifyForm(form);

    form.computer = computers.filter(computer => {
        return computer.id == form.build_computer;
    })[0]
    form.engine = engines.filter(engine => {
        return engine.id == form.build_engine;
    })[0]
    form.payload = payloads.filter(payload => {
        return payload.id == form.build_payload;
    })[0]
    form.destination = destinations.filter(destination => {
        return destination.id == form.build_destination;
    })[0]
    form.fuel = ((form.engine.weight + form.payload.weight) / form.engine.power) * (form.destination.distance / Math.pow(1.496, 8));
    form.cost = Math.floor(form.computer.cost + form.engine.cost + form.payload.cost + (form.fuel * .16));

    replicate("tpl_build_cost", [{
        cost: comma(Math.floor(form.cost)),
        fuel: comma(Math.floor(form.fuel))
    }])
}

var launch_rocket;

function launchRocket(e) {
    e.preventDefault();

    if (!launch_rocket) {
        print("No rocket was selected. Aborting...")
        return;
    }

    // Check for mission failure
    let launch_cost = Math.floor(launch_rocket.cost / 2);
    let destination = launch_rocket.destination.id;
    let body;
    bodies.forEach(b => {
        if (b.id === destination) body = b;
    });

    if (!body) return;
    if (launch_rocket.payload.id == "mesh") {
        if (body.mesh >= 10) {
            print(" | Only 10 mesh satellites allowed per body")
            return;
        } else {
            body.mesh++;
        }
    }
    if (launch_rocket.payload.id == "fat_guy") {
        if (body.explored) {
            print(" | Only 1 Fat Guy allowed per body")
            return;
        } else {
            body.explored = true;
        }
    }

    if (balance - launch_cost < 0) {
        print("not enough money to launch " + launch_rocket.name);
        return;
    }


    body.satellites.push(launch_rocket);
    balance -= launch_cost;
    overall_cost += launch_cost / 5;
    update_balance();
    print(launch_rocket.name + " launched");
}

function print(txt) {
    let el = document.createElement('p');
    let launch_console = document.querySelector("#launch_console");
    el.innerText = formatDate(new Date()) + " | " + txt;
    launch_console.prepend(el);
}

function calcLaunch() {
    let form = document.querySelector('#launch_form');
    form = objectifyForm(form);
    let rocket = rockets.filter(rocket => {
        return rocket.id == form.rocket_id;
    })[0]
    launch_rocket = rocket;
}

function update_balance() {
    replicate("tpl_balance", [{
        balance: comma(balance)
    }]);
}

function drawMap() {
    bodies.forEach(body => {
        body.prepared_income = comma(body.income);
    })
    replicate('tpl_bodies', bodies, (e, d, i) => {

        // XXX redo this whole thing so it grabs values dynamically. Preferably not at 2AM
        let sats = [];
        let mesh_count = 0;
        let mesh_income = 0;
        let probe_count = 0;
        let probe_income = 0;
        d.satellites.forEach(sat => {
            if(sat.payload.id == "fat_guy"){
                sats.push({payload_name: "Fat guy in a little coat", sat_income: comma(sat.payload.income * Math.floor(12000 / 365) ) })
            }

            if(sat.payload.id == "mesh"){
                mesh_count++;
                mesh_income += sat.payload.income;
            }

            if(sat.payload.id == "probe"){
                probe_count++;
                probe_income += sat.payload.income;
            }
        })
        sats.push({payload_name: "Mesh Network "  + mesh_count + "/10", sat_income: comma(mesh_income * Math.floor(12000 / 365))})
        sats.push({payload_name: "Probes "  + probe_count, sat_income: comma(probe_income * Math.floor(12000 / 365))})
        replicate("tpl_" + d.id + "_satellites", sats);
    });
}

var month_tick = 0,
    year_tick = 0;

function update(now) {
    tick += 1;
    month_tick += .1;
    if (month_tick > 100) month_tick = 0;
    year_tick += 0.0083;
    if (year_tick > 100) year_tick = 0;
    // Add budget each year, this increases/decreases based on progress/success of missions
    if (tick % year === 0) {
        balance += budget
    }
    // Remove maitenence cost each month
    if (tick % 1000 === 0) {
        balance -= Math.floor(overall_cost);
        update_balance();
    }
    // One day
    if (tick % Math.floor(12000 / 365) === 0) {
        bodies.forEach(body => {
            body.income = 0;
            body.satellites.forEach(sat => {
                body.income += (sat.payload.income * Math.floor(12000 / 365));
            })
            balance += body.income;
        })
        update_balance();
    }
    replicate("tpl_budget", [{
        cost: comma(Math.floor(overall_cost)),
        budget: comma(Math.floor(budget))
    }])
    let month = document.getElementById("month");
    month.style.width = month_tick + "%";
    let year_bar = document.getElementById("year");
    year_bar.style.width = year_tick + "%";
    window.raf(update);
}

// Add eventListeners to menu links
function menu() {
    let items = document.querySelectorAll('footer p');
    items.forEach(item => {
        let page = item.dataset.page;
        item.addEventListener('click', ic => {
            let links = document.querySelectorAll('footer p');
            links.forEach(link => {
                link.classList.remove("active");
            })
            ic.currentTarget.classList.add("active");
            Nav(page);
        })
    })
}

map_page = () => {
    console.log("Map Page");
    drawMap();
}
research_page = () => {
    console.log("Research Page");
    research.forEach(r => {
        r.comma_cost = comma(r.cost);
    })
    replicate("tpl_research", research, (e, d, i) => {
        e.style.display = d.active ? "none" : "flex";
        e.addEventListener("click", rc => {
            do_research(d.id);
            Nav("research")
        })
    });
}
build_page = () => {
    console.log("Build Page");
    replicate('tpl_build_engine_option', engines);
    replicate('tpl_build_computer_option', computers);
    replicate('tpl_build_payload_option', payloads);
    replicate('tpl_build_destination_option', destinations);
    replicate("tpl_build_cost", []);

    calcBuildCost();
}
launch_page = () => {
    console.log("Launch Page");
    rockets.forEach(rocket => {
        rocket.comma_cost = comma(Math.floor(rocket.cost / 2));
    })
    replicate('tpl_launch_rocket_option', rockets);
    calcLaunch();
}

// Navigate to a page on menu item click
function Nav(p) {
    update_balance();
    let pages = document.querySelectorAll('.page');
    let active;
    pages.forEach(page => {
        page.style.display = "none";
        if (page.dataset.page == p) active = page;
    })
    if (active) active.style.display = "block";
    window[p + "_page"]();
}

function init() {
    update_balance();
    // Make Earth
    bodies.push(new Body("earth", "Earth"))
    bodies.push(new Body("earth_moon", "Earth Moon"))
    bodies.push(new Body("mars", "Mars"))
}

document.addEventListener("DOMContentLoaded", dcl => {
    init();
    menu();
    Nav("map");
    window.raf(update);
})


// UTILS
function objectifyForm(formArray) { //serialize data function
    var returnArray = {};
    for (var i = 0; i < formArray.length; i++) {
        returnArray[formArray[i]['name']] = formArray[i]['value'];
    }
    return returnArray;
}

String.prototype.hashCode = function () {
    var hash = 0,
        i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function comma(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(date) {
    let d = date.toISOString().slice(0, 19).replace('T', ' ');

    return d;
}