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
const CHEST_SIZE = 16;
const MAX_WEAPONS = 6;
const MAX_PASSIVES = 6;

// Game state
let gameState = 'start'; // start, playing, paused, levelup, gameover
let gameLoop = null;
let lastTime = 0;
let deltaTime = 0;

// Game stats
let gameTime = 0;
let kills = 0;
let bestTime = parseInt(localStorage.getItem('survivor-best-time')) || 0;

// Weapon definitions (inspired by Vampire Survivors)
const WEAPON_TYPES = {
    whip: {
        name: 'Whip',
        desc: 'Attacks horizontally',
        icon: '🔪',
        damage: 10,
        cooldown: 1.0,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: 0,
        evolvesTo: 'bloodyTear',
        requiresPassive: 'hollowHeart'
    },
    magicWand: {
        name: 'Magic Wand',
        desc: 'Fires at nearest enemy',
        icon: '🪄',
        damage: 8,
        cooldown: 0.8,
        area: 1.0,
        speed: 1.2,
        amount: 1,
        pierce: 0,
        evolvesTo: 'holyWand',
        requiresPassive: 'emptyTome'
    },
    knife: {
        name: 'Knife',
        desc: 'Throws knives in facing direction',
        icon: '🗡️',
        damage: 6,
        cooldown: 0.4,
        area: 0.8,
        speed: 1.5,
        amount: 1,
        pierce: 1,
        evolvesTo: 'thousandEdge',
        requiresPassive: 'bracer'
    },
    axe: {
        name: 'Axe',
        desc: 'Throws axes in arc',
        icon: '🪓',
        damage: 20,
        cooldown: 1.5,
        area: 1.2,
        speed: 0.8,
        amount: 1,
        pierce: 3,
        evolvesTo: 'deathSpiral',
        requiresPassive: 'candelabrador'
    },
    fireball: {
        name: 'Fire Wand',
        desc: 'Shoots fireballs',
        icon: '🔥',
        damage: 15,
        cooldown: 1.2,
        area: 1.3,
        speed: 0.9,
        amount: 1,
        pierce: 0,
        evolvesTo: 'hellfire',
        requiresPassive: 'spinach'
    },
    holyWater: {
        name: 'Holy Water',
        desc: 'Creates damaging zones',
        icon: '💧',
        damage: 8,
        cooldown: 2.0,
        area: 1.5,
        speed: 1.0,
        amount: 1,
        pierce: -1, // Area effect
        evolvesTo: 'laBorra',
        requiresPassive: 'attractorb'
    }
};

// Evolved weapon definitions
const EVOLVED_WEAPONS = {
    bloodyTear: { name: 'Bloody Tear', desc: 'Evolved Whip - Heals on hit', icon: '🩸', damageMultiplier: 1.5, healsOnHit: true },
    holyWand: { name: 'Holy Wand', desc: 'Evolved Wand - No cooldown', icon: '✨', damageMultiplier: 1.3, noCooldown: true },
    thousandEdge: { name: 'Thousand Edge', desc: 'Evolved Knife - Many projectiles', icon: '⚔️', damageMultiplier: 1.2, amountBonus: 3 },
    deathSpiral: { name: 'Death Spiral', desc: 'Evolved Axe - Orbits around', icon: '💀', damageMultiplier: 1.4, orbits: true },
    hellfire: { name: 'Hellfire', desc: 'Evolved Fire - Explosive', icon: '☄️', damageMultiplier: 1.6, explosive: true },
    laBorra: { name: 'La Borra', desc: 'Evolved Water - Follows you', icon: '🌊', damageMultiplier: 1.4, followsPlayer: true }
};

// Passive item definitions
const PASSIVE_TYPES = {
    hollowHeart: {
        name: 'Hollow Heart',
        desc: '+20% Max Health',
        icon: '❤️',
        effect: { maxHealth: 1.2 }
    },
    emptyTome: {
        name: 'Empty Tome',
        desc: '-8% Cooldown',
        icon: '📕',
        effect: { cooldown: 0.92 }
    },
    bracer: {
        name: 'Bracer',
        desc: '+10% Projectile Speed',
        icon: '🦾',
        effect: { projectileSpeed: 1.1 }
    },
    candelabrador: {
        name: 'Candelabrador',
        desc: '+10% Area',
        icon: '🕯️',
        effect: { area: 1.1 }
    },
    spinach: {
        name: 'Spinach',
        desc: '+10% Damage',
        icon: '🥬',
        effect: { damage: 1.1 }
    },
    attractorb: {
        name: 'Attractorb',
        desc: '+50% Pickup Range',
        icon: '🧲',
        effect: { pickupRange: 1.5 }
    },
    clover: {
        name: 'Clover',
        desc: '+10% Luck (Chest drops)',
        icon: '🍀',
        effect: { luck: 1.1 }
    },
    pummarola: {
        name: 'Pummarola',
        desc: '+0.2 HP/s Regen',
        icon: '🍅',
        effect: { regen: 0.2 }
    },
    duplicator: {
        name: 'Duplicator',
        desc: '+1 Projectile Amount',
        icon: '📋',
        effect: { amount: 1 }
    }
};

