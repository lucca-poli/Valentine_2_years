import { Sprite } from 'pixi.js';
import type { Game } from '../Game';
import type { System } from '../SystemRunner';
import { AirplaneSystem } from './AirplaneSystem';
import { GameOverSystem } from './GameOverSystem';
import { FlightControlSystem } from './FlightControlSystem';

/** A system that handles the landing sequence when reaching destination. */
export class LandingSystem implements System {
    /**
     * A unique identifier used by the system runner.
     */
    public static SYSTEM_ID = 'landing';

    /**
     * The instance of the game the system is attached to.
     * This is automatically set by the system runner when the system is added to the game.
     */
    public game!: Game;

    /** The destination runway sprite (flipped) */
    public destinationRunway!: Sprite;

    /** Distance threshold to trigger landing sequence */
    private readonly _landingDistance = 170; // Adjust this value

    /** Flag to track if landing sequence has started */
    private _landingStarted = false;

    /** Flag to track if camera has been unlocked */
    private _cameraUnlocked = false;

    /** Target Y position for landing (same as initial spawn) */
    private _landingY = 0;

    /** Flag to track if runway has reached the corner */
    private _runwayInPosition = false;

    private _screenWidth = 0;
    private _screenHeight = 0;

    /** Called when the system is added to the game. */
    public init() {
        // Create destination runway sprite (flipped)
        this.destinationRunway = Sprite.from('airport_runway_flipped.png');
        this.destinationRunway.anchor.set(1, 1); // Bottom-right anchor
        this.destinationRunway.scale.set(2.5);
        this.destinationRunway.zIndex = 0; // Behind airplane

        // Add to game container
        this.game.addToGame(this.destinationRunway);

        // Hide initially
        this.destinationRunway.visible = false;

        console.log('LandingSystem: Initialized');
    }

    /** Called when the game is being awoken. */
    public awake() {
        this._landingStarted = false;
        this._cameraUnlocked = false;
        this._runwayInPosition = false;
        this.destinationRunway.visible = false;

        // Store landing target Y (same as airplane's initial Y)
        this._landingY = -this._screenHeight * 0.2;

        console.log('LandingSystem: Awake');
    }

    /** Called when the game starts. */
    public start() {
        console.log('LandingSystem: Started');
    }

    /**
     * Called every frame.
     * @param delta - The time elapsed since the last update.
     */
    public update(delta: number) {
        const distance = this.game.stats.get('distance') || 0;
        const airplaneSystem = this.game.systems.get(AirplaneSystem);

        // Check if we should start landing sequence
        if (!this._landingStarted && distance >= this._landingDistance) {
            this._startLandingSequence();
        }

        // If landing has started, move runway toward screen
        if (this._landingStarted && !this._runwayInPosition) {
            this._updateRunwayPosition(airplaneSystem);
        }

        // If camera is unlocked, handle auto-landing
        if (this._cameraUnlocked && this._runwayInPosition) {
            this._handleAutoLanding(delta, airplaneSystem);
        }
    }

    /** Called when the game ends. */
    public end() {
        console.log('LandingSystem: Ended');
    }

    /** Resets the state of the system back to its initial state. */
    public reset() {
        this._landingStarted = false;
        this._cameraUnlocked = false;
        this._runwayInPosition = false;
        this.destinationRunway.visible = false;
        console.log('LandingSystem: Reset');
    }

    /**
     * Gets called every time the screen resizes.
     * @param w - width of the screen.
     * @param h - height of the screen.
     */
    public resize(w: number, h: number) {
        this._screenWidth = w;
        this._screenHeight = h;

        // Store landing Y position
        this._landingY = -this._screenHeight * 0.025;
    }

    /** Check if landing sequence is active */
    public isLanding(): boolean {
        return this._landingStarted;
    }

    /** Start the landing sequence */
    private _startLandingSequence() {
        this._landingStarted = true;
        console.log('LandingSystem: Starting landing sequence');

        // Show destination runway far to the right
        this.destinationRunway.visible = true;
        this.destinationRunway.x = 1600; // Start far off-screen to the right
        this.destinationRunway.y = 0; // Same level as landing target

        // Disable game over checks during landing
        this.game.systems.get(GameOverSystem).enabled(false);
    }

    /** Update runway position, moving it toward the screen */
    private _updateRunwayPosition(airplaneSystem: AirplaneSystem) {
        // Move runway toward screen at airplane's speed
        const airplaneSpeedX = airplaneSystem.getCurrentSpeedX();
        this.destinationRunway.x -= airplaneSpeedX;

        // Check if runway has reached the right corner of the screen
        const targetX = this._screenWidth * 0.5; // Right edge of game container

        if (this.destinationRunway.x <= targetX) {
            this.destinationRunway.x = targetX;
            this._runwayInPosition = true;
            this._unlockCamera();
        }
    }

    /** Unlock camera and let airplane continue moving */
    private _unlockCamera() {
        console.log('LandingSystem: Runway in position, unlocking camera');
        this._cameraUnlocked = true;

        // Tell airplane system to unlock camera
        this.game.systems.get(AirplaneSystem).unlockCamera();
    }

    /** Handle auto-landing when player releases space */
    private _handleAutoLanding(delta: number, airplaneSystem: AirplaneSystem) {
        const airplane = airplaneSystem.airplane;

        // If not thrusting, gently descend to landing level
        if (!airplaneSystem.isThrusting()) {
            const targetY = this._landingY;
            const currentY = airplane.y;

            // Smooth descent
            const descentSpeed = 2; // Pixels per frame

            if (currentY < targetY) {
                airplane.y += descentSpeed * delta;

                // Check if airplane has landed (moved off screen to the right)
                if (airplane.x > this._screenWidth * 0.5 + 200) {
                    this._completeLanding();
                }
                // Clamp to landing level
                if (airplane.y >= targetY) {
                    airplane.y = targetY;
                }
            }
        }
    }

    /** Complete the landing and transition to next scene */
    private _completeLanding() {
        console.log('LandingSystem: Landing complete!');

        // Disable controls
        this.game.systems.get(FlightControlSystem).enabled(false);

        // Call the game's reachDestination method
        this.game.reachDestination();
    }

    /** Check if player is thrusting (for external systems) */
    public isCameraUnlocked(): boolean {
        return this._cameraUnlocked;
    }
}
