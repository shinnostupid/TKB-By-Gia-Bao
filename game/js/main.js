/**
 * Main Entry Point for NEON DODGE
 * Asset preloading, input handling, and initialization.
 */

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game;

    const ui = new UIManager(game);
    game.ui = ui;

    // Asset Preloading
    const assetList = [
        { id: 'player', src: 'assets/player.png' },
        { id: 'enemy-scout', src: 'assets/enemy-scout.png' },
        { id: 'enemy-fighter', src: 'assets/enemy-fighter.png' },
        { id: 'enemy-heavy', src: 'assets/enemy-heavy.png' },
        { id: 'enemy-elite', src: 'assets/enemy-elite.png' },
        { id: 'laser-beacon', src: 'assets/laser-beacon.png' },
        { id: 'asteroid-small', src: 'assets/asteroid-small.png' },
        { id: 'asteroid-medium', src: 'assets/asteroid-medium.png' },
        { id: 'asteroid-large', src: 'assets/asteroid-large.png' },
        { id: 'energy', src: 'assets/energy.png' },
        { id: 'shield', src: 'assets/shield.png' },
        { id: 'coin', src: 'assets/coin.png' },
        { id: 'coin-icon', src: 'assets/coin-icon.png' },
        { id: 'shop-magnet', src: 'assets/shop-magnet.png' },
        { id: 'shop-shield', src: 'assets/shop-shield.png' },
        { id: 'shop-blaster', src: 'assets/shop-blaster.png' },
        { id: 'shop-warp', src: 'assets/shop-warp.png' },
        { id: 'shop-emp', src: 'assets/shop-emp.png' }
    ];

    let loadedCount = 0;
    assetList.forEach(item => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            game.assets[item.id] = img;
            if (item.id === 'player') {
                game.player.setSprite(img);
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load asset: ${item.src}`);
            loadedCount++;
        };
        img.src = item.src;
    });

    // Audio Unlock for iOS Safari and Modern Browsers
    const unlockAudio = () => {
        if (window.audioManager) {
            window.audioManager.init();
            window.audioManager.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('touchend', unlockAudio, { passive: true });

    // Keyboard Input
    window.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                game.input.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                game.input.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                game.input.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                game.input.down = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'KeyQ':
                if (game.state === 'PLAYING') {
                    game.player.dash();
                }
                break;
            case 'KeyE':
                if (game.state === 'PLAYING') {
                    game.player.triggerEMP();
                }
                break;
            case 'Space':
            case 'KeyJ':
                game.input.shoot = true;
                break;
            case 'Escape':
            case 'KeyP':
                if (game.state === 'PLAYING') {
                    game.pause();
                } else if (game.state === 'PAUSED') {
                    game.resume();
                }
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                game.input.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                game.input.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                game.input.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                game.input.down = false;
                break;
            case 'Space':
            case 'KeyJ':
                game.input.shoot = false;
                break;
        }
    });

    // Left Mouse Click Shooting (Hold / Click to fire)
    window.addEventListener('mousedown', (e) => {
        if (e.button === 0 && game.state === 'PLAYING') {
            game.input.shoot = true;
        }
    });
    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            game.input.shoot = false;
        }
    });


    // Pointer & Native iOS Touch Drag Input for Canvas
    const canvas = document.getElementById('game-canvas');

    const handlePointerDown = (e) => {
        if (game.state !== 'PLAYING') return;
        const rect = canvas.getBoundingClientRect();
        game.input.pointerActive = true;
        // Set shoot flag on mobile touch
        game.input.shoot = true;
        game.input.pointerX = e.clientX - rect.left;
        game.input.pointerY = e.clientY - rect.top;
    };

    const handlePointerMove = (e) => {
        if (!game.input.pointerActive || game.state !== 'PLAYING') return;
        const rect = canvas.getBoundingClientRect();
        game.input.pointerX = e.clientX - rect.left;
        game.input.pointerY = e.clientY - rect.top;
    };

    const handlePointerUp = () => {
        game.input.pointerActive = false;
        game.input.pointerX = null;
        game.input.pointerY = null;
    };

    // Standard Pointer Events (Desktop & modern Mobile)
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // Native iOS Safari Touch Events (Ensures zero lag, prevents page scroll/bounce)
    canvas.addEventListener('touchstart', (e) => {
        if (game.state !== 'PLAYING') return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            game.input.pointerActive = true;
            game.input.pointerX = e.touches[0].clientX - rect.left;
            game.input.pointerY = e.touches[0].clientY - rect.top;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!game.input.pointerActive || game.state !== 'PLAYING') return;
        e.preventDefault(); // Kill iOS swipe bounce gesture during gameplay
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            game.input.pointerX = e.touches[0].clientX - rect.left;
            game.input.pointerY = e.touches[0].clientY - rect.top;
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (!e.touches || e.touches.length === 0) {
            handlePointerUp();
        }
    }, { passive: false });

    // Window Resize Handling
    window.addEventListener('resize', () => {
        game.setupCanvas();
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => game.setupCanvas(), 180);
    });

    // Start Screen
    ui.showMenuScreen();

    // Start Game Loop
    requestAnimationFrame((t) => game.loop(t));
});