// Player
let player = {
    x: 0,
    y: 0,
    baseSpeed: 100,
    speed: 100,
    health: 100,
    maxHealth: 100,
    baseMaxHealth: 100,
    exp: 0,
    level: 1,
    expToNextLevel: 5,
    facingRight: true,
    weapons: [], // Array of weapon objects
    passives: [], // Array of passive objects
    // Stat multipliers from passives
    damageMultiplier: 1,
    cooldownMultiplier: 1,
    areaMultiplier: 1,
    speedMultiplier: 1,
    projectileSpeedMultiplier: 1,
    pickupRange: 80,
    luck: 1,
    regen: 0,
    amountBonus: 0
};

// Enemies
let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnInterval = 2;
let enemyBaseHealth = 20;
let enemyBaseDamage = 10;
let enemyBaseSpeed = 40;

// Projectiles & effects
let projectiles = [];
let areaEffects = [];
let orbitingWeapons = [];

// Pickups
let expGems = [];
let chests = [];

// Input
let keys = {};
let joystickVector = { x: 0, y: 0 };
let isMobile = false;
let lastMoveDirection = { x: 1, y: 0 }; // For knife direction

// Sound
let soundEnabled = localStorage.getItem('survivor-sound') !== 'false';
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Theme
const savedTheme = localStorage.getItem('game-hub-theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

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
        baseSpeed: 100,
        speed: 100,
        health: 100,
        maxHealth: 100,
        baseMaxHealth: 100,
        exp: 0,
        level: 1,
        expToNextLevel: 5,
        facingRight: true,
        weapons: [],
        passives: [],
        damageMultiplier: 1,
        cooldownMultiplier: 1,
        areaMultiplier: 1,
        speedMultiplier: 1,
        projectileSpeedMultiplier: 1,
        pickupRange: 80,
        luck: 1,
        regen: 0,
        amountBonus: 0
    };

    // Give starting weapon (whip, like Vampire Survivors)
    addWeapon('whip');

    // Reset game state
    enemies = [];
    projectiles = [];
    areaEffects = [];
    orbitingWeapons = [];
    expGems = [];
    chests = [];
    gameTime = 0;
    kills = 0;
    enemySpawnTimer = 0;
    enemySpawnInterval = 2;
    enemyBaseHealth = 20;
    enemyBaseDamage = 10;
    enemyBaseSpeed = 40;
    lastMoveDirection = { x: 1, y: 0 };

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

function addWeapon(weaponId) {
    if (player.weapons.length >= MAX_WEAPONS) return false;

    const weaponType = WEAPON_TYPES[weaponId];
    if (!weaponType) return false;

    player.weapons.push({
        id: weaponId,
        level: 1,
        maxLevel: 8,
        cooldownTimer: 0,
        evolved: false,
        evolvedId: null
    });
    return true;
}

function addPassive(passiveId) {
    if (player.passives.length >= MAX_PASSIVES) return false;

    const passiveType = PASSIVE_TYPES[passiveId];
    if (!passiveType) return false;

    player.passives.push({
        id: passiveId,
        level: 1,
        maxLevel: 5
    });

    applyPassiveEffects();
    return true;
}

function applyPassiveEffects() {
    // Reset multipliers
    player.damageMultiplier = 1;
    player.cooldownMultiplier = 1;
    player.areaMultiplier = 1;
    player.projectileSpeedMultiplier = 1;
    player.maxHealth = player.baseMaxHealth;
    player.pickupRange = 80;
    player.luck = 1;
    player.regen = 0;
    player.amountBonus = 0;

    // Apply each passive's effects based on level
    for (const passive of player.passives) {
        const type = PASSIVE_TYPES[passive.id];
        const level = passive.level;

        if (type.effect.damage) {
            player.damageMultiplier *= Math.pow(type.effect.damage, level);
        }
        if (type.effect.cooldown) {
            player.cooldownMultiplier *= Math.pow(type.effect.cooldown, level);
        }
        if (type.effect.area) {
            player.areaMultiplier *= Math.pow(type.effect.area, level);
        }
        if (type.effect.projectileSpeed) {
            player.projectileSpeedMultiplier *= Math.pow(type.effect.projectileSpeed, level);
        }
        if (type.effect.maxHealth) {
            player.maxHealth *= Math.pow(type.effect.maxHealth, level);
        }
        if (type.effect.pickupRange) {
            player.pickupRange *= Math.pow(type.effect.pickupRange, level);
        }
        if (type.effect.luck) {
            player.luck *= Math.pow(type.effect.luck, level);
        }
        if (type.effect.regen) {
            player.regen += type.effect.regen * level;
        }
        if (type.effect.amount) {
            player.amountBonus += type.effect.amount * level;
        }
    }

    player.maxHealth = Math.floor(player.maxHealth);
}

function upgradeWeapon(weaponId) {
    const weapon = player.weapons.find(w => w.id === weaponId);
    if (weapon && weapon.level < weapon.maxLevel) {
        weapon.level++;
        return true;
    }
    return false;
}

