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
const VICTORY_TIME = 1800; // 30 minutes in seconds

// Game state
let gameState = 'menu'; // menu, playing, paused, levelup, gameover, victory
let gameLoop = null;
let lastTime = 0;
let deltaTime = 0;

// Game stats
let gameTime = 0;
let kills = 0;
let coins = 0;
let bestTime = parseInt(localStorage.getItem('survivor-best-time')) || 0;

// Character definitions
const CHARACTERS = {
    antonio: {
        name: 'Antonio',
        icon: '🗡️',
        desc: '+10% Damage, +1 HP/level',
        startingWeapon: 'whip',
        stats: { damage: 1.1, maxHealth: 1.0, moveSpeed: 1.0, armor: 0, regen: 0, cooldown: 1.0 },
        levelBonus: { maxHealth: 1 }
    },
    imelda: {
        name: 'Imelda',
        icon: '📚',
        desc: '+10% EXP, Magic Wand start',
        startingWeapon: 'magicWand',
        stats: { damage: 1.0, maxHealth: 1.0, moveSpeed: 1.0, armor: 0, regen: 0, cooldown: 1.0 },
        expBonus: 1.1
    },
    gennaro: {
        name: 'Gennaro',
        icon: '🗡️',
        desc: '+1 Projectile, Knife start',
        startingWeapon: 'knife',
        stats: { damage: 1.0, maxHealth: 1.0, moveSpeed: 1.0, armor: 0, regen: 0, cooldown: 1.0 },
        amountBonus: 1
    },
    pasqualina: {
        name: 'Pasqualina',
        icon: '⚡',
        desc: '+10% Speed, Runetracer start',
        startingWeapon: 'runetracer',
        stats: { damage: 1.0, maxHealth: 1.0, moveSpeed: 1.1, armor: 0, regen: 0, cooldown: 1.0 }
    },
    poe: {
        name: 'Poe',
        icon: '🧄',
        desc: '-30% HP, +25% Pickup, Garlic start',
        startingWeapon: 'garlic',
        stats: { damage: 1.0, maxHealth: 0.7, moveSpeed: 1.0, armor: 0, regen: 0, cooldown: 1.0 },
        pickupBonus: 1.25
    },
    arca: {
        name: 'Arca',
        icon: '🔥',
        desc: '-5% Cooldown, Fire Wand start',
        startingWeapon: 'fireball',
        stats: { damage: 1.0, maxHealth: 1.0, moveSpeed: 1.0, armor: 0, regen: 0, cooldown: 0.95 }
    },
    porta: {
        name: 'Porta',
        icon: '⚡',
        desc: '+30% Area, Lightning Ring start',
        startingWeapon: 'lightning',
        stats: { damage: 1.0, maxHealth: 1.0, moveSpeed: 1.0, armor: 0, regen: 0, cooldown: 1.0 },
        areaBonus: 1.3
    },
    dommario: {
        name: 'Dommario',
        icon: '📖',
        desc: '+40% Duration, King Bible start',
        startingWeapon: 'bible',
        stats: { damage: 1.0, maxHealth: 1.0, moveSpeed: 0.8, armor: 0, regen: 0, cooldown: 1.0 },
        durationBonus: 1.4
    }
};

let selectedCharacter = 'antonio';
let selectedArcana = null; // Starting arcana selection
let arcanaSelectionMode = false; // For arcana selection at start

// Weapon definitions (matching Vampire Survivors)
const WEAPON_TYPES = {
    whip: {
        name: 'Whip',
        desc: 'Attacks horizontally, passes through enemies',
        icon: '🔪',
        damage: 10,
        cooldown: 1.15,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        evolvesTo: 'bloodyTear',
        requiresPassive: 'hollowHeart',
        rarity: 'common'
    },
    magicWand: {
        name: 'Magic Wand',
        desc: 'Fires at the nearest enemy',
        icon: '🪄',
        damage: 10,
        cooldown: 0.95,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: 0,
        evolvesTo: 'holyWand',
        requiresPassive: 'emptyTome',
        rarity: 'common'
    },
    knife: {
        name: 'Knife',
        desc: 'Fires quickly in the faced direction',
        icon: '🗡️',
        damage: 8,
        cooldown: 0.35,
        area: 0.8,
        speed: 2.0,
        amount: 1,
        pierce: 1,
        evolvesTo: 'thousandEdge',
        requiresPassive: 'bracer',
        rarity: 'common'
    },
    axe: {
        name: 'Axe',
        desc: 'High damage, thrown with random angle',
        icon: '🪓',
        damage: 20,
        cooldown: 1.45,
        area: 1.15,
        speed: 0.8,
        amount: 1,
        pierce: 3,
        evolvesTo: 'deathSpiral',
        requiresPassive: 'candelabrador',
        rarity: 'uncommon'
    },
    fireball: {
        name: 'Fire Wand',
        desc: 'Fires at random enemies, deals high damage',
        icon: '🔥',
        damage: 20,
        cooldown: 1.4,
        area: 1.0,
        speed: 0.9,
        amount: 1,
        pierce: 0,
        evolvesTo: 'hellfire',
        requiresPassive: 'spinach',
        rarity: 'uncommon'
    },
    holyWater: {
        name: 'Santa Water',
        desc: 'Generates damaging zones',
        icon: '💧',
        damage: 10,
        cooldown: 3.0,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        evolvesTo: 'laBorra',
        requiresPassive: 'attractorb',
        rarity: 'uncommon'
    },
    bible: {
        name: 'King Bible',
        desc: 'Orbits around the character',
        icon: '📖',
        damage: 10,
        cooldown: 3.0,
        area: 1.0,
        speed: 0.5,
        amount: 1,
        pierce: -1,
        duration: 3.5,
        evolvesTo: 'unholyVespers',
        requiresPassive: 'spellbinder',
        rarity: 'uncommon'
    },
    cross: {
        name: 'Cross',
        desc: 'Boomerang that returns after hitting',
        icon: '✝️',
        damage: 15,
        cooldown: 1.0,
        area: 1.0,
        speed: 1.5,
        amount: 1,
        pierce: 5,
        evolvesTo: 'heavenSword',
        requiresPassive: 'clover',
        rarity: 'uncommon'
    },
    garlic: {
        name: 'Garlic',
        desc: 'Damages nearby enemies, reduces resistance',
        icon: '🧄',
        damage: 5,
        cooldown: 0.6,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        evolvesTo: 'soulEater',
        requiresPassive: 'pummarola',
        rarity: 'common'
    },
    lightning: {
        name: 'Lightning Ring',
        desc: 'Strikes random enemies',
        icon: '⚡',
        damage: 15,
        cooldown: 0.8,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: 0,
        evolvesTo: 'thunderLoop',
        requiresPassive: 'duplicator',
        rarity: 'rare'
    },
    runetracer: {
        name: 'Runetracer',
        desc: 'Bounces around the screen',
        icon: '💠',
        damage: 10,
        cooldown: 2.0,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: 10,
        duration: 10,
        evolvesTo: 'noFuture',
        requiresPassive: 'armor',
        rarity: 'rare'
    },
    pentagram: {
        name: 'Pentagram',
        desc: 'Erases everything in sight',
        icon: '⭐',
        damage: 9999,
        cooldown: 6.0,
        area: 1.0,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        evolvesTo: 'gorgeousMoon',
        requiresPassive: 'crown',
        rarity: 'legendary'
    }
};

// Evolved weapon definitions
const EVOLVED_WEAPONS = {
    bloodyTear: {
        name: 'Bloody Tear',
        desc: 'Evolved Whip - Critical hits and heals on kill',
        icon: '🩸',
        damageMultiplier: 1.5,
        healsOnKill: 2,
        critChance: 0.1
    },
    holyWand: {
        name: 'Holy Wand',
        desc: 'Evolved Wand - No cooldown, fires rapidly',
        icon: '✨',
        damageMultiplier: 1.0,
        cooldownMultiplier: 0.3
    },
    thousandEdge: {
        name: 'Thousand Edge',
        desc: 'Evolved Knife - Fires many projectiles',
        icon: '⚔️',
        damageMultiplier: 1.0,
        amountBonus: 3,
        noCooldown: true
    },
    deathSpiral: {
        name: 'Death Spiral',
        desc: 'Evolved Axe - Orbits around player',
        icon: '💀',
        damageMultiplier: 1.2,
        orbits: true
    },
    hellfire: {
        name: 'Hellfire',
        desc: 'Evolved Fire - Causes explosions',
        icon: '☄️',
        damageMultiplier: 1.5,
        explosive: true
    },
    laBorra: {
        name: 'La Borra',
        desc: 'Evolved Water - Follows the player',
        icon: '🌊',
        damageMultiplier: 1.2,
        followsPlayer: true
    },
    unholyVespers: {
        name: 'Unholy Vespers',
        desc: 'Evolved Bible - Never expires',
        icon: '📕',
        damageMultiplier: 1.3,
        permanent: true,
        amountBonus: 2
    },
    heavenSword: {
        name: 'Heaven Sword',
        desc: 'Evolved Cross - Larger and deals more damage',
        icon: '🗡️',
        damageMultiplier: 2.0,
        areaMultiplier: 1.5
    },
    soulEater: {
        name: 'Soul Eater',
        desc: 'Evolved Garlic - Steals health from enemies',
        icon: '👻',
        damageMultiplier: 1.5,
        healsOnHit: true
    },
    thunderLoop: {
        name: 'Thunder Loop',
        desc: 'Evolved Lightning - Chains between enemies',
        icon: '🌩️',
        damageMultiplier: 1.3,
        chains: 3
    },
    noFuture: {
        name: 'NO FUTURE',
        desc: 'Evolved Runetracer - Explodes on expiration',
        icon: '💥',
        damageMultiplier: 1.5,
        explodesOnEnd: true
    },
    gorgeousMoon: {
        name: 'Gorgeous Moon',
        desc: 'Evolved Pentagram - Generates gems',
        icon: '🌙',
        damageMultiplier: 1.0,
        generatesGems: true
    }
};

// Arcana definitions (game modifiers like Vampire Survivors)
const ARCANA_TYPES = {
    sarabande: {
        name: 'I - Sarabande of Healing',
        desc: 'Healing is more effective. +50% healing from all sources.',
        icon: '💚',
        effect: { healingBoost: 0.5 }
    },
    twilight: {
        name: 'II - Twilight Requiem',
        desc: 'Projectiles explode on hit. Explosions deal 30% damage.',
        icon: '💥',
        effect: { projectileExplode: true, explosionDamage: 0.3 }
    },
    tragedy: {
        name: 'III - Tragic Princess',
        desc: 'The faster you move, the more damage you deal. Up to +50%.',
        icon: '👸',
        effect: { movementDamage: true }
    },
    slash: {
        name: 'IV - Slash',
        desc: 'All weapons have +3 pierce.',
        icon: '⚔️',
        effect: { pierceBonus: 3 }
    },
    chaos: {
        name: 'V - Chaos Malachite',
        desc: '+100% projectile speed but -25% duration.',
        icon: '💎',
        effect: { projectileSpeed: 1.0, duration: -0.25 }
    },
    divineBlood: {
        name: 'VI - Divine Bloodline',
        desc: 'Armor also increases damage. +2% damage per armor.',
        icon: '🩸',
        effect: { armorToDamage: 0.02 }
    },
    ironBlue: {
        name: 'VII - Iron Blue Will',
        desc: 'Getting hit grants +10% damage for 5 seconds. Stacks 5 times.',
        icon: '🔵',
        effect: { damageOnHit: true }
    },
    madGroove: {
        name: 'VIII - Mad Groove',
        desc: 'Every 2 minutes, attract all gems and chests on screen.',
        icon: '🎵',
        effect: { magnetPulse: true }
    },
    silverWind: {
        name: 'IX - Silver Wind',
        desc: '+15% move speed, +15% attack speed, +10% luck.',
        icon: '💨',
        effect: { moveSpeed: 0.15, cooldown: 0.15, luck: 0.10 }
    },
    beginningArcana: {
        name: 'X - Beginning',
        desc: '+3 Projectiles, -30% damage.',
        icon: '✨',
        effect: { amount: 3, damage: -0.3 }
    },
    waltzArcana: {
        name: 'XI - Waltz of Pearls',
        desc: 'Bouncing projectiles bounce 3 additional times.',
        icon: '🔮',
        effect: { bounceBonus: 3 }
    },
    outOfBounds: {
        name: 'XII - Out of Bounds',
        desc: 'Weapons that expire deal explosion damage.',
        icon: '🌀',
        effect: { expirationExplosion: true }
    }
};

