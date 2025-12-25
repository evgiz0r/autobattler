// Spawning system - handles unit placement and round management

function showFailedPlacement(x, y) {
    const indicator = document.createElement('div');
    indicator.className = 'placement-failed';
    indicator.textContent = '✕';
    indicator.style.left = (x - 15) + 'px';
    indicator.style.top = (y - 15) + 'px';
    DOM.playerZone.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 500);
}

function placeUnit(unitType, x, y) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    if (gameState.player.gold < definition.cost) {
        console.log('Not enough gold');
        showFailedPlacement(x, y);
        return;
    }
    
    // Check for existing units in player zone
    const templateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === DOM.playerZone
    );
    
    // Check unit limit
    if (templateUnits.length >= GAME_CONFIG.MAX_UNITS_PER_ZONE) {
        console.log(`Maximum units reached (${GAME_CONFIG.MAX_UNITS_PER_ZONE})`);
        showFailedPlacement(x, y);
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
            showFailedPlacement(x, y);
            return;
        }
    }
    
    // Deduct gold and create unit
    gameState.player.gold -= definition.cost;
    const newUnit = new Unit(definition, 'player', x, y);
    gameState.units.push(newUnit);
    createUnitElement(newUnit, DOM.playerZone);
    
    
    // Keep the cursor preview visible and following the cursor after placement
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
    gameState.roundStartTime = gameState.gameTime; // Track when round started
    
    // Play round begin sound
    SoundSystem.playRoundBegin();
    
    // Clone template units from build zones to battle zone
    const templateUnits = gameState.units.filter(u => 
        u.element && (u.element.parentElement === DOM.playerZone || u.element.parentElement === DOM.aiZone)
    );
    
    // Track initial unit counts for each side
    let playerSpawnCount = 0;
    let aiSpawnCount = 0;
    
    templateUnits.forEach(templateUnit => {
        // Get base definition for unit type
        const def = UNIT_DEFINITIONS[templateUnit.type];
        
        if (def) {
            // Spawn units at the same positions as in their template zones
            let spawnX;
            if (templateUnit.owner === 'player') {
                // Player units spawn at same X position (left side)
                spawnX = templateUnit.x;
            } else {
                // AI units spawn at same relative position from the right edge
                spawnX = DOM.battleZone.offsetWidth - DOM.aiZone.offsetWidth + templateUnit.x;
            }
            
            const battleUnit = new Unit(
                def,
                templateUnit.owner,
                spawnX,
                templateUnit.y
            );
            
            // Mark as battle unit
            battleUnit.isBattleUnit = true;
            
            // Reset createdAt for battle units (don't inherit template's old timestamp)
            battleUnit.createdAt = gameState.gameTime;
            
            // Set initial cooldown (50-100% already elapsed) so units don't instant-attack
            // Scale the cooldown by game speed so it's consistent across different speeds
            const cooldownProgress = 0.5 + Math.random() * 0.5; // Random value between 0.5 and 1.0
            const effectiveCooldown = battleUnit.attackCooldown / gameState.gameSpeed;
            battleUnit.lastAttackTime = gameState.gameTime - (effectiveCooldown * cooldownProgress);
            
            // Set spawn time for invulnerability period
            battleUnit.spawnTime = gameState.gameTime;
            
            gameState.units.push(battleUnit);
            createUnitElement(battleUnit, DOM.battleZone);
            
            // Count spawned units
            if (templateUnit.owner === 'player') {
                playerSpawnCount++;
            } else {
                aiSpawnCount++;
            }
        }
    });
    
    // Store spawn counts for round end checking
    gameState.playerUnitsSpawned = playerSpawnCount;
    gameState.aiUnitsSpawned = aiSpawnCount;
    
    // Set battle timer
    gameState.roundTimer = GAME_CONFIG.BATTLE_DURATION;
    
    updateUI();
}

function endRound() {
    // Mark round as inactive
    gameState.isRoundActive = false;
    
    // Keep battle units alive - just remove dead ones
    gameState.units = gameState.units.filter(unit => {
        if (unit.isDead && unit.element === null) {
            return false;
        }
        return true;
    });
    
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
    