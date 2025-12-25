// AI system - handles AI decision making and unit purchasing with strategy selection

// AI Strategies
const AI_STRATEGIES = {
    SPAM_ONLY: {
        name: 'The Swarm',
        upgradeChance: 0,
        preferredUnit: null, // Random selection
        description: 'Builds units non-stop, never upgrades'
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
    }
};

function initializeAIStrategy() {
    const strategies = Object.keys(AI_STRATEGIES);
    const chosenKey = strategies[Math.floor(Math.random() * strategies.length)];
    const strategy = AI_STRATEGIES[chosenKey];
    
    gameState.ai.strategy = {
        key: chosenKey,
        ...strategy
    };
    
    console.log(`AI Strategy: ${strategy.name} - ${strategy.description}`);
    return strategy;
}

function aiPurchaseUnits() {
    // Check AI unit count
    const aiTemplateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.aiZone
    );
    
    if (aiTemplateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE) return;
    
    // Get AI strategy
    const strategy = gameState.ai.strategy || initializeAIStrategy();
    
    // Randomly decide to upgrade based on strategy
    if (Math.random() < strategy.upgradeChance) {
        tryAIUpgrade(strategy);
    }
    
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
            if (strategy.secondaryUnit && Math.random() < strategy.secondaryChance) {
                unitType = strategy.secondaryUnit;
            } else {
                // Build preferred unit most of the time
                const preferChance = strategy.secondaryUnit ? (1 - strategy.secondaryChance) : 0.8;
                if (Math.random() < preferChance) {
                    unitType = strategy.preferredUnit;
                } else {
                    // Random selection from all 4 units
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
    
    // Determine position based on unit type
    const { xPos, yPos } = getAIUnitPosition(definition.type, aiTemplateUnits);
    
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
    const upgradeCost = definition.cost; // Always costs 1 unit
    
    // Use higher upgrade chance for preferred unit if applicable
    const effectiveChance = isPreferredUpgrade && strategy.preferredUpgradeChance 
        ? strategy.preferredUpgradeChance 
        : 1.0; // Always upgrade if we decided to try
    
    if (gameState.ai.gold >= upgradeCost && Math.random() < effectiveChance) {
        gameState.ai.gold -= upgradeCost;
        gameState.ai.upgradeLevels[typeToUpgrade]++;
        console.log(`AI upgraded ${typeToUpgrade} to level ${gameState.ai.upgradeLevels[typeToUpgrade]}`);
        
        // Update AI shop display
        if (window.updateUpgradeButtons) {
            updateUpgradeButtons();
        }
    }
}

function getAIUnitPosition(unitType, existingUnits) {
    // Determine position based on unit type
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
    
    if (playerTemplateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE) return;
    
    // Use player's own strategy
    const strategy = gameState.player.strategy || gameState.ai.strategy || initializeAIStrategy();
    
    // Randomly decide to upgrade based on strategy
    if (Math.random() < strategy.upgradeChance) {
        tryPlayerAIUpgrade(strategy);
    }
    
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
            if (strategy.secondaryUnit && Math.random() < strategy.secondaryChance) {
                unitType = strategy.secondaryUnit;
            } else {
                // Build preferred unit most of the time
                const preferChance = strategy.secondaryUnit ? (1 - strategy.secondaryChance) : 0.8;
                if (Math.random() < preferChance) {
                    unitType = strategy.preferredUnit;
                } else {
                    // Random selection from all 4 units
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
    
    // Determine position based on unit type (mirrored for left side)
    const { xPos, yPos } = getPlayerAIUnitPosition(definition.type, playerTemplateUnits);
    
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
    const upgradeCost = definition.cost; // Always costs 1 unit
    
    // Use higher upgrade chance for preferred unit if applicable
    const effectiveChance = isPreferredUpgrade && strategy.preferredUpgradeChance 
        ? strategy.preferredUpgradeChance 
        : 1.0;
    
    if (gameState.player.gold >= upgradeCost && Math.random() < effectiveChance) {
        gameState.player.gold -= upgradeCost;
        gameState.player.upgradeLevels[typeToUpgrade]++;
        console.log(`Player AI upgraded ${typeToUpgrade} to level ${gameState.player.upgradeLevels[typeToUpgrade]}`);
        
        // Update UI
        if (window.updateUpgradeButtons) {
            updateUpgradeButtons();
        }
    }
}

function getPlayerAIUnitPosition(unitType, existingUnits) {
    // Determine position based on unit type (mirrored from right side)
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
