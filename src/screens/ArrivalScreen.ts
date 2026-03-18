import gsap from 'gsap';
import { Container, Sprite, Text, Graphics } from 'pixi.js';
import type { AppScreen } from '../navigation';
import { app } from '../main';
import { bgm, sfx } from '../audio';

/** The arrival screen where the player meets their valentine */
export class ArrivalScreen extends Container implements AppScreen {
    /** A unique identifier for the screen */
    public static SCREEN_ID = 'arrival';
    /** An array of bundle IDs for dynamic asset loading. */
    public static assetBundles = ['arrival-screen'];

    private readonly _background: Sprite;
    private _player!: Sprite;
    private _girlfriend!: Sprite;
    private _cloud!: Sprite;
    private _hearts: Sprite[] = [];
    private _questionBox!: Container;
    private _questionText!: Text;
    private _yesButton!: Container;
    private _noButton!: Container;
    private _finalHeart!: Sprite;
    private _finalText!: Text;

    private _screenWidth = 0;
    private _screenHeight = 0;
    private _currentEmoji = '😊'; // smiling

    constructor() {
        super();
        //
        // 1. Add background (airport)
        this._background = Sprite.from('airport_arrival.webp');
        this._background.width = app.screen.width; // or pass width from resize()
        this._background.height = app.screen.height; // or pass height from resize()
        this.addChild(this._background);

        // Create girlfriend sprite (already at airport)
        this._girlfriend = Sprite.from('gi_kebab_linda_transparent.png');
        this._girlfriend.anchor.set(0.5, 1);
        this._girlfriend.scale.set(0.7);
        this.addChild(this._girlfriend);

        // Create player sprite (will slide in)
        this._player = Sprite.from('Lucca.png');
        this._player.anchor.set(0.5, 1);
        this._player.scale.set(1.25);
        this.addChild(this._player);

        // Create cloud (initially hidden)
        this._cloud = Sprite.from('cloud.png');
        this._cloud.anchor.set(0.5, 1.2);
        this._cloud.visible = false;
        this._cloud.alpha = 0;
        this.addChild(this._cloud);

        // Create question box (initially hidden)
        this._questionBox = new Container();
        this._questionBox.visible = false;
        this._questionBox.zIndex = 100;
        this._questionBox.eventMode = 'static';
        this.addChild(this._questionBox);

        this.sortableChildren = true;

        this._createQuestionUI();
        this._createFinalElements();
    }

    private _createQuestionUI() {
        // Background panel
        const panel = new Graphics();
        panel.rect(-300, -250, 600, 500).fill(0xffd3a0);
        panel.rect(-300, -250, 600, 500).stroke({ width: 5, color: 0x7e4300 });
        this._questionBox.addChild(panel);

        // Question text with emoji
        this._questionText = new Text({
            text: `Quer ser a minha valentine? ${this._currentEmoji}`,
            style: {
                fontFamily: 'Arial',
                fontSize: 36,
                fill: 0x000000,
                fontWeight: 'bold',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: 450,
            },
        });
        this._questionText.anchor.set(0.5);
        this._questionText.y = -50;
        this._questionBox.addChild(this._questionText);

        // Yes button
        this._yesButton = this._createButton('Yes!', 0xffd3a0);
        this._yesButton.x = -80;
        this._yesButton.y = 70;
        this._yesButton.eventMode = 'static';
        this._yesButton.cursor = 'pointer';
        this._yesButton.on('pointerdown', () => this._onYesClick());
        this._questionBox.addChild(this._yesButton);

        // No button
        this._noButton = this._createButton('No ):', 0xffd3a0);
        this._noButton.x = 80;
        this._noButton.y = 70;
        this._noButton.eventMode = 'static';
        this._noButton.cursor = 'pointer';
        this._noButton.on('pointerdown', () => this._onNoClick());
        this._questionBox.addChild(this._noButton);

        // Track mouse movement for emoji changes
        this._questionBox.on('pointermove', (event) => this._onMouseMove(event));
    }

