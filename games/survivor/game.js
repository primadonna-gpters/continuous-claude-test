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
const MAX_WEAPONS = 6;
const MAX_PASSIVES = 6;
const MAX_ENEMIES = 300;
const MAX_GEMS = 400;

// Game state
let gameState = 'start'; // start, playing, paused, levelup, gameover, chest
let gameLoop = null;
let lastTime = 0;
let deltaTime = 0;

// Game stats
let gameTime = 0;
let kills = 0;
let bestTime = parseInt(localStorage.getItem('survivor-best-time')) || 0;

// =============================================
// WEAPONS DEFINITION (Vampire Survivors style)
// =============================================
const WEAPONS = {
    whip: {
        id: 'whip',
        name: 'Whip',
        description: 'Attacks horizontally',
        maxLevel: 8,
        baseDamage: 10,
        baseArea: 1.0,
        baseCooldown: 1.15,
        baseKnockback: 1,
        baseProjectiles: 1,
        evolution: 'bloodyTear',
        requiredPassive: 'hollowHeart',
        color: '#8B4513'
    },
    magicWand: {
        id: 'magicWand',
        name: 'Magic Wand',
        description: 'Fires at nearest enemy',
        maxLevel: 8,
        baseDamage: 10,
        baseSpeed: 300,
        baseCooldown: 0.5,
        baseProjectiles: 1,
        evolution: 'holyWand',
        requiredPassive: 'emptyTome',
        color: '#9966FF'
    },
    knife: {
        id: 'knife',
        name: 'Knife',
        description: 'Fires knives in facing direction',
        maxLevel: 8,
        baseDamage: 8,
        baseSpeed: 400,
        baseCooldown: 0.3,
        baseProjectiles: 1,
        evolution: 'thousandEdge',
        requiredPassive: 'bracer',
        color: '#C0C0C0'
    },
    axe: {
        id: 'axe',
        name: 'Axe',
        description: 'High damage, arc trajectory',
        maxLevel: 8,
        baseDamage: 20,
        baseSpeed: 200,
        baseCooldown: 1.5,
        baseProjectiles: 1,
        evolution: 'deathSpiral',
        requiredPassive: 'candelabrador',
        color: '#A0522D'
    },
    cross: {
        id: 'cross',
        name: 'Cross',
        description: 'Boomerang that returns',
        maxLevel: 8,
        baseDamage: 15,
        baseSpeed: 250,
        baseCooldown: 1.2,
        baseProjectiles: 1,
        evolution: 'heavenSword',
        requiredPassive: 'clover',
        color: '#FFD700'
    },
    kingBible: {
        id: 'kingBible',
        name: 'King Bible',
        description: 'Orbits around player',
        maxLevel: 8,
        baseDamage: 10,
        baseDuration: 3,
        baseCooldown: 2.0,
        baseProjectiles: 1,
        baseOrbitRadius: 70,
        evolution: 'unholyVespers',
        requiredPassive: 'spellbinder',
        color: '#4169E1'
    },
    garlic: {
        id: 'garlic',
        name: 'Garlic',
        description: 'Damages nearby enemies',
        maxLevel: 8,
        baseDamage: 5,
        baseArea: 40,
        baseCooldown: 0.5,
        baseKnockback: 0.5,
        evolution: 'soulEater',
        requiredPassive: 'pummarola',
        color: '#F5F5DC'
    },
    fireWand: {
        id: 'fireWand',
        name: 'Fire Wand',
        description: 'Fires at random enemies',
        maxLevel: 8,
        baseDamage: 20,
        baseSpeed: 350,
        baseCooldown: 0.8,
        baseProjectiles: 1,
        evolution: 'hellfire',
        requiredPassive: 'spinach',
        color: '#FF4500'
    },
    lightning: {
        id: 'lightning',
        name: 'Lightning Ring',
        description: 'Strikes random enemies',
        maxLevel: 8,
        baseDamage: 10,
        baseArea: 1.0,
        baseCooldown: 1.0,
        baseStrikes: 1,
        evolution: 'thunderLoop',
        requiredPassive: 'duplicator',
        color: '#00FFFF'
    },
    santaWater: {
        id: 'santaWater',
        name: 'Santa Water',
        description: 'Leaves damaging zone',
        maxLevel: 8,
        baseDamage: 8,
        baseArea: 40,
        baseDuration: 3,
        baseCooldown: 3.0,
        evolution: 'laBorra',
        requiredPassive: 'attractorb',
        color: '#87CEEB'
    }
};

// Evolved weapons
const EVOLVED_WEAPONS = {
    bloodyTear: {
        id: 'bloodyTear',
        name: 'Bloody Tear',
        description: 'Evolved Whip, heals on hit',
        baseDamage: 25,
        baseArea: 1.3,
        baseCooldown: 0.85,
        baseKnockback: 1.5,
        baseProjectiles: 1,
        lifesteal: 0.05,
        color: '#8B0000'
    },
    holyWand: {
        id: 'holyWand',
        name: 'Holy Wand',
        description: 'No cooldown magic missiles',
        baseDamage: 15,
        baseSpeed: 400,
        baseCooldown: 0.1,
        baseProjectiles: 1,
        color: '#FFFFFF'
    },
    thousandEdge: {
        id: 'thousandEdge',
        name: 'Thousand Edge',
        description: 'Rapid fire knives',
        baseDamage: 12,
        baseSpeed: 500,
        baseCooldown: 0.1,
        baseProjectiles: 3,
        color: '#E0E0E0'
    },
    deathSpiral: {
        id: 'deathSpiral',
        name: 'Death Spiral',
        description: 'Spinning axes that pass through',
        baseDamage: 40,
        baseSpeed: 150,
        baseCooldown: 1.0,
        baseProjectiles: 2,
        piercing: true,
        color: '#2F4F4F'
    },
    heavenSword: {
        id: 'heavenSword',
        name: 'Heaven Sword',
        description: 'Multiple returning crosses',
        baseDamage: 30,
        baseSpeed: 300,
        baseCooldown: 0.8,
        baseProjectiles: 2,
        critChance: 0.3,
        color: '#FFD700'
    },
    unholyVespers: {
        id: 'unholyVespers',
        name: 'Unholy Vespers',
        description: 'Permanent orbiting bibles',
        baseDamage: 20,
        baseDuration: 999,
        baseCooldown: 0.5,
        baseProjectiles: 4,
        baseOrbitRadius: 80,
        color: '#4B0082'
    },
    soulEater: {
        id: 'soulEater',
        name: 'Soul Eater',
        description: 'Steals life from enemies',
        baseDamage: 12,
        baseArea: 60,
        baseCooldown: 0.3,
        lifesteal: 0.1,
        color: '#800080'
    },
    hellfire: {
        id: 'hellfire',
        name: 'Hellfire',
        description: 'Explosive fire projectiles',
        baseDamage: 40,
        baseSpeed: 400,
        baseCooldown: 0.5,
        baseProjectiles: 2,
        explosion: true,
        color: '#FF0000'
    },
    thunderLoop: {
        id: 'thunderLoop',
        name: 'Thunder Loop',
        description: 'Chain lightning strikes',
        baseDamage: 20,
        baseArea: 1.5,
        baseCooldown: 0.5,
        baseStrikes: 3,
        chain: 2,
        color: '#00FFFF'
    },
    laBorra: {
        id: 'laBorra',
        name: 'La Borra',
        description: 'Large damaging zones that follow',
        baseDamage: 15,
        baseArea: 80,
        baseDuration: 5,
        baseCooldown: 2.0,
        follows: true,
        color: '#00CED1'
    }
};

