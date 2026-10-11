/**
 * Storage Manager for NEON DODGE
 * Manages player profile, local leaderboard (Top 100), settings, and anti-cheat validation.
 */
class StorageManager {
    constructor() {
        this.PILOT_KEY = 'neon_dodge_pilot';
        this.SETTINGS_KEY = 'neon_dodge_settings';
        this.LEADERBOARD_KEY = 'neon_dodge_leaderboard';
        this.COINS_KEY = 'neon_dodge_coins';
        this.UPGRADES_KEY = 'neon_dodge_upgrades';

        this.defaultSettings = {
            music: true,
            sfx: true,
            volume: 75,
            screenShake: true,
            lowGraphics: false,
            touchControl: 'drag' // 'drag' or 'buttons'
        };

        // Complete Catalog of Upgradable Perks
        this.perkCatalog = {
            magnet: {
                id: 'magnet',
                name: 'NAM CHÂM NĂNG LƯỢNG',
                subtitle: 'QUANTUM TRACTOR BEAM',
                image: 'assets/shop-magnet.png',
                maxLevel: 3,
                costs: [120, 280, 550], // Cost for Level 1, 2, 3
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

        this.initDefaults();
    }

    initDefaults() {
        // Starter coins for testing & onboarding
        if (localStorage.getItem(this.COINS_KEY) === null) {
            localStorage.setItem(this.COINS_KEY, '250'); // Starter 250 coins
        }

        // Default upgrades state: all level 0
        if (!localStorage.getItem(this.UPGRADES_KEY)) {
            const initialUpgrades = {
                magnet: 0,
                shield: 0,
                blaster: 0,
                warp: 0,
                emp: 0
            };
            localStorage.setItem(this.UPGRADES_KEY, JSON.stringify(initialUpgrades));
        }
        // Initialize leaderboard with high quality preset records if empty
        if (!localStorage.getItem(this.LEADERBOARD_KEY)) {
            const presetRecords = [
                { name: "Shadow", score: 98420, difficulty: "HARD", time: 242, combo: 12, date: "2026-09-28" },
                { name: "Shinno", score: 82130, difficulty: "HARD", time: 198, combo: 9, date: "2026-09-28" },
                { name: "Nova", score: 76500, difficulty: "NORMAL", time: 215, combo: 8, date: "2026-09-27" },
                { name: "Ghost", score: 62800, difficulty: "HARD", time: 164, combo: 7, date: "2026-09-27" },
                { name: "Alex", score: 51200, difficulty: "NORMAL", time: 180, combo: 6, date: "2026-09-26" },
                { name: "Valkyrie", score: 45300, difficulty: "HARD", time: 142, combo: 5, date: "2026-09-26" },
                { name: "CyberAce", score: 38900, difficulty: "NORMAL", time: 155, combo: 5, date: "2026-09-25" },
                { name: "Echo", score: 29400, difficulty: "EASY", time: 190, combo: 4, date: "2026-09-25" },
                { name: "Rookie01", score: 18200, difficulty: "EASY", time: 125, combo: 3, date: "2026-09-24" },
                { name: "Zenith", score: 14500, difficulty: "EASY", time: 110, combo: 2, date: "2026-09-23" }
            ];
            localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(presetRecords));
        }
    }

    // --- PILOT NAME ---
    getPilotName() {
        return localStorage.getItem(this.PILOT_KEY) || '';
    }

    setPilotName(name) {
        const cleanName = (name || '').trim().substring(0, 16);
        if (cleanName.length >= 3) {
            localStorage.setItem(this.PILOT_KEY, cleanName);
            return cleanName;
        }
        return false;
    }

    // --- SETTINGS ---
    getSettings() {
        try {
            const raw = localStorage.getItem(this.SETTINGS_KEY);
            return raw ? { ...this.defaultSettings, ...JSON.parse(raw) } : { ...this.defaultSettings };
        } catch (e) {
            return { ...this.defaultSettings };
        }
    }

    saveSettings(settings) {
        try {
            const current = this.getSettings();
            const merged = { ...current, ...settings };
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(merged));
            return merged;
        } catch (e) {
            console.error("Failed to save settings", e);
            return this.defaultSettings;
        }
    }

