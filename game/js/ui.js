/**
 * UI & HUD Controller for NEON DODGE
 * Manages screen transitions, modals, HUD statistics, leaderboard table, settings,
 * notifications, and mobile touch controls.
 */

// Resilient fallback catalog to guarantee shop cards NEVER fail to render
const DEFAULT_PERK_CATALOG = {
    magnet: {
        id: 'magnet',
        name: 'NAM CHÂM NĂNG LƯỢNG',
        subtitle: 'QUANTUM TRACTOR BEAM',
        image: 'assets/shop-magnet.png',
        maxLevel: 3,
        costs: [120, 280, 550],
        descriptions: [
            'Chưa kích hoạt. Bán kính hút xu cơ bản: 75px.',
            'Cấp 1: Tăng bán kính hút xu & năng lượng lên 180px (+140%).',
            'Cấp 2: Bán kính hút mở rộng 290px, gia tốc hút nhanh gấp đôi.',
            'Cấp 3 (MAX): Bán kính cực đại 420px, tự động gom toàn bộ xu lân cận!'
        ]
    },
    shield: {
        id: 'shield',
        name: 'KHIÊN NANO KHỞI ĐẦU',
        subtitle: 'HEX ENERGY FORCEFIELD',
        image: 'assets/shop-shield.png',
        maxLevel: 3,
        costs: [160, 360, 750],
        descriptions: [
            'Chưa kích hoạt. Chỉ nhận khiên khi nhặt vật phẩm trong trận.',
            'Cấp 1: Xuất kích với 1 tầng khiên bảo vệ năng lượng ngay từ đầu.',
            'Cấp 2: Khởi đầu 1 khiên + tăng thời gian bất tử sau va chạm lên 1.8s.',
            'Cấp 3 (MAX): Xuất kích với 2 tầng khiên liên hoàn tối thượng!'
        ]
    },
    blaster: {
        id: 'blaster',
        name: 'PHÁO NANO PLASMA',
        subtitle: 'HYPER PLASMA ACCELERATOR',
        image: 'assets/shop-blaster.png',
        maxLevel: 3,
        costs: [150, 320, 680],
        descriptions: [
            'Chưa nâng cấp. Bắn 2 tia plasma cơ bản (tốc độ nạp 0.12s).',
            'Cấp 1: Gia tốc đạn bay +25%, nạp đạn nhanh hơn (0.10s).',
            'Cấp 2: Xuất kích với pháo 3 tia plasma chùm tỏa rộng.',
            'Cấp 3 (MAX): Mở khóa pháo 4 nòng Quad-Plasma siêu tốc (0.08s)!'
        ]
    },
    warp: {
        id: 'warp',
        name: 'ĐỘNG CƠ BƯỚC NHẢY',
        subtitle: 'QUANTUM WARP THRUSTER',
        image: 'assets/shop-warp.png',
        maxLevel: 3,
        costs: [100, 240, 480],
        descriptions: [
            'Chưa nâng cấp. Hồi chiêu Warp Dash cơ bản: 1.3s.',
            'Cấp 1: Giảm thời gian hồi chiêu Dash né đạn xuống còn 1.0s.',
            'Cấp 2: Hồi chiêu siêu tốc 0.75s + tăng cự ly lướt +25%.',
            'Cấp 3 (MAX): Hồi chiêu cực đại 0.5s, lướt liên tục như bóng ma vũ trụ!'
        ]
    },
    emp: {
        id: 'emp',
        name: 'BOM TỪ TRƯỜNG EMP',
        subtitle: 'ELECTRO-MAGNETIC NOVA CORE',
        image: 'assets/shop-emp.png',
        maxLevel: 3,
        costs: [180, 400, 800],
        descriptions: [
            'Chưa kích hoạt. Chỉ có bom EMP khi nhặt được biểu tượng EMP.',
            'Cấp 1: Bắt đầu mỗi trận với sẵn 1 quả bom EMP (Phím E / Nút EMP).',
            'Cấp 2: Bắt đầu trận với 2 quả bom EMP dự trữ + sóng chấn động rộng hơn.',
            'Cấp 3 (MAX): Dự trữ 2 bom EMP + mỗi khi kích hoạt hồi 100% thanh Dash!'
        ]
    }
};

