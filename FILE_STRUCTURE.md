# 1v1 Autobattler - File Structure (Refactored)

## Directory Structure

```
web_game/
├── index.html                      # Main HTML file
├── REFACTORING_GUIDE.md           # Detailed refactoring documentation
├── FILE_STRUCTURE.md              # This file
│
├── css/
│   └── styles.css                 # All game styling
│
├── js/
│   ├── config/                    # Configuration and data
│   │   ├── gameConfig.js         # Game constants and state initialization
│   │   └── unitDefinitions.js    # All unit stat definitions
│   │
│   ├── utils/                     # Utility functions (NEW)
│   │   └── MathUtils.js          # Math helpers (distance, angles, normalize)
│   │
│   ├── classes/                   # Core game classes
│   │   └── Unit.js               # Unit class with behavior system
│   │
│   ├── systems/                   # Game systems
│   │   ├── BattleContext.js      # Context helper for battle queries (NEW)
│   │   ├── BattleSystem.js       # Main battle coordinator (NEW)
│   │   ├── MovementSystem.js     # Movement logic (NEW)
│   │   ├── ProjectileSystem.js   # Projectile management (NEW)
│   │   ├── CombatSystem.js       # Combat and damage calculations (NEW)
│   │   ├── StatsManager.js       # Stats balancing system (NEW)
│   │   ├── economy.js            # Gold generation and management
│   │   ├── spawning.js           # Unit spawning and placement
│   │   ├── ai.js                 # AI unit purchasing (refactored)
│   │   │
│   │   ├── behaviors/            # Unit behavior classes (NEW)
│   │   │   ├── UnitBehavior.js  # Base behavior interface
│   │   │   ├── MeleeBehavior.js # Melee unit behavior
│   │   │   ├── RangedBehavior.js# Ranged unit behavior
│   │   │   ├── CasterBehavior.js# Caster unit behavior
│   │   │   └── HealerBehavior.js# Healer unit behavior
│   │   │
│   │   └── ai/                   # AI strategies (NEW)
│   │       ├── AIStrategy.js     # Base AI strategy interface
│   │       ├── RandomAIStrategy.js   # Random purchases
│   │       ├── BalancedAIStrategy.js # Balanced composition
│   │       └── AggressiveAIStrategy.js # Aggressive rush
│   │
│   ├── ui/                       # UI management
│   │   ├── rendering.js          # Unit element creation
│   │   └── uiManager.js          # UI updates and events
│   │
│   └── main.js                   # Main game loop
│
└── *.old files                    # Backed up old files
    ├── game.js.old               # Old monolithic game file
    ├── units.js.old              # Old duplicate definitions
    └── battle.js.old             # Old large battle system (607 lines)
```

## Key Refactoring Improvements

### Before
- **battle.js**: 607 lines (monolithic)
- **game.js**: 577 lines (duplicate functionality)
- Hard to extend or modify
- Mixed responsibilities

### After
- **BattleSystem.js**: 92 lines (coordinator)
- **MovementSystem.js**: Movement only
- **ProjectileSystem.js**: Projectiles only
- **CombatSystem.js**: Combat only
- **4 Behavior classes**: Unit AI separated by type
- **3 AI strategies**: Pluggable AI difficulty

## Quick Reference

### Where to Look For...
- **Unit movement issues**: MovementSystem.js + Unit's behavior class
- **Damage calculations**: CombatSystem.js
- **AI buying poorly**: Check AIStrategy in gameConfig.js
- **Balance units**: StatsManager.js or unitDefinitions.js
- **Add new unit type**: unitDefinitions.js + new Behavior class
- **Change AI difficulty**: uiManager.js (change strategy)

See [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) for detailed documentation.
