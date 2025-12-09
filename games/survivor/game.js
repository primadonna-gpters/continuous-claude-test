// Pixel Survivor Game
// Vampire Survivors style game with pixel art graphics

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const PIXEL_SIZE = 4;
const PLAYER_SIZE = 16;
const ENEMY_SIZE = 12;
const BOSS_SIZE = 24;
const PROJECTILE_SIZE = 6;
const EXP_GEM_SIZE = 8;
const MAX_ENEMIES = 300;
const MAX_WEAPON_SLOTS = 6;
const MAX_PASSIVE_SLOTS = 6;
const MAX_WEAPON_LEVEL = 8;
const BOSS_SPAWN_INTERVAL = 60; // Every 60 seconds
const REAPER_SPAWN_TIME = 1800; // 30 minutes in seconds

// Game state
let gameState = 'start'; // start, playing, paused, levelup, gameover, victory
let gameLoop = null;
let lastTime = 0;
let deltaTime = 0;

// Game stats
let gameTime = 0;
let kills = 0;
let bossKills = 0;
let bestTime = parseInt(localStorage.getItem('survivor-best-time')) || 0;

// ============================================
// WEAPON DEFINITIONS
// ============================================
const WEAPONS = {
    whip: {
        id: 'whip',
        name: 'Whip',
        desc: 'Attacks horizontally',
        icon: '🔥',
        baseDamage: 10,
        baseCooldown: 1.0,
        baseArea: 1.0,
        baseProjectiles: 1,
        evolution: 'bloodyTear',
        evolutionPassive: 'emptyTome'
    },
    knife: {
        id: 'knife',
        name: 'Knife',
        desc: 'Fires toward nearest enemy',
        icon: '🗡️',
        baseDamage: 8,
        baseCooldown: 0.5,
        baseSpeed: 300,
        baseProjectiles: 1,
        evolution: 'thousandEdge',
        evolutionPassive: 'bracer'
    },
    axe: {
        id: 'axe',
        name: 'Axe',
        desc: 'High damage with knockback',
        icon: '🪓',
        baseDamage: 20,
        baseCooldown: 1.2,
        baseSpeed: 200,
        baseProjectiles: 1,
        evolution: 'deathSpiral',
        evolutionPassive: 'candelabrador'
    },
    cross: {
        id: 'cross',
        name: 'Cross',
        desc: 'Boomerang that returns',
        icon: '✝️',
        baseDamage: 12,
        baseCooldown: 0.8,
        baseSpeed: 250,
        baseProjectiles: 1,
        evolution: 'heavenSword',
        evolutionPassive: 'clover'
    },
    holyWater: {
        id: 'holyWater',
        name: 'Holy Water',
        desc: 'Creates damaging pools',
        icon: '💧',
        baseDamage: 8,
        baseCooldown: 2.0,
        baseDuration: 3.0,
        baseProjectiles: 1,
        evolution: 'laBorra',
        evolutionPassive: 'attractorb'
    },
    garlic: {
        id: 'garlic',
        name: 'Garlic',
        desc: 'Damages nearby enemies',
        icon: '🧄',
        baseDamage: 5,
        baseCooldown: 0.5,
        baseArea: 40,
        evolution: 'soulEater',
        evolutionPassive: 'pummarola'
    },
    lightning: {
        id: 'lightning',
        name: 'Lightning Ring',
        desc: 'Random lightning strikes',
        icon: '⚡',
        baseDamage: 15,
        baseCooldown: 1.0,
        baseProjectiles: 1,
        evolution: 'thunderLoop',
        evolutionPassive: 'duplicator'
    },
    magic: {
        id: 'magic',
        name: 'Magic Wand',
        desc: 'Fires magic projectiles',
        icon: '✨',
        baseDamage: 10,
        baseCooldown: 0.3,
        baseSpeed: 350,
        baseProjectiles: 1,
        evolution: 'holyWand',
        evolutionPassive: 'emptyTome'
    }
};

// Evolved weapons
const EVOLVED_WEAPONS = {
    bloodyTear: { id: 'bloodyTear', name: 'Bloody Tear', desc: 'Whip with lifesteal', icon: '🩸', damageMulti: 2, lifesteal: 0.1 },
    thousandEdge: { id: 'thousandEdge', name: 'Thousand Edge', desc: 'Many fast knives', icon: '⚔️', damageMulti: 1.5, projectileMulti: 3 },
    deathSpiral: { id: 'deathSpiral', name: 'Death Spiral', desc: 'Orbiting axes', icon: '💀', damageMulti: 2.5, orbit: true },
    heavenSword: { id: 'heavenSword', name: 'Heaven Sword', desc: 'Multiple crosses', icon: '🗡️', damageMulti: 2, projectileMulti: 2 },
    laBorra: { id: 'laBorra', name: 'La Borra', desc: 'Larger pools', icon: '🌊', damageMulti: 2, areaMulti: 2 },
    soulEater: { id: 'soulEater', name: 'Soul Eater', desc: 'Drains enemy souls', icon: '👻', damageMulti: 2, lifesteal: 0.2 },
    thunderLoop: { id: 'thunderLoop', name: 'Thunder Loop', desc: 'Double lightning', icon: '🌩️', damageMulti: 2, projectileMulti: 2 },
    holyWand: { id: 'holyWand', name: 'Holy Wand', desc: 'Rapid magic', icon: '🌟', damageMulti: 1.8, cooldownMulti: 0.5 }
};