class UIManager {
    constructor(game) {
        this.game = game;

        // Screens and Modals
        this.screenMenu = document.getElementById('screen-menu');
        this.screenDifficulty = document.getElementById('screen-difficulty');
        this.screenHud = document.getElementById('screen-hud');
        this.screenGameOver = document.getElementById('screen-game-over');
        this.screenLeaderboard = document.getElementById('screen-leaderboard');
        this.screenHowToPlay = document.getElementById('screen-how-to-play');
        this.screenShop = document.getElementById('screen-shop');

        this.modalName = document.getElementById('modal-name');
        this.modalPause = document.getElementById('modal-pause');
        this.modalSettings = document.getElementById('modal-settings');

        // HUD Elements
        this.hudScore = document.getElementById('hud-score');
        this.hudHighScore = document.getElementById('hud-high-score');
        this.hudLevel = document.getElementById('hud-level');
        this.hudTime = document.getElementById('hud-time');
        this.hudShield = document.getElementById('hud-shield');
        this.hudWeapon = document.getElementById('hud-weapon-badge');
        this.hudCombo = document.getElementById('hud-combo');
        this.hudComboMultiplier = document.getElementById('hud-combo-multiplier');
        this.hudWarningBanner = document.getElementById('hud-warning-banner');
        this.hudWarningText = document.getElementById('hud-warning-text');
        this.hudToast = document.getElementById('hud-toast');
        this.btnEmp = document.getElementById('btn-emp');
        this.touchControls = document.getElementById('touch-controls');
        this.hudCoinCount = document.getElementById('hud-coin-count');

        // Currency & Shop Elements
        this.menuCoinCount = document.getElementById('menu-coin-count');
        this.shopCoinBalance = document.getElementById('shop-coin-balance');
        this.shopCardsGrid = document.getElementById('shop-cards-grid');
        this.shopPowerFill = document.getElementById('shop-power-fill');
        this.shopPowerText = document.getElementById('shop-power-text');

        // Game Over Elements
        this.goScore = document.getElementById('go-score');
        this.goDifficulty = document.getElementById('go-difficulty');
        this.goTime = document.getElementById('go-time');
        this.goCombo = document.getElementById('go-combo');
        this.goRank = document.getElementById('go-rank');
        this.goCoins = document.getElementById('go-coins');
        this.goWallet = document.getElementById('go-wallet');

        // Leaderboard Elements
        this.leaderboardTbody = document.getElementById('leaderboard-tbody');
        this.currentLbFilter = 'ALL';

        this.pendingPlayAfterName = false;
        this.toastTimeout = null;
        this.warningTimeout = null;

        this.initEventListeners();
    }

