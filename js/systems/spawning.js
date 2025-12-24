// Spawning system - handles unit placement and round management

function placeUnit(unitType, x, y) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    if (gameState.player.gold < definition.cost) {
        console.log('Not enough gold');
        return;
    }
    
    // Check for existing units in player zone
    const templateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.playerZone
    );
    
    // Check unit limit
    if (templateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE) {
        console.log(`Maximum units reached (${GAME_CONFIG.MAX_UNITS_PER_ZONE})`);
        return;
    }
    
    // Check collision with existing units
    for (let existing of templateUnits) {
        const dist = Math.sqrt(
            Math.pow(existing.x - x, 2) + 
            Math.pow(existing.y - y, 2)
        );
        if (dist < GAME_CONFIG.MIN_UNIT_DISTANCE) {
            console.log('Too close to another unit');
            return;
        }
    }
    
    // Deduct gold and create unit
    gameState.player.gold -= definition.cost;
    const newUnit = new Unit(definition, 'player', x, y);
    gameState.units.push(newUnit);
    createUnitElement(newUnit, DOM.playerZone);
    
    // Mark first unit as placed
    if (!gameState.firstUnitPlaced) {
        gameState.firstUnitPlaced = true;
        const message = document.getElementById('first-unit-message');
        if (message) {
            message.style.display = 'none';
        }
    }
    
    // Don't clear selection - keep unit selected for placing more
    updateUI();
}

function startRound() {
    gameState.isRoundActive = true;
    gameState.round++;
    
    // Play round begin sound
    SoundSystem.playRoundBegin();
    
    // Check for auto-unlocking tiers
    checkAutoUnlockTiers();
    
    // Clone template units from build zones to battle zone
    const templateUnits = gameState.units.filter(u => 
        u.element && (u.element.parentElement === DOM.playerZone || u.element.parentElement === DOM.aiZone)
    );
    
    templateUnits.forEach(templateUnit => {
        // Find matching definition
        const defKey = Object.keys(UNIT_DEFINITIONS).find(key => {
            const def = UNIT_DEFINITIONS[key];
            return def.name === templateUnit.name && 
                   def.tier === templateUnit.tier && 
                   def.type === templateUnit.type;
        });
        
        if (defKey) {
            // Spawn maintaining X position relative to their zone, not all at edge
            // This prevents all units from spawning at the same X coordinate
            let spawnX;
            if (templateUnit.owner === 'player') {
                // Player units spawn at their template X position
                spawnX = templateUnit.x;
            } else {
                // AI units spawn at battlefield width minus their distance from right edge
                const distanceFromRightEdge = DOM.aiZone.offsetWidth - templateUnit.x;
                spawnX = DOM.battleZone.offsetWidth - distanceFromRightEdge;
            }
            
            const battleUnit = new Unit(
                UNIT_DEFINITIONS[defKey],
                templateUnit.owner,
                spawnX,
                templateUnit.y
            );
            
            gameState.units.push(battleUnit);
            createUnitElement(battleUnit, DOM.battleZone);
        }
    });
    
    updateUI();
}

function endRound() {
    awardRoundGold();
    gameState.roundTimer = GAME_CONFIG.ROUND_DURATION;
    updateUI();
}
