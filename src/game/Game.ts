import gsap from 'gsap';
import { Point } from 'pixi.js';
import { Container, Rectangle } from 'pixi.js';

import { Stats } from './Stats';
import { SystemRunner } from './SystemRunner';
import { AirplaneSystem } from './systems/AirplaneSystem';
import { FlightControlSystem } from './systems/FlightControlSystem';
import { ScrollingSystem } from './systems/ScrollingSystem';
import { GameOverSystem } from './systems/GameOverSystem';
import { LandingSystem } from './systems/LandingSystem';
import { ObstacleSystem } from './systems/ObstacleSystem';
import { navigation } from '../navigation';
import { ArrivalScreen } from '../screens/ArrivalScreen';

/** A class that handles all of gameplay based features. */
export class Game {
    /** Container to hold all game visuals. */
    public stage = new Container();
    /** Container to hold gameplay elements like bubbles. */
    public gameContainer = new Container();
    /** Original game container position to use as reset for screen shake effects. */
    public gameContainerPosition = new Point();
    /** Container to handle user interaction. */
    public hitContainer = new Container();
    /** A system manager to handle the common functions found in systems. */
    public systems: SystemRunner;
    /** A class that deals with user specific stats. */
    public stats: Stats;
    /** A flag to determine if the game has reached the "GAMEOVER" state */
    public isGameOver = false;
    /** A flag to determine if the game has started */
    public hasStarted = false;

    /** The hit area to be used by the `hitContainer`. */
    private readonly _hitArea: Rectangle;

    /** Time elapsed since game started (for sigmoid function) */
    public timeElapsed = 0;

    constructor() {
        this.stage.addChild(this.gameContainer);
        this.gameContainer.sortableChildren = true;

        // Prepare the container for interaction
        this._hitArea = new Rectangle();

        this.hitContainer.interactive = true;
        this.hitContainer.hitArea = this._hitArea;
        this.gameContainer.addChild(this.hitContainer);

        // Instantiate system runner and pass `this`
        this.systems = new SystemRunner(this);
        // Instantiate stats
        this.stats = new Stats();
    }

    /**
     * Adds views (Containers, Sprites, etc.) to the game container.
     * @param views - The views to add to the game container.
     */
    public addToGame(...views: Container[]) {
        views.forEach((view) => {
            this.gameContainer.addChild(view);
        });
    }

    /**
     * Removes views (Containers, Sprites, etc.) from the game container.
     * @param views - The views to remove from the game container.
     */
    public removeFromGame(...views: Container[]) {
        views.forEach((view) => {
            view.removeFromParent();
        });
    }

    /** Initialisation point of the Game, used to add systems to the game. */
    public init() {
        // Add systems to system runner
        this.systems.add(ScrollingSystem); // Handles parallax scrolling (add later)
        this.systems.add(FlightControlSystem); // Handles spacebar input
        this.systems.add(GameOverSystem); // Game over and restart
        this.systems.add(LandingSystem); // Landing sequence
        this.systems.add(AirplaneSystem); // Handles airplane sprite and movement
        this.systems.add(ObstacleSystem); // Spawns and manages obstacles (add later)

        // Initialise systems
        this.systems.init();
    }

    /** Performs initial setup for the game. */
    public async awake() {
        // Call `awake()` on the systems
        this.systems.awake();
        // Set the game container to be visible
        this.gameContainer.visible = true;
    }

    /** Starts the game logic. */
    public async start() {
        this.hasStarted = true;
        this.timeElapsed = 0;
        // Animate airplane to cruising altitude
        // await this.systems.get(AirplaneSystem).takeoff();
        // Call `start()` on the systems.
        this.systems.start();

        console.log('Flight: Game started');
    }

    /** Handles the end of the game. */
    public async gameOver() {
        console.log('Flight: Crashed!');
        // Set game over flag to be true
        this.isGameOver = true;

        // Disable controls
        // this.systems.get(FlightControlSystem).enabled(false);

        // logic to make a floating text "Press space to play again"  appear and reset if player presses space

        // Reset and try again
        this.gameContainer.visible = false;
        gsap.delayedCall(1, () => {
            // Navigate to the ResultScreen after a 1 second delay
            // Send all relevant user stats
            // navigation.goToScreen(ResultScreen, {
            //     score: this.stats.get('score'),
            //     popped: this.stats.get('bubblesPopped'),
            //     powerups: this.stats.get('powerupsUsed'),
            //     combo: this.stats.get('bestCombo'),
            //     highscore: this.stats.get('highscore'),
            // });
            this.reset();
            this.awake();
        });
    }

    /** Ends the game logic. */
    public async end() {
        // Remove listeners on hit container to prevent unwanted interaction
        this.hitContainer.removeAllListeners();
        // Call `end()` on the systems
        this.systems.end();
    }

    /**
     * Called every frame to update the game state
     * This includes updating the systems if the game is not paused or over.
     * @param delta - The time elapsed since the last update.
     */
    public update(delta: number) {
        if (!this.hasStarted || this.isGameOver) return;

        // Update time for sigmoid function
        const timeSeconds = delta / 60;
        this.timeElapsed += timeSeconds; // Convert to seconds

        // Update systems
        this.systems.update(delta);

        // Check win condition (e.g., distance >= 500)
        if (this.stats.get('distance') >= 500) {
            this.reachDestination();
        }
    }

    /** Resets the game to its initial state. */
    public reset() {
        // Set game over flag to be false
        this.isGameOver = false;
        this.hasStarted = false;
        this.timeElapsed = 0;
        // Reset the user's stats
        this.stats.reset();
        // Call `reset()` on the systems
        this.systems.reset();
    }

    /** Handles reaching the destination (win condition). */
    public async reachDestination() {
        console.log('Flight: Reached destination!');
        // Set game over flag to be true
        this.isGameOver = true;

        // Disable controls
        this.systems.get(FlightControlSystem).enabled(false);

        // Optional: Celebratory animation
        await gsap.to(this.gameContainer, {
            alpha: 0,
            duration: 1,
            ease: 'power2.inOut',
        });

        // Navigate to ArrivalScreen
        gsap.delayedCall(0.5, () => {
            navigation.goToScreen(ArrivalScreen, {
                distance: this.stats.get('distance'),
            });
        });
    }

    /**
     * Gets called every time the screen resizes.
     * @param w - width of the screen.
     * @param h - height of the screen.
     */
    public resize(w: number, h: number) {
        // Sets game container to the bottom of the screen,
        // since the game should be anchor there
        this.gameContainerPosition.x = w * 0.5;
        this.gameContainerPosition.y = h;

        this.gameContainer.x = this.gameContainerPosition.x;
        this.gameContainer.y = this.gameContainerPosition.y;

        // Offsets the hit area position back to top left of the screen,
        // Limit the top to match airplane's initial Y level
        const airplaneInitialY = -h * 0.16; // Same as airplane's spawn Y
        console.log('Hit box y: ', airplaneInitialY);

        this._hitArea.x = -w / 2;
        this._hitArea.y = airplaneInitialY; // Start hit area at airplane level (was -h)
        this._hitArea.width = w;
        this._hitArea.height = h + airplaneInitialY; // Height from airplane level to bottom (was h)

        // Call `resize()` on the systems
        this.systems.resize(w, h);
    }
}