// Union weapon definitions (two weapons combine into one)
const UNION_WEAPONS = {
    vandalier: {
        name: 'Vandalier',
        desc: 'Union of Peachone and Ebony Wings. Bombards everywhere.',
        icon: '🦅',
        requires: ['peachone', 'ebonyWings'],
        damageMultiplier: 2.0,
        amountBonus: 2,
        areaMultiplier: 1.5
    },
    fuwalafuwaloo: {
        name: 'Fuwalafuwaloo',
        desc: 'Union of Vento Sacro and Bloody Tear. Ultimate slash.',
        icon: '🌸',
        requires: ['ventoSacro', 'bloodyTear'],
        damageMultiplier: 2.5,
        critChance: 0.3
    },
    phieraggi: {
        name: 'Phieraggi',
        desc: 'Union of Phiera and Eight. Dual wielding mastery.',
        icon: '🔫',
        requires: ['phiera', 'eight'],
        damageMultiplier: 1.8,
        amountBonus: 4
    }
};

// Additional weapons for Union
const ADDITIONAL_WEAPONS = {
    peachone: {
        name: 'Peachone',
        desc: 'Bombards in a circular area',
        icon: '🕊️',
        damage: 10,
        cooldown: 3.0,
        area: 1.0,
        speed: 0.5,
        amount: 1,
        pierce: -1,
        evolvesTo: null,
        unionWith: 'ebonyWings',
        unionResult: 'vandalier',
        rarity: 'rare'
    },
    ebonyWings: {
        name: 'Ebony Wings',
        desc: 'Bombards in a circular area (dark)',
        icon: '🦇',
        damage: 10,
        cooldown: 3.0,
        area: 1.0,
        speed: 0.5,
        amount: 1,
        pierce: -1,
        evolvesTo: null,
        unionWith: 'peachone',
        unionResult: 'vandalier',
        rarity: 'rare'
    }
};

