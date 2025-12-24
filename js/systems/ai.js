// AI system - handles AI decision making and unit purchasing using strategy pattern

function aiPurchaseUnits() {
    // Check AI unit count
    const aiTemplateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.aiZone
    );
    
    if (aiTemplateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE) return;
    
    // Use AI strategy to select unit
    const strategy = gameState.aiStrategy;
    
    // Select unit to purchase
    const definition = strategy.selectUnits(gameState.ai.gold, gameState.ai.unlockedTiers);
    
    if (!definition) return;
    
    // Determine position based on unit type
    const { xPos, yPos } = getAIUnitPosition(definition.type, aiTemplateUnits);
    
    if (xPos === null || yPos === null) return;
    
    // Purchase and place unit
    gameState.ai.gold -= definition.cost;
    const aiUnit = new Unit(definition, 'ai', xPos, yPos);
    gameState.units.push(aiUnit);
    createUnitElement(aiUnit, DOM.aiZone);
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
