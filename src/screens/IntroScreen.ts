import { Assets, Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { AppScreen } from '../navigation';

export class IntroScreen extends Container implements AppScreen {
    private background: Sprite;
    private airplane: Sprite;
    private player: Sprite;

    constructor() {
        super();
        console.log('IntroScreen: constructor called');
        console.log('Available assets:', Object.keys(Assets.cache));

        // 1. Add background (airport)
        this.background = Sprite.from('departure_area');
        console.log('Background sprite created:', this.background);
        this.addChild(this.background);

        // 2. Add airplane (static, right side)
        this.airplane = Sprite.from('airplane_down');
        this.airplane.x = 800;  // Right side of screen
        this.airplane.y = 400;
        this.addChild(this.airplane);

        // 3. Add player (you, left side)
        this.player = Sprite.from('gi_kebab_linda_transparent');
        this.player.x = 100;    // Left side
        this.player.y = 450;    // Ground level
        this.player.anchor.set(0.5);
        this.addChild(this.player);
    }

    async show() {
        // Start the animation sequence
        await this.animateJumpSequence();
        await this.animateFadeAway();

        // Transition to next screen
        // navigation.showScreen(FlightScreen);
    }

    private async animateJumpSequence() {
        const jumpDistance = 50;  // Horizontal distance per jump
        const jumpHeight = 60;    // How high each jump goes
        const numJumps = 10;      // Number of jumps to reach plane

        for (let i = 0; i < numJumps; i++) {
            // Jump up and forward
            await gsap.to(this.player, {
                x: this.player.x + jumpDistance,
                y: this.player.y - jumpHeight,
                duration: 0.2,
                ease: 'power2.out'
            });

            // Fall back down
            await gsap.to(this.player, {
                y: 450,  // Back to ground
                duration: 0.2,
                ease: 'power2.in'
            });
        }
    }

    private async animateFadeAway() {
        // Shrink and fade simultaneously
        await gsap.to(this.player, {
            scale: 0,
            alpha: 0,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
}