// ============================================
// PASSIVE ITEM DEFINITIONS
// ============================================
const PASSIVES = {
    spinach: { id: 'spinach', name: 'Spinach', desc: '+10% Damage', icon: '🥬', stat: 'damage', value: 0.1, maxLevel: 5 },
    armor: { id: 'armor', name: 'Armor', desc: '+1 Armor', icon: '🛡️', stat: 'armor', value: 1, maxLevel: 5 },
    wings: { id: 'wings', name: 'Wings', desc: '+10% Speed', icon: '🪽', stat: 'speed', value: 0.1, maxLevel: 5 },
    emptyTome: { id: 'emptyTome', name: 'Empty Tome', desc: '-8% Cooldown', icon: '📖', stat: 'cooldown', value: -0.08, maxLevel: 5 },
    bracer: { id: 'bracer', name: 'Bracer', desc: '+10% Projectile Speed', icon: '🔶', stat: 'projSpeed', value: 0.1, maxLevel: 5 },
    candelabrador: { id: 'candelabrador', name: 'Candelabrador', desc: '+10% Area', icon: '🕯️', stat: 'area', value: 0.1, maxLevel: 5 },
    clover: { id: 'clover', name: 'Clover', desc: '+10% Luck', icon: '🍀', stat: 'luck', value: 0.1, maxLevel: 5 },
    pummarola: { id: 'pummarola', name: 'Pummarola', desc: '+0.2 HP/s', icon: '🍅', stat: 'regen', value: 0.2, maxLevel: 5 },
    attractorb: { id: 'attractorb', name: 'Attractorb', desc: '+25% Pickup Range', icon: '🔮', stat: 'magnet', value: 0.25, maxLevel: 5 },
    duplicator: { id: 'duplicator', name: 'Duplicator', desc: '+1 Projectile', icon: '📋', stat: 'projectiles', value: 1, maxLevel: 2 },
    crown: { id: 'crown', name: 'Crown', desc: '+8% Growth', icon: '👑', stat: 'growth', value: 0.08, maxLevel: 5 },
    hollowHeart: { id: 'hollowHeart', name: 'Hollow Heart', desc: '+20% Max HP', icon: '❤️', stat: 'maxHealth', value: 0.2, maxLevel: 5 }
};

// ============================================
// PLAYER STATE
// ============================================
let player = {
    x: 0,
    y: 0,
    baseSpeed: 100,
    health: 100,
    maxHealth: 100,
    armor: 0,
    exp: 0,
    level: 1,
    expToNextLevel: 5,

    // Equipped items
    weapons: [], // Array of { id, level }
    passives: [], // Array of { id, level }

    // Derived stats (recalculated from passives)
    stats: {
        damage: 1.0,
        armor: 0,
        speed: 1.0,
        cooldown: 1.0,
        projSpeed: 1.0,
        area: 1.0,
        luck: 1.0,
        regen: 0,
        magnet: 1.0,
        projectiles: 0,
        growth: 1.0,
        maxHealth: 1.0
    },

    // Weapon timers
    weaponTimers: {}
};

// ============================================
// GAME ENTITIES
// ============================================
let enemies = [];
let projectiles = [];
let areaEffects = []; // For holy water, garlic, etc.
let expGems = [];
let treasureChests = [];

// Enemy spawn state
let enemySpawnTimer = 0;
let waveNumber = 0;
let lastWaveTime = 0;

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

// ============================================
// INITIALIZATION
// ============================================
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
        } else if (gameState === 'playing' || gameState === 'paused') {
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

// ============================================
// NEW GAME
// ============================================
function startNewGame() {
    // Reset player
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        baseSpeed: 100,
        health: 100,
        maxHealth: 100,
        armor: 0,
        exp: 0,
        level: 1,
        expToNextLevel: 5,
        weapons: [{ id: 'whip', level: 1, evolved: false }], // Start with whip
        passives: [],
        stats: {
            damage: 1.0,
            armor: 0,
            speed: 1.0,
            cooldown: 1.0,
            projSpeed: 1.0,
            area: 1.0,
            luck: 1.0,
            regen: 0,
            magnet: 1.0,
            projectiles: 0,
            growth: 1.0,
            maxHealth: 1.0
        },
        weaponTimers: {}
    };

    // Reset game state
    enemies = [];
    projectiles = [];
    areaEffects = [];
    expGems = [];
    treasureChests = [];
    gameTime = 0;
    kills = 0;
    bossKills = 0;
    enemySpawnTimer = 0;
    waveNumber = 0;
    lastWaveTime = 0;

    // Initialize weapon timers
    player.weapons.forEach(w => {
        player.weaponTimers[w.id] = 0;
    });

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

// ============================================
// STAT CALCULATION
// ============================================
function recalculateStats() {
    // Reset to base
    player.stats = {
        damage: 1.0,
        armor: 0,
        speed: 1.0,
        cooldown: 1.0,
        projSpeed: 1.0,
        area: 1.0,
        luck: 1.0,
        regen: 0,
        magnet: 1.0,
        projectiles: 0,
        growth: 1.0,
        maxHealth: 1.0
    };

    // Apply passive bonuses
    player.passives.forEach(passive => {
        const def = PASSIVES[passive.id];
        if (!def) return;

        const totalValue = def.value * passive.level;

        switch (def.stat) {
            case 'damage':
            case 'speed':
            case 'area':
            case 'luck':
            case 'magnet':
            case 'growth':
            case 'maxHealth':
            case 'projSpeed':
                player.stats[def.stat] += totalValue;
                break;
            case 'cooldown':
                player.stats.cooldown = Math.max(0.1, player.stats.cooldown + totalValue);
                break;
            case 'armor':
            case 'regen':
            case 'projectiles':
                player.stats[def.stat] += totalValue;
                break;
        }
    });

    // Update max health based on stats
    const newMaxHealth = 100 * player.stats.maxHealth;
    if (newMaxHealth > player.maxHealth) {
        player.health += newMaxHealth - player.maxHealth;
    }
    player.maxHealth = newMaxHealth;
}

// ============================================
// MAIN UPDATE LOOP
// ============================================
function update(currentTime) {
    if (gameState !== 'playing') {
        gameLoop = requestAnimationFrame(update);
        render();
        return;
    }

    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Cap delta time
    deltaTime = Math.min(deltaTime, 0.1);

    gameTime += deltaTime;

    // Regeneration
    if (player.stats.regen > 0) {
        player.health = Math.min(player.health + player.stats.regen * deltaTime, player.maxHealth);
    }

    // Update player
    updatePlayer();

    // Spawn enemies (wave system)
    updateEnemySpawns();

    // Update enemies
    updateEnemies();

    // Fire weapons
    updateWeapons();

    // Update projectiles
    updateProjectiles();

    // Update area effects
    updateAreaEffects();

    // Update exp gems
    updateExpGems();

    // Update treasure chests
    updateTreasureChests();

    // Check collisions
    checkCollisions();

    // Update UI
    updateUI();

    // Render
    render();

    gameLoop = requestAnimationFrame(update);
}

// ============================================
// PLAYER UPDATE
// ============================================
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
    const speed = player.baseSpeed * player.stats.speed;
    player.x += dx * speed * deltaTime;
    player.y += dy * speed * deltaTime;

    // Keep player in bounds
    const halfSize = PLAYER_SIZE / 2;
    player.x = Math.max(halfSize, Math.min(canvas.width - halfSize, player.x));
    player.y = Math.max(halfSize, Math.min(canvas.height - halfSize, player.y));
}