// =============================================
// PASSIVE ITEMS DEFINITION
// =============================================
const PASSIVES = {
    spinach: {
        id: 'spinach',
        name: 'Spinach',
        description: '+10% Might per level',
        maxLevel: 5,
        statBonus: { might: 0.1 },
        color: '#228B22'
    },
    armor: {
        id: 'armor',
        name: 'Armor',
        description: '+1 Armor per level',
        maxLevel: 5,
        statBonus: { armor: 1 },
        color: '#708090'
    },
    hollowHeart: {
        id: 'hollowHeart',
        name: 'Hollow Heart',
        description: '+20% Max Health per level',
        maxLevel: 5,
        statBonus: { maxHealth: 0.2 },
        color: '#DC143C'
    },
    pummarola: {
        id: 'pummarola',
        name: 'Pummarola',
        description: '+0.2 HP/s recovery per level',
        maxLevel: 5,
        statBonus: { recovery: 0.2 },
        color: '#FF6347'
    },
    emptyTome: {
        id: 'emptyTome',
        name: 'Empty Tome',
        description: '-8% Cooldown per level',
        maxLevel: 5,
        statBonus: { cooldown: -0.08 },
        color: '#DEB887'
    },
    candelabrador: {
        id: 'candelabrador',
        name: 'Candelabrador',
        description: '+10% Area per level',
        maxLevel: 5,
        statBonus: { area: 0.1 },
        color: '#FFD700'
    },
    bracer: {
        id: 'bracer',
        name: 'Bracer',
        description: '+10% Projectile Speed per level',
        maxLevel: 5,
        statBonus: { projectileSpeed: 0.1 },
        color: '#B8860B'
    },
    spellbinder: {
        id: 'spellbinder',
        name: 'Spellbinder',
        description: '+10% Duration per level',
        maxLevel: 5,
        statBonus: { duration: 0.1 },
        color: '#9370DB'
    },
    duplicator: {
        id: 'duplicator',
        name: 'Duplicator',
        description: '+1 Projectile per level',
        maxLevel: 2,
        statBonus: { amount: 1 },
        color: '#20B2AA'
    },
    wings: {
        id: 'wings',
        name: 'Wings',
        description: '+10% Move Speed per level',
        maxLevel: 5,
        statBonus: { moveSpeed: 0.1 },
        color: '#ADD8E6'
    },
    attractorb: {
        id: 'attractorb',
        name: 'Attractorb',
        description: '+20% Pickup Range per level',
        maxLevel: 5,
        statBonus: { magnet: 0.2 },
        color: '#4169E1'
    },
    clover: {
        id: 'clover',
        name: 'Clover',
        description: '+10% Luck per level',
        maxLevel: 5,
        statBonus: { luck: 0.1 },
        color: '#32CD32'
    },
    crown: {
        id: 'crown',
        name: 'Crown',
        description: '+8% Growth (XP bonus) per level',
        maxLevel: 5,
        statBonus: { growth: 0.08 },
        color: '#FFD700'
    },
    skullOManiac: {
        id: 'skullOManiac',
        name: 'Skull O\'Maniac',
        description: '+10% Curse (enemy strength & speed) per level',
        maxLevel: 5,
        statBonus: { curse: 0.1 },
        color: '#2F4F4F'
    }
};

// =============================================
// PLAYER DEFINITION
// =============================================
let player = {
    x: 0,
    y: 0,
    facingRight: true,
    // Base stats
    baseSpeed: 100,
    baseHealth: 100,
    baseArmor: 0,
    baseRecovery: 0,
    baseMight: 1.0,
    baseCooldown: 1.0,
    baseArea: 1.0,
    baseProjectileSpeed: 1.0,
    baseDuration: 1.0,
    baseAmount: 0,
    baseMagnet: 80,
    baseLuck: 1.0,
    baseGrowth: 1.0,
    baseCurse: 1.0,
    // Computed stats (with passive bonuses)
    speed: 100,
    health: 100,
    maxHealth: 100,
    armor: 0,
    recovery: 0,
    might: 1.0,
    cooldownMod: 1.0,
    area: 1.0,
    projectileSpeed: 1.0,
    duration: 1.0,
    amount: 0,
    magnet: 80,
    luck: 1.0,
    growth: 1.0,
    curse: 1.0,
    // Experience
    exp: 0,
    level: 1,
    expToNextLevel: 5,
    // Inventory
    weapons: [], // Array of { id, level, ... }
    passives: [], // Array of { id, level }
    // Weapon states
    weaponStates: {} // Cooldowns, active projectiles, etc.
};

// Enemies
let enemies = [];
let bossActive = false;
let bossSpawnTimes = []; // Track when bosses should spawn

// Projectiles and effects
let projectiles = [];
let effects = []; // Visual effects
let zones = []; // Damage zones (Santa Water, etc.)
let orbitals = []; // Orbiting weapons (King Bible)

// Experience gems
let expGems = [];

// Treasure chests
let chests = [];

// Input
let keys = {};
let joystickVector = { x: 0, y: 0 };
let isMobile = false;
let lastMoveDirection = { x: 1, y: 0 };

// Sound
let soundEnabled = localStorage.getItem('survivor-sound') !== 'false';
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Theme
const savedTheme = localStorage.getItem('game-hub-theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

// =============================================
// INITIALIZATION
// =============================================
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

    // Number keys for level up selection
    if (gameState === 'levelup' || gameState === 'chest') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
            const buttons = document.querySelectorAll('.upgrade-btn');
            if (buttons[num - 1]) {
                buttons[num - 1].click();
            }
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

// =============================================
// GAME START/RESET
// =============================================
function startNewGame() {
    // Reset player
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        facingRight: true,
        // Base stats
        baseSpeed: 100,
        baseHealth: 100,
        baseArmor: 0,
        baseRecovery: 0,
        baseMight: 1.0,
        baseCooldown: 1.0,
        baseArea: 1.0,
        baseProjectileSpeed: 1.0,
        baseDuration: 1.0,
        baseAmount: 0,
        baseMagnet: 80,
        baseLuck: 1.0,
        baseGrowth: 1.0,
        baseCurse: 1.0,
        // Computed stats
        speed: 100,
        health: 100,
        maxHealth: 100,
        armor: 0,
        recovery: 0,
        might: 1.0,
        cooldownMod: 1.0,
        area: 1.0,
        projectileSpeed: 1.0,
        duration: 1.0,
        amount: 0,
        magnet: 80,
        luck: 1.0,
        growth: 1.0,
        curse: 1.0,
        // Experience
        exp: 0,
        level: 1,
        expToNextLevel: 5,
        // Inventory
        weapons: [],
        passives: [],
        weaponStates: {}
    };

    // Give starting weapon
    addWeapon('whip');

    // Reset game state
    enemies = [];
    projectiles = [];
    effects = [];
    zones = [];
    orbitals = [];
    expGems = [];
    chests = [];
    gameTime = 0;
    kills = 0;
    bossActive = false;
    bossSpawnTimes = [];

    // Setup boss spawn times (every 60 seconds starting at 60)
    for (let i = 1; i <= 30; i++) {
        bossSpawnTimes.push(i * 60);
    }

    // Update UI
    document.getElementById('start-message').classList.add('hidden');
    document.getElementById('game-message').classList.add('hidden');
    document.getElementById('level-up-modal').classList.add('hidden');
    updateInventoryUI();

    gameState = 'playing';
    lastTime = performance.now();

    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);

    playSound('start');
}

// =============================================
// WEAPON MANAGEMENT
// =============================================
function addWeapon(weaponId) {
    const existing = player.weapons.find(w => w.id === weaponId);
    if (existing) {
        // Level up existing weapon
        if (existing.level < WEAPONS[weaponId].maxLevel) {
            existing.level++;
            return true;
        }
        return false;
    } else if (player.weapons.length < MAX_WEAPONS) {
        // Add new weapon
        player.weapons.push({ id: weaponId, level: 1 });
        player.weaponStates[weaponId] = {
            cooldown: 0,
            active: []
        };
        return true;
    }
    return false;
}

