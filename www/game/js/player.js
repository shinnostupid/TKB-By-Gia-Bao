/**
 * Player Ship Entity for NEON DODGE
 * Full 2D Space Flight, Blaster Weapon System, Warp Dash / Barrel Roll,
 * Precision Hitbox, and Dynamic Visual Effects.
 */
class Player {
    constructor(game) {
        this.game = game;
        this.sprite = null;

        // Dynamic responsive ship sizing (Larger on portrait mobile for high impact)
        const isPortrait = (this.game && this.game.width < this.game.height) || (window.innerWidth < window.innerHeight && window.innerWidth <= 768);
        this.width = isPortrait ? 76 : 68;
        this.height = isPortrait ? 76 : 68;
        this.hitboxRadius = 14; // Precision cockpit hitbox

        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;

        this.speed = 560; // Agile responsive top speed
        this.targetVx = 0;
        this.targetVy = 0;
        this.accelRate = 20.0; // Responsive engine thrust
        this.dragRate = 12.0;  // Smooth natural space coasting deceleration

        this.tilt = 0; // Current roll angle (radians)
        this.maxTilt = 0.42; // ~24 degrees dynamic banking

        this.recoilY = 0; // Blaster kickback spring
        this.squashX = 1.0;
        this.squashY = 1.0;
        this.rollAngle = 0; // 360-degree barrel roll during warp dash
        this.hoverSway = 0; // Subtle cosmic hover bobbing

        // Weapon System (MANUAL SHOOTING ONLY — No auto-fire)
        this.weaponLevel = 1; // 1: Twin blasters, 2: Triple spread, 3: Quad plasma
        this.shootTimer = 0;
        this.shootInterval = 0.12; // Rapid responsive manual fire
        this.autoFire = true; // Strictly manual!

        // Warp Dash / Roll System
        this.isDashing = false;
        this.dashDuration = 0;
        this.dashCooldown = 1.3;
        this.dashTimer = 0;
        this.dashVx = 0;
        this.dashVy = 0;

        // Power-ups and defensive states
        this.hasShield = false;
        this.shieldPulse = 0;
        this.isBoosting = false;
        this.boostTimer = 0;
        this.hasEMP = false;

        this.isInvulnerable = false;
        this.invulnerableTimer = 0;

        this.isAlive = true;
    }

    setSprite(img) {
        this.sprite = img;
    }

    reset(spawnX, spawnY) {
        this.x = spawnX;
        this.y = spawnY;
        this.vx = 0;
        this.vy = 0;
        this.targetVx = 0;
        this.targetVy = 0;
        this.tilt = 0;
        this.recoilY = 0;
        this.squashX = 1.0;
        this.squashY = 1.0;
        this.rollAngle = 0;
        this.hoverSway = 0;

        // Apply Upgrades from Hangar / Storage
        const upgrades = (window.storageManager && window.storageManager.getUpgrades)
            ? window.storageManager.getUpgrades()
            : { magnet: 0, shield: 0, blaster: 0, warp: 0, emp: 0 };

        this.upgrades = upgrades;

        // 1. Magnet Tractor Beam Perk
        const magnetLvl = upgrades.magnet || 0;
        this.magnetRadius = 75 + magnetLvl * 115; // L0: 75px, L1: 190px, L2: 305px, L3: 420px

        // 2. Plasma Blaster Perk
        const blasterLvl = upgrades.blaster || 0;
        this.weaponLevel = blasterLvl >= 3 ? 3 : (blasterLvl >= 2 ? 2 : 1);
        this.shootInterval = blasterLvl >= 3 ? 0.075 : (blasterLvl >= 2 ? 0.09 : (blasterLvl >= 1 ? 0.105 : 0.12));
        this.shootTimer = 0;
        this.autoFire = true;

        // 3. Warp Engine Perk
        const warpLvl = upgrades.warp || 0;
        this.dashCooldown = warpLvl >= 3 ? 0.5 : (warpLvl >= 2 ? 0.75 : (warpLvl >= 1 ? 1.0 : 1.3));
        this.isDashing = false;
        this.dashDuration = 0;
        this.dashTimer = 0;

        // 4. Nano Shield Perk
        const shieldLvl = upgrades.shield || 0;
        this.shieldCharges = shieldLvl >= 3 ? 2 : (shieldLvl >= 1 ? 1 : 0);
        this.hasShield = this.shieldCharges > 0;
        this.shieldPulse = 0;
        this.postHitInvulnerableTime = shieldLvl >= 2 ? 1.8 : 1.2;

        // 5. EMP Overcharger Perk
        const empLvl = upgrades.emp || 0;
        this.empCharges = empLvl >= 2 ? 2 : (empLvl >= 1 ? 1 : 0);
        this.hasEMP = this.empCharges > 0;

        this.isBoosting = false;
        this.boostTimer = 0;

        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
        this.isAlive = true;
    }