function upgradePassive(passiveId) {
    const passive = player.passives.find(p => p.id === passiveId);
    if (passive && passive.level < passive.maxLevel) {
        passive.level++;
        applyPassiveEffects();
        return true;
    }
    return false;
}

function checkEvolution(weapon) {
    if (weapon.evolved || weapon.level < weapon.maxLevel) return false;

    const weaponType = WEAPON_TYPES[weapon.id];
    if (!weaponType.evolvesTo) return false;

    // Check if player has the required passive at any level
    const hasRequiredPassive = player.passives.some(p => p.id === weaponType.requiresPassive);
    return hasRequiredPassive;
}

function evolveWeapon(weapon) {
    const weaponType = WEAPON_TYPES[weapon.id];
    weapon.evolved = true;
    weapon.evolvedId = weaponType.evolvesTo;
    playSound('levelup');
}

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

    // HP regeneration
    if (player.regen > 0) {
        player.health = Math.min(player.health + player.regen * deltaTime, player.maxHealth);
    }

    // Update game difficulty
    updateDifficulty();

    // Update player
    updatePlayer();

    // Update weapons
    updateWeapons();

    // Spawn enemies
    spawnEnemies();

    // Update enemies
    updateEnemies();

    // Update projectiles
    updateProjectiles();

    // Update area effects
    updateAreaEffects();

    // Update orbiting weapons
    updateOrbitingWeapons();

    // Update pickups
    updateExpGems();
    updateChests();

    // Check collisions
    checkCollisions();

    // Update UI
    updateUI();

    // Render
    render();

    gameLoop = requestAnimationFrame(update);
}

function updateDifficulty() {
    const difficultyLevel = Math.floor(gameTime / 30);
    enemySpawnInterval = Math.max(0.3, 2 - difficultyLevel * 0.15);
    enemyBaseHealth = 20 + difficultyLevel * 8;
    enemyBaseDamage = 10 + difficultyLevel * 3;
    enemyBaseSpeed = 40 + difficultyLevel * 5;
}

function updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (isMobile || (joystickVector.x !== 0 || joystickVector.y !== 0)) {
        dx = joystickVector.x;
        dy = joystickVector.y;
    }

    if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
    }

    // Track facing direction
    if (dx !== 0) {
        player.facingRight = dx > 0;
        lastMoveDirection.x = dx;
        lastMoveDirection.y = dy;
    } else if (dy !== 0) {
        lastMoveDirection.x = 0;
        lastMoveDirection.y = dy;
    }

    // Move player
    player.speed = player.baseSpeed * player.speedMultiplier;
    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;

    // Keep in bounds
    const halfSize = PLAYER_SIZE / 2;
    player.x = Math.max(halfSize, Math.min(canvas.width - halfSize, player.x));
    player.y = Math.max(halfSize, Math.min(canvas.height - halfSize, player.y));
}

function updateWeapons() {
    for (const weapon of player.weapons) {
        weapon.cooldownTimer -= deltaTime;

        if (weapon.cooldownTimer <= 0) {
            fireWeapon(weapon);

            const weaponType = WEAPON_TYPES[weapon.id];
            let cooldown = weaponType.cooldown * player.cooldownMultiplier;

            // Evolved weapon modifiers
            if (weapon.evolved) {
                const evolved = EVOLVED_WEAPONS[weapon.evolvedId];
                if (evolved.noCooldown) cooldown *= 0.3;
            }

            // Level reduces cooldown
            cooldown *= (1 - (weapon.level - 1) * 0.05);
            weapon.cooldownTimer = Math.max(0.1, cooldown);
        }
    }
}

function fireWeapon(weapon) {
    const weaponType = WEAPON_TYPES[weapon.id];
    const evolved = weapon.evolved ? EVOLVED_WEAPONS[weapon.evolvedId] : null;

    let damage = weaponType.damage * player.damageMultiplier * (1 + (weapon.level - 1) * 0.1);
    if (evolved) damage *= evolved.damageMultiplier;

    let amount = weaponType.amount + Math.floor((weapon.level - 1) / 2) + player.amountBonus;
    if (evolved && evolved.amountBonus) amount += evolved.amountBonus;

    const area = weaponType.area * player.areaMultiplier;
    const projSpeed = weaponType.speed * player.projectileSpeedMultiplier * 200;

    switch (weapon.id) {
        case 'whip':
            fireWhip(damage, area, evolved);
            break;
        case 'magicWand':
            fireMagicWand(damage, amount, projSpeed, weapon.level, evolved);
            break;
        case 'knife':
            fireKnife(damage, amount, projSpeed, weaponType.pierce + weapon.level, evolved);
            break;
        case 'axe':
            fireAxe(damage, amount, area, weaponType.pierce + weapon.level, evolved);
            break;
        case 'fireball':
            fireFireball(damage, amount, projSpeed, area, evolved);
            break;
        case 'holyWater':
            fireHolyWater(damage, amount, area, evolved);
            break;
    }

    playSound('shoot');
}

