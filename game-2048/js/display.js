/**
 * 2048 INFINITE — Display & Large Number Formatting Utility
 * Handles dynamic font scaling, power of 2 representation, and color themes.
 */

class Display2048 {
    static SI_PREFIXES = [
        '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
        'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'
    ];

    /**
     * Format BigInt tile value for board rendering
     */
    static formatTileValue(val, mode = 'auto') {
        if (!val || val === 0n) return '';

        const exp = Infinite2048Engine.getExponent(val);

        if (mode === 'powers') {
            return `2^${exp}`;
        }

        // Standard decimal display for classic numbers
        if (val <= 65536n) {
            return val.toString();
        }

        // For large numbers, show 2^exp with clean badge
        if (mode === 'auto') {
            return `2^${exp}`;
        }

        // Fallback or full
        return val.toString();
    }

    /**
     * Format score with commas or SI units
     */
    static formatScore(score) {
        if (!score) return '0';
        const str = score.toString();
        if (str.length <= 9) {
            // Add comma separators
            return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        // For enormous scores, compact with SI prefix or scientific
        const prefixIdx = Math.floor((str.length - 1) / 3);
        if (prefixIdx < this.SI_PREFIXES.length) {
            const leading = str.slice(0, str.length - prefixIdx * 3);
            const decimals = str.slice(str.length - prefixIdx * 3, str.length - prefixIdx * 3 + 2);
            return `${leading}.${decimals} ${this.SI_PREFIXES[prefixIdx]}`;
        }

        return `10^${str.length - 1}`;
    }

    /**
     * Return CSS class or inline style based on exponent
     */
    static getTileStyle(val) {
        const exp = Infinite2048Engine.getExponent(val);

        // Predefined palettes up to 2^16 (65536)
        const palette = {
            1: { bg: '#1e293b', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },           // 2
            2: { bg: '#0c4a6e', color: '#38bdf8', border: 'rgba(56,189,248,0.3)' },            // 4
            3: { bg: '#0369a1', color: '#e0f2fe', border: 'rgba(2,132,199,0.4)', glow: 'rgba(2,132,199,0.3)' },  // 8
            4: { bg: '#1d4ed8', color: '#ffffff', border: 'rgba(59,130,246,0.5)', glow: 'rgba(59,130,246,0.4)' }, // 16
            5: { bg: '#4338ca', color: '#ffffff', border: 'rgba(99,102,241,0.5)', glow: 'rgba(99,102,241,0.4)' }, // 32
            6: { bg: '#6d28d9', color: '#ffffff', border: 'rgba(139,92,246,0.5)', glow: 'rgba(139,92,246,0.4)' }, // 64
            7: { bg: '#86198f', color: '#ffffff', border: 'rgba(217,70,239,0.5)', glow: 'rgba(217,70,239,0.4)' }, // 128
            8: { bg: '#be185d', color: '#ffffff', border: 'rgba(244,63,94,0.5)', glow: 'rgba(244,63,94,0.4)' },   // 256
            9: { bg: '#b91c1c', color: '#ffffff', border: 'rgba(239,68,68,0.5)', glow: 'rgba(239,68,68,0.5)' },   // 512
            10: { bg: '#c2410c', color: '#ffffff', border: 'rgba(249,115,22,0.6)', glow: 'rgba(249,115,22,0.5)' }, // 1024
            11: { bg: '#a16207', color: '#fef08a', border: 'rgba(234,179,8,0.7)', glow: 'rgba(234,179,8,0.7)', legendary: true }, // 2048
            12: { bg: '#047857', color: '#a7f3d0', border: 'rgba(16,185,129,0.7)', glow: 'rgba(16,185,129,0.6)' }, // 4096
            13: { bg: '#0f766e', color: '#99f6e4', border: 'rgba(20,184,166,0.7)', glow: 'rgba(20,184,166,0.6)' }, // 8192
            14: { bg: '#0e7490', color: '#bae6fd', border: 'rgba(6,182,212,0.7)', glow: 'rgba(6,182,212,0.6)' },  // 16384
            15: { bg: '#4c1d95', color: '#ddd6fe', border: 'rgba(167,139,250,0.7)', glow: 'rgba(167,139,250,0.6)' }, // 32768
            16: { bg: '#701a75', color: '#fbcfe8', border: 'rgba(244,114,182,0.7)', glow: 'rgba(244,114,182,0.6)' }  // 65536
        };

        if (palette[exp]) {
            return palette[exp];
        }

        // Infinite cosmic cycling for values >= 2^17
        const hue = (exp * 37) % 360;
        return {
            bg: `hsl(${hue}, 65%, 22%)`,
            color: `hsl(${hue}, 90%, 92%)`,
            border: `hsl(${hue}, 80%, 60%)`,
            glow: `hsla(${hue}, 80%, 60%, 0.65)`,
            cosmic: true
        };
    }

    /**
     * Format exact decimal value with thousand separators
     */
    static formatExactDecimal(val) {
        if (!val) return '0';
        const str = val.toString();
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}
