/**
 * 2048 INFINITE — UI Controller & True Sliding Animation Engine
 * Recreates the authentic play2048.co smooth tile sliding & merging physics.
 */

class UI2048 {
    constructor(engine, sound) {
        this.engine = engine;
        this.sound = sound;
        this.settings = Storage2048.loadSettings();
        this.sound.enabled = this.settings.sound;

        // DOM Elements
        this.boardEl = document.getElementById('grid-board');
        this.gridCells = this.boardEl.querySelectorAll('.grid-cell');
        this.tileContainer = document.getElementById('tile-container');

        this.scoreEl = document.getElementById('val-score');
        this.bestScoreEl = document.getElementById('val-best');
        this.scoreGainEl = document.getElementById('score-gain-floater');

        this.btnUndo = document.getElementById('btn-undo');
        this.btnNew = document.getElementById('btn-new');
        this.btnSound = document.getElementById('btn-sound');
        this.btnHelp = document.getElementById('btn-help');
        this.btnFeedback = document.getElementById('btn-feedback');

        this.modalWin = document.getElementById('modal-win');
        this.btnWinContinue = document.getElementById('btn-win-continue');
        this.btnWinRestart = document.getElementById('btn-win-restart');

        this.modalInspect = document.getElementById('modal-inspect');
        this.modalHelp = document.getElementById('modal-help');
        this.modalGameOver = document.getElementById('modal-gameover');

        this.isAnimating = false;
        this.lastMoveTime = 0;
        this.moveCooldown = 110; // 110ms matches the 100ms slide duration + 10ms buffer

        this.initTouch();
        this.initKeyboard();
        this.initButtons();
        this.updateSoundButton();

        window.addEventListener('resize', () => {
            this.render();
        });
    }

    getCellCoords(r, c) {
        const cell = this.gridCells[r * 4 + c];
        if (!cell) return { left: 0, top: 0, width: 80, height: 80 };
        return {
            left: cell.offsetLeft,
            top: cell.offsetTop,
            width: cell.offsetWidth,
            height: cell.offsetHeight
        };
    }