function fireWhip(damage, area, evolved) {
    // Whip attacks horizontally in facing direction
    const width = 80 * area;
    const height = 30 * area;
    const offsetX = player.facingRight ? 20 : -20 - width;

    areaEffects.push({
        x: player.x + offsetX,
        y: player.y - height / 2,
        width: width,
        height: height,
        damage: damage,
        lifetime: 0.2,
        maxLifetime: 0.2,
        type: 'whip',
        healsOnHit: evolved?.healsOnHit || false,
        color: evolved ? '#ff4444' : '#ffcc00'
    });
}

function fireMagicWand(damage, amount, speed, level, evolved) {
    const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = Math.hypot(a.x - player.x, a.y - player.y);
        const distB = Math.hypot(b.x - player.x, b.y - player.y);
        return distA - distB;
    });

    for (let i = 0; i < amount; i++) {
        const targetEnemy = sortedEnemies[i % Math.max(1, sortedEnemies.length)];
        if (!targetEnemy && enemies.length === 0) continue;

        const angle = targetEnemy
            ? Math.atan2(targetEnemy.y - player.y, targetEnemy.x - player.x)
            : Math.random() * Math.PI * 2;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: damage,
            pierce: 0,
            type: 'wand',
            color: evolved ? '#ffffff' : '#88aaff'
        });
    }
}

function fireKnife(damage, amount, speed, pierce, evolved) {
    const baseAngle = Math.atan2(lastMoveDirection.y, lastMoveDirection.x);
    const spread = 0.15;

    for (let i = 0; i < amount; i++) {
        const angleOffset = (i - (amount - 1) / 2) * spread;
        const angle = baseAngle + angleOffset;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: damage,
            pierce: pierce,
            type: 'knife',
            color: evolved ? '#aaaaff' : '#cccccc'
        });
    }
}

function fireAxe(damage, amount, area, pierce, evolved) {
    if (evolved && evolved.orbits) {
        // Death Spiral - orbiting axes
        for (let i = 0; i < amount; i++) {
            const angle = (i / amount) * Math.PI * 2;
            orbitingWeapons.push({
                angle: angle,
                distance: 60 * area,
                damage: damage,
                pierce: pierce,
                lifetime: 3,
                type: 'axe',
                color: '#ff6644'
            });
        }
    } else {
        // Normal axes thrown upward in arc
        for (let i = 0; i < amount; i++) {
            const offsetAngle = (i - (amount - 1) / 2) * 0.3;
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.sin(offsetAngle) * 80,
                vy: -250,
                gravity: 400,
                damage: damage,
                pierce: pierce,
                size: 12 * area,
                rotation: 0,
                type: 'axe',
                color: '#884422'
            });
        }
    }
}

function fireFireball(damage, amount, speed, area, evolved) {
    const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = Math.hypot(a.x - player.x, a.y - player.y);
        const distB = Math.hypot(b.x - player.x, b.y - player.y);
        return distA - distB;
    });

    for (let i = 0; i < amount; i++) {
        const targetEnemy = sortedEnemies[i % Math.max(1, sortedEnemies.length)];
        if (!targetEnemy && enemies.length === 0) continue;

        const angle = targetEnemy
            ? Math.atan2(targetEnemy.y - player.y, targetEnemy.x - player.x)
            : Math.random() * Math.PI * 2;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed * 0.8,
            damage: damage,
            pierce: 0,
            size: 10 * area,
            type: 'fireball',
            explosive: evolved?.explosive || false,
            explosionRadius: 40 * area,
            color: evolved ? '#ff2200' : '#ff6600'
        });
    }
}

function fireHolyWater(damage, amount, area, evolved) {
    for (let i = 0; i < amount; i++) {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;

        areaEffects.push({
            x: player.x + offsetX - 30 * area,
            y: player.y + offsetY - 30 * area,
            width: 60 * area,
            height: 60 * area,
            damage: damage,
            lifetime: 2,
            maxLifetime: 2,
            tickRate: 0.5,
            lastTick: 0,
            type: 'holywater',
            followsPlayer: evolved?.followsPlayer || false,
            offsetFromPlayer: { x: offsetX, y: offsetY },
            color: evolved ? '#4444ff' : '#44aaff'
        });
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        // Apply gravity for axes
        if (proj.gravity) {
            proj.vy += proj.gravity * deltaTime;
            proj.rotation = (proj.rotation || 0) + deltaTime * 10;
        }

        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Remove if off screen
        const margin = 100;
        if (proj.x < -margin || proj.x > canvas.width + margin ||
            proj.y < -margin || proj.y > canvas.height + margin) {
            projectiles.splice(i, 1);
        }
    }
}

