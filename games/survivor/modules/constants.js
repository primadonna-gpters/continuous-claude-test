// Pixel Survivor - Game Constants
// This module contains all constant definitions used across the game

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
const WORLD_SIZE = 2000;

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
    },
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
    },
    // Union weapons
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
    },
    mannajja: {
        name: 'Mannajja',
        desc: 'Evolved Song of Mana - Massive vertical beams',
        icon: '⚔️',
        damageMultiplier: 2.0,
        areaMultiplier: 1.5
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