// Passive item definitions (matching Vampire Survivors)
const PASSIVE_TYPES = {
    spinach: {
        name: 'Spinach',
        desc: '+10% Damage per level',
        icon: '🥬',
        maxLevel: 5,
        effect: { damage: 0.10 },
        rarity: 'common'
    },
    armor: {
        name: 'Armor',
        desc: '+1 Armor per level',
        icon: '🛡️',
        maxLevel: 5,
        effect: { armor: 1 },
        rarity: 'uncommon'
    },
    hollowHeart: {
        name: 'Hollow Heart',
        desc: '+20% Max Health per level',
        icon: '❤️',
        maxLevel: 5,
        effect: { maxHealth: 0.20 },
        rarity: 'common'
    },
    pummarola: {
        name: 'Pummarola',
        desc: '+0.2 HP/s Regen per level',
        icon: '🍅',
        maxLevel: 5,
        effect: { regen: 0.2 },
        rarity: 'uncommon'
    },
    emptyTome: {
        name: 'Empty Tome',
        desc: '-8% Cooldown per level',
        icon: '📕',
        maxLevel: 5,
        effect: { cooldown: 0.08 },
        rarity: 'common'
    },
    candelabrador: {
        name: 'Candelabrador',
        desc: '+10% Area per level',
        icon: '🕯️',
        maxLevel: 5,
        effect: { area: 0.10 },
        rarity: 'common'
    },
    bracer: {
        name: 'Bracer',
        desc: '+10% Projectile Speed per level',
        icon: '🦾',
        maxLevel: 5,
        effect: { projectileSpeed: 0.10 },
        rarity: 'common'
    },
    spellbinder: {
        name: 'Spellbinder',
        desc: '+10% Duration per level',
        icon: '📿',
        maxLevel: 5,
        effect: { duration: 0.10 },
        rarity: 'uncommon'
    },
    duplicator: {
        name: 'Duplicator',
        desc: '+1 Projectile per level',
        icon: '📋',
        maxLevel: 2,
        effect: { amount: 1 },
        rarity: 'rare'
    },
    wings: {
        name: 'Wings',
        desc: '+10% Move Speed per level',
        icon: '🪽',
        maxLevel: 5,
        effect: { moveSpeed: 0.10 },
        rarity: 'common'
    },
    attractorb: {
        name: 'Attractorb',
        desc: '+50% Pickup Range per level',
        icon: '🧲',
        maxLevel: 5,
        effect: { pickupRange: 0.50 },
        rarity: 'common'
    },
    clover: {
        name: 'Clover',
        desc: '+10% Luck per level',
        icon: '🍀',
        maxLevel: 5,
        effect: { luck: 0.10 },
        rarity: 'uncommon'
    },
    crown: {
        name: 'Crown',
        desc: '+8% Experience per level',
        icon: '👑',
        maxLevel: 5,
        effect: { experience: 0.08 },
        rarity: 'uncommon'
    },
    stoneMask: {
        name: 'Stone Mask',
        desc: '+10% Gold per level',
        icon: '🎭',
        maxLevel: 5,
        effect: { gold: 0.10 },
        rarity: 'rare'
    },
    tiramisu: {
        name: 'Tiragisu',
        desc: '+1 Revival per level',
        icon: '🍰',
        maxLevel: 2,
        effect: { revival: 1 },
        rarity: 'legendary'
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
    weapons: [],
    passives: [],
    damageMultiplier: 1,
    cooldownMultiplier: 1,
    areaMultiplier: 1,
    speedMultiplier: 1,
    projectileSpeedMultiplier: 1,
    durationMultiplier: 1,
    pickupRange: 80,
    luck: 1,
    regen: 0,
    amountBonus: 0,
    armor: 0,
    expMultiplier: 1,
    goldMultiplier: 1,
    revivals: 0,
    invincibleTimer: 0,
    character: null,
    arcanas: [], // Selected arcanas for this run
    damageOnHitStacks: 0, // For Iron Blue Will arcana
    damageOnHitTimer: 0, // Timer for damage on hit buff
    magnetPulseTimer: 0 // Timer for Mad Groove arcana
};

// Enemies
let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnInterval = 2;
let enemyBaseHealth = 20;
let enemyBaseDamage = 10;
let enemyBaseSpeed = 40;

// Minute-based events (like Vampire Survivors)
const WAVE_EVENTS = [
    { time: 0, enemies: ['zombie'], spawnRate: 2.0, count: 1 },
    { time: 30, enemies: ['zombie', 'bat'], spawnRate: 1.8, count: 2 },
    { time: 60, enemies: ['zombie', 'bat', 'skeleton'], spawnRate: 1.5, count: 3 },
    { time: 90, boss: 'giant', spawnRate: 1.3, count: 3 },
    { time: 120, enemies: ['zombie', 'bat', 'skeleton', 'ghost'], spawnRate: 1.2, count: 4 },
    { time: 180, boss: 'necromancer', spawnRate: 1.0, count: 5 },
    { time: 240, enemies: ['skeleton', 'ghost', 'demon'], spawnRate: 0.8, count: 6 },
    { time: 300, boss: 'vampire', spawnRate: 0.7, count: 7 },
    { time: 360, enemies: ['demon', 'wraith'], spawnRate: 0.6, count: 8 },
    { time: 480, boss: 'deathLord', spawnRate: 0.5, count: 10 },
    { time: 600, enemies: ['demon', 'wraith', 'reaper'], spawnRate: 0.4, count: 12 },
    { time: 900, boss: 'death', spawnRate: 0.3, count: 15 },
    { time: 1200, enemies: ['reaper'], spawnRate: 0.2, count: 20 },
    { time: 1500, boss: 'redDeath', spawnRate: 0.15, count: 25 }
];

const ENEMY_TYPES = {
    zombie: { healthMult: 1, speedMult: 1, damageMult: 1, expValue: 1, color: '#77aa77' },
    bat: { healthMult: 0.5, speedMult: 1.8, damageMult: 0.7, expValue: 1, color: '#44aa44' },
    skeleton: { healthMult: 2, speedMult: 0.7, damageMult: 1.5, expValue: 3, color: '#cccccc' },
    ghost: { healthMult: 0.8, speedMult: 1.2, damageMult: 1.2, expValue: 2, color: '#8888ff' },
    demon: { healthMult: 3, speedMult: 0.9, damageMult: 2.0, expValue: 5, color: '#ff4444' },
    wraith: { healthMult: 1.5, speedMult: 1.5, damageMult: 1.8, expValue: 4, color: '#aa66aa' },
    reaper: { healthMult: 4, speedMult: 1.1, damageMult: 2.5, expValue: 8, color: '#222222' },
    // Bosses
    giant: { healthMult: 30, speedMult: 0.4, damageMult: 3, expValue: 50, color: '#885522', isBoss: true },
    necromancer: { healthMult: 40, speedMult: 0.5, damageMult: 2.5, expValue: 75, color: '#664488', isBoss: true },
    vampire: { healthMult: 60, speedMult: 0.6, damageMult: 4, expValue: 100, color: '#880000', isBoss: true },
    deathLord: { healthMult: 100, speedMult: 0.5, damageMult: 5, expValue: 150, color: '#440044', isBoss: true },
    death: { healthMult: 200, speedMult: 0.7, damageMult: 10, expValue: 300, color: '#000000', isBoss: true },
    redDeath: { healthMult: 500, speedMult: 1.0, damageMult: 999, expValue: 666, color: '#ff0000', isBoss: true }
};

// Projectiles & effects
let projectiles = [];
let areaEffects = [];
let orbitingWeapons = [];
let bibleOrbits = [];

// Pickups
let expGems = [];
let chests = [];
let floorItems = [];

// Damage numbers
let damageNumbers = [];

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

// Camera for world-space rendering
let camera = { x: 0, y: 0 };
const WORLD_SIZE = 2000;

// Initialize game
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    document.getElementById('new-game-btn').addEventListener('click', showCharacterSelect);
    document.getElementById('retry-btn').addEventListener('click', showCharacterSelect);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

    setupJoystick();

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick);

    updateSoundIcon();
    updateBestTimeDisplay();

    showMenu();
    gameLoop = requestAnimationFrame(update);
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
        if (gameState === 'menu') {
            showCharacterSelect();
        } else if (gameState === 'playing') {
            togglePause();
        } else if (gameState === 'paused') {
            togglePause();
        }
    }

    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            togglePause();
        }
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleCanvasClick(e) {
    e.preventDefault();
    if (gameState === 'menu') {
        showCharacterSelect();
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

    joystickZone.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
}

function showMenu() {
    gameState = 'menu';
    document.getElementById('start-message').classList.remove('hidden');
    document.getElementById('game-message').classList.add('hidden');
    document.getElementById('level-up-modal').classList.add('hidden');
    document.getElementById('character-select').classList.add('hidden');
    hideArcanaSelect();
}

function hideArcanaSelect() {
    const existingModal = document.getElementById('arcana-select');
    if (existingModal) {
        existingModal.classList.add('hidden');
    }
}

function showCharacterSelect() {
    gameState = 'characterSelect';
    document.getElementById('start-message').classList.add('hidden');
    document.getElementById('game-message').classList.add('hidden');

    const selectModal = document.getElementById('character-select');
    const container = document.getElementById('character-options');
    container.innerHTML = '';

    Object.entries(CHARACTERS).forEach(([id, char]) => {
        const btn = document.createElement('button');
        btn.className = 'character-btn' + (id === selectedCharacter ? ' selected' : '');
        const weaponType = WEAPON_TYPES[char.startingWeapon];
        btn.innerHTML = `
            <div class="char-icon">${char.icon}</div>
            <div class="char-info">
                <div class="char-name">${char.name}</div>
                <div class="char-desc">${char.desc}</div>
                <div class="char-weapon">${weaponType.icon} ${weaponType.name}</div>
            </div>
        `;
        btn.onclick = () => {
            selectedCharacter = id;
            document.querySelectorAll('.character-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            playSound('pickup');
        };
        container.appendChild(btn);
    });

    const startBtn = document.createElement('button');
    startBtn.className = 'start-run-btn';
    startBtn.textContent = 'SELECT ARCANA';
    startBtn.onclick = () => {
        selectModal.classList.add('hidden');
        showArcanaSelect();
    };
    container.appendChild(startBtn);

    selectModal.classList.remove('hidden');
}

function showArcanaSelect() {
    gameState = 'arcanaSelect';
    arcanaSelectionMode = true;
    selectedArcana = null;

    // Create or get arcana modal
    let arcanaModal = document.getElementById('arcana-select');
    if (!arcanaModal) {
        arcanaModal = document.createElement('div');
        arcanaModal.id = 'arcana-select';
        arcanaModal.className = 'hidden';
        document.getElementById('game-container').appendChild(arcanaModal);
    }

    arcanaModal.innerHTML = `
        <h2>SELECT ARCANA</h2>
        <p class="arcana-subtitle">Choose a powerful modifier for your run</p>
        <div id="arcana-options"></div>
    `;

    const container = document.getElementById('arcana-options');

    // Get 3 random arcanas to offer
    const arcanaKeys = Object.keys(ARCANA_TYPES);
    const shuffled = arcanaKeys.sort(() => Math.random() - 0.5);
    const offered = shuffled.slice(0, 3);

    offered.forEach(id => {
        const arcana = ARCANA_TYPES[id];
        const btn = document.createElement('button');
        btn.className = 'arcana-btn';
        btn.innerHTML = `
            <div class="arcana-icon">${arcana.icon}</div>
            <div class="arcana-info">
                <div class="arcana-name">${arcana.name}</div>
                <div class="arcana-desc">${arcana.desc}</div>
            </div>
        `;
        btn.onclick = () => {
            selectedArcana = id;
            document.querySelectorAll('.arcana-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            playSound('pickup');
        };
        container.appendChild(btn);
    });

    // Skip arcana option
    const skipBtn = document.createElement('button');
    skipBtn.className = 'arcana-btn arcana-skip';
    skipBtn.innerHTML = `
        <div class="arcana-icon">❌</div>
        <div class="arcana-info">
            <div class="arcana-name">No Arcana</div>
            <div class="arcana-desc">Start without any modifier</div>
        </div>
    `;
    skipBtn.onclick = () => {
        selectedArcana = null;
        document.querySelectorAll('.arcana-btn').forEach(b => b.classList.remove('selected'));
        skipBtn.classList.add('selected');
        playSound('pickup');
    };
    container.appendChild(skipBtn);

    const startBtn = document.createElement('button');
    startBtn.className = 'start-run-btn';
    startBtn.textContent = 'START RUN';
    startBtn.onclick = () => {
        arcanaModal.classList.add('hidden');
        startNewGame();
    };
    container.appendChild(startBtn);

    arcanaModal.classList.remove('hidden');
}

function startNewGame() {
    const char = CHARACTERS[selectedCharacter];

    player = {
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2,
        baseSpeed: 100,
        speed: 100 * (char.stats.moveSpeed || 1),
        health: 100 * (char.stats.maxHealth || 1),
        maxHealth: 100 * (char.stats.maxHealth || 1),
        baseMaxHealth: 100,
        exp: 0,
        level: 1,
        expToNextLevel: 5,
        facingRight: true,
        weapons: [],
        passives: [],
        damageMultiplier: char.stats.damage || 1,
        cooldownMultiplier: char.stats.cooldown || 1,
        areaMultiplier: char.areaBonus || 1,
        speedMultiplier: char.stats.moveSpeed || 1,
        projectileSpeedMultiplier: 1,
        durationMultiplier: char.durationBonus || 1,
        pickupRange: 80 * (char.pickupBonus || 1),
        luck: 1,
        regen: char.stats.regen || 0,
        amountBonus: char.amountBonus || 0,
        armor: char.stats.armor || 0,
        expMultiplier: char.expBonus || 1,
        goldMultiplier: 1,
        revivals: 0,
        invincibleTimer: 0,
        character: char,
        levelBonus: char.levelBonus || {},
        arcanas: selectedArcana ? [selectedArcana] : [],
        damageOnHitStacks: 0,
        damageOnHitTimer: 0,
        magnetPulseTimer: 0,
        healingBoost: 0,
        pierceBonus: 0
    };

    // Apply starting arcana effects
    if (selectedArcana) {
        applyArcanaEffects();
    }

    addWeapon(char.startingWeapon);

    enemies = [];
    projectiles = [];
    areaEffects = [];
    orbitingWeapons = [];
    bibleOrbits = [];
    expGems = [];
    chests = [];
    floorItems = [];
    damageNumbers = [];
    gameTime = 0;
    kills = 0;
    coins = 0;
    enemySpawnTimer = 0;
    enemySpawnInterval = 2;
    enemyBaseHealth = 20;
    enemyBaseDamage = 10;
    enemyBaseSpeed = 40;
    lastMoveDirection = { x: 1, y: 0 };

    camera = { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2 };

    document.getElementById('start-message').classList.add('hidden');
    document.getElementById('game-message').classList.add('hidden');
    document.getElementById('level-up-modal').classList.add('hidden');
    document.getElementById('character-select').classList.add('hidden');

    gameState = 'playing';
    lastTime = performance.now();

    playSound('start');
}

function applyArcanaEffects() {
    // Reset arcana-specific bonuses
    player.healingBoost = 0;
    player.pierceBonus = 0;

    for (const arcanaId of player.arcanas) {
        const arcana = ARCANA_TYPES[arcanaId];
        if (!arcana || !arcana.effect) continue;

        const effect = arcana.effect;

        // Sarabande - Healing boost
        if (effect.healingBoost) {
            player.healingBoost += effect.healingBoost;
        }

        // Slash - Pierce bonus
        if (effect.pierceBonus) {
            player.pierceBonus += effect.pierceBonus;
        }

        // Chaos Malachite - Projectile speed and duration
        if (effect.projectileSpeed) {
            player.projectileSpeedMultiplier += effect.projectileSpeed;
        }
        if (effect.duration) {
            player.durationMultiplier += effect.duration;
        }

        // Silver Wind - Move speed, cooldown, luck
        if (effect.moveSpeed) {
            player.speedMultiplier += effect.moveSpeed;
            player.speed = player.baseSpeed * player.speedMultiplier;
        }
        if (effect.cooldown) {
            player.cooldownMultiplier -= effect.cooldown;
        }
        if (effect.luck) {
            player.luck += effect.luck;
        }

        // Beginning - Amount and damage
        if (effect.amount) {
            player.amountBonus += effect.amount;
        }
        if (effect.damage) {
            player.damageMultiplier += effect.damage;
        }
    }
}

function hasArcana(arcanaId) {
    return player.arcanas && player.arcanas.includes(arcanaId);
}

function updateArcanaEffects() {
    // Iron Blue Will - Damage on hit timer decay
    if (player.damageOnHitTimer > 0) {
        player.damageOnHitTimer -= deltaTime;
        if (player.damageOnHitTimer <= 0) {
            player.damageOnHitStacks = 0;
        }
    }

    // Mad Groove - Magnet pulse every 2 minutes
    if (hasArcana('madGroove')) {
        player.magnetPulseTimer += deltaTime;
        if (player.magnetPulseTimer >= 120) { // 2 minutes
            player.magnetPulseTimer = 0;
            triggerMadGroovePulse();
        }
    }
}

function triggerMadGroovePulse() {
    // Attract all gems and chests on screen instantly
    playSound('levelup');

    // Pull all exp gems to player
    for (const gem of expGems) {
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
            gem.x = player.x;
            gem.y = player.y;
        }
    }

    // Pull all chests to player
    for (const chest of chests) {
        chest.x = player.x + (Math.random() - 0.5) * 50;
        chest.y = player.y + (Math.random() - 0.5) * 50;
    }

    // Visual effect
    areaEffects.push({
        x: player.x,
        y: player.y,
        radius: canvas.width,
        damage: 0,
        lifetime: 0.5,
        maxLifetime: 0.5,
        type: 'madgroove',
        color: '#ff00ff'
    });
}

function applyDamageOnHit() {
    // Iron Blue Will - Getting hit grants damage bonus
    if (hasArcana('ironBlue')) {
        player.damageOnHitStacks = Math.min(5, player.damageOnHitStacks + 1);
        player.damageOnHitTimer = 5; // 5 seconds duration
    }
}

function getArcanaMovementDamageBonus() {
    // Tragic Princess - Movement speed affects damage
    if (hasArcana('tragedy')) {
        // Calculate current velocity based on key states
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        if (joystickVector.x !== 0 || joystickVector.y !== 0) {
            dx = joystickVector.x;
            dy = joystickVector.y;
        }
        const isMoving = dx !== 0 || dy !== 0;
        return isMoving ? 0.5 : 0; // +50% when moving
    }
    return 0;
}

function getArcanaDamageBonus() {
    let bonus = 0;

    // Iron Blue Will - Damage from being hit
    if (hasArcana('ironBlue') && player.damageOnHitStacks > 0) {
        bonus += player.damageOnHitStacks * 0.1; // +10% per stack
    }

    // Divine Bloodline - Armor to damage
    if (hasArcana('divineBlood')) {
        bonus += player.armor * 0.02; // +2% per armor
    }

    // Tragic Princess - Movement damage
    bonus += getArcanaMovementDamageBonus();

    return bonus;
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
        maxLevel: passiveType.maxLevel
    });

    applyPassiveEffects();
    return true;
}

