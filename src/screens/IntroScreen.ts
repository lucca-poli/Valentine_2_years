import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { AppScreen, navigation } from '../navigation';
import { app } from '../main';
import { FlightScreen } from './FlightScreen';

export class IntroScreen extends Container implements AppScreen {
    /** A unique identifier for the screen */
    public static SCREEN_ID = 'intro';
    /** An array of bundle IDs for dynamic asset loading. */
    public static assetBundles = ['intro-screen'];

    /** A background visual element */
    private readonly _background: Sprite;
    private airplane: Sprite;
    private player: Sprite;

    constructor() {
        super();

        // 1. Add background (airport)
        this._background = Sprite.from('departure_area.jpg');
        this._background.width = app.screen.width; // or pass width from resize()
        this._background.height = app.screen.height; // or pass height from resize()
        this.addChild(this._background);

        // 2. Add airplane (static, right side)
        this.airplane = Sprite.from('airplane_down.png');
        this.airplane.x = 950; // Right side of screen
        this.airplane.y = 250;
        this.airplane.scale.set(2.5);
        this.addChild(this.airplane);

        // 3. Add player (you, left side)
        this.player = Sprite.from('Lucca.png');
        this.player.x = 100; // Left side
        this.player.anchor.set(1, 0.4); // x=0.5 (centered), y=1 (bottom)
        this.player.y = 650; // Now this is the ground level
        this.player.scale.set(0.8);
        this.addChild(this.player);
    }

    async show() {
        // Start the animation sequence
        await this.animateJumpSequence();
        await this.animateFadeAway();

        // Transition to next screen
        navigation.goToScreen(FlightScreen);
    }

    /** Called when the screen is being hidden. */
    public async hide() {
        // Kill tweens of the screen container
        gsap.killTweensOf(this);

        // Tween screen into being invisible
        await gsap.to(this, { alpha: 0, duration: 0.2, ease: 'linear' });
    }

    private async animateJumpSequence() {
        const jumpDistance = 100; // Horizontal distance per jump
        const jumpHeight = 60; // How high each jump goes
        const numJumps = 12; // Number of jumps to reach plane

        for (let i = 0; i < numJumps; i++) {
            // Jump up and forward
            await gsap.to(this.player, {
                x: this.player.x + jumpDistance,
                y: this.player.y - jumpHeight,
                duration: 0.2,
                ease: 'power2.out',
            });

            // Fall back down
            await gsap.to(this.player, {
                y: 450, // Back to ground
                duration: 0.2,
                ease: 'power2.in',
            });
        }
    }

    private async animateFadeAway() {
        // Shrink and fade simultaneously
        await Promise.all([
            gsap.to(this.player.scale, {
                x: 0,
                y: 0,
                duration: 1,
                ease: 'power2.inOut',
            }),
            gsap.to(this.player, {
                alpha: 0,
                duration: 1,
                ease: 'power2.inOut',
            }),
        ]);
    }
}
