/**
 * Asteroids & Power-ups Manager for NEON DODGE
 * Manages tumbling space rocks of various sizes and glowing collectible power-ups.
 */

class Asteroid {
    constructor(game, { size = 'medium', x, y, speed = 200, drift = 0 }) {
        this.game = game;
        this.size = size; // 'small', 'medium', 'large'
        this.x = x;
        this.y = y;
        this.vy = speed;
        this.vx = drift;
        this.angle = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 2.5; // Tumble speed
        this.active = true;

        switch (size) {
            case 'small':
                this.width = 38;
                this.height = 38;
                this.hitRadius = 15;
                this.sprite = game.assets['asteroid-small'] || game.assets['asteroid-medium'];
                this.scoreValue = 30;
                this.hp = 1;
                break;
            case 'medium':
                this.width = 62;
                this.height = 62;
                this.hitRadius = 26;
                this.sprite = game.assets['asteroid-medium'];
                this.scoreValue = 60;
                this.hp = 2;
                break;
            case 'large':
                this.width = 96;
                this.height = 96;
                this.hitRadius = 42;
                this.sprite = game.assets['asteroid-large'];
                this.scoreValue = 120;
                this.hp = 4;
                break;
        }

        this.maxHp = this.hp;
        this.hitFlashTimer = 0;
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        this.hitFlashTimer = 0.09;

        if (this.game.particles) {
            this.game.particles.createSparks(this.x, this.y, 6, '#00f0ff');
        }
        if (window.audioManager) {
            window.audioManager.playHitImpact();
        }

        if (this.hp <= 0) {
            this.destroy(true);
            return true;
        }
        return false;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.rotSpeed * dt;

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        // Out of screen bounds check
        if (this.x < -80 || this.x > this.game.width + 80 || this.y > this.game.height + 120) {
            this.active = false;
        }
    }

