
class Juego extends Phaser.Scene {
    constructor() {
        super("Juego");
    }

    create() {
        // Dimensiones del mundo
        this.mundoAncho = 2000;
        this.mundoAlto = 1500;

        // Dibujar el fondo del mundo
        this.add.rectangle(
            this.mundoAncho / 2,
            this.mundoAlto / 2,
            this.mundoAncho,
            this.mundoAlto,
            0x303030
        );

        // Crear cuadrícula para visualizar el movimiento
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x454545, 1);

        for (let x = 0; x <= this.mundoAncho; x += 100) {
            graphics.lineBetween(x, 0, x, this.mundoAlto);
        }

        for (let y = 0; y <= this.mundoAlto; y += 100) {
            graphics.lineBetween(0, y, this.mundoAncho, y);
        }

        // Crear el jugador
        this.jugador = this.add.rectangle(
            400, 300, 40, 40, 0x00ff88
        );

        // Activar la física del jugador
        this.physics.add.existing(this.jugador);

        this.jugador.body.setCollideWorldBounds(true);

        // Definir los límites del mundo físico
        this.physics.world.setBounds(
            0, 0, this.mundoAncho, this.mundoAlto
        );

        // Configurar la cámara
        this.cameras.main.setBounds(
            0, 0, this.mundoAncho, this.mundoAlto
        );

        this.cameras.main.startFollow(this.jugador);
        this.cameras.main.setZoom(1);

        // Controles del teclado
        this.teclas = this.input.keyboard.addKeys({
            arriba: "W",
            abajo: "S",
            izquierda: "A",
            derecha: "D",
            flechaArriba: "UP",
            flechaAbajo: "DOWN",
            flechaIzquierda: "LEFT",
            flechaDerecha: "RIGHT"
        });

        // Velocidad del jugador
        this.velocidad = 250;

        // Texto informativo
        this.add.text(20, 20, "WASD / Flechas: mover", {
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 8 }
        }).setScrollFactor(0);
    }

    update() {
        const cuerpo = this.jugador.body;

        let x = 0;
        let y = 0;

        // Movimiento horizontal
        if (
            this.teclas.izquierda.isDown ||
            this.teclas.flechaIzquierda.isDown
        ) {
            x = -1;
        } else if (
            this.teclas.derecha.isDown ||
            this.teclas.flechaDerecha.isDown
        ) {
            x = 1;
        }

        // Movimiento vertical
        if (
            this.teclas.arriba.isDown ||
            this.teclas.flechaArriba.isDown
        ) {
            y = -1;
        } else if (
            this.teclas.abajo.isDown ||
            this.teclas.flechaAbajo.isDown
        ) {
            y = 1;
        }

        // Evitar que el movimiento diagonal sea más rápido
        const longitud = Math.sqrt(x * x + y * y);

        if (longitud > 0) {
            x /= longitud;
            y /= longitud;
        }

        // Aplicar velocidad
        cuerpo.setVelocity(
            x * this.velocidad,
            y * this.velocidad
        );
    }
}

// Configuración general del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "juego",
    backgroundColor: "#303030",

    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },

    scene: Juego
};

// Iniciar Phaser
const juego = new Phaser.Game(config);
