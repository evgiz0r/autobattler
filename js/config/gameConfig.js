// Game configuration and constants
const GAME_CONFIG = {
    STARTING_GOLD: 50,
    STARTING_HEALTH: 100,
    ROUND_DURATION: 10, // seconds
    MAX_UNITS_PER_ZONE: 999, // Essentially unlimited
    MIN_UNIT_DISTANCE: 25,
    UPGRADE_HP_MULTIPLIER: 1.05, // 105% HP per upgrade (5% increase)
    UPGRADE_DAMAGE_MULTIPLIER: 1.05, // 105% damage per upgrade (5% increase)
    UPGRADE_COOLDOWN_MULTIPLIER: 0.95, // 5% faster attacks per upgrade
    UPGRADE_AOE_MULTIPLIER: 1.05, // 5% larger AoE per upgrade
    MAX_AOE_MULTIPLIER: 2.0, // Cap AoE at 2x base size
    MIN_COOLDOWN_MULTIPLIER: 0.5, // Cap attack speed at 2x faster (50% of base cooldown)
    PASSIVE_GOLD_INTERVAL: 1000, // ms - 1 gold per second
    PASSIVE_GOLD_AMOUNT: 1,
    ROUND_GOLD_BASE: 8,
    ROUND_GOLD_PER_ROUND: 2,
    KILL_GOLD_BASE: 1,
    KILL_GOLD_PER_TIER: 2,
    AI_BUY_CHANCE: 0.015, // per frame - base chance
    AI_BUY_CHANCE_PER_ROUND: 0.002, // additional chance per round (gets more aggressive)
    PROJECTILE_SPEED: 200,
    PROJECTILE_MAX_AGE: 5000, // ms
    BASE_DAMAGE_TO_CORE: 1,
    DIFFICULTY: {
        EASY: { name: 'Easy', multiplier: 0.8 },
        MEDIUM: { name: 'Medium', multiplier: 1.0 },
        HARD: { name: 'Hard', multiplier: 1.2 }
    }
};

// Game state initialization
const gameState = {
    player: {
        health: GAME_CONFIG.STARTING_HEALTH,
        gold: GAME_CONFIG.STARTING_GOLD,
        upgradeLevels: { melee: 0, ranged: 0, caster: 0, healer: 0 },
        economyLevel: 0,
        livesLost: 0
    },
    ai: {
        health: GAME_CONFIG.STARTING_HEALTH,
        gold: GAME_CONFIG.STARTING_GOLD,
        upgradeLevels: { melee: 0, ranged: 0, caster: 0, healer: 0 },
        livesLost: 0
    },
    round: 0,
    roundTimer: GAME_CONFIG.ROUND_DURATION,
    isRoundActive: false,
    units: [],
    projectiles: [],
    lastUpdateTime: 0,
    selectedUnitType: null,
    passiveGoldTimer: 0,
    isPaused: false,
    showTargetLines: true,
    cursorPreview: null,
    firstUnitPlaced: false,
    aiStrategy: null,
    difficulty: 'MEDIUM',
    isAIvsAI: false, // AI vs AI mode
    infiniteMode: false // Infinite mode - game doesn't end when lives reach 0
};

// DOM element references
const DOM = {
    playerZone: null,
    battleZone: null,
    aiZone: null
};
