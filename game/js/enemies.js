/**
 * Enemy Ships System for NEON DODGE (Hard Mode & Boss Events)
 * Manages Scout, Fighter, Heavy, and Elite flagship AI, movements, and firing intervals.
 */

class EnemyShip {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type; // 'scout', 'fighter', 'heavy', 'elite'
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.active = true;

        this.shootTimer = 0;
        this.shootInterval = 2.0;
        this.stateTime = 0;

        // Type-specific configurations
        switch (type) {
            case 'scout':
                this.width = 44;
                this.height = 44;
                this.hitRadius = 18;
                this.hp = 1;
                this.vy = 180;
                this.shootInterval = 1.4;
                this.sprite = game.assets['enemy-scout'];
                this.color = '#ff3366';
                break;

            case 'fighter':
                this.width = 58;
                this.height = 58;
                this.hitRadius = 24;
                this.hp = 2;
                this.vy = 110;
                this.vx = (Math.random() < 0.5 ? -1 : 1) * 140;
                this.shootInterval = 1.8;
                this.sprite = game.assets['enemy-fighter'];
                this.color = '#ff7700';
                break;

            case 'heavy':
                this.width = 84;
                this.height = 84;
                this.hitRadius = 36;
                this.hp = 5;
                this.vy = 60;
                this.targetY = 120 + Math.random() * 80;
                this.shootInterval = 2.4;
                this.sprite = game.assets['enemy-heavy'];
                this.color = '#ffaa00';
                break;

            case 'elite':
                this.width = 110;
                this.height = 110;
                this.hitRadius = 48;
                this.hp = 12;
                this.vy = 50;
                this.targetY = 140;
                this.shootInterval = 1.6;
                this.sprite = game.assets['enemy-elite'];
                this.color = '#bf40ff';
                break;
        }

        this.maxHp = this.hp;
        this.hitFlashTimer = 0;
        this.shootTimer = 0.6 + Math.random() * 0.8; // Initial random delay
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        this.hitFlashTimer = 0.09;

        if (this.game.particles) {
            this.game.particles.createSparks(this.x, this.y, 8, '#00f0ff');
        }
        if (window.audioManager) {
            window.audioManager.playHitImpact();
        }

