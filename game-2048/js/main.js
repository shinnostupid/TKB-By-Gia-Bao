/**
 * 2048 INFINITE — Main Bootstrap Entry Point
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Systems
    const engine = new Infinite2048Engine(4);
    const sound = new Sound2048();

    // 2. Restore previous game or spawn new
    const hasSavedGame = Storage2048.loadGameState(engine);
    if (!hasSavedGame) {
        engine.startNewGame();
        Storage2048.saveGameState(engine);
    }

    // 3. Initialize UI
    const ui = new UI2048(engine, sound);
    window.gameEngine = engine;
    window.gameUI = ui;

    // 4. Initial Render
    ui.render();

    // 5. Audio Unlock on first interaction
    const unlockAudio = () => {
        sound.init();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });
});

// Exit helper to communicate with Study OS parent
function exitGameToStudyOS() {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'EXIT_GAME' }, '*');
    } else {
        window.location.href = '../#arcade';
    }
}
window.exitGameToStudyOS = exitGameToStudyOS;

// Ultimate Anti-F12 and DevTools Inspector Defense
(function() {
    window.addEventListener('contextmenu', e => e.preventDefault(), true);
    window.addEventListener('keydown', e => {
        if (
            e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
            (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) ||
            (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74))
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
})();