// ============================================
// ENEMY SPAWNING (WAVE SYSTEM)
// ============================================
function updateEnemySpawns() {
    // Wave spawns every minute
    const currentMinute = Math.floor(gameTime / 60);

    if (currentMinute > waveNumber && enemies.length < MAX_ENEMIES) {
        waveNumber = currentMinute;
        spawnWave(waveNumber);
    }

    // Continuous enemy spawn
    enemySpawnTimer += deltaTime;
    const spawnInterval = Math.max(0.3, 2 - gameTime / 120); // Gets faster over time

    if (enemySpawnTimer >= spawnInterval && enemies.length < MAX_ENEMIES) {
        enemySpawnTimer = 0;
        const spawnCount = 1 + Math.floor(gameTime / 60);
        for (let i = 0; i < spawnCount; i++) {
            spawnEnemy();
        }
    }

    // Boss spawn every minute after first minute
    if (gameTime >= BOSS_SPAWN_INTERVAL &&
        Math.floor(gameTime / BOSS_SPAWN_INTERVAL) > Math.floor((gameTime - deltaTime) / BOSS_SPAWN_INTERVAL)) {
        spawnBoss();
    }

    // Reaper spawn at 30 minutes
    if (gameTime >= REAPER_SPAWN_TIME &&
        gameTime - deltaTime < REAPER_SPAWN_TIME) {
        spawnReaper();
    }
}

function spawnWave(waveNum) {
    // Larger enemy group at wave start
    const enemyCount = 10 + waveNum * 5;
    for (let i = 0; i < enemyCount; i++) {
        spawnEnemy();
    }
    playSound('wave');
}

function spawnEnemy() {
    // Spawn at edge of screen
    let x, y;
    const side = Math.floor(Math.random() * 4);
    const margin = 30;

    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -margin; break;
        case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + margin; break;
        case 3: x = -margin; y = Math.random() * canvas.height; break;
    }

    // Enemy types based on time
    const types = ['zombie', 'bat', 'skeleton'];
    if (gameTime > 120) types.push('ghost');
    if (gameTime > 300) types.push('demon');

    const type = types[Math.floor(Math.random() * types.length)];

    // Base stats scale with time
    const timeMultiplier = 1 + gameTime / 120;
    const baseHealth = 20 * timeMultiplier;
    const baseSpeed = 30 + Math.min(gameTime / 10, 50);
    const baseDamage = 8 * timeMultiplier;

    const enemy = {
        x, y,
        type,
        isBoss: false,
        isReaper: false,
        health: baseHealth,
        maxHealth: baseHealth,
        speed: baseSpeed,
        damage: baseDamage,
        expValue: 1
    };

    // Adjust stats by type
    switch (type) {
        case 'bat':
            enemy.speed *= 1.8;
            enemy.health *= 0.5;
            break;
        case 'skeleton':
            enemy.speed *= 0.7;
            enemy.health *= 2;
            enemy.damage *= 1.5;
            enemy.expValue = 2;
            break;
        case 'ghost':
            enemy.speed *= 1.2;
            enemy.health *= 0.8;
            enemy.expValue = 2;
            break;
        case 'demon':
            enemy.speed *= 0.9;
            enemy.health *= 2.5;
            enemy.damage *= 2;
            enemy.expValue = 3;
            break;
    }

    enemies.push(enemy);
}

function spawnBoss() {
    // Spawn at random edge
    let x, y;
    const side = Math.floor(Math.random() * 4);
    const margin = 50;

    switch (side) {
        case 0: x = canvas.width / 2; y = -margin; break;
        case 1: x = canvas.width + margin; y = canvas.height / 2; break;
        case 2: x = canvas.width / 2; y = canvas.height + margin; break;
        case 3: x = -margin; y = canvas.height / 2; break;
    }

    const bossTypes = ['giant', 'werewolf', 'vampire'];
    const type = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    const timeMultiplier = 1 + gameTime / 120;

    const boss = {
        x, y,
        type,
        isBoss: true,
        isReaper: false,
        health: 500 * timeMultiplier,
        maxHealth: 500 * timeMultiplier,
        speed: 25,
        damage: 30 * timeMultiplier,
        expValue: 20,
        dropsChest: true
    };

    enemies.push(boss);
    playSound('boss');
}

function spawnReaper() {
    const reaper = {
        x: canvas.width / 2,
        y: -50,
        type: 'reaper',
        isBoss: true,
        isReaper: true,
        health: 99999,
        maxHealth: 99999,
        speed: 60,
        damage: 999,
        expValue: 100,
        dropsChest: false
    };

    enemies.push(reaper);
    playSound('reaper');
}

// ============================================
// ENEMY UPDATE
// ============================================
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

        // Despawn far enemies (except bosses)
        if (!enemy.isBoss) {
            const despawnDist = canvas.width * 2;
            if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > despawnDist) {
                enemies.splice(i, 1);
            }
        }
    }
}

// ============================================
// WEAPON SYSTEM
// ============================================
function updateWeapons() {
    player.weapons.forEach(weapon => {
        if (!player.weaponTimers[weapon.id]) {
            player.weaponTimers[weapon.id] = 0;
        }

        player.weaponTimers[weapon.id] += deltaTime;

        const weaponDef = WEAPONS[weapon.id];
        if (!weaponDef) return;

        let cooldown = weaponDef.baseCooldown * player.stats.cooldown;

        // Check if evolved
        if (weapon.evolved && EVOLVED_WEAPONS[weaponDef.evolution]) {
            const evolvedDef = EVOLVED_WEAPONS[weaponDef.evolution];
            if (evolvedDef.cooldownMulti) {
                cooldown *= evolvedDef.cooldownMulti;
            }
        }

        if (player.weaponTimers[weapon.id] >= cooldown && enemies.length > 0) {
            player.weaponTimers[weapon.id] = 0;
            fireWeapon(weapon);
        }
    });
}