    initEventListeners() {
        // Pilot Badge Click (Left Terminal & Top Bar)
        const pilotBadge = document.getElementById('menu-pilot-badge');
        if (pilotBadge) {
            pilotBadge.style.cursor = 'pointer';
            pilotBadge.title = 'Nhấp để đổi tên phi công';
            pilotBadge.addEventListener('click', () => {
                this.playClick();
                this.showNameModal();
            });
        }

        // Coin Badge Click -> Opens Shop
        const menuCoinBadge = document.getElementById('menu-coin-badge');
        if (menuCoinBadge) {
            menuCoinBadge.style.cursor = 'pointer';
            menuCoinBadge.addEventListener('click', () => {
                this.playClick();
                this.showShopScreen();
            });
        }

        // Menu Buttons
        document.getElementById('btn-menu-play').addEventListener('click', () => {
            this.playClick();
            const pilotName = window.storageManager.getPilotName();
            if (!pilotName) {
                this.pendingPlayAfterName = true;
                this.showNameModal();
            } else {
                this.showDifficultyScreen();
            }
        });

        // Shop Menu Button
        const btnMenuShop = document.getElementById('btn-menu-shop');
        if (btnMenuShop) {
            btnMenuShop.addEventListener('click', () => {
                this.playClick();
                this.showShopScreen();
            });
        }

        // Quick Hangar Upgrade Button from Right Terminal
        const btnQuickHangar = document.getElementById('btn-quick-hangar-upgrade');
        if (btnQuickHangar) {
            btnQuickHangar.addEventListener('click', () => {
                this.playClick();
                this.showShopScreen();
            });
        }

        // Quick Audio Toggles in Left Terminal
        const quickMusicBtn = document.getElementById('quick-toggle-music');
        if (quickMusicBtn) {
            quickMusicBtn.addEventListener('click', () => {
                const s = window.storageManager.getSettings();
                s.music = !s.music;
                window.storageManager.saveSettings(s);
                if (window.audioManager) window.audioManager.updateSettings(s);
                const txt = document.getElementById('quick-music-text');
                if (txt) txt.textContent = s.music ? 'NHẠC: BẬT' : 'NHẠC: TẮT';
                this.showToast(s.music ? 'NHẠC NỀN: BẬT' : 'NHẠC NỀN: TẮT', s.music ? '#00f0ff' : '#8899aa', 1200);
            });
        }

        const quickSfxBtn = document.getElementById('quick-toggle-sfx');
        if (quickSfxBtn) {
            quickSfxBtn.addEventListener('click', () => {
                const s = window.storageManager.getSettings();
                s.sfx = !s.sfx;
                window.storageManager.saveSettings(s);
                if (window.audioManager) window.audioManager.updateSettings(s);
                const txt = document.getElementById('quick-sfx-text');
                if (txt) txt.textContent = s.sfx ? 'SFX: BẬT' : 'SFX: TẮT';
                this.showToast(s.sfx ? 'ÂM THANH SFX: BẬT' : 'ÂM THANH SFX: TẮT', s.sfx ? '#ffd700' : '#8899aa', 1200);
            });
        }

        // Shop Back Buttons (Top & Bottom)
        const btnShopBack = document.getElementById('btn-shop-back');
        if (btnShopBack) {
            btnShopBack.addEventListener('click', () => {
                this.playClick();
                this.showMenuScreen();
            });
        }
        const btnShopTopBack = document.getElementById('btn-shop-top-back');
        if (btnShopTopBack) {
            btnShopTopBack.addEventListener('click', () => {
                this.playClick();
                this.showMenuScreen();
            });
        }

        // Game Over Shop Button
        const btnGoShop = document.getElementById('btn-gameover-shop');
        if (btnGoShop) {
            btnGoShop.addEventListener('click', () => {
                this.playClick();
                this.showShopScreen();
            });
        }

        document.getElementById('btn-menu-leaderboard').addEventListener('click', () => {
            this.playClick();
            this.showLeaderboardScreen();
        });

        document.getElementById('btn-menu-how-to-play').addEventListener('click', () => {
            this.playClick();
            this.showHowToPlayScreen();
        });

        document.getElementById('btn-menu-settings').addEventListener('click', () => {
            this.playClick();
            this.showSettingsModal();
        });

        // Name Modal
        document.getElementById('btn-name-submit').addEventListener('click', () => {
            this.handleNameSubmit();
        });
        document.getElementById('input-pilot-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleNameSubmit();
        });

