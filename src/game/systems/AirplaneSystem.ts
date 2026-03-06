// src/flight/systems/AirplaneSystem.ts

import gsap from 'gsap';
import { Sprite } from 'pixi.js';
import type { Flight } from '../Flight';

export class AirplaneSystem {
    public airplane: Sprite;
    private _flight: Flight;
    private _screenWidth = 0;
    private _screenHeight = 0;

    // Sigmoid parameters
    private readonly _a = 2;
    private readonly _b = 2;
    private readonly _maxSpeed = 5;

    constructor(flight: Flight) {
        this._flight = flight;

        // Create airplane sprite
        this.airplane = Sprite.from('airplane_moving.jpg');
        this.airplane.anchor.set(0.5, 1);
    }

    public init() {
        this._flight.addToFlight(this.airplane);
    }

    public awake() {
        // Position airplane at starting point (on runway)
        this.airplane.x = this._screenWidth * 0.2;
        this.airplane.y = this._screenHeight * 0.65;
    }

    public async takeoff() {
        // Animate airplane rising to cruising altitude
        await gsap.to(this.airplane, {
            y: this._screenHeight * 0.2,
            duration: 3,
            ease: 'power2.inOut',
        });
    }

    public start() {
        console.log('AirplaneSystem: Started');
    }

    public update(delta: number) {
        // Calculate speed using sigmoid
        const t = this._flight.timeElapsed;
        const speed = 1 / (1 + Math.exp(-(this._a * t - this._b)));

        // Move airplane horizontally
        this.airplane.x += speed * this._maxSpeed * delta;

        // Update distance stat
        this._flight.stats.set('distance', Math.floor(this.airplane.x / 10));
    }

    public end() {
        // Cleanup
    }

    public reset() {
        this.airplane.x = this._screenWidth * 0.2;
        this.airplane.y = this._screenHeight * 0.65;
        this.airplane.rotation = 0;
    }

    public resize(w: number, h: number) {
        this._screenWidth = w;
        this._screenHeight = h;
    }

    public enabled(value: boolean) {
        // Enable/disable system if needed
    }
}