function addPassive(passiveId) {
    const existing = player.passives.find(p => p.id === passiveId);
    if (existing) {
        // Level up existing passive
        if (existing.level < PASSIVES[passiveId].maxLevel) {
            existing.level++;
            recalculateStats();
            return true;
        }
        return false;
    } else if (player.passives.length < MAX_PASSIVES) {
        // Add new passive
        player.passives.push({ id: passiveId, level: 1 });
        recalculateStats();
        return true;
    }
    return false;
}

function evolveWeapon(weaponId) {
    const weapon = WEAPONS[weaponId];
    if (!weapon || !weapon.evolution) return false;

    const evolvedId = weapon.evolution;
    const weaponIndex = player.weapons.findIndex(w => w.id === weaponId);

    if (weaponIndex >= 0) {
        // Replace base weapon with evolved version
        player.weapons[weaponIndex] = { id: evolvedId, level: 1, evolved: true };
        player.weaponStates[evolvedId] = {
            cooldown: 0,
            active: []
        };
        delete player.weaponStates[weaponId];
        return true;
    }
    return false;
}

function canEvolve(weaponId) {
    const weapon = WEAPONS[weaponId];
    if (!weapon || !weapon.evolution || !weapon.requiredPassive) return false;

    const playerWeapon = player.weapons.find(w => w.id === weaponId);
    if (!playerWeapon || playerWeapon.level < weapon.maxLevel) return false;

    const hasPassive = player.passives.some(p => p.id === weapon.requiredPassive);
    return hasPassive;
}

function recalculateStats() {
    // Start with base stats
    player.might = player.baseMight;
    player.cooldownMod = player.baseCooldown;
    player.area = player.baseArea;
    player.projectileSpeed = player.baseProjectileSpeed;
    player.duration = player.baseDuration;
    player.amount = player.baseAmount;
    player.speed = player.baseSpeed;
    player.maxHealth = player.baseHealth;
    player.armor = player.baseArmor;
    player.recovery = player.baseRecovery;
    player.magnet = player.baseMagnet;
    player.luck = player.baseLuck;
    player.growth = player.baseGrowth;
    player.curse = player.baseCurse;

    // Apply passive bonuses
    for (const passive of player.passives) {
        const def = PASSIVES[passive.id];
        if (!def) continue;

        for (const [stat, bonus] of Object.entries(def.statBonus)) {
            switch (stat) {
                case 'might':
                    player.might += bonus * passive.level;
                    break;
                case 'cooldown':
                    player.cooldownMod += bonus * passive.level;
                    break;
                case 'area':
                    player.area += bonus * passive.level;
                    break;
                case 'projectileSpeed':
                    player.projectileSpeed += bonus * passive.level;
                    break;
                case 'duration':
                    player.duration += bonus * passive.level;
                    break;
                case 'amount':
                    player.amount += bonus * passive.level;
                    break;
                case 'moveSpeed':
                    player.speed += player.baseSpeed * bonus * passive.level;
                    break;
                case 'maxHealth':
                    player.maxHealth += player.baseHealth * bonus * passive.level;
                    break;
                case 'armor':
                    player.armor += bonus * passive.level;
                    break;
                case 'recovery':
                    player.recovery += bonus * passive.level;
                    break;
                case 'magnet':
                    player.magnet += player.baseMagnet * bonus * passive.level;
                    break;
                case 'luck':
                    player.luck += bonus * passive.level;
                    break;
                case 'growth':
                    player.growth += bonus * passive.level;
                    break;
                case 'curse':
                    player.curse += bonus * passive.level;
                    break;
            }
        }
    }

    // Ensure cooldown doesn't go below 0.1
    player.cooldownMod = Math.max(0.1, player.cooldownMod);
}

// =============================================
// MAIN UPDATE LOOP
// =============================================
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

    // Health recovery
    if (player.recovery > 0 && player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + player.recovery * deltaTime);
    }

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

    // Update zones
    updateZones();

    // Update orbitals
    updateOrbitals();

    // Update effects
    updateEffects();

    // Update exp gems
    updateExpGems();

    // Update chests
    updateChests();

    // Check collisions
    checkCollisions();

    // Update UI
    updateUI();

    // Render
    render();

    gameLoop = requestAnimationFrame(update);
}

// =============================================
// PLAYER UPDATE
// =============================================
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

    // Track facing direction
    if (dx !== 0 || dy !== 0) {
        lastMoveDirection = { x: dx, y: dy };
        player.facingRight = dx >= 0;
    }

    // Move player
    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;

    // Keep player in bounds
    const halfSize = PLAYER_SIZE / 2;
    player.x = Math.max(halfSize, Math.min(canvas.width - halfSize, player.x));
    player.y = Math.max(halfSize, Math.min(canvas.height - halfSize, player.y));
}

// =============================================
// WEAPON SYSTEM UPDATE
// =============================================
function updateWeapons() {
    for (const weapon of player.weapons) {
        const state = player.weaponStates[weapon.id];
        if (!state) continue;

        // Update cooldown
        if (state.cooldown > 0) {
            state.cooldown -= deltaTime;
        }

        // Fire weapon if ready
        if (state.cooldown <= 0) {
            fireWeapon(weapon);
        }
    }
}

function fireWeapon(weapon) {
    const def = weapon.evolved ? EVOLVED_WEAPONS[weapon.id] : WEAPONS[weapon.id];
    if (!def) return;

    const state = player.weaponStates[weapon.id];
    const level = weapon.level;

    // Calculate cooldown
    const baseCooldown = def.baseCooldown || 1.0;
    state.cooldown = baseCooldown * player.cooldownMod;

    // Calculate projectile count
    let projectileCount = (def.baseProjectiles || 1) + Math.floor((level - 1) / 2) + player.amount;
    projectileCount = Math.max(1, projectileCount);

    // Weapon-specific behavior
    switch (weapon.id) {
        case 'whip':
        case 'bloodyTear':
            fireWhip(weapon, def, projectileCount);
            break;
        case 'magicWand':
        case 'holyWand':
            fireMagicWand(weapon, def, projectileCount);
            break;
        case 'knife':
        case 'thousandEdge':
            fireKnife(weapon, def, projectileCount);
            break;
        case 'axe':
        case 'deathSpiral':
            fireAxe(weapon, def, projectileCount);
            break;
        case 'cross':
        case 'heavenSword':
            fireCross(weapon, def, projectileCount);
            break;
        case 'kingBible':
        case 'unholyVespers':
            fireKingBible(weapon, def, projectileCount);
            break;
        case 'garlic':
        case 'soulEater':
            fireGarlic(weapon, def);
            break;
        case 'fireWand':
        case 'hellfire':
            fireFireWand(weapon, def, projectileCount);
            break;
        case 'lightning':
        case 'thunderLoop':
            fireLightning(weapon, def);
            break;
        case 'santaWater':
        case 'laBorra':
            fireSantaWater(weapon, def);
            break;
    }

    playSound('shoot');
}

function fireWhip(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const area = (def.baseArea || 1) * player.area;
    const direction = player.facingRight ? 1 : -1;

    for (let i = 0; i < count; i++) {
        const offsetY = count > 1 ? (i - (count - 1) / 2) * 20 : 0;

        effects.push({
            type: 'whip',
            x: player.x + direction * 30,
            y: player.y + offsetY,
            width: 60 * area,
            height: 20 * area,
            direction,
            damage,
            knockback: def.baseKnockback || 1,
            lifesteal: def.lifesteal || 0,
            duration: 0.2,
            timer: 0,
            hit: new Set(),
            color: def.color
        });
    }
}