    upgradeWeapon() {
        this.weaponLevel = Math.min(3, this.weaponLevel + 1);
        if (this.game.particles) {
            this.game.particles.createFloatingText(this.x, this.y - 40, `WEAPON LVL ${this.weaponLevel}!`, '#00f0ff');
            this.game.particles.createShockwave(this.x, this.y, 80, '#00f0ff', 3);
        }
        if (window.audioManager) window.audioManager.playPowerup('energy');
    }

    applyShield() {
        this.shieldCharges = Math.min(2, (this.shieldCharges || 0) + 1);
        this.hasShield = true;
        this.shieldPulse = 0;
        if (this.game.particles) {
            this.game.particles.createFloatingText(this.x, this.y - 40, "SHIELD CHARGED!", '#00ffcc');
        }
        if (window.audioManager) window.audioManager.playPowerup('shield');
    }

    applyBoost(duration = 6.0) {
        this.isBoosting = true;
        this.boostTimer = duration;
        if (this.game.particles) {
            this.game.particles.createFloatingText(this.x, this.y - 40, "MAX THRUST!", '#ffff00');
        }
        if (window.audioManager) window.audioManager.playPowerup('energy');
    }

    grantEMP() {
        this.empCharges = Math.min(2, (this.empCharges || 0) + 1);
        this.hasEMP = true;
        if (this.game.particles) {
            this.game.particles.createFloatingText(this.x, this.y - 40, "EMP CHARGED!", '#ff0055');
        }
        if (window.audioManager) window.audioManager.playPowerup('energy');
    }

