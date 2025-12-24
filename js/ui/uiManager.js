// UI Manager - handles UI updates and event listeners

function initializeGame() {
    // Initialize AI strategy (can be changed to other strategies)
    gameState.aiStrategy = new BalancedAIStrategy('normal');
    // Alternative strategies:
    // gameState.aiStrategy = new RandomAIStrategy();
    // gameState.aiStrategy = new AggressiveAIStrategy();
    
    // Generate shop UI dynamically
    ShopManager.generateShop();
}

function updateUI() {
    document.getElementById('player-health').textContent = gameState.player.health;
    
    // Show tier bonus in gold display
    const tierBonus = gameState.player.unlockedTiers.length - 1;
    const economyBonus = gameState.player.economyLevel || 0;
    const totalBonus = 1 + tierBonus + economyBonus; // base 1 + bonuses
    document.getElementById('player-gold').textContent = `${gameState.player.gold} (+${totalBonus}/s)`;
    
    const aiTierBonus = gameState.ai.unlockedTiers.length - 1;
    const aiTotalBonus = Math.round((1 + aiTierBonus) * GAME_CONFIG.AI_GOLD_MULTIPLIER * 10) / 10;
    
    document.getElementById('ai-health').textContent = gameState.ai.health;
    document.getElementById('ai-gold').textContent = `${gameState.ai.gold} (+${aiTotalBonus}/s)`;
    document.getElementById('round-number').textContent = gameState.round;
    document.getElementById('round-timer').textContent = Math.ceil(gameState.roundTimer);
    document.getElementById('ai-boost').textContent = Math.round(GAME_CONFIG.AI_GOLD_MULTIPLIER * 100);
    
    // Update affordability indicators
    document.querySelectorAll('.buy-btn').forEach(btn => {
        const unitType = btn.dataset.unit;
        const definition = UNIT_DEFINITIONS[unitType];
        if (definition) {
            if (gameState.player.gold < definition.cost) {
                btn.classList.add('cannot-afford');
            } else {
                btn.classList.remove('cannot-afford');
            }
        }
    });
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
    // Unit purchase buttons - delegate from unit shop container
    const unitShop = document.getElementById('unit-shop');
    if (unitShop) {
        unitShop.addEventListener('click', (e) => {
            const buyBtn = e.target.closest('.buy-btn');
            if (buyBtn) {
                const unitType = buyBtn.dataset.unit;
                selectUnitForPlacement(unitType);
            }
        });
    }
    
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
        const wasPaused = gameState.isPaused;
        gameState.isPaused = !gameState.isPaused;
        document.getElementById('pause-btn').textContent = gameState.isPaused ? 'Resume' : 'Pause';
        
        // Track pause time for all units
        const now = Date.now();
        if (gameState.isPaused) {
            // Game just paused - mark pause start time for all units
            gameState.units.forEach(unit => {
                unit.lastPauseStart = now;
            });
        } else if (wasPaused) {
            // Game just unpaused - add elapsed pause time to all units
            gameState.units.forEach(unit => {
                if (unit.lastPauseStart) {
                    unit.pausedTime += now - unit.lastPauseStart;
                    unit.lastPauseStart = null;
                }
            });
        }
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
