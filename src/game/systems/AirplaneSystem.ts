import gsap from 'gsap';
import { Sprite } from 'pixi.js';
import type { Game } from '../Game';
import type { System } from '../SystemRunner';

/** A system that handles the airplane sprite and physics. */
export class AirplaneSystem implements System {
    /**
     * A unique identifier used by the system runner.
     */
    public static SYSTEM_ID = 'airplane';

    /**
     * The instance of the game the system is attached to.
     * This is automatically set by the system runner when the system is added to the game.
     */
    public game!: Game;

    /** The airplane sprite */
    public airplane!: Sprite;

    private _screenWidth = 0;
    private _screenHeight = 0;

    // Physics properties (like Jetpack Joyride)
    private _velocityY = 0;
    private readonly _gravity = 0.6; // Pulls down
    private readonly _thrust = -1.2; // Upward force when space pressed
    private readonly _maxVelocityDown = 15; // Terminal velocity falling
    private readonly _maxVelocityUp = -15; // Max upward speed

    // Horizontal movement (sigmoid)
    private readonly _a = 4;
    private readonly _b = 2;
    private readonly _maxSpeedX = 5;

    private _isThrusting = false;
    private _hasStarted = false;

    private readonly _initialMovementDistance = 200; // Move right for 200 pixels before locking
    private _cameraLocked = false;

    private _currentSpeedX = 0;

    private _manualCameraUnlock = false;

    /** Called when the system is added to the game. */
    public init() {
        // Create airplane sprite
        this.airplane = Sprite.from('airplane_moving_flipped.png');
        this.airplane.anchor.set(0.5, 0.5); // Center anchor for rotation

        // Add airplane to game container
        this.game.addToGame(this.airplane);

        console.log('AirplaneSystem: Initialized');
    }

    /** Called when the game is being awoken. */
    public awake() {
        // Position airplane at starting point
        this.airplane.x = -this._screenWidth * 0.4; // NEGATIVE for left side (since container is centered)
        this.airplane.y = -this._screenHeight * 0.2; // NEGATIVE for up from bottom
        this.airplane.rotation = 0;
        this._velocityY = 0;
        this._hasStarted = false;
        console.log('AirplaneSystem: Awake at', this.airplane.x, this.airplane.y);
    }

    /** Unlock camera manually (called by LandingSystem) */
    public unlockCamera() {
        this._manualCameraUnlock = true;
        console.log('AirplaneSystem: Camera manually unlocked for landing');
    }

    /** Check if currently thrusting */
    public isThrusting(): boolean {
        return this._isThrusting;
    }

    /** Called when the game starts. */
    public start() {
        this._hasStarted = true;
        console.log('AirplaneSystem: Started');
    }

    /**
     * Called every frame.
     * @param delta - The time elapsed since the last update.
     */
    public update(delta: number) {
        if (!this._hasStarted) return;

        // === VERTICAL MOVEMENT (Jetpack Joyride style) ===

        // Apply thrust or gravity
        this._velocityY += this._gravity * delta; // Gravity pulls down
        if (this._isThrusting) {
            this._velocityY += this._thrust; // Instant upward velocity when pressing
        }
        // Clamp velocity
        this._velocityY = Math.max(this._maxVelocityUp, Math.min(this._maxVelocityDown, this._velocityY));

        // Update Y position
        this.airplane.y += this._velocityY * delta;

        // Keep airplane on screen (boundary check)
        const margin = 100;
        const topLimit = -this._screenHeight + margin; // Top of screen (negative)
        const bottomLimit = -margin - 100; // Bottom of screen (less negative)

        if (this.airplane.y < topLimit) {
            this.airplane.y = topLimit;
            this._velocityY = 0;
        }
        if (this.airplane.y > bottomLimit) {
            this.airplane.y = bottomLimit;
            this._velocityY = 0;
        }

        // === HORIZONTAL MOVEMENT (Sigmoid acceleration) ===

        const t = this.game.timeElapsed;
        const speedFactor = 1 / (1 + Math.exp(-(this._a * t - this._b)));
        const speedX = speedFactor * this._maxSpeedX;

        // update distance
        let distance = this.game.stats.get('distance');
        const timeSeconds = delta / 60;
        distance += timeSeconds * speedX;

        // Check if airplane has moved far enough to lock camera
        const startX = -this._screenWidth * 0.3;
        const distanceMoved = this.airplane.x - startX;
        // Check if airplane should still move right or if camera should follow
        if (!this._cameraLocked || this._manualCameraUnlock) {
            // Initial phase: Airplane moves right
            this.airplane.x += speedX * delta;

            if (distanceMoved >= this._initialMovementDistance) {
                this._cameraLocked = true;
            }
        }
        // If camera is locked, airplane stays in place and world moves instead
        // (ScrollingSystem handles moving the background)

        // Calculate and expose speed for ScrollingSystem to use
        this._currentSpeedX = speedX * delta;

        // === UPDATE STATS ===

        this.game.stats.set('distance', distance);
    }

    // Add this getter (after update method):
    /** Get current horizontal speed for scrolling system */
    public getCurrentSpeedX(): number {
        return this._currentSpeedX;
    }

    /** Get camera locked state, accounting for manual unlock */
    public isCameraLocked(): boolean {
        if (this._manualCameraUnlock) {
            return false; // Camera is unlocked during landing
        }
        return this._cameraLocked;
    }

    /** Called when the game ends. */
    public end() {
        this._hasStarted = false;
        this._isThrusting = false;
        console.log('AirplaneSystem: Ended');
    }

    /** Resets the state of the system back to its initial state. */
    public reset() {
        this.airplane.x = this._screenWidth * 0.2;
        this.airplane.y = this._screenHeight * 0.7;
        this.airplane.rotation = 0;
        this._velocityY = 0;
        this._hasStarted = false;
        this._isThrusting = false;
        this._cameraLocked = false;
        this._manualCameraUnlock = false;
        this._currentSpeedX = 0;
        console.log('AirplaneSystem: Reset');
    }

    /**
     * Gets called every time the screen resizes.
     * @param w - width of the screen.
     * @param h - height of the screen.
     */
    public resize(w: number, h: number) {
        this._screenWidth = w;
        this._screenHeight = h;
    }

    /** Called by FlightControlSystem when space is pressed */
    public startThrust() {
        this._isThrusting = true;
    }

    /** Called by FlightControlSystem when space is released */
    public stopThrust() {
        this._isThrusting = false;
    }

    /** Takeoff animation (called once at game start) */
    public async takeoff() {
        console.log('AirplaneSystem: Taking off');
        await gsap.to(this.airplane, {
            y: this._screenHeight * 0.4, // Rise to cruising altitude
            duration: 2,
            ease: 'power2.out',
        });
    }
}