function fireWeapon(weapon) {
    const weaponDef = WEAPONS[weapon.id];
    if (!weaponDef) return;

    const evolved = weapon.evolved;
    const evolvedDef = evolved ? EVOLVED_WEAPONS[weaponDef.evolution] : null;

    // Calculate damage
    let damage = weaponDef.baseDamage * player.stats.damage;
    damage *= 1 + (weapon.level - 1) * 0.2; // +20% per level
    if (evolvedDef?.damageMulti) damage *= evolvedDef.damageMulti;

    // Calculate projectile count
    let projCount = weaponDef.baseProjectiles || 1;
    projCount += Math.floor((weapon.level - 1) / 2); // +1 every 2 levels
    projCount += Math.floor(player.stats.projectiles);
    if (evolvedDef?.projectileMulti) projCount *= evolvedDef.projectileMulti;

    // Sort enemies by distance
    const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = Math.hypot(a.x - player.x, a.y - player.y);
        const distB = Math.hypot(b.x - player.x, b.y - player.y);
        return distA - distB;
    });

    switch (weapon.id) {
        case 'whip':
            fireWhip(damage, weapon.level, evolved);
            break;
        case 'knife':
            fireKnife(damage, projCount, evolved);
            break;
        case 'axe':
            fireAxe(damage, projCount, evolved);
            break;
        case 'cross':
            fireCross(damage, projCount, evolved);
            break;
        case 'holyWater':
            fireHolyWater(damage, weapon.level, evolved);
            break;
        case 'garlic':
            fireGarlic(damage, weapon.level, evolved);
            break;
        case 'lightning':
            fireLightning(damage, projCount, evolved);
            break;
        case 'magic':
            fireMagic(damage, projCount, evolved);
            break;
    }

    playSound('shoot');
}

function fireWhip(damage, level, evolved) {
    // Horizontal slash
    const width = 80 + level * 20;
    const height = 20;

    areaEffects.push({
        type: 'whip',
        x: player.x,
        y: player.y,
        width: width * player.stats.area,
        height: height,
        damage,
        duration: 0.2,
        timer: 0,
        lifesteal: evolved ? 0.1 : 0,
        hitEnemies: new Set()
    });
}

function fireKnife(damage, count, evolved) {
    const sortedEnemies = [...enemies].sort((a, b) =>
        Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
    );

    for (let i = 0; i < count; i++) {
        const target = sortedEnemies[i % sortedEnemies.length];
        if (!target) break;

        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const speed = 350 * player.stats.projSpeed;

        projectiles.push({
            type: 'knife',
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            pierce: evolved ? 3 : 1,
            lifetime: 2
        });
    }
}

function fireAxe(damage, count, evolved) {
    for (let i = 0; i < count; i++) {
        const baseAngle = -Math.PI / 2; // Up
        const spread = (i - (count - 1) / 2) * 0.3;
        const angle = baseAngle + spread;

        if (evolved) {
            // Orbiting axes
            projectiles.push({
                type: 'axe',
                x: player.x,
                y: player.y,
                orbitAngle: (Math.PI * 2 * i) / count,
                orbitRadius: 60,
                orbitSpeed: 3,
                damage,
                pierce: 999,
                lifetime: 3,
                orbiting: true
            });
        } else {
            projectiles.push({
                type: 'axe',
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 200 * player.stats.projSpeed,
                vy: Math.sin(angle) * 200 * player.stats.projSpeed,
                gravity: 200,
                damage,
                pierce: 2,
                lifetime: 3
            });
        }
    }
}

function fireCross(damage, count, evolved) {
    const sortedEnemies = [...enemies].sort((a, b) =>
        Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
    );

    for (let i = 0; i < count; i++) {
        const target = sortedEnemies[i % sortedEnemies.length];
        if (!target) break;

        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const speed = 300 * player.stats.projSpeed;

        projectiles.push({
            type: 'cross',
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            pierce: 999,
            lifetime: 1.5,
            returning: false,
            returnTimer: 0.75
        });
    }
}

function fireHolyWater(damage, level, evolved) {
    // Random position near enemies
    if (enemies.length === 0) return;

    const target = enemies[Math.floor(Math.random() * Math.min(5, enemies.length))];

    areaEffects.push({
        type: 'holyWater',
        x: target.x,
        y: target.y,
        radius: (30 + level * 5) * player.stats.area * (evolved ? 2 : 1),
        damage: damage * 0.5, // DPS
        duration: 3 + level * 0.5,
        timer: 0,
        damageTimer: 0
    });
}

function fireGarlic(damage, level, evolved) {
    areaEffects.push({
        type: 'garlic',
        x: player.x,
        y: player.y,
        radius: (40 + level * 10) * player.stats.area,
        damage,
        duration: 0.5,
        timer: 0,
        lifesteal: evolved ? 0.2 : 0,
        hitEnemies: new Set()
    });
}

function fireLightning(damage, count, evolved) {
    for (let i = 0; i < count; i++) {
        if (enemies.length === 0) break;

        const target = enemies[Math.floor(Math.random() * enemies.length)];

        areaEffects.push({
            type: 'lightning',
            x: target.x,
            y: target.y,
            radius: 30 * player.stats.area,
            damage,
            duration: 0.3,
            timer: 0,
            hitEnemies: new Set()
        });
    }
}

function fireMagic(damage, count, evolved) {
    const sortedEnemies = [...enemies].sort((a, b) =>
        Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
    );

    for (let i = 0; i < count; i++) {
        const target = sortedEnemies[i % sortedEnemies.length];
        if (!target) break;

        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const speed = (350 + (evolved ? 100 : 0)) * player.stats.projSpeed;

        projectiles.push({
            type: 'magic',
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            pierce: evolved ? 2 : 1,
            lifetime: 2
        });
    }
}