    destroy(killedByPlayer = false) {
        this.active = false;

        if (this.game.particles) {
            const count = this.size === 'large' ? 35 : (this.size === 'medium' ? 22 : 14);
            this.game.particles.createExplosion(this.x, this.y, '#00e5ff', count, 1.0);
            this.game.particles.createSparks(this.x, this.y, 10, '#ff9900');

            if (killedByPlayer) {
                this.game.particles.createFloatingText(this.x, this.y - 20, `+${this.scoreValue}`, '#00f0ff');
            }
        }

        if (window.audioManager) {
            window.audioManager.playExplosion(this.size === 'large' ? 1.0 : (this.size === 'medium' ? 0.7 : 0.4));
        }

        if (killedByPlayer) {
            this.game.addScore(this.scoreValue);

            // Shatter mechanics: large splits into 2 medium, medium splits into 2 small!
            if (this.size === 'large' && this.game.obstacles) {
                this.game.obstacles.spawnAsteroid('medium', this.x - 25, this.vy * 1.1, -70);
                this.game.obstacles.spawnAsteroid('medium', this.x + 25, this.vy * 1.1, 70);
                // Drop 2-3 Coins
                const coinCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < coinCount; i++) {
                    const scatterX = (Math.random() - 0.5) * 140;
                    const scatterY = (Math.random() - 0.5) * 80 + 40;
                    this.game.obstacles.spawnCoin(this.x, this.y, scatterX, scatterY, 1);
                }
            } else if (this.size === 'medium' && this.game.obstacles) {
                this.game.obstacles.spawnAsteroid('small', this.x - 18, this.vy * 1.2, -60);
                this.game.obstacles.spawnAsteroid('small', this.x + 18, this.vy * 1.2, 60);
                // Drop 1-2 Coins
                if (Math.random() < 0.8) {
                    const scatterX = (Math.random() - 0.5) * 100;
                    const scatterY = (Math.random() - 0.5) * 60 + 50;
                    this.game.obstacles.spawnCoin(this.x, this.y, scatterX, scatterY, 1);
                }
            } else if (this.size === 'small' && this.game.obstacles) {
                // 45% chance to drop 1 coin
                if (Math.random() < 0.45) {
                    const scatterX = (Math.random() - 0.5) * 80;
                    const scatterY = 60 + Math.random() * 40;
                    this.game.obstacles.spawnCoin(this.x, this.y, scatterX, scatterY, 1);
                }
            }
        }
    }

    render(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            if (this.hitFlashTimer > 0) {
                ctx.shadowBlur = 28;
                ctx.shadowColor = '#ffffff';
            } else {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00aaff';
            }
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : '#445566';
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.hitRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

class PowerUp {
    constructor(game, { type = 'energy', x, y, speed = 140 }) {
        this.game = game;
        this.type = type; // 'energy', 'shield', 'boost', 'emp', 'weapon'
        this.x = x;
        this.y = y;
        this.vy = speed;
        this.time = 0;
        this.active = true;

        this.width = 46;
        this.height = 46;
        this.hitRadius = 22;

        switch (type) {
            case 'shield':
                this.sprite = game.assets['shield'];
                this.color = '#00ffcc';
                break;
            case 'weapon':
                this.sprite = game.assets['energy'];
                this.color = '#ff00ea';
                break;
            case 'boost':
            case 'emp':
            case 'energy':
            default:
                this.sprite = game.assets['energy'];
                this.color = '#00e5ff';
                break;
        }
    }

    update(dt) {
        if (!this.active) return;
        this.time += dt;

        // Gentle horizontal floating wave
        this.x += Math.sin(this.time * 3) * 60 * dt;
        this.y += this.vy * dt;

        if (this.y > this.game.height + 80) {
            this.active = false;
        }
    }

    collect(player) {
        this.active = false;

        switch (this.type) {
            case 'energy':
                this.game.addScore(500);
                this.game.incrementCombo();
                this.game.showToast("+500 ENERGY BONUS!", '#00e5ff');
                if (window.audioManager) window.audioManager.playPowerup('energy');
                break;

            case 'shield':
                player.applyShield();
                this.game.showToast("SHIELD ACTIVATED!", '#00ffcc');
                if (window.audioManager) window.audioManager.playPowerup('shield');
                break;

            case 'weapon':
                player.upgradeWeapon();
                this.game.showToast("WEAPON UPGRADE!", '#ff00ea');
                break;

            case 'boost':
                player.applyBoost(6.0);
                this.game.showToast("THRUST BOOST ACTIVE!", '#ffff00');
                if (window.audioManager) window.audioManager.playPowerup('energy');
                break;

            case 'emp':
                player.grantEMP();
                this.game.showToast("EMP READY! PRESS SPACE / EMP", '#ff0055');
                if (window.audioManager) window.audioManager.playPowerup('energy');
                break;
        }

        if (this.game.particles) {
            this.game.particles.createShockwave(this.x, this.y, 70, this.color, 3);
            this.game.particles.createSparks(this.x, this.y, 14, this.color);
        }
    }

    render(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing glow
        const pulse = 1 + Math.sin(this.time * 6) * 0.12;
        ctx.scale(pulse, pulse);

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = this.color;
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.hitRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Coin {
    constructor(game, { x, y, vx = 0, vy = 120, value = 1 }) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.value = value;
        this.active = true;
        this.time = Math.random() * Math.PI * 2;
        this.hitRadius = 18;
        this.width = 34;
        this.height = 34;
        this.color = '#ffd700';
        this.sprite = game.assets ? game.assets['coin-icon'] : null;
        this.spinSpeed = 4.2;
    }

    update(dt) {
        if (!this.active) return;
        this.time += dt * this.spinSpeed;

        // Active Quantum Magnet Attraction toward Player
        if (this.game.player && this.game.player.isAlive) {
            const px = this.game.player.x;
            const py = this.game.player.y;
            const dx = px - this.x;
            const dy = py - this.y;
            const dist = Math.hypot(dx, dy);

            const magnetRadius = this.game.player.magnetRadius || 75;
            if (dist < magnetRadius && dist > 1) {
                // High velocity tractor beam pull
                const pullPower = (1 - dist / magnetRadius) * 920 + 380;
                this.vx += (dx / dist) * pullPower * dt;
                this.vy += (dy / dist) * pullPower * dt;
                this.vx *= 0.93;
                this.vy *= 0.93;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Despawn check
        if (this.y > this.game.height + 70 || this.x < -70 || this.x > this.game.width + 70) {
            this.active = false;
        }
    }

    collect() {
        this.active = false;
        this.game.collectCoin(this.value);

        if (this.game.particles) {
            this.game.particles.createSparks(this.x, this.y, 12, '#ffd700');
            this.game.particles.createFloatingText(this.x, this.y - 18, `+${this.value} XU`, '#ffd700');
            this.game.particles.createShockwave(this.x, this.y, 35, '#ffea00', 2);
        }

        if (window.audioManager) {
            window.audioManager.playCoin();
        }
    }

    render(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Dynamic 3D spinning illusion
        const spinScaleX = Math.cos(this.time);
        ctx.scale(Math.abs(spinScaleX) * 0.75 + 0.25, 1);

        const img = this.sprite || (this.game.assets ? this.game.assets['coin-icon'] : null);
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffd700';
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // High fidelity glowing cyber coin
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#ffd700';
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(0, 0, this.hitRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(0, 0, this.hitRadius * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.asteroids = [];
        this.powerups = [];
        this.coins = [];
    }

    spawnAsteroid(size, x, speed, drift) {
        const ast = new Asteroid(this.game, { size, x, y: -60, speed, drift });
        this.asteroids.push(ast);
        return ast;
    }

    spawnPowerUp(type, x, speed) {
        const p = new PowerUp(this.game, { type, x, y: -50, speed });
        this.powerups.push(p);
        return p;
    }

    spawnCoin(x, y, vx = 0, vy = 120, value = 1) {
        const coin = new Coin(this.game, { x, y, vx, vy, value });
        this.coins.push(coin);
        return coin;
    }

    update(dt) {
        if (Array.isArray(this.asteroids)) {
            for (let i = this.asteroids.length - 1; i >= 0; i--) {
                const a = this.asteroids[i];
                if (a && a.update) a.update(dt);
                if (!a || !a.active) {
                    this.asteroids.splice(i, 1);
                }
            }
        }

        if (Array.isArray(this.powerups)) {
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const p = this.powerups[i];
                if (p && p.update) p.update(dt);
                if (!p || !p.active) {
                    this.powerups.splice(i, 1);
                }
            }
        }

        if (Array.isArray(this.coins)) {
            for (let i = this.coins.length - 1; i >= 0; i--) {
                const c = this.coins[i];
                if (c && c.update) c.update(dt);
                if (!c || !c.active) {
                    this.coins.splice(i, 1);
                }
            }
        }
    }

    render(ctx) {
        if (Array.isArray(this.asteroids)) {
            for (let a of this.asteroids) {
                if (a && a.render) a.render(ctx);
            }
        }
        if (Array.isArray(this.powerups)) {
            for (let p of this.powerups) {
                if (p && p.render) p.render(ctx);
            }
        }
        if (Array.isArray(this.coins)) {
            for (let c of this.coins) {
                if (c && c.render) c.render(ctx);
            }
        }
    }

    clear() {
        this.asteroids = [];
        this.powerups = [];
        this.coins = [];
    }
}

window.ObstacleManager = ObstacleManager;
window.Asteroid = Asteroid;
window.PowerUp = PowerUp;
window.Coin = Coin;

