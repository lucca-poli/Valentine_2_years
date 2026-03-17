import { Sprite } from 'pixi.js';
import type { Game } from '../Game';
import type { System } from '../SystemRunner';
import { AirplaneSystem } from './AirplaneSystem';
import { LandingSystem } from './LandingSystem';

/** Interface for obstacle configuration */
interface ObstacleConfig {
    assetName: string; // The sprite asset to use
    yPosition: number; // Y position in game container coords (negative values)
    scale: number; // Uniform scale (e.g., 1.5 for 150% size)
}

/** A system that spawns and manages obstacles. */
export class ObstacleSystem implements System {
    /**
     * A unique identifier used by the system runner.
     */
    public static SYSTEM_ID = 'obstacle';

    /**
     * The instance of the game the system is attached to.
     * This is automatically set by the system runner when the system is added to the game.
     */
    public game!: Game;

    /** Hardcoded obstacle configurations */
    private readonly _obstacleConfigs: ObstacleConfig[] = [
        { assetName: 'flymoney.png', yPosition: -500, scale: 0.3 },
        { assetName: 'explosion.png', yPosition: -380, scale: 0.5 },
        { assetName: 'trump.png', yPosition: -750, scale: 0.4 },
        // Add more obstacles here...
    ];

    /** Active obstacle sprites currently on screen */
    private _activeObstacles: Sprite[] = [];

    /** Distance between obstacles */
    private readonly _obstacleSpacing = 45;

    /** Next distance threshold to spawn an obstacle */
    private _nextSpawnDistance = 45; // First obstacle at distance 25

    /** Current index in the obstacle configs array */
    private _currentObstacleIndex = 0;

    /** Speed multiplier for obstacles (relative to airplane) */
    private readonly _obstacleSpeed = 0.7; // 70% of airplane speed (from ScrollingSystem)

    /** Called when the system is added to the game. */
    public init() {
        console.log('ObstacleSystem: Initialized');
    }

    /** Called when the game is being awoken. */
    public awake() {
        this._nextSpawnDistance = 25; // First obstacle at distance 25
        this._currentObstacleIndex = 0;

        // Clear any existing obstacles
        this._clearObstacles();

        console.log('ObstacleSystem: Awake');
    }

    /** Called when the game starts. */
    public start() {
        console.log('ObstacleSystem: Started');
    }

    /**
     * Called every frame.
     * @param delta - The time elapsed since the last update.
     */
    public update() {
        const distance = this.game.stats.get('distance') || 0;
        const airplaneSystem = this.game.systems.get(AirplaneSystem);
        const landingSystem = this.game.systems.get(LandingSystem);

        // Don't spawn new obstacles during landing
        if (!landingSystem.isLanding()) {
            // Check if we should spawn a new obstacle
            if (distance >= this._nextSpawnDistance && this._currentObstacleIndex < this._obstacleConfigs.length) {
                this._spawnObstacle();
                this._nextSpawnDistance += this._obstacleSpacing;
            }
        }

        // Update existing obstacles
        this._updateObstacles(airplaneSystem);

        // Check collisions
        this._checkCollisions(airplaneSystem);
    }

    /** Called when the game ends. */
    public end() {
        this._clearObstacles();
        console.log('ObstacleSystem: Ended');
    }

    /** Resets the state of the system back to its initial state. */
    public reset() {
        this._nextSpawnDistance = 25;
        this._currentObstacleIndex = 0;
        this._clearObstacles();
        console.log('ObstacleSystem: Reset');
    }

    /** Spawn a new obstacle based on current config */
    private _spawnObstacle() {
        const config = this._obstacleConfigs[this._currentObstacleIndex];

        // Create obstacle sprite
        const obstacle = Sprite.from(config.assetName);
        obstacle.anchor.set(0.5); // Center anchor
        obstacle.scale.set(config.scale); // Apply symmetric scale
        obstacle.zIndex = 5; // Between runway (0) and airplane (10)

        // Get screen width from game container
        const screenWidth = Math.abs(this.game.gameContainerPosition.x) * 2;

        // Position obstacle off-screen to the right
        obstacle.x = screenWidth * 0.5 + 200; // Start off-screen right
        obstacle.y = config.yPosition;

        // Add to game
        this.game.addToGame(obstacle);
        this._activeObstacles.push(obstacle);

        console.log(
            `ObstacleSystem: Spawned obstacle ${this._currentObstacleIndex + 1} at distance ${this._nextSpawnDistance}, scale ${config.scale}`,
        );

        // Move to next obstacle config
        this._currentObstacleIndex++;
    }

    /** Update all active obstacles */
    private _updateObstacles(airplaneSystem: AirplaneSystem) {
        const airplaneSpeedX = airplaneSystem.getCurrentSpeedX();
        const cameraLocked = airplaneSystem.isCameraLocked();

        // Only move obstacles when camera is locked (like parallax)
        if (!cameraLocked) {
            return;
        }

        // Move obstacles toward airplane (left) at obstacle speed
        this._activeObstacles.forEach((obstacle) => {
            obstacle.x -= airplaneSpeedX * this._obstacleSpeed;
        });

        // Remove obstacles that are off-screen to the left
        const screenWidth = Math.abs(this.game.gameContainerPosition.x) * 2;
        this._activeObstacles = this._activeObstacles.filter((obstacle) => {
            if (obstacle.x < -screenWidth * 0.5 - 200) {
                // Off-screen, remove it
                this.game.removeFromGame(obstacle);
                obstacle.destroy();
                return false;
            }
            return true;
        });
    }

    /** Check for collisions between airplane and obstacles */
    private _checkCollisions(airplaneSystem: AirplaneSystem) {
        const airplane = airplaneSystem.airplane;

        // Simple bounding box collision
        this._activeObstacles.forEach((obstacle) => {
            const airplaneBounds = airplane.getBounds();
            const obstacleBounds = obstacle.getBounds();

            // Check if bounds overlap
            if (this._boundsIntersect(airplaneBounds, obstacleBounds)) {
                console.log('ObstacleSystem: Collision detected!');
                this.game.gameOver();
            }
        });
    }

    /** Check if two bounds intersect */
    private _boundsIntersect(a: any, b: any): boolean {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    /** Clear all obstacles */
    private _clearObstacles() {
        this._activeObstacles.forEach((obstacle) => {
            this.game.removeFromGame(obstacle);
            obstacle.destroy();
        });
        this._activeObstacles = [];
    }
}
