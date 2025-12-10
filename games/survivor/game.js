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
let gameState = 'menu'; // menu, stageSelect, characterSelect, arcanaSelect, playing, paused, levelup, gameover, victory
let gameLoop = null;
let lastTime = 0;
let deltaTime = 0;

// Game stats
let gameTime = 0;
let kills = 0;
let coins = 0;
let totalCoins = parseInt(localStorage.getItem('survivor-total-coins')) || 0;
let bestTime = parseInt(localStorage.getItem('survivor-best-time')) || 0;

// Stage definitions (matching Vampire Survivors)
const STAGES = {
    madForest: {
        name: 'Mad Forest',
        desc: 'A dark forest teeming with monsters',
        icon: '🌲',
        bgColor: '#0a1a0a',
        bgPattern: 'trees',
        modifiers: {},
        unlocked: true,
        unlockCondition: null,
        hyper: { unlocked: false, moveSpeed: 0.5, gold: 0.5, luck: 0.1 }
    },
    inlaidLibrary: {
        name: 'Inlaid Library',
        desc: 'Endless corridors of ancient tomes',
        icon: '📚',
        bgColor: '#1a1a2e',
        bgPattern: 'library',
        modifiers: { moveSpeed: 0.25 },
        unlocked: false,
        unlockCondition: { type: 'level', stage: 'madForest', value: 20 },
        hyper: { unlocked: false, moveSpeed: 0.9, gold: 0.5, luck: 0.1 }
    },
    dairyPlant: {
        name: 'Dairy Plant',
        desc: 'An industrial facility with deadly traps',
        icon: '🏭',
        bgColor: '#1e1e24',
        bgPattern: 'factory',
        modifiers: { moveSpeed: 0.25, gold: 0.2 },
        unlocked: false,
        unlockCondition: { type: 'level', stage: 'inlaidLibrary', value: 40 },
        hyper: { unlocked: false, moveSpeed: 0.9, gold: 0.7, luck: 0.1 },
        hasTrapEvents: true
    },
    galloTower: {
        name: 'Gallo Tower',
        desc: 'A vertical challenge ascending the tower',
        icon: '🗼',
        bgColor: '#2a1a2a',
        bgPattern: 'tower',
        modifiers: { moveSpeed: 0.1, luck: 0.1 },
        unlocked: false,
        unlockCondition: { type: 'level', stage: 'dairyPlant', value: 60 },
        hyper: { unlocked: false, moveSpeed: 0.8, gold: 0.6, luck: 0.2 }
    },
    cappellaMagna: {
        name: 'Cappella Magna',
        desc: 'The final stage. Face the ultimate challenge.',
        icon: '⛪',
        bgColor: '#1a0a1a',
        bgPattern: 'cathedral',
        modifiers: { damage: 0.2, maxHealth: -0.2 },
        unlocked: false,
        unlockCondition: { type: 'victory', stage: 'galloTower' },
        hyper: { unlocked: false, moveSpeed: 1.0, gold: 1.0, luck: 0.2 }
    }
};

let selectedStage = 'madForest';
let currentStageModifiers = {};

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
        damageMultiplier: 1.4,
        healsOnKill: 1,
        critChance: 0.1,
        unionWith: 'ventoSacro',
        unionResult: 'fuwalafuwaloo'
    },
    holyWand: {
        name: 'Holy Wand',
        desc: 'Evolved Wand - No cooldown, fires rapidly',
        icon: '✨',
        damageMultiplier: 1.0,
        cooldownMultiplier: 0.35
    },
    thousandEdge: {
        name: 'Thousand Edge',
        desc: 'Evolved Knife - Fires many projectiles',
        icon: '⚔️',
        damageMultiplier: 0.9,
        amountBonus: 2,
        noCooldown: true
    },
    deathSpiral: {
        name: 'Death Spiral',
        desc: 'Evolved Axe - Orbits around player',
        icon: '💀',
        damageMultiplier: 1.15,
        orbits: true
    },
    hellfire: {
        name: 'Hellfire',
        desc: 'Evolved Fire - Causes explosions',
        icon: '☄️',
        damageMultiplier: 1.35,
        explosive: true
    },
    laBorra: {
        name: 'La Borra',
        desc: 'Evolved Water - Follows the player',
        icon: '🌊',
        damageMultiplier: 1.15,
        followsPlayer: true
    },
    unholyVespers: {
        name: 'Unholy Vespers',
        desc: 'Evolved Bible - Never expires',
        icon: '📕',
        damageMultiplier: 1.2,
        permanent: true,
        amountBonus: 1
    },
    heavenSword: {
        name: 'Heaven Sword',
        desc: 'Evolved Cross - Larger and deals more damage',
        icon: '🗡️',
        damageMultiplier: 1.6,
        areaMultiplier: 1.3
    },
    soulEater: {
        name: 'Soul Eater',
        desc: 'Evolved Garlic - Steals health from enemies',
        icon: '👻',
        damageMultiplier: 1.3,
        healsOnHit: true
    },
    thunderLoop: {
        name: 'Thunder Loop',
        desc: 'Evolved Lightning - Chains between enemies',
        icon: '🌩️',
        damageMultiplier: 1.2,
        chains: 2
    },
    noFuture: {
        name: 'NO FUTURE',
        desc: 'Evolved Runetracer - Explodes on expiration',
        icon: '💥',
        damageMultiplier: 1.35,
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
        damageMultiplier: 1.6,
        amountBonus: 1,
        areaMultiplier: 1.3
    },
    fuwalafuwaloo: {
        name: 'Fuwalafuwaloo',
        desc: 'Union of Vento Sacro and Bloody Tear. Ultimate slash.',
        icon: '🌸',
        requires: ['ventoSacro', 'bloodyTear'],
        damageMultiplier: 1.8,
        critChance: 0.2
    },
    phieraggi: {
        name: 'Phieraggi',
        desc: 'Union of Phiera and Eight. Dual wielding mastery.',
        icon: '🔫',
        requires: ['phiera', 'eight'],
        damageMultiplier: 1.5,
        amountBonus: 2
    }
};

// Merge additional weapons into WEAPON_TYPES for Union
Object.assign(WEAPON_TYPES, {
    peachone: {
        name: 'Peachone',
        desc: 'Bombards in a circular area with holy light',
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
        desc: 'Bombards in a circular area with dark energy',
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
    },
    phiera: {
        name: 'Phiera Der Tuphello',
        desc: 'Fires rapidly in four fixed directions',
        icon: '🔫',
        damage: 8,
        cooldown: 0.3,
        area: 0.8,
        speed: 2.5,
        amount: 4,
        pierce: 0,
        evolvesTo: null,
        unionWith: 'eight',
        unionResult: 'phieraggi',
        rarity: 'rare'
    },
    eight: {
        name: 'Eight The Sparrow',
        desc: 'Fires rapidly in four fixed directions (opposite)',
        icon: '🐦',
        damage: 8,
        cooldown: 0.3,
        area: 0.8,
        speed: 2.5,
        amount: 4,
        pierce: 0,
        evolvesTo: null,
        unionWith: 'phiera',
        unionResult: 'phieraggi',
        rarity: 'rare'
    },
    songOfMana: {
        name: 'Song of Mana',
        desc: 'Creates vertical damaging zones',
        icon: '🎵',
        damage: 15,
        cooldown: 2.0,
        area: 1.2,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        duration: 2.5,
        evolvesTo: 'mannajja',
        requiresPassive: 'stoneMask',
        rarity: 'uncommon'
    },
    ventoSacro: {
        name: 'Vento Sacro',
        desc: 'Attacks in a fan pattern around you',
        icon: '🌀',
        damage: 12,
        cooldown: 1.0,
        area: 1.3,
        speed: 1.0,
        amount: 1,
        pierce: 2,
        evolvesTo: null,
        unionWith: 'bloodyTear',
        unionResult: 'fuwalafuwaloo',
        rarity: 'rare'
    }
});

// Add additional evolved weapons
Object.assign(EVOLVED_WEAPONS, {
    mannajja: {
        name: 'Mannajja',
        desc: 'Evolved Song of Mana - Massive vertical beams',
        icon: '⚔️',
        damageMultiplier: 2.0,
        areaMultiplier: 1.5
    }
});

// Register Union weapons in WEAPON_TYPES so they can fire properly
Object.assign(WEAPON_TYPES, {
    vandalier: {
        name: 'Vandalier',
        desc: 'Union of Peachone and Ebony Wings. Bombards everywhere.',
        icon: '🦅',
        damage: 18,
        cooldown: 2.5,
        area: 1.3,
        speed: 0.5,
        amount: 4,
        pierce: -1,
        duration: 2.5,
        rarity: 'union',
        isUnion: true
    },
    phieraggi: {
        name: 'Phieraggi',
        desc: 'Union of Phiera and Eight. Dual wielding mastery.',
        icon: '🔫',
        damage: 12,
        cooldown: 0.25,
        area: 1.0,
        speed: 2.8,
        amount: 6,
        pierce: 2,
        rarity: 'union',
        isUnion: true
    },
    fuwalafuwaloo: {
        name: 'Fuwalafuwaloo',
        desc: 'Union of Vento Sacro and Bloody Tear. Ultimate slash.',
        icon: '🌸',
        damage: 22,
        cooldown: 1.0,
        area: 1.5,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        rarity: 'union',
        isUnion: true,
        critChance: 0.2
    },
    bloodyTear: {
        name: 'Bloody Tear',
        desc: 'Evolved Whip - Critical hits and heals on kill',
        icon: '🩸',
        damage: 18,
        cooldown: 0.8,
        area: 1.3,
        speed: 1.0,
        amount: 1,
        pierce: -1,
        rarity: 'evolved',
        isEvolved: true,
        unionWith: 'ventoSacro',
        unionResult: 'fuwalafuwaloo'
    }
});

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

// Minute-based events (like Vampire Survivors) - balanced difficulty curve
const WAVE_EVENTS = [
    { time: 0, enemies: ['zombie'], spawnRate: 2.0, count: 1 },
    { time: 30, enemies: ['zombie', 'bat'], spawnRate: 1.8, count: 2 },
    { time: 60, enemies: ['zombie', 'bat', 'skeleton'], spawnRate: 1.6, count: 2 },
    { time: 90, boss: 'giant', spawnRate: 1.5, count: 3 },
    { time: 120, enemies: ['zombie', 'bat', 'skeleton', 'ghost'], spawnRate: 1.4, count: 3 },
    { time: 150, enemies: ['bat', 'skeleton', 'ghost'], spawnRate: 1.3, count: 4 },
    { time: 180, boss: 'necromancer', spawnRate: 1.2, count: 4 },
    { time: 240, enemies: ['skeleton', 'ghost', 'demon'], spawnRate: 1.1, count: 5 },
    { time: 300, boss: 'vampire', spawnRate: 1.0, count: 5 },
    { time: 360, enemies: ['ghost', 'demon', 'wraith'], spawnRate: 0.9, count: 6 },
    { time: 420, enemies: ['demon', 'wraith'], spawnRate: 0.85, count: 6 },
    { time: 480, boss: 'deathLord', spawnRate: 0.8, count: 7 },
    { time: 540, enemies: ['demon', 'wraith'], spawnRate: 0.75, count: 7 },
    { time: 600, enemies: ['demon', 'wraith', 'reaper'], spawnRate: 0.7, count: 8 },
    { time: 720, enemies: ['wraith', 'reaper'], spawnRate: 0.6, count: 9 },
    { time: 840, enemies: ['reaper'], spawnRate: 0.55, count: 10 },
    { time: 900, boss: 'death', spawnRate: 0.5, count: 10 },
    { time: 1020, enemies: ['reaper'], spawnRate: 0.45, count: 12 },
    { time: 1200, enemies: ['reaper'], spawnRate: 0.4, count: 14 },
    { time: 1350, enemies: ['reaper'], spawnRate: 0.35, count: 16 },
    { time: 1500, boss: 'redDeath', spawnRate: 0.3, count: 18 },
    { time: 1650, enemies: ['reaper'], spawnRate: 0.25, count: 20 }
];

const ENEMY_TYPES = {
    zombie: { healthMult: 1, speedMult: 1, damageMult: 1, expValue: 1, color: '#77aa77' },
    bat: { healthMult: 0.5, speedMult: 1.8, damageMult: 0.7, expValue: 1, color: '#44aa44' },
    skeleton: { healthMult: 2, speedMult: 0.7, damageMult: 1.3, expValue: 3, color: '#cccccc' },
    ghost: { healthMult: 0.8, speedMult: 1.2, damageMult: 1.1, expValue: 2, color: '#8888ff' },
    demon: { healthMult: 2.5, speedMult: 0.9, damageMult: 1.6, expValue: 5, color: '#ff4444' },
    wraith: { healthMult: 1.5, speedMult: 1.4, damageMult: 1.5, expValue: 4, color: '#aa66aa' },
    reaper: { healthMult: 3.5, speedMult: 1.0, damageMult: 2.0, expValue: 8, color: '#222222' },
    // Bosses
    giant: { healthMult: 25, speedMult: 0.4, damageMult: 2.5, expValue: 50, color: '#885522', isBoss: true },
    necromancer: { healthMult: 35, speedMult: 0.5, damageMult: 2.2, expValue: 75, color: '#664488', isBoss: true },
    vampire: { healthMult: 50, speedMult: 0.55, damageMult: 3.0, expValue: 100, color: '#880000', isBoss: true },
    deathLord: { healthMult: 80, speedMult: 0.5, damageMult: 4.0, expValue: 150, color: '#440044', isBoss: true },
    death: { healthMult: 150, speedMult: 0.6, damageMult: 6.0, expValue: 300, color: '#000000', isBoss: true },
    redDeath: { healthMult: 400, speedMult: 0.8, damageMult: 15, expValue: 666, color: '#ff0000', isBoss: true }
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

// Visual effects particles (for enhanced weapon effects)
let effectParticles = [];

// Screen shake effect
let screenShake = { intensity: 0, duration: 0, offsetX: 0, offsetY: 0 };

// Player hit flash overlay
let playerHitFlash = 0;

// Chain lightning visual lines
let lightningChains = [];

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

// Achievement System
const ACHIEVEMENTS = {
    // Combat achievements
    firstBlood: {
        id: 'firstBlood',
        name: 'First Blood',
        desc: 'Kill your first enemy',
        icon: '🩸',
        category: 'combat',
        rarity: 'common',
        condition: { type: 'kills', value: 1 }
    },
    slayer: {
        id: 'slayer',
        name: 'Slayer',
        desc: 'Kill 100 enemies in a single run',
        icon: '⚔️',
        category: 'combat',
        rarity: 'common',
        condition: { type: 'kills', value: 100 }
    },
    massExtinction: {
        id: 'massExtinction',
        name: 'Mass Extinction',
        desc: 'Kill 500 enemies in a single run',
        icon: '💀',
        category: 'combat',
        rarity: 'uncommon',
        condition: { type: 'kills', value: 500 }
    },
    apocalypse: {
        id: 'apocalypse',
        name: 'Apocalypse',
        desc: 'Kill 1000 enemies in a single run',
        icon: '☠️',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'kills', value: 1000 }
    },
    annihilator: {
        id: 'annihilator',
        name: 'Annihilator',
        desc: 'Kill 3000 enemies in a single run',
        icon: '🌋',
        category: 'combat',
        rarity: 'legendary',
        condition: { type: 'kills', value: 3000 }
    },

    // Survival achievements
    survivor5: {
        id: 'survivor5',
        name: 'Getting Started',
        desc: 'Survive for 5 minutes',
        icon: '⏱️',
        category: 'survival',
        rarity: 'common',
        condition: { type: 'time', value: 300 }
    },
    survivor10: {
        id: 'survivor10',
        name: 'Holding On',
        desc: 'Survive for 10 minutes',
        icon: '⏰',
        category: 'survival',
        rarity: 'uncommon',
        condition: { type: 'time', value: 600 }
    },
    survivor20: {
        id: 'survivor20',
        name: 'Endurance',
        desc: 'Survive for 20 minutes',
        icon: '🕐',
        category: 'survival',
        rarity: 'rare',
        condition: { type: 'time', value: 1200 }
    },
    survivor30: {
        id: 'survivor30',
        name: 'Ultimate Survivor',
        desc: 'Survive the full 30 minutes',
        icon: '🏆',
        category: 'survival',
        rarity: 'legendary',
        condition: { type: 'time', value: 1800 }
    },

    // Evolution achievements
    firstEvolution: {
        id: 'firstEvolution',
        name: 'Power Up!',
        desc: 'Evolve your first weapon',
        icon: '✨',
        category: 'evolution',
        rarity: 'uncommon',
        condition: { type: 'evolutions', value: 1 }
    },
    evolutionMaster: {
        id: 'evolutionMaster',
        name: 'Evolution Master',
        desc: 'Evolve 3 weapons in a single run',
        icon: '🌟',
        category: 'evolution',
        rarity: 'rare',
        condition: { type: 'evolutions', value: 3 }
    },
    fullEvolution: {
        id: 'fullEvolution',
        name: 'Maximum Power',
        desc: 'Evolve 6 weapons in a single run',
        icon: '💫',
        category: 'evolution',
        rarity: 'legendary',
        condition: { type: 'evolutions', value: 6 }
    },
    unionCreator: {
        id: 'unionCreator',
        name: 'Union Creator',
        desc: 'Create your first Union weapon',
        icon: '🔮',
        category: 'evolution',
        rarity: 'legendary',
        condition: { type: 'unions', value: 1 }
    },

    // Level achievements
    level10: {
        id: 'level10',
        name: 'Apprentice',
        desc: 'Reach level 10',
        icon: '📈',
        category: 'leveling',
        rarity: 'common',
        condition: { type: 'level', value: 10 }
    },
    level25: {
        id: 'level25',
        name: 'Veteran',
        desc: 'Reach level 25',
        icon: '📊',
        category: 'leveling',
        rarity: 'uncommon',
        condition: { type: 'level', value: 25 }
    },
    level50: {
        id: 'level50',
        name: 'Master',
        desc: 'Reach level 50',
        icon: '📉',
        category: 'leveling',
        rarity: 'rare',
        condition: { type: 'level', value: 50 }
    },
    level100: {
        id: 'level100',
        name: 'Legend',
        desc: 'Reach level 100',
        icon: '👑',
        category: 'leveling',
        rarity: 'legendary',
        condition: { type: 'level', value: 100 }
    },

    // Collection achievements
    weaponCollector: {
        id: 'weaponCollector',
        name: 'Weapon Collector',
        desc: 'Have 6 weapons equipped at once',
        icon: '🗃️',
        category: 'collection',
        rarity: 'uncommon',
        condition: { type: 'weapons', value: 6 }
    },
    passiveCollector: {
        id: 'passiveCollector',
        name: 'Passive Collector',
        desc: 'Have 6 passive items equipped at once',
        icon: '📦',
        category: 'collection',
        rarity: 'uncommon',
        condition: { type: 'passives', value: 6 }
    },
    chestHunter: {
        id: 'chestHunter',
        name: 'Chest Hunter',
        desc: 'Open 10 chests in a single run',
        icon: '📿',
        category: 'collection',
        rarity: 'uncommon',
        condition: { type: 'chests', value: 10 }
    },
    treasureMaster: {
        id: 'treasureMaster',
        name: 'Treasure Master',
        desc: 'Open 25 chests in a single run',
        icon: '💎',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'chests', value: 25 }
    },

    // Stage achievements
    madForestClear: {
        id: 'madForestClear',
        name: 'Forest Explorer',
        desc: 'Complete Mad Forest',
        icon: '🌲',
        category: 'stages',
        rarity: 'uncommon',
        condition: { type: 'stageVictory', value: 'madForest' }
    },
    inlaidLibraryClear: {
        id: 'inlaidLibraryClear',
        name: 'Scholar',
        desc: 'Complete Inlaid Library',
        icon: '📚',
        category: 'stages',
        rarity: 'rare',
        condition: { type: 'stageVictory', value: 'inlaidLibrary' }
    },
    dairyPlantClear: {
        id: 'dairyPlantClear',
        name: 'Factory Worker',
        desc: 'Complete Dairy Plant',
        icon: '🏭',
        category: 'stages',
        rarity: 'rare',
        condition: { type: 'stageVictory', value: 'dairyPlant' }
    },
    galloTowerClear: {
        id: 'galloTowerClear',
        name: 'Tower Climber',
        desc: 'Complete Gallo Tower',
        icon: '🗼',
        category: 'stages',
        rarity: 'rare',
        condition: { type: 'stageVictory', value: 'galloTower' }
    },
    cappellaMagnaClear: {
        id: 'cappellaMagnaClear',
        name: 'Divine Conqueror',
        desc: 'Complete Cappella Magna',
        icon: '⛪',
        category: 'stages',
        rarity: 'legendary',
        condition: { type: 'stageVictory', value: 'cappellaMagna' }
    },

    // Special achievements
    closeCall: {
        id: 'closeCall',
        name: 'Close Call',
        desc: 'Survive with less than 10% HP',
        icon: '💔',
        category: 'special',
        rarity: 'uncommon',
        condition: { type: 'lowHealth', value: 0.1 }
    },
    goldHoarder: {
        id: 'goldHoarder',
        name: 'Gold Hoarder',
        desc: 'Collect 500 coins in a single run',
        icon: '💰',
        category: 'special',
        rarity: 'uncommon',
        condition: { type: 'coins', value: 500 }
    },
    richBeyondMeasure: {
        id: 'richBeyondMeasure',
        name: 'Rich Beyond Measure',
        desc: 'Collect 2000 coins in a single run',
        icon: '🤑',
        category: 'special',
        rarity: 'rare',
        condition: { type: 'coins', value: 2000 }
    },
    arcanaUser: {
        id: 'arcanaUser',
        name: 'Arcana User',
        desc: 'Start a game with an Arcana',
        icon: '🃏',
        category: 'special',
        rarity: 'common',
        condition: { type: 'arcana', value: 1 }
    }
};

