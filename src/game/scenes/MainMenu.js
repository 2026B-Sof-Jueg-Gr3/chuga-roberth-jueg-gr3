import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#87a97c');
        this.add.rectangle(512, 384, 630, 768, 0x303943);
        this.add.rectangle(512, 384, 606, 768, 0x414951);
        this.add.rectangle(211, 384, 8, 768, 0xe4e1c8);
        this.add.rectangle(813, 384, 8, 768, 0xe4e1c8);
        this.add.rectangle(412, 384, 7, 768, 0xf3f0d7, 0.55);
        this.add.rectangle(612, 384, 7, 768, 0xf3f0d7, 0.55);
        for (let y = -24; y < 768; y += 92)
        {
            this.add.rectangle(412, y, 9, 42, 0x414951);
            this.add.rectangle(612, y + 34, 9, 42, 0x414951);
        }
        this.add.rectangle(512, 384, 1024, 768, 0x091017, 0.72);
        this.add.rectangle(230, 273, 5, 144, 0x5ce1c3);
        this.add.text(512, 230, 'TERRARUSH', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 62,
            color: '#f2f7fb',
            letterSpacing: 5
        }).setOrigin(0.5, 0.5);
        this.add.text(512, 299, 'CARRERA  /  NIVEL 1', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 18,
            color: '#75d9c4',
            letterSpacing: 3
        }).setOrigin(0.5, 0.5);
        this.add.text(512, 392, 'Esquiva el tráfico y alcanza la meta.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 23,
            color: '#bdc9d4'
        }).setOrigin(0.5);
        this.add.text(512, 432, 'Tienes 60 segundos y 3 vidas.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 17,
            color: '#91a5ad'
        }).setOrigin(0.5);

        const startButton = this.add.rectangle(512, 492, 250, 62, 0x5ce1c3)
            .setInteractive({ useHandCursor: true });
        const startLabel = this.add.text(512, 492, 'INICIAR PARTIDA', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 18,
            color: '#08130f',
            letterSpacing: 2
        }).setOrigin(0.5);

        startButton.on('pointerover', () => startButton.setFillStyle(0x82f0d7));
        startButton.on('pointerout', () => startButton.setFillStyle(0x5ce1c3));
        startButton.on('pointerup', () => this.scene.start('Game'));
        this.add.text(512, 590, 'A / D MOVERSE A LOS LADOS  ·  W / S O ↑ / ↓ ADELANTE Y ATRÁS', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            color: '#728293',
            letterSpacing: 1
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('Game'));
    }
}
