# Web Game - Refactored Architecture

## Overview
This project has been refactored into a modular, extensible architecture that makes it easy to:
- Add new unit types
- Control and balance unit stats
- Add new AI strategies
- Extend combat behaviors

## Project Structure

```
web_game/
├── index.html                      # Main HTML file with updated script loading order
├── css/
│   └── styles.css                  # Game styling
├── js/
│   ├── config/                     # Configuration files
│   │   ├── gameConfig.js          # Game constants and state initialization
│   │   └── unitDefinitions.js     # Unit stat definitions
│   │
│   ├── utils/                      # Utility functions
│   │   └── MathUtils.js           # Math helper functions (distance, angles, etc.)
│   │
│   ├── classes/                    # Core classes
│   │   └── Unit.js                # Unit class with behavior system integration
│   │
│   ├── systems/                    # Game systems
│   │   ├── BattleContext.js       # Battle context helper (provides unit lists)
│   │   ├── BattleSystem.js        # Main battle coordinator (NEW - replaces old battle.js)
│   │   ├── MovementSystem.js      # Unit movement logic (NEW)
│   │   ├── ProjectileSystem.js    # Projectile management (NEW)
│   │   ├── CombatSystem.js        # Combat and damage logic (NEW)
│   │   ├── StatsManager.js        # Stats balancing system (NEW)
│   │   ├── economy.js             # Gold and economy management
│   │   ├── spawning.js            # Unit spawning logic
│   │   ├── ai.js                  # AI unit purchasing (refactored to use strategies)
│   │   │
│   │   ├── behaviors/             # Unit behavior classes (NEW)
│   │   │   ├── UnitBehavior.js    # Base behavior interface
│   │   │   ├── MeleeBehavior.js   # Melee unit AI
│   │   │   ├── RangedBehavior.js  # Ranged unit AI
│   │   │   ├── CasterBehavior.js  # Caster unit AI
│   │   │   └── HealerBehavior.js  # Healer unit AI
│   │   │
│   │   └── ai/                    # AI strategies (NEW)
│   │       ├── AIStrategy.js      # Base AI strategy interface
│   │       ├── RandomAIStrategy.js        # Random unit purchases
│   │       ├── BalancedAIStrategy.js      # Balanced composition AI
│   │       └── AggressiveAIStrategy.js    # Aggressive rush AI
│   │
│   └── ui/                        # UI management
│       ├── rendering.js           # Unit rendering
│       └── uiManager.js           # UI updates and event listeners

```

## Key Refactoring Changes

### 1. **Modular Battle System**
The large `battle.js` (607 lines) has been split into focused modules:
- **BattleSystem.js**: Main coordinator (92 lines)
- **MovementSystem.js**: All movement logic
- **ProjectileSystem.js**: Projectile management
- **CombatSystem.js**: Combat calculations

### 2. **Behavior Pattern for Units**
Each unit type now has its own behavior class:
- Easy to add new unit types - just create a new behavior
- Behaviors are self-contained and testable
- Separation of concerns - unit data vs. unit AI

### 3. **Strategy Pattern for AI**
AI decision-making is now pluggable:
- **BalancedAIStrategy**: Maintains unit composition balance
- **RandomAIStrategy**: Random purchases (easy mode)
- **AggressiveAIStrategy**: Rush strategy with cheap units

To change AI difficulty, modify in `uiManager.js`:
```javascript
gameState.aiStrategy = new BalancedAIStrategy('hard');
// or
gameState.aiStrategy = new AggressiveAIStrategy();
```

### 4. **Stats Manager**
Centralized stat control for easy balancing:
- Tier multipliers
- Type modifiers
- Global multipliers for quick balance adjustments

Example usage:
```javascript
// Boost all damage by 20%
StatsManager.setGlobalMultiplier('damage', 1.2);

// Get modified stats for a unit
const stats = StatsManager.getUnitStats('ranged', 2);
```

## How to Extend

### Adding a New Unit Type

1. **Add unit definition** in `unitDefinitions.js`:
```javascript
newType1: {
    name: 'New Type T1',
    type: 'newtype',
    tier: 1,
    cost: 20,
    hp: 100,
    // ... other stats
}
```

