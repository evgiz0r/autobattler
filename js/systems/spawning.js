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
        // Enable economy button
        const economyBtn = document.getElementById('economy-upgrade-btn');
        if (economyBtn) {
            economyBtn.disabled = false;
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
    
    // Clone template units from build zones to battle zone
    const templateUnits = gameState.units.filter(u => 
        u.element && (u.element.parentElement === DOM.playerZone || u.element.parentElement === DOM.aiZone)
    );
    
    templateUnits.forEach(templateUnit => {
        // Get base definition for unit type
        const def = UNIT_DEFINITIONS[templateUnit.type];
        
        if (def) {
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
                def,
                templateUnit.owner,
                spawnX,
                templateUnit.y
            );
            
            // Set initial cooldown (50-100% already elapsed) so units don't instant-attack
            const cooldownProgress = 0.5 + Math.random() * 0.5; // Random value between 0.5 and 1.0
            battleUnit.lastAttackTime = performance.now() - (battleUnit.attackCooldown * cooldownProgress);
            
            // Set spawn time for invulnerability period
            battleUnit.spawnTime = performance.now();
            
            gameState.units.push(battleUnit);
            createUnitElement(battleUnit, DOM.battleZone);
        }
    });
    
    updateUI();
}

function endRound() {
    awardRoundGold();
    
    // Auto-upgrade all units every 3 rounds (regardless of cost)
    if (gameState.round > 0 && gameState.round % 3 === 0) {
        const types = ['melee', 'ranged', 'caster', 'healer'];
        types.forEach(type => {
            gameState.player.upgradeLevels[type]++;
            gameState.ai.upgradeLevels[type]++;
        });
        
        console.log(`Round ${gameState.round}: All units auto-upgraded to level ${gameState.player.upgradeLevels.melee}`);
        
        // Update UI to show new upgrade levels
        if (window.updateUpgradeButtons) {
            updateUpgradeButtons();
        }
    }
    
    gameState.roundTimer = GAME_CONFIG.ROUND_DURATION;
    updateUI();
}
