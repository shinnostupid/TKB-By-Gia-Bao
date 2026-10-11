/**
 * 2048 INFINITE — Pure BigInt Core Game Engine
 * Strictly maintains exact arbitrary-precision arithmetic without limits.
 * No max value restrictions. Fully supports infinite 2^k scaling.
 */

class Infinite2048Engine {
    constructor(size = 4) {
        this.size = size;
        this.board = this.createEmptyBoard();
        this.score = 0n;
        this.bestScore = 0n;
        this.history = []; // For Undo functionality
        this.maxHistory = 15;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.lastSpawn = null;
        this.lastMoves = [];
    }

    createEmptyBoard() {
        return Array.from({ length: this.size }, () => Array(this.size).fill(null));
    }

    cloneBoard(b) {
        return b.map(row => [...row]);
    }

    startNewGame() {
        this.board = this.createEmptyBoard();
        this.score = 0n;
        this.history = [];
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.lastSpawn = null;
        this.lastMoves = [];

        this.spawnTile();
        this.spawnTile();
    }

    continueGame() {
        this.keepPlaying = true;
    }

    getEmptyCells() {
        const cells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === null) {
                    cells.push({ r, c });
                }
            }
        }
        return cells;
    }

    spawnTile() {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return null;

        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        // 90% chance of 2n, 10% chance of 4n
        const val = Math.random() < 0.9 ? 2n : 4n;
        this.board[cell.r][cell.c] = val;
        this.lastSpawn = { r: cell.r, c: cell.c, value: val };
        return this.lastSpawn;
    }

    /**
     * Slide and merge a single 1D line of BigInts
     * Returns: { newLine, scoreGain, merges, moved }
     */
    slideLine(line) {
        const nonNulls = [];
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== null) {
                nonNulls.push({ val: line[i], origIdx: i });
            }
        }

        const result = Array(line.length).fill(null);
        let targetIdx = 0;
        let scoreGain = 0n;
        const merges = [];
        let moved = false;

        let i = 0;
        const movements = [];
        while (i < nonNulls.length) {
            const current = nonNulls[i];
            const next = nonNulls[i + 1];

            if (next && current.val === next.val) {
                // Merge two equal adjacent tiles
                const mergedVal = current.val * 2n;
                result[targetIdx] = mergedVal;
                scoreGain += mergedVal;
                merges.push({
                    targetIdx,
                    fromA: current.origIdx,
                    fromB: next.origIdx,
                    value: mergedVal
                });
                movements.push({ fromIdx: current.origIdx, toIdx: targetIdx, val: current.val, mergedInto: mergedVal });
                movements.push({ fromIdx: next.origIdx, toIdx: targetIdx, val: next.val, mergedInto: mergedVal });
                if (current.origIdx !== targetIdx || next.origIdx !== targetIdx) {
                    moved = true;
                }
                targetIdx++;
                i += 2; // Both tiles consumed
            } else {
                result[targetIdx] = current.val;
                movements.push({ fromIdx: current.origIdx, toIdx: targetIdx, val: current.val });
                if (current.origIdx !== targetIdx) {
                    moved = true;
                }
                targetIdx++;
                i++;
            }
        }

        return { result, scoreGain, merges, movements, moved };
    }

    /**
     * Execute a move in one of 4 directions: 'left', 'right', 'up', 'down'
     * Returns true if the board changed, false otherwise.
     */
    move(direction) {
        if (this.gameOver) return false;

        const prevBoard = this.cloneBoard(this.board);
        const prevScore = this.score;

        let movedOverall = false;
        let totalScoreGain = 0n;
        const allMerges = [];
        const allMovements = [];

        if (direction === 'left') {
            for (let r = 0; r < this.size; r++) {
                const row = this.board[r];
                const { result, scoreGain, merges, movements, moved } = this.slideLine(row);
                if (moved) movedOverall = true;
                totalScoreGain += scoreGain;
                this.board[r] = result;
                merges.forEach(m => allMerges.push({ r, c: m.targetIdx, value: m.value }));
                movements.forEach(m => allMovements.push({
                    fromR: r, fromC: m.fromIdx,
                    toR: r, toC: m.toIdx,
                    val: m.val,
                    mergedInto: m.mergedInto
                }));
            }
        } else if (direction === 'right') {
            for (let r = 0; r < this.size; r++) {
                const reversed = [...this.board[r]].reverse();
                const { result, scoreGain, merges, movements, moved } = this.slideLine(reversed);
                if (moved) movedOverall = true;
                totalScoreGain += scoreGain;
                this.board[r] = result.reverse();
                merges.forEach(m => allMerges.push({ r, c: this.size - 1 - m.targetIdx, value: m.value }));
                movements.forEach(m => allMovements.push({
                    fromR: r, fromC: this.size - 1 - m.fromIdx,
                    toR: r, toC: this.size - 1 - m.toIdx,
                    val: m.val,
                    mergedInto: m.mergedInto
                }));
            }
        } else if (direction === 'up') {
            for (let c = 0; c < this.size; c++) {
                const col = [];
                for (let r = 0; r < this.size; r++) col.push(this.board[r][c]);
                const { result, scoreGain, merges, movements, moved } = this.slideLine(col);
                if (moved) movedOverall = true;
                totalScoreGain += scoreGain;
                for (let r = 0; r < this.size; r++) this.board[r][c] = result[r];
                merges.forEach(m => allMerges.push({ r: m.targetIdx, c, value: m.value }));
                movements.forEach(m => allMovements.push({
                    fromR: m.fromIdx, fromC: c,
                    toR: m.toIdx, toC: c,
                    val: m.val,
                    mergedInto: m.mergedInto
                }));
            }
        } else if (direction === 'down') {
            for (let c = 0; c < this.size; c++) {
                const col = [];
                for (let r = this.size - 1; r >= 0; r--) col.push(this.board[r][c]);
                const { result, scoreGain, merges, movements, moved } = this.slideLine(col);
                if (moved) movedOverall = true;
                totalScoreGain += scoreGain;
                for (let r = 0; r < this.size; r++) {
                    this.board[this.size - 1 - r][c] = result[r];
                }
                merges.forEach(m => allMerges.push({ r: this.size - 1 - m.targetIdx, c, value: m.value }));
                movements.forEach(m => allMovements.push({
                    fromR: this.size - 1 - m.fromIdx, fromC: c,
                    toR: this.size - 1 - m.toIdx, toC: c,
                    val: m.val,
                    mergedInto: m.mergedInto
                }));
            }
        }

        if (!movedOverall) {
            return false;
        }

        // Save state to undo history
        this.history.push({
            board: prevBoard,
            score: prevScore,
            won: this.won,
            keepPlaying: this.keepPlaying
        });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Update score
        this.score += totalScoreGain;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
        }

        // Spawn new tile after valid move
        const newSpawn = this.spawnTile();

        // Check for 2048 Win Condition
        let gameWon = false;
        if (!this.won && !this.keepPlaying) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    if (this.board[r][c] === 2048n) {
                        this.won = true;
                        gameWon = true;
                        break;
                    }
                }
                if (gameWon) break;
            }
        }

        // Check for Game Over
        this.gameOver = this.checkGameOver();

        return {
            moved: true,
            scoreGain: totalScoreGain,
            movements: allMovements,
            merges: allMerges,
            spawn: newSpawn,
            gameWon: gameWon,
            won: this.won,
            gameOver: this.gameOver
        };
    }

    undo() {
        if (this.history.length === 0) return false;

        const lastState = this.history.pop();
        this.board = this.cloneBoard(lastState.board);
        this.score = lastState.score;
        this.won = lastState.won ?? false;
        this.keepPlaying = lastState.keepPlaying ?? false;
        this.gameOver = false;
        this.lastSpawn = null;
        return true;
    }

    checkGameOver() {
        // If any cell is empty, game is NOT over
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === null) return false;
            }
        }

        // If any adjacent cells match, game is NOT over
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.board[r][c];
                // Check right
                if (c + 1 < this.size && this.board[r][c + 1] === val) return false;
                // Check down
                if (r + 1 < this.size && this.board[r + 1][c] === val) return false;
            }
        }

        return true;
    }

    getMaxTile() {
        let max = 0n;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const v = this.board[r][c];
                if (v !== null && v > max) max = v;
            }
        }
        return max;
    }

    /**
     * Compute exact power of 2 exponent: 2^k == val
     * Since val is a power of 2, val.toString(2).length - 1 gives k with zero precision loss.
     */
    static getExponent(val) {
        if (!val || val <= 0n) return 0;
        return val.toString(2).length - 1;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Infinite2048Engine;
}
