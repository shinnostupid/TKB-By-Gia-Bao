/**
 * Laser Rotation & Beacon System for NEON DODGE (Hard Mode)
 * Implements high-voltage rotating death beams, charging warnings,
 * telegraph guide lines, safe zones, and geometric ray collision.
 */

class LaserBeacon {
    constructor(game, config = {}) {
        this.game = game;
        this.active = true;

        this.x = config.x || game.width / 2;
        this.y = config.y || 160;
        this.targetY = config.targetY || 160;

        this.radius = 38; // Beacon physical platform radius
        this.angle = config.startAngle || 0;
        this.rotSpeed = config.rotSpeed || 0.8; // Radians per sec
        this.beamLength = Math.max(game.width, game.height) * 1.5;
        this.beamWidth = 14;

        this.pattern = config.pattern || 'single'; // 'single', 'double', 'cross', 'fast', 'reverse', 'safe_zone'
        this.state = 'entering'; // 'entering', 'charging', 'active', 'cooldown', 'exiting'
        this.stateTimer = 0;

        this.chargeDuration = config.chargeDuration || (game.difficulty === 'HARD' ? 1.15 : 1.7); // Snappy warning in HARD mode
        this.activeDuration = config.duration || 6.5;

        // Specific pattern settings
        this.reverseTriggered = false;
        this.safeZoneAngle = config.safeAngle || (Math.PI / 2);
        this.safeZoneArc = config.safeArc || (Math.PI * 0.45); // Safe wedge

        this.sprite = game.assets['laser-beacon'];
        this.color = '#ff0055';
        this.corePulse = 0;
    }

    update(dt) {
        if (!this.active) return;
        this.stateTimer += dt;
        this.corePulse += dt * 8;

        // State Machine
        switch (this.state) {
            case 'entering':
                // Slide in from top
                this.y += (this.targetY - this.y) * 4 * dt;
                if (Math.abs(this.y - this.targetY) < 2) {
                    this.y = this.targetY;
                    this.state = 'charging';
                    this.stateTimer = 0;
                    if (window.audioManager) window.audioManager.playLaserCharge();
                    this.game.showBannerWarning("⚠ LASER CHARGING ⚠");
                }
                break;

            case 'charging':
                // Warning phase: telegraph beams, rising sound
                if (this.stateTimer >= this.chargeDuration) {
                    this.state = 'active';
                    this.stateTimer = 0;
                    if (window.audioManager) window.audioManager.playLaserActive();
                    this.game.showBannerWarning("⚡ LASER ACTIVE! ⚡");
                    this.game.triggerScreenShake(8);
                }
                break;

            case 'active':
                // Beam is firing and lethal!
                this.updateRotation(dt);

                if (this.stateTimer >= this.activeDuration) {
                    this.state = 'cooldown';
                    this.stateTimer = 0;
                }
                break;

            case 'cooldown':
                // Beam fades out
                if (this.stateTimer >= 0.8) {
                    this.state = 'exiting';
                }
                break;

            case 'exiting':
                // Beacon retreats off top of screen
                this.y -= 180 * dt;
                if (this.y < -100) {
                    this.active = false;
                }
                break;
        }
    }

    updateRotation(dt) {
        switch (this.pattern) {
            case 'single':
            case 'double':
            case 'cross':
            case 'safe_zone':
                this.angle += this.rotSpeed * dt;
                break;

            case 'fast':
                // Accelerating rotation
                const currentSpeed = this.rotSpeed * (1 + (this.stateTimer / this.activeDuration) * 1.5);
                this.angle += currentSpeed * dt;
                break;

            case 'reverse':
                // Rotates, slows down halfway, and rapidly reverses direction
                const halfTime = this.activeDuration / 2;
                if (this.stateTimer < halfTime) {
                    this.angle += this.rotSpeed * dt;
                } else {
                    if (!this.reverseTriggered) {
                        this.reverseTriggered = true;
                        if (window.audioManager) window.audioManager.playWarning();
                    }
                    this.angle -= (this.rotSpeed * 1.4) * dt;
                }
                break;
        }
    }

    getBeamAngles() {
        switch (this.pattern) {
            case 'double':
                return [this.angle, this.angle + Math.PI];
            case 'cross':
                return [
                    this.angle,
                    this.angle + Math.PI * 0.5,
                    this.angle + Math.PI,
                    this.angle + Math.PI * 1.5
                ];
            default:
                return [this.angle];
        }
    }