    // --- LEADERBOARD & ANTI-CHEAT ---
    getLeaderboard(filter = 'ALL') {
        try {
            const raw = localStorage.getItem(this.LEADERBOARD_KEY);
            const list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) return [];

            if (filter === 'ALL') {
                return list;
            }
            return list.filter(item => item.difficulty === filter);
        } catch (e) {
            console.error("Error loading leaderboard", e);
            return [];
        }
    }

    /**
     * Anti-cheat validation & saving to leaderboard
     * Validates that score is reasonable for survival time, difficulty, and combo.
     */
    addScore({ name, score, difficulty, time, combo }) {
        // Sanity checks
        const validDifficulties = ['EASY', 'NORMAL', 'HARD'];
        if (!validDifficulties.includes(difficulty)) return { success: false, reason: "Invalid difficulty" };
        if (typeof score !== 'number' || isNaN(score) || score <= 0) return { success: false, reason: "Invalid score" };
        if (typeof time !== 'number' || time < 1) return { success: false, reason: "Invalid survival time" };

        // Plausibility check: maximum theoretical score per second with max combo and energy pickups
        // Base rate ~ 50-100 pts/sec * max combo (e.g. 15) + powerups (~1500 pts max/sec).
        const maxPlausibleScore = (time * 2500 * (combo || 1)) + 50000;
        if (score > maxPlausibleScore) {
            console.warn("Anti-cheat: Unrealistic score rejected", { score, maxPlausibleScore, time });
            return { success: false, reason: "Score anomaly detected" };
        }

        const cleanName = (name || this.getPilotName() || 'Pilot').trim().substring(0, 16);
        const record = {
            name: cleanName || 'Pilot',
            score: Math.floor(score),
            difficulty,
            time: Math.floor(time),
            combo: Math.max(1, Math.floor(combo || 1)),
            date: new Date().toISOString().split('T')[0]
        };

        const allRecords = this.getLeaderboard('ALL');
        allRecords.push(record);

        // Sort descending by score
        allRecords.sort((a, b) => b.score - a.score);

        // Retain Top 100
        const top100 = allRecords.slice(0, 100);
        localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(top100));

        // Find rank of this new entry
        const rank = top100.findIndex(item => item === record) + 1;
        return { success: true, rank: rank > 0 ? rank : null, record };
    }

    getRank(score) {
        const list = this.getLeaderboard('ALL');
        const pos = list.findIndex(r => r.score <= score);
        if (pos === -1) return list.length + 1;
        return pos + 1;
    }

    // --- COIN CURRENCY & WALLET ---
    getCoins() {
        const val = parseInt(localStorage.getItem(this.COINS_KEY), 10);
        return isNaN(val) ? 0 : Math.max(0, val);
    }

    addCoins(amount) {
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return this.getCoins();
        const current = this.getCoins();
        const updated = Math.min(999999, current + Math.floor(amount));
        localStorage.setItem(this.COINS_KEY, updated.toString());
        return updated;
    }

    spendCoins(amount) {
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return false;
        const current = this.getCoins();
        if (current < amount) return false;
        const updated = current - Math.floor(amount);
        localStorage.setItem(this.COINS_KEY, updated.toString());
        return true;
    }

    // --- UPGRADES & HANGAR PERKS ---
    getUpgrades() {
        try {
            const raw = localStorage.getItem(this.UPGRADES_KEY);
            return raw ? JSON.parse(raw) : { magnet: 0, shield: 0, blaster: 0, warp: 0, emp: 0 };
        } catch (e) {
            return { magnet: 0, shield: 0, blaster: 0, warp: 0, emp: 0 };
        }
    }

    getPerkLevel(perkId) {
        const upgrades = this.getUpgrades();
        return upgrades[perkId] || 0;
    }

    getPerkCatalog() {
        return this.perkCatalog || StorageManager.PERK_CATALOG;
    }

    getHangarStats() {
        const upgrades = this.getUpgrades();
        const totalLevel = Object.values(upgrades).reduce((a, b) => a + (Number(b) || 0), 0);
        const maxLevel = 15; // 5 perks * 3 levels
        const powerPercent = Math.min(100, Math.round((totalLevel / maxLevel) * 100));
        return {
            totalLevel,
            maxLevel,
            powerPercent,
            upgrades
        };
    }

    getPerkUpgradeCost(perkId) {
        const catalog = this.getPerkCatalog();
        const perk = catalog ? catalog[perkId] : null;
        if (!perk) return null;
        const currentLevel = this.getPerkLevel(perkId);
        if (currentLevel >= perk.maxLevel) return null; // Already maxed
        return perk.costs[currentLevel];
    }

    upgradePerk(perkId) {
        const catalog = this.getPerkCatalog();
        const perk = catalog ? catalog[perkId] : null;
        if (!perk) return { success: false, reason: 'Perk not found' };

        const currentLevel = this.getPerkLevel(perkId);
        if (currentLevel >= perk.maxLevel) {
            return { success: false, reason: 'Đã đạt cấp tối đa (MAX)' };
        }

        const cost = perk.costs[currentLevel];
        if (!this.spendCoins(cost)) {
            return { success: false, reason: 'Không đủ xu để nâng cấp!' };
        }

        const upgrades = this.getUpgrades();
        upgrades[perkId] = currentLevel + 1;
        localStorage.setItem(this.UPGRADES_KEY, JSON.stringify(upgrades));

        return {
            success: true,
            newLevel: upgrades[perkId],
            cost,
            balance: this.getCoins()
        };
    }
}

// Attach static catalog reference
StorageManager.PERK_CATALOG = {
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

// Export singleton instance
window.StorageManager = StorageManager;
window.storageManager = new StorageManager();
