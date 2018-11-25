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

var engines = [{
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
// This will probably get very large
var payloads = [{
        id: "probe",
        name: "Body Probe",
        weight: 5,
        income: 25,
        cost: 25000,
        engine_id: "prb",
        computer_id: 'volta'
    },
    {
        id: "mesh",
        name: "Mesh Network Sattelite",
        weight: 15,
        income: 50,
        cost: 75000,
        engine_id: "mk1",
        computer_id: 'volta'
    },
    {
        id: "fat_guy",
        name: "Fat guy in a little coat",
        weight: 35,
        income: 500,
        cost: 100000,
        engine_id: "mk2",
        computer_id: 'volta'
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
    {
        id: "io",
        name: "IO",
        distance: 588000000
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
        drawMap();
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

class Body {
    constructor(id, name) {
        this.id = id, this.name = name, this.income = 0, this.cost = 0;
        this.satellites = [], this.installations = [], this.mesh = 0,
            this.buildings = 0, this.probe = 0;
    }
}

function update_balance() {
    replicate("tpl_balance", [{
        balance: comma(balance)
    }]);
}

function drawMap() {
    bodies.forEach(body => {
        body.cost = 0;
        body.income = 0;
        for(let i = 0; i < body.probe; i++){
            let payload;
            payloads.filter(p => {
                if (p.id == "probe") payload = p;
            });
            let cost = calc_payload_cost(payload, body).cost
            console.log(cost);
            body.cost += Math.floor(cost / 10);
            body.income += (payload.income * Math.floor(12000 / 365));
        }
        for(let m = 0; m < body.mesh; m++){
            let payload;
            payloads.filter(p => {
                if (p.id == "mesh") payload = p;
            });
            let cost = calc_payload_cost(payload, body).cost
            console.log(cost);
            body.cost += Math.floor(cost / 10);
            body.income += (payload.income * Math.floor(12000 / 365));
        }
        console.log(body.cost)
        body.prepared_income = comma(body.income);
        body.prepared_cost = comma(body.cost);
    })
    replicate('tpl_bodies', bodies, (e, d, i) => {
        // replicate possible actions for body
        let probe = false,
            mesh = false,
            buildings = false;
        let body = d;
        if (body.probe == 0) probe = true;
        if (body.probe > 0 && body.mesh < 10) mesh = true;
        if (body.mesh == 10 && body.buildings < 10) buildings = true;
        let actions = [];
        if (probe) actions.push({
            action_id: "probe",
            action_name: "Launch Probe",
            action_cost: comma(calc_payload_cost(massage_payload("probe", body), body).cost),
            info: "Let's you launch a probe that will orbit the intended celestial body and allow you to send mesh network satellites",
            action: () => {
                launch("probe", body)
            }
        });
        if (mesh) actions.push({
            action_id: "mesh",
            action_name: "Launch Mesh Satellite",
            action_cost: comma(calc_payload_cost(massage_payload("mesh", body), body).cost),
            action: () => {
                launch("mesh", body)
            }
        });
        if (buildings) actions.push({
            action_id: "building",
            action_name: "Launch random building name",
            action: () => {
                launch("random_building", body)
            }
        });
        replicate("tpl_" + body.id + "_actions", actions, (ee, dd, ii) => {
            ee.addEventListener('click', ec => {
                console.log(dd);
                dd.action();
                drawMap();
                update_balance();
            })
        })
        replicate("tpl_mesh_count", [{
            mesh_count: body.mesh
        }]);
    });
}
function calc_payload_cost(payload, body) {
    let fuel = ((payload.engine.weight + payload.weight) / payload.engine.power) * (payload.destination.distance / Math.pow(1.496, 8));
    let cost = Math.floor(payload.computer.cost + payload.engine.cost + payload.cost + (fuel * .16));
    return {fuel: fuel, cost: cost}
}
function massage_payload(id, body) {
    let payload;
    payloads.filter(p => {
        if (p.id == id) payload = p;
    });
    engines.filter(engine => {
        if (engine.id == payload.engine_id) payload.engine = engine
    });
    computers.filter(computer => {
        if (computer.id == payload.computer_id) payload.computer = computer
    });
    destinations.filter(destination => {
        if (destination.id == body.id) payload.destination = destination
    });
    return payload;
}
function launch(id, body) {
    let payload = massage_payload(id, body);
    let cost = calc_payload_cost(payload, body).cost;

    // DO NO ACTION BEFORE CHECK
    // calc cost to launch
    // substract cost to launch from balance
    // add cost to overall cost
    // add income to body income and cost to body cost
    if (balance - cost < 0) return;
    body[id]++;
    balance -= cost;
    overall_cost += cost / 10;
    body.cost += Math.floor(cost / 10);
    body.income += (payload.income * Math.floor(12000 / 365));
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
            balance += body.income;
        })
        update_balance();
    }
    `   `
    replicate("tpl_budget", [{
        cost: comma(Math.floor(overall_cost)),
        budget: comma(Math.floor(budget))
    }])
    let month = document.getElementById("month");
    month.style.height = month_tick + "%";
    let year_bar = document.getElementById("year");
    year_bar.style.height = year_tick + "%";
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
    destinations.forEach(destination => {
        bodies.push(new Body(destination.id, destination.name));
    })
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