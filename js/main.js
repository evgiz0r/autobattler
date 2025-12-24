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
    
    const deltaTime = timestamp - gameState.lastUpdateTime;
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
        
        // AI buying (using strategy pattern)
        if (Math.random() < gameState.aiStrategy.getPurchaseChance()) {
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
    ProjectileSystem.cleanupOldProjectiles(timestamp);
}

// Start the game when page loads
init();
