'use strict';
class Vector {
	constructor(x=0, y=0) {
	    this.x = x;
	    this.y = y;
	}
	plus(vector) {
	    if (!(vector instanceof Vector)) {
	    	throw new Error('Можно прибавлять к вектору только вектор типа Vector');
	    }
	    return new Vector(this.x + vector.x, this.y + vector.y);
	}
	times(multiplier) {
	    return new Vector(this.x*multiplier, this.y*multiplier);
	}
}

class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
	    this.pos = pos;
	    this.size = size;
	    this.speed = speed;
	    if (!(pos instanceof Vector)) {
	    	throw new Error('Аргумент расположения должен быть объектом типа Vector');
	    }
	    if (!(size instanceof Vector)) {
	    	throw new Error('Аргумент размера должен быть объектом типа Vector');
	    }
	    if (!(speed instanceof Vector)) {
	    	throw new Error('Аргумент скорости должен быть объектом типа Vector');
	    }
	}
	get left() {
	    return this.pos.x;
	}
	get top() {
	    return this.pos.y;
	}
	get right() {
	    return this.pos.x + this.size.x;
	}
	get bottom() {
	    return this.pos.y + this.size.y;
	}
	get type() {
	    return 'actor';
	}
	act() {}
	isIntersect(actor) {
		if (!(actor instanceof Actor) || (actor === undefined)) {
			throw new Error('Объект должен быть объектом типа Actor');
		}
		if (this === actor) {
			return false;
		} else if (this.bottom <= actor.top || this.top >= actor.bottom || this.left >= actor.right || this.right <= actor.left) {
			return false;
		} else {
			return true;
		}
	}
}

class Level {
	constructor(grid=[], actors=[]) {
	    this.grid = grid;
	    this.actors = actors;
	    this.player = actors.find(actor => actor.type === 'player');
	    this.height = grid.length;
	    if(this.height <= 0) {
	    	this.width = 0;
	    } else {
	    	this.width = grid.map(array => array.length).sort()[0];
	    }
	    this.status = null;
	    this.finishDelay = 1;
	}
	isFinished() {
		if(this.status !== null && this.finishDelay < 0) {
			return true;
		}
		return false;
	}
	actorAt(object) {
		if(object === undefined || !(object instanceof Actor)) {
			throw new Error('Не передан аргумент или аргумент не объект типа Actor');
		}
		for (let actor of this.actors) {
			if (actor.isIntersect(object)) {
				return actor;
			}
		}
		return undefined;
	}
	obstacleAt(position, size) {
		if (!(position instanceof Vector)) {
			throw new Error('Аргумент расположения должен быть объектом типа Vector');
		}
		if (!(size instanceof Vector)) {
			throw new Error('Аргумент размера должен быть объектом типа Vector');
		}
		
		var beginX = Math.floor(position.x);
		var endX = Math.ceil(position.x + size.x);
		var beginY = Math.floor(position.y);
		var endY = Math.ceil(position.y + size.y);

		
		if(beginX < 0 || endX > this.width || beginY < 0) {
			return 'wall';
		}
		if(endY > this.height) {
			return 'lava';
		}

		for(let y = beginY; y < endY; y++) {
			for(let x = beginX; x < endX; x++) {
				if(this.grid[y][x]) {
					return this.grid[y][x];
				}
			}
		}
		return undefined;
	}
	removeActor(object) {
		// for(let x=0; x < this.actors.length; x++) {
		// 	if(object === this.actors[x]) {
		// 		this.actors.splice(x, 1);
		// 	}
		// }
		this.actors = this.actors.filter(actor => actor !== object);
	}
	noMoreActors(objectType) {
		for(var actor of this.actors) {
			if(actor.type === objectType) {
				return false;
			}
		}
		return true;
	}
	playerTouched(objectType, object) {
		if(this.status === null) {
			if(objectType === 'lava' || objectType === 'fireball') {
				this.status = 'lost';
			} else if(objectType === 'coin') {
				this.removeActor(object);
				if(this.noMoreActors('coin')) {
					this.status = 'won';
					this.finishDelay = 1;
				}
			}
		}
	}
}

class LevelParser {
	constructor(dict) {
		this.dict = dict;
	}
	actorFromSymbol(symbol) {
		if(symbol) {
			if(Object.keys(this.dict).includes(symbol)) {
				return this.dict[symbol];
			} else {
				return undefined;
			}
		} else {
			return undefined;
		}
	}
	obstacleFromSymbol(symbol) {
		if(symbol === 'x') {
			return 'wall';
		} else if(symbol === '!') {
			return 'lava';
		} else {
			return undefined;
		}
	}
	createGrid(plan) {
		if(plan.length === 0) {
			return plan;
		} else {
			let newPlan = plan.map(symbolArray => symbolArray.split(''));
			return newPlan.map(row => row.map(symbol => this.obstacleFromSymbol(symbol)));
		}
	}
	createActors(plan) {
		let actorList = [];
		if(this.dict) {
			for(let i = 0; i < plan.length; i++) {
				plan[i].split('');
				for(let j = 0; j < plan[i].length; j++) {
					if (typeof(this.dict[plan[i][j]]) === 'function') {
						var actor = new this.dict[plan[i][j]](new Vector(j, i));
						if (actor instanceof Actor) {
							actorList.push(actor);
						}
					}
				}
			}
		}
		return actorList;
	}
	parse(plan) {
		return new Level(this.createGrid(plan), this.createActors(plan));
	}
}
 
class Fireball extends Actor {
	constructor(pos = new Vector(), speed = new Vector()) {
		super(pos, new Vector(1, 1), speed);
	}
	get type() {
	    return 'fireball';
	  }
	getNextPosition(time = 1) {
		let newPosX = this.pos.x + this.speed.x * time;
		let newPosY = this.pos.y + this.speed.y * time;
		return new Vector(newPosX, newPosY);
	}
	handleObstacle() {
		this.speed.x = -this.speed.x;
		this.speed.y = -this.speed.y;
	}
	act(time, level) {
		let newPos = this.getNextPosition(time);
		if(level.obstacleAt(newPos, this.size)) {
			return this.handleObstacle();
		} else {
			this.pos = newPos;
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos) {
		super(pos, new Vector(2, 0));
	}
}

class VerticalFireball extends Fireball {
	constructor(pos) {
		super(pos, new Vector(0, 2));
	}
}

class FireRain extends Fireball {
	constructor(pos) {
		super(pos, new Vector(0, 3));
		this.startPos = pos;
	}
	handleObstacle() {
		this.pos = this.startPos;
	}
}

class Coin extends Actor {
	constructor(pos = new Vector(0, 0)) {
		let vector = new Vector(0.2, 0.1);
		super(pos.plus(vector), new Vector(0.6, 0.6));
		this.newPos = this.pos;
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * Math.PI;
	}
	get type() {
	    return 'coin';
	}
	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	}
	getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}
	getNextPosition(time = 1) {
		this.updateSpring(time);
		return this.newPos.plus(this.getSpringVector());
	}
	act(time) {
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
	constructor(pos = new Vector(0, 0)) {
		let vector = new Vector(0, -0.5);
		super(pos.plus(vector), new Vector(0.8, 1.5), new Vector(0, 0));
	}
	get type() {
	    return 'player';
	}
}
