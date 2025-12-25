// Main game loop and initialization

function init() {
    // Initialize DOM references
    DOM.playerZone = document.getElementById('player-zone');
    DOM.battleZone = document.getElementById('battle-zone');
    DOM.aiZone = document.getElementById('ai-zone');
    
    // Initialize game (AI strategy, etc.)
    initializeGame();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    updateUI();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameState.lastUpdateTime) {
        gameState.lastUpdateTime = timestamp;
    }
    
    const rawDeltaTime = timestamp - gameState.lastUpdateTime;
    // Cap delta time to prevent huge jumps when tab loses focus
    const cappedRawDeltaTime = Math.min(rawDeltaTime, 100); // Cap at 100ms
    const deltaTime = cappedRawDeltaTime * gameState.gameSpeed; // Apply speed multiplier
    gameState.lastUpdateTime = timestamp;
    
    // Accumulate game time (affected by speed multiplier)
    if (!gameState.isPaused) {
        gameState.gameTime += deltaTime;
    }
    
    if (!gameState.isPaused) {
        // Update economy
        updatePassiveGold(deltaTime);
        
        // Update battle (new modular system)
        BattleSystem.update(deltaTime, gameState.gameTime);
        
        // Clean up dead units
        cleanupDeadUnits();
        
        // Clean up expired units and update timers
        cleanupExpiredUnits();
        
        // Clean up old projectiles
        ProjectileSystem.cleanupOldProjectiles(timestamp);
        
        // Initialize AI strategy if not set and game started
        if (gameState.firstUnitPlaced && !gameState.ai.strategy) {
            const strategy = initializeAIStrategy(gameState.selectedAIStrategy || null);
            displayAIStrategy(strategy);
        }
        
        // Initialize player AI strategy if AI vs AI mode and not set
        if (gameState.isAIvsAI && gameState.firstUnitPlaced && !gameState.player.strategy) {
            const playerStrategy = initializePlayerAIStrategy(gameState.selectedPlayerAIStrategy || null);
            displayPlayerAIStrategy(playerStrategy);
        }
        
        // AI buying - allowed at any time (building allowed during rounds)
        // Scale buy chance by game speed so AI buys faster at higher speeds
        const baseBuyChance = GAME_CONFIG.AI_BUY_CHANCE + (gameState.round * GAME_CONFIG.AI_BUY_CHANCE_PER_ROUND);
        const aiBuyChance = baseBuyChance * gameState.gameSpeed;
        if (gameState.firstUnitPlaced && Math.random() < aiBuyChance) {
            aiPurchaseUnits();
        }

        // Player AI buying in AI vs AI mode (also scales with rounds and speed)
        if (gameState.isAIvsAI && gameState.firstUnitPlaced && Math.random() < aiBuyChance) {
            playerAIPurchaseUnits();
        }
        
        // Unified round timer - always counts down once the game started
        if (gameState.firstUnitPlaced) {
            gameState.roundTimer -= deltaTime / 1000;
            if (gameState.roundTimer <= 0) {
                if (!gameState.isRoundActive) {
                    startRound();
                } else {
                    // Battle time expired, end round
                    const livingBattleUnits = gameState.units.filter(u => u.isBattleUnit && !u.isDead);
                    const playerUnits = livingBattleUnits.filter(u => u.owner === 'player');
                    const aiUnits = livingBattleUnits.filter(u => u.owner === 'ai');

                    // Deal damage based on remaining units
                    if (aiUnits.length > 0) {
                        gameState.player.health -= aiUnits.length;
                    }
                    if (playerUnits.length > 0) {
                        gameState.ai.health -= playerUnits.length;
                    }

                    endRound();
                }
            }
        }
    }
    
    updateUI();
    requestAnimationFrame(gameLoop);
}

function cleanupDeadUnits() {
    gameState.units = gameState.units.filter(unit => {
        if (unit.isDead && unit.element === null) {
            if (unit.type === 'healer') {
                console.log(`CLEANUP: Removing dead healer id=${unit.id} at x=${unit.x.toFixed(1)}`);
            }
            return false;
        }
        return true;
    });
}

function cleanupExpiredUnits() {
    gameState.units = gameState.units.filter(unit => {
        // Only check units in build zones (not battlefield)
        if (unit.element && (unit.element.parentElement === DOM.playerZone || unit.element.parentElement === DOM.aiZone)) {
            const timeAlive = gameState.gameTime - unit.createdAt - unit.pausedTime;
            if (timeAlive >= unit.expirationTime) {
                // Unit expired, remove it
                if (unit.element) {
                    unit.element.remove();
                    unit.element = null;
                }
                return false;
            }
            // Update timer display
            unit.updateExpirationTimer();
        }
        return true;
    });
}

function cleanupOldProjectiles(timestamp) {
    ProjectileSystem.cleanupOldProjectiles(timestamp);
}

// Start the game when page loads
init();
