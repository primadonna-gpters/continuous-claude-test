// Pixel Survivor Game
// Vampire Survivors style game with pixel art graphics

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const PIXEL_SIZE = 4;
const PLAYER_SIZE = 16;
const ENEMY_SIZE = 12;
const PROJECTILE_SIZE = 6;
const EXP_GEM_SIZE = 8;

// Game state
let gameState = 'start'; // start, playing, paused, levelup, gameover
let gameLoop = null;
let lastTime = 0;
let deltaTime = 0;

// Game stats
let gameTime = 0;
let kills = 0;
let bestTime = parseInt(localStorage.getItem('survivor-best-time')) || 0;

// Player
let player = {
    x: 0,
    y: 0,
    speed: 120,
    health: 100,
    maxHealth: 100,
    exp: 0,
    level: 1,
    expToNextLevel: 10,
    weapons: ['projectile'],
    projectileDamage: 10,
    projectileSpeed: 200,
    projectileCooldown: 0.5,
    projectileCount: 1,
    lastProjectileTime: 0
};

// Enemies
let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnInterval = 2;
let enemyBaseHealth = 20;
let enemyBaseDamage = 10;
let enemyBaseSpeed = 40;

// Projectiles
let projectiles = [];

// Experience gems
let expGems = [];

// Input
let keys = {};
let joystickVector = { x: 0, y: 0 };
let isMobile = false;

// Sound
let soundEnabled = localStorage.getItem('survivor-sound') !== 'false';
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Theme
const savedTheme = localStorage.getItem('game-hub-theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

// Upgrade options
const UPGRADES = [
    { id: 'damage', name: 'Attack Power', desc: '+20% projectile damage', apply: () => { player.projectileDamage *= 1.2; } },
    { id: 'speed', name: 'Move Speed', desc: '+15% movement speed', apply: () => { player.speed *= 1.15; } },
    { id: 'health', name: 'Max Health', desc: '+25 max health', apply: () => { player.maxHealth += 25; player.health = Math.min(player.health + 25, player.maxHealth); } },
    { id: 'firerate', name: 'Attack Speed', desc: '-15% attack cooldown', apply: () => { player.projectileCooldown *= 0.85; } },
    { id: 'projspeed', name: 'Projectile Speed', desc: '+25% projectile speed', apply: () => { player.projectileSpeed *= 1.25; } },
    { id: 'multishot', name: 'Multi Shot', desc: '+1 projectile', apply: () => { player.projectileCount += 1; } },
    { id: 'regen', name: 'Regeneration', desc: 'Heal 20 HP', apply: () => { player.health = Math.min(player.health + 20, player.maxHealth); } }
];

// Initialize game
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keyboard input
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Button listeners
    document.getElementById('new-game-btn').addEventListener('click', startNewGame);
    document.getElementById('retry-btn').addEventListener('click', startNewGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

    // Mobile joystick
    setupJoystick();

    // Touch to start
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick);

    updateSoundIcon();
    updateBestTimeDisplay();

    // Initial render
    render();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const size = container.clientWidth;
    canvas.width = size;
    canvas.height = size;
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') {
            startNewGame();
        } else if (gameState === 'playing') {
            togglePause();
        } else if (gameState === 'paused') {
            togglePause();
        }
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleCanvasClick(e) {
    e.preventDefault();
    if (gameState === 'start') {
        startNewGame();
    }
}

