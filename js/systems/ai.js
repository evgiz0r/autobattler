// AI system - handles AI decision making and unit purchasing with strategy selection

// AI Strategies
const AI_STRATEGIES = {
    SPAM_ONLY: {
        name: 'The Swarm',
        upgradeChance: 0.05, // Upgrades occasionally to spend excess gold
        preferredUnit: null, // Random selection
        description: 'Builds units non-stop, upgrades rarely'
    },
    AGGRESSIVE_UPGRADE: {
        name: 'The Perfectionist',
        upgradeChance: 0.2,
        preferredUnit: null,
        description: 'Upgrades aggressively whenever possible'
    },
    RANGED_SPECIALIST: {
        name: 'The Sniper',
        upgradeChance: 0.25,
        preferredUnit: 'ranged',
        preferredUpgradeChance: 0.75, // Very aggressive upgrade for favorite
        description: 'Upgrades ranged units and builds them almost exclusively'
    },
    MELEE_SPECIALIST: {
        name: 'The Juggernaut',
        upgradeChance: 0.15,
        preferredUnit: 'melee',
        preferredUpgradeChance: 0.6, // Higher chance to upgrade favorite
        description: 'Upgrades melee units and builds them almost exclusively'
    },
    CASTER_SPECIALIST: {
        name: 'The Archmage',
        upgradeChance: 0.2,
        preferredUnit: 'caster',
        preferredUpgradeChance: 0.7,
        secondaryUnit: 'melee',
        secondaryChance: 0.3, // 30% chance to build melee, 70% caster
        description: 'Focuses on casters with some melee support'
    },
    SUPPORT_SPECIALIST: {
        name: 'The Guardian',
        upgradeChance: 0.18,
        preferredUnit: 'healer',
        preferredUpgradeChance: 0.65,
        secondaryUnit: 'caster',
        secondaryChance: 0.4, // Mix of healer and caster
        meleeFrontline: true, // Always ensures at least 1 melee in front
        description: 'Healer and caster focus with melee frontline protection'
    },
    NOOB: {
        name: 'The Noob',
        upgradeChance: 0.02, // Rarely upgrades (2%)
        preferredUnit: 'melee', // Mostly builds melee (bad strategy)
        preferredChance: 0.7, // 70% melee, 30% random
        buyChanceMultiplier: 0.3, // Buys 3x less frequently
        badPlacement: true, // Places units randomly without strategy
        description: 'Plays poorly - bad placement, rarely upgrades, slow spending'
    }
};

function initializeAIStrategy(forceStrategy = null) {
    const strategies = Object.keys(AI_STRATEGIES);
    let chosenKey;
    
    if (forceStrategy && AI_STRATEGIES[forceStrategy]) {
        chosenKey = forceStrategy;
    } else {
        chosenKey = strategies[Math.floor(Math.random() * strategies.length)];
    }
    
    const strategy = AI_STRATEGIES[chosenKey];
    
    gameState.ai.strategy = {
        key: chosenKey,
        ...strategy
    };
    
    console.log(`AI Strategy: ${strategy.name} - ${strategy.description}`);
    return strategy;
}

function initializePlayerAIStrategy(forceStrategy = null) {
    const strategies = Object.keys(AI_STRATEGIES);
    let chosenKey;
    
    if (forceStrategy && AI_STRATEGIES[forceStrategy]) {
        chosenKey = forceStrategy;
    } else {
        chosenKey = strategies[Math.floor(Math.random() * strategies.length)];
    }
    
    const strategy = AI_STRATEGIES[chosenKey];
    
    gameState.player.strategy = {
        key: chosenKey,
        ...strategy
    };
    
    console.log(`Player AI Strategy: ${strategy.name} - ${strategy.description}`);
    return strategy;
}

