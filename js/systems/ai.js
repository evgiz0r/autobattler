// AI system - handles AI decision making and unit purchasing

function aiPurchaseUnits() {
    // Check AI unit count
    const aiTemplateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.aiZone
    );
    
    if (aiTemplateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE) return;
    
    const round = gameState.round;
    
    // Count unit types already placed
    const meleeCount = aiTemplateUnits.filter(u => u.type === 'melee').length;
    const rangedCount = aiTemplateUnits.filter(u => u.type === 'ranged').length;
    const casterCount = aiTemplateUnits.filter(u => u.type === 'caster').length;
    const totalUnits = aiTemplateUnits.length;
    
    // Determine what to buy based on round and composition
    let desiredType = null;
    
    // All rounds: Mix units from the start with more balance
    
    if (round <= 3) {
        // Rounds 1-3: Balanced start (40% melee, 40% ranged, 20% caster if affordable)
        if (totalUnits === 0) {
            desiredType = Math.random() < 0.5 ? 'melee' : 'ranged'; // First unit 50/50
        } else {
            const roll = Math.random();
            if (roll < 0.4) desiredType = 'melee';
            else if (roll < 0.8 || gameState.ai.gold < 20) desiredType = 'ranged';
            else desiredType = 'caster';
        }
    }
    else if (round <= 6) {
        // Rounds 4-6: Slightly more melee (45% melee, 40% ranged, 15% caster)
        const roll = Math.random();
        if (roll < 0.45) desiredType = 'melee';
        else if (roll < 0.85 || gameState.ai.gold < 20) desiredType = 'ranged';
        else desiredType = 'caster';
    }
    else if (round <= 10) {
        // Rounds 7-10: Balanced (35% melee, 45% ranged, 20% caster)
        const roll = Math.random();
        if (roll < 0.35) desiredType = 'melee';
        else if (roll < 0.8) desiredType = 'ranged';
        else desiredType = 'caster';
    }
    else {
        // Round 11+: Heavy ranged/caster (30% melee, 50% ranged, 20% caster)
        const meleeRatio = totalUnits > 0 ? meleeCount / totalUnits : 0;
        const rangedRatio = totalUnits > 0 ? rangedCount / totalUnits : 0;
        const casterRatio = totalUnits > 0 ? casterCount / totalUnits : 0;
        
        // Maintain target ratios
        if (meleeRatio < 0.25) desiredType = 'melee';
        else if (rangedRatio < 0.45) desiredType = 'ranged';
        else if (casterRatio < 0.15 && gameState.ai.gold >= 20) desiredType = 'caster';
        else {
            const roll = Math.random();
            if (roll < 0.3) desiredType = 'melee';
            else if (roll < 0.8) desiredType = 'ranged';
            else desiredType = 'caster';
        }
    }
    
    // Find highest tier available unit of desired type that AI can afford
    const highestTier = Math.max(...gameState.ai.unlockedTiers);
    const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
        const def = UNIT_DEFINITIONS[key];
        return def.type === desiredType && 
               def.tier === highestTier && 
               def.cost <= gameState.ai.gold;
    });
    
    if (availableUnits.length === 0) return;
    
    // Use the highest tier unit found
    const chosenUnit = availableUnits[0];
    const definition = UNIT_DEFINITIONS[chosenUnit];
    
    // Determine position based on unit type (X axis for frontline)
    // Melee: front (left 1/3 - closer to player)
    // Ranged: middle (middle 1/3)
    // Caster: back (right 1/3 - away from player)
    let xMin, xMax;
    const width = DOM.aiZone.offsetWidth;
    
    if (desiredType === 'melee') {
        xMin = 25;
        xMax = width * 0.33;
    } else if (desiredType === 'ranged') {
        xMin = width * 0.33;
        xMax = width * 0.66;
    } else { // caster
        xMin = width * 0.66;
        xMax = width - 25;
    }
    
    // Try to find a valid position
    let validPosition = false;
    let aiUnit = null;
    let positionAttempts = 0;
    
    while (!validPosition && positionAttempts < 30) {
        const xPos = Math.random() * (xMax - xMin) + xMin;
        const yPos = Math.random() * (DOM.aiZone.offsetHeight - 50) + 25;
        
        // Check collision with existing AI units
        let hasCollision = false;
        for (let existing of aiTemplateUnits) {
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
            validPosition = true;
            aiUnit = new Unit(definition, 'ai', xPos, yPos);
        }
        positionAttempts++;
    }
    
    // Place unit if valid position found
    if (validPosition && aiUnit) {
        gameState.ai.gold -= definition.cost;
        gameState.units.push(aiUnit);
        createUnitElement(aiUnit, DOM.aiZone);
    }
}
