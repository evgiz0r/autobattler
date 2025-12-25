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
    const deltaTime = rawDeltaTime * gameState.gameSpeed; // Apply speed multiplier
    gameState.lastUpdateTime = timestamp;
    
    if (!gameState.isPaused) {
        // Update economy
        updatePassiveGold(deltaTime);
        
        // Update battle (new modular system)
        BattleSystem.update(deltaTime, timestamp);
        
        // Clean up dead units
        cleanupDeadUnits();
        
        // Clean up expired units in build zones
        cleanupExpiredUnits();
        
        // Clean up old projectiles
        ProjectileSystem.cleanupOldProjectiles(timestamp);
        
        // Initialize AI strategy if not set and game started
        if (gameState.firstUnitPlaced && !gameState.ai.strategy) {
            initializeAIStrategy(gameState.selectedAIStrategy || null);
        }
        
        // AI buying - only after game starts (increases aggression with rounds)
        const aiBuyChance = GAME_CONFIG.AI_BUY_CHANCE + (gameState.round * GAME_CONFIG.AI_BUY_CHANCE_PER_ROUND);
        if (gameState.firstUnitPlaced && Math.random() < aiBuyChance) {
            aiPurchaseUnits();
        }
        
        // Player AI buying in AI vs AI mode (also scales with rounds)
        if (gameState.isAIvsAI && gameState.firstUnitPlaced && Math.random() < aiBuyChance) {
            playerAIPurchaseUnits();
        }
        
        // Round timer - only runs after first unit is placed
        if (gameState.firstUnitPlaced) {
            gameState.roundTimer -= deltaTime / 1000;
            if (gameState.roundTimer <= 0) {
                endRound();
                startRound();
            }
        }
    }
    
    updateUI();
    requestAnimationFrame(gameLoop);
}

function cleanupDeadUnits() {
    gameState.units = gameState.units.filter(unit => {
        if (unit.isDead && unit.element === null) {
            return false;
        }
        return true;
    });
}

function cleanupExpiredUnits() {
    const now = Date.now();
    gameState.units = gameState.units.filter(unit => {
        // Only check units in build zones (not battlefield)
        if (unit.element && (unit.element.parentElement === DOM.playerZone || unit.element.parentElement === DOM.aiZone)) {
            const timeAlive = now - unit.createdAt - unit.pausedTime;
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
