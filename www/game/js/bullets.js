/**
 * Bullet System & Pattern Manager for NEON DODGE
 * Manages player-hostile projectiles with high-speed physics, neon glow, and precise hitboxes.
 */
class Bullet {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 4.5;
        this.type = 'straight'; // 'straight', 'spread', 'burst', 'heavy', 'plasma', 'player'
        this.color = '#ff3366';
        this.glowColor = 'rgba(255, 51, 102, 0.8)';
        this.trail = [];
        this.isPlayer = false;
        this.damage = 1;
    }

    init({ x, y, vx, vy, radius = 5, type = 'straight', color = '#ff3366', isPlayer = false, damage = 1 }) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.type = type;
        this.color = color;
        this.glowColor = color;
        this.trail = [];
        this.isPlayer = isPlayer;
        this.damage = damage;
    }

    update(dt) {
        if (!this.active) return;

        // Record trailing position for motion blur/trail
        if (this.trail.length > 3) this.trail.shift();
        this.trail.push({ x: this.x, y: this.y });

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();

        if (this.isPlayer) {
            // Elongated Player Plasma Bolt
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#00f0ff';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;

            // Draw high-speed vertical bolt
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius, this.radius * 2.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Afterglow trail
            if (this.trail.length > 1) {
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
                ctx.lineWidth = this.radius * 1.5;
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // Motion trail for enemy bullets
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.radius * 1.2;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        // Bullet Core
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#ffffff';

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Neon Outer Ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class BulletManager {
    constructor(game) {
        this.game = game;
        this.pool = [];
        this.poolSize = 400;

        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Bullet());
        }

        // Dedicated pool for player blasters
        this.playerPool = [];
        this.playerPoolSize = 150;
        for (let i = 0; i < this.playerPoolSize; i++) {
            this.playerPool.push(new Bullet());
        }
    }

    spawn(config) {
        for (let b of this.pool) {
            if (!b.active) {
                b.init(config);
                return b;
            }
        }
        // Pool full fallback
        const newB = new Bullet();
        newB.init(config);
        this.pool.push(newB);
        return newB;
    }

    spawnPlayerBullet(x, y, vx = 0, vy = -850, damage = 1) {
        for (let b of this.playerPool) {
            if (!b.active) {
                b.init({
                    x,
                    y,
                    vx,
                    vy,
                    radius: 3.5,
                    type: 'player',
                    color: '#00f0ff',
                    isPlayer: true,
                    damage
                });
                return b;
            }
        }
        const newB = new Bullet();
        newB.init({ x, y, vx, vy, radius: 3.5, type: 'player', color: '#00f0ff', isPlayer: true, damage });
        this.playerPool.push(newB);
        return newB;
    }

    // --- BULLET PATTERNS ---

    /** Single straight bullet */
    spawnStraight(x, y, speed = 320, angle = Math.PI / 2, color = '#ff2255') {
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        this.spawn({ x, y, vx, vy, radius: 4.5, type: 'straight', color });
        if (window.audioManager) window.audioManager.playBullet('straight');
    }

    /** Aimed bullet directly at target */
    spawnAimed(originX, originY, targetX, targetY, speed = 340, color = '#ff3366') {
        const angle = Math.atan2(targetY - originY, targetX - originX);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        this.spawn({ x: originX, y: originY, vx, vy, radius: 5, type: 'aimed', color });
        if (window.audioManager) window.audioManager.playBullet('straight');
    }

    /** Spread fan pattern (↙ ↓ ↘) */
    spawnSpread(x, y, count = 3, spreadAngle = 0.45, speed = 300, baseAngle = Math.PI / 2, color = '#ff7700') {
        const startAngle = baseAngle - (spreadAngle / 2);
        const step = count > 1 ? spreadAngle / (count - 1) : 0;

        for (let i = 0; i < count; i++) {
            const angle = count === 1 ? baseAngle : startAngle + step * i;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.spawn({ x, y, vx, vy, radius: 5, type: 'spread', color });
        }
        if (window.audioManager) window.audioManager.playBullet('straight');
    }

    /** Burst pattern (sequential rapid stream) */
    spawnBurst(x, y, count = 3, delayMs = 120, speed = 360, color = '#ffcc00') {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (!this.game.isPlaying || this.game.isPaused) return;
                this.spawnStraight(x, y, speed, Math.PI / 2, color);
            }, i * delayMs);
        }
    }

    /** Radial ring pattern from boss / elite */
    spawnRing(x, y, count = 12, speed = 240, color = '#bb33ff') {
        const step = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            const angle = i * step;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.spawn({ x, y, vx, vy, radius: 5.5, type: 'plasma', color });
        }
        if (window.audioManager) window.audioManager.playBullet('burst');
    }

    update(dt) {
        const w = this.game.width;
        const h = this.game.height;

        // Enemy bullets
        for (let b of this.pool) {
            if (!b.active) continue;
            b.update(dt);
            if (b.x < -40 || b.x > w + 40 || b.y < -40 || b.y > h + 40) {
                b.active = false;
            }
        }

        // Player bullets
        for (let b of this.playerPool) {
            if (!b.active) continue;
            b.update(dt);
            if (b.y < -40 || b.x < -40 || b.x > w + 40 || b.y > h + 40) {
                b.active = false;
            }
        }
    }

    render(ctx) {
        // Enemy bullets
        for (let b of this.pool) {
            if (b.active) {
                b.render(ctx);
            }
        }

        // Player bullets
        for (let b of this.playerPool) {
            if (b.active) {
                b.render(ctx);
            }
        }
    }

    clear() {
        for (let b of this.pool) {
            b.active = false;
        }
        for (let b of this.playerPool) {
            b.active = false;
        }
    }

    getActiveBullets() {
        return this.pool.filter(b => b.active);
    }

    getActivePlayerBullets() {
        return this.playerPool.filter(b => b.active);
    }
}

window.BulletManager = BulletManager;
