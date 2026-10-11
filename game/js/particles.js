/**
 * High-performance Particle & Starfield System for NEON DODGE
 * Manages parallax cosmic background, engine trails, spark bursts, explosions, and shockwaves.
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.shockwaves = [];
        this.stars = [];
        this.nebulae = [];
        this.floatingTexts = [];
        this.afterimages = [];

        this.lowGraphics = false;
        this.maxParticles = 500;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.initCosmos();
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.initCosmos();
    }

    setLowGraphics(enabled) {
        this.lowGraphics = !!enabled;
        this.maxParticles = this.lowGraphics ? 150 : 600;
        this.initCosmos();
    }

    initCosmos() {
        this.stars = [];
        const count = this.lowGraphics ? 80 : 200;

        // 3 parallax layers of stars
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() < 0.7 ? 1 : (Math.random() < 0.9 ? 1.8 : 2.5),
                speed: 0.2 + Math.random() * 1.6,
                alpha: 0.2 + Math.random() * 0.8,
                twinkleSpeed: 0.02 + Math.random() * 0.05,
                twinkle: Math.random() * Math.PI * 2,
                color: Math.random() < 0.75 ? '#88ccff' : (Math.random() < 0.5 ? '#ff99dd' : '#aaffaa')
            });
        }

        // Rich, vibrant, glowing cosmic nebulae clouds
        this.nebulaTime = 0;
        this.nebulae = [
            { x: this.width * 0.2, y: this.height * 0.25, radius: 360, color: 'rgba(180, 25, 230, 0.26)', pulseSpeed: 0.8 },
            { x: this.width * 0.82, y: this.height * 0.65, radius: 420, color: 'rgba(0, 220, 255, 0.22)', pulseSpeed: 1.1 },
            { x: this.width * 0.45, y: this.height * 0.85, radius: 340, color: 'rgba(255, 140, 20, 0.18)', pulseSpeed: 0.9 },
            { x: this.width * 0.7, y: this.height * 0.15, radius: 300, color: 'rgba(0, 255, 180, 0.16)', pulseSpeed: 1.3 }
        ];

        // Animated Perspective Cyber Grid parameters
        this.gridOffset = 0;
    }

    update(dt = 1, speedScale = 1.0) {
        this.speedScale = speedScale;
        this.nebulaTime += dt;
        this.gridOffset = (this.gridOffset + dt * 45 * speedScale) % 40;

        // Update Starfield with Warp Speed Scaling
        const starSpeedMult = dt * 1.6 * (0.8 + speedScale * 0.6);
        for (let star of this.stars) {
            star.y += star.speed * starSpeedMult * 60;
            star.twinkle += star.twinkleSpeed;
            if (star.y > this.height + 10) {
                star.y = -10;
                star.x = Math.random() * this.width;
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.life -= p.decay * dt;
            p.size *= p.shrink;

            if (p.life <= 0 || p.size <= 0.2) {
                this.particles.splice(i, 1);
            }
        }

        // Update Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed * dt;
            sw.alpha -= sw.decay * dt;

            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update Floating Combat Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= ft.vy * dt;
            ft.alpha -= ft.decay * dt;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update Ghost Afterimages
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const ai = this.afterimages[i];
            ai.alpha -= ai.decay * dt;
            if (ai.alpha <= 0) {
                this.afterimages.splice(i, 1);
            }
        }
    }

    renderBackground(ctx) {
        // 1. Rich Deep Cosmic Gradient (Deep Space Indigo to Midnight Cyan Void)
        const bgGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGrad.addColorStop(0, '#090518');
        bgGrad.addColorStop(0.45, '#050b22');
        bgGrad.addColorStop(0.8, '#030816');
        bgGrad.addColorStop(1, '#02040d');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Animated Cosmic Nebulae with Gentle Breathing Glow
        for (let n of this.nebulae) {
            const pulse = 1 + Math.sin(this.nebulaTime * n.pulseSpeed) * 0.12;
            const r = n.radius * pulse;
            const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
            g.addColorStop(0, n.color);
            g.addColorStop(0.65, n.color.replace(/[\d\.]+\)$/, '0.08)'));
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Subtle Cyber Perspective Space Grid (Adds energetic depth and movement)
        const gridHorizonY = this.height * 0.45;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
        ctx.lineWidth = 1;

        // Vanishing perspective rays
        const centerX = this.width / 2;
        const rayCount = 14;
        for (let i = 0; i <= rayCount; i++) {
            const bottomX = (this.width / rayCount) * i;
            ctx.beginPath();
            ctx.moveTo(centerX, gridHorizonY);
            ctx.lineTo(bottomX, this.height);
            ctx.stroke();
        }

        // Scrolling horizontal distance lines
        const step = 38;
        for (let y = gridHorizonY; y <= this.height; y += step) {
            const progress = (y - gridHorizonY) / (this.height - gridHorizonY);
            const lineY = y + (this.gridOffset * progress);
            if (lineY > gridHorizonY && lineY <= this.height) {
                ctx.globalAlpha = Math.min(0.12, progress * 0.14);
                ctx.beginPath();
                ctx.moveTo(0, lineY);
                ctx.lineTo(this.width, lineY);
                ctx.stroke();
            }
        }
        ctx.restore();

        // 4. Draw Stars (Twinkling + Flare Crosses on bright stars)
        const isWarping = (this.speedScale || 1.0) > 1.25;
        const streakLen = Math.min(35, ((this.speedScale || 1.0) - 1.0) * 18);

        for (let star of this.stars) {
            const currentAlpha = Math.max(0.15, star.alpha * (0.7 + 0.3 * Math.sin(star.twinkle)));
            ctx.fillStyle = star.color;
            ctx.strokeStyle = star.color;
            ctx.globalAlpha = currentAlpha;

            if (isWarping) {
                ctx.lineWidth = Math.max(1, star.size * 0.9);
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(star.x, star.y + streakLen * star.speed);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Sparkle cross on large bright stars
                if (star.size > 2.0 && currentAlpha > 0.6) {
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(star.x - star.size * 2, star.y);
                    ctx.lineTo(star.x + star.size * 2, star.y);
                    ctx.moveTo(star.x, star.y - star.size * 2);
                    ctx.lineTo(star.x, star.y + star.size * 2);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }

    renderParticles(ctx) {
        ctx.save();

        // 1. Draw Ghost Afterimages
        if (Array.isArray(this.afterimages)) {
            for (let ai of this.afterimages) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, ai.alpha * 0.55);
                ctx.translate(ai.x, ai.y);
                ctx.rotate(ai.tilt);
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00f0ff';
                if (ai.sprite && ai.sprite.complete) {
                    ctx.drawImage(ai.sprite, -ai.width / 2, -ai.height / 2, ai.width, ai.height);
                }
                ctx.restore();
            }
        }

        // 2. Draw Particles
        if (Array.isArray(this.particles)) {
            for (let p of this.particles) {
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = p.glow ? 12 : 0;
                ctx.shadowColor = p.color;

                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 3. Draw Shockwaves
        if (Array.isArray(this.shockwaves)) {
            for (let sw of this.shockwaves) {
                ctx.globalAlpha = Math.max(0, sw.alpha);
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = sw.lineWidth;
                ctx.shadowBlur = 18;
                ctx.shadowColor = sw.color;

                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // 4. Draw Floating Combat Text
        if (Array.isArray(this.floatingTexts) && this.floatingTexts.length > 0) {
            ctx.font = 'bold 16px "Chakra Petch", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            for (let ft of this.floatingTexts) {
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.fillStyle = ft.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = ft.color;
                ctx.fillText(ft.text, ft.x, ft.y);
            }
        }

        ctx.restore();
    }


    // --- EMITTERS ---

    createFloatingText(x, y, text, color = '#00f0ff') {
        this.floatingTexts.push({
            x,
            y,
            text,
            color,
            alpha: 1.0,
            vy: 45,
            decay: 1.2
        });
    }

    createAfterimage(x, y, sprite, tilt, width, height) {
        if (this.afterimages.length > 12) this.afterimages.shift();
        this.afterimages.push({
            x,
            y,
            sprite,
            tilt,
            width,
            height,
            alpha: 0.8,
            decay: 3.5
        });
    }

    createThrusterFlame(x, y, vx, vy, isBoost = false) {
        if (this.particles.length >= this.maxParticles) return;
        const color = isBoost ? '#00ffff' : (Math.random() < 0.6 ? '#00e5ff' : '#0077ff');
        this.particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y,
            vx: vx + (Math.random() - 0.5) * 1.2,
            vy: vy + 2 + Math.random() * (isBoost ? 6 : 4),
            size: isBoost ? 4.5 : 3.0,
            shrink: 0.93,
            life: 1.0,
            decay: isBoost ? 0.04 : 0.06,
            drag: 0.98,
            color: color,
            glow: true
        });
    }

    createExplosion(x, y, color = '#ff3366', count = 25, speedMult = 1.0) {
        const finalCount = this.lowGraphics ? Math.floor(count * 0.4) : count;
        for (let i = 0; i < finalCount; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 6) * speedMult;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2.5 + Math.random() * 4,
                shrink: 0.95,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                drag: 0.96,
                color: color,
                glow: true
            });
        }
    }

    createShockwave(x, y, maxRadius = 120, color = '#00ffff', lineWidth = 4) {
        this.shockwaves.push({
            x,
            y,
            radius: 5,
            maxRadius,
            speed: 8,
            alpha: 1.0,
            decay: 0.035,
            color,
            lineWidth
        });
    }

    createSparks(x, y, count = 8, color = '#ffea00') {
        const finalCount = this.lowGraphics ? 4 : count;
        for (let i = 0; i < finalCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 2,
                shrink: 0.92,
                life: 1.0,
                decay: 0.05 + Math.random() * 0.04,
                drag: 0.94,
                color: color,
                glow: true
            });
        }
    }

    clear() {
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.afterimages = [];
    }
}

window.ParticleSystem = ParticleSystem;
