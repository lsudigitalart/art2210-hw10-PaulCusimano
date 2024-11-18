// Paul Cusimano Homework 10
// The goal is a simulation of stars that collide and merge

let particles = [];
const INITIAL_PARTICLES = 700;
const INITIAL_RADIUS = 5;
const SPLIT_THRESHOLD = 60;
const SPLIT_PARTICLES = 30;
const SPLIT_COOLDOWN = 30; // how mant frames to wait before merging to prevent lag

const STAR_TYPES = [
  { minRadius: 2, color: [255, 80, 80] },    // red dwarf
  { minRadius: 8, color: [255, 160, 80] },   // orange dwarf
  { minRadius: 15, color: [255, 255, 180] }, // yellow star
  { minRadius: 30, color: [235, 245, 255] }, // white star
  { minRadius: 45, color: [150, 170, 255] }  // blue giant
];

function setup() {
  createCanvas(600, 600);
  initializeParticles();
}

// creates all the initial stars with ranom positions and velocities
function initializeParticles() {
  particles = [];
  for (let i = 0; i < INITIAL_PARTICLES; i++) {
    particles.push(new Particle(
      random(width),
      random(height),
      INITIAL_RADIUS,
      random(-2, 2),
      random(-2, 2)
    ));
  }
}

function draw() {
  background(0);
  
  // update and check collisions
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].edges();
    particles[i].display();
    
    // check collisions with other particles
    for (let j = particles.length - 1; j > i; j--) {
      particles[i].collide(particles[j], i, j);
    }
    
    // check if splitting
    if (particles[i].radius > SPLIT_THRESHOLD) {
      splitParticle(i);
    }
  }
}

class Particle {
  constructor(x, y, r, vx, vy) {
    this.position = createVector(x, y);
    this.velocity = createVector(vx, vy);
    this.radius = r;
    this.mass = PI * r * r; // mass is proportional to area
    this.splitCooldown = 0;
  }

  update() {
    this.position.add(this.velocity);
    if (this.splitCooldown > 0) {
      this.splitCooldown--;
    }
  }

  // border bouncing
  edges() {
    if (this.position.x < this.radius) {
      this.position.x = this.radius;
      this.velocity.x *= -1;
    }
    if (this.position.x > width - this.radius) {
      this.position.x = width - this.radius;
      this.velocity.x *= -1;
    }
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.velocity.y *= -1;
    }
    if (this.position.y > height - this.radius) {
      this.position.y = height - this.radius;
      this.velocity.y *= -1;
    }
  }

  collide(other, i, j) {
    let distance = this.position.dist(other.position);
    let minDist = this.radius + other.radius;
    
    // only collide none of particle is in cooldown
    if (distance < minDist && this.splitCooldown === 0 && other.splitCooldown === 0) {
      let absorber, absorbed;
      if (this.mass > other.mass || (this.mass === other.mass && random() < 0.5)) {
        absorber = this;
        absorbed = other;
        particles.splice(j, 1);
      } else {
        absorber = other;
        absorbed = this;
        particles.splice(i, 1);
      }
      
      //  give the mass and velocity to the bigger particle
      let totalMass = absorber.mass + absorbed.mass;
      let newVel = p5.Vector.add(
        p5.Vector.mult(absorber.velocity, absorber.mass),
        p5.Vector.mult(absorbed.velocity, absorbed.mass)
      ).div(totalMass);
      
      // update the big particle instead of making a new one 
      // cause its less jarring to see the particle teleport
      absorber.velocity = newVel;
      absorber.mass = totalMass;
      absorber.radius = sqrt(totalMass / PI);
    }
  }

  getStarColor() {
    for (let i = STAR_TYPES.length - 1; i >= 0; i--) {
      if (this.radius >= STAR_TYPES[i].minRadius) {
        return STAR_TYPES[i].color;
      }
    }
    return STAR_TYPES[0].color;
  }

  display() {
    let col = this.getStarColor();
    noStroke();
    fill(col[0], col[1], col[2]);
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }
}

// create new smaller stars from bigger stars
// in a sort of 'explosion' effect
function splitParticle(index) {
  let parent = particles[index];
  let newRadius = parent.radius / sqrt(SPLIT_PARTICLES);
  
  for (let i = 0; i < SPLIT_PARTICLES; i++) {
    let angle = (TWO_PI / SPLIT_PARTICLES) * i + random(-0.2, 0.2);
    let speed = random(2, 4); // Increas speed
    let distance = parent.radius * 2; 
    
    let newParticle = new Particle(
      parent.position.x + cos(angle) * distance,
      parent.position.y + sin(angle) * distance,
      newRadius,
      cos(angle) * speed,
      sin(angle) * speed
    );
    
    newParticle.splitCooldown = SPLIT_COOLDOWN; // add cooldown
    particles.push(newParticle);
  }
  
  particles.splice(index, 1);
}