    /**
     * Checks if player collides with any active lethal laser beam
     */
    checkCollisionWithPlayer(player) {
        if (this.state !== 'active') return false;

        const angles = this.getBeamAngles();

        for (let a of angles) {
            // Check safe zone pattern
            if (this.pattern === 'safe_zone') {
                const inSafe = CollisionManager.isPointInSector(
                    player.x, player.y,
                    this.x, this.y,
                    this.safeZoneAngle,
                    this.safeZoneArc
                );
                if (inSafe) continue; // Player is inside safe corridor!
            }

            const hit = CollisionManager.circleIntersectsRotatedBeam(
                player.x, player.y, player.hitboxRadius,
                this.x, this.y,
                a, this.beamLength,
                this.beamWidth
            );

            if (hit) return true;
        }

        // Also check collision with beacon body
        if (CollisionManager.circleIntersectsCircle(player.x, player.y, player.hitboxRadius, this.x, this.y, this.radius)) {
            return true;
        }

        return false;
    }

    render(ctx) {
        if (!this.active) return;

        const beamAngles = this.getBeamAngles();

        // 1. Render Warning Telegraph Lines (during CHARGING)
        if (this.state === 'charging') {
            const progress = this.stateTimer / this.chargeDuration;
            const flash = Math.floor(this.stateTimer * 10) % 2 === 0;

            ctx.save();
            ctx.strokeStyle = flash ? '#ff0055' : 'rgba(255, 0, 85, 0.35)';
            ctx.lineWidth = 1.5 + progress * 2.5;
            ctx.setLineDash([12, 8]);

            for (let a of beamAngles) {
                const endX = this.x + Math.cos(a) * this.beamLength;
                const endY = this.y + Math.sin(a) * this.beamLength;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // Safe Zone Highlight if applicable
            if (this.pattern === 'safe_zone') {
                ctx.fillStyle = 'rgba(0, 255, 180, 0.12)';
                ctx.strokeStyle = '#00ffcc';
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 450, this.safeZoneAngle - this.safeZoneArc / 2, this.safeZoneAngle + this.safeZoneArc / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        }

        // 2. Render Active Lethal Beams (during ACTIVE and COOLDOWN)
        if (this.state === 'active' || this.state === 'cooldown') {
            const alpha = this.state === 'cooldown' ? Math.max(0, 1 - (this.stateTimer / 0.8)) : 1.0;

            ctx.save();
            ctx.globalAlpha = alpha;

            for (let a of beamAngles) {
                const endX = this.x + Math.cos(a) * this.beamLength;
                const endY = this.y + Math.sin(a) * this.beamLength;

                // Outer Neon Bloom
                ctx.strokeStyle = 'rgba(255, 0, 80, 0.4)';
                ctx.lineWidth = this.beamWidth * 2.2;
                ctx.shadowBlur = 24;
                ctx.shadowColor = '#ff0055';
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Core Hot Beam
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = this.beamWidth * 0.6;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff66aa';

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // Draw Safe Zone indicator if active
            if (this.pattern === 'safe_zone') {
                ctx.fillStyle = 'rgba(0, 255, 200, 0.1)';
                ctx.strokeStyle = 'rgba(0, 255, 200, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 500, this.safeZoneAngle - this.safeZoneArc / 2, this.safeZoneAngle + this.safeZoneArc / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        }

        // 3. Render Beacon Base & Rotating Core
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = this.color;
            ctx.drawImage(this.sprite, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            // High quality fallback platform
            ctx.fillStyle = '#1a1d2e';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Pulsing Core Emitter
        const coreR = 12 + Math.sin(this.corePulse) * 3;
        ctx.fillStyle = this.state === 'active' ? '#ffffff' : (this.state === 'charging' ? '#ff3366' : '#ff0044');
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class LaserManager {
    constructor(game) {
        this.game = game;
        this.beacons = [];
    }

    spawnBeacon(config = {}) {
        const beacon = new LaserBeacon(this.game, config);
        this.beacons.push(beacon);
        return beacon;
    }

    update(dt) {
        for (let i = this.beacons.length - 1; i >= 0; i--) {
            const b = this.beacons[i];
            b.update(dt);
            if (!b.active) {
                this.beacons.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (let b of this.beacons) {
            b.render(ctx);
        }
    }

    checkCollisionWithPlayer(player) {
        for (let b of this.beacons) {
            if (b.checkCollisionWithPlayer(player)) {
                return true;
            }
        }
        return false;
    }

    clear() {
        this.beacons = [];
    }
}

window.LaserManager = LaserManager;
window.LaserBeacon = LaserBeacon;