// ============================================
// PROJECTILE UPDATE
// ============================================
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        proj.lifetime -= deltaTime;
        if (proj.lifetime <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        if (proj.orbiting) {
            // Orbiting projectiles (like evolved axe)
            proj.orbitAngle += proj.orbitSpeed * deltaTime;
            proj.x = player.x + Math.cos(proj.orbitAngle) * proj.orbitRadius;
            proj.y = player.y + Math.sin(proj.orbitAngle) * proj.orbitRadius;
        } else {
            // Normal movement
            proj.x += proj.vx * deltaTime;
            proj.y += proj.vy * deltaTime;

            // Gravity (for axes)
            if (proj.gravity) {
                proj.vy += proj.gravity * deltaTime;
            }

            // Cross returning
            if (proj.type === 'cross') {
                proj.returnTimer -= deltaTime;
                if (proj.returnTimer <= 0 && !proj.returning) {
                    proj.returning = true;
                    // Reverse direction toward player
                    const angle = Math.atan2(player.y - proj.y, player.x - proj.x);
                    const speed = 350 * player.stats.projSpeed;
                    proj.vx = Math.cos(angle) * speed;
                    proj.vy = Math.sin(angle) * speed;
                }
            }
        }

        // Remove if way off screen
        if (Math.abs(proj.x - player.x) > canvas.width ||
            Math.abs(proj.y - player.y) > canvas.height) {
            projectiles.splice(i, 1);
        }
    }
}

// ============================================
// AREA EFFECTS UPDATE
// ============================================
function updateAreaEffects() {
    for (let i = areaEffects.length - 1; i >= 0; i--) {
        const effect = areaEffects[i];

        effect.timer += deltaTime;
        if (effect.timer >= effect.duration) {
            areaEffects.splice(i, 1);
            continue;
        }

        // Garlic follows player
        if (effect.type === 'garlic') {
            effect.x = player.x;
            effect.y = player.y;
        }

        // Holy water damage tick
        if (effect.type === 'holyWater') {
            effect.damageTimer += deltaTime;
            if (effect.damageTimer >= 0.25) { // Tick every 0.25s
                effect.damageTimer = 0;
                // Damage enemies in area
                enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - effect.x, enemy.y - effect.y);
                    if (dist < effect.radius) {
                        enemy.health -= effect.damage;
                    }
                });
            }
        }
    }
}

// ============================================
// EXP GEMS UPDATE
// ============================================
function updateExpGems() {
    const magnetRange = 80 * player.stats.magnet;

    for (let i = expGems.length - 1; i >= 0; i--) {
        const gem = expGems[i];

        // Attract to player
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.hypot(dx, dy);

        if (dist < magnetRange) {
            const attractSpeed = 300;
            gem.x += (dx / dist) * attractSpeed * deltaTime;
            gem.y += (dy / dist) * attractSpeed * deltaTime;
        }
    }
}

// ============================================
// TREASURE CHESTS
// ============================================
function updateTreasureChests() {
    // Chests slowly move toward player
    for (const chest of treasureChests) {
        const dx = player.x - chest.x;
        const dy = player.y - chest.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 50) {
            chest.x += (dx / dist) * 30 * deltaTime;
            chest.y += (dy / dist) * 30 * deltaTime;
        }
    }
}

// ============================================
// COLLISION DETECTION
// ============================================
function checkCollisions() {
    // Projectiles vs Enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            const hitDist = (PROJECTILE_SIZE + (enemy.isBoss ? BOSS_SIZE : ENEMY_SIZE)) / 2;

            if (dist < hitDist) {
                // Damage enemy
                enemy.health -= proj.damage;
                playSound('hit');

                proj.pierce--;
                if (proj.pierce <= 0) {
                    projectiles.splice(i, 1);
                }

                if (enemy.health <= 0) {
                    killEnemy(enemy, j);
                }
                break;
            }
        }
    }

    // Area effects vs Enemies
    for (const effect of areaEffects) {
        if (effect.type === 'holyWater') continue; // Handled separately

        enemies.forEach((enemy, idx) => {
            let hit = false;

            if (effect.type === 'whip') {
                // Rectangle collision
                const halfW = effect.width / 2;
                const halfH = effect.height / 2;
                hit = enemy.x > effect.x - halfW && enemy.x < effect.x + halfW &&
                      enemy.y > effect.y - halfH && enemy.y < effect.y + halfH;
            } else {
                // Circle collision
                const dist = Math.hypot(enemy.x - effect.x, enemy.y - effect.y);
                hit = dist < effect.radius;
            }

            if (hit && !effect.hitEnemies?.has(idx)) {
                effect.hitEnemies?.add(idx);
                enemy.health -= effect.damage;

                // Lifesteal
                if (effect.lifesteal) {
                    player.health = Math.min(player.health + effect.damage * effect.lifesteal, player.maxHealth);
                }

                playSound('hit');

                if (enemy.health <= 0) {
                    killEnemy(enemy, idx);
                }
            }
        });
    }

    // Player vs Enemies
    for (const enemy of enemies) {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const hitDist = (PLAYER_SIZE + (enemy.isBoss ? BOSS_SIZE : ENEMY_SIZE)) / 2;

        if (dist < hitDist) {
            const damage = Math.max(1, enemy.damage * deltaTime - player.stats.armor);
            player.health -= damage;

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
            const expGain = gem.value * player.stats.growth;
            player.exp += expGain;
            expGems.splice(i, 1);
            playSound('pickup');

            // Check level up
            while (player.exp >= player.expToNextLevel) {
                levelUp();
            }
        }
    }

    // Player vs Treasure Chests
    for (let i = treasureChests.length - 1; i >= 0; i--) {
        const chest = treasureChests[i];

        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (dist < 30) {
            openChest(chest);
            treasureChests.splice(i, 1);
        }
    }
}

function killEnemy(enemy, index) {
    // Drop exp gem
    const gemValue = enemy.expValue;
    expGems.push({
        x: enemy.x,
        y: enemy.y,
        value: gemValue,
        size: gemValue > 5 ? 'large' : gemValue > 2 ? 'medium' : 'small'
    });

    // Drop treasure chest from bosses
    if (enemy.dropsChest && gameTime >= 600) { // After 10 minutes
        treasureChests.push({
            x: enemy.x,
            y: enemy.y,
            tier: enemy.isReaper ? 'legendary' : 'boss'
        });
    }

    enemies.splice(index, 1);
    kills++;
    if (enemy.isBoss) bossKills++;
    playSound('kill');

    // Victory condition: kill the Reaper
    if (enemy.isReaper) {
        victory();
    }
}