function fireMagicWand(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const speed = (def.baseSpeed || 300) * player.projectileSpeed;

    // Sort enemies by distance
    const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = Math.hypot(a.x - player.x, a.y - player.y);
        const distB = Math.hypot(b.x - player.x, b.y - player.y);
        return distA - distB;
    });

    for (let i = 0; i < count; i++) {
        const target = sortedEnemies[i % sortedEnemies.length];
        if (!target) break;

        const angle = Math.atan2(target.y - player.y, target.x - player.x);

        projectiles.push({
            type: 'magicWand',
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            piercing: false,
            color: def.color
        });
    }
}

function fireKnife(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const speed = (def.baseSpeed || 400) * player.projectileSpeed;
    const angle = Math.atan2(lastMoveDirection.y, lastMoveDirection.x);

    for (let i = 0; i < count; i++) {
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
        const finalAngle = angle + spread;

        projectiles.push({
            type: 'knife',
            x: player.x,
            y: player.y,
            vx: Math.cos(finalAngle) * speed,
            vy: Math.sin(finalAngle) * speed,
            damage,
            piercing: weapon.id === 'thousandEdge',
            color: def.color
        });
    }
}

function fireAxe(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const speed = (def.baseSpeed || 200) * player.projectileSpeed;

    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Upward with spread
        const direction = i % 2 === 0 ? 1 : -1;

        projectiles.push({
            type: 'axe',
            x: player.x,
            y: player.y,
            vx: direction * speed * 0.3 + (Math.random() - 0.5) * 50,
            vy: -speed,
            gravity: 300,
            damage,
            piercing: def.piercing || false,
            rotation: 0,
            color: def.color
        });
    }
}

function fireCross(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const speed = (def.baseSpeed || 250) * player.projectileSpeed;

    for (let i = 0; i < count; i++) {
        const angle = Math.atan2(lastMoveDirection.y, lastMoveDirection.x) + (i - (count - 1) / 2) * 0.3;

        projectiles.push({
            type: 'cross',
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            piercing: true,
            returning: false,
            maxDist: 200,
            startX: player.x,
            startY: player.y,
            critChance: def.critChance || 0,
            hit: new Set(),
            color: def.color
        });
    }
}

function fireKingBible(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const duration = (def.baseDuration || 3) * player.duration;
    const radius = (def.baseOrbitRadius || 70) * player.area;

    // Clear existing orbitals for this weapon
    orbitals = orbitals.filter(o => o.weaponId !== weapon.id);

    for (let i = 0; i < count; i++) {
        const angleOffset = (i / count) * Math.PI * 2;

        orbitals.push({
            type: 'kingBible',
            weaponId: weapon.id,
            angle: angleOffset,
            radius,
            damage,
            duration,
            timer: 0,
            speed: 3, // Radians per second
            hit: new Set(),
            hitCooldown: {},
            color: def.color
        });
    }
}

function fireGarlic(weapon, def) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const area = (def.baseArea || 40) * player.area;

    effects.push({
        type: 'garlic',
        x: player.x,
        y: player.y,
        radius: area,
        damage,
        knockback: def.baseKnockback || 0.5,
        lifesteal: def.lifesteal || 0,
        duration: 0.3,
        timer: 0,
        hit: new Set(),
        color: def.color
    });
}

function fireFireWand(weapon, def, count) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const speed = (def.baseSpeed || 350) * player.projectileSpeed;

    // Pick random enemies
    const targetEnemies = [...enemies].sort(() => Math.random() - 0.5).slice(0, count);

    for (let i = 0; i < count; i++) {
        const target = targetEnemies[i] || targetEnemies[0];
        if (!target) break;

        const angle = Math.atan2(target.y - player.y, target.x - player.x);

        projectiles.push({
            type: 'fireWand',
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            piercing: false,
            explosion: def.explosion || false,
            color: def.color
        });
    }
}

function fireLightning(weapon, def) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const strikes = (def.baseStrikes || 1) + Math.floor((weapon.level - 1) / 2) + player.amount;
    const chain = def.chain || 0;

    // Pick random enemies
    const targetEnemies = [...enemies].sort(() => Math.random() - 0.5).slice(0, strikes);

    for (const target of targetEnemies) {
        effects.push({
            type: 'lightning',
            x: target.x,
            y: target.y,
            targetId: target,
            damage,
            chain,
            chainedTo: new Set(),
            duration: 0.3,
            timer: 0,
            color: def.color
        });

        // Apply damage immediately
        target.health -= damage;
        if (target.health <= 0) {
            killEnemy(target);
        }
    }
}

function fireSantaWater(weapon, def) {
    const damage = def.baseDamage * player.might * (1 + (weapon.level - 1) * 0.1);
    const area = (def.baseArea || 40) * player.area;
    const duration = (def.baseDuration || 3) * player.duration;

    // Drop at random position near player or follow player
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 100;

    zones.push({
        type: 'santaWater',
        x: player.x + offsetX,
        y: player.y + offsetY,
        radius: area,
        damage,
        duration,
        timer: 0,
        tickRate: 0.3,
        lastTick: 0,
        follows: def.follows || false,
        color: def.color
    });
}

// =============================================
// ENEMY SPAWNING
// =============================================
function spawnEnemies() {
    // Calculate difficulty
    const minute = Math.floor(gameTime / 60);
    const second = gameTime % 60;

    // Base spawn rate (enemies per second)
    let spawnRate = 0.5 + minute * 0.3;
    spawnRate *= player.curse;

    // Max enemies on screen
    if (enemies.length >= MAX_ENEMIES) return;

    // Spawn regular enemies
    if (Math.random() < spawnRate * deltaTime) {
        spawnEnemy(minute);
    }

    // Check for boss spawns
    for (let i = bossSpawnTimes.length - 1; i >= 0; i--) {
        if (gameTime >= bossSpawnTimes[i]) {
            spawnBoss(minute);
            bossSpawnTimes.splice(i, 1);
        }
    }

    // Wave events at specific times
    if (Math.floor(gameTime) % 30 === 0 && Math.floor(gameTime) !== Math.floor(gameTime - deltaTime)) {
        // Spawn wave of enemies
        const waveSize = 5 + minute * 2;
        for (let i = 0; i < waveSize; i++) {
            setTimeout(() => spawnEnemy(minute), i * 100);
        }
    }
}

function spawnEnemy(minute) {
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

    // Enemy types with weights based on time
    const types = [
        { type: 'zombie', weight: 10 },
        { type: 'bat', weight: 5 + minute },
        { type: 'skeleton', weight: Math.max(0, minute - 1) * 3 },
        { type: 'ghost', weight: Math.max(0, minute - 2) * 2 },
        { type: 'demon', weight: Math.max(0, minute - 4) }
    ];

    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedType = 'zombie';

    for (const t of types) {
        rand -= t.weight;
        if (rand <= 0) {
            selectedType = t.type;
            break;
        }
    }

    const baseHealth = 10 + minute * 5;
    const baseSpeed = 30 + minute * 2;
    const baseDamage = 5 + minute * 2;

    let enemy = {
        x, y,
        type: selectedType,
        health: baseHealth,
        maxHealth: baseHealth,
        speed: baseSpeed,
        damage: baseDamage,
        expValue: 1,
        knockbackResist: 0,
        isBoss: false
    };

    // Adjust stats by type
    switch (selectedType) {
        case 'bat':
            enemy.speed *= 1.8;
            enemy.health *= 0.5;
            enemy.maxHealth = enemy.health;
            break;
        case 'skeleton':
            enemy.health *= 1.5;
            enemy.maxHealth = enemy.health;
            enemy.damage *= 1.3;
            enemy.expValue = 2;
            break;
        case 'ghost':
            enemy.speed *= 1.2;
            enemy.knockbackResist = 0.5;
            enemy.expValue = 2;
            break;
        case 'demon':
            enemy.health *= 2;
            enemy.maxHealth = enemy.health;
            enemy.damage *= 1.5;
            enemy.speed *= 0.8;
            enemy.expValue = 3;
            break;
    }

    // Apply curse modifier
    enemy.health *= player.curse;
    enemy.maxHealth = enemy.health;
    enemy.speed *= player.curse;

    enemies.push(enemy);
}