    private _createButton(text: string, color: number): Container {
        const button = new Container();

        const bg = new Graphics();
        bg.roundRect(-70, -30, 140, 60, 15).fill(color);
        bg.roundRect(-70, -30, 140, 60, 15).stroke({ width: 3, color: 0x000000 });
        button.addChild(bg);

        const label = new Text({
            text,
            style: {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0x000000,
                fontWeight: 'bold',
                align: 'center',
            },
        });
        label.anchor.set(0.5);
        button.addChild(label);

        // Hover effects
        button.on('pointerover', () => {
            gsap.to(button.scale, { x: 1.1, y: 1.1, duration: 0.2 });
        });
        button.on('pointerout', () => {
            gsap.to(button.scale, { x: 1, y: 1, duration: 0.2 });
        });

        return button;
    }

    private _createFinalElements() {
        // Final heart (initially hidden)
        this._finalHeart = Sprite.from('heart_transparent.png');
        this._finalHeart.anchor.set(0.5);
        this._finalHeart.visible = false;
        this._finalHeart.scale.set(0);
        this._finalHeart.zIndex = 200;
        this.addChild(this._finalHeart);

        // Final "I love you!" text
        this._finalText = new Text({
            text: 'Te amo! Feliz 2 anos 💕',
            style: {
                fontFamily: 'Arial',
                fontSize: 72,
                fill: 0x000000,
                fontWeight: 'bold',
                stroke: 0xffffff,
                align: 'center',
            },
        });
        this._finalText.anchor.set(0.5);
        this._finalText.visible = false;
        this._finalText.alpha = 0;
        this._finalText.zIndex = 201;
        this.addChild(this._finalText);
    }

    /** Called when the screen is being shown. */
    public async show() {
        gsap.killTweensOf(this);
        this.alpha = 0;

        // Position girlfriend on right side
        this._girlfriend.x = this._screenWidth * 0.7;
        this._girlfriend.y = this._screenHeight * 0.7;

        // Position player off-screen to the left
        this._player.x = -200;
        this._player.y = this._screenHeight * 0.7;

        await gsap.to(this, { alpha: 1, duration: 0.5 });

        // Start the cutscene
        await this._playCutscene();
    }

    /** Called when the screen is being hidden. */
    public async hide() {
        gsap.killTweensOf(this);
        await gsap.to(this, { alpha: 0, duration: 0.5 });
    }

    public resize(w: number, h: number) {
        this._screenWidth = w;
        this._screenHeight = h;

        // Position girlfriend
        if (this._girlfriend) {
            this._girlfriend.x = w * 0.7;
            this._girlfriend.y = h * 0.7;
        }

        // Position question box at center
        if (this._questionBox) {
            this._questionBox.x = w / 2;
            this._questionBox.y = h / 2;
        }

        // Position final elements at center
        if (this._finalHeart) {
            this._finalHeart.x = w / 2;
            this._finalHeart.y = h / 2;
        }
        if (this._finalText) {
            this._finalText.x = w / 2;
            this._finalText.y = h / 2;
        }
    }

    /** Play the arrival cutscene */
    private async _playCutscene() {
        // 1. Player slides in from left
        await gsap.to(this._player, {
            x: this._screenWidth * 0.3,
            duration: 2,
            ease: 'power2.out',
        });

        // 2. Wait a moment
        await gsap.delayedCall(0.5, () => {});

        // 3. Both move toward each other
        await Promise.all([
            gsap.to(this._player, {
                x: this._screenWidth * 0.5 - 50,
                duration: 1.5,
                ease: 'power2.inOut',
            }),
            gsap.to(this._girlfriend, {
                x: this._screenWidth * 0.5 + 50,
                duration: 1.5,
                ease: 'power2.inOut',
            }),
        ]);

        // 4. Show cloud and hearts
        await this._showCloudAndHearts();

        // 5. Show question box
        await this._showQuestionBox();
    }

