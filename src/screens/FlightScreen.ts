import gsap from 'gsap';
import { Container, Graphics, Text, Texture, Ticker, TilingSprite } from 'pixi.js';
import type { AppScreen } from '../navigation';
import { Game } from '../game/Game';
import { ScrollingSystem } from '../game/systems/ScrollingSystem';
import { AirplaneSystem } from '../game/systems/AirplaneSystem';

/** The flight screen with airplane gameplay */
export class FlightScreen extends Container implements AppScreen {
    /** A unique identifier for the screen */
    public static SCREEN_ID = 'flight';
    /** An array of bundle IDs for dynamic asset loading. */
    public static assetBundles = ['flight-screen'];

    private readonly _skyBackground: Graphics;
    private readonly _sea: TilingSprite;
    private readonly _flight: Game;
    private _instructionText: Text | null = null;

    // Keyboard handler reference for cleanup
    private _keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor() {
        super();

        // Create light blue sky background
        this._skyBackground = new Graphics();
        this._skyBackground.beginFill(0x87ceeb); // Light blue
        this._skyBackground.drawRect(0, 0, 64, 64);
        this._skyBackground.endFill();
        this.addChild(this._skyBackground);

        // Create tiling sea (for parallax scrolling)
        this._sea = new TilingSprite({
            texture: Texture.from('sea_waves_cropped.png'), // Adjust to your asset name
            width: 64,
            height: 64,
        });
        this.addChild(this._sea);

        // Create flight instance and initialize
        this._flight = new Game();
        this._flight.init();

        // Connect sea to ScrollingSystem AFTER init
        this._flight.systems.get(ScrollingSystem).setSea(this._sea);

        this.addChild(this._flight.stage);

        // Create instruction text
        this._instructionText = new Text({
            text: 'Press SPACE to start',
            style: {
                fontFamily: 'Arial',
                fontSize: 48,
                fill: 0xffffff,
                stroke: 0x000000,
                // strokeThickness: 4,
                align: 'center',
            },
        });
        this._instructionText.anchor.set(0.5);
        this.addChild(this._instructionText);

        // Setup keyboard controls
        this._setupKeyboardControls();
    }

    /** Called when the screen is being shown. */
    public async show() {
        // Kill tweens of the screen container
        gsap.killTweensOf(this);

        // Reset screen data
        this.alpha = 0;

        // Wake up the flight
        this._flight.awake();

        // Show instruction text
        if (this._instructionText) {
            this._instructionText.alpha = 1;
            this._instructionText.visible = true;

            // Floating animation
            gsap.to(this._instructionText, {
                y: this._instructionText.y - 20,
                duration: 1,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
            });
        }

        // Fade in
        await gsap.to(this, { alpha: 1, duration: 0.2, ease: 'linear' });

        console.log('FlightScreen: Ready to start');
    }

    /** Called when the screen is being hidden. */
    public async hide() {
        // Kill tweens of the screen container
        gsap.killTweensOf(this);
        if (this._instructionText) {
            gsap.killTweensOf(this._instructionText);
        }

        // End the flight
        this._flight.end();

        // Fade out
        await gsap.to(this, { alpha: 0, duration: 0.2, ease: 'linear' });

        // Reset the flight
        this._flight.reset();
    }

    /**
     * Called every frame.
     * @param time - Ticker object with time related data.
     */
    public update(time: Ticker) {
        this._flight.update(time.deltaTime);

        // Update sea scrolling
        const airplaneSystem = this._flight.systems.get(AirplaneSystem);
        const scrollingSystem = this._flight.systems.get(ScrollingSystem);

        const airplaneSpeedX = airplaneSystem.getCurrentSpeedX();
        const cameraLocked = airplaneSystem.isCameraLocked();

        scrollingSystem.updateSeaScroll(airplaneSpeedX, cameraLocked);
    }

    /**
     * Gets called every time the screen resizes.
     * @param w - width of the screen.
     * @param h - height of the screen.
     */
    public resize(w: number, h: number) {
        // Resize sky background to fill screen
        this._skyBackground.clear();
        this._skyBackground.beginFill(0x87ceeb);
        this._skyBackground.drawRect(0, 0, w, h);
        this._skyBackground.endFill();

        // Position and size sea (bottom 30% of screen)
        this._sea.width = w;
        this._sea.height = h * 0.3;
        this._sea.y = h * 0.7;

        // Center instruction text
        if (this._instructionText) {
            this._instructionText.x = w / 2;
            this._instructionText.y = h / 2;
        }

        // Forward screen dimensions to the flight
        this._flight.resize(w, h);
    }

    /** Setup keyboard event listeners */
    private _setupKeyboardControls() {
        this._keyDownHandler = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !this._flight.hasStarted) {
                e.preventDefault();
                this._startGame();
            }
        };

        window.addEventListener('keydown', this._keyDownHandler);

        // Cleanup on destroy
        this.on('destroyed', () => {
            if (this._keyDownHandler) {
                window.removeEventListener('keydown', this._keyDownHandler);
            }
        });
    }

    /** Start the game after spacebar is pressed */
    private async _startGame() {
        console.log('FlightScreen: Starting game');

        // Hide instruction text
        if (this._instructionText) {
            await gsap.to(this._instructionText, {
                alpha: 0,
                duration: 0.5,
                onComplete: () => {
                    if (this._instructionText) {
                        this._instructionText.visible = false;
                    }
                },
            });
        }

        // Start the flight (includes takeoff animation and system start)
        await this._flight.start();
    }
}
