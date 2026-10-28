import { Scene } from 'phaser';

const ROAD = {
    left: 212,
    right: 812,
    top: 72,
    bottom: 768
};
const LANES = [312, 512, 712];
const RACE_DISTANCE = 500;
const BEST_TIME_KEY = 'terrarush.bestTime.level1';
const FINISH_LINE_Y = ROAD.top + 100;
const PLAYER_FRONT_OFFSET = 44;
const START_POSITION_Y = ROAD.bottom - 100;
const FINISH_POSITION_Y = FINISH_LINE_Y + PLAYER_FRONT_OFFSET;
const RACE_POSITION_RANGE = START_POSITION_Y - FINISH_POSITION_Y;

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#9dc9ce');
        this.distance = 0;
        this.elapsed = 0;
        this.bestTime = this.loadBestTime();
        this.lives = 3;
        this.speed = 360;
        this.hitCooldown = 0;
        this.gameOver = false;
        this.obstacleTimer = 0.8;
        this.obstacles = [];
        this.trees = [];
        this.roadOffset = 0;
        this.finalStretch = false;
        this.keys = this.input.keyboard.addKeys('A,D,W,S,LEFT,RIGHT,UP,DOWN');

        this.drawRoad();
        this.createRoadMarkings();
        this.createSideTrees();
        this.createFinishLine();
        this.createPlayerCar();
        this.createHud();
        this.createResultOverlay();
        this.startRaceMusic();
        this.events.once('shutdown', this.stopRaceMusic, this);
    }

    drawRoad ()
    {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x87a97c, 1);
        graphics.fillRect(0, 0, 1024, 768);
        graphics.fillStyle(0x728c69, 1);
        graphics.fillRect(0, 0, ROAD.left - 10, 768);
        graphics.fillRect(ROAD.right + 10, 0, 1024 - ROAD.right - 10, 768);

        for (let y = -24; y < 768; y += 86)
        {
            graphics.fillStyle(0xe4e1c8, 1);
            graphics.fillRect(ROAD.left - 12, y, 12, 42);
            graphics.fillRect(ROAD.right, y, 12, 42);
            graphics.fillStyle(0xd85e50, 1);
            graphics.fillRect(ROAD.left - 12, y + 42, 12, 42);
            graphics.fillRect(ROAD.right, y + 42, 12, 42);
        }

        graphics.fillStyle(0x303943, 1);
        graphics.fillRect(ROAD.left, 0, ROAD.right - ROAD.left, 768);
        graphics.fillStyle(0x414951, 1);
        graphics.fillRect(ROAD.left + 12, 0, ROAD.right - ROAD.left - 24, 768);
        graphics.fillStyle(0xf1df9b, 1);
        graphics.fillRect(ROAD.left + 11, 0, 5, 768);
        graphics.fillRect(ROAD.right - 16, 0, 5, 768);
    }

    createRoadMarkings ()
    {
        this.laneMarks = [];
        for (const x of [LANES[0] + 100, LANES[1] + 100])
        {
            for (let index = 0; index < 12; index += 1)
            {
                const mark = this.add.rectangle(x, index * 76 - 20, 8, 40, 0xf3f0d7, 0.8);
                this.laneMarks.push(mark);
            }
        }
    }

    createSideTrees ()
    {
        for (let index = 0; index < 12; index += 1)
        {
            this.spawnTree(index * 72 - 55, 'left');
            this.spawnTree(index * 72 - 19, 'right');
        }
    }

    spawnTree (y, side)
    {
        const x = side === 'left'
            ? 28 + Math.random() * (ROAD.left - 76)
            : ROAD.right + 48 + Math.random() * (988 - ROAD.right - 48);
        const tree = this.add.container(x, y).setDepth(2);
        const foliage = this.add.graphics();
        const greens = [0x345b3e, 0x3c6745, 0x47754c, 0x527b4c];
        foliage.fillStyle(0x644d34, 1);
        foliage.fillRect(-5, 10, 10, 35);
        foliage.fillStyle(greens[Math.floor(Math.random() * greens.length)], 1);
        foliage.fillCircle(0, -4, 25);
        foliage.fillCircle(-15, 5, 18);
        foliage.fillCircle(16, 7, 17);
        foliage.fillStyle(0x71915a, 0.65);
        foliage.fillCircle(-7, -13, 9);
        tree.add(foliage);
        tree.setScale(0.52);
        this.trees.push({ view: tree, x, y, side, scale: 0.52 });
    }

    createCar (x, y, color, scale = 1)
    {
        const car = this.add.container(x, y).setScale(scale);
        car.add([
            this.add.rectangle(-25, -25, 12, 27, 0x15191d),
            this.add.rectangle(25, -25, 12, 27, 0x15191d),
            this.add.rectangle(-25, 25, 12, 27, 0x15191d),
            this.add.rectangle(25, 25, 12, 27, 0x15191d),
            this.add.rectangle(0, 0, 48, 76, color).setStrokeStyle(2, 0xffffff, 0.75),
            this.add.rectangle(0, -9, 34, 24, 0x9bd4dc).setStrokeStyle(2, 0xd7f0eb),
            this.add.rectangle(0, 21, 33, 14, 0x9b3733),
            this.add.rectangle(-14, -33, 9, 5, 0xfff0a3),
            this.add.rectangle(14, -33, 9, 5, 0xfff0a3)
        ]);
        return car;
    }

    createPlayerCar ()
    {
        this.playerX = 512;
        this.playerY = START_POSITION_Y;
        this.playerCar = this.createCar(this.playerX, this.playerY, 0x29b995, 1.15).setDepth(5);
        this.playerCar.add(this.add.text(0, 7, 'TR', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 14,
            color: '#ffffff'
        }).setOrigin(0.5));
    }

    createHud ()
    {
        this.add.rectangle(512, 34, 1024, 68, 0x111921, 0.92).setDepth(10);
        this.add.text(28, 17, 'TERRARUSH', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 25,
            color: '#f3f5eb',
            letterSpacing: 3
        }).setDepth(11);
        this.add.text(30, 48, 'CARRERA  /  NIVEL 1', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            color: '#9ab1b5',
            letterSpacing: 2
        }).setDepth(11);

        this.distanceText = this.add.text(512, 20, '0 / 500 m', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 20,
            color: '#e5d28b'
        }).setOrigin(0.5, 0).setDepth(11);
        this.add.text(512, 47, 'META', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            color: '#aab4ae',
            letterSpacing: 3
        }).setOrigin(0.5, 0).setDepth(11);

        this.livesText = this.add.text(690, 24, 'VIDAS  3', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 18,
            color: '#f3a85e'
        }).setOrigin(1, 0).setDepth(11);
        this.bestTimeText = this.add.text(850, 49, `RÉCORD  ${this.formatTime(this.bestTime)}`, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 12,
            color: '#e5d28b'
        }).setOrigin(1, 0).setDepth(11);
        this.timeText = this.add.text(990, 22, '00:00', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 22,
            color: '#5ce1c3'
        }).setOrigin(1, 0).setDepth(11);
        this.add.text(990, 49, 'CRONO', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            color: '#aab4ae',
            letterSpacing: 2
        }).setOrigin(1, 0).setDepth(11);

        this.add.rectangle(512, 746, 1024, 44, 0x111921, 0.85).setDepth(10);
        this.add.text(512, 746, 'A / D MOVERSE A LOS LADOS  ·  W / S O ↑ / ↓ ADELANTE Y ATRÁS  ·  ESQUIVA EL TRÁFICO', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            color: '#e5e9d8',
            letterSpacing: 1
        }).setOrigin(0.5).setDepth(11);
    }

    createResultOverlay ()
    {
        this.resultOverlay = this.add.container(0, 0).setDepth(30).setVisible(false);
        this.resultOverlay.add(this.add.rectangle(512, 384, 1024, 768, 0x080d12, 0.82));
        this.resultTitle = this.add.text(512, 318, '', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 46,
            color: '#f3f5eb',
            letterSpacing: 3
        }).setOrigin(0.5);
        this.resultOverlay.add(this.resultTitle);
        this.resultMessage = this.add.text(512, 382, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 20,
            color: '#b8c5c0',
            letterSpacing: 1
        }).setOrigin(0.5);
        this.resultOverlay.add(this.resultMessage);

        const restartButton = this.add.rectangle(512, 490, 260, 62, 0x5ce1c3)
            .setInteractive({ useHandCursor: true });
        const restartLabel = this.add.text(512, 490, 'VOLVER A CORRER', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 17,
            color: '#08130f',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.resultOverlay.add([restartButton, restartLabel]);
        restartButton.on('pointerover', () => restartButton.setFillStyle(0x82f0d7));
        restartButton.on('pointerout', () => restartButton.setFillStyle(0x5ce1c3));
        restartButton.on('pointerup', () => this.scene.restart());
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.gameOver)
            {
                this.scene.restart();
            }
        });
        this.input.keyboard.on('keydown-R', () => {
            if (this.gameOver)
            {
                this.scene.restart();
            }
        });
    }

    startRaceMusic ()
    {
        const AudioContextConstructor = window.AudioContext;
        if (!AudioContextConstructor)
        {
            console.warn('TerraRush: Web Audio no está disponible; la música de carrera se desactivó.');
            return;
        }

        const context = new AudioContextConstructor();
        const masterGain = context.createGain();
        masterGain.gain.value = 0.16;
        masterGain.connect(context.destination);

        const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.08), context.sampleRate);
        const noise = noiseBuffer.getChannelData(0);
        for (let index = 0; index < noise.length; index += 1)
        {
            noise[index] = Math.random() * 2 - 1;
        }

        this.raceAudio = {
            context,
            masterGain,
            noiseBuffer,
            nextNoteTime: context.currentTime + 0.05,
            step: 0,
            timer: null
        };
        context.resume().catch((error) => {
            console.warn('TerraRush: no se pudo iniciar la música de carrera.', error);
        });
        this.raceAudio.timer = window.setInterval(() => this.scheduleRaceMusic(), 50);
    }

    scheduleRaceMusic ()
    {
        const audio = this.raceAudio;
        if (!audio || audio.context.state !== 'running')
        {
            return;
        }

        const eighthNote = 60 / 132 / 2;
        if (audio.nextNoteTime < audio.context.currentTime - 0.1)
        {
            audio.nextNoteTime = audio.context.currentTime + 0.05;
        }

        while (audio.nextNoteTime < audio.context.currentTime + 0.15)
        {
            const step = audio.step % 16;
            const melody = [76, 79, 83, 79, 81, 84, 83, 79, 76, 79, 84, 86, 83, 81, 79, 74];
            const bass = [45, 45, 52, 52, 41, 41, 48, 48, 43, 43, 50, 50, 40, 40, 47, 47];
            const time = audio.nextNoteTime;

            this.playMusicTone(audio, bass[step], time, eighthNote * 1.8, 0.12, 'triangle');
            this.playMusicTone(audio, melody[step], time, eighthNote * 0.8, 0.075, 'sawtooth');
            if (step % 4 === 0)
            {
                this.playMusicKick(audio, time);
            }
            if (step % 4 === 2)
            {
                this.playMusicHat(audio, time);
            }

            audio.step += 1;
            audio.nextNoteTime += eighthNote;
        }
    }

    playMusicTone (audio, midiNote, time, duration, volume, waveform)
    {
        const oscillator = audio.context.createOscillator();
        const gain = audio.context.createGain();
        oscillator.type = waveform;
        oscillator.frequency.value = 440 * Math.pow(2, (midiNote - 69) / 12);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(volume, time + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        oscillator.connect(gain);
        gain.connect(audio.masterGain);
        oscillator.start(time);
        oscillator.stop(time + duration + 0.02);
    }

    playMusicKick (audio, time)
    {
        const oscillator = audio.context.createOscillator();
        const gain = audio.context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(115, time);
        oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.14);
        gain.gain.setValueAtTime(0.34, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);
        oscillator.connect(gain);
        gain.connect(audio.masterGain);
        oscillator.start(time);
        oscillator.stop(time + 0.18);
    }

    playMusicHat (audio, time)
    {
        const source = audio.context.createBufferSource();
        const filter = audio.context.createBiquadFilter();
        const gain = audio.context.createGain();
        source.buffer = audio.noiseBuffer;
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.045, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audio.masterGain);
        source.start(time);
        source.stop(time + 0.05);
    }

    stopRaceMusic ()
    {
        const audio = this.raceAudio;
        if (!audio)
        {
            return;
        }

        this.raceAudio = null;
        window.clearInterval(audio.timer);
        audio.masterGain.gain.setTargetAtTime(0.0001, audio.context.currentTime, 0.04);
        audio.context.close().catch((error) => {
            console.warn('TerraRush: no se pudo cerrar el audio de carrera.', error);
        });
    }

    spawnObstacle ()
    {
        const lane = Math.floor(Math.random() * LANES.length);
        const isBarrier = Math.random() < 0.35;
        const color = [0xe85e51, 0x527fd0, 0xe7a943][Math.floor(Math.random() * 3)];
        const view = isBarrier
            ? this.createBarrier(LANES[lane], -55)
            : this.createCar(LANES[lane], -55, color, 0.9);
        view.setDepth(4);
        this.obstacles.push({
            view,
            x: LANES[lane],
            y: -55,
            width: isBarrier ? 68 : 54,
            height: isBarrier ? 36 : 78,
            drift: isBarrier ? 0 : Math.random() * Math.PI * 2,
            driftAmount: isBarrier ? 0 : 4 + Math.random() * 7,
            baseX: LANES[lane],
            carSpeed: isBarrier ? 1 : 0.94 + Math.random() * 0.12
        });
    }

    createBarrier (x, y)
    {
        const barrier = this.add.container(x, y);
        barrier.add([
            this.add.rectangle(0, 0, 68, 38, 0xe6a43b).setStrokeStyle(3, 0x302a20),
            this.add.rectangle(0, 0, 12, 40, 0x30343a),
            this.add.rectangle(0, 0, 54, 6, 0x30343a)
        ]);
        return barrier;
    }

    update (_time, delta)
    {
        if (this.gameOver)
        {
            return;
        }

        const seconds = delta / 1000;
        this.elapsed += seconds;
        this.hitCooldown = Math.max(0, this.hitCooldown - seconds);
        this.speed = Math.min(520, 360 + this.elapsed * 2.2);
        this.timeText.setText(this.formatTime(this.elapsed));

        if (this.keys.A.isDown || this.keys.LEFT.isDown)
        {
            this.playerX -= 370 * seconds;
        }
        if (this.keys.D.isDown || this.keys.RIGHT.isDown)
        {
            this.playerX += 370 * seconds;
        }
        if (this.keys.W.isDown || this.keys.UP.isDown)
        {
            this.playerY -= 300 * seconds;
        }
        if (this.keys.S.isDown || this.keys.DOWN.isDown)
        {
            this.playerY += 300 * seconds;
        }
        this.playerX = Math.max(ROAD.left + 60, Math.min(ROAD.right - 60, this.playerX));
        this.playerY = Math.max(ROAD.top + 60, Math.min(START_POSITION_Y, this.playerY));
        if (this.finalStretch)
        {
            const finalStretchRange = Math.max(1, this.finalStretchStartY - FINISH_POSITION_Y);
            const finalStretchProgress = Math.max(0, Math.min(
                1,
                (this.finalStretchStartY - this.playerY) / finalStretchRange
            ));
            this.distance = this.finalStretchStartDistance
                + (RACE_DISTANCE - this.finalStretchStartDistance) * finalStretchProgress;
        }
        else
        {
            const forwardInput = Number(this.keys.W.isDown || this.keys.UP.isDown)
                - Number(this.keys.S.isDown || this.keys.DOWN.isDown);
            const distanceSpeed = Math.max(this.speed * 0.5, this.speed + forwardInput * 180);
            this.distance = Math.min(RACE_DISTANCE, this.distance + distanceSpeed * seconds / 36);
        }
        this.distanceText.setText(`${Math.floor(this.distance)} / ${RACE_DISTANCE} m`);
        this.playerCar.setX(this.playerX);
        this.playerCar.setY(this.playerY);

        this.updateFinishLine();
        if (!this.finalStretch)
        {
            this.updateRoadMarkings(seconds);
            this.updateSideTrees(seconds);
            this.updateObstacles(seconds);
        }
        this.checkCollisions();

        if (this.lives <= 0)
        {
            this.endRace(false, 'Se agotaron tus vidas. ¡Inténtalo de nuevo!');
        }
        else if (this.finishLine.visible && this.playerY - PLAYER_FRONT_OFFSET <= FINISH_LINE_Y)
        {
            this.endRace(true, '¡Cruzaste la meta!');
        }
    }

    formatTime (seconds)
    {
        if (seconds === null || !Number.isFinite(seconds))
        {
            return '--:--';
        }

        const totalCentiseconds = Math.floor(seconds * 100);
        const minutes = Math.floor(totalCentiseconds / 6000);
        const wholeSeconds = Math.floor(totalCentiseconds / 100) % 60;
        const centiseconds = totalCentiseconds % 100;
        return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    loadBestTime ()
    {
        try
        {
            const storedTime = window.localStorage.getItem(BEST_TIME_KEY);
            if (storedTime === null)
            {
                return null;
            }

            const bestTime = Number(storedTime);
            if (Number.isFinite(bestTime) && bestTime > 0)
            {
                return bestTime;
            }

            console.warn('TerraRush: el récord guardado no es válido y se ignorará.');
            return null;
        }
        catch (error)
        {
            console.warn('TerraRush: no se pudo leer el récord guardado.', error);
            return null;
        }
    }

    saveBestTime (time)
    {
        try
        {
            window.localStorage.setItem(BEST_TIME_KEY, String(time));
        }
        catch (error)
        {
            console.warn('TerraRush: no se pudo guardar el récord.', error);
        }

        this.bestTime = time;
        this.bestTimeText.setText(`RÉCORD  ${this.formatTime(this.bestTime)}`);
    }

    updateRoadMarkings (seconds)
    {
        this.roadOffset = (this.roadOffset + this.speed * seconds) % 76;
        this.laneMarks.forEach((mark, index) => {
            mark.y = ((index % 12) * 76 + this.roadOffset) % 912 - 72;
        });
    }

    updateSideTrees (seconds)
    {
        for (const tree of this.trees)
        {
            tree.y += this.speed * seconds;
            tree.scale = 0.52 + Math.max(0, tree.y) / ROAD.bottom * 0.65;
            tree.view.setPosition(tree.x, tree.y);
            tree.view.setScale(tree.scale);

            if (tree.y > ROAD.bottom + 55)
            {
                tree.y = -35 - Math.random() * 100;
                tree.x = tree.side === 'left'
                    ? 28 + Math.random() * (ROAD.left - 76)
                    : ROAD.right + 48 + Math.random() * (988 - ROAD.right - 48);
                tree.view.setPosition(tree.x, tree.y);
            }
        }
    }

    updateFinishLine ()
    {
        const progress = Math.max(0, Math.min(1, this.distance / RACE_DISTANCE));
        const revealStart = 0.85;
        const isFinalStretch = progress >= revealStart;
        this.finishLine.setVisible(isFinalStretch);

        if (isFinalStretch && !this.finalStretch)
        {
            this.finalStretch = true;
            this.finalStretchStartDistance = this.distance;
            this.finalStretchStartY = this.playerY;
            this.obstacles.forEach((obstacle) => obstacle.view.destroy());
            this.obstacles = [];
        }
    }

    updateObstacles (seconds)
    {
        this.obstacleTimer -= seconds;
        if (this.obstacleTimer <= 0)
        {
            this.spawnObstacle();
            this.obstacleTimer = Math.max(0.62, 1.18 - this.elapsed * 0.008) + Math.random() * 0.4;
        }

        for (let index = this.obstacles.length - 1; index >= 0; index -= 1)
        {
            const obstacle = this.obstacles[index];
            obstacle.y += this.speed * obstacle.carSpeed * seconds;
            obstacle.x = obstacle.baseX + Math.sin(this.elapsed * 2.2 + obstacle.drift) * obstacle.driftAmount;
            obstacle.view.setX(obstacle.x);
            obstacle.view.setY(obstacle.y);
            if (obstacle.y > ROAD.bottom + 70)
            {
                obstacle.view.destroy();
                this.obstacles.splice(index, 1);
            }
        }
    }

    checkCollisions ()
    {
        if (this.hitCooldown > 0)
        {
            return;
        }

        const hitIndex = this.obstacles.findIndex((obstacle) =>
            Math.abs(this.playerX - obstacle.x) < obstacle.width / 2 + 26
            && Math.abs(this.playerY - obstacle.y) < obstacle.height / 2 + 39
        );
        if (hitIndex < 0)
        {
            return;
        }

        const [obstacle] = this.obstacles.splice(hitIndex, 1);
        obstacle.view.destroy();
        this.lives -= 1;
        this.livesText.setText(`VIDAS  ${this.lives}`);
        this.hitCooldown = 1.3;
        this.cameras.main.shake(180, 0.007);
        this.tweens.add({
            targets: this.playerCar,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4
        });
    }

    endRace (won, message)
    {
        this.gameOver = true;
        this.stopRaceMusic();
        if (won && (this.bestTime === null || this.elapsed < this.bestTime))
        {
            this.saveBestTime(this.elapsed);
        }

        this.resultTitle.setText(won ? '¡META ALCANZADA!' : 'CARRERA TERMINADA');
        this.resultTitle.setColor(won ? '#5ce1c3' : '#f3f5eb');
        this.resultMessage.setText(`${message}\nTiempo: ${this.formatTime(this.elapsed)}  ·  Récord: ${this.formatTime(this.bestTime)}`);
        this.resultOverlay.list[0].setFillStyle(0x080d12, won ? 0.48 : 0.82);
        this.resultOverlay.setVisible(true);
    }

    createFinishLine ()
    {
        const finishLine = this.add.container(512, FINISH_LINE_Y).setDepth(3).setVisible(false);
        finishLine.add(this.add.rectangle(
            0,
            -FINISH_LINE_Y / 2,
            ROAD.right - ROAD.left + 24,
            FINISH_LINE_Y,
            0x87a97c
        ));

        for (let column = 0; column < 24; column += 1)
        {
            for (let row = 0; row < 2; row += 1)
            {
                const color = (column + row) % 2 === 0 ? 0xf6f4e9 : 0x20262b;
                finishLine.add(this.add.rectangle(-287.5 + column * 25, row * 22, 25, 22, color));
            }
        }

        this.addFinishFlag(finishLine, -288);
        this.addFinishFlag(finishLine, 288);
        this.finishLine = finishLine;
    }

    addFinishFlag (finishLine, x)
    {
        const flag = this.add.container(x, 22);
        const direction = x < 0 ? 1 : -1;
        flag.add([
            this.add.rectangle(0, -48, 5, 96, 0xf4f0dc),
            this.add.rectangle(direction * 28, -80, 68, 38, 0x36c39e).setStrokeStyle(2, 0xf4f0dc),
            this.add.text(direction * 28, -80, 'META', {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 13,
                color: '#ffffff'
            }).setOrigin(0.5)
        ]);
        finishLine.add(flag);
    }
}