function updateAreaEffects() {
    for (let i = areaEffects.length - 1; i >= 0; i--) {
        const effect = areaEffects[i];
        effect.lifetime -= deltaTime;

        // Follow player if evolved holy water
        if (effect.followsPlayer) {
            effect.x = player.x + effect.offsetFromPlayer.x - effect.width / 2;
            effect.y = player.y + effect.offsetFromPlayer.y - effect.height / 2;
        }

        // Damage tick for persistent effects
        if (effect.tickRate) {
            effect.lastTick += deltaTime;
            if (effect.lastTick >= effect.tickRate) {
                effect.lastTick = 0;
                // Damage enemies in area
                for (const enemy of enemies) {
                    if (enemy.x > effect.x && enemy.x < effect.x + effect.width &&
                        enemy.y > effect.y && enemy.y < effect.y + effect.height) {
                        enemy.health -= effect.damage;
                    }
                }
            }
        }

        if (effect.lifetime <= 0) {
            areaEffects.splice(i, 1);
        }
    }
}

function updateOrbitingWeapons() {
    for (let i = orbitingWeapons.length - 1; i >= 0; i--) {
        const orb = orbitingWeapons[i];
        orb.lifetime -= deltaTime;
        orb.angle += deltaTime * 3; // Rotation speed

        if (orb.lifetime <= 0) {
            orbitingWeapons.splice(i, 1);
        }
    }
}

function spawnEnemies() {
    enemySpawnTimer += deltaTime;

    if (enemySpawnTimer >= enemySpawnInterval) {
        enemySpawnTimer = 0;
        const spawnCount = 1 + Math.floor(gameTime / 45);
        for (let i = 0; i < spawnCount; i++) {
            spawnEnemy();
        }
    }
}

function spawnEnemy() {
    let x, y;
    const side = Math.floor(Math.random() * 4);
    const margin = 30;

    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -margin; break;
        case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + margin; break;
        case 3: x = -margin; y = Math.random() * canvas.height; break;
    }

    // Enemy types with different behaviors
    const typeRoll = Math.random();
    let type, healthMult, speedMult, damageMult, expValue;

    if (typeRoll < 0.5) {
        type = 'zombie'; healthMult = 1; speedMult = 1; damageMult = 1; expValue = 1;
    } else if (typeRoll < 0.75) {
        type = 'bat'; healthMult = 0.5; speedMult = 1.8; damageMult = 0.7; expValue = 1;
    } else if (typeRoll < 0.9) {
        type = 'skeleton'; healthMult = 2; speedMult = 0.7; damageMult = 1.5; expValue = 3;
    } else {
        type = 'ghost'; healthMult = 0.8; speedMult = 1.2; damageMult = 1.2; expValue = 2;
    }

    // Boss spawn every 5 minutes
    if (gameTime > 300 && Math.random() < 0.02) {
        type = 'boss';
        healthMult = 10;
        speedMult = 0.5;
        damageMult = 3;
        expValue = 50;
    }

    enemies.push({
        x, y, type,
        health: enemyBaseHealth * healthMult,
        maxHealth: enemyBaseHealth * healthMult,
        speed: enemyBaseSpeed * speedMult,
        damage: enemyBaseDamage * damageMult,
        expValue,
        hitFlash: 0
    });
}

function updateEnemies() {
    for (const enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed * deltaTime;
            enemy.y += (dy / dist) * enemy.speed * deltaTime;
        }

        // Update hit flash
        if (enemy.hitFlash > 0) {
            enemy.hitFlash -= deltaTime;
        }
    }
}

function updateExpGems() {
    for (let i = expGems.length - 1; i >= 0; i--) {
        const gem = expGems[i];
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.pickupRange) {
            const attractSpeed = 300;
            gem.x += (dx / dist) * attractSpeed * deltaTime;
            gem.y += (dy / dist) * attractSpeed * deltaTime;
        }
    }
}

function updateChests() {
    // Chests don't move, just wait for pickup
}

function checkCollisions() {
    // Projectiles vs Enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        const projSize = proj.size || PROJECTILE_SIZE;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);

            if (dist < (projSize + ENEMY_SIZE) / 2) {
                enemy.health -= proj.damage;
                enemy.hitFlash = 0.1;
                playSound('hit');

                // Handle explosion
                if (proj.explosive) {
                    createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage * 0.5);
                }

                if (proj.pierce <= 0) {
                    projectiles.splice(i, 1);
                } else {
                    proj.pierce--;
                }

                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy, j);
                }
                break;
            }
        }
    }

    // Area effects vs Enemies (for whip, etc.)
    for (const effect of areaEffects) {
        if (effect.type === 'whip') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (enemy.x > effect.x && enemy.x < effect.x + effect.width &&
                    enemy.y > effect.y && enemy.y < effect.y + effect.height) {
                    enemy.health -= effect.damage;
                    enemy.hitFlash = 0.1;

                    if (effect.healsOnHit) {
                        player.health = Math.min(player.health + 1, player.maxHealth);
                    }

                    if (enemy.health <= 0) {
                        handleEnemyDeath(enemy, j);
                    }
                }
            }
        }
    }

    // Orbiting weapons vs Enemies
    for (const orb of orbitingWeapons) {
        const orbX = player.x + Math.cos(orb.angle) * orb.distance;
        const orbY = player.y + Math.sin(orb.angle) * orb.distance;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = Math.hypot(orbX - enemy.x, orbY - enemy.y);

            if (dist < 20) {
                enemy.health -= orb.damage * deltaTime * 3;
                enemy.hitFlash = 0.05;

                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy, j);
                }
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

            while (player.exp >= player.expToNextLevel) {
                levelUp();
            }
        }
    }

    // Player vs Chests
    for (let i = chests.length - 1; i >= 0; i--) {
        const chest = chests[i];
        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);

        if (dist < (PLAYER_SIZE + CHEST_SIZE) / 2) {
            openChest(chest);
            chests.splice(i, 1);
        }
    }
}

