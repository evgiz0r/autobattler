// Refactored Battle System - coordinates unit updates and combat
// Uses behavior classes, combat system, movement system, and projectile system

const BattleSystem = {
    // Main battle update function
    update(deltaTime, currentTime) {
        // Update all units
        this.updateUnits(deltaTime, currentTime);
        
        // Update projectiles
        ProjectileSystem.updateProjectiles(deltaTime);
        
        // Update target lines
        this.updateTargetLines();
        
        // Check game over
        this.checkGameOver();
    },
    
    // Update all units in battle
    updateUnits(deltaTime, currentTime) {
        const battleWidth = BattleContext.battleWidth;
        
        for (let unit of gameState.units) {
            if (unit.isDead) continue;
            
            // Skip template units in build zones
            if (unit.element && (unit.element.parentElement === DOM.playerZone || 
                                unit.element.parentElement === DOM.aiZone)) {
                continue;
            }
            
            // Update unit using its behavior
            if (unit.behavior) {
                unit.behavior.update(deltaTime, currentTime, BattleContext);
            }
            
            // Update cooldown bar
            unit.updateCooldownBar(currentTime);
        }
    },
    
    // Update target lines for all units
    updateTargetLines() {
        if (!gameState.showTargetLines) return;
        
        for (let unit of gameState.units) {
            if (unit.isDead || !unit.target || unit.target.isDead) {
                this.removeTargetLine(unit);
                continue;
            }
            
            if (unit.element && unit.element.parentElement === DOM.battleZone) {
                this.drawTargetLine(unit);
            } else {
                this.removeTargetLine(unit);
            }
        }
    },
    
    // Draw target line from unit to its target
    drawTargetLine(unit) {
        if (!unit.targetLine) {
            unit.targetLine = document.createElement('div');
            unit.targetLine.className = `target-line ${unit.owner}`;
            DOM.battleZone.appendChild(unit.targetLine);
        }
        
        const dx = unit.target.x - unit.x;
        const dy = unit.target.y - unit.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = MathUtils.toDegrees(Math.atan2(dy, dx));
        
        unit.targetLine.style.width = length + 'px';
        unit.targetLine.style.left = unit.x + 'px';
        unit.targetLine.style.top = unit.y + 'px';
        unit.targetLine.style.transform = `rotate(${angle}deg)`;
        unit.targetLine.style.transformOrigin = '0 0';
    },
    
    // Remove target line from unit
    removeTargetLine(unit) {
        if (unit.targetLine) {
            unit.targetLine.remove();
            unit.targetLine = null;
        }
    },
    
    // Clean up all target lines
    cleanupTargetLines() {
        document.querySelectorAll('.target-line').forEach(line => line.remove());
        gameState.units.forEach(unit => {
            unit.targetLine = null;
        });
    },
    
    // Check if game is over
    checkGameOver() {
        if (gameState.player.health <= 0 || gameState.ai.health <= 0) {
            if (!gameState.isPaused) {
                const winner = gameState.player.health > 0 ? 'Player' : 'AI';
                gameState.isPaused = true;
                document.getElementById('pause-btn').textContent = 'Resume';
                
                // Show game over message
                const messageDiv = document.getElementById('first-unit-message');
                messageDiv.textContent = `Game Over - ${winner} Wins!`;
                messageDiv.style.display = 'block';
                messageDiv.style.fontSize = '18px';
                messageDiv.style.padding = '12px 24px';
                messageDiv.style.top = '50%';
                messageDiv.style.left = '50%';
                messageDiv.style.transform = 'translate(-50%, -50%)';
                
                // Track pause time for all units
                const now = Date.now();
                gameState.units.forEach(unit => {
                    unit.lastPauseStart = now;
                });
            }
        }
    }
};