        // Difficulty Selection
        document.querySelectorAll('.btn-difficulty-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playClick();
                const card = e.currentTarget;
                const diff = card.getAttribute('data-difficulty');
                this.game.start(diff);
            });
        });

        document.getElementById('btn-difficulty-back').addEventListener('click', () => {
            this.playClick();
            this.showMenuScreen();
        });

        // HUD Pause Button
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.playClick();
            this.game.pause();
        });

        // Pause Modal Buttons
        document.getElementById('btn-pause-continue').addEventListener('click', () => {
            this.playClick();
            this.game.resume();
        });

        document.getElementById('btn-pause-restart').addEventListener('click', () => {
            this.playClick();
            this.hideAllModals();
            this.game.restart();
        });

        document.getElementById('btn-pause-menu').addEventListener('click', () => {
            this.playClick();
            this.hideAllModals();
            this.game.quitToMenu();
        });

        // Game Over Buttons
        document.getElementById('btn-gameover-replay').addEventListener('click', () => {
            this.playClick();
            this.game.restart();
        });

        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            this.playClick();
            this.showMenuScreen();
        });

        document.getElementById('btn-gameover-leaderboard').addEventListener('click', () => {
            this.playClick();
            this.showLeaderboardScreen();
        });

        // Leaderboard Screen
        document.querySelectorAll('.btn-lb-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playClick();
                document.querySelectorAll('.btn-lb-filter').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentLbFilter = e.currentTarget.getAttribute('data-filter');
                this.renderLeaderboard();
            });
        });

        document.getElementById('btn-leaderboard-back').addEventListener('click', () => {
            this.playClick();
            this.showMenuScreen();
        });

        // How To Play Screen
        document.getElementById('btn-how-to-play-back').addEventListener('click', () => {
            this.playClick();
            this.showMenuScreen();
        });

        // Settings Modal
        document.getElementById('btn-settings-close').addEventListener('click', () => {
            this.playClick();
            this.saveAndCloseSettings();
        });

        // Auto-Fire Toggle Button in HUD
        const btnAutoFire = document.getElementById('btn-toggle-autofire');
        if (btnAutoFire) {
            btnAutoFire.addEventListener('click', () => {
                this.playClick();
                if (this.game.player) {
                    this.game.player.autoFire = !this.game.player.autoFire;
                    if (this.game.player.autoFire) {
                        btnAutoFire.textContent = '🔫 AUTO: ON';
                        btnAutoFire.classList.add('active');
                        this.game.showToast('AUTO-FIRE: BẬT', '#00f0ff');
                    } else {
                        btnAutoFire.textContent = '🔫 AUTO: OFF';
                        btnAutoFire.classList.remove('active');
                        this.game.showToast('AUTO-FIRE: TẮT', '#8899aa');
                    }
                }
            });
        }

        // Mobile On-screen EMP button
        this.btnEmp.addEventListener('click', () => {
            if (this.game.player) {
                this.game.player.triggerEMP();
            }
        });

        // Mobile On-screen Touch D-Pad buttons (Full 4-way 2D flight)
        const btnUp = document.getElementById('touch-btn-up');
        const btnDown = document.getElementById('touch-btn-down');
        const btnLeft = document.getElementById('touch-btn-left');
        const btnRight = document.getElementById('touch-btn-right');
        const btnDash = document.getElementById('touch-btn-dash');
        const btnFire = document.getElementById('touch-btn-fire');

        const bindHold = (el, onStart, onEnd) => {
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); }, { passive: false });
            el.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); }, { passive: false });
            el.addEventListener('mousedown', onStart);
            el.addEventListener('mouseup', onEnd);
            el.addEventListener('mouseleave', onEnd);
        };

        bindHold(btnUp, () => { this.game.input.up = true; }, () => { this.game.input.up = false; });
        bindHold(btnDown, () => { this.game.input.down = true; }, () => { this.game.input.down = false; });
        bindHold(btnLeft, () => { this.game.input.left = true; }, () => { this.game.input.left = false; });
        bindHold(btnRight, () => { this.game.input.right = true; }, () => { this.game.input.right = false; });

        if (btnDash) {
            btnDash.addEventListener('click', () => {
                if (this.game.player) this.game.player.dash();
            });
        }

        // Mobile Auto-Fire Toggle Button
        const btnTouchAuto = document.getElementById('touch-btn-autofire');
        if (btnTouchAuto) {
            btnTouchAuto.addEventListener('click', () => {
                this.playClick();
                if (this.game.player) {
                    this.game.player.autoFire = !this.game.player.autoFire;
                    const autoLbl = document.getElementById('touch-autofire-label');
                    if (this.game.player.autoFire) {
                        btnTouchAuto.classList.add('active');
                        if (autoLbl) autoLbl.textContent = '🔫 TỰ BẮN: BẬT';
                        this.game.showToast('TỰ ĐỘNG BẮN: BẬT', '#00f0ff');
                    } else {
                        btnTouchAuto.classList.remove('active');
                        if (autoLbl) autoLbl.textContent = '🔫 TỰ BẮN: TẮT';
                        this.game.showToast('TỰ ĐỘNG BẮN: TẮT', '#8899aa');
                    }
                }
            });
        }

        if (btnFire) {
            bindHold(btnFire, () => {
                this.game.input.shoot = true;
            }, () => {
                this.game.input.shoot = false;
            });
        }
    }


    playClick() {
        if (window.audioManager) window.audioManager.playClick();
    }

    hideAllScreens() {
        this.screenMenu.classList.add('hidden');
        this.screenDifficulty.classList.add('hidden');
        this.screenHud.classList.add('hidden');
        this.screenGameOver.classList.add('hidden');
        this.screenLeaderboard.classList.add('hidden');
        this.screenHowToPlay.classList.add('hidden');
        if (this.screenShop) this.screenShop.classList.add('hidden');
    }

    hideAllModals() {
        this.modalName.classList.add('hidden');
        this.modalPause.classList.add('hidden');
        this.modalSettings.classList.add('hidden');
    }

    showMenuScreen() {
        this.hideAllScreens();
        this.hideAllModals();
        this.screenMenu.classList.remove('hidden');

        // Update pilot name badge
        const pilotName = (window.storageManager && window.storageManager.getPilotName()) || 'SHINNO';
        const nameEl = document.getElementById('menu-pilot-name');
        if (nameEl) nameEl.innerHTML = `PILOT: ${this.escapeHtml(pilotName.toUpperCase())} <span class="edit-icon">✏️</span>`;

        // Update wallet coin badge in top bar and hero button
        const coins = window.storageManager ? window.storageManager.getCoins() : 0;
        if (this.menuCoinCount) {
            this.menuCoinCount.textContent = coins.toLocaleString();
        }

        // Update Left Terminal: Career Stats
        if (window.storageManager) {
            const bestScore = this.game ? this.game.highScore : 0;
            const records = window.storageManager.getLeaderboard('ALL');
            let topRecordScore = bestScore;
            let topRecordTime = 0;
            let topRecordCombo = 1;

            if (records && records.length > 0) {
                topRecordScore = Math.max(topRecordScore, records[0].score || 0);
                topRecordTime = Math.max(...records.map(r => r.time || 0));
                topRecordCombo = Math.max(...records.map(r => r.combo || 1));
            }

            const statBest = document.getElementById('menu-stat-best');
            if (statBest) statBest.textContent = topRecordScore.toLocaleString();

            const statTime = document.getElementById('menu-stat-time');
            if (statTime) statTime.textContent = this.formatTime(topRecordTime);

            const statCombo = document.getElementById('menu-stat-combo');
            if (statCombo) statCombo.textContent = `x${Math.max(1, topRecordCombo)}`;

            const statCoins = document.getElementById('menu-stat-coins');
            if (statCoins) statCoins.textContent = `${coins.toLocaleString()} XU`;

            // Update Right Terminal: Hangar Ship Status
            const hangarStats = window.storageManager.getHangarStats();
            const powerVal = document.getElementById('menu-hangar-power');
            if (powerVal) powerVal.textContent = `${hangarStats.powerPercent}%`;

            const powerBar = document.getElementById('menu-power-bar');
            if (powerBar) powerBar.style.width = `${hangarStats.powerPercent}%`;

            const powerTier = document.getElementById('menu-power-tier-text');
            if (powerTier) {
                const tier = Math.min(5, Math.floor(hangarStats.totalLevel / 3) + 1);
                powerTier.textContent = `TIER ${tier} COMBAT READY (${hangarStats.totalLevel}/15)`;
            }

            const up = hangarStats.upgrades || {};
            const modMagnet = document.getElementById('menu-mod-magnet');
            if (modMagnet) modMagnet.textContent = `LV ${up.magnet || 0}/3`;

            const modShield = document.getElementById('menu-mod-shield');
            if (modShield) modShield.textContent = `LV ${up.shield || 0}/3`;

            const modBlaster = document.getElementById('menu-mod-blaster');
            if (modBlaster) modBlaster.textContent = `LV ${up.blaster || 0}/3`;

            const modWarp = document.getElementById('menu-mod-warp');
            if (modWarp) modWarp.textContent = `LV ${up.warp || 0}/3`;

            const modEmp = document.getElementById('menu-mod-emp');
            if (modEmp) modEmp.textContent = `LV ${up.emp || 0}/3`;
        }

        if (window.audioManager) window.audioManager.startMusic('menu');
    }

    showDifficultyScreen() {
        this.hideAllScreens();
        this.hideAllModals();
        this.screenDifficulty.classList.remove('hidden');
    }

    showHudScreen() {
        this.hideAllScreens();
        this.hideAllModals();
        this.screenHud.classList.remove('hidden');

        // Apply touch control settings
        const settings = window.storageManager ? window.storageManager.getSettings() : { touchControl: 'drag' };
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (window.innerWidth <= 768);

        const dpadBox = document.getElementById('touch-dpad-box');
        const actionsBox = document.getElementById('touch-actions-box');

        if (isTouchDevice) {
            if (this.touchControls) this.touchControls.classList.remove('hidden');
            if (actionsBox) actionsBox.classList.remove('hidden');
            if (dpadBox) {
                if (settings.touchControl === 'buttons') {
                    dpadBox.classList.remove('hidden');
                } else {
                    dpadBox.classList.add('hidden');
                }
            }

            // By default on mobile, turn on auto-fire for fluid combat
            if (this.game.player) {
                this.game.player.autoFire = true;
                const autoBtn = document.getElementById('touch-btn-autofire');
                const autoLbl = document.getElementById('touch-autofire-label');
                if (autoBtn) autoBtn.classList.add('active');
                if (autoLbl) autoLbl.textContent = '🔫 TỰ BẮN: BẬT';
            }
        } else {
            if (this.touchControls) this.touchControls.classList.add('hidden');
        }
    }

    showGameOverScreen({ score, difficulty, time, combo, rank, coinsCollected, totalCoins }) {
        this.hideAllScreens();
        this.hideAllModals();
        this.screenGameOver.classList.remove('hidden');

        this.goScore.textContent = score.toLocaleString();
        this.goDifficulty.textContent = difficulty;
        this.goDifficulty.className = `stat-badge ${difficulty.toLowerCase()}`;
        this.goTime.textContent = this.formatTime(time);
        this.goCombo.textContent = `x${combo}`;
        this.goRank.textContent = rank ? `#${rank}` : '--';

        if (this.goCoins) {
            this.goCoins.textContent = `+${coinsCollected || 0} XU`;
        }
        if (this.goWallet) {
            this.goWallet.textContent = `${(totalCoins || 0).toLocaleString()} XU`;
        }
    }

    showShopScreen() {
        this.hideAllScreens();
        this.hideAllModals();
        if (this.screenShop) {
            this.screenShop.classList.remove('hidden');
        }
        this.renderShop();
    }

    renderShop() {
        if (!this.shopCardsGrid) {
            this.shopCardsGrid = document.getElementById('shop-cards-grid');
        }
        if (!this.shopCardsGrid) return;

        const coins = window.storageManager ? window.storageManager.getCoins() : 0;
        if (this.shopCoinBalance) {
            this.shopCoinBalance.textContent = coins.toLocaleString();
        }
        if (this.menuCoinCount) {
            this.menuCoinCount.textContent = coins.toLocaleString();
        }

        // Get Hangar Power Stats
        if (window.storageManager && typeof window.storageManager.getHangarStats === 'function') {
            const hStats = window.storageManager.getHangarStats();
            const shopPowerFill = document.getElementById('shop-power-fill');
            const shopPowerText = document.getElementById('shop-power-text');
            if (shopPowerFill) shopPowerFill.style.width = `${hStats.powerPercent}%`;
            if (shopPowerText) shopPowerText.textContent = `${hStats.powerPercent}% (CẤP ${hStats.totalLevel}/15)`;
        }

        // Fail-safe perk catalog retrieval
        let catalog = DEFAULT_PERK_CATALOG;
        if (window.storageManager && typeof window.storageManager.getPerkCatalog === 'function') {
            const fetched = window.storageManager.getPerkCatalog();
            if (fetched && typeof fetched === 'object' && Object.keys(fetched).length > 0) {
                catalog = fetched;
            }
        }

        const upgrades = (window.storageManager && typeof window.storageManager.getUpgrades === 'function')
            ? window.storageManager.getUpgrades()
            : { magnet: 0, shield: 0, blaster: 0, warp: 0, emp: 0 };

        this.shopCardsGrid.innerHTML = '';

        for (const [id, perk] of Object.entries(catalog)) {
            try {
                const currentLevel = upgrades[id] || 0;
                const isMax = currentLevel >= perk.maxLevel;
                const nextCost = isMax ? null : perk.costs[currentLevel];
                const canAfford = !isMax && (coins >= nextCost);

                const card = document.createElement('div');
                card.className = `shop-card ${isMax ? 'card-maxed' : ''}`;

                // Pips generator
                let pipsHtml = '';
                for (let i = 1; i <= perk.maxLevel; i++) {
                    pipsHtml += `<span class="shop-pip ${i <= currentLevel ? 'filled' : ''}"></span>`;
                }

                // Description text
                const currentDesc = (perk.descriptions && perk.descriptions[currentLevel]) || (perk.descriptions && perk.descriptions[0]) || '';
                const nextDesc = (!isMax && perk.descriptions) ? perk.descriptions[currentLevel + 1] : null;

                card.innerHTML = `
                    <div class="shop-card-img-wrap">
                        <img src="${perk.image}" alt="${perk.name}" class="shop-card-img" onerror="this.src='assets/energy.png'">
                        <div class="shop-card-badge">${isMax ? 'CẤP TỐI ĐA' : `CẤP ${currentLevel}/${perk.maxLevel}`}</div>
                    </div>
                    <div class="shop-card-body">
                        <div class="shop-card-meta">
                            <div class="shop-level-pips">${pipsHtml}</div>
                            <span class="shop-card-tier-text font-bold text-xs" style="color: ${isMax ? '#10b981' : '#ffd700'}; font-weight: 700; font-family: var(--font-rajdhani);">
                                ${isMax ? 'MAX TIER' : `TIER ${currentLevel + 1}`}
                            </span>
                        </div>
                        <h3 class="shop-card-title">${perk.name}</h3>
                        <div class="shop-card-subtitle">${perk.subtitle}</div>

                        <div class="shop-card-desc">
                            ${currentDesc}
                        </div>

                        ${!isMax && nextDesc ? `
                        <div class="shop-next-bonus">
                            <strong>NÂNG CẤP TIẾP THEO:</strong> ${nextDesc}
                        </div>
                        ` : `
                        <div class="shop-next-bonus" style="border-left-color: #10b981; background: rgba(16,185,129,0.08);">
                            <strong style="color: #34d399;">HIỆU SUẤT TỐI THƯỢNG:</strong> Kỹ năng đã đạt cấp độ cao nhất!
                        </div>
                        `}

                        <button class="btn-shop-buy ${isMax ? 'is-maxed' : (canAfford ? 'can-afford' : 'cannot-afford')}" data-perk="${id}">
                            ${isMax ? '✓ ĐÃ TỐI ĐA (MAX)' : `
                                <img src="assets/coin-icon.png" class="btn-shop-coin-icon" alt="Xu">
                                <span>${canAfford ? 'NÂNG CẤP' : 'THIẾU XU'} (${nextCost} XU)</span>
                            `}
                        </button>
                    </div>
                `;

                const buyBtn = card.querySelector('.btn-shop-buy');
                if (buyBtn && !isMax) {
                    buyBtn.addEventListener('click', () => {
                        if (canAfford && window.storageManager) {
                            const result = window.storageManager.upgradePerk(id);
                            if (result.success) {
                                if (window.audioManager) window.audioManager.playBuy();
                                this.showToast(`NÂNG CẤP THÀNH CÔNG: ${perk.name}!`, '#ffd700', 2500);
                                this.renderShop();
                            }
                        } else {
                            if (window.audioManager) window.audioManager.playError();
                            this.showToast(`KHÔNG ĐỦ XU! CẦN ${nextCost - coins} XU NỮA`, '#ff0055', 2200);
                        }
                    });
                }

                this.shopCardsGrid.appendChild(card);
            } catch (err) {
                console.error("Error creating shop card for perk", id, err);
            }
        }
    }

    showLeaderboardScreen() {
        this.hideAllScreens();
        this.hideAllModals();
        this.screenLeaderboard.classList.remove('hidden');
        this.renderLeaderboard();
    }

    showHowToPlayScreen() {
        this.hideAllScreens();
        this.hideAllModals();
        this.screenHowToPlay.classList.remove('hidden');
    }

    showNameModal() {
        const current = window.storageManager.getPilotName();
        document.getElementById('input-pilot-name').value = current;
        document.getElementById('name-error-msg').textContent = '';
        this.modalName.classList.remove('hidden');
        setTimeout(() => document.getElementById('input-pilot-name').focus(), 100);
    }

    handleNameSubmit() {
        const input = document.getElementById('input-pilot-name');
        const val = input.value.trim();
        const err = document.getElementById('name-error-msg');

        if (val.length < 3) {
            err.textContent = "Tên phi công phải có ít nhất 3 ký tự!";
            return;
        }
        if (val.length > 16) {
            err.textContent = "Tên phi công tối đa 16 ký tự!";
            return;
        }

        window.storageManager.setPilotName(val);
        this.modalName.classList.add('hidden');

        if (this.pendingPlayAfterName) {
            this.pendingPlayAfterName = false;
            this.showDifficultyScreen();
        }
    }

    showPauseModal() {
        this.modalPause.classList.remove('hidden');
    }

    hidePauseModal() {
        this.modalPause.classList.add('hidden');
    }

    showSettingsModal() {
        const s = window.storageManager.getSettings();
        document.getElementById('setting-pilot-name').value = window.storageManager.getPilotName();
        document.getElementById('setting-music').checked = s.music;
        document.getElementById('setting-sfx').checked = s.sfx;
        document.getElementById('setting-volume').value = s.volume;
        document.getElementById('setting-volume-val').textContent = `${s.volume}%`;
        document.getElementById('setting-shake').checked = s.screenShake;
        document.getElementById('setting-low-graphics').checked = s.lowGraphics;
        document.getElementById('setting-control').value = s.touchControl;

        document.getElementById('setting-volume').oninput = (e) => {
            document.getElementById('setting-volume-val').textContent = `${e.target.value}%`;
        };

        this.modalSettings.classList.remove('hidden');
    }

    saveAndCloseSettings() {
        const newName = document.getElementById('setting-pilot-name').value.trim();
        if (newName.length >= 3 && newName.length <= 16) {
            window.storageManager.setPilotName(newName);
        }

        const newSettings = {
            music: document.getElementById('setting-music').checked,
            sfx: document.getElementById('setting-sfx').checked,
            volume: parseInt(document.getElementById('setting-volume').value, 10),
            screenShake: document.getElementById('setting-shake').checked,
            lowGraphics: document.getElementById('setting-low-graphics').checked,
            touchControl: document.getElementById('setting-control').value
        };

        window.storageManager.saveSettings(newSettings);

        if (window.audioManager) {
            window.audioManager.updateSettings(newSettings);
        }
        if (this.game.particles) {
            this.game.particles.setLowGraphics(newSettings.lowGraphics);
        }

        this.modalSettings.classList.add('hidden');
    }

    renderLeaderboard() {
        const records = window.storageManager.getLeaderboard(this.currentLbFilter);
        this.leaderboardTbody.innerHTML = '';

        if (records.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align: center; color: #8899aa; padding: 20px;">Chưa có dữ liệu cho chế độ này</td>`;
            this.leaderboardTbody.appendChild(tr);
            return;
        }

        records.forEach((rec, idx) => {
            const rank = idx + 1;
            const rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
            const diffClass = (rec.difficulty || 'NORMAL').toLowerCase();

            const tr = document.createElement('tr');
            if (rank <= 3) tr.classList.add('top-rank');
            tr.innerHTML = `
                <td class="rank-col ${rankClass}">#${rank}</td>
                <td class="name-col">${this.escapeHtml(rec.name)}</td>
                <td class="score-col">${(rec.score || 0).toLocaleString()}</td>
                <td class="mode-col"><span class="badge ${diffClass}">${rec.difficulty}</span></td>
                <td class="time-col">${this.formatTime(rec.time || 0)}</td>
                <td class="combo-col">x${rec.combo || 1}</td>
            `;
            this.leaderboardTbody.appendChild(tr);
        });
    }

    // --- HUD UPDATES ---

    updateHud({ score, highScore, level, survivalTime, hasShield, combo, hasEMP, coins }) {
        this.hudScore.textContent = Math.floor(score).toLocaleString();
        this.hudHighScore.textContent = Math.floor(highScore).toLocaleString();
        this.hudLevel.textContent = `LEVEL ${level}`;
        this.hudTime.textContent = this.formatTime(survivalTime);

        // Run Coins counter
        if (typeof coins !== 'undefined' && this.hudCoinCount) {
            this.hudCoinCount.textContent = (coins || 0).toLocaleString();
        }

        // Blaster weapon level
        if (this.hudWeapon && this.game.player) {
            const wLvl = this.game.player.weaponLevel;
            const names = { 1: "⚡ TWIN BLASTER", 2: "⚡ TRIPLE SPREAD", 3: "⚡ PLASMA STORM" };
            this.hudWeapon.textContent = names[wLvl] || "⚡ BLASTER";
        }

        // Shield status
        if (hasShield) {
            this.hudShield.classList.remove('inactive');
            this.hudShield.classList.add('active');
            this.hudShield.textContent = "◈ SHIELD: ACTIVE";
        } else {
            this.hudShield.classList.remove('active');
            this.hudShield.classList.add('inactive');
            this.hudShield.textContent = "◈ SHIELD: OFFLINE";
        }

        // Combo badge
        if (combo > 1) {
            this.hudCombo.classList.remove('hidden');
            this.hudComboMultiplier.textContent = `x${combo}`;
        } else {
            this.hudCombo.classList.add('hidden');
        }

        // EMP button on mobile
        if (hasEMP) {
            this.btnEmp.classList.remove('hidden');
            const empBadge = document.getElementById('hud-emp-count');
            if (empBadge && this.game.player) {
                empBadge.textContent = this.game.player.empCharges || 1;
            }
        } else {
            this.btnEmp.classList.add('hidden');
        }
    }

    showBannerWarning(text, durationMs = 2000) {
        if (this.warningTimeout) clearTimeout(this.warningTimeout);
        this.hudWarningText.textContent = text;
        this.hudWarningBanner.classList.remove('hidden');
        this.hudWarningBanner.classList.add('pulse');

        this.warningTimeout = setTimeout(() => {
            this.hudWarningBanner.classList.add('hidden');
            this.hudWarningBanner.classList.remove('pulse');
        }, durationMs);
    }

    showToast(text, color = '#00e5ff', durationMs = 1800) {
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.hudToast.textContent = text;
        this.hudToast.style.borderColor = color;
        this.hudToast.style.color = color;
        this.hudToast.classList.remove('hidden');

        this.toastTimeout = setTimeout(() => {
            this.hudToast.classList.add('hidden');
        }, durationMs);
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[m]);
    }
}

window.UIManager = UIManager;
