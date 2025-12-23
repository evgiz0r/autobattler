// UI Manager - handles UI updates and event listeners

function updateUI() {
    document.getElementById('player-health').textContent = gameState.player.health;
    document.getElementById('player-gold').textContent = gameState.player.gold;
    document.getElementById('ai-health').textContent = gameState.ai.health;
    document.getElementById('ai-gold').textContent = gameState.ai.gold;
    document.getElementById('round-number').textContent = gameState.round;
    document.getElementById('round-timer').textContent = Math.ceil(gameState.roundTimer);
    document.getElementById('ai-boost').textContent = Math.round(GAME_CONFIG.AI_GOLD_MULTIPLIER * 100);
}

function selectUnitForPlacement(unitType) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    if (!gameState.player.unlockedTiers.includes(definition.tier)) {
        console.log('Tier locked');
        return;
    }
    
    gameState.selectedUnitType = unitType;
    
    // Create cursor preview
    if (gameState.cursorPreview) {
        gameState.cursorPreview.remove();
    }
    
    const preview = document.createElement('div');
    preview.className = `unit player ${definition.type} tier-${definition.tier} cursor-preview`;
    preview.style.pointerEvents = 'none';
    preview.style.opacity = '0.6';
    preview.style.position = 'absolute';
    preview.style.display = 'none';
    DOM.playerZone.appendChild(preview);
    gameState.cursorPreview = preview;
    
    if (gameState.player.gold < definition.cost) {
        console.log('Not enough gold for ' + definition.name + ' (need ' + definition.cost + ')');
    } else {
        console.log('Click in the blue zone to place ' + definition.name);
    }
}

function setupEventListeners() {
    // Unit purchase buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const unitType = btn.dataset.unit;
            selectUnitForPlacement(unitType);
        });
    });
    
    // Tier unlock buttons
    document.querySelectorAll('.unlock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tier = parseInt(btn.dataset.tier);
            unlockTier(tier);
        });
    });
    
    // Unit placement in player zone
    DOM.playerZone.addEventListener('click', (e) => {
        if (gameState.selectedUnitType) {
            const rect = DOM.playerZone.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            placeUnit(gameState.selectedUnitType, x, y);
        }
    });
    
    // Placement preview cursor
    DOM.playerZone.addEventListener('mousemove', (e) => {
        if (gameState.selectedUnitType) {
            DOM.playerZone.style.cursor = 'none';
            
            if (gameState.cursorPreview) {
                const rect = DOM.playerZone.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                gameState.cursorPreview.style.left = (x - 10) + 'px'; // Center on cursor
                gameState.cursorPreview.style.top = (y - 10) + 'px';
                gameState.cursorPreview.style.display = 'block';
            }
        } else {
            DOM.playerZone.style.cursor = 'default';
            if (gameState.cursorPreview) {
                gameState.cursorPreview.style.display = 'none';
            }
        }
    });
    
    // Hide cursor preview when leaving player zone
    DOM.playerZone.addEventListener('mouseleave', () => {
        if (gameState.cursorPreview) {
            gameState.cursorPreview.style.display = 'none';
        }
    });
    
    // Pause button
    document.getElementById('pause-btn').addEventListener('click', () => {
        gameState.isPaused = !gameState.isPaused;
        document.getElementById('pause-btn').textContent = gameState.isPaused ? 'Resume' : 'Pause';
    });
    
    // Target lines toggle
    document.getElementById('target-lines-btn').addEventListener('click', () => {
        gameState.showTargetLines = !gameState.showTargetLines;
        document.getElementById('target-lines-btn').textContent = 
            gameState.showTargetLines ? 'Hide Target Lines' : 'Show Target Lines';
        
        // Clean up existing lines if disabling
        if (!gameState.showTargetLines) {
            document.querySelectorAll('.target-line').forEach(line => line.remove());
            gameState.units.forEach(unit => {
                unit.targetLine = null;
            });
        }
    });
    
    // Economy upgrade
    document.getElementById('economy-upgrade-btn').addEventListener('click', () => {
        upgradeEconomy();
    });
}