    /** Show cloud with hearts popping out */
    private async _showCloudAndHearts() {
        // Position cloud at center between them
        this._cloud.x = this._screenWidth / 2;
        this._cloud.y = this._screenHeight * 0.6;
        this._cloud.visible = true;

        // Fade in cloud
        await gsap.to(this._cloud, {
            alpha: 1,
            duration: 1,
            ease: 'power2.out',
        });

        // Spawn hearts
        this._spawnHearts();

        // Wait for hearts animation
        await gsap.delayedCall(2, () => {});
    }

    /** Spawn hearts that float up from the cloud */
    private _spawnHearts() {
        const heartCount = 15;
        const interval = 200; // ms between hearts

        for (let i = 0; i < heartCount; i++) {
            gsap.delayedCall((i * interval) / 1000, () => {
                const heart = Sprite.from('heart_transparent.png');
                heart.anchor.set(0.5, 1.2);
                heart.scale.set(0.2);
                heart.x = this._cloud.x + (Math.random() - 0.5) * 100;
                heart.y = this._cloud.y - 100;
                this.addChild(heart);
                this._hearts.push(heart);

                // Animate heart floating up and fading
                gsap.to(heart, {
                    y: heart.y - 200,
                    alpha: 0,
                    duration: 2,
                    ease: 'power2.out',
                    onComplete: () => {
                        heart.destroy();
                    },
                });
            });
        }
    }

    /** Show the question box */
    private async _showQuestionBox() {
        this._questionBox.visible = true;
        this._questionBox.alpha = 0;
        this._questionBox.scale.set(0.5);

        await gsap.to(this._questionBox, {
            alpha: 1,
            scale: 1,
            duration: 0.5,
            ease: 'back.out',
        });
    }

    /** Handle mouse movement for emoji changes */
    private _onMouseMove(event: any) {
        const localPos = this._noButton.toLocal(event.global);
        const distance = Math.sqrt(localPos.x ** 2 + localPos.y ** 2);

        let newEmoji = '😊'; // smiling (far)

        if (distance < 150) {
            newEmoji = '😐'; // serious (getting close)
        }
        if (distance < 80) {
            newEmoji = '😠'; // enraged (very close)
        }

        if (newEmoji !== this._currentEmoji) {
            this._currentEmoji = newEmoji;
            this._questionText.text = `Quer ser a minha valentine? ${this._currentEmoji}`;
        }
    }

    /** Handle "No" button click - move it randomly within the box */
    private _onNoClick() {
        // Box dimensions (from _createQuestionUI)
        const boxWidth = 500;
        const boxHeight = 300;
        const boxLeft = -250;
        const boxTop = -150;

        // Button dimensions (from _createButton)
        const buttonWidth = 140;
        const buttonHeight = 60;

        // Calculate valid range for button center (keeping it fully inside)
        const minX = boxLeft + buttonWidth / 2;
        const maxX = boxLeft + boxWidth - buttonWidth / 2;
        const minY = boxTop + buttonHeight / 2;
        const maxY = boxTop + boxHeight - buttonHeight / 2;

        // Random position within bounds
        const randomX = Math.random() * (maxX - minX) + minX;
        const randomY = Math.random() * (maxY - minY) + minY;

        gsap.to(this._noButton, {
            x: randomX,
            y: randomY,
            duration: 0.3,
            ease: 'power2.out',
        });
    }

    /** Handle "Yes" button click - show final heart */
    private async _onYesClick() {
        console.log('Yes clicked! 💕');

        sfx.play('airplane_audio');
        bgm.play('Coisa_de_Cinema');

        // Hide question box
        await gsap.to(this._questionBox, {
            alpha: 0,
            scale: 0.5,
            duration: 0.3,
        });
        this._questionBox.visible = false;

        // Show and grow heart
        this._finalHeart.visible = true;
        this._finalHeart.scale.set(0);

        await gsap.to(this._finalHeart.scale, {
            x: 20,
            y: 20,
            duration: 10,
            ease: 'power2.out',
        });

        // Show "I love you!" text
        this._finalText.visible = true;
        await gsap.to(this._finalText, {
            alpha: 1,
            duration: 1,
        });
    }
}