2. **Create behavior class** in `js/systems/behaviors/NewTypeBehavior.js`:
```javascript
class NewTypeBehavior extends UnitBehavior {
    update(deltaTime, currentTime, battleContext) {
        // Your unit AI logic
    }
    
    findTarget(battleContext) {
        // Target selection logic
    }
}
```

3. **Register behavior** in `Unit.js` `createBehavior()` method:
```javascript
case 'newtype':
    return new NewTypeBehavior(this);
```

### Adding a New AI Strategy

1. **Create strategy class** in `js/systems/ai/YourStrategy.js`:
```javascript
class YourStrategy extends AIStrategy {
    selectUnits(availableGold, unlockedTiers) {
        // Return unit definition to purchase
    }
    
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        // Return true/false to unlock tier
    }
    
    getPurchaseChance() {
        // Return 0.0-1.0 purchase chance per frame
    }
}
```

2. **Use it** in `uiManager.js`:
```javascript
gameState.aiStrategy = new YourStrategy();
```

### Modifying Unit Stats

**Quick balance changes:**
```javascript
// In gameConfig.js or at runtime
StatsManager.setGlobalMultiplier('hp', 1.5);      // +50% all HP
StatsManager.setGlobalMultiplier('damage', 0.8);  // -20% all damage
```

**Tier-specific changes:**
```javascript
// In StatsManager.js
tierMultipliers: {
    1: { hp: 1.0, damage: 1.0, speed: 1.0 },
    2: { hp: 2.5, damage: 2.5, speed: 1.2 },  // Buff tier 2
    3: { hp: 4.0, damage: 4.0, speed: 1.3 }
}
```

**Type-specific changes:**
```javascript
// In StatsManager.js
typeModifiers: {
    melee: { hp: 3.0, damage: 0.5, ... },  // Tankier melee
    ranged: { hp: 0.5, damage: 3.5, ... }  // Glass cannon ranged
}
```

## Benefits of New Architecture

### For Development
- **Smaller files**: Easier to navigate and understand
- **Single responsibility**: Each module has one job
- **Testable**: Systems can be tested independently
- **Extensible**: Easy to add features without breaking existing code

### For Future Features
- **More units**: Just add definition + behavior class
- **Better stat control**: StatsManager provides centralized balancing
- **AI variety**: Multiple strategies for different difficulty levels
- **New mechanics**: Easy to add new systems (shields, buffs, etc.)

### Performance
- Modular code is easier to optimize
- Behavior pattern reduces conditional checks
- Clean separation makes profiling easier

## Migration Notes

### Old Files (backed up with .old extension)
- `game.js.old` - Old monolithic game file
- `units.js.old` - Duplicate unit definitions
- `battle.js.old` - Old 607-line battle system

These files have been preserved but are no longer used.

### Script Load Order
The `index.html` now loads scripts in dependency order:
1. Config files
2. Utilities
3. Core systems
4. Behaviors
5. AI strategies
6. Game systems
7. UI

## Testing After Refactor

Test these scenarios:
- [ ] Units spawn and move correctly
- [ ] Combat damage works (melee, ranged, caster, healer)
- [ ] Projectiles fire and hit targets
- [ ] AI purchases units
- [ ] Target lines display
- [ ] Round timer works
- [ ] Game over detection

## Future Enhancements

Now that the code is modular, these features are easier to add:

1. **New unit types**: 
   - Tank (high HP, low damage, taunts)
   - Assassin (high damage, targets backline)
   - Buffer (increases ally stats)

2. **Advanced AI**:
   - Counter-composition AI
   - Economic AI (invests in economy upgrades)
   - Adaptive AI (changes strategy based on player)

3. **Stat modifiers**:
   - Armor/penetration
   - Critical hits
   - Status effects (slow, stun, etc.)

4. **Better stats control**:
   - Unit upgrade system
   - Tech tree unlocks
   - Dynamic stat scaling

## Questions?

The modular structure makes it clear where to look:
- **Unit not moving?** → Check MovementSystem.js and the unit's behavior
- **Damage wrong?** → Check CombatSystem.js
- **AI buying poorly?** → Check the AIStrategy in use
- **Need to balance?** → Check StatsManager.js
