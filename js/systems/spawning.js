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
    
    // Don't clear selection - keep unit selected for placing more
    updateUI();
}

function startRound() {
    gameState.isRoundActive = true;
    gameState.round++;
    
    // Auto-unlock tiers at specific rounds for both player and AI
    if (gameState.round === 6) {
        if (!gameState.player.unlockedTiers.includes(2)) {
            gameState.player.unlockedTiers.push(2);
            gameState.player.gold += 50; // Bonus gold for tier unlock
            const tierSection = document.getElementById('tier-2-units');
            tierSection.classList.remove('locked');
            tierSection.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
            console.log('Tier 2 unlocked! +50 bonus gold!');
        }
        if (!gameState.ai.unlockedTiers.includes(2)) {
            gameState.ai.unlockedTiers.push(2);
            gameState.ai.gold += Math.round(50 * GAME_CONFIG.AI_GOLD_MULTIPLIER); // Bonus gold with AI multiplier
            console.log('AI Tier 2 unlocked!');
        }
    }
    
    if (gameState.round === 12) {
        if (!gameState.player.unlockedTiers.includes(3)) {
            gameState.player.unlockedTiers.push(3);
            gameState.player.gold += 100; // Bonus gold for tier unlock
            const tierSection = document.getElementById('tier-3-units');
            tierSection.classList.remove('locked');
            tierSection.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
            console.log('Tier 3 unlocked! +100 bonus gold!');
        }
        if (!gameState.ai.unlockedTiers.includes(3)) {
            gameState.ai.unlockedTiers.push(3);
            gameState.ai.gold += Math.round(100 * GAME_CONFIG.AI_GOLD_MULTIPLIER); // Bonus gold with AI multiplier
            console.log('AI Tier 3 unlocked!');
        }
    }
    
    // Increase AI difficulty by 10% every 3 rounds
    if (gameState.round % 3 === 0) {
        GAME_CONFIG.AI_GOLD_MULTIPLIER += 0.1;
        console.log('AI difficulty increased! Now ' + Math.round(GAME_CONFIG.AI_GOLD_MULTIPLIER * 100) + '% gold income (Round ' + gameState.round + ')');
    }
    
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