function handleEnemyDeath(enemy, index) {
    // Drop exp gem
    expGems.push({
        x: enemy.x,
        y: enemy.y,
        value: enemy.expValue
    });

    // Chance to drop chest (affected by luck)
    const chestChance = 0.02 * player.luck;
    if (Math.random() < chestChance) {
        chests.push({
            x: enemy.x,
            y: enemy.y
        });
    }

    enemies.splice(index, 1);
    kills++;
    playSound('kill');
}

function createExplosion(x, y, radius, damage) {
    areaEffects.push({
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
        damage: 0, // Explosion damage handled separately
        lifetime: 0.3,
        maxLifetime: 0.3,
        type: 'explosion',
        color: '#ff4400'
    });

    // Damage enemies in explosion radius
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dist = Math.hypot(x - enemy.x, y - enemy.y);
        if (dist < radius) {
            enemy.health -= damage;
            enemy.hitFlash = 0.1;
            if (enemy.health <= 0) {
                handleEnemyDeath(enemy, i);
            }
        }
    }
}

function openChest(chest) {
    playSound('levelup');

    // Check for weapon evolution
    for (const weapon of player.weapons) {
        if (checkEvolution(weapon)) {
            evolveWeapon(weapon);
            return; // Only one evolution per chest
        }
    }

    // Otherwise give bonus exp or health
    if (Math.random() < 0.5) {
        player.exp += 5;
        while (player.exp >= player.expToNextLevel) {
            levelUp();
        }
    } else {
        player.health = Math.min(player.health + 20, player.maxHealth);
    }
}

function levelUp() {
    player.level++;
    player.exp -= player.expToNextLevel;
    player.expToNextLevel = Math.floor(player.expToNextLevel * 1.3) + 5;

    gameState = 'levelup';
    playSound('levelup');
    showUpgradeOptions();
}

function showUpgradeOptions() {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';

    const options = generateUpgradeOptions();

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.innerHTML = `
            <div class="upgrade-icon">${option.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${option.name}</div>
                <div class="upgrade-desc">${option.desc}</div>
            </div>
        `;
        btn.onclick = () => selectUpgrade(option);
        optionsContainer.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function generateUpgradeOptions() {
    const options = [];
    const availableWeapons = Object.keys(WEAPON_TYPES);
    const availablePassives = Object.keys(PASSIVE_TYPES);

    // Add weapon upgrades (existing weapons)
    for (const weapon of player.weapons) {
        if (weapon.level < weapon.maxLevel && !weapon.evolved) {
            const type = WEAPON_TYPES[weapon.id];
            options.push({
                type: 'weaponUpgrade',
                id: weapon.id,
                icon: type.icon,
                name: `${type.name} (LV${weapon.level + 1})`,
                desc: `Upgrade ${type.name}`
            });
        }
    }

    // Add new weapons (if slots available)
    if (player.weapons.length < MAX_WEAPONS) {
        const newWeapons = availableWeapons.filter(w => !player.weapons.some(pw => pw.id === w));
        for (const weaponId of newWeapons) {
            const type = WEAPON_TYPES[weaponId];
            options.push({
                type: 'newWeapon',
                id: weaponId,
                icon: type.icon,
                name: type.name,
                desc: type.desc
            });
        }
    }

    // Add passive upgrades (existing passives)
    for (const passive of player.passives) {
        if (passive.level < passive.maxLevel) {
            const type = PASSIVE_TYPES[passive.id];
            options.push({
                type: 'passiveUpgrade',
                id: passive.id,
                icon: type.icon,
                name: `${type.name} (LV${passive.level + 1})`,
                desc: type.desc
            });
        }
    }

    // Add new passives (if slots available)
    if (player.passives.length < MAX_PASSIVES) {
        const newPassives = availablePassives.filter(p => !player.passives.some(pp => pp.id === p));
        for (const passiveId of newPassives) {
            const type = PASSIVE_TYPES[passiveId];
            options.push({
                type: 'newPassive',
                id: passiveId,
                icon: type.icon,
                name: type.name,
                desc: type.desc
            });
        }
    }

    // Shuffle and return 3-4 options
    const shuffled = options.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(4, options.length));
}