function applyPassiveEffects() {
    player.damageMultiplier = player.character?.stats?.damage || 1;
    player.cooldownMultiplier = player.character?.stats?.cooldown || 1;
    player.areaMultiplier = player.character?.areaBonus || 1;
    player.speedMultiplier = player.character?.stats?.moveSpeed || 1;
    player.projectileSpeedMultiplier = 1;
    player.durationMultiplier = player.character?.durationBonus || 1;
    player.maxHealth = player.baseMaxHealth * (player.character?.stats?.maxHealth || 1);
    player.pickupRange = 80 * (player.character?.pickupBonus || 1);
    player.luck = 1;
    player.regen = player.character?.stats?.regen || 0;
    player.amountBonus = player.character?.amountBonus || 0;
    player.armor = player.character?.stats?.armor || 0;
    player.expMultiplier = player.character?.expBonus || 1;
    player.goldMultiplier = 1;
    player.revivals = 0;

    for (const passive of player.passives) {
        const type = PASSIVE_TYPES[passive.id];
        const level = passive.level;

        if (type.effect.damage) {
            player.damageMultiplier += type.effect.damage * level;
        }
        if (type.effect.cooldown) {
            player.cooldownMultiplier -= type.effect.cooldown * level;
        }
        if (type.effect.area) {
            player.areaMultiplier += type.effect.area * level;
        }
        if (type.effect.projectileSpeed) {
            player.projectileSpeedMultiplier += type.effect.projectileSpeed * level;
        }
        if (type.effect.maxHealth) {
            player.maxHealth *= (1 + type.effect.maxHealth * level);
        }
        if (type.effect.pickupRange) {
            player.pickupRange *= (1 + type.effect.pickupRange * level);
        }
        if (type.effect.luck) {
            player.luck += type.effect.luck * level;
        }
        if (type.effect.regen) {
            player.regen += type.effect.regen * level;
        }
        if (type.effect.amount) {
            player.amountBonus += type.effect.amount * level;
        }
        if (type.effect.armor) {
            player.armor += type.effect.armor * level;
        }
        if (type.effect.moveSpeed) {
            player.speedMultiplier += type.effect.moveSpeed * level;
        }
        if (type.effect.duration) {
            player.durationMultiplier += type.effect.duration * level;
        }
        if (type.effect.experience) {
            player.expMultiplier += type.effect.experience * level;
        }
        if (type.effect.gold) {
            player.goldMultiplier += type.effect.gold * level;
        }
        if (type.effect.revival) {
            player.revivals += type.effect.revival * level;
        }
    }

    player.cooldownMultiplier = Math.max(0.1, player.cooldownMultiplier);
    player.maxHealth = Math.floor(player.maxHealth);
    player.speed = player.baseSpeed * player.speedMultiplier;
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
    if (gameState === 'menu' || gameState === 'characterSelect') {
        render();
        gameLoop = requestAnimationFrame(update);
        return;
    }

    if (gameState !== 'playing') {
        gameLoop = requestAnimationFrame(update);
        render();
        return;
    }

    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    deltaTime = Math.min(deltaTime, 0.1);

    gameTime += deltaTime;

    // Check for victory (30 minutes survived)
    if (gameTime >= VICTORY_TIME) {
        victory();
        return;
    }

    // Invincibility timer
    if (player.invincibleTimer > 0) {
        player.invincibleTimer -= deltaTime;
    }

    // HP regeneration (with healing boost from arcana)
    if (player.regen > 0) {
        const healAmount = player.regen * deltaTime * (1 + (player.healingBoost || 0));
        player.health = Math.min(player.health + healAmount, player.maxHealth);
    }

    // Update arcana timers
    updateArcanaEffects();

    updateDifficulty();
    updatePlayer();
    updateWeapons();
    spawnEnemies();
    updateEnemies();
    updateProjectiles();
    updateAreaEffects();
    updateOrbitingWeapons();
    updateBibleOrbits();
    updateExpGems();
    updateChests();
    updateDamageNumbers();
    checkCollisions();
    updateCamera();
    updateUI();

    render();

    gameLoop = requestAnimationFrame(update);
}

function updateDifficulty() {
    let currentEvent = WAVE_EVENTS[0];
    for (const event of WAVE_EVENTS) {
        if (gameTime >= event.time) {
            currentEvent = event;
        }
    }

    enemySpawnInterval = currentEvent.spawnRate;

    const timeMultiplier = 1 + Math.floor(gameTime / 60) * 0.2;
    enemyBaseHealth = 20 * timeMultiplier;
    enemyBaseDamage = 10 * timeMultiplier;
    enemyBaseSpeed = 40 + Math.floor(gameTime / 120) * 5;
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

    if (dx !== 0) {
        player.facingRight = dx > 0;
        lastMoveDirection.x = dx;
        lastMoveDirection.y = dy;
    } else if (dy !== 0) {
        lastMoveDirection.x = 0;
        lastMoveDirection.y = dy;
    }

    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;

    // Keep in world bounds
    const margin = 50;
    player.x = Math.max(margin, Math.min(WORLD_SIZE - margin, player.x));
    player.y = Math.max(margin, Math.min(WORLD_SIZE - margin, player.y));

    // Level bonus (Antonio gains HP per level)
    if (player.levelBonus && player.levelBonus.maxHealth && player.level > 1) {
        const bonusHP = player.levelBonus.maxHealth * (player.level - 1);
        if (player.maxHealth < player.baseMaxHealth + bonusHP) {
            player.maxHealth = player.baseMaxHealth * (player.character?.stats?.maxHealth || 1) + bonusHP;
            applyPassiveEffects();
        }
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    camera.x = Math.max(0, Math.min(WORLD_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_SIZE - canvas.height, camera.y));
}

function updateWeapons() {
    for (const weapon of player.weapons) {
        weapon.cooldownTimer -= deltaTime;

        if (weapon.cooldownTimer <= 0) {
            fireWeapon(weapon);

            const weaponType = WEAPON_TYPES[weapon.id];
            let cooldown = weaponType.cooldown * player.cooldownMultiplier;

            if (weapon.evolved) {
                const evolved = EVOLVED_WEAPONS[weapon.evolvedId];
                if (evolved.cooldownMultiplier) cooldown *= evolved.cooldownMultiplier;
                if (evolved.noCooldown) cooldown *= 0.2;
            }

            cooldown *= (1 - (weapon.level - 1) * 0.03);
            weapon.cooldownTimer = Math.max(0.05, cooldown);
        }
    }
}

function fireWeapon(weapon) {
    const weaponType = WEAPON_TYPES[weapon.id];
    const evolved = weapon.evolved ? EVOLVED_WEAPONS[weapon.evolvedId] : null;

    let damage = weaponType.damage * player.damageMultiplier * (1 + (weapon.level - 1) * 0.1);
    if (evolved) damage *= evolved.damageMultiplier;
    // Apply arcana damage bonuses
    damage *= (1 + getArcanaDamageBonus());

    let amount = weaponType.amount + Math.floor((weapon.level - 1) / 2) + player.amountBonus;
    if (evolved && evolved.amountBonus) amount += evolved.amountBonus;

    const area = weaponType.area * player.areaMultiplier * (1 + (weapon.level - 1) * 0.05);
    if (evolved && evolved.areaMultiplier) area *= evolved.areaMultiplier;
    const projSpeed = weaponType.speed * player.projectileSpeedMultiplier * 200;
    const duration = (weaponType.duration || 1) * player.durationMultiplier * (1 + (weapon.level - 1) * 0.1);

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
            fireHolyWater(damage, amount, area, duration, evolved);
            break;
        case 'bible':
            fireBible(damage, amount, area, duration, evolved);
            break;
        case 'cross':
            fireCross(damage, amount, projSpeed, weaponType.pierce + weapon.level * 2, area, evolved);
            break;
        case 'garlic':
            fireGarlic(damage, area, evolved);
            break;
        case 'lightning':
            fireLightning(damage, amount, area, evolved);
            break;
        case 'runetracer':
            fireRunetracer(damage, amount, projSpeed, area, duration, evolved);
            break;
        case 'pentagram':
            firePentagram(damage, evolved);
            break;
    }

    if (weapon.id !== 'garlic' && weapon.id !== 'bible') {
        playSound('shoot');
    }
}

function fireWhip(damage, area, evolved) {
    const width = 100 * area;
    const height = 40 * area;
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
        healsOnKill: evolved?.healsOnKill || 0,
        critChance: evolved?.critChance || 0,
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
    const spread = 0.12;
    // Apply arcana pierce bonus
    const totalPierce = pierce + (player.pierceBonus || 0);

    for (let i = 0; i < amount; i++) {
        const angleOffset = (i - (amount - 1) / 2) * spread;
        const angle = baseAngle + angleOffset;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: damage,
            pierce: totalPierce,
            type: 'knife',
            color: evolved ? '#aaaaff' : '#cccccc'
        });
    }
}

function fireAxe(damage, amount, area, pierce, evolved) {
    const totalPierce = pierce + (player.pierceBonus || 0);
    if (evolved && evolved.orbits) {
        for (let i = 0; i < amount; i++) {
            const angle = (i / amount) * Math.PI * 2;
            orbitingWeapons.push({
                angle: angle,
                distance: 80 * area,
                damage: damage,
                pierce: totalPierce,
                lifetime: 4,
                rotationSpeed: 3,
                type: 'axe',
                color: '#ff6644'
            });
        }
    } else {
        for (let i = 0; i < amount; i++) {
            const offsetAngle = (Math.random() - 0.5) * 1.0;
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.sin(offsetAngle) * 100,
                vy: -280,
                gravity: 400,
                damage: damage,
                pierce: pierce,
                size: 14 * area,
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
        const targetEnemy = sortedEnemies[Math.floor(Math.random() * Math.min(5, sortedEnemies.length))];
        if (!targetEnemy && enemies.length === 0) continue;

        const angle = targetEnemy
            ? Math.atan2(targetEnemy.y - player.y, targetEnemy.x - player.x)
            : Math.random() * Math.PI * 2;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed * 0.7,
            vy: Math.sin(angle) * speed * 0.7,
            damage: damage,
            pierce: 0,
            size: 12 * area,
            type: 'fireball',
            explosive: evolved?.explosive || false,
            explosionRadius: 50 * area,
            color: evolved ? '#ff2200' : '#ff6600'
        });
    }
}

function fireHolyWater(damage, amount, area, duration, evolved) {
    for (let i = 0; i < amount; i++) {
        const offsetX = (Math.random() - 0.5) * 150;
        const offsetY = (Math.random() - 0.5) * 150;

        areaEffects.push({
            x: player.x + offsetX - 40 * area,
            y: player.y + offsetY - 40 * area,
            width: 80 * area,
            height: 80 * area,
            damage: damage,
            lifetime: duration,
            maxLifetime: duration,
            tickRate: 0.3,
            lastTick: 0,
            type: 'holywater',
            followsPlayer: evolved?.followsPlayer || false,
            offsetFromPlayer: { x: offsetX, y: offsetY },
            color: evolved ? '#4444ff' : '#44aaff'
        });
    }
}

function fireBible(damage, amount, area, duration, evolved) {
    const existingCount = bibleOrbits.length;
    const totalWanted = amount;

    if (existingCount < totalWanted) {
        for (let i = existingCount; i < totalWanted; i++) {
            bibleOrbits.push({
                angle: (i / totalWanted) * Math.PI * 2,
                distance: 70 * area,
                damage: damage,
                lifetime: evolved?.permanent ? 999999 : duration,
                rotationSpeed: 2.5,
                type: 'bible',
                color: evolved ? '#ffaa00' : '#ffff88'
            });
        }
    }

    // Update existing bibles
    for (const bible of bibleOrbits) {
        bible.damage = damage;
        bible.distance = 70 * area;
        if (evolved?.permanent) {
            bible.lifetime = 999999;
        }
    }
}

function fireCross(damage, amount, speed, pierce, area, evolved) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.atan2(lastMoveDirection.y, lastMoveDirection.x) + (i - (amount - 1) / 2) * 0.3;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: damage,
            pierce: pierce,
            size: 16 * area,
            type: 'cross',
            returning: false,
            maxDistance: 250,
            startX: player.x,
            startY: player.y,
            color: evolved ? '#ffff00' : '#ffffff'
        });
    }
}