function spawnBoss(minute) {
    // Spawn at edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 50;

    switch (side) {
        case 0: x = canvas.width / 2; y = -margin; break;
        case 1: x = canvas.width + margin; y = canvas.height / 2; break;
        case 2: x = canvas.width / 2; y = canvas.height + margin; break;
        case 3: x = -margin; y = canvas.height / 2; break;
    }

    const bossTypes = ['giantZombie', 'deathKnight', 'werewolf'];
    const bossType = bossTypes[minute % bossTypes.length];

    const boss = {
        x, y,
        type: bossType,
        health: 500 + minute * 200,
        maxHealth: 500 + minute * 200,
        speed: 25 + minute * 2,
        damage: 20 + minute * 5,
        expValue: 20 + minute * 5,
        knockbackResist: 0.9,
        isBoss: true,
        dropChest: true
    };

    enemies.push(boss);
    bossActive = true;
    playSound('bossSpawn');
}

// =============================================
// ENEMY UPDATE
// =============================================
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

        // Remove if too far from player
        if (dist > canvas.width * 2) {
            enemies.splice(i, 1);
        }
    }
}

function killEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index < 0) return;

    // Drop experience gems
    dropExpGems(enemy.x, enemy.y, enemy.expValue);

    // Drop chest if boss
    if (enemy.dropChest) {
        chests.push({
            x: enemy.x,
            y: enemy.y,
            type: 'boss'
        });
        bossActive = false;
    }

    enemies.splice(index, 1);
    kills++;
    playSound('kill');
}

function dropExpGems(x, y, value) {
    // Don't exceed gem cap
    if (expGems.length >= MAX_GEMS) {
        // Create super gem
        expGems.push({
            x, y,
            value: value * 5,
            type: 'red'
        });
        return;
    }

    // Split into appropriate gem types
    while (value > 0) {
        let gemType, gemValue;

        if (value >= 10) {
            gemType = 'red';
            gemValue = 10;
        } else if (value >= 3) {
            gemType = 'green';
            gemValue = 3;
        } else {
            gemType = 'blue';
            gemValue = 1;
        }

        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;

        expGems.push({
            x: x + offsetX,
            y: y + offsetY,
            value: gemValue,
            type: gemType
        });

        value -= gemValue;
    }
}

// =============================================
// PROJECTILE UPDATE
// =============================================
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        // Update position
        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Apply gravity for axes
        if (proj.gravity) {
            proj.vy += proj.gravity * deltaTime;
            proj.rotation = (proj.rotation || 0) + 10 * deltaTime;
        }

        // Cross returning behavior
        if (proj.type === 'cross') {
            const dist = Math.hypot(proj.x - proj.startX, proj.y - proj.startY);
            if (!proj.returning && dist > proj.maxDist) {
                proj.returning = true;
            }
            if (proj.returning) {
                const toPlayerX = player.x - proj.x;
                const toPlayerY = player.y - proj.y;
                const toPlayerDist = Math.hypot(toPlayerX, toPlayerY);
                if (toPlayerDist > 0) {
                    const speed = Math.hypot(proj.vx, proj.vy);
                    proj.vx = (toPlayerX / toPlayerDist) * speed * 1.2;
                    proj.vy = (toPlayerY / toPlayerDist) * speed * 1.2;
                }
                // Remove when back to player
                if (toPlayerDist < 20) {
                    projectiles.splice(i, 1);
                    continue;
                }
            }
        }

        // Remove if off screen
        if (proj.x < -100 || proj.x > canvas.width + 100 ||
            proj.y < -100 || proj.y > canvas.height + 100) {
            projectiles.splice(i, 1);
        }
    }
}

// =============================================
// ZONES UPDATE (Santa Water, etc.)
// =============================================
function updateZones() {
    for (let i = zones.length - 1; i >= 0; i--) {
        const zone = zones[i];

        zone.timer += deltaTime;

        // Follow player if applicable
        if (zone.follows) {
            zone.x = player.x;
            zone.y = player.y;
        }

        // Apply damage on tick
        if (zone.timer - zone.lastTick >= zone.tickRate) {
            zone.lastTick = zone.timer;

            for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
                if (dist < zone.radius) {
                    enemy.health -= zone.damage;
                    if (enemy.health <= 0) {
                        killEnemy(enemy);
                    }
                }
            }
        }

        // Remove expired zones
        if (zone.timer >= zone.duration) {
            zones.splice(i, 1);
        }
    }
}

// =============================================
// ORBITALS UPDATE (King Bible)
// =============================================
function updateOrbitals() {
    for (let i = orbitals.length - 1; i >= 0; i--) {
        const orb = orbitals[i];

        orb.timer += deltaTime;
        orb.angle += orb.speed * deltaTime;

        // Calculate position
        orb.x = player.x + Math.cos(orb.angle) * orb.radius;
        orb.y = player.y + Math.sin(orb.angle) * orb.radius;

        // Update hit cooldowns
        for (const [enemyId, cooldown] of Object.entries(orb.hitCooldown)) {
            orb.hitCooldown[enemyId] -= deltaTime;
            if (orb.hitCooldown[enemyId] <= 0) {
                delete orb.hitCooldown[enemyId];
            }
        }

        // Check collision with enemies
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - orb.x, enemy.y - orb.y);
            if (dist < 20 && !orb.hitCooldown[enemies.indexOf(enemy)]) {
                enemy.health -= orb.damage;
                orb.hitCooldown[enemies.indexOf(enemy)] = 0.5;
                playSound('hit');

                if (enemy.health <= 0) {
                    killEnemy(enemy);
                }
            }
        }

        // Remove expired orbitals
        if (orb.timer >= orb.duration) {
            orbitals.splice(i, 1);
        }
    }
}

// =============================================
// EFFECTS UPDATE
// =============================================
function updateEffects() {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.timer += deltaTime;

        // Handle whip effect
        if (effect.type === 'whip') {
            for (const enemy of enemies) {
                if (effect.hit.has(enemies.indexOf(enemy))) continue;

                const inX = enemy.x > effect.x - effect.width / 2 &&
                           enemy.x < effect.x + effect.width / 2;
                const inY = enemy.y > effect.y - effect.height / 2 &&
                           enemy.y < effect.y + effect.height / 2;

                if (inX && inY) {
                    enemy.health -= effect.damage;
                    effect.hit.add(enemies.indexOf(enemy));

                    // Knockback
                    const kb = effect.knockback * (1 - enemy.knockbackResist);
                    enemy.x += effect.direction * kb * 20;

                    // Lifesteal
                    if (effect.lifesteal > 0) {
                        player.health = Math.min(player.maxHealth,
                            player.health + effect.damage * effect.lifesteal);
                    }

                    playSound('hit');

                    if (enemy.health <= 0) {
                        killEnemy(enemy);
                    }
                }
            }
        }

        // Handle garlic effect
        if (effect.type === 'garlic') {
            effect.x = player.x;
            effect.y = player.y;

            for (const enemy of enemies) {
                if (effect.hit.has(enemies.indexOf(enemy))) continue;

                const dist = Math.hypot(enemy.x - effect.x, enemy.y - effect.y);
                if (dist < effect.radius) {
                    enemy.health -= effect.damage;
                    effect.hit.add(enemies.indexOf(enemy));

                    // Knockback
                    const dx = enemy.x - effect.x;
                    const dy = enemy.y - effect.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const kb = effect.knockback * (1 - enemy.knockbackResist);
                    enemy.x += (dx / len) * kb * 30;
                    enemy.y += (dy / len) * kb * 30;

                    // Lifesteal
                    if (effect.lifesteal > 0) {
                        player.health = Math.min(player.maxHealth,
                            player.health + effect.damage * effect.lifesteal);
                    }

                    if (enemy.health <= 0) {
                        killEnemy(enemy);
                    }
                }
            }
        }

        // Remove expired effects
        if (effect.timer >= effect.duration) {
            effects.splice(i, 1);
        }
    }
}