function aiPurchaseUnits() {
    // Check AI unit count
    const aiTemplateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.aiZone
    );
    
    const boardIsFull = aiTemplateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE;
    
    // Get AI strategy
    const strategy = gameState.ai.strategy || initializeAIStrategy();
    
    // The Noob buys less frequently
    if (strategy.buyChanceMultiplier && Math.random() > strategy.buyChanceMultiplier) {
        return;
    }
    
    // Aggressive upgrading when gold is high or board is full
    const goldAmount = gameState.ai.gold;
    let upgradeAttempts = 1;
    
    // Scale upgrade attempts based on gold and board state
    if (goldAmount > 500 || boardIsFull) {
        upgradeAttempts = Math.floor(goldAmount / 200); // More attempts with more gold
        upgradeAttempts = Math.min(upgradeAttempts, 10); // Cap at 10 attempts
    }
    
    // Try multiple upgrades if we have lots of gold
    for (let i = 0; i < upgradeAttempts; i++) {
        const shouldUpgrade = boardIsFull || Math.random() < strategy.upgradeChance;
        if (shouldUpgrade) {
            tryAIUpgrade(strategy);
        }
    }
    
    // Don't try to buy units if board is full
    if (boardIsFull) return;
    
    // Select unit type based on strategy
    let unitType;
    
    // Special handling for Guardian strategy (always ensure 1 melee)
    if (strategy.meleeFrontline) {
        const meleeCount = aiTemplateUnits.filter(u => u.type === 'melee').length;
        if (meleeCount === 0) {
            unitType = 'melee';
        }
    }
    
    // If not forced to build melee, use normal selection
    if (!unitType) {
        if (strategy.preferredUnit) {
            // Check if strategy has secondary unit logic
            if (strategy.secondaryUnit) {
                // secondaryChance is the chance to build the secondary unit
                // e.g., 0.3 = 30% secondary, 70% preferred
                if (Math.random() < strategy.secondaryChance) {
                    unitType = strategy.secondaryUnit;
                } else {
                    unitType = strategy.preferredUnit;
                }
            } else {
                // 80% preferred unit, 20% random
                if (Math.random() < 0.8) {
                    unitType = strategy.preferredUnit;
                } else {
                    const types = ['melee', 'ranged', 'caster', 'healer'];
                    unitType = types[Math.floor(Math.random() * types.length)];
                }
            }
        } else {
            // Random selection from all 4 units
            const types = ['melee', 'ranged', 'caster', 'healer'];
            unitType = types[Math.floor(Math.random() * types.length)];
        }
    }
    
    const definition = UNIT_DEFINITIONS[unitType];
    
    if (!definition || gameState.ai.gold < definition.cost) return;
    
    // Determine position based on unit type (or random for Noob)
    const { xPos, yPos } = getAIUnitPosition(definition.type, aiTemplateUnits, strategy);
    
    if (xPos === null || yPos === null) return;
    
    // Purchase and place unit
    gameState.ai.gold -= definition.cost;
    const aiUnit = new Unit(definition, 'ai', xPos, yPos);
    gameState.units.push(aiUnit);
    createUnitElement(aiUnit, DOM.aiZone);
}

function tryAIUpgrade(strategy) {
    let typeToUpgrade;
    let isPreferredUpgrade = false;
    
    if (strategy.preferredUnit && Math.random() < 0.8) {
        // 80% chance to upgrade preferred unit if strategy has one
        typeToUpgrade = strategy.preferredUnit;
        isPreferredUpgrade = true;
    } else {
        // Random unit selection
        const types = ['melee', 'ranged', 'caster', 'healer'];
        typeToUpgrade = types[Math.floor(Math.random() * types.length)];
    }
    
    const definition = UNIT_DEFINITIONS[typeToUpgrade];
    const upgradeLevel = gameState.ai.upgradeLevels[typeToUpgrade] || 0;
    const upgradeCost = ShopManager.getUpgradeCost(typeToUpgrade, upgradeLevel);
    
    // Use higher upgrade chance for preferred unit if applicable
    const effectiveChance = isPreferredUpgrade && strategy.preferredUpgradeChance 
        ? strategy.preferredUpgradeChance 
        : 1.0; // Always upgrade if we decided to try
    
    if (gameState.ai.gold >= upgradeCost && Math.random() < effectiveChance) {
        gameState.ai.gold -= upgradeCost;
        gameState.ai.upgradeLevels[typeToUpgrade]++;
        console.log(`AI upgraded ${typeToUpgrade} to level ${gameState.ai.upgradeLevels[typeToUpgrade]} for ${upgradeCost}g`);
        
        // Update AI shop display
        if (window.updateUpgradeButtons) {
            updateUpgradeButtons();
        }
    }
}

