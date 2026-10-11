/**
 * Procedural Web Audio API Synthesizer & Sound System for NEON DODGE
 * Generates dynamic synthwave BGM and authentic sci-fi arcade SFX.
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        this.isMusicOn = true;
        this.isSfxOn = true;
        this.masterVolume = 0.75;

        this.currentMusicMode = null; // 'menu' or 'game' or null
        this.musicTimer = null;
        this.musicStep = 0;
        this.bpm = 124;

        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            this.ctx = new AudioContext();

            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Music Gain
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.isMusicOn ? 0.4 : 0, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            // SFX Gain
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.isSfxOn ? 0.7 : 0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.initialized = true;

            // Load settings
            const settings = window.storageManager ? window.storageManager.getSettings() : null;
            if (settings) {
                this.updateSettings(settings);
            }
        } catch (e) {
            console.warn("Web Audio initialization error:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    updateSettings({ music, sfx, volume }) {
        if (typeof music !== 'undefined') this.isMusicOn = music;
        if (typeof sfx !== 'undefined') this.isSfxOn = sfx;
        if (typeof volume !== 'undefined') this.masterVolume = volume / 100;

        if (!this.initialized) return;

        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(this.masterVolume, now, 0.05);
        this.musicGain.gain.setTargetAtTime(this.isMusicOn ? 0.4 : 0, now, 0.05);
        this.sfxGain.gain.setTargetAtTime(this.isSfxOn ? 0.7 : 0, now, 0.05);
    }

    // --- PROCEDURAL SOUND EFFECTS ---

    /** Player crisp neon blaster shot */
    playPlayerShoot() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /** Dash / warp roll sound */
    playDash() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.22);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.23);
    }

    /** Hit impact ping */
    playHitImpact() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    /** Bullet firing sound */
    playBullet(type = 'straight') {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        const startFreq = type === 'burst' ? 980 : 740;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    /** Laser charging sound: rising high-resonance frequency */
    playLaserCharge() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 1.6);

        filter.type = 'bandpass';
        filter.Q.value = 6;
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 1.6);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 1.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 1.7);
    }

    /** Laser firing sound: energetic beam buzz */
    playLaserActive() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(95, now);
        osc2.frequency.setValueAtTime(190, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
    }

    /** Warning siren: dual tone alarm */
    playWarning() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const tones = [880, 660, 880, 660];
        tones.forEach((freq, idx) => {
            const t = now + idx * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.14);
        });
    }

    /** Explosion sound: sub bass drop + white noise burst */
    playExplosion(intensity = 1.0) {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const duration = Math.min(1.2, 0.4 + intensity * 0.4);

        // Sub bass oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150 * intensity, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + duration);

        oscGain.gain.setValueAtTime(0.5 * intensity, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration);

        // White noise buffer
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200 * intensity, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4 * intensity, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + duration);
    }

    /** Power-up collected: sparkling arpeggio chime */
    playPowerup(type = 'energy') {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = type === 'shield' ? [440, 554, 659, 880] : [523, 659, 783, 1046];

        notes.forEach((freq, idx) => {
            const t = now + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.26);
        });
    }

    /** Crisp Neon Coin pickup chime (B5 -> E6 double ping) */
    playCoin() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const freqs = [987.77, 1318.51];
        freqs.forEach((freq, idx) => {
            const t = now + idx * 0.055;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.17);
        });
    }

    /** Shop purchase success fanfare (Ascending major chord arpeggio) */
    playBuy() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const t = now + idx * 0.07;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.28, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.26);
        });
    }

    /** Error / Denied buzz */
    playError() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.21);
    }

    /** Shield deflection / hit */
    playShieldHit() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.21);
    }

    /** Game over sound */
    playGameOver() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const chords = [220, 196, 174, 130];
        chords.forEach((freq, i) => {
            const t = now + i * 0.25;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.65);
        });
    }

    /** UI Button click blip */
    playClick() {
        if (!this.isSfxOn || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // --- PROCEDURAL SYNTHWAVE MUSIC ENGINE ---

    startMusic(mode = 'menu') {
        if (this.currentMusicMode === mode) return;
        this.stopMusic();
        this.currentMusicMode = mode;
        this.musicStep = 0;

        if (!this.initialized) return;
        this.resume();

        const stepTime = mode === 'game' ? 125 : 180; // ms per 16th note
        this.musicTimer = setInterval(() => {
            this.tickMusicStep();
        }, stepTime);
    }

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
        this.currentMusicMode = null;
    }

    tickMusicStep() {
        if (!this.isMusicOn || !this.initialized) return;

        const now = this.ctx.currentTime;
        const step = this.musicStep % 16;
        const isGame = this.currentMusicMode === 'game';

        // Bass scale notes (Synthwave D minor / A minor)
        const bassNotesGame = [73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 87.31, 110.00]; // D2, F2, G2, A2
        const leadNotesGame = [293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 293.66, 261.63];

        const bassNotesMenu = [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 77.78, 98.00]; // C2, Eb2, F2, G2

        // Bass Pulse
        if (isGame) {
            if (step % 2 === 0) {
                const note = bassNotesGame[Math.floor(step / 2) % bassNotesGame.length];
                this.playSynthNote(note, 0.1, 'sawtooth', 0.25, 450);
            }
            // Arpeggio Lead
            if (step % 4 === 1 || step % 4 === 3) {
                const leadNote = leadNotesGame[(step + Math.floor(this.musicStep / 16)) % leadNotesGame.length];
                this.playSynthNote(leadNote, 0.12, 'square', 0.12, 1200);
            }
        } else {
            // Calm Menu ambient synth
            if (step % 4 === 0) {
                const note = bassNotesMenu[Math.floor(step / 4) % bassNotesMenu.length];
                this.playSynthNote(note, 0.35, 'triangle', 0.22, 350);
            }
        }

        this.musicStep++;
    }

    playSynthNote(freq, dur, type, vol, filterCutoff) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterCutoff, now);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + dur + 0.05);
    }
}

// Export singleton instance
window.audioManager = new AudioManager();
