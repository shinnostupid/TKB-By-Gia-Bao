/**
 * Core Game Engine for NEON DODGE
 * Coordinates state machine, game loop, difficulty progression, spawners,
 * entities, physics, and scoring.
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAME_OVER'
        this.difficulty = 'NORMAL'; // 'EASY', 'NORMAL', 'HARD'

        this.score = 0;
        this.highScore = 0;
        this.survivalTime = 0;
        this.level = 1;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboSurvivalTimer = 0;
        this.coinsCollected = 0;

        // Difficulty curves & parameters (HARD is genuinely intense & relentless)
        this.diffParams = {
            EASY: {
                astSpeedMin: 140,
                astSpeedMax: 220,
                astSpawnRate: 1.2,
                astSpawnMin: 0.8,
                allowEnemies: false,
                allowLasers: false,
                scoreMultiplier: 0.8
            },
            NORMAL: {
                astSpeedMin: 200,
                astSpeedMax: 340,
                astSpawnRate: 0.85,
                astSpawnMin: 0.38,
                allowEnemies: false,
                allowLasers: false,
                scoreMultiplier: 1.0
            },
            HARD: {
                astSpeedMin: 300,
                astSpeedMax: 520,
                astSpawnRate: 0.35, // Rapid, relentless asteroid storm
                astSpawnMin: 0.11, // Dense bullet-hell meteor field
                allowEnemies: true,
                allowLasers: true,
                scoreMultiplier: 2.5
            }
        };

        // Timers & Spawners
        this.asteroidTimer = 0;
        this.powerUpTimer = 6.0;
        this.enemyTimer = 2.0;
        this.laserTimer = 8.0;
        this.scoreAccumulator = 0;

        // Screen Shake & Slow Motion
        this.shakeIntensity = 0;
        this.shakeDecay = 24;
        this.timeScale = 1.0;
        this.slowMoTimer = 0;

        // Input state
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false,
            dash: false,
            pointerActive: false,
            pointerX: null,
            pointerY: null
        };


        // Assets cache
        this.assets = {};

        // Systems
        this.particles = new ParticleSystem();
        this.player = new Player(this);
        this.bullets = new BulletManager(this);
        this.enemies = new EnemyManager(this);
        this.lasers = new LaserManager(this);
        this.obstacles = new ObstacleManager(this);

        this.ui = null; // initialized in main.js
        this.lastTime = performance.now();

        this.setupCanvas();
    }

    setupCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);

        if (this.particles) {
            this.particles.resize(this.width, this.height);
        }
    }

    start(difficulty = 'NORMAL') {
        this.difficulty = difficulty;
        this.state = 'PLAYING';

        this.score = 0;
        this.survivalTime = 0;
        this.level = 1;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboSurvivalTimer = 0;
        this.coinsCollected = 0;
        this.timeScale = 1.0;
        this.slowMoTimer = 0;

        // Load high score for this difficulty
        const lb = window.storageManager.getLeaderboard(difficulty);
        this.highScore = (lb.length > 0 && lb[0].score) ? lb[0].score : 0;

        // Reset entities
        this.particles.clear();
        this.bullets.clear();
        this.enemies.clear();
        this.lasers.clear();
        this.obstacles.clear();

        // Spawn player at comfortable lower-center position
        this.player.reset(this.width / 2, Math.min(this.height - 120, this.height * 0.75));

        // Reset spawners
        const p = this.diffParams[this.difficulty];
        this.asteroidTimer = 0.2;
        this.powerUpTimer = 7.0;
        this.enemyTimer = this.difficulty === 'HARD' ? 1.8 : 4.5;
        this.laserTimer = this.difficulty === 'HARD' ? 8.0 : 16.0;
        this.scoreAccumulator = 0;

        // Start music & show HUD
        if (window.audioManager) window.audioManager.startMusic('game');
        this.ui.showHudScreen();
        this.ui.showBannerWarning(`MISSION START: ${difficulty} MODE`, 1600);
    }

    restart() {
        this.start(this.difficulty);
    }

    pause() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.ui.showPauseModal();
    }

    resume() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.ui.hidePauseModal();
        this.lastTime = performance.now();
    }

    quitToMenu() {
        this.state = 'MENU';
        this.particles.clear();
        this.bullets.clear();
        this.enemies.clear();
        this.lasers.clear();
        this.obstacles.clear();
        this.ui.showMenuScreen();
    }

    triggerScreenShake(intensity = 10) {
        const s = window.storageManager.getSettings();
        if (s.screenShake) {
            this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        }
    }

    addScore(points) {
        const p = this.diffParams[this.difficulty];
        const earned = points * this.combo * p.scoreMultiplier;
        this.score += earned;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }

    collectCoin(amount = 1) {
        this.coinsCollected += amount;
    }

    incrementCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        this.comboSurvivalTimer = 0;
        this.showToast(`COMBO x${this.combo}!`, '#00e5ff');
    }

    resetCombo() {
        if (this.combo > 1) {
            this.showToast(`COMBO LOST`, '#ff3366');
        }
        this.combo = 1;
        this.comboSurvivalTimer = 0;
    }

    showBannerWarning(text, duration = 2000) {
        if (this.ui) this.ui.showBannerWarning(text, duration);
    }

    showToast(text, color = '#00e5ff', duration = 1800) {
        if (this.ui) this.ui.showToast(text, color, duration);
    }

    // --- GAME LOOP ---

    loop(timestamp) {
        try {
            const rawDt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
            this.lastTime = timestamp;

            if (this.state === 'PLAYING') {
                // Slow motion handling during death impact
                if (this.slowMoTimer > 0) {
                    this.slowMoTimer -= rawDt;
                    this.timeScale = 0.25;
                    if (this.slowMoTimer <= 0) {
                        this.timeScale = 1.0;
                        this.finishGameOver();
                    }
                } else {
                    this.timeScale = 1.0;
                }

                const dt = rawDt * this.timeScale;
                this.update(dt);
            } else {
                // In MENU, PAUSED, SHOP or GAME OVER: keep the cosmos alive and flowing!
                if (this.particles) {
                    this.particles.update(rawDt, 0.7);
                }
            }

            this.render();
        } catch (err) {
            console.error("Game loop error:", err);
        } finally {
            requestAnimationFrame((t) => this.loop(t));
        }
    }


    update(dt) {
        // 1. Dynamic Time-Based Speed Scaling (Game gets dramatically faster as time goes on!)
        this.survivalTime += dt;
        const rampRate = this.difficulty === 'HARD' ? 0.55 : 0.35;
        this.speedScale = 1.0 + (this.survivalTime / 18) * rampRate;

        const currentLevel = 1 + Math.floor(this.survivalTime / 18);
        if (currentLevel !== this.level) {
            this.level = currentLevel;
            const hardBanners = {
                2: "METEOR SHOWER WAVE!",
                3: "ENEMY WING ASSAULT!",
                4: "CROSSFIRE BULLET HELL!",
                5: "ALERT: ELITE FLAGSHIP ARRIVED!"
            };
            const bannerMsg = (this.difficulty === 'HARD' && hardBanners[this.level])
                ? hardBanners[this.level]
                : `LEVEL ${this.level} REACHED! (SPEED x${this.speedScale.toFixed(1)})`;

            this.showBannerWarning(bannerMsg, 2400);
            if (window.audioManager) window.audioManager.playPowerup('energy');

            // Trigger Elite Flagship at Level 5 in HARD mode
            if (this.difficulty === 'HARD' && this.level === 5) {
                this.enemies.triggerEliteBossEvent();
            }
        }

        // 2. Score Accumulation over time (Ramps with speed scale and combo)
        this.scoreAccumulator += dt;
        if (this.scoreAccumulator >= 0.1) {
            const timeScore = (10 * this.combo * this.diffParams[this.difficulty].scoreMultiplier * this.speedScale) * this.scoreAccumulator;
            this.score += timeScore;
            if (this.score > this.highScore) this.highScore = this.score;
            this.scoreAccumulator = 0;
        }

        // 3. Combo survival ramp: survive 8s without hit -> +1 combo
        this.comboSurvivalTimer += dt;
        if (this.comboSurvivalTimer >= 8.0) {
            this.incrementCombo();
        }

        // 4. Update Entities (passing speedScale to particles for hyperdrive warp streaks)
        this.particles.update(dt, this.speedScale);
        this.player.update(dt, this.input);
        this.bullets.update(dt);
        this.enemies.update(dt);
        this.lasers.update(dt);
        this.obstacles.update(dt);

        // 5. Spawning Obstacles & Power-ups
        this.updateSpawners(dt);

        // 6. Collision Detection (including player blaster destruction)
        this.checkCollisions();

        // 7. Update HUD
        if (this.ui) {
            this.ui.updateHud({
                score: this.score,
                highScore: this.highScore,
                level: this.level,
                survivalTime: this.survivalTime,
                hasShield: this.player.hasShield,
                combo: this.combo,
                hasEMP: this.player.hasEMP,
                coins: this.coinsCollected
            });
        }

        // 8. Screen Shake Decay
        if (this.shakeIntensity > 0) {
            this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
        }
    }

    updateSpawners(dt) {
        const p = this.diffParams[this.difficulty];
        const levelFactor = Math.min(this.level - 1, 10) * 0.04;

        // Asteroid Spawning (Relentless storm in HARD mode)
        this.asteroidTimer -= dt;
        const baseInterval = Math.max(p.astSpawnMin, (p.astSpawnRate - levelFactor) / this.speedScale);
        if (this.asteroidTimer <= 0) {
            this.asteroidTimer = baseInterval;

            // In HARD mode: 45% chance to spawn dual asteroids simultaneously!
            const count = (this.difficulty === 'HARD' && Math.random() < 0.45) ? 2 : 1;

            for (let i = 0; i < count; i++) {
                const sizeRoll = Math.random();
                const size = sizeRoll < 0.45 ? 'small' : (sizeRoll < 0.8 ? 'medium' : 'large');
                const x = 30 + Math.random() * (this.width - 60);
                const speed = (p.astSpeedMin + Math.random() * (p.astSpeedMax - p.astSpeedMin)) * this.speedScale;
                const drift = (Math.random() - 0.5) * (90 * this.speedScale);

                this.obstacles.spawnAsteroid(size, x, speed, drift);
            }
        }

        // Power-up Spawning (every 10-16s)
        this.powerUpTimer -= dt;
        if (this.powerUpTimer <= 0) {
            this.powerUpTimer = 10 + Math.random() * 6;

            const roll = Math.random();
            let type = 'energy';
            if (roll < 0.28) type = 'energy';
            else if (roll < 0.52) type = 'shield';
            else if (roll < 0.72) type = 'weapon'; // Weapon upgrade
            else if (roll < 0.88) type = 'boost';
            else type = 'emp';

            const x = 50 + Math.random() * (this.width - 100);
            this.obstacles.spawnPowerUp(type, x, 140 * Math.min(1.5, this.speedScale));
        }

        // Enemy Ships Spawning (HARD Mode: Starts immediately in Level 1!)
        if (p.allowEnemies) {
            this.enemyTimer -= dt;
            if (this.enemyTimer <= 0) {
                this.enemyTimer = Math.max(1.2, (3.0 - (this.level * 0.25)) / this.speedScale);

                // Chance to spawn 2 Scouts in formation in HARD mode
                if (Math.random() < 0.4 && this.level >= 2) {
                    this.enemies.spawn('scout', this.width * 0.25, -50);
                    this.enemies.spawn('scout', this.width * 0.75, -50);
                } else {
                    const x = 60 + Math.random() * (this.width - 120);
                    let type = 'scout';
                    if (this.level >= 3 && Math.random() < 0.45) {
                        type = 'heavy';
                    } else if (this.level >= 2 && Math.random() < 0.65) {
                        type = 'fighter';
                    }
                    this.enemies.spawn(type, x, -50);
                }
            }
        }

        // Rotating Laser Beacons (HARD Mode: Starts from Level 1 after 8s!)
        if (p.allowLasers) {
            this.laserTimer -= dt;
            if (this.laserTimer <= 0) {
                this.laserTimer = Math.max(7.0, (11 + Math.random() * 4) / Math.sqrt(this.speedScale));

                // Pick pattern based on level
                const patterns = ['single'];
                if (this.level >= 2) patterns.push('double', 'fast');
                if (this.level >= 3) patterns.push('cross', 'reverse', 'safe_zone');

                const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
                const beaconX = this.width * (0.25 + Math.random() * 0.5);
                const rotSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.85 + Math.random() * 0.5) * Math.min(1.8, this.speedScale);

                this.lasers.spawnBeacon({
                    x: beaconX,
                    targetY: 130 + Math.random() * 80,
                    rotSpeed,
                    pattern: chosenPattern,
                    duration: 6.2
                });
            }
        }
    }


    checkCollisions() {
        if (!this.player.isAlive) return;

        // 1. Player vs Asteroids
        for (let ast of this.obstacles.asteroids) {
            if (!ast.active) continue;
            if (CollisionManager.circleIntersectsCircle(this.player.x, this.player.y, this.player.hitboxRadius, ast.x, ast.y, ast.hitRadius)) {
                ast.destroy(false);
                const killed = this.player.takeHit();
                if (killed) {
                    this.onPlayerKilled();
                    return;
                }
            }
        }

        // 2. Player vs Enemy Bullets
        for (let b of this.bullets.pool) {
            if (!b.active) continue;
            if (CollisionManager.circleIntersectsCircle(this.player.x, this.player.y, this.player.hitboxRadius, b.x, b.y, b.radius)) {
                b.active = false;
                const killed = this.player.takeHit();
                if (killed) {
                    this.onPlayerKilled();
                    return;
                }
            }
        }

        // 3. Player vs Rotating Lasers
        if (this.lasers.checkCollisionWithPlayer(this.player)) {
            const killed = this.player.takeHit();
            if (killed) {
                this.onPlayerKilled();
                return;
            }
        }

        // 4. Player vs Power-ups
        for (let p of this.obstacles.powerups) {
            if (!p.active) continue;
            if (CollisionManager.circleIntersectsCircle(this.player.x, this.player.y, this.player.hitboxRadius + 14, p.x, p.y, p.hitRadius)) {
                p.collect(this.player);
            }
        }

        // 4b. Player vs Coins
        if (this.obstacles.coins) {
            for (let c of this.obstacles.coins) {
                if (!c.active) continue;
                if (CollisionManager.circleIntersectsCircle(this.player.x, this.player.y, this.player.hitboxRadius + 16, c.x, c.y, c.hitRadius)) {
                    c.collect();
                }
            }
        }

        // 5. Player Bullets vs Asteroids (Destruction / Shatter)
        const playerBullets = this.bullets.getActivePlayerBullets();
        for (let b of playerBullets) {
            if (!b.active) continue;
            for (let ast of this.obstacles.asteroids) {
                if (!ast.active) continue;
                if (CollisionManager.circleIntersectsCircle(b.x, b.y, b.radius, ast.x, ast.y, ast.hitRadius)) {
                    b.active = false;
                    ast.takeDamage(b.damage);
                    this.triggerScreenShake(3);
                    break;
                }
            }
        }

        // 6. Player Bullets vs Enemy Ships (Destruction / Hits)
        for (let b of playerBullets) {
            if (!b.active) continue;
            for (let e of this.enemies.enemies) {
                if (!e.active) continue;
                if (CollisionManager.circleIntersectsCircle(b.x, b.y, b.radius, e.x, e.y, e.hitRadius)) {
                    b.active = false;
                    e.takeDamage(b.damage);
                    this.triggerScreenShake(4);
                    break;
                }
            }
        }
    }

    onPlayerKilled() {
        // Slow motion death effect
        this.slowMoTimer = 0.5;
        this.triggerScreenShake(20);

        if (this.particles) {
            this.particles.createExplosion(this.player.x, this.player.y, '#00f0ff', 50, 1.6);
            this.particles.createExplosion(this.player.x, this.player.y, '#ff3366', 30, 1.4);
            this.particles.createShockwave(this.player.x, this.player.y, 160, '#00ffff', 5);
        }
        if (window.audioManager) {
            window.audioManager.playExplosion(1.8);
            window.audioManager.playGameOver();
        }
    }

    finishGameOver() {
        this.state = 'GAME_OVER';

        // Submit score to leaderboard
        const pilotName = window.storageManager.getPilotName() || 'Pilot';
        const result = window.storageManager.addScore({
            name: pilotName,
            score: this.score,
            difficulty: this.difficulty,
            time: this.survivalTime,
            combo: this.maxCombo
        });

        // Persist collected coins to player wallet
        let newTotalCoins = 0;
        if (window.storageManager && this.coinsCollected > 0) {
            newTotalCoins = window.storageManager.addCoins(this.coinsCollected);
        } else if (window.storageManager) {
            newTotalCoins = window.storageManager.getCoins();
        }

        // Show Game Over UI
        this.ui.showGameOverScreen({
            score: Math.floor(this.score),
            difficulty: this.difficulty,
            time: Math.floor(this.survivalTime),
            combo: this.maxCombo,
            rank: result.rank,
            coinsCollected: this.coinsCollected,
            totalCoins: newTotalCoins
        });
    }

    render() {
        const ctx = this.ctx;
        ctx.save();

        // Apply Screen Shake
        if (this.shakeIntensity > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(sx, sy);
        }

        // 1. Parallax Stars and Cosmic Background
        this.particles.renderBackground(ctx);

        // 2. Entities (Only rendered during active gameplay)
        if (this.state !== 'MENU') {
            this.obstacles.render(ctx);
            this.enemies.render(ctx);
            this.lasers.render(ctx);
            this.bullets.render(ctx);
            this.player.render(ctx);
        }

        // 3. Particles & Shockwaves
        this.particles.renderParticles(ctx);

        ctx.restore();
    }
}

window.Game = Game;