function getAIUnitPosition(unitType, existingUnits, strategy = null) {
    // The Noob places units randomly without strategy
    if (strategy && strategy.badPlacement) {
        const width = DOM.aiZone.offsetWidth;
        const height = DOM.aiZone.offsetHeight;
        
        // Try to find a valid position anywhere in the zone
        for (let attempt = 0; attempt < 30; attempt++) {
            const xPos = Math.random() * (width - 50) + 25;
            const yPos = Math.random() * (height - 50) + 25;
            
            // Check collision
            let hasCollision = false;
            for (let existing of existingUnits) {
                const dist = Math.sqrt(
                    Math.pow(existing.x - xPos, 2) + 
                    Math.pow(existing.y - yPos, 2)
                );
                if (dist < GAME_CONFIG.MIN_UNIT_DISTANCE) {
                    hasCollision = true;
                    break;
                }
            }
            
            if (!hasCollision) {
                return { xPos, yPos };
            }
        }
        
        return { xPos: null, yPos: null };
    }
    
    // Normal strategic placement
    let xMin, xMax;
    const width = DOM.aiZone.offsetWidth;
    
    if (unitType === 'melee') {
        xMin = 25;
        xMax = width * 0.33;
    } else if (unitType === 'ranged') {
        xMin = width * 0.33;
        xMax = width * 0.66;
    } else {
        xMin = width * 0.66;
        xMax = width - 25;
    }
    
    // Try to find a valid position
    for (let attempt = 0; attempt < 30; attempt++) {
        const xPos = Math.random() * (xMax - xMin) + xMin;
        const yPos = Math.random() * (DOM.aiZone.offsetHeight - 50) + 25;
        
        // Check collision
        let hasCollision = false;
        for (let existing of existingUnits) {
            const dist = Math.sqrt(
                Math.pow(existing.x - xPos, 2) + 
                Math.pow(existing.y - yPos, 2)
            );
            if (dist < GAME_CONFIG.MIN_UNIT_DISTANCE) {
                hasCollision = true;
                break;
            }
        }
        
        if (!hasCollision) {
            return { xPos, yPos };
        }
    }
    
    return { xPos: null, yPos: null };
}

function playerAIPurchaseUnits() {
    // AI purchasing for player side in AI vs AI mode
    const playerTemplateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.playerZone
    );
    
    const boardIsFull = playerTemplateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE;
    
    // Use player's own strategy
    const strategy = gameState.player.strategy || gameState.ai.strategy || initializeAIStrategy();
    
    // Aggressive upgrading when gold is high or board is full
    const goldAmount = gameState.player.gold;
    let upgradeAttempts = 1;
    
    // Scale upgrade attempts based on gold and board state
    if (goldAmount > 500 || boardIsFull) {
        upgradeAttempts = Math.floor(goldAmount / 200); // More attempts with more gold
        upgradeAttempts = Math.min(upgradeAttempts, 10); // Cap at 10 attempts
    }
    
    // Try multiple upgrades if we have lots of gold
    for (let i = 0; i < upgradeAttempts; i++) {
        const shouldUpgrade = boardIsFull || Math.random() < strategy.upgradeChance;
        if (shouldUpgrade) {
            tryPlayerAIUpgrade(strategy);
        }
    }
    
    // Don't try to buy units if board is full
    if (boardIsFull) return;
    
    // Select unit type based on strategy
    let unitType;
    
    // Special handling for Guardian strategy (always ensure 1 melee)
    if (strategy.meleeFrontline) {
        const meleeCount = playerTemplateUnits.filter(u => u.type === 'melee').length;
        if (meleeCount === 0) {
            unitType = 'melee';
        }
    }
    
    // If not forced to build melee, use normal selection
    if (!unitType) {
        if (strategy.preferredUnit) {
            // Check if strategy has secondary unit logic
            if (strategy.secondaryUnit) {
                // secondaryChance is the chance to build the secondary unit
                // e.g., 0.3 = 30% secondary, 70% preferred
                if (Math.random() < strategy.secondaryChance) {
                    unitType = strategy.secondaryUnit;
                } else {
                    unitType = strategy.preferredUnit;
                }
            } else if (strategy.preferredChance) {
                // Noob-style: mostly preferred, rest random
                if (Math.random() < strategy.preferredChance) {
                    unitType = strategy.preferredUnit;
                } else {
                    const types = ['melee', 'ranged', 'caster', 'healer'];
                    unitType = types[Math.floor(Math.random() * types.length)];
                }
            } else {
                // 80% preferred unit, 20% random
                if (Math.random() < 0.8) {
                    unitType = strategy.preferredUnit;
                } else {
                    const types = ['melee', 'ranged', 'caster', 'healer'];
                    unitType = types[Math.floor(Math.random() * types.length)];
                }
            }
        } else {
            // Random selection from all 4 units
            const types = ['melee', 'ranged', 'caster', 'healer'];
            unitType = types[Math.floor(Math.random() * types.length)];
        }
    }
    
    const definition = UNIT_DEFINITIONS[unitType];
    
    if (!definition || gameState.player.gold < definition.cost) return;
    
    // Determine position based on unit type (mirrored for left side, or random for Noob)
    const { xPos, yPos } = getPlayerAIUnitPosition(definition.type, playerTemplateUnits, strategy);
    
    if (xPos === null || yPos === null) return;
    
    // Purchase and place unit
    gameState.player.gold -= definition.cost;
    const playerUnit = new Unit(definition, 'player', xPos, yPos);
    gameState.units.push(playerUnit);
    createUnitElement(playerUnit, DOM.playerZone);
}