// =============================================
// EXP GEMS UPDATE
// =============================================
function updateExpGems() {
    for (let i = expGems.length - 1; i >= 0; i--) {
        const gem = expGems[i];

        // Attract to player
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.magnet) {
            const attractSpeed = 300 + (player.magnet - dist) * 3;
            gem.x += (dx / dist) * attractSpeed * deltaTime;
            gem.y += (dy / dist) * attractSpeed * deltaTime;
        }
    }
}

// =============================================
// CHESTS UPDATE
// =============================================
function updateChests() {
    for (let i = chests.length - 1; i >= 0; i--) {
        const chest = chests[i];

        // Check player collision
        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (dist < 30) {
            openChest(chest);
            chests.splice(i, 1);
        }
    }
}

function openChest(chest) {
    // Check for weapon evolutions
    const evolvableWeapons = player.weapons.filter(w => !w.evolved && canEvolve(w.id));

    if (evolvableWeapons.length > 0) {
        // Evolve a weapon!
        const weapon = evolvableWeapons[0];
        evolveWeapon(weapon.id);
        showChestReward(`${WEAPONS[weapon.id].name} evolved into ${EVOLVED_WEAPONS[WEAPONS[weapon.id].evolution].name}!`);
    } else {
        // Give random upgrades
        gameState = 'chest';
        showUpgradeOptions(true);
    }

    playSound('chest');
}

function showChestReward(message) {
    const modal = document.getElementById('level-up-modal');
    modal.querySelector('h2').textContent = 'EVOLUTION!';

    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = `
        <div class="evolution-message">${message}</div>
        <button class="upgrade-btn continue-btn" onclick="closeChestModal()">
            <div class="upgrade-name">Continue</div>
        </button>
    `;

    modal.classList.remove('hidden');
    gameState = 'chest';
}

function closeChestModal() {
    document.getElementById('level-up-modal').classList.add('hidden');
    document.getElementById('level-up-modal').querySelector('h2').textContent = 'LEVEL UP!';
    gameState = 'playing';
    lastTime = performance.now();
}

// =============================================
// COLLISION DETECTION
// =============================================
function checkCollisions() {
    // Projectiles vs Enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            // Skip if cross already hit this enemy
            if (proj.hit && proj.hit.has(j)) continue;

            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < (PROJECTILE_SIZE + ENEMY_SIZE) / 2 + 5) {
                let damage = proj.damage;

                // Critical hit for cross
                if (proj.critChance && Math.random() < proj.critChance * player.luck) {
                    damage *= 2;
                }

                enemy.health -= damage;
                playSound('hit');

                // Explosion effect
                if (proj.explosion) {
                    effects.push({
                        type: 'explosion',
                        x: proj.x,
                        y: proj.y,
                        radius: 50 * player.area,
                        damage: proj.damage * 0.5,
                        duration: 0.3,
                        timer: 0,
                        hit: new Set(),
                        color: proj.color
                    });
                }

                if (enemy.health <= 0) {
                    killEnemy(enemy);
                }

                // Handle piercing
                if (proj.piercing) {
                    if (proj.hit) {
                        proj.hit.add(j);
                    }
                } else {
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Explosion effects
    for (const effect of effects) {
        if (effect.type === 'explosion' && effect.timer < 0.1) {
            for (const enemy of enemies) {
                if (effect.hit.has(enemies.indexOf(enemy))) continue;

                const dist = Math.hypot(enemy.x - effect.x, enemy.y - effect.y);
                if (dist < effect.radius) {
                    enemy.health -= effect.damage;
                    effect.hit.add(enemies.indexOf(enemy));

                    if (enemy.health <= 0) {
                        killEnemy(enemy);
                    }
                }
            }
        }
    }

    // Player vs Enemies (damage)
    for (const enemy of enemies) {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
            let damage = enemy.damage * deltaTime;
            damage = Math.max(0, damage - player.armor * deltaTime);
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
            const expGain = gem.value * player.growth;
            player.exp += expGain;
            expGems.splice(i, 1);
            playSound('pickup');

            // Check level up
            while (player.exp >= player.expToNextLevel) {
                levelUp();
            }
        }
    }
}

// =============================================
// LEVEL UP
// =============================================
function levelUp() {
    player.level++;
    player.exp -= player.expToNextLevel;
    player.expToNextLevel = Math.floor(5 + player.level * 3 + Math.pow(player.level, 1.5));

    gameState = 'levelup';
    playSound('levelup');

    showUpgradeOptions(false);
}

