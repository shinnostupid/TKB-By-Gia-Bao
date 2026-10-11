const assert = require('assert');
const Infinite2048Engine = require('../js/engine.js');

console.log('=== RUNNING RIGOROUS UNIT TESTS FOR 2048 INFINITE ===');

// Test 1: Basic Slide & Merge
{
    const engine = new Infinite2048Engine(4);
    engine.board = [
        [2n, 2n, 4n, 8n],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];
    engine.move('left');
    assert.strictEqual(engine.board[0][0], 4n, '2+2 should merge into 4n');
    assert.strictEqual(engine.board[0][1], 4n, '4n should slide left');
    assert.strictEqual(engine.board[0][2], 8n, '8n should slide left');
    console.log('✔ Test 1: Basic Slide & Merge passed');
}

// Test 2: No double merge in single turn
{
    const engine = new Infinite2048Engine(4);
    // [4, 4, 4, 4] moving left should become [8, 8, null, null], NOT [16, null, null, null]
    engine.board = [
        [4n, 4n, 4n, 4n],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];
    engine.move('left');
    assert.strictEqual(engine.board[0][0], 8n, 'First pair merges into 8n');
    assert.strictEqual(engine.board[0][1], 8n, 'Second pair merges into 8n');
    assert.notStrictEqual(engine.board[0][0], 16n, 'Must NOT double merge in 1 turn');
    console.log('✔ Test 2: Single merge per tile per turn passed');
}

// Test 3: Large BigInt past Number.MAX_SAFE_INTEGER (2^60, 2^100)
{
    const engine = new Infinite2048Engine(4);
    const hugeNumA = 2n ** 60n; // 1,152,921,504,606,846,976n > 9,007,199,254,740,991 (MAX_SAFE_INTEGER)
    const hugeNumB = 2n ** 60n;
    engine.board = [
        [hugeNumA, hugeNumB, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];
    const res = engine.move('left');
    assert.strictEqual(engine.board[0][0], 2n ** 61n, '2^60 + 2^60 must merge into 2^61 with exact precision');
    assert.strictEqual(Infinite2048Engine.getExponent(engine.board[0][0]), 61, 'Exponent must be exactly 61');
    assert.strictEqual(engine.score, 2n ** 61n, 'Score must reflect exact BigInt gain');
    console.log('✔ Test 3: Extreme BigInt precision (2^60 -> 2^61) passed');
}

// Test 4: Game Over Detection
{
    const engine = new Infinite2048Engine(4);
    engine.board = [
        [2n, 4n, 2n, 4n],
        [4n, 2n, 4n, 2n],
        [2n, 4n, 2n, 4n],
        [4n, 2n, 4n, 2n]
    ];
    assert.strictEqual(engine.checkGameOver(), true, 'Checkerboard with no pairs should be Game Over');
    // Modify one cell to create pair
    engine.board[0][0] = 4n;
    assert.strictEqual(engine.checkGameOver(), false, 'Adjacent equal cells should NOT be Game Over');
    console.log('✔ Test 4: Game Over detection passed');
}

// Test 5: Undo Mechanics
{
    const engine = new Infinite2048Engine(4);
    engine.board = [
        [2n, 2n, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];
    engine.score = 100n;
    engine.move('left');
    assert.strictEqual(engine.board[0][0], 4n);
    assert.strictEqual(engine.score, 104n);

    // Undo
    const undoSuccess = engine.undo();
    assert.strictEqual(undoSuccess, true);
    assert.strictEqual(engine.board[0][0], 2n, 'Board restored to before move');
    assert.strictEqual(engine.board[0][1], 2n, 'Board restored to before move');
    assert.strictEqual(engine.score, 100n, 'Score restored to before move');
    console.log('✔ Test 5: Undo mechanics passed');
}

console.log('=== ALL UNIT TESTS PASSED WITH 100% SUCCESS! ===');