function tryPlayerAIUpgrade(strategy) {
    let typeToUpgrade;
    let isPreferredUpgrade = false;
    
    if (strategy.preferredUnit && Math.random() < 0.8) {
        typeToUpgrade = strategy.preferredUnit;
        isPreferredUpgrade = true;
    } else {
        const types = ['melee', 'ranged', 'caster', 'healer'];
        typeToUpgrade = types[Math.floor(Math.random() * types.length)];
    }
    
    const definition = UNIT_DEFINITIONS[typeToUpgrade];
    const upgradeLevel = gameState.player.upgradeLevels[typeToUpgrade] || 0;
    const upgradeCost = ShopManager.getUpgradeCost(typeToUpgrade, upgradeLevel);
    
    // Use higher upgrade chance for preferred unit if applicable
    const effectiveChance = isPreferredUpgrade && strategy.preferredUpgradeChance 
        ? strategy.preferredUpgradeChance 
        : 1.0;
    
    if (gameState.player.gold >= upgradeCost && Math.random() < effectiveChance) {
        gameState.player.gold -= upgradeCost;
        gameState.player.upgradeLevels[typeToUpgrade]++;
        console.log(`Player AI upgraded ${typeToUpgrade} to level ${gameState.player.upgradeLevels[typeToUpgrade]} for ${upgradeCost}g`);
        
        // Update UI
        if (window.updateUpgradeButtons) {
            updateUpgradeButtons();
        }
    }
}

function getPlayerAIUnitPosition(unitType, existingUnits, strategy = null) {
    // The Noob places units randomly without strategy
    if (strategy && strategy.badPlacement) {
        const width = DOM.playerZone.offsetWidth;
        const height = DOM.playerZone.offsetHeight;
        
        // Try to find a valid position anywhere in the zone
        for (let attempt = 0; attempt < 30; attempt++) {
            const xPos = Math.random() * (width - 50) + 25;
            const yPos = Math.random() * (height - 50) + 25;
            
            // Check collision
            let hasCollision = false;
            for (let existing of existingUnits) {
                const dist = Math.sqrt(
                    Math.pow(existing.x - xPos, 2) + 
                    Math.pow(existing.y - yPos, 2)
                );
                if (dist < GAME_CONFIG.MIN_UNIT_DISTANCE) {
                    hasCollision = true;
                    break;
                }
            }
            
            if (!hasCollision) {
                return { xPos, yPos };
            }
        }
        
        return { xPos: null, yPos: null };
    }
    
    // Normal strategic placement (mirrored from right side)
    let xMin, xMax;
    const width = DOM.playerZone.offsetWidth;
    
    // Mirror the positioning: melee on right, casters on left
    if (unitType === 'melee') {
        xMin = width * 0.66;
        xMax = width - 25;
    } else if (unitType === 'ranged') {
        xMin = width * 0.33;
        xMax = width * 0.66;
    } else {
        xMin = 25;
        xMax = width * 0.33;
    }
    
    // Try to find a valid position
    for (let attempt = 0; attempt < 30; attempt++) {
        const xPos = Math.random() * (xMax - xMin) + xMin;
        const yPos = Math.random() * (DOM.playerZone.offsetHeight - 50) + 25;
        
        // Check collision
        let hasCollision = false;
        for (let existing of existingUnits) {
            const dist = Math.sqrt(
                Math.pow(existing.x - xPos, 2) + 
                Math.pow(existing.y - yPos, 2)
            );
            if (dist < GAME_CONFIG.MIN_UNIT_DISTANCE) {
                hasCollision = true;
                break;
            }
        }
        
        if (!hasCollision) {
            return { xPos, yPos };
        }
    }
    
    return { xPos: null, yPos: null };
}