    triggerEMP() {
        if (!this.hasEMP) return false;

        this.empCharges = Math.max(0, (this.empCharges || 1) - 1);
        if (this.empCharges <= 0) {
            this.hasEMP = false;
        }

        // If Level 3 EMP perk, immediately refresh Dash!
        if (this.upgrades && this.upgrades.emp >= 3) {
            this.dashTimer = 0;
        }

        if (this.game.bullets) this.game.bullets.clear();
        if (this.game.particles) {
            this.game.particles.createShockwave(this.x, this.y, 550, '#00ffff', 6);
            this.game.particles.createExplosion(this.x, this.y, '#00ffff', 45, 1.8);
            this.game.particles.createFloatingText(this.x, this.y - 50, "EMP BLAST!", '#00ffff');
        }
        if (window.audioManager) {
            window.audioManager.playExplosion(1.5);
            window.audioManager.playShieldHit();
        }
        if (this.game.obstacles && this.game.obstacles.asteroids) {
            for (let ast of this.game.obstacles.asteroids) {
                const dy = ast.y - this.y;
                const dx = ast.x - this.x;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist < 480) {
                    ast.vy = -320;
                    ast.vx += (dx / dist) * 220;
                    ast.takeDamage(2);
                }
            }
        }
        this.game.triggerScreenShake(14);
        return true;
    }

    /**
     * Warp Dash / Barrel Roll maneuver
     */
    dash() {
        if (this.dashTimer > 0 || !this.isAlive) return false;

        this.isDashing = true;
        this.dashDuration = 0.22;
        this.dashTimer = this.dashCooldown;
        this.isInvulnerable = true;
        this.invulnerableTimer = 0.32; // Invincible during dash!

        // Determine dash vector from velocity or default forward
        const currentSpeed = 950;
        let dirX = this.vx;
        let dirY = this.vy;
        const len = Math.hypot(dirX, dirY);

        if (len > 10) {
            this.dashVx = (dirX / len) * currentSpeed;
            this.dashVy = (dirY / len) * currentSpeed;
        } else {
            this.dashVx = 0;
            this.dashVy = -currentSpeed; // Dash straight forward
        }

        if (this.game.particles) {
            this.game.particles.createShockwave(this.x, this.y, 90, '#00f0ff', 4);
            this.game.particles.createSparks(this.x, this.y, 16, '#00f0ff');
            this.game.particles.createFloatingText(this.x, this.y - 30, "WARP DASH!", '#00f0ff');
        }

        if (window.audioManager) window.audioManager.playDash();
        this.game.triggerScreenShake(6);
        return true;
    }

    /**
     * Player Weapon Fire (Twin, Triple, Quad Plasma Blasters)
     */
    shoot() {
        if (!this.isAlive || !this.game.bullets) return;

        const leftWingX = this.x - 22;
        const rightWingX = this.x + 22;
        const noseY = this.y - 28;

        if (this.weaponLevel === 1) {
            // Twin blasters from wings
            this.game.bullets.spawnPlayerBullet(leftWingX, noseY, 0, -880, 1);
            this.game.bullets.spawnPlayerBullet(rightWingX, noseY, 0, -880, 1);
        } else if (this.weaponLevel === 2) {
            // Triple spread blasters
            this.game.bullets.spawnPlayerBullet(leftWingX, noseY, -120, -860, 1);
            this.game.bullets.spawnPlayerBullet(this.x, noseY - 8, 0, -920, 1.5);
            this.game.bullets.spawnPlayerBullet(rightWingX, noseY, 120, -860, 1);
        } else {
            // Quad plasma cannons
            this.game.bullets.spawnPlayerBullet(leftWingX - 6, noseY, -140, -870, 1.2);
            this.game.bullets.spawnPlayerBullet(leftWingX + 6, noseY, -40, -900, 1.2);
            this.game.bullets.spawnPlayerBullet(rightWingX - 6, noseY, 40, -900, 1.2);
            this.game.bullets.spawnPlayerBullet(rightWingX + 6, noseY, 140, -870, 1.2);
        }

        // Dynamic recoil kickback & muzzle compression
        this.recoilY = 4.8;
        this.squashY = 0.93;
        this.squashX = 1.05;
        this.game.triggerScreenShake(1.8);

        // Muzzle flash sparks
        if (this.game.particles && Math.random() < 0.6) {
            this.game.particles.createSparks(leftWingX, noseY, 3, '#00f0ff');
            this.game.particles.createSparks(rightWingX, noseY, 3, '#00f0ff');
        }

        if (window.audioManager) window.audioManager.playPlayerShoot();
    }


    takeHit() {
        if (this.isInvulnerable) return false;

        if (this.hasShield) {
            this.shieldCharges = Math.max(0, (this.shieldCharges || 1) - 1);
            if (this.shieldCharges <= 0) {
                this.hasShield = false;
            }
            this.isInvulnerable = true;
            this.invulnerableTimer = this.postHitInvulnerableTime || 1.2;

            if (this.game.particles) {
                this.game.particles.createShockwave(this.x, this.y, 110, '#00ffcc', 4);
                this.game.particles.createSparks(this.x, this.y, 20, '#00ffcc');
                const hitMsg = this.hasShield ? "SHIELD HIT! (1 LAYER LEFT)" : "SHIELD BROKEN!";
                this.game.particles.createFloatingText(this.x, this.y - 30, hitMsg, '#00ffcc');
            }
            if (window.audioManager) window.audioManager.playShieldHit();
            this.game.resetCombo();
            this.game.triggerScreenShake(9);
            return false;
        }

        // Direct hit: lethal
        this.isAlive = false;
        return true;
    }

    update(dt, input) {
        if (!this.isAlive) return;

        // Boost countdown
        if (this.isBoosting) {
            this.boostTimer -= dt;
            if (this.boostTimer <= 0) this.isBoosting = false;
        }

        // Invulnerability countdown
        if (this.isInvulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) this.isInvulnerable = false;
        }

        // Shield pulsing animation
        if (this.hasShield) {
            this.shieldPulse += dt * 4;
        }

        // Dash cooldown & duration
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
        }

        if (this.isDashing) {
            this.dashDuration -= dt;
            this.vx = this.dashVx;
            this.vy = this.dashVy;
            this.targetVx = this.dashVx;
            this.targetVy = this.dashVy;

            // Full 360-degree barrel roll rotation
            this.rollAngle += (Math.PI * 2 / 0.22) * dt;

            // Leave ghost afterimage during warp dash
            if (this.game.particles && this.sprite) {
                this.game.particles.createAfterimage(this.x, this.y, this.sprite, this.tilt + this.rollAngle, this.width, this.height);
            }

            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.rollAngle = 0;
            }
        } else {
            // Normal Movement with Fluid Physics & Easing (NO square/stiff instant velocity)
            const currentSpeed = this.isBoosting ? this.speed * 1.45 : this.speed;
            let moveX = 0;
            let moveY = 0;

            if (input.left) moveX -= 1;
            if (input.right) moveX += 1;
            if (input.up) moveY -= 1;
            if (input.down) moveY += 1;

            if (moveX !== 0 && moveY !== 0) {
                const len = Math.hypot(moveX, moveY);
                moveX /= len;
                moveY /= len;
            }

            // Direct Touch / Pointer drag handling with smooth spring tracking
            if (input.pointerActive && input.pointerX !== null) {
                const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
                // On mobile touch screens, offset target Y by -48px so player's thumb is below the ship
                const targetY = (isTouch && input.pointerY !== null) ? (input.pointerY - 48) : input.pointerY;
                const dx = input.pointerX - this.x;
                const dy = (targetY !== null ? targetY - this.y : 0);
                const dist = Math.hypot(dx, dy);

                if (dist > 4) {
                    const factor = Math.min(1.0, dist / 85);
                    this.targetVx = (dx / dist) * currentSpeed * factor;
                    this.targetVy = (dy / dist) * currentSpeed * factor;
                } else {
                    this.targetVx = 0;
                    this.targetVy = 0;
                }
            } else {
                this.targetVx = moveX * currentSpeed;
                this.targetVy = moveY * currentSpeed;
            }

            // Fluid exponential acceleration and coasting deceleration (Smooth aerodynamic momentum)
            const rateX = Math.abs(this.targetVx) > 10 ? this.accelRate : this.dragRate;
            const rateY = Math.abs(this.targetVy) > 10 ? this.accelRate : this.dragRate;
            this.vx += (this.targetVx - this.vx) * (1 - Math.exp(-rateX * dt));
            this.vy += (this.targetVy - this.vy) * (1 - Math.exp(-rateY * dt));

            // Smooth roll angle back to 0 when not dashing
            this.rollAngle += (0 - this.rollAngle) * (1 - Math.exp(-18 * dt));

            // Check dash trigger
            if (input.dash) {
                input.dash = false;
                this.dash();
            }
        }

        // Integrate Position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Full 2D Boundary constraints (User can fly freely all the way to the top!)
        const padX = this.width / 2;
        const padY = this.height / 2;
        const screenW = this.game.width;
        const screenH = this.game.height;

        this.x = Math.max(padX + 5, Math.min(screenW - padX - 5, this.x));
        this.y = Math.max(padY + 10, Math.min(screenH - padY - 15, this.y));

        // Smooth Banking Tilt (Dynamic Roll Physics)
        const speedNorm = this.isBoosting ? this.speed * 1.45 : this.speed;
        const targetTilt = (this.vx / speedNorm) * this.maxTilt;
        this.tilt += (targetTilt - this.tilt) * (1 - Math.exp(-15 * dt));

        // Dynamic Squash & Stretch based on vertical acceleration & thrust
        const targetSquashY = 1.0 - (this.vy / speedNorm) * 0.12;
        const targetSquashX = 1.0 + (this.vy / speedNorm) * 0.08;
        this.squashX += (targetSquashX - this.squashX) * (1 - Math.exp(-14 * dt));
        this.squashY += (targetSquashY - this.squashY) * (1 - Math.exp(-14 * dt));

        // Weapon Recoil Spring Recovery
        this.recoilY += (0 - this.recoilY) * (1 - Math.exp(-22 * dt));

        // Subtle Organic Space Hover Bobbing
        this.hoverSway += dt * 3.4;

        // Blaster Manual Fire ONLY (User holds/taps Space, J, or Mouse)
        // Blaster Fire: Manual OR Auto-Fire on Mobile/Touch
        this.shootTimer -= dt;
        const isMobileOrTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 820);
        const shouldFire = input.shoot || this.autoFire || (isMobileOrTouch && this.game && this.game.state === 'PLAYING') || (input.pointerActive && this.game && this.game.state === 'PLAYING');
        if (shouldFire && this.shootTimer <= 0) {
            this.shootTimer = this.shootInterval;
            this.shoot();
        }

        // Dynamic Engine Thruster Flares
        if (this.game.particles) {
            const leftExhaustX = this.x - 14 * Math.cos(this.tilt);
            const rightExhaustX = this.x + 14 * Math.cos(this.tilt);
            const exhaustY = this.y + 26;

            const isAcceleratingUp = this.vy < -40;
            this.game.particles.createThrusterFlame(leftExhaustX, exhaustY, this.vx * 0.08, isAcceleratingUp ? 4.5 : 0, this.isBoosting || isAcceleratingUp);
            this.game.particles.createThrusterFlame(rightExhaustX, exhaustY, this.vx * 0.08, isAcceleratingUp ? 4.5 : 0, this.isBoosting || isAcceleratingUp);
        }
    }

    render(ctx) {
        if (!this.isAlive) return;

        ctx.save();
        const bobOffset = Math.sin(this.hoverSway) * 1.6;
        ctx.translate(this.x, this.y + this.recoilY + bobOffset);
        ctx.rotate(this.tilt + this.rollAngle);
        ctx.scale(this.squashX, this.squashY);


        // Invulnerability flickering
        if (this.isInvulnerable) {
            ctx.globalAlpha = Math.floor(Date.now() / 70) % 2 === 0 ? 0.35 : 1.0;
        }

        // Draw Player Sprite
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.shadowBlur = this.isBoosting ? 26 : (this.isDashing ? 32 : 14);
            ctx.shadowColor = this.isDashing ? '#00ffff' : (this.isBoosting ? '#00e5ff' : '#00bfff');
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.lineTo(0, this.height * 0.3);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
        }

        // Render Shield Forcefield
        if (this.hasShield) {
            ctx.save();
            const pulse = 1 + Math.sin(this.shieldPulse) * 0.08;
            const shieldRadius = (this.width / 2 + 10) * pulse;

            const shieldGrad = ctx.createRadialGradient(0, 0, shieldRadius * 0.6, 0, 0, shieldRadius);
            shieldGrad.addColorStop(0, 'rgba(0, 255, 200, 0.05)');
            shieldGrad.addColorStop(0.7, 'rgba(0, 255, 200, 0.25)');
            shieldGrad.addColorStop(1, 'rgba(0, 255, 220, 0.7)');

            ctx.fillStyle = shieldGrad;
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00ffcc';

            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Hexagonal energy accents
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(0, 255, 200, 0.4)';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI / 3) + this.shieldPulse * 0.2;
                const px = Math.cos(a) * (shieldRadius * 0.85);
                const py = Math.sin(a) * (shieldRadius * 0.85);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }
}

window.Player = Player;
