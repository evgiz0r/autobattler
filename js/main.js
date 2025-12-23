// Main game loop and initialization

function init() {
    // Initialize DOM references
    DOM.playerZone = document.getElementById('player-zone');
    DOM.battleZone = document.getElementById('battle-zone');
    DOM.aiZone = document.getElementById('ai-zone');
    
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
    
    const deltaTime = timestamp - gameState.lastUpdateTime;
    gameState.lastUpdateTime = timestamp;
    
    if (!gameState.isPaused) {
        // Update economy
        updatePassiveGold(deltaTime);
        
        // Update battle
        updateBattle(deltaTime, timestamp);
        
        // Clean up dead units
        cleanupDeadUnits();
        
        // Clean up expired units in build zones
        cleanupExpiredUnits();
        
        // Clean up old projectiles
        cleanupOldProjectiles(timestamp);
        
        // AI buying
        if (Math.random() < GAME_CONFIG.AI_BUY_CHANCE) {
            aiPurchaseUnits();
        }
        
        // Round timer
        gameState.roundTimer -= deltaTime / 1000;
        if (gameState.roundTimer <= 0) {
            endRound();
            startRound();
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
            const timeAlive = now - unit.createdAt;
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
    gameState.projectiles = gameState.projectiles.filter(proj => {
        if (!proj.createdAt) proj.createdAt = timestamp;
        if (timestamp - proj.createdAt > GAME_CONFIG.PROJECTILE_MAX_AGE) {
            if (proj.element) proj.element.remove();
            return false;
        }
        return true;
    });
}

// Start the game when page loads
init();