const ACHIEVEMENT_CATEGORIES = {
    combat: { name: 'Combat', order: 1 },
    survival: { name: 'Survival', order: 2 },
    evolution: { name: 'Evolution', order: 3 },
    leveling: { name: 'Leveling', order: 4 },
    collection: { name: 'Collection', order: 5 },
    stages: { name: 'Stages', order: 6 },
    special: { name: 'Special', order: 7 }
};

// Achievement state
let achievementData = JSON.parse(localStorage.getItem('survivor-achievements')) || {
    unlocked: {},
    stats: {
        totalKills: 0,
        totalCoinsCollected: 0,
        totalEvolutions: 0,
        totalUnions: 0,
        totalChestsOpened: 0,
        gamesPlayed: 0
    },
    newUnlocks: []
};

// Current run stats for achievements
let runStats = {
    kills: 0,
    evolutions: 0,
    unions: 0,
    chests: 0,
    coins: 0,
    lowHealthTriggered: false
};

// Achievement notification queue
let achievementQueue = [];
let isShowingAchievement = false;

function saveAchievements() {
    localStorage.setItem('survivor-achievements', JSON.stringify(achievementData));
}

function unlockAchievement(achievementId) {
    if (achievementData.unlocked[achievementId]) return false;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return false;

    achievementData.unlocked[achievementId] = {
        unlockedAt: Date.now()
    };
    achievementData.newUnlocks.push(achievementId);
    saveAchievements();

    // Queue notification
    achievementQueue.push(achievement);
    showNextAchievement();

    // Update badge
    updateAchievementBadge();

    // Play achievement sound
    playSound('achievement');

    return true;
}

function showNextAchievement() {
    if (isShowingAchievement || achievementQueue.length === 0) return;

    isShowingAchievement = true;
    const achievement = achievementQueue.shift();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="toast-icon">${achievement.icon}</div>
        <div class="toast-content">
            <div class="toast-title">Achievement Unlocked!</div>
            <div class="toast-name">${achievement.name}</div>
            <div class="toast-desc">${achievement.desc}</div>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.remove();
            isShowingAchievement = false;
            showNextAchievement();
        }, 300);
    }, 4000);
}

function checkAchievements() {
    // Check kill achievements
    checkCondition('kills', runStats.kills);

    // Check time achievements
    checkCondition('time', gameTime);

    // Check level achievements
    checkCondition('level', player.level);

    // Check evolution achievements
    checkCondition('evolutions', runStats.evolutions);

    // Check union achievements
    checkCondition('unions', runStats.unions);

    // Check weapon count
    checkCondition('weapons', player.weapons.length);

    // Check passive count
    checkCondition('passives', player.passives.length);

    // Check chest achievements
    checkCondition('chests', runStats.chests);

    // Check coin achievements
    checkCondition('coins', runStats.coins);

    // Check low health
    if (!runStats.lowHealthTriggered && player.health > 0 && player.health / player.maxHealth < 0.1) {
        runStats.lowHealthTriggered = true;
        checkCondition('lowHealth', 0.1);
    }
}

function checkCondition(type, value) {
    for (const achId in ACHIEVEMENTS) {
        const ach = ACHIEVEMENTS[achId];
        if (ach.condition.type === type && !achievementData.unlocked[achId]) {
            if (type === 'stageVictory') {
                if (value === ach.condition.value) {
                    unlockAchievement(achId);
                }
            } else if (type === 'lowHealth') {
                unlockAchievement(achId);
            } else if (value >= ach.condition.value) {
                unlockAchievement(achId);
            }
        }
    }
}

function checkStageVictoryAchievement(stageId) {
    checkCondition('stageVictory', stageId);
}

function checkArcanaAchievement() {
    if (selectedArcana) {
        checkCondition('arcana', 1);
    }
}

