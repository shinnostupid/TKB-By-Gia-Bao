/**
 * 2048 INFINITE — BigInt LocalStorage Manager
 * Safely persists arbitrary-precision state across sessions.
 */

class Storage2048 {
    static STORAGE_KEY = '2048_INFINITE_STATE_V1';
    static BEST_KEY = '2048_INFINITE_BEST_SCORE';
    static SETTINGS_KEY = '2048_INFINITE_SETTINGS';

    static saveGameState(engine) {
        try {
            const data = {
                board: engine.board.map(row => row.map(v => (v !== null ? v.toString() : null))),
                score: engine.score.toString(),
                bestScore: engine.bestScore.toString(),
                gameOver: engine.gameOver,
                savedAt: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(this.BEST_KEY, engine.bestScore.toString());
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
    }

    static loadGameState(engine) {
        try {
            // Load best score first
            const savedBest = localStorage.getItem(this.BEST_KEY);
            if (savedBest) {
                try {
                    engine.bestScore = BigInt(savedBest);
                } catch (_) {}
            }

            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data.board || !Array.isArray(data.board) || data.board.length !== engine.size) {
                return false;
            }

            const restoredBoard = data.board.map(row =>
                row.map(cellStr => (cellStr !== null && cellStr !== undefined ? BigInt(cellStr) : null))
            );

            engine.board = restoredBoard;
            engine.score = BigInt(data.score || '0');
            if (BigInt(data.bestScore || '0') > engine.bestScore) {
                engine.bestScore = BigInt(data.bestScore);
            }
            engine.gameOver = !!data.gameOver;
            return true;
        } catch (e) {
            console.warn('LocalStorage load failed, starting fresh:', e);
            return false;
        }
    }

    static clearCurrentGame() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (_) {}
    }

    static loadSettings() {
        try {
            const raw = localStorage.getItem(this.SETTINGS_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return {
            sound: true,
            displayMode: 'auto' // 'auto' (decimal up to 65k then 2^k), 'powers', 'full'
        };
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (_) {}
    }
}