function fireGarlic(damage, area, evolved) {
    const radius = 50 * area;

    for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < radius) {
            const actualDamage = damage;
            enemy.health -= actualDamage;
            enemy.hitFlash = 0.1;

            if (evolved?.healsOnHit && Math.random() < 0.1) {
                player.health = Math.min(player.health + 1, player.maxHealth);
            }

            if (enemy.health <= 0) {
                handleEnemyDeath(enemy, enemies.indexOf(enemy));
            }
        }
    }

    // Visual effect
    areaEffects.push({
        x: player.x,
        y: player.y,
        radius: radius,
        damage: 0,
        lifetime: 0.1,
        maxLifetime: 0.1,
        type: 'garlic',
        color: evolved ? '#aa44aa' : '#88ff88'
    });
}

function fireLightning(damage, amount, area, evolved) {
    const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = Math.hypot(a.x - player.x, a.y - player.y);
        const distB = Math.hypot(b.x - player.x, b.y - player.y);
        return distA - distB;
    });

    const targets = sortedEnemies.slice(0, amount);

    for (const target of targets) {
        target.health -= damage;
        target.hitFlash = 0.15;

        spawnDamageNumber(target.x, target.y, damage);

        // Lightning visual
        areaEffects.push({
            x: target.x,
            y: target.y,
            radius: 20 * area,
            damage: 0,
            lifetime: 0.15,
            maxLifetime: 0.15,
            type: 'lightning',
            color: '#ffff00'
        });

        // Chain lightning for evolved
        if (evolved?.chains) {
            let chainTarget = target;
            for (let c = 0; c < evolved.chains; c++) {
                const nearby = enemies.find(e =>
                    e !== chainTarget &&
                    !targets.includes(e) &&
                    Math.hypot(e.x - chainTarget.x, e.y - chainTarget.y) < 100
                );
                if (nearby) {
                    nearby.health -= damage * 0.5;
                    nearby.hitFlash = 0.1;
                    spawnDamageNumber(nearby.x, nearby.y, Math.floor(damage * 0.5));
                    chainTarget = nearby;
                }
            }
        }

        if (target.health <= 0) {
            handleEnemyDeath(target, enemies.indexOf(target));
        }
    }
}

function fireRunetracer(damage, amount, speed, area, duration, evolved) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed * 0.8,
            damage: damage,
            pierce: 999,
            size: 14 * area,
            type: 'runetracer',
            lifetime: duration,
            bounces: true,
            explodesOnEnd: evolved?.explodesOnEnd || false,
            explosionRadius: 60 * area,
            color: evolved ? '#ff00ff' : '#00ffff'
        });
    }
}

function firePentagram(damage, evolved) {
    // Screen-wide attack
    const killedEnemies = [];

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const type = ENEMY_TYPES[enemy.type];

        // 50% chance to kill, or guaranteed for non-bosses
        if (!type.isBoss || Math.random() < 0.5) {
            killedEnemies.push({ ...enemy, index: i });
        }
    }

    // Kill with small delay for effect
    killedEnemies.forEach((enemy, idx) => {
        setTimeout(() => {
            const actualIdx = enemies.findIndex(e => e === enemies[enemy.index]);
            if (actualIdx >= 0 && enemies[actualIdx]) {
                if (evolved?.generatesGems) {
                    // Generate extra gems
                    for (let g = 0; g < 3; g++) {
                        expGems.push({
                            x: enemies[actualIdx].x + (Math.random() - 0.5) * 30,
                            y: enemies[actualIdx].y + (Math.random() - 0.5) * 30,
                            value: enemies[actualIdx].expValue || 1
                        });
                    }
                }
                handleEnemyDeath(enemies[actualIdx], actualIdx);
            }
        }, idx * 20);
    });

    // Visual effect
    areaEffects.push({
        x: player.x,
        y: player.y,
        radius: canvas.width,
        damage: 0,
        lifetime: 0.5,
        maxLifetime: 0.5,
        type: 'pentagram',
        color: evolved ? '#ffd700' : '#ff00ff'
    });

    playSound('levelup');
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        if (proj.gravity) {
            proj.vy += proj.gravity * deltaTime;
            proj.rotation = (proj.rotation || 0) + deltaTime * 10;
        }

        // Cross returning behavior
        if (proj.type === 'cross') {
            const dist = Math.hypot(proj.x - proj.startX, proj.y - proj.startY);
            if (!proj.returning && dist >= proj.maxDistance) {
                proj.returning = true;
            }
            if (proj.returning) {
                const angleToPlayer = Math.atan2(player.y - proj.y, player.x - proj.x);
                const returnSpeed = 300;
                proj.vx = Math.cos(angleToPlayer) * returnSpeed;
                proj.vy = Math.sin(angleToPlayer) * returnSpeed;

                if (Math.hypot(proj.x - player.x, proj.y - player.y) < 20) {
                    projectiles.splice(i, 1);
                    continue;
                }
            }
        }

        // Runetracer bouncing
        if (proj.bounces) {
            proj.lifetime -= deltaTime;
            if (proj.lifetime <= 0) {
                if (proj.explodesOnEnd) {
                    createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage);
                }
                projectiles.splice(i, 1);
                continue;
            }

            // Bounce off screen edges (world-relative)
            if (proj.x < camera.x + 10 || proj.x > camera.x + canvas.width - 10) {
                proj.vx *= -1;
                proj.x = Math.max(camera.x + 10, Math.min(camera.x + canvas.width - 10, proj.x));
            }
            if (proj.y < camera.y + 10 || proj.y > camera.y + canvas.height - 10) {
                proj.vy *= -1;
                proj.y = Math.max(camera.y + 10, Math.min(camera.y + canvas.height - 10, proj.y));
            }
        }

        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Remove if off screen (for non-bouncing)
        if (!proj.bounces) {
            const margin = 150;
            if (proj.x < camera.x - margin || proj.x > camera.x + canvas.width + margin ||
                proj.y < camera.y - margin || proj.y > camera.y + canvas.height + margin) {
                projectiles.splice(i, 1);
            }
        }
    }
}

function updateAreaEffects() {
    for (let i = areaEffects.length - 1; i >= 0; i--) {
        const effect = areaEffects[i];
        effect.lifetime -= deltaTime;

        if (effect.followsPlayer) {
            effect.x = player.x + effect.offsetFromPlayer.x - effect.width / 2;
            effect.y = player.y + effect.offsetFromPlayer.y - effect.height / 2;
        }

        if (effect.tickRate) {
            effect.lastTick += deltaTime;
            if (effect.lastTick >= effect.tickRate) {
                effect.lastTick = 0;
                for (const enemy of enemies) {
                    if (enemy.x > effect.x && enemy.x < effect.x + effect.width &&
                        enemy.y > effect.y && enemy.y < effect.y + effect.height) {
                        enemy.health -= effect.damage;
                        enemy.hitFlash = 0.05;
                        spawnDamageNumber(enemy.x, enemy.y, effect.damage);
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
        orb.angle += deltaTime * orb.rotationSpeed;

        if (orb.lifetime <= 0) {
            orbitingWeapons.splice(i, 1);
        }
    }
}

function updateBibleOrbits() {
    for (let i = bibleOrbits.length - 1; i >= 0; i--) {
        const bible = bibleOrbits[i];
        bible.lifetime -= deltaTime;
        bible.angle += deltaTime * bible.rotationSpeed;

        if (bible.lifetime <= 0) {
            bibleOrbits.splice(i, 1);
        }
    }
}

function spawnEnemies() {
    enemySpawnTimer += deltaTime;

    if (enemySpawnTimer >= enemySpawnInterval) {
        enemySpawnTimer = 0;

        let currentEvent = WAVE_EVENTS[0];
        for (const event of WAVE_EVENTS) {
            if (gameTime >= event.time) {
                currentEvent = event;
            }
        }

        const spawnCount = currentEvent.count;
        for (let i = 0; i < spawnCount; i++) {
            spawnEnemy(currentEvent);
        }

        // Boss spawn on event transition
        if (currentEvent.boss && Math.random() < 0.02) {
            spawnSpecificEnemy(currentEvent.boss);
        }
    }
}

function spawnEnemy(event) {
    let x, y;
    const side = Math.floor(Math.random() * 4);
    const margin = 50;

    const screenX = camera.x;
    const screenY = camera.y;

    switch (side) {
        case 0: x = screenX + Math.random() * canvas.width; y = screenY - margin; break;
        case 1: x = screenX + canvas.width + margin; y = screenY + Math.random() * canvas.height; break;
        case 2: x = screenX + Math.random() * canvas.width; y = screenY + canvas.height + margin; break;
        case 3: x = screenX - margin; y = screenY + Math.random() * canvas.height; break;
    }

    const enemyTypeList = event.enemies || ['zombie'];
    const typeId = enemyTypeList[Math.floor(Math.random() * enemyTypeList.length)];

    spawnSpecificEnemy(typeId, x, y);
}

function spawnSpecificEnemy(typeId, x, y) {
    if (x === undefined) {
        const side = Math.floor(Math.random() * 4);
        const margin = 50;
        switch (side) {
            case 0: x = camera.x + Math.random() * canvas.width; y = camera.y - margin; break;
            case 1: x = camera.x + canvas.width + margin; y = camera.y + Math.random() * canvas.height; break;
            case 2: x = camera.x + Math.random() * canvas.width; y = camera.y + canvas.height + margin; break;
            case 3: x = camera.x - margin; y = camera.y + Math.random() * canvas.height; break;
        }
    }

    const type = ENEMY_TYPES[typeId];
    if (!type) return;

    enemies.push({
        x, y,
        type: typeId,
        health: enemyBaseHealth * type.healthMult,
        maxHealth: enemyBaseHealth * type.healthMult,
        speed: enemyBaseSpeed * type.speedMult,
        damage: enemyBaseDamage * type.damageMult,
        expValue: type.expValue,
        hitFlash: 0,
        isBoss: type.isBoss || false
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
            const attractSpeed = 400;
            gem.x += (dx / dist) * attractSpeed * deltaTime;
            gem.y += (dy / dist) * attractSpeed * deltaTime;
        }
    }
}

function updateChests() {
    // Chests flash to attract attention
}

function updateDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const num = damageNumbers[i];
        num.lifetime -= deltaTime;
        num.y -= 30 * deltaTime;
        num.alpha = num.lifetime / num.maxLifetime;

        if (num.lifetime <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function spawnDamageNumber(x, y, damage, isCrit = false) {
    damageNumbers.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 10,
        damage: Math.floor(damage),
        lifetime: 0.8,
        maxLifetime: 0.8,
        alpha: 1,
        isCrit: isCrit
    });
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
                spawnDamageNumber(enemy.x, enemy.y, proj.damage);

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

                    let actualDamage = effect.damage;
                    let isCrit = false;
                    if (effect.critChance && Math.random() < effect.critChance) {
                        actualDamage *= 2;
                        isCrit = true;
                    }

                    enemy.health -= actualDamage;
                    enemy.hitFlash = 0.1;
                    spawnDamageNumber(enemy.x, enemy.y, actualDamage, isCrit);

                    if (enemy.health <= 0) {
                        if (effect.healsOnKill) {
                            player.health = Math.min(player.health + effect.healsOnKill, player.maxHealth);
                        }
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

            if (dist < 25) {
                enemy.health -= orb.damage * deltaTime * 5;
                enemy.hitFlash = 0.05;

                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy, j);
                }
            }
        }
    }

    // Bible orbits vs Enemies
    for (const bible of bibleOrbits) {
        const bibleX = player.x + Math.cos(bible.angle) * bible.distance;
        const bibleY = player.y + Math.sin(bible.angle) * bible.distance;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = Math.hypot(bibleX - enemy.x, bibleY - enemy.y);

            if (dist < 25) {
                enemy.health -= bible.damage * deltaTime * 3;
                enemy.hitFlash = 0.05;

                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy, j);
                }
            }
        }
    }

    // Player vs Enemies
    if (player.invincibleTimer <= 0) {
        for (const enemy of enemies) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
                let damage = enemy.damage * deltaTime;
                damage = Math.max(0, damage - player.armor * deltaTime * 0.5);
                player.health -= damage;

                if (player.health <= 0) {
                    if (player.revivals > 0) {
                        player.revivals--;
                        player.health = player.maxHealth * 0.5;
                        player.invincibleTimer = 3;
                        playSound('levelup');
                    } else {
                        gameOver();
                        return;
                    }
                }
            }
        }
    }

    // Player vs Exp Gems
    for (let i = expGems.length - 1; i >= 0; i--) {
        const gem = expGems[i];
        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);

        if (dist < (PLAYER_SIZE + EXP_GEM_SIZE) / 2) {
            player.exp += gem.value * player.expMultiplier;
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
    expGems.push({
        x: enemy.x,
        y: enemy.y,
        value: enemy.expValue
    });

    // Chance to drop chest (affected by luck)
    const chestChance = (enemy.isBoss ? 1.0 : 0.01) * player.luck;
    if (Math.random() < chestChance) {
        chests.push({
            x: enemy.x,
            y: enemy.y
        });
    }

    // Gold drop
    coins += Math.floor((enemy.isBoss ? 10 : 1) * player.goldMultiplier);

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
        damage: 0,
        lifetime: 0.3,
        maxLifetime: 0.3,
        type: 'explosion',
        color: '#ff4400'
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dist = Math.hypot(x - enemy.x, y - enemy.y);
        if (dist < radius) {
            enemy.health -= damage;
            enemy.hitFlash = 0.1;
            spawnDamageNumber(enemy.x, enemy.y, damage);
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
            return;
        }
    }

    // Otherwise give bonus
    const roll = Math.random();
    if (roll < 0.4) {
        player.exp += 10;
        while (player.exp >= player.expToNextLevel) {
            levelUp();
        }
    } else if (roll < 0.7) {
        player.health = Math.min(player.health + 30, player.maxHealth);
    } else {
        coins += Math.floor(25 * player.goldMultiplier);
    }
}

