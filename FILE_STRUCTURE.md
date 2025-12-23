# 1v1 Autobattler - File Structure

## Directory Structure

```
web_game/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
└── js/
    ├── config/
    │   ├── gameConfig.js   # Game constants and state initialization
    │   └── unitDefinitions.js  # Unit stats definitions
    ├── classes/
    │   └── Unit.js         # Unit class definition
    ├── systems/
    │   ├── ai.js           # AI decision making and purchasing
    │   ├── battle.js       # Combat, movement, projectiles
    │   ├── economy.js      # Gold generation and rewards
    │   └── spawning.js     # Unit placement and round management
    ├── ui/
    │   ├── rendering.js    # Visual element creation
    │   └── uiManager.js    # UI updates and event handlers
    └── main.js             # Game loop and initialization
```

## File Responsibilities

### Configuration
- **gameConfig.js**: Contains all game constants (gold rates, costs, timings) and initializes game state
- **unitDefinitions.js**: Defines all unit types with their stats

### Classes
- **Unit.js**: Unit class with health, damage, attack methods

### Systems
- **economy.js**: Handles passive gold, kill rewards, round bonuses, tier unlocking
- **spawning.js**: Unit placement in build zones, cloning units to battle
- **ai.js**: AI purchasing logic and tier unlocking decisions
- **battle.js**: Combat mechanics, movement, projectiles, AOE, target lines

### UI
- **rendering.js**: Creates visual DOM elements for units
- **uiManager.js**: Updates UI text, handles button clicks and user input

### Main
- **main.js**: Game loop, initialization, cleanup routines

## Load Order
Scripts must be loaded in this order (as specified in index.html):
1. gameConfig.js (state and constants)
2. unitDefinitions.js (unit data)
3. Unit.js (class definition)
4. rendering.js (needs Unit)
5. economy.js (needs gameConfig)
6. spawning.js (needs Unit, rendering, economy)
7. ai.js (needs Unit, unitDefinitions, spawning)
8. battle.js (needs Unit, economy, DOM references)
9. uiManager.js (needs economy, spawning)
10. main.js (needs everything)