function showUpgradeOptions(isChest) {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';

    // Generate upgrade options
    const options = generateUpgradeOptions(isChest);

    options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.innerHTML = `
            <div class="upgrade-icon" style="background-color: ${option.color}">${option.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${option.name}${option.level ? ` Lv.${option.level}` : ''}</div>
                <div class="upgrade-desc">${option.description}</div>
            </div>
            <div class="upgrade-key">${index + 1}</div>
        `;
        btn.onclick = () => selectUpgrade(option);
        optionsContainer.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function generateUpgradeOptions(isChest) {
    const options = [];
    const numOptions = isChest ? 3 : 4;

    // Get available weapons and passives
    const availableWeapons = [];
    const availablePassives = [];

    // Check existing weapons that can level up
    for (const weapon of player.weapons) {
        const def = weapon.evolved ? EVOLVED_WEAPONS[weapon.id] : WEAPONS[weapon.id];
        const maxLevel = def.maxLevel || 8;
        if (weapon.level < maxLevel) {
            availableWeapons.push({
                type: 'weaponUpgrade',
                id: weapon.id,
                level: weapon.level + 1,
                name: def.name,
                description: `Level ${weapon.level} → ${weapon.level + 1}`,
                color: def.color,
                icon: '⚔️'
            });
        }
    }

    // Check new weapons
    if (player.weapons.length < MAX_WEAPONS) {
        for (const [id, def] of Object.entries(WEAPONS)) {
            if (!player.weapons.find(w => w.id === id)) {
                availableWeapons.push({
                    type: 'newWeapon',
                    id,
                    level: 1,
                    name: def.name,
                    description: def.description,
                    color: def.color,
                    icon: '✨'
                });
            }
        }
    }

    // Check existing passives that can level up
    for (const passive of player.passives) {
        const def = PASSIVES[passive.id];
        if (passive.level < def.maxLevel) {
            availablePassives.push({
                type: 'passiveUpgrade',
                id: passive.id,
                level: passive.level + 1,
                name: def.name,
                description: `Level ${passive.level} → ${passive.level + 1}`,
                color: def.color,
                icon: '💎'
            });
        }
    }

    // Check new passives
    if (player.passives.length < MAX_PASSIVES) {
        for (const [id, def] of Object.entries(PASSIVES)) {
            if (!player.passives.find(p => p.id === id)) {
                availablePassives.push({
                    type: 'newPassive',
                    id,
                    level: 1,
                    name: def.name,
                    description: def.description,
                    color: def.color,
                    icon: '🔮'
                });
            }
        }
    }

    // Combine and shuffle
    const allOptions = [...availableWeapons, ...availablePassives];

    // Sort by luck (more luck = better items more likely)
    allOptions.sort(() => Math.random() - 0.5 + (player.luck - 1) * 0.2);

    // Pick options
    for (let i = 0; i < numOptions && allOptions.length > 0; i++) {
        const index = Math.floor(Math.random() * Math.min(allOptions.length, 5));
        options.push(allOptions.splice(index, 1)[0]);
    }

    // Add gold/skip option if nothing available
    if (options.length === 0) {
        options.push({
            type: 'skip',
            name: 'Skip',
            description: 'No upgrades available',
            color: '#888888',
            icon: '➡️'
        });
    }

    return options;
}

function selectUpgrade(option) {
    switch (option.type) {
        case 'newWeapon':
            addWeapon(option.id);
            break;
        case 'weaponUpgrade':
            const weapon = player.weapons.find(w => w.id === option.id);
            if (weapon) weapon.level++;
            break;
        case 'newPassive':
            addPassive(option.id);
            break;
        case 'passiveUpgrade':
            const passive = player.passives.find(p => p.id === option.id);
            if (passive) {
                passive.level++;
                recalculateStats();
            }
            break;
    }

    playSound('upgrade');
    document.getElementById('level-up-modal').classList.add('hidden');
    updateInventoryUI();

    gameState = 'playing';
    lastTime = performance.now();
}

// =============================================
// GAME OVER
// =============================================
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
    messageDiv.querySelector('p').textContent = `Survived: ${formatTime(gameTime)} | Kills: ${kills} | Level: ${player.level}`;
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

// =============================================
// UI UPDATES
// =============================================
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

function updateInventoryUI() {
    // Update weapon slots display
    const weaponSlots = document.getElementById('weapon-slots');
    if (weaponSlots) {
        weaponSlots.innerHTML = '';
        for (const weapon of player.weapons) {
            const def = weapon.evolved ? EVOLVED_WEAPONS[weapon.id] : WEAPONS[weapon.id];
            const slot = document.createElement('div');
            slot.className = 'inventory-slot weapon-slot';
            slot.style.borderColor = def.color;
            slot.innerHTML = `
                <div class="slot-icon" style="background-color: ${def.color}">⚔️</div>
                <div class="slot-level">Lv${weapon.level}</div>
            `;
            slot.title = `${def.name} Lv.${weapon.level}`;
            weaponSlots.appendChild(slot);
        }
    }

    // Update passive slots display
    const passiveSlots = document.getElementById('passive-slots');
    if (passiveSlots) {
        passiveSlots.innerHTML = '';
        for (const passive of player.passives) {
            const def = PASSIVES[passive.id];
            const slot = document.createElement('div');
            slot.className = 'inventory-slot passive-slot';
            slot.style.borderColor = def.color;
            slot.innerHTML = `
                <div class="slot-icon" style="background-color: ${def.color}">💎</div>
                <div class="slot-level">Lv${passive.level}</div>
            `;
            slot.title = `${def.name} Lv.${passive.level}`;
            passiveSlots.appendChild(slot);
        }
    }
}

function updateBestTimeDisplay() {
    document.getElementById('best-time').textContent = formatTime(bestTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// RENDERING
// =============================================
function render() {
    // Clear canvas
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#0a0a14' : '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') return;

    // Draw ground grid
    drawPixelGrid();

    // Draw zones (Santa Water, etc.)
    drawZones();

    // Draw exp gems
    drawExpGems();

    // Draw chests
    drawChests();

    // Draw projectiles
    drawProjectiles();

    // Draw orbitals
    drawOrbitals();

    // Draw effects
    drawEffects();

    // Draw enemies
    drawEnemies();

    // Draw player
    drawPlayer();

    // Draw HUD elements on canvas (weapon/passive inventory)
    drawInventoryHUD();
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
    const flip = player.facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);

    // Body (blue tunic)
    ctx.fillStyle = '#4466aa';
    drawPixelRect(-4, -2, 8, 8);

    // Head (skin)
    ctx.fillStyle = '#ffcc99';
    drawPixelRect(-3, -8, 6, 6);

    // Hair (brown)
    ctx.fillStyle = '#664422';
    drawPixelRect(-3, -9, 6, 2);
    drawPixelRect(-4, -8, 2, 4);
    drawPixelRect(2, -8, 2, 4);

    // Eyes
    ctx.fillStyle = '#000000';
    drawPixelRect(-2, -6, 2, 2);
    drawPixelRect(1, -6, 2, 2);

    // Arms
    ctx.fillStyle = '#ffcc99';
    drawPixelRect(-6, -1, 2, 6);
    drawPixelRect(4, -1, 2, 6);

    // Legs
    ctx.fillStyle = '#553322';
    drawPixelRect(-3, 6, 3, 4);
    drawPixelRect(0, 6, 3, 4);

    ctx.restore();
}

function drawEnemies() {
    for (const enemy of enemies) {
        const x = Math.floor(enemy.x);
        const y = Math.floor(enemy.y);
        const scale = enemy.isBoss ? 2 : 1;

        ctx.imageSmoothingEnabled = false;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        switch (enemy.type) {
            case 'bat':
                // Bat enemy
                ctx.fillStyle = '#44aa44';
                drawPixelRect(-4, -2, 8, 4);
                ctx.fillStyle = '#338833';
                drawPixelRect(-8, -1, 4, 2);
                drawPixelRect(4, -1, 4, 2);
                ctx.fillStyle = '#ff0000';
                drawPixelRect(-2, -1, 2, 2);
                drawPixelRect(1, -1, 2, 2);
                break;

            case 'skeleton':
                // Skeleton
                ctx.fillStyle = '#cccccc';
                drawPixelRect(-5, -8, 10, 8);
                drawPixelRect(-4, 0, 8, 8);
                ctx.fillStyle = '#000000';
                drawPixelRect(-3, -6, 3, 3);
                drawPixelRect(1, -6, 3, 3);
                ctx.fillStyle = '#888888';
                drawPixelRect(-3, 1, 6, 1);
                drawPixelRect(-3, 3, 6, 1);
                drawPixelRect(-3, 5, 6, 1);
                break;

            case 'ghost':
                // Ghost
                ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
                drawPixelRect(-5, -6, 10, 12);
                ctx.fillStyle = '#000000';
                drawPixelRect(-3, -4, 3, 3);
                drawPixelRect(1, -4, 3, 3);
                break;

            case 'demon':
                // Demon
                ctx.fillStyle = '#aa2222';
                drawPixelRect(-5, -6, 10, 10);
                ctx.fillStyle = '#ff4444';
                drawPixelRect(-6, -8, 3, 4);
                drawPixelRect(3, -8, 3, 4);
                ctx.fillStyle = '#ffff00';
                drawPixelRect(-3, -4, 3, 2);
                drawPixelRect(1, -4, 3, 2);
                break;

            case 'giantZombie':
            case 'deathKnight':
            case 'werewolf':
                // Boss variants (purple-ish zombie base)
                ctx.fillStyle = enemy.type === 'giantZombie' ? '#8844aa' :
                               enemy.type === 'deathKnight' ? '#444488' : '#884422';
                drawPixelRect(-5, -3, 10, 10);
                ctx.fillStyle = '#77aa77';
                drawPixelRect(-4, -8, 8, 6);
                ctx.fillStyle = '#ff4444';
                drawPixelRect(-3, -6, 3, 2);
                drawPixelRect(1, -6, 3, 2);
                ctx.fillStyle = '#77aa77';
                drawPixelRect(-7, -2, 2, 6);
                drawPixelRect(5, -2, 2, 6);
                break;

            default:
                // Default zombie
                ctx.fillStyle = '#8844aa';
                drawPixelRect(-4, -2, 8, 8);
                ctx.fillStyle = '#77aa77';
                drawPixelRect(-3, -7, 6, 5);
                ctx.fillStyle = '#ff4444';
                drawPixelRect(-2, -5, 2, 2);
                drawPixelRect(1, -5, 2, 2);
                ctx.fillStyle = '#77aa77';
                drawPixelRect(-6, -1, 2, 5);
                drawPixelRect(4, -1, 2, 5);
        }

        ctx.restore();

        // Health bar for damaged enemies
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.isBoss ? 40 : 16;
            const barHeight = 3;
            ctx.fillStyle = '#440000';
            ctx.fillRect(x - barWidth / 2, y - 15 * scale, barWidth, barHeight);
            ctx.fillStyle = enemy.isBoss ? '#ff8800' : '#ff4444';
            ctx.fillRect(x - barWidth / 2, y - 15 * scale, barWidth * (enemy.health / enemy.maxHealth), barHeight);
        }

        // Boss indicator
        if (enemy.isBoss) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', x, y - 30);
        }
    }
}

