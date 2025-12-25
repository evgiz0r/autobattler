// Movement system for unit movement logic
const MovementSystem = {
    // Move unit towards enemy base (horizontal only)
    moveTowardsBase(unit, deltaTime, battleWidth) {
        let newX = unit.x;
        
        if (unit.owner === 'player') {
            newX = unit.x + unit.speed * (deltaTime / 1000);
        } else {
            newX = unit.x - unit.speed * (deltaTime / 1000);
        }
        
        if (!this.checkCollision(newX, unit.y, unit)) {
            unit.x = newX;
        }
        
        this.updateVisualPosition(unit);
        this.checkBaseCollision(unit, battleWidth);
    },
    
    // Move unit horizontally towards target (maintains lane)
    moveHorizontally(unit, deltaTime, battleWidth, target = null) {
        let newX = unit.x;
        
        if (unit.owner === 'player') {
            newX = unit.x + unit.speed * (deltaTime / 1000);
        } else {
            newX = unit.x - unit.speed * (deltaTime / 1000);
        }
        
        if (!this.checkCollision(newX, unit.y, unit)) {
            unit.x = newX;
        } else {
            const smallerStep = unit.speed * (deltaTime / 1000) * 0.3;
            const smallerX = unit.owner === 'player' ? 
                unit.x + smallerStep : unit.x - smallerStep;
            if (!this.checkCollision(smallerX, unit.y, unit)) {
                unit.x = smallerX;
            }
        }
        
        this.updateVisualPosition(unit);
        this.checkBaseCollision(unit, battleWidth);
    },
    
    // Move unit towards target in 2D (for melee units)
    moveTowardsTarget(unit, target, deltaTime, battleWidth) {
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveAmount = unit.speed * (deltaTime / 1000);
            
            // Add small random offset 10% of the time to help unstick units
            let finalDx = dx / distance;
            let finalDy = dy / distance;
            
            if (Math.random() < 0.1) {
                const randomAngle = (Math.random() - 0.5) * 0.5; // ±0.25 radians (~14 degrees)
                const currentAngle = Math.atan2(finalDy, finalDx);
                const newAngle = currentAngle + randomAngle;
                finalDx = Math.cos(newAngle);
                finalDy = Math.sin(newAngle);
            }
            
            const newX = unit.x + finalDx * moveAmount;
            const newY = unit.y + finalDy * moveAmount;
            
            if (!this.checkCollision(newX, newY, unit)) {
                unit.x = newX;
                unit.y = newY;
            } else {
                if (!this.checkCollision(newX, unit.y, unit)) {
                    unit.x = newX;
                } else if (!this.checkCollision(unit.x, newY, unit)) {
                    unit.y = newY;
                }
            }
        }
        
        this.updateVisualPosition(unit);
        this.checkBaseCollision(unit, battleWidth);
    },
    
    // Check collision with friendly units
    checkCollision(newX, newY, movingUnit) {
        const battleUnits = gameState.units.filter(u => 
            !u.isDead && 
            u.id !== movingUnit.id && 
            u.owner === movingUnit.owner &&
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
        
        for (let other of battleUnits) {
            const dist = Math.sqrt(
                Math.pow(other.x - newX, 2) + 
                Math.pow(other.y - newY, 2)
            );
            if (dist < 8) {
                return true;
            }
        }
        
        return false;
    },
    
    // Check if unit reached enemy base
    checkBaseCollision(unit, battleWidth) {
        if (unit.owner === 'player' && unit.x >= battleWidth - 10) {
            console.log(`BASE COLLISION: ${unit.type} at x=${unit.x.toFixed(1)}, visual=${unit.element ? unit.element.style.left : 'removed'}`);
            gameState.ai.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
            gameState.ai.livesLost++;
            
            // Comeback mechanic: every 5 lives lost, upgrade all units
            if (gameState.ai.livesLost % 5 === 0) {
                const types = ['melee', 'ranged', 'caster', 'healer'];
                types.forEach(type => {
                    gameState.ai.upgradeLevels[type]++;
                });
            }
            
            console.log(`REMOVING UNIT: ${unit.type} id=${unit.id}`);
            unit.isDead = true;
            if (unit.element) {
                unit.element.remove();
                unit.element = null;
            }
        } else if (unit.owner === 'ai' && unit.x <= 10) {
            console.log(`BASE COLLISION: AI ${unit.type} at x=${unit.x.toFixed(1)}, visual=${unit.element ? unit.element.style.left : 'removed'}`);
            gameState.player.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
            gameState.player.livesLost++;
            
            // Comeback mechanic: every 5 lives lost, upgrade all units
            if (gameState.player.livesLost % 5 === 0) {
                const types = ['melee', 'ranged', 'caster', 'healer'];
                types.forEach(type => {
                    gameState.player.upgradeLevels[type]++;
                });
            }
            
            console.log(`REMOVING UNIT: AI ${unit.type} id=${unit.id}`);
            unit.isDead = true;
            if (unit.element) {
                unit.element.remove();
                unit.element = null;
            }
        }
    },
    
    // Update unit's visual position
    updateVisualPosition(unit) {
        if (unit.element) {
            unit.element.style.left = unit.x + 'px';
            unit.element.style.top = unit.y + 'px';
        }
    }
};