        if (this.hp <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    destroy() {
        this.active = false;
        const points = { scout: 150, fighter: 300, heavy: 600, elite: 1500 }[this.type] || 200;

        if (this.game.particles) {
            const count = this.type === 'elite' ? 55 : (this.type === 'heavy' ? 38 : 22);
            this.game.particles.createExplosion(this.x, this.y, this.color, count, 1.2);
            this.game.particles.createShockwave(this.x, this.y, this.hitRadius * 2.5, this.color);
            this.game.particles.createFloatingText(this.x, this.y - 25, `+${points}`, '#ffaa00');
        }
        if (window.audioManager) {
            window.audioManager.playExplosion(this.type === 'elite' ? 1.8 : 1.0);
        }

        // Chance to drop power-up item upon enemy kill!
        if (this.game.obstacles) {
            const dropRoll = Math.random();
            if (this.type === 'elite') {
                this.game.obstacles.spawnPowerUp('weapon', this.x, 140);
            } else if (dropRoll < 0.28) {
                const dropType = Math.random() < 0.45 ? 'weapon' : (Math.random() < 0.7 ? 'energy' : 'shield');
                this.game.obstacles.spawnPowerUp(dropType, this.x, 150);
            }

            // Drop Neon Space Coins!
            const coinDrops = {
                scout: 1 + Math.floor(Math.random() * 2),      // 1-2 coins
                fighter: 2 + Math.floor(Math.random() * 2),    // 2-3 coins
                heavy: 4 + Math.floor(Math.random() * 3),      // 4-6 coins
                elite: 8 + Math.floor(Math.random() * 5)       // 8-12 coins!
            }[this.type] || 2;

            for (let i = 0; i < coinDrops; i++) {
                const scatterX = (Math.random() - 0.5) * 160;
                const scatterY = (Math.random() - 0.5) * 100 + 40;
                this.game.obstacles.spawnCoin(this.x, this.y, scatterX, scatterY, 1);
            }
        }

        // Grant bonus score
        this.game.addScore(points);
    }

    update(dt) {
        if (!this.active) return;
        this.stateTime += dt;
        this.shootTimer -= dt;

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        const screenW = this.game.width;
        const playerX = this.game.player ? this.game.player.x : screenW / 2;
        const playerY = this.game.player ? this.game.player.y : this.game.height;

        // Specific AI behaviors
        switch (this.type) {
            case 'scout':
                // Zigzag dive towards player
                this.x += Math.sin(this.stateTime * 4) * 160 * dt;
                this.y += this.vy * dt;

                if (this.shootTimer <= 0) {
                    this.shootTimer = this.shootInterval;
                    this.game.bullets.spawnAimed(this.x, this.y + 15, playerX, playerY, 320, '#ff3366');
                }
                break;

            case 'fighter':
                // Horizontal strafe, reverse at screen boundaries
                this.x += this.vx * dt;
                this.y += this.vy * dt;

                if (this.x < 40) {
                    this.x = 40;
                    this.vx = Math.abs(this.vx);
                } else if (this.x > screenW - 40) {
                    this.x = screenW - 40;
                    this.vx = -Math.abs(this.vx);
                }

                if (this.shootTimer <= 0) {
                    this.shootTimer = this.shootInterval;
                    this.game.bullets.spawnSpread(this.x, this.y + 20, 3, 0.45, 290, Math.PI / 2, '#ff6600');
                }
                break;

            case 'heavy':
                // Enters and hovers at top third, drifting gently
                if (this.y < this.targetY) {
                    this.y += this.vy * dt;
                } else {
                    this.x += Math.sin(this.stateTime * 1.5) * 80 * dt;
                }

                if (this.shootTimer <= 0) {
                    this.shootTimer = this.shootInterval;
                    // Dual cannon burst
                    this.game.bullets.spawnStraight(this.x - 22, this.y + 35, 340, Math.PI / 2, '#ffaa00');
                    this.game.bullets.spawnStraight(this.x + 22, this.y + 35, 340, Math.PI / 2, '#ffaa00');
                    this.game.bullets.spawnBurst(this.x, this.y + 35, 2, 140, 320, '#ff8800');
                }
                break;

            case 'elite':
                // Flagship boss behavior
                if (this.y < this.targetY) {
                    this.y += this.vy * dt;
                } else {
                    // Smooth tracking toward player's horizontal position with delay
                    const targetX = playerX;
                    this.x += (targetX - this.x) * 1.5 * dt;
                }

                if (this.shootTimer <= 0) {
                    this.shootTimer = this.shootInterval;
                    // Alternate between radial ring and targeted salvo
                    if (Math.random() < 0.5) {
                        this.game.bullets.spawnRing(this.x, this.y + 30, 10, 240, '#bf40ff');
                    } else {
                        this.game.bullets.spawnSpread(this.x, this.y + 35, 5, 0.7, 310, Math.PI / 2, '#e60073');
                    }
                }
                break;
        }

        // Out of screen bottom cleanup
        if (this.y > this.game.height + 100) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Subtle hover float
        const bob = Math.sin(this.stateTime * 3) * 2;
        ctx.translate(0, bob);

        // Render Sprite
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.shadowBlur = this.hitFlashTimer > 0 ? 32 : 15;
            ctx.shadowColor = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.hitRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Health Bar if multi-hit
        if (this.maxHp > 1 && this.hp < this.maxHp) {
            const barW = this.width * 0.7;
            const barH = 4;
            const barY = -this.height / 2 - 8;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-barW / 2, barY, barW, barH);

            const hpRatio = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = this.color;
            ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);
        }

        ctx.restore();
    }
}

class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.eliteActive = false;
    }

    spawn(type, x, y) {
        const enemy = new EnemyShip(this.game, type, x, y);
        this.enemies.push(enemy);
        return enemy;
    }

    triggerEliteBossEvent() {
        if (this.eliteActive) return;
        this.eliteActive = true;

        if (window.audioManager) window.audioManager.playWarning();
        this.game.showBannerWarning("⚠ ELITE FLAGSHIP DETECTED ⚠");
        this.game.triggerScreenShake(15);

        setTimeout(() => {
            if (!this.game.isPlaying) return;
            const elite = this.spawn('elite', this.game.width / 2, -80);
            const origDestroy = elite.destroy.bind(elite);
            elite.destroy = () => {
                origDestroy();
                this.eliteActive = false;
                this.game.showBannerWarning("ELITE DESTROYED! +1500 PTS");
            };
        }, 1800);
    }

    update(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt);
            if (!e.active) {
                this.enemies.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (let e of this.enemies) {
            e.render(ctx);
        }
    }

    clear() {
        this.enemies = [];
        this.eliteActive = false;
    }
}

window.EnemyManager = EnemyManager;
window.EnemyShip = EnemyShip;
