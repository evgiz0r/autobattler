// Game configuration and constants
const GAME_CONFIG = {
    STARTING_GOLD: 50,
    STARTING_HEALTH: 1000,
    ROUND_DURATION: 10, // seconds
    MAX_UNITS_PER_ZONE: 999, // Essentially unlimited
    MIN_UNIT_DISTANCE: 25,
    TIER_2_UNLOCK_COST: 80,
    TIER_3_UNLOCK_COST: 150,
    TIER_4_UNLOCK_COST: 250,
    TIER_5_UNLOCK_COST: 400,
    TIER_6_UNLOCK_COST: 650,
    TIER_7_UNLOCK_COST: 1000,
    PASSIVE_GOLD_INTERVAL: 1000, // ms - 1 gold per second
    PASSIVE_GOLD_AMOUNT: 1,
    ROUND_GOLD_BASE: 8,
    ROUND_GOLD_PER_ROUND: 2,
    KILL_GOLD_BASE: 1,
    KILL_GOLD_PER_TIER: 1,
    AI_BUY_CHANCE: 0.01, // per frame
    PROJECTILE_SPEED: 200,
    PROJECTILE_MAX_AGE: 5000, // ms
    BASE_DAMAGE_TO_CORE: 5,
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
        unlockedTiers: [1],
        economyLevel: 0 // Economy upgrade level (0-3)
    },
    ai: {
        health: GAME_CONFIG.STARTING_HEALTH,
        gold: GAME_CONFIG.STARTING_GOLD,
        unlockedTiers: [1]
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
    aiStrategy: null, // Will be initialized in init()
    difficulty: 'MEDIUM', // Current difficulty: 'EASY', 'MEDIUM', or 'HARD'
    isAIvsAI: false // AI vs AI mode
};

// DOM element references
const DOM = {
    playerZone: null,
    battleZone: null,
    aiZone: null
};