function levelUp() {
    player.level++;
    player.exp -= player.expToNextLevel;
    player.expToNextLevel = Math.floor(player.expToNextLevel * 1.2) + 5;

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

        const rarityClass = option.rarity ? `rarity-${option.rarity}` : '';
        const levelDisplay = option.currentLevel ? ` LV${option.currentLevel + 1}` : ' NEW';

        btn.innerHTML = `
            <div class="upgrade-icon">${option.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name ${rarityClass}">${option.name}${levelDisplay}</div>
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

    // Add weapon upgrades (existing weapons)
    for (const weapon of player.weapons) {
        if (weapon.level < weapon.maxLevel && !weapon.evolved) {
            const type = WEAPON_TYPES[weapon.id];
            options.push({
                type: 'weaponUpgrade',
                id: weapon.id,
                icon: type.icon,
                name: type.name,
                desc: getWeaponUpgradeDesc(weapon.id, weapon.level),
                rarity: type.rarity,
                currentLevel: weapon.level
            });
        }
    }

    // Add new weapons (if slots available)
    if (player.weapons.length < MAX_WEAPONS) {
        const newWeapons = Object.keys(WEAPON_TYPES).filter(w => !player.weapons.some(pw => pw.id === w));
        for (const weaponId of newWeapons) {
            const type = WEAPON_TYPES[weaponId];
            options.push({
                type: 'newWeapon',
                id: weaponId,
                icon: type.icon,
                name: type.name,
                desc: type.desc,
                rarity: type.rarity
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
                name: type.name,
                desc: type.desc,
                rarity: type.rarity,
                currentLevel: passive.level
            });
        }
    }

    // Add new passives (if slots available)
    if (player.passives.length < MAX_PASSIVES) {
        const newPassives = Object.keys(PASSIVE_TYPES).filter(p => !player.passives.some(pp => pp.id === p));
        for (const passiveId of newPassives) {
            const type = PASSIVE_TYPES[passiveId];
            options.push({
                type: 'newPassive',
                id: passiveId,
                icon: type.icon,
                name: type.name,
                desc: type.desc,
                rarity: type.rarity
            });
        }
    }

    // Weight by rarity
    const weightedOptions = options.map(opt => ({
        ...opt,
        weight: getOptionWeight(opt.rarity)
    }));

    // Shuffle and return 3-4 options
    const shuffled = weightedSort(weightedOptions);
    return shuffled.slice(0, Math.min(4, shuffled.length));
}

function getWeaponUpgradeDesc(weaponId, currentLevel) {
    const type = WEAPON_TYPES[weaponId];
    const nextLevel = currentLevel + 1;

    if (nextLevel === type.maxLevel) {
        return `Max level! Evolves with ${PASSIVE_TYPES[type.requiresPassive]?.name || 'item'}`;
    }

    const bonuses = [];
    if (nextLevel % 2 === 0) bonuses.push('+1 Projectile');
    bonuses.push('+10% Damage');
    bonuses.push('-3% Cooldown');

    return bonuses.join(', ');
}

function getOptionWeight(rarity) {
    switch (rarity) {
        case 'legendary': return 5;
        case 'rare': return 15;
        case 'uncommon': return 30;
        default: return 50;
    }
}

function weightedSort(options) {
    return options
        .map(opt => ({ opt, sort: Math.random() * opt.weight }))
        .sort((a, b) => b.sort - a.sort)
        .map(x => x.opt);
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
    messageDiv.querySelector('p').innerHTML = `
        <span class="stat">Survived: ${formatTime(gameTime)}</span><br>
        <span class="stat">Kills: ${kills}</span><br>
        <span class="stat">Level: ${player.level}</span>
    `;
    messageDiv.classList.remove('hidden');
}

function victory() {
    gameState = 'victory';

    bestTime = Math.max(bestTime, Math.floor(gameTime));
    localStorage.setItem('survivor-best-time', bestTime);
    updateBestTimeDisplay();

    playSound('levelup');

    const messageDiv = document.getElementById('game-message');
    messageDiv.querySelector('h2').textContent = 'VICTORY!';
    messageDiv.querySelector('p').innerHTML = `
        <span class="stat">You survived 30 minutes!</span><br>
        <span class="stat">Kills: ${kills}</span><br>
        <span class="stat">Level: ${player.level}</span>
    `;
    messageDiv.classList.remove('hidden');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pause-btn').textContent = '▶️';
        showPauseOverlay();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        lastTime = performance.now();
        document.getElementById('pause-btn').textContent = '⏸️';
        hidePauseOverlay();
    }
}

function showPauseOverlay() {
    // Create pause overlay if it doesn't exist
    let overlay = document.getElementById('pause-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pause-overlay';
        document.getElementById('game-container').appendChild(overlay);
    }

    // Generate equipment details
    const weaponDetails = player.weapons.map(w => {
        const type = WEAPON_TYPES[w.id];
        const evolved = w.evolved ? EVOLVED_WEAPONS[w.evolvedId] : null;
        const displayName = evolved ? evolved.name : type.name;
        const displayIcon = evolved ? evolved.icon : type.icon;
        const levelText = w.evolved ? 'EVOLVED' : `LV ${w.level}/${w.maxLevel}`;
        const canEvolve = !w.evolved && w.level >= w.maxLevel && player.passives.some(p => p.id === type.requiresPassive);
        return `<div class="pause-equipment-item ${w.evolved ? 'evolved' : ''} ${canEvolve ? 'can-evolve' : ''}">
            <span class="eq-icon">${displayIcon}</span>
            <span class="eq-name">${displayName}</span>
            <span class="eq-level">${levelText}</span>
        </div>`;
    }).join('');

    const passiveDetails = player.passives.map(p => {
        const type = PASSIVE_TYPES[p.id];
        const isMax = p.level >= type.maxLevel;
        return `<div class="pause-equipment-item ${isMax ? 'maxed' : ''}">
            <span class="eq-icon">${type.icon}</span>
            <span class="eq-name">${type.name}</span>
            <span class="eq-level">LV ${p.level}/${type.maxLevel}</span>
        </div>`;
    }).join('');

    const arcanaDetails = player.arcanas.length > 0 ? player.arcanas.map(a => {
        const arcana = ARCANA_TYPES[a];
        return `<div class="pause-equipment-item arcana-item">
            <span class="eq-icon">${arcana.icon}</span>
            <span class="eq-name">${arcana.name}</span>
        </div>`;
    }).join('') : '<div class="pause-no-items">No Arcana</div>';

    overlay.innerHTML = `
        <h2>PAUSED</h2>
        <div class="pause-stats">
            <div class="pause-stat">
                <div class="pause-stat-label">Time</div>
                <div class="pause-stat-value">${formatTime(gameTime)}</div>
            </div>
            <div class="pause-stat">
                <div class="pause-stat-label">Kills</div>
                <div class="pause-stat-value">${kills}</div>
            </div>
            <div class="pause-stat">
                <div class="pause-stat-label">Level</div>
                <div class="pause-stat-value">${player.level}</div>
            </div>
            <div class="pause-stat">
                <div class="pause-stat-label">Coins</div>
                <div class="pause-stat-value">${coins}</div>
            </div>
        </div>
        <div class="pause-equipment">
            <div class="pause-section">
                <h3>WEAPONS</h3>
                <div class="pause-items">${weaponDetails || '<div class="pause-no-items">No weapons</div>'}</div>
            </div>
            <div class="pause-section">
                <h3>PASSIVES</h3>
                <div class="pause-items">${passiveDetails || '<div class="pause-no-items">No passives</div>'}</div>
            </div>
            <div class="pause-section">
                <h3>ARCANA</h3>
                <div class="pause-items">${arcanaDetails}</div>
            </div>
        </div>
        <button class="pause-resume-btn" onclick="togglePause()">RESUME</button>
        <p class="pause-hint">Press Space or Esc to continue</p>
    `;

    overlay.classList.remove('hidden');
}

function hidePauseOverlay() {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
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
    const isDark = document.body.classList.contains('dark-mode');
    ctx.fillStyle = isDark ? '#0a0a14' : '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu' || gameState === 'characterSelect' || gameState === 'arcanaSelect') {
        drawMenuBackground();
        return;
    }

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawPixelGrid();
    drawAreaEffects();
    drawExpGems();
    drawChests();
    drawProjectiles();
    drawOrbitingWeapons();
    drawBibleOrbits();
    drawEnemies();
    drawPlayer();
    drawDamageNumbers();

    ctx.restore();

    drawWeaponSlots();
    drawMinimap();
    drawKillCounter();
    drawBossHealthBar();
    drawArcanaIndicator();
}

function drawMenuBackground() {
    // Animated background for menu
    const time = Date.now() / 1000;

    ctx.fillStyle = 'rgba(138, 0, 0, 0.1)';
    for (let i = 0; i < 20; i++) {
        const x = Math.sin(time + i * 0.5) * canvas.width / 2 + canvas.width / 2;
        const y = ((time * 30 + i * 80) % (canvas.height + 100)) - 50;
        const size = 20 + Math.sin(time + i) * 10;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPixelGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    const gridSize = 64;
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;

    for (let x = startX; x < camera.x + canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, camera.y);
        ctx.lineTo(x, camera.y + canvas.height);
        ctx.stroke();
    }
    for (let y = startY; y < camera.y + canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(camera.x, y);
        ctx.lineTo(camera.x + canvas.width, y);
        ctx.stroke();
    }
}

function drawPlayer() {
    const x = Math.floor(player.x);
    const y = Math.floor(player.y);

    ctx.imageSmoothingEnabled = false;

    // Invincibility flash
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#4466aa';
    drawPixelRect(x - 4, y - 2, 8, 8);

    // Head
    ctx.fillStyle = '#ffcc99';
    drawPixelRect(x - 3, y - 8, 6, 6);

    // Hair based on character
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

    ctx.globalAlpha = 1;
}

function drawEnemies() {
    for (const enemy of enemies) {
        const x = Math.floor(enemy.x);
        const y = Math.floor(enemy.y);

        ctx.imageSmoothingEnabled = false;

        const flashColor = enemy.hitFlash > 0 ? '#ffffff' : null;
        const type = ENEMY_TYPES[enemy.type];
        const baseColor = type?.color || '#77aa77';

        // Shadow for bosses
        if (enemy.isBoss) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(x, y + 12, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        switch (enemy.type) {
            case 'bat':
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 4, y - 2, 8, 4);
                ctx.fillStyle = flashColor || '#338833';
                drawPixelRect(x - 8, y - 1, 4, 2);
                drawPixelRect(x + 4, y - 1, 4, 2);
                ctx.fillStyle = flashColor || '#ff0000';
                drawPixelRect(x - 2, y - 1, 2, 2);
                drawPixelRect(x + 1, y - 1, 2, 2);
                break;

            case 'skeleton':
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 5, y - 8, 10, 8);
                drawPixelRect(x - 4, y, 8, 8);
                ctx.fillStyle = flashColor || '#000000';
                drawPixelRect(x - 3, y - 6, 3, 3);
                drawPixelRect(x + 1, y - 6, 3, 3);
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

            case 'demon':
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 6, y - 6, 12, 12);
                ctx.fillStyle = flashColor || '#ffff00';
                drawPixelRect(x - 4, y - 4, 3, 3);
                drawPixelRect(x + 1, y - 4, 3, 3);
                ctx.fillStyle = flashColor || '#440000';
                drawPixelRect(x - 7, y - 10, 3, 4);
                drawPixelRect(x + 4, y - 10, 3, 4);
                break;

            case 'wraith':
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 5, y - 8, 10, 14);
                ctx.fillStyle = flashColor || '#ff00ff';
                drawPixelRect(x - 3, y - 5, 2, 2);
                drawPixelRect(x + 1, y - 5, 2, 2);
                ctx.globalAlpha = 1;
                break;

            case 'reaper':
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 5, y - 10, 10, 16);
                ctx.fillStyle = flashColor || '#ff0000';
                drawPixelRect(x - 3, y - 7, 2, 3);
                drawPixelRect(x + 1, y - 7, 2, 3);
                // Scythe
                ctx.fillStyle = flashColor || '#888888';
                drawPixelRect(x + 6, y - 12, 2, 14);
                drawPixelRect(x + 4, y - 14, 6, 2);
                break;

            // Bosses
            case 'giant':
            case 'necromancer':
            case 'vampire':
            case 'deathLord':
            case 'death':
            case 'redDeath':
                ctx.fillStyle = flashColor || baseColor;
                const size = enemy.isBoss ? 20 : 12;
                drawPixelRect(x - size / 2, y - size / 2 - 4, size, size);
                drawPixelRect(x - size / 2 - 2, y + size / 2 - 8, size + 4, size / 2);
                ctx.fillStyle = flashColor || '#ffff00';
                drawPixelRect(x - size / 4, y - size / 4 - 4, 3, 3);
                drawPixelRect(x + size / 4 - 3, y - size / 4 - 4, 3, 3);
                break;

            default: // zombie
                ctx.fillStyle = flashColor || '#8844aa';
                drawPixelRect(x - 4, y - 2, 8, 8);
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 3, y - 7, 6, 5);
                ctx.fillStyle = flashColor || '#ff4444';
                drawPixelRect(x - 2, y - 5, 2, 2);
                drawPixelRect(x + 1, y - 5, 2, 2);
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - 6, y - 1, 2, 5);
                drawPixelRect(x + 4, y - 1, 2, 5);
        }

        // Health bar
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.isBoss ? 40 : 16;
            const barY = y - (enemy.isBoss ? 22 : 12);
            ctx.fillStyle = '#440000';
            ctx.fillRect(x - barWidth / 2, barY, barWidth, 3);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x - barWidth / 2, barY, barWidth * (enemy.health / enemy.maxHealth), 3);

            // Boss name
            if (enemy.isBoss) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(enemy.type.toUpperCase(), x, barY - 4);
            }
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
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x, y, size / 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'knife') {
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = proj.color;
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillStyle = '#888888';
            ctx.fillRect(-6, -1, 4, 2);
            ctx.restore();
        } else if (proj.type === 'cross') {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Date.now() / 100);
            ctx.fillStyle = proj.color;
            ctx.fillRect(-size / 6, -size / 2, size / 3, size);
            ctx.fillRect(-size / 2, -size / 6, size, size / 3);
            ctx.restore();
        } else if (proj.type === 'runetracer') {
            ctx.fillStyle = proj.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Date.now() / 80);
            const s = size / 2;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.6, s * 0.8);
            ctx.lineTo(-s * 0.6, s * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
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
        } else if (effect.type === 'garlic') {
            ctx.strokeStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'lightning') {
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * (1 + (1 - alpha)), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'pentagram') {
            ctx.strokeStyle = effect.color;
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * alpha, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'madgroove') {
            // Mad Groove magnet pulse
            ctx.strokeStyle = effect.color;
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = 3;
            // Multiple expanding rings
            for (let i = 0; i < 3; i++) {
                const ringAlpha = (1 - alpha) + i * 0.2;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius * ringAlpha, 0, Math.PI * 2);
                ctx.stroke();
            }
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

function drawBibleOrbits() {
    for (const bible of bibleOrbits) {
        const x = player.x + Math.cos(bible.angle) * bible.distance;
        const y = player.y + Math.sin(bible.angle) * bible.distance;

        ctx.fillStyle = bible.color;
        ctx.save();
        ctx.translate(x, y);

        // Book shape
        ctx.fillRect(-6, -8, 12, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, -7, 10, 14);
        ctx.fillStyle = bible.color;
        ctx.fillRect(-1, -7, 2, 14);

        ctx.restore();
    }
}

function drawExpGems() {
    for (const gem of expGems) {
        const x = Math.floor(gem.x);
        const y = Math.floor(gem.y);

        ctx.fillStyle = gem.value >= 5 ? '#ff4444' : gem.value >= 3 ? '#44ff44' : '#44aaff';
        drawPixelRect(x - 2, y - 4, 4, 2);
        drawPixelRect(x - 3, y - 2, 6, 2);
        drawPixelRect(x - 2, y, 4, 2);
        drawPixelRect(x - 1, y + 2, 2, 2);

        ctx.fillStyle = gem.value >= 5 ? '#ff8888' : gem.value >= 3 ? '#88ff88' : '#88ccff';
        drawPixelRect(x - 1, y - 3, 2, 1);
    }
}

function drawChests() {
    for (const chest of chests) {
        const x = Math.floor(chest.x);
        const y = Math.floor(chest.y);

        const glow = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        ctx.fillStyle = '#8B4513';
        drawPixelRect(x - 8, y - 4, 16, 10);
        ctx.fillStyle = `rgba(212, 175, 55, ${glow})`;
        drawPixelRect(x - 6, y - 6, 12, 4);
        ctx.fillStyle = '#FFD700';
        drawPixelRect(x - 2, y - 2, 4, 4);
    }
}

function drawDamageNumbers() {
    for (const num of damageNumbers) {
        const screenX = num.x - camera.x;
        const screenY = num.y - camera.y;

        ctx.globalAlpha = num.alpha;
        ctx.font = num.isCrit ? 'bold 16px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = num.isCrit ? '#ff0000' : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(num.damage, screenX + camera.x, screenY + camera.y);
        ctx.fillText(num.damage, screenX + camera.x, screenY + camera.y);
        ctx.globalAlpha = 1;
    }
}

function drawWeaponSlots() {
    const slotSize = 32;
    const padding = 5;
    const startX = 10;
    const startY = canvas.height - slotSize - 12;

    // Draw "WEAPONS" label
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText('WEAPONS', startX, startY - 5);

    // Weapon slots
    for (let i = 0; i < MAX_WEAPONS; i++) {
        const x = startX + i * (slotSize + padding);

        // Slot background with gradient
        const grad = ctx.createLinearGradient(x, startY, x, startY + slotSize);
        grad.addColorStop(0, 'rgba(30, 30, 50, 0.9)');
        grad.addColorStop(1, 'rgba(10, 10, 20, 0.95)');
        ctx.fillStyle = grad;

        // Rounded rect
        drawRoundedRect(x, startY, slotSize, slotSize, 4);
        ctx.fill();

        if (player.weapons[i]) {
            const weapon = player.weapons[i];
            const weaponType = WEAPON_TYPES[weapon.id];
            const type = weapon.evolved ? EVOLVED_WEAPONS[weapon.evolvedId] : weaponType;

            // Check if evolution is ready
            const evolutionReady = !weapon.evolved && weapon.level >= weapon.maxLevel &&
                player.passives.some(p => p.id === weaponType.requiresPassive);

            // Border color based on state
            if (weapon.evolved) {
                // Evolved weapon - purple glow
                ctx.strokeStyle = '#ff44ff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ff44ff';
                ctx.shadowBlur = 8;
            } else if (evolutionReady) {
                // Evolution ready - gold pulsing
                const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10 * pulse;
            } else {
                // Normal - rarity color
                ctx.strokeStyle = getRarityColor(weaponType.rarity);
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }

            drawRoundedRect(x, startY, slotSize, slotSize, 4);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Weapon icon
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(type.icon, x + slotSize / 2, startY + slotSize / 2 - 2);

            // Level indicator background
            ctx.fillStyle = weapon.evolved ? '#ff44ff' : 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(x + slotSize - 12, startY + slotSize - 12, 12, 12);

            // Level text
            ctx.font = 'bold 8px sans-serif';
            ctx.fillStyle = weapon.evolved ? '#fff' : '#ffd700';
            ctx.fillText(weapon.evolved ? 'E' : weapon.level, x + slotSize - 6, startY + slotSize - 5);

            // Cooldown overlay
            if (weapon.cooldownTimer > 0) {
                const weaponData = WEAPON_TYPES[weapon.id];
                let cooldown = weaponData.cooldown * player.cooldownMultiplier;
                const cooldownPercent = weapon.cooldownTimer / cooldown;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(x + 1, startY + 1, slotSize - 2, (slotSize - 2) * cooldownPercent);
            }
        } else {
            // Empty slot
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            drawRoundedRect(x, startY, slotSize, slotSize, 4);
            ctx.stroke();
        }
    }

    // Draw "PASSIVES" label
    const passiveStartX = canvas.width - (MAX_PASSIVES * (slotSize + padding)) - 10 + padding;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText('PASSIVES', canvas.width - 10, startY - 5);

    // Passive slots
    for (let i = 0; i < MAX_PASSIVES; i++) {
        const x = passiveStartX + i * (slotSize + padding);

        // Slot background
        const grad = ctx.createLinearGradient(x, startY, x, startY + slotSize);
        grad.addColorStop(0, 'rgba(20, 30, 20, 0.9)');
        grad.addColorStop(1, 'rgba(10, 15, 10, 0.95)');
        ctx.fillStyle = grad;

        drawRoundedRect(x, startY, slotSize, slotSize, 4);
        ctx.fill();

        if (player.passives[i]) {
            const passive = player.passives[i];
            const type = PASSIVE_TYPES[passive.id];
            const isMaxLevel = passive.level >= type.maxLevel;

            // Border based on rarity
            ctx.strokeStyle = isMaxLevel ? '#ffd700' : getRarityColor(type.rarity);
            ctx.lineWidth = isMaxLevel ? 2 : 1;
            drawRoundedRect(x, startY, slotSize, slotSize, 4);
            ctx.stroke();

            // Passive icon
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(type.icon, x + slotSize / 2, startY + slotSize / 2 - 2);

            // Level indicator
            ctx.fillStyle = isMaxLevel ? '#ffd700' : 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(x + slotSize - 12, startY + slotSize - 12, 12, 12);

            ctx.font = 'bold 8px sans-serif';
            ctx.fillStyle = isMaxLevel ? '#000' : '#4ade80';
            ctx.fillText(passive.level, x + slotSize - 6, startY + slotSize - 5);
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            drawRoundedRect(x, startY, slotSize, slotSize, 4);
            ctx.stroke();
        }
    }
}

function getRarityColor(rarity) {
    switch (rarity) {
        case 'legendary': return '#fbbf24';
        case 'rare': return '#60a5fa';
        case 'uncommon': return '#4ade80';
        default: return '#666';
    }
}

function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawMinimap() {
    const mapSize = 90;
    const mapX = canvas.width - mapSize - 10;
    const mapY = 60;
    const borderRadius = 6;

    // Background with gradient
    const grad = ctx.createLinearGradient(mapX, mapY, mapX, mapY + mapSize);
    grad.addColorStop(0, 'rgba(15, 15, 25, 0.9)');
    grad.addColorStop(1, 'rgba(5, 5, 15, 0.95)');
    ctx.fillStyle = grad;

    drawRoundedRect(mapX, mapY, mapSize, mapSize, borderRadius);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    drawRoundedRect(mapX, mapY, mapSize, mapSize, borderRadius);
    ctx.stroke();

    // Inner map area
    const innerPadding = 4;
    const innerSize = mapSize - innerPadding * 2;
    const innerX = mapX + innerPadding;
    const innerY = mapY + innerPadding;

    // Grid lines on map
    ctx.strokeStyle = 'rgba(50, 50, 70, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(innerX + (innerSize / 4) * i, innerY);
        ctx.lineTo(innerX + (innerSize / 4) * i, innerY + innerSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(innerX, innerY + (innerSize / 4) * i);
        ctx.lineTo(innerX + innerSize, innerY + (innerSize / 4) * i);
        ctx.stroke();
    }

    // Viewport rectangle
    const viewX = innerX + ((camera.x) / WORLD_SIZE) * innerSize;
    const viewY = innerY + ((camera.y) / WORLD_SIZE) * innerSize;
    const viewW = (canvas.width / WORLD_SIZE) * innerSize;
    const viewH = (canvas.height / WORLD_SIZE) * innerSize;

    ctx.strokeStyle = 'rgba(68, 136, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);

    // Enemy dots (batch drawing for performance)
    ctx.fillStyle = 'rgba(255, 80, 80, 0.6)';
    for (const enemy of enemies) {
        if (enemy.isBoss) continue;
        const enemyMapX = innerX + (enemy.x / WORLD_SIZE) * innerSize;
        const enemyMapY = innerY + (enemy.y / WORLD_SIZE) * innerSize;
        ctx.fillRect(enemyMapX - 1, enemyMapY - 1, 2, 2);
    }

    // Boss dots (larger, pulsing)
    const bossPulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
    for (const enemy of enemies) {
        if (!enemy.isBoss) continue;
        const enemyMapX = innerX + (enemy.x / WORLD_SIZE) * innerSize;
        const enemyMapY = innerY + (enemy.y / WORLD_SIZE) * innerSize;

        ctx.fillStyle = `rgba(255, 0, 0, ${bossPulse})`;
        ctx.beginPath();
        ctx.arc(enemyMapX, enemyMapY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Boss skull icon
        ctx.fillStyle = '#fff';
        ctx.font = '6px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', enemyMapX, enemyMapY);
    }

    // Chest dots
    ctx.fillStyle = '#ffd700';
    for (const chest of chests) {
        const chestMapX = innerX + (chest.x / WORLD_SIZE) * innerSize;
        const chestMapY = innerY + (chest.y / WORLD_SIZE) * innerSize;
        ctx.fillRect(chestMapX - 2, chestMapY - 2, 4, 4);
    }

    // Player dot (always on top)
    const playerMapX = innerX + (player.x / WORLD_SIZE) * innerSize;
    const playerMapY = innerY + (player.y / WORLD_SIZE) * innerSize;

    // Player glow
    ctx.fillStyle = 'rgba(68, 170, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(playerMapX, playerMapY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    const dirX = lastMoveDirection.x;
    const dirY = lastMoveDirection.y;
    if (dirX !== 0 || dirY !== 0) {
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerMapX, playerMapY);
        ctx.lineTo(playerMapX + dirX * 5, playerMapY + dirY * 5);
        ctx.stroke();
    }
}

function drawKillCounter() {
    // Timer and stats at top center
    const centerX = canvas.width / 2;

    // Main timer box
    const timerW = 100;
    const timerH = 36;
    const timerX = centerX - timerW / 2;
    const timerY = 8;

    // Timer background
    const grad = ctx.createLinearGradient(timerX, timerY, timerX, timerY + timerH);
    grad.addColorStop(0, 'rgba(20, 20, 35, 0.95)');
    grad.addColorStop(1, 'rgba(10, 10, 20, 0.98)');
    ctx.fillStyle = grad;
    drawRoundedRect(timerX, timerY, timerW, timerH, 6);
    ctx.fill();

    // Border
    const timeProgress = gameTime / VICTORY_TIME;
    const borderColor = timeProgress > 0.8 ? '#ff4444' : timeProgress > 0.5 ? '#ffd700' : '#4488ff';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    drawRoundedRect(timerX, timerY, timerW, timerH, 6);
    ctx.stroke();

    // Timer text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTime(gameTime), centerX, timerY + 13);

    // Progress bar under timer
    const barY = timerY + timerH - 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(timerX + 4, barY, timerW - 8, 4);

    ctx.fillStyle = borderColor;
    ctx.fillRect(timerX + 4, barY, (timerW - 8) * timeProgress, 4);

    // Wave indicator
    let currentWave = 1;
    for (let i = 0; i < WAVE_EVENTS.length; i++) {
        if (gameTime >= WAVE_EVENTS[i].time) currentWave = i + 1;
    }
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(`WAVE ${currentWave}`, centerX, timerY + timerH - 3);

    // Kill counter (left of timer)
    const killX = timerX - 60;
    const killW = 55;
    const killH = 28;

    const killGrad = ctx.createLinearGradient(killX, timerY, killX, timerY + killH);
    killGrad.addColorStop(0, 'rgba(40, 20, 20, 0.9)');
    killGrad.addColorStop(1, 'rgba(20, 10, 10, 0.95)');
    ctx.fillStyle = killGrad;
    drawRoundedRect(killX, timerY + 4, killW, killH, 4);
    ctx.fill();

    ctx.strokeStyle = '#662222';
    ctx.lineWidth = 1;
    drawRoundedRect(killX, timerY + 4, killW, killH, 4);
    ctx.stroke();

    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💀 ${kills}`, killX + killW / 2, timerY + 4 + killH / 2 + 1);

    // Coin counter (right of timer)
    const coinX = timerX + timerW + 5;
    const coinW = 55;
    const coinH = 28;

    const coinGrad = ctx.createLinearGradient(coinX, timerY, coinX, timerY + coinH);
    coinGrad.addColorStop(0, 'rgba(40, 35, 10, 0.9)');
    coinGrad.addColorStop(1, 'rgba(20, 18, 5, 0.95)');
    ctx.fillStyle = coinGrad;
    drawRoundedRect(coinX, timerY + 4, coinW, coinH, 4);
    ctx.fill();

    ctx.strokeStyle = '#665522';
    ctx.lineWidth = 1;
    drawRoundedRect(coinX, timerY + 4, coinW, coinH, 4);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💰 ${coins}`, coinX + coinW / 2, timerY + 4 + coinH / 2 + 1);
}

function drawBossHealthBar() {
    // Find active boss
    const boss = enemies.find(e => e.isBoss);
    if (!boss) return;

    const barWidth = canvas.width * 0.6;
    const barHeight = 24;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 52; // Below the timer

    // Background
    const grad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    grad.addColorStop(0, 'rgba(30, 10, 10, 0.95)');
    grad.addColorStop(1, 'rgba(15, 5, 5, 0.98)');
    ctx.fillStyle = grad;
    drawRoundedRect(barX, barY, barWidth, barHeight, 4);
    ctx.fill();

    // Border with pulsing effect
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(255, 0, 0, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10 * pulse;
    drawRoundedRect(barX, barY, barWidth, barHeight, 4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Health bar fill
    const healthPercent = Math.max(0, boss.health / boss.maxHealth);
    const healthWidth = (barWidth - 6) * healthPercent;

    // Health gradient
    const healthGrad = ctx.createLinearGradient(barX + 3, barY + 3, barX + 3, barY + barHeight - 6);
    healthGrad.addColorStop(0, '#ff4444');
    healthGrad.addColorStop(0.5, '#cc0000');
    healthGrad.addColorStop(1, '#880000');
    ctx.fillStyle = healthGrad;
    ctx.fillRect(barX + 3, barY + 3, healthWidth, barHeight - 6);

    // Health shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX + 3, barY + 3, healthWidth, (barHeight - 6) / 3);

    // Boss name
    const bossType = ENEMY_TYPES[boss.type];
    const bossName = boss.type.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6666';
    ctx.textBaseline = 'middle';
    ctx.fillText(`💀 ${bossName}`, barX + barWidth / 2, barY + barHeight / 2 - 1);

    // Health percentage
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(healthPercent * 100)}%`, barX + barWidth - 8, barY + barHeight / 2);
}