function selectUpgrade(option) {
    switch (option.type) {
        case 'newWeapon':
            addWeapon(option.id);
            break;
        case 'weaponUpgrade':
            upgradeWeapon(option.id);
            break;
        case 'newPassive':
            addPassive(option.id);
            break;
        case 'passiveUpgrade':
            upgradePassive(option.id);
            break;
    }

    playSound('upgrade');
    document.getElementById('level-up-modal').classList.add('hidden');
    gameState = 'playing';
    lastTime = performance.now();
}

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

    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = `${Math.ceil(player.health)}/${Math.floor(player.maxHealth)}`;

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
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#0a0a14' : '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') return;

    drawPixelGrid();
    drawAreaEffects();
    drawExpGems();
    drawChests();
    drawProjectiles();
    drawOrbitingWeapons();
    drawEnemies();
    drawPlayer();
    drawWeaponSlots();
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

    // Body
    ctx.fillStyle = '#4466aa';
    drawPixelRect(x - 4, y - 2, 8, 8);

    // Head
    ctx.fillStyle = '#ffcc99';
    drawPixelRect(x - 3, y - 8, 6, 6);

    // Hair
    ctx.fillStyle = '#664422';
    drawPixelRect(x - 3, y - 9, 6, 2);
    if (player.facingRight) {
        drawPixelRect(x - 4, y - 8, 2, 4);
    } else {
        drawPixelRect(x + 2, y - 8, 2, 4);
    }

    // Eyes
    ctx.fillStyle = '#000000';
    if (player.facingRight) {
        drawPixelRect(x, y - 6, 2, 2);
    } else {
        drawPixelRect(x - 2, y - 6, 2, 2);
    }

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

        // Flash white when hit
        const flashColor = enemy.hitFlash > 0 ? '#ffffff' : null;

        switch (enemy.type) {
            case 'bat':
                ctx.fillStyle = flashColor || '#44aa44';
                drawPixelRect(x - 4, y - 2, 8, 4);
                ctx.fillStyle = flashColor || '#338833';
                drawPixelRect(x - 8, y - 1, 4, 2);
                drawPixelRect(x + 4, y - 1, 4, 2);
                ctx.fillStyle = flashColor || '#ff0000';
                drawPixelRect(x - 2, y - 1, 2, 2);
                drawPixelRect(x + 1, y - 1, 2, 2);
                break;

            case 'skeleton':
                ctx.fillStyle = flashColor || '#cccccc';
                drawPixelRect(x - 5, y - 8, 10, 8);
                drawPixelRect(x - 4, y, 8, 8);
                ctx.fillStyle = flashColor || '#000000';
                drawPixelRect(x - 3, y - 6, 3, 3);
                drawPixelRect(x + 1, y - 6, 3, 3);
                if (!flashColor) {
                    ctx.fillStyle = '#888888';
                    drawPixelRect(x - 3, y + 1, 6, 1);
                    drawPixelRect(x - 3, y + 3, 6, 1);
                    drawPixelRect(x - 3, y + 5, 6, 1);
                }
                break;

            case 'ghost':
                ctx.fillStyle = flashColor || 'rgba(180, 180, 255, 0.7)';
                drawPixelRect(x - 5, y - 6, 10, 10);
                drawPixelRect(x - 6, y + 2, 3, 4);
                drawPixelRect(x + 3, y + 2, 3, 4);
                ctx.fillStyle = flashColor || '#000000';
                drawPixelRect(x - 3, y - 4, 3, 3);
                drawPixelRect(x + 1, y - 4, 3, 3);
                break;

            case 'boss':
                ctx.fillStyle = flashColor || '#880000';
                drawPixelRect(x - 10, y - 12, 20, 16);
                drawPixelRect(x - 8, y + 4, 16, 12);
                ctx.fillStyle = flashColor || '#ffff00';
                drawPixelRect(x - 6, y - 8, 4, 4);
                drawPixelRect(x + 2, y - 8, 4, 4);
                ctx.fillStyle = flashColor || '#440000';
                drawPixelRect(x - 12, y - 14, 4, 6);
                drawPixelRect(x + 8, y - 14, 4, 6);
                break;

            default: // zombie
                ctx.fillStyle = flashColor || '#8844aa';
                drawPixelRect(x - 4, y - 2, 8, 8);
                ctx.fillStyle = flashColor || '#77aa77';
                drawPixelRect(x - 3, y - 7, 6, 5);
                ctx.fillStyle = flashColor || '#ff4444';
                drawPixelRect(x - 2, y - 5, 2, 2);
                drawPixelRect(x + 1, y - 5, 2, 2);
                ctx.fillStyle = flashColor || '#77aa77';
                drawPixelRect(x - 6, y - 1, 2, 5);
                drawPixelRect(x + 4, y - 1, 2, 5);
        }

        // Health bar
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.type === 'boss' ? 30 : 16;
            const barY = enemy.type === 'boss' ? y - 18 : y - 12;
            ctx.fillStyle = '#440000';
            ctx.fillRect(x - barWidth / 2, barY, barWidth, 3);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x - barWidth / 2, barY, barWidth * (enemy.health / enemy.maxHealth), 3);
        }
    }
}