function setupJoystick() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickZone) return;

    let isJoystickActive = false;
    let joystickCenter = { x: 0, y: 0 };

    function getJoystickCenter() {
        const rect = joystickBase.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    function handleJoystickStart(e) {
        e.preventDefault();
        isMobile = true;
        isJoystickActive = true;
        joystickCenter = getJoystickCenter();
        handleJoystickMove(e);
    }

    function handleJoystickMove(e) {
        if (!isJoystickActive) return;
        e.preventDefault();

        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;

        const maxDist = 35;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
        const angle = Math.atan2(dy, dx);

        const stickX = Math.cos(angle) * dist;
        const stickY = Math.sin(angle) * dist;

        joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

        joystickVector.x = dist > 5 ? Math.cos(angle) : 0;
        joystickVector.y = dist > 5 ? Math.sin(angle) : 0;
    }

    function handleJoystickEnd(e) {
        e.preventDefault();
        isJoystickActive = false;
        joystickStick.style.transform = 'translate(0, 0)';
        joystickVector = { x: 0, y: 0 };
    }

    joystickZone.addEventListener('touchstart', handleJoystickStart);
    joystickZone.addEventListener('touchmove', handleJoystickMove);
    joystickZone.addEventListener('touchend', handleJoystickEnd);
    joystickZone.addEventListener('touchcancel', handleJoystickEnd);

    // Mouse support for testing
    joystickZone.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
}

function startNewGame() {
    // Reset player
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        speed: 120,
        health: 100,
        maxHealth: 100,
        exp: 0,
        level: 1,
        expToNextLevel: 10,
        weapons: ['projectile'],
        projectileDamage: 10,
        projectileSpeed: 200,
        projectileCooldown: 0.5,
        projectileCount: 1,
        lastProjectileTime: 0
    };

    // Reset game state
    enemies = [];
    projectiles = [];
    expGems = [];
    gameTime = 0;
    kills = 0;
    enemySpawnTimer = 0;
    enemySpawnInterval = 2;
    enemyBaseHealth = 20;
    enemyBaseDamage = 10;
    enemyBaseSpeed = 40;

    // Update UI
    document.getElementById('start-message').classList.add('hidden');
    document.getElementById('game-message').classList.add('hidden');
    document.getElementById('level-up-modal').classList.add('hidden');

    gameState = 'playing';
    lastTime = performance.now();

    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);

    playSound('start');
}

function update(currentTime) {
    if (gameState !== 'playing') {
        gameLoop = requestAnimationFrame(update);
        render();
        return;
    }

    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Cap delta time to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.1);

    gameTime += deltaTime;

    // Update game difficulty over time
    updateDifficulty();

    // Update player
    updatePlayer();

    // Spawn enemies
    spawnEnemies();

    // Update enemies
    updateEnemies();

    // Update projectiles
    updateProjectiles();

    // Update exp gems
    updateExpGems();

    // Check collisions
    checkCollisions();

    // Update UI
    updateUI();

    // Render
    render();

    gameLoop = requestAnimationFrame(update);
}

function updateDifficulty() {
    // Increase difficulty every 30 seconds
    const difficultyLevel = Math.floor(gameTime / 30);
    enemySpawnInterval = Math.max(0.5, 2 - difficultyLevel * 0.2);
    enemyBaseHealth = 20 + difficultyLevel * 5;
    enemyBaseDamage = 10 + difficultyLevel * 2;
    enemyBaseSpeed = 40 + difficultyLevel * 5;
}

function updatePlayer() {
    let dx = 0;
    let dy = 0;

    // Keyboard input
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Joystick input
    if (isMobile || (joystickVector.x !== 0 || joystickVector.y !== 0)) {
        dx = joystickVector.x;
        dy = joystickVector.y;
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
    }

    // Move player
    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;

    // Keep player in bounds
    const halfSize = PLAYER_SIZE / 2;
    player.x = Math.max(halfSize, Math.min(canvas.width - halfSize, player.x));
    player.y = Math.max(halfSize, Math.min(canvas.height - halfSize, player.y));

    // Auto-fire projectiles
    player.lastProjectileTime += deltaTime;
    if (player.lastProjectileTime >= player.projectileCooldown && enemies.length > 0) {
        fireProjectiles();
        player.lastProjectileTime = 0;
    }
}

