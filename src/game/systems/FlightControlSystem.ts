import type { Game } from '../Game';
import type { System } from '../SystemRunner';
import { AirplaneSystem } from './AirplaneSystem';

/** A system that handles spacebar flight controls. */
export class FlightControlSystem implements System {
    /**
     * A unique identifier used by the system runner.
     */
    public static SYSTEM_ID = 'flight-control';

    /**
     * The instance of the game the system is attached to.
     * This is automatically set by the system runner when the system is added to the game.
     */
    public game!: Game;

    private _enabled = false;

    private _keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
    private _keyUpHandler: ((e: KeyboardEvent) => void) | null = null;

    /** Called when the system is added to the game. */
    public init() {
        console.log('FlightControlSystem: Initialized');
    }

    /** Called when the game is being awoken. */
    public awake() {
        console.log('FlightControlSystem: Awake');
    }

    /** Called when the game starts. */
    public start() {
        this._enabled = true;
        this._setupControls();
        console.log('FlightControlSystem: Started');
    }

    /** Called when the game ends. */
    public end() {
        this._enabled = false;
        this._removeControls();
        console.log('FlightControlSystem: Ended');
    }

    /** Resets the state of the system back to its initial state. */
    public reset() {
        this._enabled = false;
        console.log('FlightControlSystem: Reset');
    }

    /**
     * Enable or disable the controls.
     * @param value - The enable state.
     */
    public enabled(value: boolean) {
        this._enabled = value;
        if (!value) {
            // Stop thrust when disabled
            this.game.systems.get(AirplaneSystem).stopThrust();
        }
    }

    /** Setup keyboard event listeners */
    private _setupControls() {
        this._keyDownHandler = (e: KeyboardEvent) => {
            if (!this._enabled) return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.game.systems.get(AirplaneSystem).startThrust();
            }
        };

        this._keyUpHandler = (e: KeyboardEvent) => {
            if (!this._enabled) return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.game.systems.get(AirplaneSystem).stopThrust();
            }
        };

        window.addEventListener('keydown', this._keyDownHandler);
        window.addEventListener('keyup', this._keyUpHandler);
    }

    /** Remove keyboard event listeners */
    private _removeControls() {
        if (this._keyDownHandler) {
            window.removeEventListener('keydown', this._keyDownHandler);
            this._keyDownHandler = null;
        }
        if (this._keyUpHandler) {
            window.removeEventListener('keyup', this._keyUpHandler);
            this._keyUpHandler = null;
        }
    }
}