function updateAchievementBadge() {
    const badge = document.querySelector('#achievement-btn .badge');
    const newCount = achievementData.newUnlocks.length;

    if (newCount > 0) {
        badge.textContent = newCount;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

function openAchievementModal() {
    // Clear new unlocks when opening modal
    achievementData.newUnlocks = [];
    saveAchievements();
    updateAchievementBadge();

    const modal = document.getElementById('achievement-modal');
    const categoriesContainer = document.getElementById('achievement-categories');

    // Calculate progress
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = Object.keys(achievementData.unlocked).length;
    const percentage = Math.round((unlocked / total) * 100);

    document.getElementById('ach-unlocked').textContent = unlocked;
    document.getElementById('ach-total').textContent = total;
    document.getElementById('ach-progress-bar').style.width = `${percentage}%`;

    // Group achievements by category
    const categories = {};
    for (const achId in ACHIEVEMENTS) {
        const ach = ACHIEVEMENTS[achId];
        if (!categories[ach.category]) {
            categories[ach.category] = [];
        }
        categories[ach.category].push({ ...ach, id: achId });
    }

    // Render categories
    categoriesContainer.innerHTML = '';
    const sortedCategories = Object.keys(categories).sort(
        (a, b) => ACHIEVEMENT_CATEGORIES[a].order - ACHIEVEMENT_CATEGORIES[b].order
    );

    for (const catId of sortedCategories) {
        const catInfo = ACHIEVEMENT_CATEGORIES[catId];
        const achievements = categories[catId];

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'achievement-category';
        categoryDiv.innerHTML = `<h3>${catInfo.name}</h3>`;

        const listDiv = document.createElement('div');
        listDiv.className = 'achievement-list';

        for (const ach of achievements) {
            const isUnlocked = achievementData.unlocked[ach.id];
            const isNew = achievementData.newUnlocks && achievementData.newUnlocks.includes(ach.id);

            const itemDiv = document.createElement('div');
            itemDiv.className = `achievement-item rarity-${ach.rarity} ${isUnlocked ? 'unlocked' : 'locked'} ${isNew ? 'new-unlock' : ''}`;

            // Progress text for non-unlocked achievements
            let progressText = '';
            if (!isUnlocked && ach.condition.type !== 'stageVictory' && ach.condition.type !== 'lowHealth' && ach.condition.type !== 'arcana') {
                const currentValue = getCurrentValueForCondition(ach.condition.type);
                progressText = `<div class="ach-progress">${currentValue} / ${ach.condition.value}</div>`;
            }

            itemDiv.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                    ${progressText}
                </div>
                <div class="ach-check">${isUnlocked ? '✓' : '○'}</div>
            `;

            listDiv.appendChild(itemDiv);
        }

        categoryDiv.appendChild(listDiv);
        categoriesContainer.appendChild(categoryDiv);
    }

    modal.classList.add('show');
}

function getCurrentValueForCondition(type) {
    switch (type) {
        case 'kills': return runStats.kills || achievementData.stats.totalKills;
        case 'time': return Math.floor(gameTime || 0);
        case 'level': return player ? player.level : 0;
        case 'evolutions': return runStats.evolutions || 0;
        case 'unions': return runStats.unions || 0;
        case 'weapons': return player ? player.weapons.length : 0;
        case 'passives': return player ? player.passives.length : 0;
        case 'chests': return runStats.chests || 0;
        case 'coins': return runStats.coins || 0;
        default: return 0;
    }
}

function closeAchievementModal() {
    const modal = document.getElementById('achievement-modal');
    modal.classList.remove('show');
}

function resetRunStats() {
    runStats = {
        kills: 0,
        evolutions: 0,
        unions: 0,
        chests: 0,
        coins: 0,
        lowHealthTriggered: false
    };
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

    document.getElementById('new-game-btn').addEventListener('click', showStageSelect);
    document.getElementById('retry-btn').addEventListener('click', showStageSelect);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('achievement-btn').addEventListener('click', openAchievementModal);
    document.querySelector('#achievement-modal .modal-close').addEventListener('click', closeAchievementModal);
    document.getElementById('achievement-modal').addEventListener('click', (e) => {
        if (e.target.id === 'achievement-modal') closeAchievementModal();
    });

    setupJoystick();

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick);

    updateSoundIcon();
    updateBestTimeDisplay();
    updateAchievementBadge();

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
            showStageSelect();
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
        showStageSelect();
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

function showStageSelect() {
    gameState = 'stageSelect';
    document.getElementById('start-message').classList.add('hidden');
    document.getElementById('game-message').classList.add('hidden');
    document.getElementById('character-select').classList.add('hidden');
    hideArcanaSelect();

    // Create stage select modal if doesn't exist
    let stageModal = document.getElementById('stage-select');
    if (!stageModal) {
        stageModal = document.createElement('div');
        stageModal.id = 'stage-select';
        document.getElementById('game-container').appendChild(stageModal);
    }

    // Load stage unlock progress
    loadStageProgress();

    stageModal.innerHTML = `
        <h2>SELECT STAGE</h2>
        <p class="stage-subtitle">Choose your battlefield</p>
        <div id="stage-options"></div>
    `;

    const container = document.getElementById('stage-options');

    Object.entries(STAGES).forEach(([id, stage]) => {
        const isUnlocked = stage.unlocked;
        const btn = document.createElement('button');
        btn.className = 'stage-btn' + (id === selectedStage ? ' selected' : '') + (!isUnlocked ? ' locked' : '');

        const modifierText = Object.entries(stage.modifiers)
            .map(([key, val]) => {
                const sign = val > 0 ? '+' : '';
                const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
                return `${sign}${Math.round(val * 100)}% ${label}`;
            })
            .join(', ') || 'No modifiers';

        const lockReason = !isUnlocked ? getUnlockConditionText(stage.unlockCondition) : '';

        btn.innerHTML = `
            <div class="stage-icon">${isUnlocked ? stage.icon : '🔒'}</div>
            <div class="stage-info">
                <div class="stage-name">${stage.name}</div>
                <div class="stage-desc">${isUnlocked ? stage.desc : lockReason}</div>
                ${isUnlocked ? `<div class="stage-mods">${modifierText}</div>` : ''}
            </div>
            ${isUnlocked && stage.hyper && stage.hyper.unlocked ? '<div class="hyper-badge">HYPER</div>' : ''}
        `;

        if (isUnlocked) {
            btn.onclick = () => {
                selectedStage = id;
                document.querySelectorAll('.stage-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                playSound('pickup');
            };
        }

        container.appendChild(btn);
    });

    // Continue button
    const startBtn = document.createElement('button');
    startBtn.className = 'start-run-btn';
    startBtn.textContent = 'SELECT CHARACTER';
    startBtn.onclick = () => {
        stageModal.classList.add('hidden');
        showCharacterSelect();
    };
    container.appendChild(startBtn);

    stageModal.classList.remove('hidden');
}

function getUnlockConditionText(condition) {
    if (!condition) return 'Locked';

    switch (condition.type) {
        case 'level':
            return `Reach LV ${condition.value} in ${STAGES[condition.stage]?.name || 'previous stage'}`;
        case 'victory':
            return `Complete ${STAGES[condition.stage]?.name || 'previous stage'}`;
        case 'kills':
            return `Get ${condition.value} kills in ${STAGES[condition.stage]?.name || 'any stage'}`;
        default:
            return 'Locked';
    }
}

function loadStageProgress() {
    const progress = JSON.parse(localStorage.getItem('survivor-stage-progress') || '{}');

    Object.keys(STAGES).forEach(stageId => {
        const stage = STAGES[stageId];
        const savedProgress = progress[stageId];

        if (savedProgress) {
            stage.unlocked = savedProgress.unlocked || stage.unlocked;
            if (stage.hyper) {
                stage.hyper.unlocked = savedProgress.hyperUnlocked || false;
            }
        }

        // Check unlock conditions
        if (!stage.unlocked && stage.unlockCondition) {
            const cond = stage.unlockCondition;
            const condStageProgress = progress[cond.stage];

            if (condStageProgress) {
                if (cond.type === 'level' && condStageProgress.maxLevel >= cond.value) {
                    stage.unlocked = true;
                } else if (cond.type === 'victory' && condStageProgress.completed) {
                    stage.unlocked = true;
                } else if (cond.type === 'kills' && condStageProgress.maxKills >= cond.value) {
                    stage.unlocked = true;
                }
            }
        }
    });
}

function saveStageProgress() {
    const progress = JSON.parse(localStorage.getItem('survivor-stage-progress') || '{}');

    if (!progress[selectedStage]) {
        progress[selectedStage] = {};
    }

    progress[selectedStage].maxLevel = Math.max(progress[selectedStage].maxLevel || 0, player.level);
    progress[selectedStage].maxKills = Math.max(progress[selectedStage].maxKills || 0, kills);
    progress[selectedStage].maxTime = Math.max(progress[selectedStage].maxTime || 0, gameTime);

    if (gameTime >= VICTORY_TIME) {
        progress[selectedStage].completed = true;
    }

    // Save hyper unlocks (beat boss at 25 min)
    if (gameTime >= 1500 && enemies.some(e => e.isBoss && e.health <= 0)) {
        progress[selectedStage].hyperUnlocked = true;
    }

    localStorage.setItem('survivor-stage-progress', JSON.stringify(progress));
}

function showCharacterSelect() {
    gameState = 'characterSelect';
    document.getElementById('start-message').classList.add('hidden');
    document.getElementById('game-message').classList.add('hidden');

    const selectModal = document.getElementById('character-select');
    const container = document.getElementById('character-options');
    container.innerHTML = '';

    // Show selected stage at top
    const stageInfo = document.createElement('div');
    stageInfo.className = 'selected-stage-info';
    const stage = STAGES[selectedStage];
    stageInfo.innerHTML = `<span class="stage-label">Stage:</span> ${stage.icon} ${stage.name}`;
    container.appendChild(stageInfo);

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
    const stage = STAGES[selectedStage];
    currentStageModifiers = stage.modifiers;

    // Calculate stage modifiers
    const stageDamageMod = 1 + (currentStageModifiers.damage || 0);
    const stageHealthMod = 1 + (currentStageModifiers.maxHealth || 0);
    const stageSpeedMod = 1 + (currentStageModifiers.moveSpeed || 0);
    const stageGoldMod = 1 + (currentStageModifiers.gold || 0);
    const stageLuckMod = 1 + (currentStageModifiers.luck || 0);

    player = {
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2,
        baseSpeed: 100,
        speed: 100 * (char.stats.moveSpeed || 1) * stageSpeedMod,
        health: 100 * (char.stats.maxHealth || 1) * stageHealthMod,
        maxHealth: 100 * (char.stats.maxHealth || 1) * stageHealthMod,
        baseMaxHealth: 100,
        exp: 0,
        level: 1,
        expToNextLevel: 5,
        facingRight: true,
        weapons: [],
        passives: [],
        damageMultiplier: (char.stats.damage || 1) * stageDamageMod,
        cooldownMultiplier: char.stats.cooldown || 1,
        areaMultiplier: char.areaBonus || 1,
        speedMultiplier: (char.stats.moveSpeed || 1) * stageSpeedMod,
        projectileSpeedMultiplier: 1,
        durationMultiplier: char.durationBonus || 1,
        pickupRange: 80 * (char.pickupBonus || 1),
        luck: stageLuckMod,
        regen: char.stats.regen || 0,
        amountBonus: char.amountBonus || 0,
        armor: char.stats.armor || 0,
        expMultiplier: char.expBonus || 1,
        goldMultiplier: stageGoldMod,
        revivals: 0,
        invincibleTimer: 0,
        character: char,
        levelBonus: char.levelBonus || {},
        arcanas: selectedArcana ? [selectedArcana] : [],
        damageOnHitStacks: 0,
        damageOnHitTimer: 0,
        magnetPulseTimer: 0,
        healingBoost: 0,
        pierceBonus: 0,
        stage: selectedStage
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
    effectParticles = [];
    lightningChains = [];
    screenShake = { intensity: 0, duration: 0, offsetX: 0, offsetY: 0 };
    playerHitFlash = 0;
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

    // Hide stage select if exists
    const stageModal = document.getElementById('stage-select');
    if (stageModal) stageModal.classList.add('hidden');

    gameState = 'playing';
    lastTime = performance.now();

    // Reset run stats for achievements
    resetRunStats();

    // Check arcana achievement
    checkArcanaAchievement();

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

function checkUnion(weapon) {
    if (weapon.unioned || weapon.level < weapon.maxLevel) return false;

    // Get the weapon type - if evolved, use evolvedId for union check
    const weaponId = weapon.evolved ? weapon.evolvedId : weapon.id;
    const weaponType = weapon.evolved ? EVOLVED_WEAPONS[weaponId] : WEAPON_TYPES[weapon.id];

    // Check in WEAPON_TYPES for unionWith (handles both basic and evolved weapons)
    const unionInfo = WEAPON_TYPES[weaponId] || weaponType;
    if (!unionInfo || !unionInfo.unionWith || !unionInfo.unionResult) return false;

    // Check if we have the partner weapon at max level
    // Partner can be either a basic weapon or an evolved weapon
    const partnerWeapon = player.weapons.find(w => {
        if (w.unioned) return false;
        if (w.level < w.maxLevel) return false;

        // Check if partner matches by basic id
        if (w.id === unionInfo.unionWith && !w.evolved) return true;

        // Check if partner matches by evolved id
        if (w.evolved && w.evolvedId === unionInfo.unionWith) return true;

        return false;
    });

    return !!partnerWeapon;
}

// Check if a weapon is ready for Union (for UI display)
// Returns the partner weapon if Union is possible, null otherwise
function checkForUnionPossibility(weapon) {
    if (weapon.evolved || weapon.unioned || weapon.level < weapon.maxLevel) return null;

    const weaponType = WEAPON_TYPES[weapon.id];
    if (!weaponType.unionWith || !weaponType.unionResult) return null;

    // Check if we have the partner weapon at max level
    const partnerWeapon = player.weapons.find(w =>
        w.id === weaponType.unionWith &&
        w.level >= w.maxLevel &&
        !w.evolved &&
        !w.unioned
    );

    return partnerWeapon || null;
}

function performUnion(weapon) {
    // Get the weapon type - if evolved, use evolvedId for union info
    const weaponId = weapon.evolved ? weapon.evolvedId : weapon.id;
    const unionInfo = WEAPON_TYPES[weaponId] || (weapon.evolved ? EVOLVED_WEAPONS[weaponId] : WEAPON_TYPES[weapon.id]);

    if (!unionInfo || !unionInfo.unionResult) return false;
    const unionResult = UNION_WEAPONS[unionInfo.unionResult];
    if (!unionResult) return false;

    // Find partner weapon (can be basic or evolved)
    const partnerWeapon = player.weapons.find(w => {
        if (w.unioned) return false;
        if (w.level < w.maxLevel) return false;

        // Check if partner matches by basic id
        if (w.id === unionInfo.unionWith && !w.evolved) return true;

        // Check if partner matches by evolved id
        if (w.evolved && w.evolvedId === unionInfo.unionWith) return true;

        return false;
    });

    if (!partnerWeapon) return false;

    // Mark the main weapon as unioned with the result
    weapon.unioned = true;
    weapon.unionId = unionInfo.unionResult;

    // Remove partner weapon from player's weapons
    const partnerIndex = player.weapons.indexOf(partnerWeapon);
    if (partnerIndex > -1) {
        player.weapons.splice(partnerIndex, 1);
    }

    runStats.unions++;
    playSound('union');
    return true;
}

function evolveWeapon(weapon) {
    const weaponType = WEAPON_TYPES[weapon.id];
    weapon.evolved = true;
    weapon.evolvedId = weaponType.evolvesTo;
    runStats.evolutions++;
    playSound('evolution');
}

function update(currentTime) {
    if (gameState === 'menu' || gameState === 'stageSelect' || gameState === 'characterSelect' || gameState === 'arcanaSelect') {
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
    updateEffectParticles();
    updateLightningChains();
    updateScreenShake();
    checkCollisions();
    updateCamera();
    updateUI();

    // Check achievements periodically
    checkAchievements();

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
        case 'peachone':
            firePeachone(damage, amount, area, duration);
            break;
        case 'ebonyWings':
            fireEbonyWings(damage, amount, area, duration);
            break;
        case 'phiera':
            firePhiera(damage, amount, projSpeed);
            break;
        case 'eight':
            fireEight(damage, amount, projSpeed);
            break;
        case 'songOfMana':
            fireSongOfMana(damage, amount, area, duration, evolved);
            break;
        case 'ventoSacro':
            fireVentoSacro(damage, amount, area);
            break;
        case 'vandalier':
            fireVandalier(damage, amount, area, duration);
            break;
        case 'phieraggi':
            firePhieraggi(damage, amount, projSpeed);
            break;
        case 'fuwalafuwaloo':
            fireFuwalafuwaloo(damage, amount, area);
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
    const whipX = player.x + offsetX;
    const whipY = player.y - height / 2;
    const isEvolved = !!evolved;

    areaEffects.push({
        x: whipX,
        y: whipY,
        width: width,
        height: height,
        damage: damage,
        lifetime: 0.2,
        maxLifetime: 0.2,
        type: 'whip',
        healsOnKill: evolved?.healsOnKill || 0,
        critChance: evolved?.critChance || 0,
        color: evolved ? '#ff4444' : '#ffcc00',
        facingRight: player.facingRight,
        evolved: isEvolved
    });

    // Spawn whip crack particles at the tip
    const tipX = player.facingRight ? whipX + width : whipX;
    const tipY = whipY + height / 2;
    spawnWhipCrackParticles(tipX, tipY, player.facingRight, isEvolved);

    // Screen shake for impact feel
    addScreenShake(isEvolved ? 4 : 2, 0.1);

    // Sound crack effect particles along the whip length
    for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const px = player.facingRight ? whipX + width * t : whipX + width * (1 - t);
        const py = whipY + height / 2 + (Math.random() - 0.5) * height * 0.5;
        spawnWhipTrailParticle(px, py, player.facingRight, isEvolved);
    }
}

function spawnWhipCrackParticles(x, y, facingRight, evolved) {
    // Whip crack spark burst at the tip
    const sparkCount = evolved ? 12 : 8;
    const baseColor = evolved ? '#ff6666' : '#ffdd44';
    const accentColor = evolved ? '#ff2222' : '#ffffff';

    for (let i = 0; i < sparkCount; i++) {
        const angle = (facingRight ? 0 : Math.PI) + (Math.random() - 0.5) * Math.PI * 0.6;
        const speed = 100 + Math.random() * 150;
        effectParticles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 30,
            size: 3 + Math.random() * 4,
            color: Math.random() < 0.3 ? accentColor : baseColor,
            lifetime: 0.2 + Math.random() * 0.15,
            maxLifetime: 0.35,
            alpha: 1,
            gravity: 100,
            shrink: true,
            type: 'whipCrack'
        });
    }

    // Impact shockwave ring
    effectParticles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 5,
        color: baseColor,
        lifetime: 0.15,
        maxLifetime: 0.15,
        alpha: 0.8,
        gravity: 0,
        shrink: false,
        type: 'whipShockwave',
        evolved: evolved
    });
}

function spawnWhipTrailParticle(x, y, facingRight, evolved) {
    const baseColor = evolved ? '#ff8888' : '#ffee88';
    effectParticles.push({
        x: x,
        y: y,
        vx: (facingRight ? 1 : -1) * (20 + Math.random() * 30),
        vy: (Math.random() - 0.5) * 40,
        size: 2 + Math.random() * 3,
        color: baseColor,
        lifetime: 0.12 + Math.random() * 0.08,
        maxLifetime: 0.2,
        alpha: 0.7,
        gravity: 0,
        shrink: true,
        type: 'whipTrail'
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
    const isEvolved = !!evolved;
    let hitCount = 0;

    for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < radius) {
            const actualDamage = damage;
            enemy.health -= actualDamage;
            enemy.hitFlash = 0.1;
            hitCount++;

            // Spawn repel wave effect toward enemy
            const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            spawnGarlicRepelEffect(player.x, player.y, angle, isEvolved);

            if (evolved?.healsOnHit && Math.random() < 0.1) {
                player.health = Math.min(player.health + 1, player.maxHealth);
                // Healing particle effect
                spawnGarlicHealParticle(player.x, player.y);
            }

            if (enemy.health <= 0) {
                handleEnemyDeath(enemy, enemies.indexOf(enemy));
            }
        }
    }

    // Visual effect with enhanced properties
    areaEffects.push({
        x: player.x,
        y: player.y,
        radius: radius,
        damage: 0,
        lifetime: 0.15,
        maxLifetime: 0.15,
        type: 'garlic',
        color: evolved ? '#aa44aa' : '#88ff88',
        evolved: isEvolved,
        hitCount: hitCount
    });

    // Spawn ambient garlic spore particles
    spawnGarlicSporeParticles(player.x, player.y, radius, isEvolved);
}

function spawnGarlicSporeParticles(x, y, radius, evolved) {
    const sporeCount = evolved ? 10 : 6;
    const baseColor = evolved ? '#cc66cc' : '#aaffaa';
    const accentColor = evolved ? '#ff88ff' : '#ddffdd';

    for (let i = 0; i < sporeCount; i++) {
        const angle = (i / sporeCount) * Math.PI * 2 + Math.random() * 0.5;
        const dist = radius * (0.3 + Math.random() * 0.6);
        const sporeX = x + Math.cos(angle) * dist;
        const sporeY = y + Math.sin(angle) * dist;

        effectParticles.push({
            x: sporeX,
            y: sporeY,
            vx: Math.cos(angle) * (20 + Math.random() * 30),
            vy: Math.sin(angle) * (20 + Math.random() * 30) - 15,
            size: 2 + Math.random() * 3,
            color: Math.random() < 0.3 ? accentColor : baseColor,
            lifetime: 0.3 + Math.random() * 0.2,
            maxLifetime: 0.5,
            alpha: 0.8,
            gravity: -20,
            shrink: true,
            type: 'garlicSpore'
        });
    }
}

function spawnGarlicRepelEffect(x, y, angle, evolved) {
    const baseColor = evolved ? '#bb55bb' : '#99ff99';
    effectParticles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 15,
        color: baseColor,
        lifetime: 0.2,
        maxLifetime: 0.2,
        alpha: 0.7,
        gravity: 0,
        shrink: false,
        type: 'garlicWave',
        angle: angle
    });
}

function spawnGarlicHealParticle(x, y) {
    // Green healing sparkles rising upward
    for (let i = 0; i < 4; i++) {
        effectParticles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 30,
            vy: -40 - Math.random() * 30,
            size: 3 + Math.random() * 2,
            color: '#88ff88',
            lifetime: 0.4 + Math.random() * 0.2,
            maxLifetime: 0.6,
            alpha: 1,
            gravity: -30,
            shrink: true,
            type: 'magic'
        });
    }
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

        // Lightning bolt from sky effect
        addLightningChain(target.x, target.y - 200, target.x, target.y, '#88ffff');

        // Hit particles
        spawnHitParticles(target.x, target.y, 6, '#ffff00', { spread: 0.8, lifetime: 0.2, type: 'spark' });

        // Lightning visual
        areaEffects.push({
            x: target.x,
            y: target.y,
            radius: 20 * area,
            damage: 0,
            lifetime: 0.2,
            maxLifetime: 0.2,
            type: 'lightning',
            color: evolved ? '#88ffff' : '#ffff00'
        });

        // Chain lightning for evolved
        if (evolved?.chains) {
            let chainTarget = target;
            const chainedEnemies = [target];
            for (let c = 0; c < evolved.chains; c++) {
                const nearby = enemies.find(e =>
                    e !== chainTarget &&
                    !targets.includes(e) &&
                    !chainedEnemies.includes(e) &&
                    Math.hypot(e.x - chainTarget.x, e.y - chainTarget.y) < 120
                );
                if (nearby) {
                    // Add chain lightning visual
                    addLightningChain(chainTarget.x, chainTarget.y, nearby.x, nearby.y, '#00ffff');

                    nearby.health -= damage * 0.5;
                    nearby.hitFlash = 0.1;
                    spawnDamageNumber(nearby.x, nearby.y, Math.floor(damage * 0.5));
                    spawnHitParticles(nearby.x, nearby.y, 4, '#00ffff', { spread: 0.5, lifetime: 0.15 });

                    // Small lightning effect on chained enemy
                    areaEffects.push({
                        x: nearby.x,
                        y: nearby.y,
                        radius: 12 * area,
                        damage: 0,
                        lifetime: 0.12,
                        maxLifetime: 0.12,
                        type: 'lightning',
                        color: '#00ffff'
                    });

                    chainedEnemies.push(nearby);
                    chainTarget = nearby;

                    if (nearby.health <= 0) {
                        handleEnemyDeath(nearby, enemies.indexOf(nearby));
                    }
                }
            }
        }

        if (target.health <= 0) {
            handleEnemyDeath(target, enemies.indexOf(target));
        }
    }

    // Screen shake for multiple lightning strikes
    if (targets.length > 0) {
        triggerScreenShake(2 + targets.length, 0.08);
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

// Peachone - Holy light bombardment in circular pattern
function firePeachone(damage, amount, area, duration) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 120;
        const targetX = player.x + Math.cos(angle) * distance;
        const targetY = player.y + Math.sin(angle) * distance;

        // Delayed impact effect (bomb falls from above)
        setTimeout(() => {
            areaEffects.push({
                x: targetX - 30 * area,
                y: targetY - 30 * area,
                width: 60 * area,
                height: 60 * area,
                damage: damage,
                lifetime: 0.4,
                maxLifetime: 0.4,
                tickRate: 0.1,
                lastTick: 0,
                type: 'peachone',
                color: '#ffffff'
            });
        }, i * 150);
    }
}

// Ebony Wings - Dark energy bombardment in circular pattern
function fireEbonyWings(damage, amount, area, duration) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 120;
        const targetX = player.x + Math.cos(angle) * distance;
        const targetY = player.y + Math.sin(angle) * distance;

        setTimeout(() => {
            areaEffects.push({
                x: targetX - 30 * area,
                y: targetY - 30 * area,
                width: 60 * area,
                height: 60 * area,
                damage: damage,
                lifetime: 0.4,
                maxLifetime: 0.4,
                tickRate: 0.1,
                lastTick: 0,
                type: 'ebonywings',
                color: '#4422aa'
            });
        }, i * 150);
    }
}

// Vandalier (Union) - Combined massive bombardment
function fireVandalier(damage, amount, area, duration) {
    const totalAmount = amount + 4;
    for (let i = 0; i < totalAmount; i++) {
        const angle = (i / totalAmount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 60 + Math.random() * 180;
        const targetX = player.x + Math.cos(angle) * distance;
        const targetY = player.y + Math.sin(angle) * distance;
        const isLight = i % 2 === 0;

        setTimeout(() => {
            areaEffects.push({
                x: targetX - 40 * area,
                y: targetY - 40 * area,
                width: 80 * area,
                height: 80 * area,
                damage: damage,
                lifetime: 0.5,
                maxLifetime: 0.5,
                tickRate: 0.1,
                lastTick: 0,
                type: 'vandalier',
                color: isLight ? '#ffffff' : '#6644cc'
            });
        }, i * 100);
    }
}

// Phiera Der Tuphello - 4-directional rapid fire
function firePhiera(damage, amount, speed) {
    const directions = [
        { x: 1, y: 0 },   // Right
        { x: 0, y: -1 },  // Up
        { x: -1, y: 0 },  // Left
        { x: 0, y: 1 }    // Down
    ];

    for (let i = 0; i < Math.min(amount, 4); i++) {
        const dir = directions[i];
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: dir.x * speed,
            vy: dir.y * speed,
            damage: damage,
            pierce: 1,
            type: 'phiera',
            color: '#ffaa44'
        });
    }
}

// Eight The Sparrow - 4-directional rapid fire (diagonal)
function fireEight(damage, amount, speed) {
    const directions = [
        { x: 0.707, y: -0.707 },   // Up-Right
        { x: -0.707, y: -0.707 },  // Up-Left
        { x: -0.707, y: 0.707 },   // Down-Left
        { x: 0.707, y: 0.707 }     // Down-Right
    ];

    for (let i = 0; i < Math.min(amount, 4); i++) {
        const dir = directions[i];
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: dir.x * speed,
            vy: dir.y * speed,
            damage: damage,
            pierce: 1,
            type: 'eight',
            color: '#44aaff'
        });
    }
}

// Phieraggi (Union) - 8-directional rapid fire mastery
function firePhieraggi(damage, amount, speed) {
    const totalDirections = 8;
    for (let i = 0; i < totalDirections; i++) {
        const angle = (i / totalDirections) * Math.PI * 2;
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed * 1.2,
            vy: Math.sin(angle) * speed * 1.2,
            damage: damage,
            pierce: 3,
            type: 'phieraggi',
            color: '#ff66ff'
        });
    }
}

// Song of Mana - Vertical damaging beams
function fireSongOfMana(damage, amount, area, duration, evolved) {
    for (let i = 0; i < amount; i++) {
        const offsetX = (Math.random() - 0.5) * 200;
        const beamWidth = 40 * area;
        const beamHeight = canvas.height * 0.8;

        areaEffects.push({
            x: player.x + offsetX - beamWidth / 2,
            y: player.y - beamHeight / 2,
            width: beamWidth,
            height: beamHeight,
            damage: damage,
            lifetime: duration,
            maxLifetime: duration,
            tickRate: 0.3,
            lastTick: 0,
            type: 'songofmana',
            color: evolved ? '#ff44ff' : '#88ffaa'
        });
    }
}

// Vento Sacro - Fan-shaped slash attack
function fireVentoSacro(damage, amount, area) {
    const baseAngle = Math.atan2(lastMoveDirection.y, lastMoveDirection.x);
    const fanSpread = Math.PI * 0.6; // 108 degree spread
    const slices = 5 + amount;

    for (let i = 0; i < slices; i++) {
        const sliceAngle = baseAngle - fanSpread / 2 + (i / (slices - 1)) * fanSpread;
        const distance = 60 * area;

        areaEffects.push({
            x: player.x + Math.cos(sliceAngle) * distance * 0.5 - 20,
            y: player.y + Math.sin(sliceAngle) * distance * 0.5 - 20,
            width: 40 * area,
            height: 40 * area,
            damage: damage,
            lifetime: 0.2,
            maxLifetime: 0.2,
            type: 'ventosacro',
            angle: sliceAngle,
            color: '#aaffaa'
        });
    }
}

// Fuwalafuwaloo (Union) - Ultimate slash with massive critical hits
function fireFuwalafuwaloo(damage, amount, area) {
    // 360 degree slash around player
    const slices = 12;
    for (let i = 0; i < slices; i++) {
        const angle = (i / slices) * Math.PI * 2;
        const distance = 80 * area;

        areaEffects.push({
            x: player.x + Math.cos(angle) * distance * 0.5 - 25,
            y: player.y + Math.sin(angle) * distance * 0.5 - 25,
            width: 50 * area,
            height: 50 * area,
            damage: damage * (Math.random() < 0.3 ? 3 : 1), // 30% crit for 3x damage
            lifetime: 0.25,
            maxLifetime: 0.25,
            type: 'fuwalafuwaloo',
            angle: angle,
            color: '#ff88cc'
        });
    }

    // Center explosion
    areaEffects.push({
        x: player.x - 40 * area,
        y: player.y - 40 * area,
        width: 80 * area,
        height: 80 * area,
        damage: damage * 0.5,
        lifetime: 0.3,
        maxLifetime: 0.3,
        type: 'fuwalafuwaloo_center',
        color: '#ffaadd'
    });
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

            // Spawn trail particles for runetracer
            if (proj.type === 'runetracer' && Math.random() < 0.3) {
                spawnRunetracerTrail(proj.x, proj.y, proj.color);
            }

            if (proj.lifetime <= 0) {
                if (proj.explodesOnEnd) {
                    createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage);
                    spawnHitParticles(proj.x, proj.y, 12, proj.color, { spread: 1.5, lifetime: 0.5 });
                    triggerScreenShake(4, 0.1);
                }
                projectiles.splice(i, 1);
                continue;
            }

            // Bounce off screen edges (world-relative)
            let bounced = false;
            if (proj.x < camera.x + 10 || proj.x > camera.x + canvas.width - 10) {
                proj.vx *= -1;
                proj.x = Math.max(camera.x + 10, Math.min(camera.x + canvas.width - 10, proj.x));
                bounced = true;
            }
            if (proj.y < camera.y + 10 || proj.y > camera.y + canvas.height - 10) {
                proj.vy *= -1;
                proj.y = Math.max(camera.y + 10, Math.min(camera.y + canvas.height - 10, proj.y));
                bounced = true;
            }

            // Spawn bounce particles
            if (bounced && proj.type === 'runetracer') {
                spawnHitParticles(proj.x, proj.y, 5, proj.color, { spread: 0.5, lifetime: 0.3, size: 3 });
            }
        }

        // Spawn trail effects for specific weapon types
        if (proj.type === 'fireball' && Math.random() < 0.5) {
            spawnFireTrail(proj.x, proj.y);
        }
        if (proj.type === 'magicWand' && Math.random() < 0.4) {
            spawnMagicTrail(proj.x, proj.y, proj.color);
        }
        if (proj.type === 'knife' && Math.random() < 0.5) {
            const angle = Math.atan2(proj.vy, proj.vx);
            spawnKnifeTrail(proj.x, proj.y, angle);
        }
        if (proj.type === 'axe' && Math.random() < 0.6) {
            spawnAxeTrail(proj.x, proj.y, proj.rotation || 0);
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
        isCrit: isCrit,
        scale: isCrit ? 1.5 : 1,
        vx: (Math.random() - 0.5) * 20,
        vy: -50 - Math.random() * 30
    });
}

// Enhanced visual effects system
function updateEffectParticles() {
    for (let i = effectParticles.length - 1; i >= 0; i--) {
        const p = effectParticles[i];
        p.lifetime -= deltaTime;
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        if (p.gravity) p.vy += p.gravity * deltaTime;
        p.alpha = Math.max(0, p.lifetime / p.maxLifetime);
        if (p.shrink) p.size *= (1 - deltaTime * 2);

        if (p.lifetime <= 0 || p.size < 0.5) {
            effectParticles.splice(i, 1);
        }
    }
}

function updateLightningChains() {
    for (let i = lightningChains.length - 1; i >= 0; i--) {
        const chain = lightningChains[i];
        chain.lifetime -= deltaTime;
        chain.alpha = chain.lifetime / chain.maxLifetime;

        if (chain.lifetime <= 0) {
            lightningChains.splice(i, 1);
        }
    }
}

function updateScreenShake() {
    if (screenShake.duration > 0) {
        screenShake.duration -= deltaTime;
        const progress = screenShake.duration > 0 ? 1 : 0;
        screenShake.offsetX = (Math.random() - 0.5) * screenShake.intensity * progress;
        screenShake.offsetY = (Math.random() - 0.5) * screenShake.intensity * progress;
    } else {
        screenShake.offsetX = 0;
        screenShake.offsetY = 0;
    }

    // Update player hit flash
    if (playerHitFlash > 0) {
        playerHitFlash -= deltaTime * 2;
        if (playerHitFlash < 0) playerHitFlash = 0;
    }
}

function triggerScreenShake(intensity, duration) {
    if (intensity > screenShake.intensity) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
    }
}

function spawnHitParticles(x, y, count, color, options = {}) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        effectParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed * (options.spread || 1),
            vy: Math.sin(angle) * speed * (options.spread || 1),
            size: options.size || (3 + Math.random() * 3),
            color: color,
            lifetime: options.lifetime || (0.3 + Math.random() * 0.3),
            maxLifetime: options.lifetime || 0.5,
            alpha: 1,
            gravity: options.gravity || 0,
            shrink: options.shrink !== false,
            type: options.type || 'circle'
        });
    }
}

function spawnRunetracerTrail(x, y, color) {
    effectParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: 4 + Math.random() * 4,
        color: color,
        lifetime: 0.4,
        maxLifetime: 0.4,
        alpha: 0.8,
        gravity: 0,
        shrink: true,
        type: 'rune'
    });
}

function addLightningChain(x1, y1, x2, y2, color) {
    lightningChains.push({
        x1: x1, y1: y1,
        x2: x2, y2: y2,
        color: color,
        lifetime: 0.15,
        maxLifetime: 0.15,
        alpha: 1,
        segments: generateLightningSegments(x1, y1, x2, y2)
    });
}

function spawnFireTrail(x, y) {
    // Spawn multiple fire particles creating a trail effect
    for (let i = 0; i < 2; i++) {
        effectParticles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 30,
            vy: -20 - Math.random() * 40, // Rise upward
            size: 4 + Math.random() * 4,
            color: Math.random() < 0.5 ? '#ff6622' : '#ffaa33',
            lifetime: 0.3 + Math.random() * 0.2,
            maxLifetime: 0.5,
            alpha: 0.9,
            gravity: -50, // Float upward
            shrink: true,
            type: 'fire'
        });
    }
}

function spawnMagicTrail(x, y, color) {
    // Spawn magic sparkle particles
    effectParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        size: 3 + Math.random() * 3,
        color: color || '#9966ff',
        lifetime: 0.25 + Math.random() * 0.15,
        maxLifetime: 0.4,
        alpha: 1,
        gravity: 0,
        shrink: true,
        type: 'magic'
    });
}

function spawnKnifeTrail(x, y, angle) {
    // Metallic shine trail for knives
    effectParticles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 6,
        color: '#cccccc',
        lifetime: 0.15,
        maxLifetime: 0.15,
        alpha: 0.6,
        gravity: 0,
        shrink: true,
        type: 'blade',
        angle: angle
    });
}

function spawnAxeTrail(x, y, rotation) {
    // Afterimage trail for spinning axes
    effectParticles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 10,
        color: '#cc8844',
        lifetime: 0.12,
        maxLifetime: 0.12,
        alpha: 0.5,
        gravity: 0,
        shrink: false,
        type: 'axeTrail',
        rotation: rotation
    });
}

function generateLightningSegments(x1, y1, x2, y2) {
    const segments = [];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(dist / 15));

    let px = x1, py = y1;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        let nx = x1 + dx * t;
        let ny = y1 + dy * t;
        if (i < steps) {
            const offset = (1 - t) * 15;
            nx += (Math.random() - 0.5) * offset;
            ny += (Math.random() - 0.5) * offset;
        }
        segments.push({ x1: px, y1: py, x2: nx, y2: ny });
        px = nx;
        py = ny;
    }
    return segments;
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

                // Spawn hit particles based on projectile type
                const particleColor = proj.color || '#ffffff';
                spawnHitParticles(enemy.x, enemy.y, 3, particleColor, { spread: 0.6, lifetime: 0.2, size: 2 });

                if (proj.explosive) {
                    createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage * 0.5);
                    triggerScreenShake(5, 0.12);
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

                // Player hit feedback
                if (damage > 0) {
                    playerHitFlash = Math.min(playerHitFlash + damage * 0.02, 0.4);
                    if (damage > 5) {
                        triggerScreenShake(3, 0.05);
                    }
                }

                if (player.health <= 0) {
                    if (player.revivals > 0) {
                        player.revivals--;
                        player.health = player.maxHealth * 0.5;
                        player.invincibleTimer = 3;
                        triggerScreenShake(10, 0.3);
                        spawnHitParticles(player.x, player.y, 20, '#ffff00', { spread: 2, lifetime: 0.6, size: 4 });
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
    // Death particles - more for bosses
    const enemyType = ENEMY_TYPES[enemy.type];
    const particleColor = enemyType?.color || '#77aa77';
    const particleCount = enemy.isBoss ? 15 : 5;
    spawnHitParticles(enemy.x, enemy.y, particleCount, particleColor, {
        spread: enemy.isBoss ? 1.5 : 1,
        lifetime: enemy.isBoss ? 0.5 : 0.3,
        size: enemy.isBoss ? 5 : 3,
        gravity: 100
    });

    // Screen shake for boss death
    if (enemy.isBoss) {
        triggerScreenShake(8, 0.25);
    }

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
    const goldDrop = Math.floor((enemy.isBoss ? 10 : 1) * player.goldMultiplier);
    coins += goldDrop;
    runStats.coins += goldDrop;

    enemies.splice(index, 1);
    kills++;
    runStats.kills++;
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
    runStats.chests++;
    playSound('chest');

    // First check for Union (two weapons combine into one)
    for (const weapon of player.weapons) {
        if (checkUnion(weapon)) {
            performUnion(weapon);
            showUnionNotification(weapon);
            return;
        }
    }

    // Then check for weapon evolution
    for (const weapon of player.weapons) {
        if (checkEvolution(weapon)) {
            evolveWeapon(weapon);
            showEvolutionNotification(weapon);
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
        const chestGold = Math.floor(25 * player.goldMultiplier);
        coins += chestGold;
        runStats.coins += chestGold;
    }
}

function showUnionNotification(weapon) {
    const unionWeapon = UNION_WEAPONS[weapon.unionId];
    if (!unionWeapon) return;

    // Add floating notification
    damageNumbers.push({
        x: player.x,
        y: player.y - 40,
        text: `UNION! ${unionWeapon.icon} ${unionWeapon.name}`,
        color: '#ff44ff',
        lifetime: 2.5,
        fontSize: 16
    });
}

function showEvolutionNotification(weapon) {
    const evolvedWeapon = EVOLVED_WEAPONS[weapon.evolvedId];
    if (!evolvedWeapon) return;

    // Add floating notification
    damageNumbers.push({
        x: player.x,
        y: player.y - 40,
        text: `EVOLVED! ${evolvedWeapon.icon} ${evolvedWeapon.name}`,
        color: '#ffd700',
        lifetime: 2.5,
        fontSize: 16
    });
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

    // Save stage progress
    saveStageProgress();

    // Save total coins
    totalCoins += coins;
    localStorage.setItem('survivor-total-coins', totalCoins);

    if (gameTime > bestTime) {
        bestTime = Math.floor(gameTime);
        localStorage.setItem('survivor-best-time', bestTime);
        updateBestTimeDisplay();
    }

    playSound('gameover');

    const stage = STAGES[selectedStage];
    const messageDiv = document.getElementById('game-message');
    messageDiv.querySelector('h2').textContent = 'GAME OVER';
    messageDiv.querySelector('p').innerHTML = `
        <span class="stat">${stage.icon} ${stage.name}</span><br>
        <span class="stat">Survived: ${formatTime(gameTime)}</span><br>
        <span class="stat">Kills: ${kills}</span><br>
        <span class="stat">Level: ${player.level}</span><br>
        <span class="stat">Coins: ${coins}</span>
    `;
    messageDiv.classList.remove('hidden');
}

function victory() {
    gameState = 'victory';

    // Save stage progress (including completion)
    saveStageProgress();

    // Check stage victory achievement
    checkStageVictoryAchievement(selectedStage);

    // Save total coins
    totalCoins += coins;
    localStorage.setItem('survivor-total-coins', totalCoins);

    bestTime = Math.max(bestTime, Math.floor(gameTime));
    localStorage.setItem('survivor-best-time', bestTime);
    updateBestTimeDisplay();

    playSound('victory');

    const stage = STAGES[selectedStage];
    const messageDiv = document.getElementById('game-message');
    messageDiv.querySelector('h2').textContent = 'VICTORY!';
    messageDiv.querySelector('p').innerHTML = `
        <span class="stat">${stage.icon} ${stage.name} CLEARED!</span><br>
        <span class="stat">You survived 30 minutes!</span><br>
        <span class="stat">Kills: ${kills}</span><br>
        <span class="stat">Level: ${player.level}</span><br>
        <span class="stat">Coins: ${coins}</span>
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
        const unioned = w.unioned ? UNION_WEAPONS[w.unionId] : null;
        let displayName, displayIcon, levelText, itemClass;

        if (unioned) {
            displayName = unioned.name;
            displayIcon = unioned.icon;
            levelText = 'UNION';
            itemClass = 'unioned';
        } else if (evolved) {
            displayName = evolved.name;
            displayIcon = evolved.icon;
            levelText = 'EVOLVED';
            itemClass = 'evolved';
        } else {
            displayName = type.name;
            displayIcon = type.icon;
            levelText = `LV ${w.level}/${w.maxLevel}`;
            itemClass = '';
        }

        const canEvolve = !w.evolved && !w.unioned && w.level >= w.maxLevel && player.passives.some(p => p.id === type.requiresPassive);
        const canUnion = !w.unioned && checkUnion(w);

        if (canEvolve) itemClass = 'can-evolve';
        if (canUnion) itemClass = 'can-union';

        return `<div class="pause-equipment-item ${itemClass}">
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
    // Apply screen shake
    ctx.translate(-camera.x + screenShake.offsetX, -camera.y + screenShake.offsetY);

    drawPixelGrid();
    drawAreaEffects();
    drawLightningChains();
    drawExpGems();
    drawChests();
    drawProjectiles();
    drawOrbitingWeapons();
    drawBibleOrbits();
    drawEnemies();
    drawEffectParticles();
    drawPlayer();
    drawDamageNumbers();

    ctx.restore();

    drawWeaponSlots();
    drawMinimap();
    drawKillCounter();
    drawBossHealthBar();
    drawArcanaIndicator();

    // Player hit flash overlay (red vignette)
    if (playerHitFlash > 0) {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${playerHitFlash})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
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
    const stage = STAGES[selectedStage];
    const bgPattern = stage?.bgPattern || 'trees';

    // Draw stage-specific background elements
    drawStageBackground(bgPattern);

    // Draw subtle grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
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

function drawStageBackground(pattern) {
    const cellSize = 128;
    const startX = Math.floor(camera.x / cellSize) * cellSize;
    const startY = Math.floor(camera.y / cellSize) * cellSize;

    ctx.imageSmoothingEnabled = false;

    for (let x = startX - cellSize; x < camera.x + canvas.width + cellSize; x += cellSize) {
        for (let y = startY - cellSize; y < camera.y + canvas.height + cellSize; y += cellSize) {
            const seed = ((x / cellSize) * 1000 + (y / cellSize)) % 10000;
            const rand = seededRandom(seed);

            switch (pattern) {
                case 'trees':
                    drawForestElement(x, y, rand);
                    break;
                case 'library':
                    drawLibraryElement(x, y, rand);
                    break;
                case 'factory':
                    drawFactoryElement(x, y, rand);
                    break;
                case 'tower':
                    drawTowerElement(x, y, rand);
                    break;
                case 'cathedral':
                    drawCathedralElement(x, y, rand);
                    break;
            }
        }
    }
}

function seededRandom(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function drawForestElement(x, y, rand) {
    // Draw grass patches
    ctx.fillStyle = `rgba(30, 60, 30, ${0.2 + rand * 0.2})`;
    const grassX = x + rand * 60;
    const grassY = y + rand * 60;
    ctx.fillRect(grassX, grassY, 4, 8);
    ctx.fillRect(grassX + 6, grassY + 2, 3, 6);

    // Random trees (sparse)
    if (rand > 0.7) {
        const treeX = x + 40 + rand * 40;
        const treeY = y + 40 + rand * 40;
        // Tree trunk
        ctx.fillStyle = 'rgba(60, 40, 30, 0.4)';
        ctx.fillRect(treeX - 3, treeY, 6, 16);
        // Tree foliage (pixel style)
        ctx.fillStyle = 'rgba(30, 80, 30, 0.5)';
        ctx.fillRect(treeX - 12, treeY - 20, 24, 8);
        ctx.fillRect(treeX - 10, treeY - 28, 20, 10);
        ctx.fillRect(treeX - 6, treeY - 34, 12, 8);
    }

    // Occasional mushroom
    if (rand > 0.9) {
        const mushX = x + 20 + rand * 80;
        const mushY = y + 80 + rand * 30;
        ctx.fillStyle = 'rgba(180, 50, 50, 0.4)';
        ctx.fillRect(mushX - 4, mushY - 4, 8, 4);
        ctx.fillStyle = 'rgba(200, 180, 160, 0.4)';
        ctx.fillRect(mushX - 2, mushY, 4, 4);
    }
}

function drawLibraryElement(x, y, rand) {
    // Bookshelves
    if (rand > 0.3) {
        const shelfX = x + rand * 30;
        const shelfY = y + rand * 20;
        // Shelf frame
        ctx.fillStyle = 'rgba(80, 50, 30, 0.4)';
        ctx.fillRect(shelfX, shelfY, 48, 4);
        ctx.fillRect(shelfX, shelfY + 20, 48, 4);
        ctx.fillRect(shelfX, shelfY + 40, 48, 4);
        // Books (varying colors)
        const bookColors = ['rgba(150, 50, 50, 0.5)', 'rgba(50, 80, 150, 0.5)',
                           'rgba(50, 120, 50, 0.5)', 'rgba(120, 80, 50, 0.5)'];
        for (let i = 0; i < 6; i++) {
            const bookX = shelfX + 2 + i * 7;
            ctx.fillStyle = bookColors[Math.floor(rand * 4 + i) % 4];
            ctx.fillRect(bookX, shelfY + 5, 6, 14);
            ctx.fillRect(bookX, shelfY + 25, 6, 14);
        }
    }

    // Candles
    if (rand > 0.85) {
        const candleX = x + 80 + rand * 30;
        const candleY = y + 60;
        ctx.fillStyle = 'rgba(200, 180, 150, 0.5)';
        ctx.fillRect(candleX - 2, candleY, 4, 10);
        // Flame glow
        ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + Math.sin(Date.now() / 200 + rand * 10) * 0.1})`;
        ctx.fillRect(candleX - 2, candleY - 4, 4, 4);
    }

    // Floor tiles
    ctx.strokeStyle = 'rgba(60, 50, 70, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 64, 64);
}

function drawFactoryElement(x, y, rand) {
    // Metal floor plates
    ctx.fillStyle = 'rgba(80, 80, 90, 0.15)';
    ctx.fillRect(x, y, 62, 62);
    ctx.strokeStyle = 'rgba(100, 100, 110, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, 58, 58);

    // Bolts/rivets
    ctx.fillStyle = 'rgba(60, 60, 70, 0.3)';
    ctx.fillRect(x + 4, y + 4, 4, 4);
    ctx.fillRect(x + 54, y + 4, 4, 4);
    ctx.fillRect(x + 4, y + 54, 4, 4);
    ctx.fillRect(x + 54, y + 54, 4, 4);

    // Pipes
    if (rand > 0.6) {
        ctx.fillStyle = 'rgba(100, 90, 80, 0.4)';
        const pipeY = y + 30 + rand * 30;
        ctx.fillRect(x, pipeY, 64, 8);
        ctx.fillStyle = 'rgba(120, 110, 100, 0.3)';
        ctx.fillRect(x, pipeY + 2, 64, 2);
    }

    // Machinery/gears
    if (rand > 0.8) {
        const gearX = x + 40 + rand * 40;
        const gearY = y + 20 + rand * 60;
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gearX, gearY, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(80, 80, 90, 0.3)';
        ctx.beginPath();
        ctx.arc(gearX, gearY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Caution stripes (occasional)
    if (rand > 0.9) {
        ctx.fillStyle = 'rgba(200, 180, 50, 0.2)';
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(x + i * 8, y + 110, 4, 8);
        }
    }
}

function drawTowerElement(x, y, rand) {
    // Stone brick pattern
    const brickW = 32;
    const brickH = 16;
    const offsetRow = Math.floor(y / brickH) % 2;
    const brickX = x + (offsetRow * brickW / 2);

    ctx.fillStyle = 'rgba(70, 60, 80, 0.2)';
    ctx.fillRect(brickX, y, brickW - 2, brickH - 2);
    ctx.strokeStyle = 'rgba(50, 40, 60, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(brickX, y, brickW - 2, brickH - 2);

    // Torches on walls
    if (rand > 0.85) {
        const torchX = x + 50 + rand * 50;
        const torchY = y + 30 + rand * 40;
        // Bracket
        ctx.fillStyle = 'rgba(60, 50, 40, 0.5)';
        ctx.fillRect(torchX - 2, torchY, 4, 12);
        // Flame
        ctx.fillStyle = `rgba(255, 150, 50, ${0.4 + Math.sin(Date.now() / 150 + rand * 10) * 0.15})`;
        ctx.fillRect(torchX - 3, torchY - 8, 6, 8);
        ctx.fillStyle = `rgba(255, 220, 100, ${0.3 + Math.sin(Date.now() / 100 + rand * 10) * 0.1})`;
        ctx.fillRect(torchX - 2, torchY - 10, 4, 6);
    }

    // Chains
    if (rand > 0.75 && rand < 0.85) {
        const chainX = x + 80 + rand * 30;
        ctx.fillStyle = 'rgba(100, 100, 110, 0.3)';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(chainX, y + i * 20, 4, 12);
        }
    }

    // Cobwebs (corner decoration)
    if (rand > 0.92) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)';
        ctx.lineWidth = 1;
        const webX = x + 10;
        const webY = y + 10;
        ctx.beginPath();
        ctx.moveTo(webX, webY);
        ctx.lineTo(webX + 30, webY);
        ctx.lineTo(webX, webY + 30);
        ctx.closePath();
        ctx.stroke();
    }
}

function drawCathedralElement(x, y, rand) {
    // Ornate floor tiles (checkerboard with decoration)
    const tileX = Math.floor(x / 64);
    const tileY = Math.floor(y / 64);
    const isDark = (tileX + tileY) % 2 === 0;

    ctx.fillStyle = isDark ? 'rgba(30, 20, 40, 0.25)' : 'rgba(50, 35, 60, 0.2)';
    ctx.fillRect(x, y, 62, 62);

    // Tile border
    ctx.strokeStyle = 'rgba(80, 60, 100, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, 58, 58);

    // Central ornament on some tiles
    if (rand > 0.7) {
        ctx.fillStyle = 'rgba(100, 70, 120, 0.2)';
        ctx.fillRect(x + 26, y + 26, 12, 12);
        ctx.fillRect(x + 22, y + 30, 20, 4);
        ctx.fillRect(x + 30, y + 22, 4, 20);
    }

    // Stained glass light beams (from above)
    if (rand > 0.88) {
        const beamX = x + 20 + rand * 60;
        const colors = [
            `rgba(255, 100, 100, ${0.08 + Math.sin(Date.now() / 500 + rand * 10) * 0.03})`,
            `rgba(100, 100, 255, ${0.08 + Math.sin(Date.now() / 600 + rand * 10) * 0.03})`,
            `rgba(255, 200, 100, ${0.08 + Math.sin(Date.now() / 400 + rand * 10) * 0.03})`
        ];
        ctx.fillStyle = colors[Math.floor(rand * 3)];
        ctx.fillRect(beamX - 15, y, 30, 128);
    }

    // Pillars
    if (rand > 0.82 && rand < 0.88) {
        const pillarX = x + 50 + rand * 50;
        ctx.fillStyle = 'rgba(80, 70, 90, 0.4)';
        ctx.fillRect(pillarX - 8, y, 16, 128);
        // Pillar detail
        ctx.fillStyle = 'rgba(100, 90, 110, 0.3)';
        ctx.fillRect(pillarX - 10, y, 20, 8);
        ctx.fillRect(pillarX - 10, y + 120, 20, 8);
    }

    // Candelabras
    if (rand > 0.93) {
        const candX = x + 30 + rand * 50;
        const candY = y + 50;
        // Base
        ctx.fillStyle = 'rgba(150, 130, 80, 0.4)';
        ctx.fillRect(candX - 8, candY + 10, 16, 4);
        ctx.fillRect(candX - 2, candY, 4, 12);
        // Candles
        ctx.fillStyle = 'rgba(200, 180, 150, 0.5)';
        ctx.fillRect(candX - 8, candY - 8, 4, 8);
        ctx.fillRect(candX + 4, candY - 8, 4, 8);
        // Flames
        ctx.fillStyle = `rgba(255, 200, 100, ${0.4 + Math.sin(Date.now() / 200 + rand * 5) * 0.1})`;
        ctx.fillRect(candX - 7, candY - 12, 2, 4);
        ctx.fillRect(candX + 5, candY - 12, 2, 4);
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

    // Player glow effect (subtle pulsing)
    const pulseIntensity = 0.15 + Math.sin(Date.now() / 300) * 0.05;
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
    glowGradient.addColorStop(0, `rgba(100, 150, 255, ${pulseIntensity})`);
    glowGradient.addColorStop(0.5, `rgba(100, 150, 255, ${pulseIntensity * 0.3})`);
    glowGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black outline (draw first, slightly larger)
    ctx.fillStyle = '#000000';
    // Head outline
    drawPixelRect(x - 4, y - 10, 8, 1);
    drawPixelRect(x - 4, y - 3, 8, 1);
    drawPixelRect(x - 4, y - 9, 1, 7);
    drawPixelRect(x + 3, y - 9, 1, 7);
    // Body outline
    drawPixelRect(x - 5, y - 3, 10, 1);
    drawPixelRect(x - 5, y + 6, 10, 1);
    drawPixelRect(x - 5, y - 2, 1, 8);
    drawPixelRect(x + 4, y - 2, 1, 8);
    // Arms outline
    drawPixelRect(x - 7, y - 2, 1, 8);
    drawPixelRect(x + 6, y - 2, 1, 8);
    // Legs outline
    drawPixelRect(x - 4, y + 5, 1, 6);
    drawPixelRect(x + 3, y + 5, 1, 6);
    drawPixelRect(x - 3, y + 10, 6, 1);

    // Body (brighter blue)
    ctx.fillStyle = '#5588cc';
    drawPixelRect(x - 4, y - 2, 8, 8);

    // Head (brighter skin tone)
    ctx.fillStyle = '#ffddaa';
    drawPixelRect(x - 3, y - 9, 6, 6);

    // Hair based on character (brighter)
    ctx.fillStyle = '#886633';
    drawPixelRect(x - 3, y - 10, 6, 2);
    if (player.facingRight) {
        drawPixelRect(x - 4, y - 9, 2, 4);
    } else {
        drawPixelRect(x + 2, y - 9, 2, 4);
    }

    // Eyes (white with black pupil for better visibility)
    ctx.fillStyle = '#ffffff';
    if (player.facingRight) {
        drawPixelRect(x, y - 7, 2, 2);
        ctx.fillStyle = '#000000';
        drawPixelRect(x + 1, y - 6, 1, 1);
    } else {
        drawPixelRect(x - 2, y - 7, 2, 2);
        ctx.fillStyle = '#000000';
        drawPixelRect(x - 2, y - 6, 1, 1);
    }

    // Arms (brighter)
    ctx.fillStyle = '#ffddaa';
    drawPixelRect(x - 6, y - 1, 2, 6);
    drawPixelRect(x + 4, y - 1, 2, 6);

    // Legs (brighter brown)
    ctx.fillStyle = '#775533';
    drawPixelRect(x - 3, y + 6, 3, 4);
    drawPixelRect(x, y + 6, 3, 4);

    // Direction indicator (small arrow pointing facing direction)
    ctx.fillStyle = '#ffff88';
    if (player.facingRight) {
        drawPixelRect(x + 7, y, 3, 2);
        drawPixelRect(x + 9, y - 1, 1, 4);
    } else {
        drawPixelRect(x - 10, y, 3, 2);
        drawPixelRect(x - 10, y - 1, 1, 4);
    }

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
        const outlineColor = '#000000';

        // Shadow for all enemies (smaller for regular, bigger for bosses)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        if (enemy.isBoss) {
            ctx.ellipse(x, y + 14, 18, 9, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(x, y + 8, 8, 4, 0, 0, Math.PI * 2);
        }
        ctx.fill();

        // Draw outline first, then fill
        switch (enemy.type) {
            case 'bat':
                // Outline
                ctx.fillStyle = outlineColor;
                drawPixelRect(x - 5, y - 3, 10, 1);
                drawPixelRect(x - 5, y + 2, 10, 1);
                drawPixelRect(x - 9, y - 2, 1, 4);
                drawPixelRect(x + 8, y - 2, 1, 4);
                // Body
                ctx.fillStyle = flashColor || '#55aa55';
                drawPixelRect(x - 4, y - 2, 8, 4);
                // Wings
                ctx.fillStyle = flashColor || '#44aa44';
                drawPixelRect(x - 8, y - 1, 4, 2);
                drawPixelRect(x + 4, y - 1, 4, 2);
                // Eyes (brighter red)
                ctx.fillStyle = flashColor || '#ff3333';
                drawPixelRect(x - 2, y - 1, 2, 2);
                drawPixelRect(x + 1, y - 1, 2, 2);
                break;

            case 'skeleton':
                // Outline
                ctx.fillStyle = outlineColor;
                drawPixelRect(x - 6, y - 9, 12, 1);
                drawPixelRect(x - 6, y - 8, 1, 16);
                drawPixelRect(x + 5, y - 8, 1, 16);
                drawPixelRect(x - 5, y + 8, 10, 1);
                // Body (brighter white)
                ctx.fillStyle = flashColor || '#eeeeee';
                drawPixelRect(x - 5, y - 8, 10, 8);
                drawPixelRect(x - 4, y, 8, 8);
                // Eyes (dark holes)
                ctx.fillStyle = flashColor || '#222222';
                drawPixelRect(x - 3, y - 6, 3, 3);
                drawPixelRect(x + 1, y - 6, 3, 3);
                break;

            case 'ghost':
                // Glow effect
                const ghostGlow = ctx.createRadialGradient(x, y, 0, x, y, 15);
                ghostGlow.addColorStop(0, 'rgba(200, 200, 255, 0.2)');
                ghostGlow.addColorStop(1, 'rgba(200, 200, 255, 0)');
                ctx.fillStyle = ghostGlow;
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
                // Body
                ctx.fillStyle = flashColor || 'rgba(200, 200, 255, 0.85)';
                drawPixelRect(x - 5, y - 6, 10, 10);
                drawPixelRect(x - 6, y + 2, 3, 4);
                drawPixelRect(x + 3, y + 2, 3, 4);
                // Eyes
                ctx.fillStyle = flashColor || '#111144';
                drawPixelRect(x - 3, y - 4, 3, 3);
                drawPixelRect(x + 1, y - 4, 3, 3);
                break;

            case 'demon':
                // Outline
                ctx.fillStyle = outlineColor;
                drawPixelRect(x - 7, y - 7, 14, 1);
                drawPixelRect(x - 7, y - 6, 1, 12);
                drawPixelRect(x + 6, y - 6, 1, 12);
                drawPixelRect(x - 6, y + 6, 12, 1);
                // Body (brighter red)
                ctx.fillStyle = flashColor || '#cc4444';
                drawPixelRect(x - 6, y - 6, 12, 12);
                // Eyes (bright yellow)
                ctx.fillStyle = flashColor || '#ffff44';
                drawPixelRect(x - 4, y - 4, 3, 3);
                drawPixelRect(x + 1, y - 4, 3, 3);
                // Horns (darker red)
                ctx.fillStyle = flashColor || '#881111';
                drawPixelRect(x - 7, y - 10, 3, 4);
                drawPixelRect(x + 4, y - 10, 3, 4);
                break;

            case 'wraith':
                ctx.globalAlpha = 0.8;
                // Glow
                const wraithGlow = ctx.createRadialGradient(x, y, 0, x, y, 18);
                wraithGlow.addColorStop(0, 'rgba(180, 100, 255, 0.2)');
                wraithGlow.addColorStop(1, 'rgba(180, 100, 255, 0)');
                ctx.fillStyle = wraithGlow;
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.fill();
                // Outline
                ctx.fillStyle = '#330066';
                drawPixelRect(x - 6, y - 9, 12, 1);
                drawPixelRect(x - 6, y - 8, 1, 14);
                drawPixelRect(x + 5, y - 8, 1, 14);
                // Body
                ctx.fillStyle = flashColor || '#6633aa';
                drawPixelRect(x - 5, y - 8, 10, 14);
                // Eyes (bright magenta)
                ctx.fillStyle = flashColor || '#ff44ff';
                drawPixelRect(x - 3, y - 5, 2, 2);
                drawPixelRect(x + 1, y - 5, 2, 2);
                ctx.globalAlpha = 1;
                break;

            case 'reaper':
                // Outline
                ctx.fillStyle = outlineColor;
                drawPixelRect(x - 6, y - 11, 12, 1);
                drawPixelRect(x - 6, y - 10, 1, 16);
                drawPixelRect(x + 5, y - 10, 1, 16);
                drawPixelRect(x - 5, y + 6, 10, 1);
                // Body (darker)
                ctx.fillStyle = flashColor || '#333344';
                drawPixelRect(x - 5, y - 10, 10, 16);
                // Eyes (bright red)
                ctx.fillStyle = flashColor || '#ff2222';
                drawPixelRect(x - 3, y - 7, 2, 3);
                drawPixelRect(x + 1, y - 7, 2, 3);
                // Scythe (brighter)
                ctx.fillStyle = flashColor || '#aaaaaa';
                drawPixelRect(x + 6, y - 12, 2, 14);
                ctx.fillStyle = flashColor || '#cccccc';
                drawPixelRect(x + 4, y - 14, 6, 2);
                break;

            // Bosses
            case 'giant':
            case 'necromancer':
            case 'vampire':
            case 'deathLord':
            case 'death':
            case 'redDeath':
                const size = enemy.isBoss ? 20 : 12;
                // Boss glow
                if (enemy.isBoss) {
                    const bossGlow = ctx.createRadialGradient(x, y, 0, x, y, size + 15);
                    const glowColor = enemy.type === 'redDeath' ? '255, 50, 50' :
                                     enemy.type === 'death' ? '100, 100, 100' :
                                     enemy.type === 'vampire' ? '150, 50, 50' : '200, 150, 50';
                    bossGlow.addColorStop(0, `rgba(${glowColor}, 0.3)`);
                    bossGlow.addColorStop(1, `rgba(${glowColor}, 0)`);
                    ctx.fillStyle = bossGlow;
                    ctx.beginPath();
                    ctx.arc(x, y, size + 15, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Outline
                ctx.fillStyle = outlineColor;
                drawPixelRect(x - size / 2 - 1, y - size / 2 - 5, size + 2, 1);
                drawPixelRect(x - size / 2 - 1, y - size / 2 - 4, 1, size + 4);
                drawPixelRect(x + size / 2, y - size / 2 - 4, 1, size + 4);
                // Body
                ctx.fillStyle = flashColor || baseColor;
                drawPixelRect(x - size / 2, y - size / 2 - 4, size, size);
                drawPixelRect(x - size / 2 - 2, y + size / 2 - 8, size + 4, size / 2);
                // Eyes (brighter)
                ctx.fillStyle = flashColor || '#ffff66';
                drawPixelRect(x - size / 4, y - size / 4 - 4, 3, 3);
                drawPixelRect(x + size / 4 - 3, y - size / 4 - 4, 3, 3);
                break;

            default: // zombie
                // Outline
                ctx.fillStyle = outlineColor;
                drawPixelRect(x - 4, y - 8, 8, 1);
                drawPixelRect(x - 5, y - 7, 1, 14);
                drawPixelRect(x + 4, y - 7, 1, 14);
                drawPixelRect(x - 4, y + 6, 8, 1);
                // Body (brighter purple)
                ctx.fillStyle = flashColor || '#aa66cc';
                drawPixelRect(x - 4, y - 2, 8, 8);
                // Head (brighter green)
                ctx.fillStyle = flashColor || '#88cc88';
                drawPixelRect(x - 3, y - 7, 6, 5);
                // Eyes (brighter red)
                ctx.fillStyle = flashColor || '#ff5555';
                drawPixelRect(x - 2, y - 5, 2, 2);
                drawPixelRect(x + 1, y - 5, 2, 2);
                // Arms
                ctx.fillStyle = flashColor || '#88cc88';
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

        if (proj.type === 'axe') {
            // Enhanced motion blur glow
            const speed = Math.hypot(proj.vx, proj.vy);
            const glowIntensity = Math.min(1, speed / 200);
            const axeGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
            axeGlow.addColorStop(0, `rgba(255, 150, 50, ${0.4 * glowIntensity})`);
            axeGlow.addColorStop(0.5, `rgba(200, 100, 50, ${0.2 * glowIntensity})`);
            axeGlow.addColorStop(1, 'rgba(200, 100, 50, 0)');
            ctx.fillStyle = axeGlow;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Spinning motion blur effect
            ctx.save();
            ctx.translate(x, y);
            const rotation = proj.rotation || 0;

            // Draw afterimages for spinning effect
            for (let i = 3; i > 0; i--) {
                ctx.globalAlpha = 0.15 * (4 - i) / 3;
                ctx.rotate(-0.3 * i);
                ctx.fillStyle = '#cc8844';
                ctx.fillRect(-size / 2, -size / 2, size, size);
            }
            ctx.globalAlpha = 1;

            // Main axe
            ctx.rotate(rotation + 0.9); // Reset plus current rotation
            // Outline
            ctx.fillStyle = '#000000';
            ctx.fillRect(-size / 2 - 1, -size / 2 - 1, size + 2, size + 2);
            // Body
            ctx.fillStyle = '#cc8844';
            ctx.fillRect(-size / 2, -size / 2, size, size);
            // Blade highlight
            ctx.fillStyle = '#ddaa66';
            ctx.fillRect(-size / 4, -size / 2, size / 2, size / 2);
            // Metallic edge shine
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(-size / 4 + 1, -size / 2, 2, size / 2 - 2);
            ctx.globalAlpha = 1;
            ctx.restore();
        } else if (proj.type === 'fireball') {
            const animTime = Date.now() / 1000;
            const isEvolved = proj.color === '#ff2200';
            const flicker = 1 + Math.sin(Date.now() / 50) * 0.15;
            const angle = Math.atan2(proj.vy, proj.vx);

            if (isEvolved) {
                // Hellfire - Enhanced demonic fire effects

                // Intense hellfire aura
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30;
                const hellGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 2 * flicker);
                hellGlow.addColorStop(0, 'rgba(255, 100, 0, 0.7)');
                hellGlow.addColorStop(0.3, 'rgba(255, 50, 0, 0.5)');
                hellGlow.addColorStop(0.6, 'rgba(200, 0, 0, 0.3)');
                hellGlow.addColorStop(0.85, 'rgba(100, 0, 0, 0.15)');
                hellGlow.addColorStop(1, 'rgba(50, 0, 0, 0)');
                ctx.fillStyle = hellGlow;
                ctx.beginPath();
                ctx.arc(x, y, size * 2 * flicker, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Ember trail particles behind fireball
                for (let e = 0; e < 6; e++) {
                    const trailDist = 8 + e * 5;
                    const trailX = x - Math.cos(angle) * trailDist + (Math.random() - 0.5) * 8;
                    const trailY = y - Math.sin(angle) * trailDist + (Math.random() - 0.5) * 8;
                    const emberSize = 2 + Math.random() * 2;
                    const emberAlpha = 0.6 - e * 0.08;

                    ctx.fillStyle = e % 2 === 0 ? '#ff4400' : '#ffaa00';
                    ctx.globalAlpha = emberAlpha;
                    ctx.beginPath();
                    ctx.arc(trailX, trailY, emberSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                // Rising smoke/ash particles
                for (let s = 0; s < 4; s++) {
                    const smokePhase = (animTime * 2 + s * 0.5) % 1;
                    const smokeX = x + (Math.random() - 0.5) * size;
                    const smokeY = y - smokePhase * size * 2;
                    const smokeSize = 2 + smokePhase * 3;

                    ctx.fillStyle = '#333333';
                    ctx.globalAlpha = (1 - smokePhase) * 0.3;
                    ctx.beginPath();
                    ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle + Math.PI / 2);

                // Outer hellfire (dark red with black edges)
                ctx.shadowColor = '#ff2200';
                ctx.shadowBlur = 20;
                const outerFlameGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                outerFlameGrad.addColorStop(0, '#ff4400');
                outerFlameGrad.addColorStop(1, '#880000');
                ctx.fillStyle = outerFlameGrad;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.quadraticCurveTo(size * 0.8, -size * 0.3, size * 0.5, size * 0.5);
                ctx.quadraticCurveTo(0, size * 0.9, -size * 0.5, size * 0.5);
                ctx.quadraticCurveTo(-size * 0.8, -size * 0.3, 0, -size);
                ctx.fill();

                // Secondary flame tendrils
                for (let t = 0; t < 3; t++) {
                    const tendrilAngle = (t - 1) * 0.4 + Math.sin(animTime * 10 + t) * 0.2;
                    const tendrilLength = size * (0.6 + Math.sin(animTime * 8 + t * 2) * 0.2);

                    ctx.save();
                    ctx.rotate(tendrilAngle);
                    ctx.fillStyle = '#ff6600';
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.quadraticCurveTo(size * 0.3, -tendrilLength * 0.5, 0, -tendrilLength);
                    ctx.quadraticCurveTo(-size * 0.2, -tendrilLength * 0.5, 0, 0);
                    ctx.fill();
                    ctx.restore();
                }
                ctx.globalAlpha = 1;

                // Middle flame layer
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.7);
                ctx.quadraticCurveTo(size * 0.4, -size * 0.1, size * 0.3, size * 0.4);
                ctx.quadraticCurveTo(0, size * 0.6, -size * 0.3, size * 0.4);
                ctx.quadraticCurveTo(-size * 0.4, -size * 0.1, 0, -size * 0.7);
                ctx.fill();

                // Inner hellfire core (bright orange-yellow)
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.4);
                ctx.quadraticCurveTo(size * 0.2, 0, size * 0.15, size * 0.25);
                ctx.quadraticCurveTo(0, size * 0.35, -size * 0.15, size * 0.25);
                ctx.quadraticCurveTo(-size * 0.2, 0, 0, -size * 0.4);
                ctx.fill();

                // White-hot center
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, size * 0.1, size * 0.15, 0, Math.PI * 2);
                ctx.fill();

                // Flickering sparks around core
                for (let sp = 0; sp < 5; sp++) {
                    const sparkAngle = animTime * 12 + sp * Math.PI * 2 / 5;
                    const sparkDist = size * 0.4 + Math.sin(animTime * 8 + sp) * size * 0.1;
                    const sx = Math.cos(sparkAngle) * sparkDist;
                    const sy = Math.sin(sparkAngle) * sparkDist;

                    ctx.fillStyle = '#ffff88';
                    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(animTime * 15 + sp);
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                ctx.shadowBlur = 0;
                ctx.restore();

            } else {
                // Normal fireball
                const fireGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5 * flicker);
                fireGlow.addColorStop(0, 'rgba(255, 255, 150, 0.6)');
                fireGlow.addColorStop(0.3, 'rgba(255, 150, 50, 0.4)');
                fireGlow.addColorStop(0.6, 'rgba(255, 80, 20, 0.2)');
                fireGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = fireGlow;
                ctx.beginPath();
                ctx.arc(x, y, size * 1.5 * flicker, 0, Math.PI * 2);
                ctx.fill();

                // Outer flame with shadow
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 15;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle + Math.PI / 2);

                // Outer flame
                ctx.fillStyle = '#ff4400';
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.8);
                ctx.quadraticCurveTo(size * 0.6, -size * 0.2, size * 0.4, size * 0.4);
                ctx.quadraticCurveTo(0, size * 0.7, -size * 0.4, size * 0.4);
                ctx.quadraticCurveTo(-size * 0.6, -size * 0.2, 0, -size * 0.8);
                ctx.fill();

                // Inner flame (brighter)
                ctx.fillStyle = '#ff8833';
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.5);
                ctx.quadraticCurveTo(size * 0.3, 0, size * 0.2, size * 0.3);
                ctx.quadraticCurveTo(0, size * 0.45, -size * 0.2, size * 0.3);
                ctx.quadraticCurveTo(-size * 0.3, 0, 0, -size * 0.5);
                ctx.fill();

                // Core (brightest)
                ctx.fillStyle = '#ffff88';
                ctx.beginPath();
                ctx.arc(0, size * 0.1, size * 0.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.restore();
            }
        } else if (proj.type === 'wand' || proj.type === 'magicWand') {
            // Magic projectile with sparkle aura
            const animTime = Date.now() / 1000;
            const pulse = 1 + Math.sin(animTime * 8) * 0.25;
            const isEvolved = proj.color === '#ffffff';

            if (isEvolved) {
                // Holy Wand - Enhanced divine effects
                // Divine aura rings
                for (let ring = 0; ring < 2; ring++) {
                    const ringProgress = ((animTime * 2 + ring * 0.5) % 1);
                    const ringRadius = size * (0.8 + ringProgress * 0.8);
                    ctx.strokeStyle = '#ffffff';
                    ctx.globalAlpha = (1 - ringProgress) * 0.4;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ffff88';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;

                // Brilliant outer glow
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 20 * pulse;
                const holyGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5 * pulse);
                holyGlow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                holyGlow.addColorStop(0.4, 'rgba(255, 255, 200, 0.4)');
                holyGlow.addColorStop(0.7, 'rgba(255, 255, 136, 0.2)');
                holyGlow.addColorStop(1, 'rgba(255, 255, 100, 0)');
                ctx.fillStyle = holyGlow;
                ctx.beginPath();
                ctx.arc(x, y, size * 1.5 * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Light rays emanating
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(animTime * 3);
                for (let ray = 0; ray < 6; ray++) {
                    const rayAngle = ray * Math.PI / 3;
                    const rayLength = size * 1.2 + Math.sin(animTime * 6 + ray) * size * 0.3;
                    const rayGradient = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                    rayGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
                    rayGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
                    ctx.strokeStyle = rayGradient;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                    ctx.stroke();
                }
                ctx.restore();

                // Orbiting holy sparkles (more and faster)
                const orbitTime = animTime * 6;
                for (let i = 0; i < 5; i++) {
                    const sparkAngle = orbitTime + (i * Math.PI * 2 / 5);
                    const sparkDist = size * 0.8 + Math.sin(orbitTime * 2 + i) * 2;
                    const sx = x + Math.cos(sparkAngle) * sparkDist;
                    const sy = y + Math.sin(sparkAngle) * sparkDist;
                    const sparkSize = 2 + Math.sin(orbitTime * 3 + i) * 0.5;

                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#ffff88';
                    ctx.shadowBlur = 6;
                    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(orbitTime * 4 + i);
                    ctx.beginPath();
                    // 4-pointed star
                    ctx.save();
                    ctx.translate(sx, sy);
                    ctx.rotate(orbitTime + i);
                    ctx.moveTo(0, -sparkSize);
                    ctx.lineTo(sparkSize * 0.3, 0);
                    ctx.lineTo(0, sparkSize);
                    ctx.lineTo(-sparkSize * 0.3, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;

                // Main orb (white with golden core)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Golden inner core
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Bright center highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
                ctx.fill();

            } else {
                // Normal Magic Wand
                // Outer magic glow
                ctx.shadowColor = proj.color || '#9966ff';
                ctx.shadowBlur = 12;

                const magicGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.3 * pulse);
                magicGlow.addColorStop(0, 'rgba(180, 130, 255, 0.5)');
                magicGlow.addColorStop(0.5, 'rgba(130, 80, 220, 0.25)');
                magicGlow.addColorStop(1, 'rgba(100, 50, 200, 0)');
                ctx.fillStyle = magicGlow;
                ctx.beginPath();
                ctx.arc(x, y, size * 1.3 * pulse, 0, Math.PI * 2);
                ctx.fill();

                // Orbiting sparkles
                const orbitTime = animTime * 4;
                for (let i = 0; i < 3; i++) {
                    const sparkAngle = orbitTime + (i * Math.PI * 2 / 3);
                    const sparkDist = size * 0.7;
                    const sx = x + Math.cos(sparkAngle) * sparkDist;
                    const sy = y + Math.sin(sparkAngle) * sparkDist;
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                // Main magic orb
                ctx.fillStyle = proj.color || '#9966ff';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright core
                ctx.fillStyle = '#ddbbff';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
        } else if (proj.type === 'knife') {
            const angle = Math.atan2(proj.vy, proj.vx);
            const isEvolved = proj.color === '#aaaaff';
            const animTime = Date.now() / 1000;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            if (isEvolved) {
                // Thousand Edge - Enhanced visual effects
                const speed = Math.hypot(proj.vx, proj.vy);
                const speedFactor = Math.min(1, speed / 300);

                // Blade storm aura
                ctx.shadowColor = '#8888ff';
                ctx.shadowBlur = 15;
                const stormGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
                stormGlow.addColorStop(0, 'rgba(150, 150, 255, 0.4)');
                stormGlow.addColorStop(0.5, 'rgba(100, 100, 200, 0.2)');
                stormGlow.addColorStop(1, 'rgba(80, 80, 180, 0)');
                ctx.fillStyle = stormGlow;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Multiple afterimage blades (blade storm effect)
                for (let i = 5; i > 0; i--) {
                    const trailOffset = -6 * i;
                    const fadeAlpha = 0.15 * (6 - i) / 5;
                    const rotOffset = Math.sin(animTime * 15 + i * 0.5) * 0.15;

                    ctx.save();
                    ctx.translate(trailOffset, 0);
                    ctx.rotate(rotOffset);
                    ctx.globalAlpha = fadeAlpha;

                    // Ghost blade
                    ctx.fillStyle = '#aaaaff';
                    ctx.fillRect(-6, -2, 12, 4);
                    ctx.restore();
                }
                ctx.globalAlpha = 1;

                // Energy slash trails
                const slashCount = 3;
                for (let s = 0; s < slashCount; s++) {
                    const slashPhase = (animTime * 8 + s * Math.PI * 2 / slashCount) % (Math.PI * 2);
                    const slashY = Math.sin(slashPhase) * 8;
                    const slashAlpha = 0.3 + 0.2 * Math.cos(slashPhase);

                    ctx.strokeStyle = `rgba(170, 170, 255, ${slashAlpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(-15, slashY);
                    ctx.lineTo(8, slashY * 0.3);
                    ctx.stroke();
                }

                // Motion blur trail (enhanced)
                const gradient = ctx.createLinearGradient(-30, 0, 0, 0);
                gradient.addColorStop(0, 'rgba(150, 150, 255, 0)');
                gradient.addColorStop(0.3, 'rgba(150, 150, 255, 0.15)');
                gradient.addColorStop(0.7, 'rgba(170, 170, 255, 0.35)');
                gradient.addColorStop(1, 'rgba(200, 200, 255, 0.5)');
                ctx.fillStyle = gradient;
                ctx.fillRect(-30, -2, 26, 4);

                // Spinning energy particles around blade
                for (let p = 0; p < 4; p++) {
                    const pAngle = animTime * 12 + p * Math.PI / 2;
                    const pDist = 6 + Math.sin(animTime * 8 + p) * 2;
                    const px = Math.cos(pAngle) * pDist * 0.5;
                    const py = Math.sin(pAngle) * pDist;

                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(animTime * 10 + p);
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                // Main blade outline (glowing)
                ctx.shadowColor = '#aaaaff';
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#000000';
                ctx.fillRect(-7, -3, 14, 6);
                ctx.shadowBlur = 0;

                // Blade body (evolved blue-silver)
                const bladeGradient = ctx.createLinearGradient(-6, -2, -6, 2);
                bladeGradient.addColorStop(0, '#ccccff');
                bladeGradient.addColorStop(0.5, '#aaaaff');
                bladeGradient.addColorStop(1, '#8888dd');
                ctx.fillStyle = bladeGradient;
                ctx.fillRect(-6, -2, 12, 4);

                // Blade edge (sharp ethereal highlight)
                const edgeGradient = ctx.createLinearGradient(-6, 0, 6, 0);
                edgeGradient.addColorStop(0, '#8888cc');
                edgeGradient.addColorStop(0.5, '#ffffff');
                edgeGradient.addColorStop(1, '#ccccff');
                ctx.fillStyle = edgeGradient;
                ctx.fillRect(0, -2, 6, 1);

                // Magical handle
                ctx.fillStyle = '#4444aa';
                ctx.fillRect(-6, -1, 4, 2);

                // Handle runes (glowing)
                ctx.fillStyle = '#aaaaff';
                ctx.globalAlpha = 0.5 + 0.3 * Math.sin(animTime * 6);
                ctx.fillRect(-5, -1, 1, 2);
                ctx.fillRect(-3, -1, 1, 2);
                ctx.globalAlpha = 1;

                // Tip energy point
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#aaaaff';
                ctx.shadowBlur = 5;
                ctx.fillRect(4, -1, 2, 2);
                ctx.shadowBlur = 0;

            } else {
                // Normal knife
                // Motion blur trail
                const gradient = ctx.createLinearGradient(-20, 0, 0, 0);
                gradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
                gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.2)');
                gradient.addColorStop(1, 'rgba(200, 200, 200, 0.4)');
                ctx.fillStyle = gradient;
                ctx.fillRect(-20, -1.5, 16, 3);

                // Metallic shine line
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-18, 0);
                ctx.lineTo(-4, 0);
                ctx.stroke();

                // Outline
                ctx.fillStyle = '#000000';
                ctx.fillRect(-7, -3, 14, 6);

                // Blade body
                ctx.fillStyle = '#cccccc';
                ctx.fillRect(-6, -2, 12, 4);

                // Blade edge (sharp highlight)
                const edgeGradient = ctx.createLinearGradient(-6, 0, 6, 0);
                edgeGradient.addColorStop(0, '#aaaaaa');
                edgeGradient.addColorStop(0.5, '#ffffff');
                edgeGradient.addColorStop(1, '#dddddd');
                ctx.fillStyle = edgeGradient;
                ctx.fillRect(0, -2, 6, 1);

                // Handle
                ctx.fillStyle = '#886644';
                ctx.fillRect(-6, -1, 4, 2);

                // Handle wrap
                ctx.fillStyle = '#664422';
                ctx.fillRect(-5, -1, 1, 2);
                ctx.fillRect(-3, -1, 1, 2);

                // Tip highlight
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(4, -1, 2, 1);
            }

            ctx.restore();
        } else if (proj.type === 'cross') {
            const rotation = Date.now() / 100;
            const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;

            // Outer holy aura
            ctx.shadowColor = '#ffff88';
            ctx.shadowBlur = 20;

            // Holy glow (larger, pulsing)
            const crossGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5 * pulse);
            crossGlow.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
            crossGlow.addColorStop(0.5, 'rgba(255, 255, 100, 0.2)');
            crossGlow.addColorStop(1, 'rgba(255, 255, 50, 0)');
            ctx.fillStyle = crossGlow;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Light trail particles
            ctx.fillStyle = '#ffffcc';
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 4; i++) {
                const trailAngle = rotation - i * 0.5;
                const trailDist = size * 0.6;
                const tx = x + Math.cos(trailAngle) * trailDist;
                const ty = y + Math.sin(trailAngle) * trailDist;
                ctx.fillRect(tx - 1, ty - 1, 3, 3);
            }
            ctx.globalAlpha = 1;

            // Cross
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Black outline
            ctx.fillStyle = '#000000';
            ctx.fillRect(-size / 6 - 2, -size / 2 - 2, size / 3 + 4, size + 4);
            ctx.fillRect(-size / 2 - 2, -size / 6 - 2, size + 4, size / 3 + 4);

            // Cross body (golden)
            ctx.fillStyle = '#ffdd44';
            ctx.fillRect(-size / 6, -size / 2, size / 3, size);
            ctx.fillRect(-size / 2, -size / 6, size, size / 3);

            // Inner gradient highlight
            ctx.fillStyle = '#ffee88';
            ctx.fillRect(-size / 8, -size / 2 + 2, size / 4, size - 4);
            ctx.fillRect(-size / 2 + 2, -size / 8, size - 4, size / 4);

            // Bright glowing center
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-3, -3, 6, 6);

            // Corner jewel accents
            ctx.fillStyle = '#ff6666';
            ctx.fillRect(-size / 6, -size / 2, 3, 3);
            ctx.fillRect(-size / 6, size / 2 - 3, 3, 3);
            ctx.fillRect(-size / 2, -size / 6, 3, 3);
            ctx.fillRect(size / 2 - 3, -size / 6, 3, 3);

            ctx.restore();
        } else if (proj.type === 'runetracer') {
            const evolved = proj.explodesOnEnd;
            const baseColor = evolved ? '#ff00ff' : '#00ffff';
            const glowColor = evolved ? 'rgba(255, 0, 255, 0.5)' : 'rgba(0, 255, 255, 0.5)';

            // Outer magic glow with pulsing
            const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.15;
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 15 * pulseScale;

            const runeGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
            runeGlow.addColorStop(0, glowColor);
            runeGlow.addColorStop(0.5, evolved ? 'rgba(255, 100, 255, 0.2)' : 'rgba(100, 200, 255, 0.2)');
            runeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = runeGlow;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Orbiting rune symbols
            ctx.save();
            ctx.translate(x, y);
            const orbitRadius = size * 0.8;
            for (let r = 0; r < 3; r++) {
                const orbitAngle = Date.now() / 200 + (r * Math.PI * 2 / 3);
                const ox = Math.cos(orbitAngle) * orbitRadius;
                const oy = Math.sin(orbitAngle) * orbitRadius;
                ctx.fillStyle = baseColor;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(ox, oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.restore();

            // Main rune symbol
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Date.now() / 80);
            const s = size / 2;

            // Outer triangle outline (black)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.7, s * 0.8);
            ctx.lineTo(-s * 0.7, s * 0.8);
            ctx.closePath();
            ctx.stroke();

            // Main triangle fill
            ctx.fillStyle = evolved ? '#ff66ff' : '#66ddff';
            ctx.fill();

            // Inner inverted triangle
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, s * 0.4);
            ctx.lineTo(s * 0.3, -s * 0.1);
            ctx.lineTo(-s * 0.3, -s * 0.1);
            ctx.closePath();
            ctx.stroke();

            // Bright center core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.restore();
        } else if (proj.type === 'phiera' || proj.type === 'eight') {
            // Directional bullets with trail
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            // Trail
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = proj.color;
            ctx.fillRect(-12, -1, 8, 2);
            ctx.globalAlpha = 0.2;
            ctx.fillRect(-18, -1, 6, 2);
            ctx.globalAlpha = 1;
            // Outline
            ctx.fillStyle = '#000000';
            ctx.fillRect(-5, -3, 12, 6);
            // Bullet shape
            ctx.fillStyle = proj.color;
            ctx.fillRect(-4, -2, 10, 4);
            // Tip highlight
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(4, -1, 2, 2);
            ctx.restore();
        } else if (proj.type === 'phieraggi') {
            // Dual-colored union projectile
            const angle = Math.atan2(proj.vy, proj.vx);
            // Powerful glow
            const phieraggiGlow = ctx.createRadialGradient(x, y, 0, x, y, 15);
            phieraggiGlow.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
            phieraggiGlow.addColorStop(1, 'rgba(255, 100, 50, 0)');
            ctx.fillStyle = phieraggiGlow;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            // Trail effect
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = proj.color;
            ctx.fillRect(-18, -2, 12, 4);
            ctx.globalAlpha = 0.25;
            ctx.fillRect(-26, -1, 8, 2);
            ctx.globalAlpha = 1;
            // Outline
            ctx.fillStyle = '#000000';
            ctx.fillRect(-7, -4, 14, 8);
            // Body
            ctx.fillStyle = proj.color;
            ctx.fillRect(-6, -3, 12, 6);
            // Glowing core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -1, 6, 2);
            ctx.restore();
        } else {
            // Default projectile with glow
            const defaultGlow = ctx.createRadialGradient(x, y, 0, x, y, 8);
            defaultGlow.addColorStop(0, proj.color.replace(')', ', 0.4)').replace('rgb', 'rgba').replace('#', 'rgba('));
            defaultGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = defaultGlow;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            // Outline
            ctx.fillStyle = '#000000';
            drawPixelRect(x - 3, y - 3, 6, 6);
            // Body
            ctx.fillStyle = proj.color;
            drawPixelRect(x - 2, y - 2, 4, 4);
            // Highlight
            ctx.fillStyle = '#ffffff';
            drawPixelRect(x - 1, y - 1, 2, 2);
        }
    }
}

function drawAreaEffects() {
    for (const effect of areaEffects) {
        const alpha = effect.lifetime / effect.maxLifetime;

        if (effect.type === 'whip') {
            const centerX = effect.x + effect.width / 2;
            const centerY = effect.y + effect.height / 2;
            const facingRight = effect.facingRight !== false;
            const isEvolved = effect.evolved;
            const animProgress = 1 - alpha; // 0 to 1 as effect progresses

            // Dynamic wave amplitude for whip motion
            const waveAmplitude = 8 * Math.sin(animProgress * Math.PI) * alpha;
            const waveFrequency = 3;

            // Outer motion blur trails (3 layers)
            for (let trail = 2; trail >= 0; trail--) {
                const trailAlpha = alpha * (0.15 - trail * 0.04);
                const trailOffset = trail * 6 * (facingRight ? -1 : 1);
                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = effect.color;
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 10;
                ctx.fillRect(effect.x + trailOffset, effect.y - trail * 2, effect.width, effect.height + trail * 4);
            }
            ctx.shadowBlur = 0;

            // Main whip body with curved shape
            ctx.save();
            ctx.beginPath();
            const startX = facingRight ? effect.x : effect.x + effect.width;
            const endX = facingRight ? effect.x + effect.width : effect.x;

            ctx.moveTo(startX, effect.y);
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                const x = startX + (endX - startX) * t;
                const waveY = Math.sin(t * Math.PI * waveFrequency + animProgress * 5) * waveAmplitude * t;
                ctx.lineTo(x, effect.y + waveY);
            }
            for (let i = 10; i >= 0; i--) {
                const t = i / 10;
                const x = startX + (endX - startX) * t;
                const waveY = Math.sin(t * Math.PI * waveFrequency + animProgress * 5) * waveAmplitude * t;
                ctx.lineTo(x, effect.y + effect.height + waveY);
            }
            ctx.closePath();

            // Black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.globalAlpha = alpha * 0.9;
            ctx.stroke();

            // Main fill with gradient
            const gradient = ctx.createLinearGradient(
                facingRight ? effect.x : effect.x + effect.width,
                effect.y,
                facingRight ? effect.x + effect.width : effect.x,
                effect.y
            );
            if (isEvolved) {
                gradient.addColorStop(0, '#aa2222');
                gradient.addColorStop(0.5, effect.color);
                gradient.addColorStop(1, '#ffaaaa');
            } else {
                gradient.addColorStop(0, '#aa8800');
                gradient.addColorStop(0.5, effect.color);
                gradient.addColorStop(1, '#ffffaa');
            }
            ctx.fillStyle = gradient;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.restore();

            // Whip crack spark effect at tip
            const tipX = facingRight ? effect.x + effect.width : effect.x;
            const tipY = centerY;
            const sparkIntensity = Math.sin(animProgress * Math.PI);

            ctx.shadowColor = isEvolved ? '#ff4444' : '#ffff00';
            ctx.shadowBlur = 20 * sparkIntensity;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * sparkIntensity;
            ctx.beginPath();
            ctx.arc(tipX, tipY, 8 + sparkIntensity * 6, 0, Math.PI * 2);
            ctx.fill();

            // Speed lines radiating from tip
            ctx.strokeStyle = isEvolved ? '#ff6666' : '#ffee66';
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha * 0.7 * sparkIntensity;
            for (let i = 0; i < 6; i++) {
                const lineAngle = (facingRight ? 0 : Math.PI) + (i - 2.5) * 0.25;
                const lineLength = 15 + Math.random() * 20;
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(
                    tipX + Math.cos(lineAngle) * lineLength,
                    tipY + Math.sin(lineAngle) * lineLength
                );
                ctx.stroke();
            }

            // Inner highlight wave
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.moveTo(startX, centerY - 2);
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                const x = startX + (endX - startX) * t;
                const waveY = Math.sin(t * Math.PI * waveFrequency + animProgress * 5) * waveAmplitude * t * 0.5;
                ctx.lineTo(x, centerY - 2 + waveY);
            }
            for (let i = 10; i >= 0; i--) {
                const t = i / 10;
                const x = startX + (endX - startX) * t;
                const waveY = Math.sin(t * Math.PI * waveFrequency + animProgress * 5) * waveAmplitude * t * 0.5;
                ctx.lineTo(x, centerY + 4 + waveY);
            }
            ctx.closePath();
            ctx.fill();

            // Bloody Tear special effects
            if (isEvolved) {
                const animTime = Date.now() / 1000;

                // Blood drip particles along the whip
                for (let drop = 0; drop < 5; drop++) {
                    const dropT = (drop + 0.5) / 5;
                    const dropPhase = (animTime * 2 + drop * 0.4) % 1.5;
                    if (dropPhase < 1) {
                        const dropX = startX + (endX - startX) * dropT;
                        const dropWaveY = Math.sin(dropT * Math.PI * waveFrequency + animProgress * 5) * waveAmplitude * dropT;
                        const dropY = effect.y + effect.height / 2 + dropWaveY + dropPhase * 15;
                        const dropAlpha = alpha * (1 - dropPhase) * 0.8;

                        ctx.globalAlpha = dropAlpha;
                        ctx.fillStyle = '#aa0000';
                        ctx.shadowColor = '#ff0000';
                        ctx.shadowBlur = 4;
                        // Blood drop shape (teardrop)
                        ctx.beginPath();
                        ctx.moveTo(dropX, dropY - 3);
                        ctx.quadraticCurveTo(dropX + 2, dropY, dropX, dropY + 3);
                        ctx.quadraticCurveTo(dropX - 2, dropY, dropX, dropY - 3);
                        ctx.fill();
                    }
                }
                ctx.shadowBlur = 0;

                // Blood absorption effect (particles going towards player)
                const playerDir = facingRight ? -1 : 1;
                for (let absorb = 0; absorb < 3; absorb++) {
                    const absorbPhase = (animTime * 3 + absorb * 0.3) % 1;
                    const absorbT = 0.5 + absorb * 0.15;
                    const absorbStartX = startX + (endX - startX) * absorbT;
                    const absorbX = absorbStartX + playerDir * absorbPhase * 60;
                    const absorbY = centerY + Math.sin(absorbPhase * Math.PI * 2) * 8 - absorbPhase * 10;
                    const absorbAlpha = alpha * (1 - absorbPhase) * 0.6;
                    const absorbSize = 3 * (1 - absorbPhase * 0.5);

                    ctx.globalAlpha = absorbAlpha;
                    ctx.fillStyle = '#ff4444';
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(absorbX, absorbY, absorbSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;

                // Crimson aura around the whole whip
                ctx.globalAlpha = alpha * 0.2 * (0.8 + 0.2 * Math.sin(animTime * 6));
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 8;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(startX, centerY);
                for (let i = 0; i <= 10; i++) {
                    const t = i / 10;
                    const x = startX + (endX - startX) * t;
                    const waveY = Math.sin(t * Math.PI * waveFrequency + animProgress * 5) * waveAmplitude * t;
                    ctx.lineTo(x, centerY + waveY);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (effect.type === 'holywater') {
            const centerX = effect.x + effect.width / 2;
            const centerY = effect.y + effect.height / 2;
            const radiusX = effect.width / 2;
            const radiusY = effect.height / 2;
            const animTime = Date.now() / 1000;
            const isEvolved = effect.color === '#4444ff';

            // Multiple expanding holy rings (blessing aura)
            for (let ring = 0; ring < 3; ring++) {
                const ringProgress = ((animTime * 0.8 + ring * 0.33) % 1);
                const ringRadius = radiusX * (0.6 + ringProgress * 0.5);
                const ringAlpha = alpha * (1 - ringProgress) * 0.4;

                ctx.strokeStyle = isEvolved ? '#6666ff' : '#66ccff';
                ctx.globalAlpha = ringAlpha;
                ctx.lineWidth = 2;
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 10 * (1 - ringProgress);
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, ringRadius, ringRadius * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            // Outer divine glow pulsing effect
            const pulse = 1 + 0.25 * Math.sin(animTime * 6);
            ctx.shadowColor = isEvolved ? '#8888ff' : '#88ddff';
            ctx.shadowBlur = 25 * alpha * pulse;
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.15;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX * 1.4, radiusY * 1.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Black outline
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX + 3, radiusY + 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Main holy water pool with gradient
            const poolGradient = ctx.createRadialGradient(
                centerX, centerY - radiusY * 0.2, 0,
                centerX, centerY, radiusX
            );
            if (isEvolved) {
                poolGradient.addColorStop(0, 'rgba(136, 136, 255, 0.9)');
                poolGradient.addColorStop(0.5, 'rgba(68, 68, 255, 0.7)');
                poolGradient.addColorStop(1, 'rgba(34, 34, 170, 0.5)');
            } else {
                poolGradient.addColorStop(0, 'rgba(170, 221, 255, 0.9)');
                poolGradient.addColorStop(0.5, 'rgba(68, 170, 255, 0.7)');
                poolGradient.addColorStop(1, 'rgba(34, 136, 204, 0.5)');
            }
            ctx.fillStyle = poolGradient;
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            // Water surface ripples
            ctx.strokeStyle = isEvolved ? '#aaaaff' : '#aaddff';
            ctx.lineWidth = 1;
            for (let ripple = 0; ripple < 3; ripple++) {
                const rippleProgress = ((animTime * 1.5 + ripple * 0.33) % 1);
                const rippleRadius = radiusX * rippleProgress * 0.8;
                ctx.globalAlpha = alpha * (1 - rippleProgress) * 0.4;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, rippleRadius, rippleRadius * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Glowing cross symbol in center
            ctx.shadowColor = isEvolved ? '#ffffff' : '#ffff88';
            ctx.shadowBlur = 12 * alpha;
            ctx.fillStyle = isEvolved ? '#ddddff' : '#ffffff';
            ctx.globalAlpha = alpha * (0.5 + 0.2 * Math.sin(animTime * 4));
            const crossSize = radiusX * 0.3;
            ctx.fillRect(centerX - 1.5, centerY - crossSize, 3, crossSize * 2);
            ctx.fillRect(centerX - crossSize * 0.6, centerY - 1.5, crossSize * 1.2, 3);
            ctx.shadowBlur = 0;

            // Rising holy light particles
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 8; i++) {
                const particlePhase = (animTime * 2 + i * 0.4) % 2;
                if (particlePhase < 1.2) {
                    const px = centerX + Math.cos(i * Math.PI * 2 / 8 + animTime * 0.5) * radiusX * 0.5;
                    const py = centerY - particlePhase * radiusY * 1.2;
                    const pAlpha = alpha * (1 - particlePhase / 1.2) * 0.8;
                    ctx.globalAlpha = pAlpha;
                    ctx.shadowColor = effect.color;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.shadowBlur = 0;

            // Orbiting sparkle bubbles
            ctx.fillStyle = '#ffffff';
            const bubbleTime = animTime * 3;
            for (let i = 0; i < 6; i++) {
                const bubbleAngle = (i / 6) * Math.PI * 2 + bubbleTime;
                const bubbleR = radiusX * 0.6 * (0.6 + 0.3 * Math.sin(bubbleTime * 0.5 + i));
                const bx = centerX + Math.cos(bubbleAngle) * bubbleR;
                const by = centerY + Math.sin(bubbleAngle) * bubbleR * 0.5;
                const bobble = Math.sin(bubbleTime * 2 + i) * 2;
                ctx.globalAlpha = alpha * (0.5 + 0.3 * Math.sin(bubbleTime + i));
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(bx, by + bobble, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (effect.type === 'explosion') {
            const centerX = effect.x + effect.width / 2;
            const centerY = effect.y + effect.height / 2;
            const radius = effect.width / 2 * (1 + (1 - alpha) * 0.5);

            // Outer glow
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 30 * alpha;

            // Black outline ring
            ctx.strokeStyle = '#000000';
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Main explosion fill
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.fillStyle = '#ffff88';
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // White hot center
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Spark particles flying outward
            ctx.fillStyle = '#ffcc00';
            ctx.globalAlpha = alpha * 0.9;
            for (let i = 0; i < 8; i++) {
                const sparkAngle = (i / 8) * Math.PI * 2;
                const sparkR = radius * (0.8 + (1 - alpha) * 0.4);
                const sx = centerX + Math.cos(sparkAngle) * sparkR;
                const sy = centerY + Math.sin(sparkAngle) * sparkR;
                ctx.fillRect(sx - 2, sy - 2, 4, 4);
            }

            ctx.globalAlpha = 1;
        } else if (effect.type === 'garlic') {
            const isEvolved = effect.evolved;
            const animTime = Date.now() / 1000;
            const pulse = 1 + 0.2 * Math.sin(animTime * 8);
            const expandProgress = 1 - alpha;

            // Multiple expanding rings for burst effect
            for (let ring = 0; ring < 3; ring++) {
                const ringProgress = (expandProgress + ring * 0.1) % 1;
                const ringRadius = effect.radius * (0.5 + ringProgress * 0.6);
                const ringAlpha = alpha * (1 - ringProgress) * 0.4;

                ctx.strokeStyle = effect.color;
                ctx.globalAlpha = ringAlpha;
                ctx.lineWidth = 3 - ring;
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 15 * (1 - ringProgress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            // Outer pulsing glow aura
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 30 * alpha * pulse;

            // Gradient fill for main aura
            const gradient = ctx.createRadialGradient(
                effect.x, effect.y, 0,
                effect.x, effect.y, effect.radius
            );
            if (isEvolved) {
                gradient.addColorStop(0, 'rgba(170, 68, 170, 0.3)');
                gradient.addColorStop(0.5, 'rgba(170, 68, 170, 0.15)');
                gradient.addColorStop(0.8, 'rgba(255, 136, 255, 0.1)');
                gradient.addColorStop(1, 'rgba(170, 68, 170, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(136, 255, 136, 0.3)');
                gradient.addColorStop(0.5, 'rgba(136, 255, 136, 0.15)');
                gradient.addColorStop(0.8, 'rgba(200, 255, 200, 0.1)');
                gradient.addColorStop(1, 'rgba(136, 255, 136, 0)');
            }
            ctx.fillStyle = gradient;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();

            // Black outline for visibility
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#000000';
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Main garlic aura ring with glow
            ctx.strokeStyle = effect.color;
            ctx.globalAlpha = alpha * 0.9;
            ctx.lineWidth = 3;
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Rotating spore particles around the aura
            const particleTime = animTime * 2;
            const particleCount = isEvolved ? 10 : 6;
            for (let i = 0; i < particleCount; i++) {
                const baseAngle = (i / particleCount) * Math.PI * 2;
                const wobble = Math.sin(particleTime * 3 + i * 1.5) * 0.3;
                const particleAngle = baseAngle + particleTime + wobble;
                const particleR = effect.radius * (0.6 + 0.3 * Math.sin(particleTime * 2 + i));
                const px = effect.x + Math.cos(particleAngle) * particleR;
                const py = effect.y + Math.sin(particleAngle) * particleR;

                // Spore glow
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 6;
                ctx.fillStyle = effect.color;
                ctx.globalAlpha = alpha * 0.7;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();

                // Spore highlight
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Inner pulsing rings
            for (let r = 0; r < 2; r++) {
                const innerRadius = effect.radius * (0.4 + r * 0.25) * pulse;
                ctx.strokeStyle = isEvolved ? '#ff88ff' : '#aaffaa';
                ctx.globalAlpha = alpha * (0.4 - r * 0.15);
                ctx.lineWidth = 2 - r;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, innerRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            // Center bright core
            const coreGradient = ctx.createRadialGradient(
                effect.x, effect.y, 0,
                effect.x, effect.y, effect.radius * 0.3
            );
            coreGradient.addColorStop(0, isEvolved ? 'rgba(255, 200, 255, 0.5)' : 'rgba(200, 255, 200, 0.5)');
            coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = coreGradient;
            ctx.globalAlpha = alpha * pulse;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (effect.type === 'lightning') {
            const radius = effect.radius * (1 + (1 - alpha));

            // Electric glow
            ctx.shadowColor = '#88ffff';
            ctx.shadowBlur = 35 * alpha;

            // Outer electric ring
            ctx.strokeStyle = '#000000';
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();

            // Main lightning strike area
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Bright core
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Lightning bolt sparks (jagged lines)
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.8;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const boltAngle = (i / 4) * Math.PI * 2 + Date.now() / 100;
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y);
                let bx = effect.x;
                let by = effect.y;
                for (let j = 0; j < 3; j++) {
                    const jag = (Math.random() - 0.5) * 10;
                    bx += Math.cos(boltAngle) * (radius / 3) + jag;
                    by += Math.sin(boltAngle) * (radius / 3) + jag;
                    ctx.lineTo(bx, by);
                }
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
        } else if (effect.type === 'pentagram') {
            const centerX = effect.x;
            const centerY = effect.y;
            const radius = effect.radius * alpha;

            // Outer pulsing glow
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 40 * alpha;

            // Screen flash effect
            ctx.globalAlpha = alpha * 0.15;
            ctx.fillStyle = effect.color;
            ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
            ctx.shadowBlur = 0;

            // Draw pentagram star
            ctx.strokeStyle = effect.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
                const px = centerX + Math.cos(angle) * radius * 0.4;
                const py = centerY + Math.sin(angle) * radius * 0.4;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Outer circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
            ctx.stroke();

            // Multiple expanding rings
            for (let i = 0; i < 3; i++) {
                const ringRadius = radius * (0.3 + i * 0.3) * (1.5 - alpha);
                ctx.strokeStyle = effect.color;
                ctx.globalAlpha = alpha * (0.6 - i * 0.15);
                ctx.lineWidth = 3 - i;
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Particle sparkles
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha;
            const sparkleCount = 12;
            for (let i = 0; i < sparkleCount; i++) {
                const sparkAngle = (i / sparkleCount) * Math.PI * 2 + Date.now() / 500;
                const sparkDist = radius * (0.2 + 0.3 * (1 - alpha));
                const sx = centerX + Math.cos(sparkAngle) * sparkDist;
                const sy = centerY + Math.sin(sparkAngle) * sparkDist;
                ctx.fillRect(sx - 2, sy - 2, 4, 4);
            }

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
        } else if (effect.type === 'peachone') {
            // Holy light bombardment - white/gold expanding circle
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.6;
            const radius = (effect.width / 2) * (2 - alpha);
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius, 0, Math.PI * 2);
            ctx.fill();
            // Inner glow
            ctx.fillStyle = '#ffffaa';
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'ebonywings') {
            // Dark energy bombardment - purple/black expanding circle
            ctx.fillStyle = '#220044';
            ctx.globalAlpha = alpha * 0.7;
            const radius = (effect.width / 2) * (2 - alpha);
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius, 0, Math.PI * 2);
            ctx.fill();
            // Inner void
            ctx.fillStyle = '#6644aa';
            ctx.globalAlpha = alpha * 0.9;
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'vandalier') {
            // Combined light and dark bombardment
            const radius = (effect.width / 2) * (2 - alpha);
            // Outer ring
            ctx.strokeStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
            // Inner fill
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'songofmana') {
            // Vertical beam effect with enhanced visuals
            const centerX = effect.x + effect.width / 2;
            const beamTime = Date.now() / 100;

            // Outer glow
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 20 * alpha;

            // Background glow layer (wider)
            const glowGradient = ctx.createLinearGradient(
                effect.x - effect.width * 0.5, 0,
                effect.x + effect.width * 1.5, 0
            );
            glowGradient.addColorStop(0, 'rgba(0,0,0,0)');
            glowGradient.addColorStop(0.3, effect.color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#', 'rgba('));
            glowGradient.addColorStop(0.5, effect.color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', 'rgba('));
            glowGradient.addColorStop(0.7, effect.color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#', 'rgba('));
            glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.globalAlpha = alpha;
            ctx.fillStyle = glowGradient;
            ctx.fillRect(effect.x - effect.width * 0.5, effect.y, effect.width * 2, effect.height);
            ctx.shadowBlur = 0;

            // Main beam body
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillRect(effect.x, effect.y, effect.width, effect.height);

            // Brighter inner beam
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillRect(effect.x + effect.width * 0.35, effect.y, effect.width * 0.3, effect.height);

            // Musical note particles floating upward
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.9;
            const noteCount = 5;
            for (let i = 0; i < noteCount; i++) {
                const noteY = effect.y + effect.height * (1 - ((beamTime * 0.5 + i * 0.2) % 1));
                const noteX = centerX + Math.sin(beamTime + i * 2) * (effect.width * 0.3);
                // Simple note shape (circle with stem)
                ctx.beginPath();
                ctx.arc(noteX, noteY, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(noteX + 2, noteY - 8, 2, 8);
            }

            // Edge sparkle lines
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const sparkY = effect.y + (effect.height / 8) * i + (beamTime * 30) % (effect.height / 8);
                ctx.beginPath();
                ctx.moveTo(effect.x, sparkY);
                ctx.lineTo(effect.x + effect.width * 0.2, sparkY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(effect.x + effect.width * 0.8, sparkY);
                ctx.lineTo(effect.x + effect.width, sparkY);
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
        } else if (effect.type === 'ventosacro') {
            // Fan slash effect
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.7;
            ctx.save();
            ctx.translate(effect.x + effect.width / 2, effect.y + effect.height / 2);
            ctx.rotate(effect.angle || 0);
            // Slash arc
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, effect.width * (1.5 - alpha * 0.5), -0.3, 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;
        } else if (effect.type === 'fuwalafuwaloo' || effect.type === 'fuwalafuwaloo_center') {
            // Ultimate slash effect with sakura-like visuals
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha * 0.8;
            const radius = (effect.width / 2) * (1.5 - alpha * 0.3);
            ctx.beginPath();
            ctx.arc(effect.x + effect.width / 2, effect.y + effect.height / 2, radius, 0, Math.PI * 2);
            ctx.fill();
            // Petal-like sparkles
            if (effect.type === 'fuwalafuwaloo') {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = alpha;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + Date.now() / 500;
                    const sparkleX = effect.x + effect.width / 2 + Math.cos(angle) * radius * 0.6;
                    const sparkleY = effect.y + effect.height / 2 + Math.sin(angle) * radius * 0.6;
                    ctx.fillRect(sparkleX - 2, sparkleY - 2, 4, 4);
                }
            }
            ctx.globalAlpha = 1;
        }
    }
}

function drawOrbitingWeapons() {
    const animTime = Date.now() / 1000;

    // Draw orbital path ring for Death Spiral axes
    if (orbitingWeapons.length > 0) {
        const orbDistance = orbitingWeapons[0].distance;

        ctx.save();
        ctx.translate(player.x, player.y);

        // Dark energy orbit ring
        const darkPulse = 1 + 0.15 * Math.sin(animTime * 5);
        ctx.strokeStyle = 'rgba(80, 20, 20, 0.3)';
        ctx.lineWidth = 12 * darkPulse;
        ctx.shadowColor = '#ff4422';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, orbDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner spinning dark wisps
        for (let w = 0; w < 8; w++) {
            const wispAngle = animTime * 3 + w * Math.PI / 4;
            const wispX = Math.cos(wispAngle) * orbDistance;
            const wispY = Math.sin(wispAngle) * orbDistance;
            const wispSize = 3 + Math.sin(animTime * 6 + w) * 1.5;

            ctx.fillStyle = `rgba(100, 30, 30, ${0.4 + 0.2 * Math.sin(animTime * 4 + w)})`;
            ctx.beginPath();
            ctx.arc(wispX, wispY, wispSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    for (const orb of orbitingWeapons) {
        const x = player.x + Math.cos(orb.angle) * orb.distance;
        const y = player.y + Math.sin(orb.angle) * orb.distance;
        const rotation = orb.angle * 2 + animTime * 10;

        // Death Spiral - Dark aura and trail effects

        // Motion trail with dark energy
        for (let trail = 4; trail > 0; trail--) {
            const trailAngle = orb.angle - trail * 0.2;
            const tx = player.x + Math.cos(trailAngle) * orb.distance;
            const ty = player.y + Math.sin(trailAngle) * orb.distance;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(trailAngle * 2 + animTime * 10);
            ctx.globalAlpha = 0.15 * (5 - trail) / 4;
            ctx.fillStyle = '#882222';
            ctx.fillRect(-6, -6, 12, 12);
            ctx.restore();
        }

        // Dark energy aura
        ctx.save();
        ctx.translate(x, y);

        // Outer dark glow
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 25;
        const darkGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
        darkGlow.addColorStop(0, 'rgba(150, 50, 30, 0.5)');
        darkGlow.addColorStop(0.5, 'rgba(100, 30, 20, 0.3)');
        darkGlow.addColorStop(1, 'rgba(60, 10, 10, 0)');
        ctx.fillStyle = darkGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spinning dark energy particles
        for (let p = 0; p < 6; p++) {
            const pAngle = animTime * 8 + p * Math.PI / 3;
            const pDist = 10 + Math.sin(animTime * 5 + p) * 3;
            const px = Math.cos(pAngle) * pDist;
            const py = Math.sin(pAngle) * pDist;

            ctx.fillStyle = '#ff4422';
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(animTime * 6 + p);
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Rotate for main axe
        ctx.rotate(rotation);

        // Black outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(-7, -7, 14, 14);

        // Axe body with gradient
        const axeGradient = ctx.createLinearGradient(-6, -6, 6, 6);
        axeGradient.addColorStop(0, '#ff6644');
        axeGradient.addColorStop(0.5, '#cc4422');
        axeGradient.addColorStop(1, '#882211');
        ctx.fillStyle = axeGradient;
        ctx.fillRect(-6, -6, 12, 12);

        // Blade edge highlight
        ctx.fillStyle = '#ffaa88';
        ctx.fillRect(-6, -6, 6, 2);
        ctx.fillRect(-6, -6, 2, 6);

        // Dark core rune
        ctx.fillStyle = '#440000';
        ctx.fillRect(-2, -2, 4, 4);

        // Pulsing center energy
        const centerPulse = 0.5 + 0.5 * Math.sin(animTime * 8);
        ctx.fillStyle = `rgba(255, 100, 50, ${centerPulse})`;
        ctx.fillRect(-1, -1, 2, 2);

        // Edge sparks
        for (let s = 0; s < 4; s++) {
            const sparkAngle = animTime * 12 + s * Math.PI / 2;
            const sparkDist = 6;
            const sx = Math.cos(sparkAngle) * sparkDist;
            const sy = Math.sin(sparkAngle) * sparkDist;

            ctx.fillStyle = '#ffcc88';
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(animTime * 10 + s * 2);
            ctx.fillRect(sx - 1, sy - 1, 2, 2);
        }
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}

function drawBibleOrbits() {
    const animTime = Date.now() / 1000;

    // Draw orbit trail ring around player
    if (bibleOrbits.length > 0) {
        const orbitDistance = bibleOrbits[0].distance;
        const isEvolved = bibleOrbits[0].color === '#ffaa00';

        // Outer orbit ring glow
        ctx.save();
        ctx.translate(player.x, player.y);

        // Pulsing orbit path
        const orbitPulse = 1 + 0.1 * Math.sin(animTime * 4);
        ctx.strokeStyle = isEvolved ? 'rgba(255, 200, 100, 0.2)' : 'rgba(255, 255, 200, 0.15)';
        ctx.lineWidth = 8 * orbitPulse;
        ctx.shadowColor = isEvolved ? '#ffaa00' : '#ffff88';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, orbitDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner dashed orbit ring
        ctx.strokeStyle = isEvolved ? 'rgba(255, 170, 0, 0.4)' : 'rgba(255, 255, 136, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -animTime * 30;
        ctx.beginPath();
        ctx.arc(0, 0, orbitDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    for (const bible of bibleOrbits) {
        const x = player.x + Math.cos(bible.angle) * bible.distance;
        const y = player.y + Math.sin(bible.angle) * bible.distance;
        const rotation = bible.angle * 0.5 + animTime * 5;
        const isEvolved = bible.color === '#ffaa00';

        // Draw motion trail behind bible
        for (let trail = 3; trail > 0; trail--) {
            const trailAngle = bible.angle - trail * 0.15;
            const tx = player.x + Math.cos(trailAngle) * bible.distance;
            const ty = player.y + Math.sin(trailAngle) * bible.distance;
            ctx.globalAlpha = 0.15 * (4 - trail) / 3;
            ctx.fillStyle = bible.color;
            ctx.shadowColor = bible.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(tx, ty, 8 - trail, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Divine light rays emanating from bible
        if (isEvolved) {
            ctx.save();
            for (let ray = 0; ray < 6; ray++) {
                const rayAngle = ray * Math.PI / 3 + animTime * 2;
                const rayLength = 20 + Math.sin(animTime * 4 + ray) * 5;
                const rayGradient = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                rayGradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
                rayGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.strokeStyle = rayGradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Enhanced holy glow effect
        const glowPulse = 1 + 0.3 * Math.sin(animTime * 6);
        ctx.shadowColor = isEvolved ? '#ffd700' : bible.color;
        ctx.shadowBlur = 20 * glowPulse;

        // Multi-layer outer glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
        if (isEvolved) {
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            glowGradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.3)');
            glowGradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
        } else {
            glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
            glowGradient.addColorStop(0.5, 'rgba(255, 255, 136, 0.25)');
            glowGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        }
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Black outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(-8, -10, 16, 20);

        // Book cover with gradient
        const coverGradient = ctx.createLinearGradient(-6, 0, 6, 0);
        if (isEvolved) {
            coverGradient.addColorStop(0, '#cc8800');
            coverGradient.addColorStop(0.5, '#ffaa00');
            coverGradient.addColorStop(1, '#cc8800');
        } else {
            coverGradient.addColorStop(0, '#dddd66');
            coverGradient.addColorStop(0.5, '#ffff88');
            coverGradient.addColorStop(1, '#dddd66');
        }
        ctx.fillStyle = coverGradient;
        ctx.fillRect(-7, -9, 14, 18);

        // Pages with slight animation (flipping effect)
        const pageOffset = Math.sin(animTime * 8) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5 + pageOffset, -8, 10, 16);

        // Page lines
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 0.5;
        for (let line = 0; line < 4; line++) {
            ctx.beginPath();
            ctx.moveTo(-4 + pageOffset, -6 + line * 4);
            ctx.lineTo(4 + pageOffset, -6 + line * 4);
            ctx.stroke();
        }

        // Spine with gold trim
        ctx.fillStyle = isEvolved ? '#cc6600' : '#cccc44';
        ctx.fillRect(-1.5, -8, 3, 16);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-0.5, -8, 1, 16);

        // Ornate cross on cover
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffd700';
        // Vertical bar
        ctx.fillRect(-1, -6, 2, 8);
        // Horizontal bar
        ctx.fillRect(-3, -4, 6, 2);
        // Cross gem center
        ctx.fillStyle = isEvolved ? '#ff4444' : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Corner ornaments
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-6, -8, 2, 2);
        ctx.fillRect(4, -8, 2, 2);
        ctx.fillRect(-6, 6, 2, 2);
        ctx.fillRect(4, 6, 2, 2);

        ctx.restore();

        // Orbiting holy sparkles with varied sizes
        const sparkleTime = animTime * 3;
        for (let i = 0; i < 5; i++) {
            const sparkAngle = sparkleTime + i * (Math.PI * 2 / 5);
            const sparkR = 14 + Math.sin(sparkleTime * 2 + i * 1.5) * 4;
            const sx = x + Math.cos(sparkAngle) * sparkR;
            const sy = y + Math.sin(sparkAngle) * sparkR;
            const sparkSize = 1.5 + Math.sin(sparkleTime * 3 + i) * 0.5;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(sparkleTime * 2 + i);

            // Star-shaped sparkle
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 4;
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin(sparkleTime * 4 + i);
            ctx.beginPath();
            for (let point = 0; point < 4; point++) {
                const angle = point * Math.PI / 2;
                const outerR = sparkSize * 2;
                const innerR = sparkSize * 0.5;
                ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
                ctx.lineTo(Math.cos(angle + Math.PI / 4) * innerR, Math.sin(angle + Math.PI / 4) * innerR);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

function drawExpGems() {
    for (const gem of expGems) {
        const x = Math.floor(gem.x);
        const y = Math.floor(gem.y);

        // Determine colors based on gem value
        const isLarge = gem.value >= 5;
        const isMedium = gem.value >= 3;
        const baseColor = isLarge ? '#ff4444' : isMedium ? '#44ff44' : '#44aaff';
        const highlightColor = isLarge ? '#ff8888' : isMedium ? '#88ff88' : '#88ccff';
        const glowColor = isLarge ? 'rgba(255, 68, 68, 0.6)' : isMedium ? 'rgba(68, 255, 68, 0.6)' : 'rgba(68, 170, 255, 0.6)';

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 300 + gem.x) * 0.3 + 0.7;
        const glowSize = isLarge ? 12 : isMedium ? 10 : 8;

        // Draw glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = pulse;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw black outline
        ctx.fillStyle = '#000000';
        drawPixelRect(x - 3, y - 5, 6, 2);
        drawPixelRect(x - 4, y - 3, 8, 2);
        drawPixelRect(x - 4, y - 1, 8, 2);
        drawPixelRect(x - 3, y + 1, 6, 2);
        drawPixelRect(x - 2, y + 3, 4, 2);

        // Draw main gem body
        ctx.fillStyle = baseColor;
        drawPixelRect(x - 2, y - 4, 4, 2);
        drawPixelRect(x - 3, y - 2, 6, 2);
        drawPixelRect(x - 2, y, 4, 2);
        drawPixelRect(x - 1, y + 2, 2, 2);

        // Draw highlight
        ctx.fillStyle = highlightColor;
        drawPixelRect(x - 1, y - 3, 2, 1);
        drawPixelRect(x - 2, y - 1, 1, 1);
    }
}

function drawChests() {
    for (const chest of chests) {
        const x = Math.floor(chest.x);
        const y = Math.floor(chest.y);

        const glow = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;

        // Draw golden glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${0.5 * pulse})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.2 * pulse})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        // Draw black outline
        ctx.fillStyle = '#000000';
        drawPixelRect(x - 9, y - 7, 18, 2);
        drawPixelRect(x - 9, y - 5, 2, 12);
        drawPixelRect(x + 7, y - 5, 2, 12);
        drawPixelRect(x - 9, y + 5, 18, 2);

        // Chest body - dark wood
        ctx.fillStyle = '#5c3317';
        drawPixelRect(x - 7, y - 3, 14, 8);

        // Chest lid - lighter wood
        ctx.fillStyle = '#8B4513';
        drawPixelRect(x - 7, y - 5, 14, 3);

        // Golden trim
        ctx.fillStyle = `rgba(212, 175, 55, ${glow})`;
        drawPixelRect(x - 6, y - 6, 12, 2);
        drawPixelRect(x - 7, y - 1, 14, 2);

        // Golden lock/clasp
        ctx.fillStyle = '#FFD700';
        drawPixelRect(x - 2, y - 3, 4, 5);

        // Keyhole
        ctx.fillStyle = '#2a1a0a';
        drawPixelRect(x - 1, y - 1, 2, 2);

        // Shine effect on lid
        ctx.fillStyle = `rgba(255, 255, 200, ${0.4 * glow})`;
        drawPixelRect(x - 5, y - 5, 3, 1);
    }
}

function drawDamageNumbers() {
    for (const num of damageNumbers) {
        ctx.save();
        ctx.globalAlpha = num.alpha;

        // Enhanced damage number with scale and bounce effect
        const bounceScale = num.scale * (1 + (1 - num.alpha) * 0.3);
        const fontSize = num.isCrit ? 16 * bounceScale : 12 * bounceScale;

        ctx.font = `bold ${Math.floor(fontSize)}px sans-serif`;
        ctx.textAlign = 'center';

        // Shadow/glow for better visibility
        if (num.isCrit) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
        }

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(num.damage, num.x, num.y);

        // Fill with color based on type
        ctx.fillStyle = num.isCrit ? '#ff4444' : '#ffffff';
        ctx.fillText(num.damage, num.x, num.y);

        ctx.restore();
    }
}

function drawEffectParticles() {
    for (const p of effectParticles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'rune') {
            // Rune trail - magic symbol particles
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.size);
            ctx.lineTo(p.x + p.size * 0.5, p.y + p.size * 0.5);
            ctx.lineTo(p.x - p.size * 0.5, p.y + p.size * 0.5);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'spark') {
            // Electric spark - jagged lines
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(p.x - p.size, p.y);
            ctx.lineTo(p.x, p.y + (Math.random() - 0.5) * p.size);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.stroke();
        } else if (p.type === 'fire') {
            // Fire particle - flickering flame shape
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 10;
            // Outer flame
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.size);
            ctx.quadraticCurveTo(p.x + p.size, p.y, p.x, p.y + p.size * 0.5);
            ctx.quadraticCurveTo(p.x - p.size, p.y, p.x, p.y - p.size);
            ctx.fill();
            // Inner bright core
            ctx.fillStyle = '#ffff66';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'magic') {
            // Magic sparkle - star shape
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            const spikes = 4;
            const outerRadius = p.size;
            const innerRadius = p.size * 0.4;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI / spikes) - Math.PI / 2;
                const px = p.x + Math.cos(angle) * radius;
                const py = p.y + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            // Bright center
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'blade') {
            // Blade trail - metallic slash
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle || 0);
            // Motion blur line
            const gradient = ctx.createLinearGradient(-p.size, 0, p.size, 0);
            gradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
            gradient.addColorStop(0.5, p.color);
            gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.moveTo(-p.size, 0);
            ctx.lineTo(p.size, 0);
            ctx.stroke();
            ctx.restore();
        } else if (p.type === 'axeTrail') {
            // Axe afterimage - ghostly spinning blade
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation || 0);
            // Ghostly axe shape
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            // Blade highlight ghost
            ctx.fillStyle = 'rgba(221, 170, 102, 0.5)';
            ctx.fillRect(-p.size / 4, -p.size / 2, p.size / 2, p.size / 2);
            ctx.restore();
        } else if (p.type === 'whipCrack') {
            // Whip crack spark - elongated bright spark
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = p.color;
            // Draw elongated spark shape
            ctx.save();
            ctx.translate(p.x, p.y);
            const angle = Math.atan2(p.vy, p.vx);
            ctx.rotate(angle);
            // Spark body
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Bright core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.8, p.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (p.type === 'whipShockwave') {
            // Whip impact shockwave - expanding ring
            const progress = 1 - (p.lifetime / p.maxLifetime);
            const radius = p.size + progress * 25;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3 - progress * 2;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15 * (1 - progress);
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            // Inner brighter ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.type === 'whipTrail') {
            // Whip motion trail - soft glowing line segment
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            // Highlight dot
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = p.alpha * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'garlicSpore') {
            // Garlic spore - floating pollen/spore particle
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            // Outer glow
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Main body
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            // Bright center
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = p.alpha * 0.7;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'garlicWave') {
            // Garlic repelling wave - arc wave effect
            const progress = 1 - (p.lifetime / p.maxLifetime);
            const radius = p.size + progress * 40;
            const arcSpread = Math.PI * 0.4;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 4 - progress * 3;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12 * (1 - progress);
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, p.angle - arcSpread, p.angle + arcSpread);
            ctx.stroke();
        } else {
            // Default circle particle
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function drawLightningChains() {
    for (const chain of lightningChains) {
        ctx.save();
        ctx.globalAlpha = chain.alpha;

        // Outer glow
        ctx.shadowColor = chain.color;
        ctx.shadowBlur = 15;

        // Draw chain segments
        ctx.strokeStyle = chain.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const seg of chain.segments) {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();

        // Inner bright core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const seg of chain.segments) {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();

        ctx.restore();
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
            const type = weapon.evolved ? EVOLVED_WEAPONS[weapon.evolvedId] :
                         weapon.unioned ? UNION_WEAPONS[weapon.unionId] : weaponType;

            // Check if evolution is ready
            const evolutionReady = !weapon.evolved && !weapon.unioned && weapon.level >= weapon.maxLevel &&
                player.passives.some(p => p.id === weaponType.requiresPassive);

            // Check if Union is ready
            const unionReady = checkForUnionPossibility(weapon) !== null;

            // Border color based on state
            if (weapon.unioned) {
                // Unioned weapon - cyan glow with rainbow pulse
                const hue = (Date.now() / 20) % 360;
                ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.lineWidth = 2;
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowBlur = 10;
            } else if (weapon.evolved) {
                // Evolved weapon - purple glow
                ctx.strokeStyle = '#ff44ff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ff44ff';
                ctx.shadowBlur = 8;
            } else if (unionReady) {
                // Union ready - cyan pulsing
                const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 12 * pulse;
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
            ctx.fillStyle = weapon.unioned ? '#00ffff' : weapon.evolved ? '#ff44ff' : 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(x + slotSize - 12, startY + slotSize - 12, 12, 12);

            // Level text
            ctx.font = 'bold 8px sans-serif';
            ctx.fillStyle = weapon.unioned ? '#000' : weapon.evolved ? '#fff' : '#ffd700';
            const levelText = weapon.unioned ? 'U' : weapon.evolved ? 'E' : weapon.level;
            ctx.fillText(levelText, x + slotSize - 6, startY + slotSize - 5);

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

// Draw pixel rectangle with outline for better visibility
function drawPixelRectOutline(x, y, width, height, outlineColor = '#000000', outlineWidth = 1) {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    ctx.fillRect(fx, fy, width, height);
    // Draw outline
    const prevStyle = ctx.fillStyle;
    ctx.fillStyle = outlineColor;
    // Top
    ctx.fillRect(fx - outlineWidth, fy - outlineWidth, width + outlineWidth * 2, outlineWidth);
    // Bottom
    ctx.fillRect(fx - outlineWidth, fy + height, width + outlineWidth * 2, outlineWidth);
    // Left
    ctx.fillRect(fx - outlineWidth, fy, outlineWidth, height);
    // Right
    ctx.fillRect(fx + width, fy, outlineWidth, height);
    ctx.fillStyle = prevStyle;
}

// Draw a glowing circle effect
function drawGlow(x, y, radius, color, intensity = 0.3) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color.replace(')', `, ${intensity})`).replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw pixel outline around a shape (for character visibility)
function drawCharacterOutline(x, y, color = '#000000') {
    ctx.fillStyle = color;
    // Simple character silhouette outline (1px bigger all around)
    // Head outline
    drawPixelRect(x - 4, y - 10, 8, 1); // top
    drawPixelRect(x - 4, y - 3, 8, 1);  // bottom of head
    drawPixelRect(x - 4, y - 9, 1, 7);  // left
    drawPixelRect(x + 3, y - 9, 1, 7);  // right
    // Body outline
    drawPixelRect(x - 5, y - 3, 10, 1); // top of body
    drawPixelRect(x - 5, y + 6, 10, 1); // bottom of body
    drawPixelRect(x - 5, y - 2, 1, 8);  // left
    drawPixelRect(x + 4, y - 2, 1, 8);  // right
    // Arms outline
    drawPixelRect(x - 7, y - 2, 1, 8);
    drawPixelRect(x + 6, y - 2, 1, 8);
    // Legs outline
    drawPixelRect(x - 4, y + 6, 8, 1);
    drawPixelRect(x - 4, y + 10, 8, 1);
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
            case 'evolution':
                // Epic ascending fanfare for weapon evolution
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);        // A4
                oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1);  // C#5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);  // E5
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);  // A5
                oscillator.frequency.setValueAtTime(1109, audioContext.currentTime + 0.4); // C#6
                gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
                break;
            case 'union':
                // Powerful dual-tone fanfare for Union (two weapons becoming one)
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(330, audioContext.currentTime);        // E4
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.08); // A4
                oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.16);// C#5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.24);// E5
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.32);// A5
                oscillator.frequency.setValueAtTime(1109, audioContext.currentTime + 0.4);// C#6
                oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.5);// E6
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.8);
                break;
            case 'chest':
                // Sparkling treasure sound
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime);       // C6
                oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.05);// E6
                oscillator.frequency.setValueAtTime(1568, audioContext.currentTime + 0.1); // G6
                oscillator.frequency.setValueAtTime(2093, audioContext.currentTime + 0.15);// C7
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.25);
                break;
            case 'victory':
                // Triumphant victory fanfare
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);        // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3);  // G5
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.45);// C6
                oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.6); // E6
                oscillator.frequency.setValueAtTime(1568, audioContext.currentTime + 0.75);// G6
                oscillator.frequency.setValueAtTime(2093, audioContext.currentTime + 0.9); // C7
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.22, audioContext.currentTime + 0.5);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1.2);
                break;
            case 'achievement':
                // Achievement unlock sound - magical chime with sparkle
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);         // A5
                oscillator.frequency.setValueAtTime(1109, audioContext.currentTime + 0.08); // C#6
                oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.16); // E6
                oscillator.frequency.setValueAtTime(1760, audioContext.currentTime + 0.24); // A6
                gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.16);
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
