'use strict';

var T = 0; // Global tick rate that everything needs to be aware of
var FPS = 120; // FPS lock

/*	A task is something that needs to be done in the game world
 *	Name 		- String name of the task
 *	Job  		- Function what doing this task entails
 *	Time		- Number the amount of time it should take to complete this task
 *  Example		- new Task("Make Steel", makeSteel, SteelMine, 11.5);
 */
class Task {
    constructor(name = String, job = Function, time = Number, cb = Function) {
        this.name = name;
        this.job = job;
        this.time = time;
        this.counter = time;
        this.cb = cb.bind();
    }
    tick() {
        let self = this;
        if (self.cb) {
            self.cb(self.counter);
        }
        if (self.counter <= 0) {
            return 1;
        } else {
            self.counter--;
            return 0;
        }
    }
}

class Tasks {
    constructor() {
        this.holding = [];
    }
    add(t = Task) {
        if (this.holding.length == 20) return;
        this.holding.push(t);
    }
    remove(t) {
        let self = this;
        if (t) {
            self.holding.splice(self.holding.indexOf(t), 1);
            return null;
        } else {
            t = self.holding[0];
            if (!t) return null;
            let tmp_task = self.holding[0];
            self.holding.splice(self.holding.indexOf(t), 1);
            return tmp_task;
        }
    }
    clear() {
        // clears every task
        this.holding = [];
    }
}

var tasks = new Tasks();

/* A bot is simple in that it just runs through every available tasks
 */
class Bot {
    constructor(speed = 1) {
        this.task = null;
        this.speed = speed;
    }
    tick() {
        // I only get to actually work at my speed
        let self = this;

        if (T % Math.floor(FPS / self.speed) != 0) {
            return;
        }
        if (self.task) {
            let done = self.task.tick();
            if (done == 1) {
                self.task.job();
                self.task = null;
            }
        } else {
            self.task = tasks.remove();
        }
    }
}

var bots = [];
bots.push(new Bot(1)); // normal bot = 1/s

//tasks.add(new Task("Make Steel", () => { Resources.Steel += 100 }, 12));
//tasks.add(new Task("Make Oxygen", () => { Resources.Oxygen += 1000 }, 5));