function fireProjectiles() {
    // Find nearest enemies for each projectile
    const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = Math.hypot(a.x - player.x, a.y - player.y);
        const distB = Math.hypot(b.x - player.x, b.y - player.y);
        return distA - distB;
    });

    for (let i = 0; i < player.projectileCount; i++) {
        const targetEnemy = sortedEnemies[i % sortedEnemies.length];
        if (!targetEnemy) break;

        const angle = Math.atan2(targetEnemy.y - player.y, targetEnemy.x - player.x);

        // Add slight spread for multiple projectiles
        const spread = player.projectileCount > 1 ? (i - (player.projectileCount - 1) / 2) * 0.15 : 0;
        const finalAngle = angle + spread;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(finalAngle) * player.projectileSpeed,
            vy: Math.sin(finalAngle) * player.projectileSpeed,
            damage: player.projectileDamage
        });
    }

    playSound('shoot');
}

function spawnEnemies() {
    enemySpawnTimer += deltaTime;

    if (enemySpawnTimer >= enemySpawnInterval) {
        enemySpawnTimer = 0;

        // Spawn more enemies as time goes on
        const spawnCount = 1 + Math.floor(gameTime / 60);

        for (let i = 0; i < spawnCount; i++) {
            spawnEnemy();
        }
    }
}

function spawnEnemy() {
    // Spawn at edge of screen
    let x, y;
    const side = Math.floor(Math.random() * 4);
    const margin = 20;

    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -margin;
            break;
        case 1: // Right
            x = canvas.width + margin;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + margin;
            break;
        case 3: // Left
            x = -margin;
            y = Math.random() * canvas.height;
            break;
    }

    // Random enemy type
    const types = ['normal', 'fast', 'tank'];
    const type = types[Math.floor(Math.random() * types.length)];

    let enemy = {
        x,
        y,
        type,
        health: enemyBaseHealth,
        maxHealth: enemyBaseHealth,
        speed: enemyBaseSpeed,
        damage: enemyBaseDamage,
        expValue: 1
    };

    // Adjust stats based on type
    switch (type) {
        case 'fast':
            enemy.speed *= 1.5;
            enemy.health *= 0.6;
            enemy.maxHealth = enemy.health;
            break;
        case 'tank':
            enemy.speed *= 0.6;
            enemy.health *= 2;
            enemy.maxHealth = enemy.health;
            enemy.damage *= 1.5;
            enemy.expValue = 3;
            break;
    }

    enemies.push(enemy);
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed * deltaTime;
            enemy.y += (dy / dist) * enemy.speed * deltaTime;
        }
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Remove if off screen
        if (proj.x < -50 || proj.x > canvas.width + 50 ||
            proj.y < -50 || proj.y > canvas.height + 50) {
            projectiles.splice(i, 1);
        }
    }
}

function updateExpGems() {
    for (let i = expGems.length - 1; i >= 0; i--) {
        const gem = expGems[i];

        // Attract to player if close enough
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 80) {
            const attractSpeed = 200;
            gem.x += (dx / dist) * attractSpeed * deltaTime;
            gem.y += (dy / dist) * attractSpeed * deltaTime;
        }
    }
}

function checkCollisions() {
    // Projectiles vs Enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < (PROJECTILE_SIZE + ENEMY_SIZE) / 2) {
                // Damage enemy
                enemy.health -= proj.damage;
                projectiles.splice(i, 1);

                playSound('hit');

                if (enemy.health <= 0) {
                    // Drop exp gem
                    expGems.push({
                        x: enemy.x,
                        y: enemy.y,
                        value: enemy.expValue
                    });

                    enemies.splice(j, 1);
                    kills++;
                    playSound('kill');
                }
                break;
            }
        }
    }

    // Player vs Enemies
    for (const enemy of enemies) {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
            player.health -= enemy.damage * deltaTime;

            if (player.health <= 0) {
                gameOver();
                return;
            }
        }
    }

    // Player vs Exp Gems
    for (let i = expGems.length - 1; i >= 0; i--) {
        const gem = expGems[i];

        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
        if (dist < (PLAYER_SIZE + EXP_GEM_SIZE) / 2) {
            player.exp += gem.value;
            expGems.splice(i, 1);
            playSound('pickup');

            // Check level up
            if (player.exp >= player.expToNextLevel) {
                levelUp();
            }
        }
    }
}