function drawProjectiles() {
    for (const proj of projectiles) {
        const x = Math.floor(proj.x);
        const y = Math.floor(proj.y);

        ctx.fillStyle = proj.color || '#ffff44';

        switch (proj.type) {
            case 'knife':
            case 'thousandEdge':
                // Knife shape
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.atan2(proj.vy, proj.vx));
                ctx.fillRect(-6, -2, 12, 4);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(3, -1, 3, 2);
                ctx.restore();
                break;

            case 'axe':
            case 'deathSpiral':
                // Rotating axe
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(proj.rotation || 0);
                ctx.fillRect(-8, -4, 16, 8);
                ctx.fillStyle = '#666666';
                ctx.fillRect(-2, -6, 4, 12);
                ctx.restore();
                break;

            case 'cross':
            case 'heavenSword':
                // Cross shape
                ctx.fillRect(x - 2, y - 8, 4, 16);
                ctx.fillRect(x - 6, y - 2, 12, 4);
                break;

            case 'fireWand':
            case 'hellfire':
                // Fireball
                ctx.fillStyle = '#ff4400';
                drawPixelRect(x - 4, y - 4, 8, 8);
                ctx.fillStyle = '#ffff00';
                drawPixelRect(x - 2, y - 2, 4, 4);
                break;

            default:
                // Energy ball
                drawPixelRect(x - 3, y - 3, 6, 6);
                ctx.fillStyle = '#ffffff';
                drawPixelRect(x - 1, y - 1, 2, 2);
        }
    }
}

function drawOrbitals() {
    for (const orb of orbitals) {
        const x = Math.floor(orb.x);
        const y = Math.floor(orb.y);

        ctx.fillStyle = orb.color || '#4169E1';

        // Bible book shape
        ctx.fillRect(x - 6, y - 4, 12, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 3, 2, 6);
    }
}

function drawZones() {
    for (const zone of zones) {
        ctx.fillStyle = zone.color || '#87CEEB';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawEffects() {
    for (const effect of effects) {
        const progress = effect.timer / effect.duration;

        switch (effect.type) {
            case 'whip':
                ctx.fillStyle = effect.color || '#8B4513';
                ctx.globalAlpha = 1 - progress;
                ctx.fillRect(
                    effect.x - effect.width / 2,
                    effect.y - effect.height / 2,
                    effect.width * progress,
                    effect.height
                );
                ctx.globalAlpha = 1;
                break;

            case 'garlic':
                ctx.strokeStyle = effect.color || '#F5F5DC';
                ctx.globalAlpha = 0.5 * (1 - progress);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius * (0.5 + progress * 0.5), 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;

            case 'lightning':
                ctx.strokeStyle = effect.color || '#00FFFF';
                ctx.globalAlpha = 1 - progress;
                ctx.lineWidth = 3;
                // Draw lightning bolt
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y - 50);
                ctx.lineTo(effect.x + 5, effect.y - 25);
                ctx.lineTo(effect.x - 5, effect.y - 20);
                ctx.lineTo(effect.x, effect.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;

            case 'explosion':
                ctx.fillStyle = effect.color || '#FF4500';
                ctx.globalAlpha = 0.5 * (1 - progress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius * progress, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
        }
    }
}

function drawExpGems() {
    for (const gem of expGems) {
        const x = Math.floor(gem.x);
        const y = Math.floor(gem.y);

        // Color based on gem type
        switch (gem.type) {
            case 'red':
                ctx.fillStyle = '#ff4444';
                break;
            case 'green':
                ctx.fillStyle = '#44ff44';
                break;
            default:
                ctx.fillStyle = '#44aaff';
        }

        // Diamond shape
        const size = gem.type === 'red' ? 6 : gem.type === 'green' ? 5 : 4;
        drawPixelRect(x - size/2, y - size, size, size/2);
        drawPixelRect(x - size/2 - 1, y - size/2, size + 2, size/2);
        drawPixelRect(x - size/2, y, size, size/2);
        drawPixelRect(x - size/4, y + size/2, size/2, size/2);

        // Highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        drawPixelRect(x - size/4, y - size + 1, size/2, 1);
        ctx.globalAlpha = 1;
    }
}

function drawChests() {
    for (const chest of chests) {
        const x = Math.floor(chest.x);
        const y = Math.floor(chest.y);

        // Chest body
        ctx.fillStyle = '#8B4513';
        drawPixelRect(x - 10, y - 6, 20, 12);

        // Chest lid
        ctx.fillStyle = '#A0522D';
        drawPixelRect(x - 12, y - 10, 24, 6);

        // Gold trim
        ctx.fillStyle = '#FFD700';
        drawPixelRect(x - 12, y - 4, 24, 2);
        drawPixelRect(x - 2, y - 10, 4, 10);

        // Keyhole
        ctx.fillStyle = '#000000';
        drawPixelRect(x - 1, y - 2, 2, 3);
    }
}

function drawInventoryHUD() {
    // Draw weapon icons at bottom left
    const startX = 10;
    const startY = canvas.height - 30;
    const slotSize = 24;
    const gap = 4;

    // Weapon slots
    for (let i = 0; i < MAX_WEAPONS; i++) {
        const x = startX + (slotSize + gap) * i;

        // Slot background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, startY, slotSize, slotSize);

        if (player.weapons[i]) {
            const weapon = player.weapons[i];
            const def = weapon.evolved ? EVOLVED_WEAPONS[weapon.id] : WEAPONS[weapon.id];

            // Colored fill
            ctx.fillStyle = def.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x + 2, startY + 2, slotSize - 4, slotSize - 4);
            ctx.globalAlpha = 1;

            // Level indicator
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.fillText(weapon.level.toString(), x + slotSize - 8, startY + slotSize - 4);
        }

        // Border
        ctx.strokeStyle = player.weapons[i] ? '#ffd700' : '#444444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, startY, slotSize, slotSize);
    }

    // Passive slots (below weapons)
    const passiveY = startY - slotSize - gap;
    for (let i = 0; i < MAX_PASSIVES; i++) {
        const x = startX + (slotSize + gap) * i;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, passiveY, slotSize, slotSize);

        if (player.passives[i]) {
            const passive = player.passives[i];
            const def = PASSIVES[passive.id];

            ctx.fillStyle = def.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x + 2, passiveY + 2, slotSize - 4, slotSize - 4);
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.fillText(passive.level.toString(), x + slotSize - 8, passiveY + slotSize - 4);
        }

        ctx.strokeStyle = player.passives[i] ? '#44aaff' : '#444444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, passiveY, slotSize, slotSize);
    }

    // Timer warning when boss is coming
    const nextBossTime = bossSpawnTimes[0];
    if (nextBossTime && nextBossTime - gameTime < 10) {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS IN ${Math.ceil(nextBossTime - gameTime)}s!`, canvas.width / 2, 80);
        ctx.textAlign = 'left';
    }
}

function drawPixelRect(x, y, width, height) {
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

// =============================================
// SOUND EFFECTS
// =============================================
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
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.03);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.03);
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.03);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.03);
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
            case 'chest':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
                break;
            case 'bossSpawn':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(80, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
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

// Make closeChestModal globally accessible
window.closeChestModal = closeChestModal;

// Initialize the game
init();
