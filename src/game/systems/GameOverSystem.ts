// src/game/systems/GameOverSystem.ts

import gsap from 'gsap';
import { Container, Text } from 'pixi.js';
import type { Game } from '../Game';
import type { System } from '../SystemRunner';
import { AirplaneSystem } from './AirplaneSystem';

/** A system that handles game over state and restart. */
export class GameOverSystem implements System {
    /**
     * A unique identifier used by the system runner.
     */
    public static SYSTEM_ID = 'game-over';

    /**
     * The instance of the game the system is attached to.
     * This is automatically set by the system runner when the system is added to the game.
     */
    public game!: Game;

    /** Container to hold game over UI */
    public view = new Container();

    /** Game over text */
    private _gameOverText!: Text;

    /** Restart instruction text */
    private _restartText!: Text;

    /** Sea level threshold (y position below which = crash) */
    private _seaLevel = 0;

    /** Flag to prevent multiple game over triggers */
    private _isGameOverActive = false;

    /** Keyboard handler for restart */
    private _keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

    private _screenWidth = 0;
    private _screenHeight = 0;

    /** Called when the system is added to the game. */
    public init() {
        // Create game over text
        this._gameOverText = new Text({
            text: 'Game Over',
            style: {
                fontFamily: 'Arial',
                fontSize: 72,
                fill: 0x000000, // Black
                fontWeight: 'bold',
                align: 'center',
            }
        });
        this._gameOverText.anchor.set(0.5);
        this.view.addChild(this._gameOverText);

        // Create restart text
        this._restartText = new Text({
            text: 'Press SPACE to restart',
            style: {
                fontFamily: 'Arial',
                fontSize: 36,
                fill: 0xFFFFFF, // White
                stroke: 0x000000, // Black outline
                align: 'center',
            }
        });
        this._restartText.anchor.set(0.5);
        this.view.addChild(this._restartText);

        // Add view to game container
        this.game.addToGame(this.view);

        // Hide initially
        this.view.visible = false;
        this.view.alpha = 0;
        this.view.zIndex = 100; // On top of everything

        console.log('GameOverSystem: Initialized');
    }

    /** Called when the game is being awoken. */
    public awake() {
        this._isGameOverActive = false;
        this.view.visible = false;
        this.view.alpha = 0;

        // Calculate sea level (30% from bottom of screen in game container coords)
        this._seaLevel = -280;

        console.log('GameOverSystem: Awake, sea level at', this._seaLevel);
    }

    /** Called when the game starts. */
    public start() {
        console.log('GameOverSystem: Started');
    }

    /**
     * Called every frame.
     * @param delta - The time elapsed since the last update.
     */
    public update(delta: number) {
        if (this._isGameOverActive) return;

        // Check if airplane has crashed into sea
        const airplaneSystem = this.game.systems.get(AirplaneSystem);
        const airplane = airplaneSystem.airplane;

        if (!airplaneSystem.isCameraLocked()) {
            return; // Don't check for game over yet
        }

        // If airplane is below sea level, trigger game over
        if (airplane.y > this._seaLevel) {
            this._triggerGameOver();
        }
    }

    /** Called when the game ends. */
    public end() {
        this._removeRestartControl();
        console.log('GameOverSystem: Ended');
    }

    /** Resets the state of the system back to its initial state. */
    public reset() {
        this._isGameOverActive = false;
        this.view.visible = false;
        this.view.alpha = 0;
        this._removeRestartControl();
        console.log('GameOverSystem: Reset');
    }

    /**
     * Gets called every time the screen resizes.
     * @param w - width of the screen.
     * @param h - height of the screen.
     */
    public resize(w: number, h: number) {
        this._screenWidth = w;
        this._screenHeight = h;

        // Recalculate sea level
        this._seaLevel = -this._screenHeight * 0.3;

        // Position game over text at center
        this._gameOverText.x = 0;
        this._gameOverText.y = -this._screenHeight * 0.5; // Center of screen

        // Position restart text below game over text
        this._restartText.x = 0;
        this._restartText.y = -this._screenHeight * 0.5 + 100; // Below game over text
    }

    /** Trigger the game over state */
    private _triggerGameOver() {
        if (this._isGameOverActive) return;

        this._isGameOverActive = true;
        console.log('GameOverSystem: Game Over triggered!');

        // Call game over on the game instance
        this.game.gameOver();

        // Show game over UI
        this._showGameOverUI();

        // Setup restart control
        this._setupRestartControl();
    }

    /** Show the game over UI with animation */
    private _showGameOverUI() {
        this.view.visible = true;

        // Add floating animation to restart text
        gsap.to(this._restartText, {
            y: this._restartText.y - 10,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
        });

        // Fade in game over screen
        gsap.to(this.view, {
            alpha: 1,
            duration: 0.5,
            ease: 'power2.out',
        });
    }

    /** Setup keyboard control for restart */
    private _setupRestartControl() {
        this._keyDownHandler = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this._restart();
            }
        };

        window.addEventListener('keydown', this._keyDownHandler);
    }

    /** Remove keyboard control */
    private _removeRestartControl() {
        if (this._keyDownHandler) {
            window.removeEventListener('keydown', this._keyDownHandler);
            this._keyDownHandler = null;
        }
    }

    /** Restart the game */
    private async _restart() {
        console.log('GameOverSystem: Restarting game...');

        // Remove restart control to prevent multiple triggers
        this._removeRestartControl();

        // Fade out game over UI
        await gsap.to(this.view, {
            alpha: 0,
            duration: 0.3,
            ease: 'power2.in',
        });

        this.view.visible = false;

        // Kill floating animation
        gsap.killTweensOf(this._restartText);

        // Reset the game
        this.game.reset();

        // Restart the game
        await this.game.awake();
        await this.game.start();
    }
}