function levelUp() {
    player.level++;
    player.exp -= player.expToNextLevel;
    player.expToNextLevel = Math.floor(player.expToNextLevel * 1.5);

    gameState = 'levelup';
    playSound('levelup');

    // Show upgrade options
    showUpgradeOptions();
}

function showUpgradeOptions() {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';

    // Get 3 random upgrades
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 3);

    options.forEach(upgrade => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-desc">${upgrade.desc}</div>
        `;
        btn.onclick = () => selectUpgrade(upgrade);
        optionsContainer.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function selectUpgrade(upgrade) {
    upgrade.apply();
    playSound('upgrade');

    document.getElementById('level-up-modal').classList.add('hidden');
    gameState = 'playing';
    lastTime = performance.now();
}

function gameOver() {
    gameState = 'gameover';

    // Check best time
    if (gameTime > bestTime) {
        bestTime = Math.floor(gameTime);
        localStorage.setItem('survivor-best-time', bestTime);
        updateBestTimeDisplay();
    }

    playSound('gameover');

    const messageDiv = document.getElementById('game-message');
    messageDiv.querySelector('h2').textContent = 'GAME OVER';
    messageDiv.querySelector('p').textContent = `Survived: ${formatTime(gameTime)} | Kills: ${kills}`;
    messageDiv.classList.remove('hidden');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pause-btn').textContent = '▶️';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        lastTime = performance.now();
        document.getElementById('pause-btn').textContent = '⏸️';
    }
}

function updateUI() {
    document.getElementById('time').textContent = formatTime(gameTime);
    document.getElementById('kills').textContent = kills;

    // Health bar
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;

    // Exp bar
    const expPercent = (player.exp / player.expToNextLevel) * 100;
    document.getElementById('exp-fill').style.width = expPercent + '%';
    document.getElementById('exp-text').textContent = `LV ${player.level}`;
}

function updateBestTimeDisplay() {
    document.getElementById('best-time').textContent = formatTime(bestTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Rendering
function render() {
    // Clear canvas
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#0a0a14' : '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') return;

    // Draw ground grid (pixel art style)
    drawPixelGrid();

    // Draw exp gems
    drawExpGems();

    // Draw projectiles
    drawProjectiles();

    // Draw enemies
    drawEnemies();

    // Draw player
    drawPlayer();
}

function drawPixelGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    const gridSize = 32;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPlayer() {
    const x = Math.floor(player.x);
    const y = Math.floor(player.y);
    const size = PLAYER_SIZE;
    const half = size / 2;

    // Pixel art player (hero character)
    ctx.imageSmoothingEnabled = false;

    // Body (blue tunic)
    ctx.fillStyle = '#4466aa';
    drawPixelRect(x - 4, y - 2, 8, 8);

    // Head (skin)
    ctx.fillStyle = '#ffcc99';
    drawPixelRect(x - 3, y - 8, 6, 6);

    // Hair (brown)
    ctx.fillStyle = '#664422';
    drawPixelRect(x - 3, y - 9, 6, 2);
    drawPixelRect(x - 4, y - 8, 2, 4);
    drawPixelRect(x + 2, y - 8, 2, 4);

    // Eyes
    ctx.fillStyle = '#000000';
    drawPixelRect(x - 2, y - 6, 2, 2);
    drawPixelRect(x + 1, y - 6, 2, 2);

    // Arms
    ctx.fillStyle = '#ffcc99';
    drawPixelRect(x - 6, y - 1, 2, 6);
    drawPixelRect(x + 4, y - 1, 2, 6);

    // Legs
    ctx.fillStyle = '#553322';
    drawPixelRect(x - 3, y + 6, 3, 4);
    drawPixelRect(x, y + 6, 3, 4);
}

function drawEnemies() {
    for (const enemy of enemies) {
        const x = Math.floor(enemy.x);
        const y = Math.floor(enemy.y);

        ctx.imageSmoothingEnabled = false;

        if (enemy.type === 'fast') {
            // Bat-like enemy (green)
            ctx.fillStyle = '#44aa44';
            drawPixelRect(x - 4, y - 2, 8, 4);
            // Wings
            ctx.fillStyle = '#338833';
            drawPixelRect(x - 8, y - 1, 4, 2);
            drawPixelRect(x + 4, y - 1, 4, 2);
            // Eyes
            ctx.fillStyle = '#ff0000';
            drawPixelRect(x - 2, y - 1, 2, 2);
            drawPixelRect(x + 1, y - 1, 2, 2);
        } else if (enemy.type === 'tank') {
            // Big skeleton (white/gray)
            ctx.fillStyle = '#cccccc';
            // Head
            drawPixelRect(x - 5, y - 8, 10, 8);
            // Body
            drawPixelRect(x - 4, y, 8, 8);
            // Eye sockets
            ctx.fillStyle = '#000000';
            drawPixelRect(x - 3, y - 6, 3, 3);
            drawPixelRect(x + 1, y - 6, 3, 3);
            // Ribs
            ctx.fillStyle = '#888888';
            drawPixelRect(x - 3, y + 1, 6, 1);
            drawPixelRect(x - 3, y + 3, 6, 1);
            drawPixelRect(x - 3, y + 5, 6, 1);
        } else {
            // Normal zombie (purple)
            ctx.fillStyle = '#8844aa';
            // Body
            drawPixelRect(x - 4, y - 2, 8, 8);
            // Head
            ctx.fillStyle = '#77aa77';
            drawPixelRect(x - 3, y - 7, 6, 5);
            // Eyes
            ctx.fillStyle = '#ff4444';
            drawPixelRect(x - 2, y - 5, 2, 2);
            drawPixelRect(x + 1, y - 5, 2, 2);
            // Arms
            ctx.fillStyle = '#77aa77';
            drawPixelRect(x - 6, y - 1, 2, 5);
            drawPixelRect(x + 4, y - 1, 2, 5);
        }

        // Health bar for enemies
        if (enemy.health < enemy.maxHealth) {
            const barWidth = 16;
            const barHeight = 3;
            ctx.fillStyle = '#440000';
            ctx.fillRect(x - barWidth / 2, y - 12, barWidth, barHeight);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x - barWidth / 2, y - 12, barWidth * (enemy.health / enemy.maxHealth), barHeight);
        }
    }
}

function drawProjectiles() {
    ctx.fillStyle = '#ffff44';
    for (const proj of projectiles) {
        const x = Math.floor(proj.x);
        const y = Math.floor(proj.y);

        // Pixel art projectile (yellow energy ball)
        drawPixelRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#ffffff';
        drawPixelRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = '#ffff44';
    }
}

function drawExpGems() {
    for (const gem of expGems) {
        const x = Math.floor(gem.x);
        const y = Math.floor(gem.y);

        // Pixel art gem (blue diamond)
        ctx.fillStyle = '#44aaff';
        drawPixelRect(x - 2, y - 4, 4, 2);
        drawPixelRect(x - 3, y - 2, 6, 2);
        drawPixelRect(x - 2, y, 4, 2);
        drawPixelRect(x - 1, y + 2, 2, 2);

        // Highlight
        ctx.fillStyle = '#88ccff';
        drawPixelRect(x - 1, y - 3, 2, 1);
    }
}

function drawPixelRect(x, y, width, height) {
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

// Sound effects using Web Audio API
function playSound(type) {
    if (!soundEnabled) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'start':
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'shoot':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'kill':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'pickup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.08);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.08);
                break;
            case 'levelup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'upgrade':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'gameover':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    } catch (e) {
        // Ignore audio errors
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('survivor-sound', soundEnabled);
    updateSoundIcon();
}

function updateSoundIcon() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundEnabled) {
        soundBtn.querySelector('.sound-on-icon').style.display = 'inline';
        soundBtn.querySelector('.sound-off-icon').style.display = 'none';
    } else {
        soundBtn.querySelector('.sound-on-icon').style.display = 'none';
        soundBtn.querySelector('.sound-off-icon').style.display = 'inline';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
}

// Initialize the game
init();
