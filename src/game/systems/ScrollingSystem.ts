import gsap from 'gsap';
import { Sprite, TilingSprite } from 'pixi.js';
import type { Game } from '../Game';
import type { System } from '../SystemRunner';
import { AirplaneSystem } from './AirplaneSystem';

/** A system that handles parallax scrolling backgrounds. */
export class ScrollingSystem implements System {
    /**
     * A unique identifier used by the system runner.
     */
    public static SYSTEM_ID = 'scrolling';

    /**
     * The instance of the game the system is attached to.
     * This is automatically set by the system runner when the system is added to the game.
     */
    public game!: Game;

    /** The sea tiling sprite for infinite scrolling */
    public sea!: TilingSprite;

    /** The runway sprite */
    public runway!: Sprite;

    /** Flag to track if we've transitioned away from runway */
    private _hasTransitioned = false;

    /** Distance threshold to trigger runway fadeout */
    private readonly _transitionDistance = 150; // When distance stat reaches this, fade out runway

    /** Parallax speed multipliers */
    private readonly _seaSpeed = 0.5;      // Sea moves at 50% of airplane speed
    private readonly _runwaySpeed = 1.0;   // Runway moves at 100% of airplane speed

    /** Obstacle speed multiplier (for later use) */
    public readonly obstacleSpeed = 0.7;   // Obstacles move at 70% of airplane speed

    private _screenWidth = 0;
    private _screenHeight = 0;

    /** Called when the system is added to the game. */
    public init() {
        // Note: Sea is created in FlightScreen, we'll get reference to it
        // Runway needs to be created here

        this.runway = Sprite.from('airport_runway.png');
        this.runway.anchor.set(0, 1); // Bottom-left anchor
        this.game.addToGame(this.runway);


        // Add runway to game container
        this.game.addToGame(this.runway);

        console.log('ScrollingSystem: Initialized');
    }

    /** Called when the game is being awoken. */
    public awake() {
        this._hasTransitioned = false;

        // Position runway at starting point
        this.runway.x = -this._screenWidth * 0.5; // Left edge (adjust if needed)
        this.runway.y = 0; // Your original y position (negative in game container coords)
        this.runway.alpha = 1; // Fully visible
        this.runway.visible = true;
        this.runway.scale.set(2.5); // Ensure scale is set

        console.log('ScrollingSystem: Awake');
    }

    /** Called when the game starts. */
    public start() {
        console.log('ScrollingSystem: Started');
    }

    /**
     * Called every frame.
     * @param delta - The time elapsed since the last update.
     */
    public update(delta: number) {
        const airplaneSystem = this.game.systems.get(AirplaneSystem);

        // Only scroll background when camera is locked
        if (!airplaneSystem.isCameraLocked()) {
            return; // Don't scroll yet, airplane is still moving right
        }

        // Get airplane's current speed
        const airplaneSpeedX = airplaneSystem.getCurrentSpeedX();

        // === PARALLAX SCROLLING ===

        // Scroll runway (moves at airplane speed)
        if (this.runway && this.runway.visible) {
            this.runway.x -= airplaneSpeedX * this._runwaySpeed;

            // Hide runway when it's completely off screen
            if (this.runway.x + this.runway.width < -this._screenWidth * 0.5) {
                this.runway.visible = false;
            }
        }

        // Update sea (handled in FlightScreen via updateSeaScroll)

        // === BACKGROUND TRANSITION ===

        const distance = this.game.stats.get('distance') || 0;

        if (!this._hasTransitioned && distance >= this._transitionDistance) {
            this._hasTransitioned = true;
            this._fadeOutRunway();
        }
    }

    /** Called when the game ends. */
    public end() {
        console.log('ScrollingSystem: Ended');
    }

    /** Resets the state of the system back to its initial state. */
    public reset() {
        this._hasTransitioned = false;

        if (this.runway) {
            this.runway.x = -this._screenWidth * 0.5;
            this.runway.alpha = 1;
            this.runway.visible = true;
        }

        console.log('ScrollingSystem: Reset');
    }

    /**
     * Gets called every time the screen resizes.
     * @param w - width of the screen.
     * @param h - height of the screen.
     */
    public resize(w: number, h: number) {
        this._screenWidth = w;
        this._screenHeight = h;

        // Scale runway instead of setting width/height
        if (this.runway) {
            this.runway.scale.set(2.5); // Use your original scale
        }
    }

    /**
     * Set the sea reference (called from FlightScreen)
     * @param sea - The sea TilingSprite from FlightScreen
     */
    public setSea(sea: TilingSprite) {
        this.sea = sea;
    }

    /**
     * Update sea scrolling (called from FlightScreen's update)
     * @param airplaneSpeedX - The airplane's horizontal speed
     */
    public updateSeaScroll(airplaneSpeedX: number, cameraLocked: boolean) {
        // Only scroll sea when camera is locked
        if (this.sea && cameraLocked) {
            this.sea.tilePosition.x -= airplaneSpeedX * this._seaSpeed;
        }
    }

    /** Fade out the runway when transitioning to open sky/sea */
    private _fadeOutRunway() {
        console.log('ScrollingSystem: Transitioning - fading out runway');

        gsap.to(this.runway, {
            alpha: 0,
            duration: 2,
            ease: 'power2.out',
            onComplete: () => {
                this.runway.visible = false;
            }
        });
    }
}