function drawProjectiles() {
    for (const proj of projectiles) {
        const x = Math.floor(proj.x);
        const y = Math.floor(proj.y);
        const size = proj.size || PROJECTILE_SIZE;

        ctx.fillStyle = proj.color;

        if (proj.type === 'axe') {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(proj.rotation || 0);
            drawPixelRect(-size / 2, -size / 2, size, size);
            ctx.restore();
        } else if (proj.type === 'fireball') {
            // Fireball with glow
            ctx.fillStyle = proj.color;
            drawPixelRect(x - size / 2, y - size / 2, size, size);
            ctx.fillStyle = '#ffff00';
            drawPixelRect(x - size / 4, y - size / 4, size / 2, size / 2);
        } else if (proj.type === 'knife') {
            // Knife shape
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = proj.color;
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillStyle = '#888888';
            ctx.fillRect(-6, -1, 4, 2);
            ctx.restore();
        } else {
            // Default projectile
            drawPixelRect(x - 2, y - 2, 4, 4);
            ctx.fillStyle = '#ffffff';
            drawPixelRect(x - 1, y - 1, 2, 2);
        }
    }
}

function drawAreaEffects() {
    for (const effect of areaEffects) {
        const alpha = effect.lifetime / effect.maxLifetime;

        if (effect.type === 'whip') {
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(effect.x, effect.y, effect.width, effect.height);
            ctx.globalAlpha = 1;
        } else if (effect.type === 'holywater') {
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.ellipse(
                effect.x + effect.width / 2,
                effect.y + effect.height / 2,
                effect.width / 2,
                effect.height / 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'explosion') {
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(
                effect.x + effect.width / 2,
                effect.y + effect.height / 2,
                effect.width / 2 * (1 + (1 - alpha) * 0.5),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

function drawOrbitingWeapons() {
    for (const orb of orbitingWeapons) {
        const x = player.x + Math.cos(orb.angle) * orb.distance;
        const y = player.y + Math.sin(orb.angle) * orb.distance;

        ctx.fillStyle = orb.color;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(orb.angle * 2);
        drawPixelRect(-6, -6, 12, 12);
        ctx.restore();
    }
}

function drawExpGems() {
    for (const gem of expGems) {
        const x = Math.floor(gem.x);
        const y = Math.floor(gem.y);

        // Blue diamond gem
        ctx.fillStyle = gem.value >= 3 ? '#44ff44' : '#44aaff';
        drawPixelRect(x - 2, y - 4, 4, 2);
        drawPixelRect(x - 3, y - 2, 6, 2);
        drawPixelRect(x - 2, y, 4, 2);
        drawPixelRect(x - 1, y + 2, 2, 2);

        ctx.fillStyle = gem.value >= 3 ? '#88ff88' : '#88ccff';
        drawPixelRect(x - 1, y - 3, 2, 1);
    }
}

function drawChests() {
    for (const chest of chests) {
        const x = Math.floor(chest.x);
        const y = Math.floor(chest.y);

        // Treasure chest
        ctx.fillStyle = '#8B4513';
        drawPixelRect(x - 8, y - 4, 16, 10);
        ctx.fillStyle = '#D4AF37';
        drawPixelRect(x - 6, y - 6, 12, 4);
        ctx.fillStyle = '#FFD700';
        drawPixelRect(x - 2, y - 2, 4, 4);
    }
}

function drawWeaponSlots() {
    const slotSize = 24;
    const padding = 4;
    const startX = 10;
    const startY = canvas.height - slotSize - 10;

    // Draw weapon slots
    for (let i = 0; i < MAX_WEAPONS; i++) {
        const x = startX + i * (slotSize + padding);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, startY, slotSize, slotSize);
        ctx.strokeStyle = '#444';
        ctx.strokeRect(x, startY, slotSize, slotSize);

        if (player.weapons[i]) {
            const weapon = player.weapons[i];
            const type = weapon.evolved ? EVOLVED_WEAPONS[weapon.evolvedId] : WEAPON_TYPES[weapon.id];

            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.icon, x + slotSize / 2, startY + slotSize / 2);

            // Level indicator
            ctx.font = '8px sans-serif';
            ctx.fillStyle = weapon.evolved ? '#ffd700' : '#fff';
            ctx.fillText(weapon.evolved ? 'E' : weapon.level, x + slotSize - 6, startY + slotSize - 6);
        }
    }

    // Draw passive slots
    const passiveStartX = canvas.width - (MAX_PASSIVES * (slotSize + padding)) - 10 + padding;
    for (let i = 0; i < MAX_PASSIVES; i++) {
        const x = passiveStartX + i * (slotSize + padding);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, startY, slotSize, slotSize);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(x, startY, slotSize, slotSize);

        if (player.passives[i]) {
            const passive = player.passives[i];
            const type = PASSIVE_TYPES[passive.id];

            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.icon, x + slotSize / 2, startY + slotSize / 2);

            // Level indicator
            ctx.font = '8px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(passive.level, x + slotSize - 6, startY + slotSize - 6);
        }
    }
}

function drawPixelRect(x, y, width, height) {
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

// Sound effects
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

// Initialize
init();