function openChest(chest) {
    playSound('chest');

    // Try to evolve a weapon
    let evolved = false;
    for (const weapon of player.weapons) {
        if (weapon.evolved) continue;
        if (weapon.level < MAX_WEAPON_LEVEL) continue;

        const weaponDef = WEAPONS[weapon.id];
        if (!weaponDef?.evolution) continue;

        // Check if player has required passive
        const hasPassive = player.passives.some(p => p.id === weaponDef.evolutionPassive);
        if (hasPassive) {
            weapon.evolved = true;
            evolved = true;
            playSound('evolve');
            break;
        }
    }

    if (!evolved) {
        // Give bonus exp and gold instead
        player.exp += 20;
        playSound('pickup');
    }
}

// ============================================
// LEVEL UP SYSTEM
// ============================================
function levelUp() {
    player.level++;
    player.exp -= player.expToNextLevel;
    player.expToNextLevel = Math.floor(5 + player.level * 3);

    gameState = 'levelup';
    playSound('levelup');

    showUpgradeOptions();
}

function showUpgradeOptions() {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';

    const options = getUpgradeOptions();

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';

        const levelText = option.currentLevel > 0
            ? `LV ${option.currentLevel} → ${option.currentLevel + 1}`
            : 'NEW';
        const isEvolved = option.type === 'weapon' && option.evolved;

        btn.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-icon">${option.icon}</span>
                <span class="upgrade-name ${isEvolved ? 'evolved' : ''}">${option.name}</span>
                <span class="upgrade-level">${levelText}</span>
            </div>
            <div class="upgrade-desc">${option.desc}</div>
        `;
        btn.onclick = () => selectUpgrade(option);
        optionsContainer.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function getUpgradeOptions() {
    const options = [];

    // Available weapons
    const unlockedWeaponIds = player.weapons.map(w => w.id);
    const availableWeapons = Object.keys(WEAPONS).filter(id => !unlockedWeaponIds.includes(id));

    // Upgradable weapons (not max level)
    const upgradableWeapons = player.weapons.filter(w => w.level < MAX_WEAPON_LEVEL);

    // Available passives
    const unlockedPassiveIds = player.passives.map(p => p.id);
    const availablePassives = Object.keys(PASSIVES).filter(id => !unlockedPassiveIds.includes(id));

    // Upgradable passives
    const upgradablePassives = player.passives.filter(p => p.level < PASSIVES[p.id].maxLevel);

    // Add weapon options
    if (player.weapons.length < MAX_WEAPON_SLOTS && availableWeapons.length > 0) {
        const shuffled = [...availableWeapons].sort(() => Math.random() - 0.5);
        shuffled.slice(0, 2).forEach(id => {
            const def = WEAPONS[id];
            options.push({
                type: 'weapon',
                id,
                name: def.name,
                desc: def.desc,
                icon: def.icon,
                currentLevel: 0
            });
        });
    }

    // Add upgradable weapon options
    upgradableWeapons.forEach(weapon => {
        const def = WEAPONS[weapon.id];
        let name = def.name;
        let icon = def.icon;

        // Check if can evolve on this upgrade
        if (weapon.level === MAX_WEAPON_LEVEL - 1 && def.evolution) {
            const hasPassive = player.passives.some(p => p.id === def.evolutionPassive);
            if (hasPassive) {
                const evolved = EVOLVED_WEAPONS[def.evolution];
                name = `${name} → ${evolved.name}`;
            }
        }

        if (weapon.evolved) {
            const evolved = EVOLVED_WEAPONS[def.evolution];
            name = evolved.name;
            icon = evolved.icon;
        }

        options.push({
            type: 'weapon',
            id: weapon.id,
            name,
            desc: `+20% damage`,
            icon,
            currentLevel: weapon.level,
            evolved: weapon.evolved
        });
    });

    // Add passive options
    if (player.passives.length < MAX_PASSIVE_SLOTS && availablePassives.length > 0) {
        const shuffled = [...availablePassives].sort(() => Math.random() - 0.5);
        shuffled.slice(0, 2).forEach(id => {
            const def = PASSIVES[id];
            options.push({
                type: 'passive',
                id,
                name: def.name,
                desc: def.desc,
                icon: def.icon,
                currentLevel: 0
            });
        });
    }

    // Add upgradable passive options
    upgradablePassives.forEach(passive => {
        const def = PASSIVES[passive.id];
        options.push({
            type: 'passive',
            id: passive.id,
            name: def.name,
            desc: def.desc,
            icon: def.icon,
            currentLevel: passive.level
        });
    });

    // Shuffle and limit to 4 options
    return options.sort(() => Math.random() - 0.5).slice(0, 4);
}

function selectUpgrade(option) {
    if (option.type === 'weapon') {
        const existing = player.weapons.find(w => w.id === option.id);
        if (existing) {
            existing.level++;

            // Check for evolution
            const def = WEAPONS[option.id];
            if (existing.level >= MAX_WEAPON_LEVEL && def.evolution && !existing.evolved) {
                const hasPassive = player.passives.some(p => p.id === def.evolutionPassive);
                if (hasPassive) {
                    existing.evolved = true;
                    playSound('evolve');
                }
            }
        } else {
            player.weapons.push({ id: option.id, level: 1, evolved: false });
            player.weaponTimers[option.id] = 0;
        }
    } else {
        const existing = player.passives.find(p => p.id === option.id);
        if (existing) {
            existing.level++;
        } else {
            player.passives.push({ id: option.id, level: 1 });
        }
        recalculateStats();
    }

    playSound('upgrade');

    document.getElementById('level-up-modal').classList.add('hidden');
    gameState = 'playing';
    lastTime = performance.now();
}

// ============================================
// GAME OVER / VICTORY
// ============================================
function gameOver() {
    gameState = 'gameover';

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

function victory() {
    gameState = 'victory';

    if (gameTime > bestTime) {
        bestTime = Math.floor(gameTime);
        localStorage.setItem('survivor-best-time', bestTime);
        updateBestTimeDisplay();
    }

    playSound('victory');

    const messageDiv = document.getElementById('game-message');
    messageDiv.querySelector('h2').textContent = 'VICTORY!';
    messageDiv.querySelector('h2').style.color = '#ffd700';
    messageDiv.querySelector('p').textContent = `You defeated the Reaper! Time: ${formatTime(gameTime)} | Kills: ${kills}`;
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

// ============================================
// UI UPDATE
// ============================================
function updateUI() {
    document.getElementById('time').textContent = formatTime(gameTime);
    document.getElementById('kills').textContent = kills;

    // Health bar
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = `${Math.ceil(player.health)}/${Math.ceil(player.maxHealth)}`;

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

// ============================================
// RENDERING
// ============================================
function render() {
    // Clear canvas
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#0a0a14' : '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') return;

    // Draw ground grid
    drawPixelGrid();

    // Draw area effects
    drawAreaEffects();

    // Draw treasure chests
    drawTreasureChests();

    // Draw exp gems
    drawExpGems();

    // Draw projectiles
    drawProjectiles();

    // Draw enemies
    drawEnemies();

    // Draw player
    drawPlayer();

    // Draw weapon inventory
    drawWeaponInventory();
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

        if (enemy.isReaper) {
            // Reaper (Death)
            ctx.fillStyle = '#111111';
            drawPixelRect(x - 10, y - 12, 20, 24);
            // Hood
            ctx.fillStyle = '#222222';
            drawPixelRect(x - 8, y - 16, 16, 8);
            // Eyes
            ctx.fillStyle = '#ff0000';
            drawPixelRect(x - 5, y - 10, 4, 4);
            drawPixelRect(x + 1, y - 10, 4, 4);
            // Scythe
            ctx.fillStyle = '#888888';
            drawPixelRect(x + 12, y - 20, 3, 30);
            ctx.fillStyle = '#cccccc';
            drawPixelRect(x + 8, y - 22, 10, 4);
        } else if (enemy.isBoss) {
            // Boss enemies (larger)
            if (enemy.type === 'giant') {
                ctx.fillStyle = '#8b4513';
                drawPixelRect(x - 12, y - 10, 24, 20);
                ctx.fillStyle = '#654321';
                drawPixelRect(x - 10, y - 18, 20, 10);
                ctx.fillStyle = '#ff0000';
                drawPixelRect(x - 6, y - 14, 5, 4);
                drawPixelRect(x + 2, y - 14, 5, 4);
            } else if (enemy.type === 'werewolf') {
                ctx.fillStyle = '#4a4a4a';
                drawPixelRect(x - 10, y - 8, 20, 16);
                ctx.fillStyle = '#3a3a3a';
                drawPixelRect(x - 8, y - 16, 16, 10);
                ctx.fillStyle = '#ffff00';
                drawPixelRect(x - 5, y - 12, 4, 4);
                drawPixelRect(x + 2, y - 12, 4, 4);
            } else {
                // Vampire
                ctx.fillStyle = '#2a0a2a';
                drawPixelRect(x - 10, y - 8, 20, 16);
                ctx.fillStyle = '#200020';
                drawPixelRect(x - 8, y - 16, 16, 10);
                ctx.fillStyle = '#ff0000';
                drawPixelRect(x - 5, y - 12, 4, 3);
                drawPixelRect(x + 2, y - 12, 4, 3);
                // Cape
                ctx.fillStyle = '#440044';
                drawPixelRect(x - 14, y - 8, 4, 20);
                drawPixelRect(x + 10, y - 8, 4, 20);
            }
        } else if (enemy.type === 'bat') {
            ctx.fillStyle = '#44aa44';
            drawPixelRect(x - 4, y - 2, 8, 4);
            ctx.fillStyle = '#338833';
            drawPixelRect(x - 8, y - 1, 4, 2);
            drawPixelRect(x + 4, y - 1, 4, 2);
            ctx.fillStyle = '#ff0000';
            drawPixelRect(x - 2, y - 1, 2, 2);
            drawPixelRect(x + 1, y - 1, 2, 2);
        } else if (enemy.type === 'skeleton') {
            ctx.fillStyle = '#cccccc';
            drawPixelRect(x - 5, y - 8, 10, 8);
            drawPixelRect(x - 4, y, 8, 8);
            ctx.fillStyle = '#000000';
            drawPixelRect(x - 3, y - 6, 3, 3);
            drawPixelRect(x + 1, y - 6, 3, 3);
            ctx.fillStyle = '#888888';
            drawPixelRect(x - 3, y + 1, 6, 1);
            drawPixelRect(x - 3, y + 3, 6, 1);
            drawPixelRect(x - 3, y + 5, 6, 1);
        } else if (enemy.type === 'ghost') {
            ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
            drawPixelRect(x - 5, y - 6, 10, 10);
            drawPixelRect(x - 6, y + 2, 3, 4);
            drawPixelRect(x - 2, y + 4, 4, 4);
            drawPixelRect(x + 3, y + 2, 3, 4);
            ctx.fillStyle = '#000000';
            drawPixelRect(x - 3, y - 4, 2, 3);
            drawPixelRect(x + 1, y - 4, 2, 3);
        } else if (enemy.type === 'demon') {
            ctx.fillStyle = '#aa2222';
            drawPixelRect(x - 5, y - 4, 10, 10);
            ctx.fillStyle = '#881111';
            drawPixelRect(x - 4, y - 10, 8, 6);
            // Horns
            ctx.fillStyle = '#442222';
            drawPixelRect(x - 6, y - 12, 3, 6);
            drawPixelRect(x + 3, y - 12, 3, 6);
            ctx.fillStyle = '#ffff00';
            drawPixelRect(x - 2, y - 8, 2, 2);
            drawPixelRect(x + 1, y - 8, 2, 2);
        } else {
            // Zombie
            ctx.fillStyle = '#8844aa';
            drawPixelRect(x - 4, y - 2, 8, 8);
            ctx.fillStyle = '#77aa77';
            drawPixelRect(x - 3, y - 7, 6, 5);
            ctx.fillStyle = '#ff4444';
            drawPixelRect(x - 2, y - 5, 2, 2);
            drawPixelRect(x + 1, y - 5, 2, 2);
            ctx.fillStyle = '#77aa77';
            drawPixelRect(x - 6, y - 1, 2, 5);
            drawPixelRect(x + 4, y - 1, 2, 5);
        }

        // Health bar for damaged enemies
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.isBoss ? 32 : 16;
            const barHeight = 3;
            const barY = enemy.isBoss ? y - 22 : y - 12;
            ctx.fillStyle = '#440000';
            ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);
            ctx.fillStyle = enemy.isBoss ? '#ff8800' : '#ff4444';
            ctx.fillRect(x - barWidth / 2, barY, barWidth * (enemy.health / enemy.maxHealth), barHeight);
        }
    }
}

function drawProjectiles() {
    for (const proj of projectiles) {
        const x = Math.floor(proj.x);
        const y = Math.floor(proj.y);

        ctx.imageSmoothingEnabled = false;

        switch (proj.type) {
            case 'knife':
                ctx.fillStyle = '#cccccc';
                drawPixelRect(x - 2, y - 4, 4, 8);
                ctx.fillStyle = '#888888';
                drawPixelRect(x - 1, y - 5, 2, 2);
                break;
            case 'axe':
                ctx.fillStyle = '#8b4513';
                drawPixelRect(x - 2, y - 3, 4, 6);
                ctx.fillStyle = '#aaaaaa';
                drawPixelRect(x - 4, y - 4, 8, 4);
                break;
            case 'cross':
                ctx.fillStyle = '#ffd700';
                drawPixelRect(x - 1, y - 5, 2, 10);
                drawPixelRect(x - 4, y - 2, 8, 2);
                break;
            case 'magic':
                ctx.fillStyle = '#ff88ff';
                drawPixelRect(x - 3, y - 3, 6, 6);
                ctx.fillStyle = '#ffffff';
                drawPixelRect(x - 1, y - 1, 2, 2);
                break;
            default:
                ctx.fillStyle = '#ffff44';
                drawPixelRect(x - 2, y - 2, 4, 4);
                ctx.fillStyle = '#ffffff';
                drawPixelRect(x - 1, y - 1, 2, 2);
        }
    }
}

function drawAreaEffects() {
    for (const effect of areaEffects) {
        ctx.save();

        switch (effect.type) {
            case 'whip':
                ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
                ctx.fillRect(
                    effect.x - effect.width / 2,
                    effect.y - effect.height / 2,
                    effect.width,
                    effect.height
                );
                break;
            case 'holyWater':
                ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'garlic':
                ctx.strokeStyle = 'rgba(200, 255, 200, 0.6)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'lightning':
                ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.fill();
                // Lightning bolt visual
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y - 50);
                ctx.lineTo(effect.x - 5, effect.y - 20);
                ctx.lineTo(effect.x + 5, effect.y - 15);
                ctx.lineTo(effect.x, effect.y);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }
}

function drawExpGems() {
    for (const gem of expGems) {
        const x = Math.floor(gem.x);
        const y = Math.floor(gem.y);

        const size = gem.size === 'large' ? 1.5 : gem.size === 'medium' ? 1.2 : 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size, size);

        // Diamond shape
        ctx.fillStyle = gem.size === 'large' ? '#ff4444' : gem.size === 'medium' ? '#44ff44' : '#44aaff';
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, 4);
        ctx.lineTo(-3, 0);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#ffffff';
        drawPixelRect(-1, -2, 1, 1);

        ctx.restore();
    }
}

function drawTreasureChests() {
    for (const chest of treasureChests) {
        const x = Math.floor(chest.x);
        const y = Math.floor(chest.y);

        // Chest body
        ctx.fillStyle = chest.tier === 'legendary' ? '#ffd700' : '#8b4513';
        drawPixelRect(x - 8, y - 4, 16, 10);

        // Chest lid
        ctx.fillStyle = chest.tier === 'legendary' ? '#ffec8b' : '#a0522d';
        drawPixelRect(x - 9, y - 8, 18, 5);

        // Lock
        ctx.fillStyle = '#ffd700';
        drawPixelRect(x - 2, y - 2, 4, 4);
    }
}

function drawWeaponInventory() {
    const startX = 10;
    const startY = canvas.height - 40;
    const slotSize = 28;
    const gap = 4;

    // Draw weapon slots
    for (let i = 0; i < MAX_WEAPON_SLOTS; i++) {
        const x = startX + i * (slotSize + gap);

        // Slot background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, startY, slotSize, slotSize);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, startY, slotSize, slotSize);

        // Weapon icon
        if (player.weapons[i]) {
            const weapon = player.weapons[i];
            const def = WEAPONS[weapon.id];
            let icon = def.icon;

            if (weapon.evolved && def.evolution) {
                const evolved = EVOLVED_WEAPONS[def.evolution];
                icon = evolved.icon;
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, startY, slotSize, slotSize);
            }

            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, x + slotSize / 2, startY + slotSize / 2);

            // Level indicator
            ctx.font = '8px sans-serif';
            ctx.fillStyle = weapon.level >= MAX_WEAPON_LEVEL ? '#ffd700' : '#fff';
            ctx.fillText(weapon.level.toString(), x + slotSize - 6, startY + slotSize - 4);
        }
    }

    // Draw passive slots
    for (let i = 0; i < MAX_PASSIVE_SLOTS; i++) {
        const x = startX + (MAX_WEAPON_SLOTS + 1) * (slotSize + gap) + i * (slotSize + gap);

        // Slot background (different color for passives)
        ctx.fillStyle = 'rgba(50, 50, 80, 0.5)';
        ctx.fillRect(x, startY, slotSize, slotSize);
        ctx.strokeStyle = '#446';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, startY, slotSize, slotSize);

        // Passive icon
        if (player.passives[i]) {
            const passive = player.passives[i];
            const def = PASSIVES[passive.id];

            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.icon, x + slotSize / 2, startY + slotSize / 2);

            // Level indicator
            ctx.font = '8px sans-serif';
            ctx.fillStyle = passive.level >= def.maxLevel ? '#ffd700' : '#fff';
            ctx.fillText(passive.level.toString(), x + slotSize - 6, startY + slotSize - 4);
        }
    }
}

function drawPixelRect(x, y, width, height) {
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

// ============================================
// SOUND EFFECTS
// ============================================
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
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.03);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.03);
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.04);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.04);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.04);
                break;
            case 'kill':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.08);
                gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.08);
                break;
            case 'pickup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.06);
                gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.06);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.06);
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
            case 'evolve':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.15);
                oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.3);
                oscillator.frequency.setValueAtTime(1760, audioContext.currentTime + 0.45);
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
                break;
            case 'boss':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(80, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(60, audioContext.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'reaper':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(50, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(40, audioContext.currentTime + 0.3);
                oscillator.frequency.setValueAtTime(30, audioContext.currentTime + 0.6);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1);
                break;
            case 'wave':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'chest':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'victory':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.4);
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.6);
                oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.8);
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1.2);
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