    createTileElement(val, r, c, isMerged = false, isSpawn = false) {
        const tile = document.createElement('div');
        tile.className = 'tile-item';
        tile.dataset.r = r;
        tile.dataset.c = c;

        const coords = this.getCellCoords(r, c);
        tile.style.transform = `translate(${coords.left}px, ${coords.top}px)`;
        tile.style.width = `${coords.width}px`;
        tile.style.height = `${coords.height}px`;

        if (isMerged) {
            tile.classList.add('tile-merged');
        } else if (isSpawn) {
            tile.classList.add('tile-new');
        }

        const inner = document.createElement('div');
        inner.className = 'tile-inner';

        const exp = Infinite2048Engine.getExponent(val);
        const formatted = Display2048.formatTileValue(val, this.settings.displayMode);
        const style = Display2048.getTileStyle(val);

        inner.textContent = formatted;
        inner.style.backgroundColor = style.bg;
        inner.style.color = style.color;

        if (style.glow) {
            inner.style.boxShadow = `0 0 24px 6px ${style.glow}`;
        }

        // Font scaling based on text length
        if (formatted.length >= 7) {
            inner.classList.add('font-tiny');
        } else if (formatted.length >= 5) {
            inner.classList.add('font-small');
        } else if (formatted.length >= 4) {
            inner.classList.add('font-medium');
        }

        // Power of 2 tag badge for numbers >= 2048
        if (val >= 2048n) {
            const badge = document.createElement('span');
            badge.className = 'tile-exponent-badge';
            badge.textContent = `2^${exp}`;
            inner.appendChild(badge);
        }

        tile.appendChild(inner);

        // Click / Tap to inspect full exact number
        tile.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openInspectModal(val);
        });

        return tile;
    }

    render(merges = [], spawn = null) {
        if (!this.tileContainer) return;
        this.tileContainer.innerHTML = '';

        for (let r = 0; r < this.engine.size; r++) {
            for (let c = 0; c < this.engine.size; c++) {
                const val = this.engine.board[r][c];
                if (val !== null) {
                    const isMerged = merges.some(m => m.r === r && m.c === c);
                    const isSpawn = spawn && spawn.r === r && spawn.c === c;
                    const tileEl = this.createTileElement(val, r, c, isMerged, isSpawn);
                    this.tileContainer.appendChild(tileEl);
                }
            }
        }

        // Update score indicators
        this.scoreEl.textContent = Display2048.formatScore(this.engine.score);
        this.bestScoreEl.textContent = Display2048.formatScore(this.engine.bestScore);

        // Undo button state
        if (this.btnUndo) {
            this.btnUndo.disabled = this.engine.history.length === 0;
            this.btnUndo.style.opacity = this.engine.history.length === 0 ? '0.5' : '1';
        }

        // Check Win / Game Over
        if (this.engine.won && !this.engine.keepPlaying) {
            this.showWinModal();
        } else if (this.engine.gameOver) {
            this.showGameOverModal();
        }
    }

    animateScoreGain(gain) {
        if (!gain || gain <= 0n) return;
        if (!this.scoreGainEl) return;

        this.scoreGainEl.textContent = `+${Display2048.formatScore(gain)}`;
        this.scoreGainEl.classList.remove('animate');
        void this.scoreGainEl.offsetWidth; // Force reflow
        this.scoreGainEl.classList.add('animate');
    }

    handleMove(direction) {
        if (this.isAnimating) return;
        const now = performance.now();
        if (now - this.lastMoveTime < this.moveCooldown) return;
        this.lastMoveTime = now;

        const result = this.engine.move(direction);
        if (result && result.moved) {
            this.isAnimating = true;

            // 1. Play audio
            if (result.merges && result.merges.length > 0) {
                const maxMergedVal = result.merges.reduce((max, m) => (m.value > max ? m.value : max), 0n);
                const exp = Infinite2048Engine.getExponent(maxMergedVal);
                this.sound.playMerge(exp);
            } else {
                this.sound.playMove();
            }

            // 2. Animate tiles sliding across board to destination
            if (result.movements && result.movements.length > 0) {
                result.movements.forEach(m => {
                    const tileEl = this.tileContainer.querySelector(`[data-r="${m.fromR}"][data-c="${m.fromC}"]`);
                    if (tileEl) {
                        const toCoords = this.getCellCoords(m.toR, m.toC);
                        tileEl.style.transform = `translate(${toCoords.left}px, ${toCoords.top}px)`;
                        // Invalidate dataset so another tile doesn't match the same element
                        tileEl.dataset.r = -1;
                        tileEl.dataset.c = -1;
                    }
                });
            }

            // 3. After 105ms slide animation finishes, finalize grid with merged bounce & new spawn
            setTimeout(() => {
                this.animateScoreGain(result.scoreGain);
                Storage2048.saveGameState(this.engine);
                this.render(result.merges, result.spawn);
                this.isAnimating = false;

                if (result.gameWon) {
                    this.showWinModal();
                } else if (result.gameOver) {
                    this.sound.playGameOver();
                }
            }, 105);
        }
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Block OS key-repeat flood when holding down keys
            if (e.repeat) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.handleMove('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.handleMove('right');
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.handleMove('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.handleMove('down');
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.triggerUndo();
                    }
                    break;
            }
        });
    }

    initTouch() {
        let touchStartX = 0;
        let touchStartY = 0;
        const threshold = 30; // Min swipe distance in px

        const board = this.boardEl;

        board.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        board.addEventListener('touchmove', (e) => {
            // Prevent bounce / pull-to-refresh while swiping on the 2048 board
            e.preventDefault();
        }, { passive: false });

        board.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 0) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            const absX = Math.abs(dx);
            const absY = Math.abs(dy);

            if (Math.max(absX, absY) < threshold) return;

            if (absX > absY) {
                if (dx > 0) this.handleMove('right');
                else this.handleMove('left');
            } else {
                if (dy > 0) this.handleMove('down');
                else this.handleMove('up');
            }
        }, { passive: true });
    }

    initButtons() {
        if (this.btnNew) {
            this.btnNew.addEventListener('click', () => {
                if (this.engine.score > 0n && !this.engine.gameOver && !this.engine.won) {
                    if (!confirm('Bắt đầu ván mới? Tiến trình hiện tại sẽ được lưu vào kỷ lục.')) {
                        return;
                    }
                }
                if (this.modalWin) this.modalWin.classList.add('hidden');
                if (this.modalGameOver) this.modalGameOver.classList.add('hidden');
                this.engine.startNewGame();
                Storage2048.saveGameState(this.engine);
                this.render();
            });
        }

        if (this.btnUndo) {
            this.btnUndo.addEventListener('click', () => {
                this.triggerUndo();
            });
        }

        if (this.btnSound) {
            this.btnSound.addEventListener('click', () => {
                this.settings.sound = !this.settings.sound;
                this.sound.enabled = this.settings.sound;
                Storage2048.saveSettings(this.settings);
                this.updateSoundButton();
            });
        }

        if (this.btnHelp) {
            this.btnHelp.addEventListener('click', () => {
                this.modalHelp.classList.remove('hidden');
            });
        }

        if (this.btnFeedback) {
            this.btnFeedback.addEventListener('click', () => {
                if (this.modalHelp) this.modalHelp.classList.remove('hidden');
            });
        }

        // Win modal actions
        if (this.btnWinContinue) {
            this.btnWinContinue.addEventListener('click', () => {
                if (this.modalWin) this.modalWin.classList.add('hidden');
                this.engine.continueGame();
                Storage2048.saveGameState(this.engine);
            });
        }

        if (this.btnWinRestart) {
            this.btnWinRestart.addEventListener('click', () => {
                if (this.modalWin) this.modalWin.classList.add('hidden');
                this.engine.startNewGame();
                Storage2048.saveGameState(this.engine);
                this.render();
            });
        }

        // Close modals
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const modal = document.getElementById(targetId);
                if (modal) modal.classList.add('hidden');
            });
        });

        // Copy exact decimal button
        const btnCopy = document.getElementById('btn-copy-exact-val');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                const text = document.getElementById('inspect-exact-val').textContent.replace(/\s+/g, '');
                navigator.clipboard.writeText(text).then(() => {
                    btnCopy.textContent = '✔ Đã sao chép!';
                    setTimeout(() => { btnCopy.textContent = '📋 Sao Chép Giá Trị'; }, 1800);
                }).catch(() => {
                    alert('Sao chép thất bại!');
                });
            });
        }

        // Game Over replay button
        const btnReplay = document.getElementById('btn-gameover-replay');
        if (btnReplay) {
            btnReplay.addEventListener('click', () => {
                this.modalGameOver.classList.add('hidden');
                this.engine.startNewGame();
                Storage2048.saveGameState(this.engine);
                this.render();
            });
        }
    }

    showWinModal() {
        if (this.sound) this.sound.playWin();
        if (this.modalWin) this.modalWin.classList.remove('hidden');
    }

    triggerUndo() {
        if (this.isAnimating) return;
        if (this.engine.undo()) {
            this.sound.playUndo();
            Storage2048.saveGameState(this.engine);
            this.render();
        }
    }

    updateSoundButton() {
        if (!this.btnSound) return;
        this.btnSound.innerHTML = this.settings.sound ? '<span>🔊</span>' : '<span>🔇</span>';
    }

    openInspectModal(val) {
        if (!val) return;
        const exp = Infinite2048Engine.getExponent(val);
        const digits = val.toString().length;

        document.getElementById('inspect-power-val').textContent = `2^${exp}`;
        document.getElementById('inspect-digits-count').textContent = `${digits.toLocaleString()} chữ số`;
        document.getElementById('inspect-exact-val').textContent = Display2048.formatExactDecimal(val);

        this.modalInspect.classList.remove('hidden');
    }

    showGameOverModal() {
        document.getElementById('gameover-score-val').textContent = Display2048.formatScore(this.engine.score);
        document.getElementById('gameover-max-tile').textContent = Display2048.formatTileValue(this.engine.getMaxTile());
        this.modalGameOver.classList.remove('hidden');
    }
}
