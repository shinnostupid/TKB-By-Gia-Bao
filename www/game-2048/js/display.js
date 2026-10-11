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

        // Classic authentic Play2048.co palette
        const palette = {
            1: { bg: '#eee4da', color: '#776e65' },                                             // 2
            2: { bg: '#ede0c8', color: '#776e65' },                                             // 4
            3: { bg: '#f2b179', color: '#f9f6f2' },                                             // 8
            4: { bg: '#f59563', color: '#f9f6f2' },                                             // 16
            5: { bg: '#f67c5f', color: '#f9f6f2' },                                             // 32
            6: { bg: '#f65e3b', color: '#f9f6f2' },                                             // 64
            7: { bg: '#edcf72', color: '#f9f6f2', glow: 'rgba(243, 215, 116, 0.28)' },          // 128
            8: { bg: '#edcc61', color: '#f9f6f2', glow: 'rgba(243, 215, 116, 0.35)' },          // 256
            9: { bg: '#edc850', color: '#f9f6f2', glow: 'rgba(243, 215, 116, 0.42)' },          // 512
            10: { bg: '#edc53f', color: '#f9f6f2', glow: 'rgba(243, 215, 116, 0.50)' },         // 1024
            11: { bg: '#edc22e', color: '#f9f6f2', glow: 'rgba(243, 215, 116, 0.65)', legendary: true }, // 2048
            12: { bg: '#a6c48a', color: '#f9f6f2', glow: 'rgba(166, 196, 138, 0.5)' },          // 4096
            13: { bg: '#67a086', color: '#f9f6f2', glow: 'rgba(103, 160, 134, 0.5)' },          // 8192
            14: { bg: '#56828b', color: '#f9f6f2', glow: 'rgba(86, 130, 139, 0.5)' },           // 16384
            15: { bg: '#3d5a80', color: '#f9f6f2', glow: 'rgba(61, 90, 128, 0.5)' },            // 32768
            16: { bg: '#293241', color: '#f9f6f2', glow: 'rgba(41, 50, 65, 0.6)' }              // 65536
        };

        if (palette[exp]) {
            return palette[exp];
        }

        // Infinite champion golden-onyx tiles for values >= 2^17
        return {
            bg: '#3c3a32',
            color: '#f9f6f2',
            glow: 'rgba(237, 194, 46, 0.8)',
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