function drawArcanaIndicator() {
    // Show active arcana in bottom left corner
    if (!player.arcanas || player.arcanas.length === 0) return;

    const arcanaId = player.arcanas[0];
    const arcana = ARCANA_TYPES[arcanaId];
    if (!arcana) return;

    const x = 10;
    const y = canvas.height - 85; // Above weapon slots

    // Background
    const size = 40;
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, 'rgba(50, 30, 70, 0.9)');
    grad.addColorStop(1, 'rgba(30, 15, 50, 0.95)');
    ctx.fillStyle = grad;
    drawRoundedRect(x, y, size, size, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#aa44ff';
    ctx.lineWidth = 2;
    drawRoundedRect(x, y, size, size, 6);
    ctx.stroke();

    // Icon
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arcana.icon, x + size / 2, y + size / 2);

    // Label
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#aa44ff';
    ctx.textAlign = 'left';
    ctx.fillText('ARCANA', x, y - 4);

    // Show Iron Blue Will stacks
    if (hasArcana('ironBlue') && player.damageOnHitStacks > 0) {
        ctx.fillStyle = '#4488ff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x${player.damageOnHitStacks}`, x + size / 2, y + size + 10);
    }

    // Show Mad Groove timer
    if (hasArcana('madGroove')) {
        const timeToNext = 120 - player.magnetPulseTimer;
        if (timeToNext > 0 && timeToNext < 120) {
            ctx.fillStyle = '#ff44ff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(timeToNext)}s`, x + size / 2, y + size + 10);
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
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'shoot':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.02);
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.02);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.02);
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
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
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
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.24);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case 'upgrade':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.12);
                gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.12);
                break;
            case 'gameover':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
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
