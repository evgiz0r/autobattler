// Projectile system for managing ranged attack projectiles
const ProjectileSystem = {
    // Create a new projectile
    createProjectile(unit, target) {
        const proj = {
            x: unit.x,
            y: unit.y,
            target: target,
            damage: unit.damage,
            owner: unit.owner,
            element: null,
            createdAt: performance.now()
        };
        
        const el = document.createElement('div');
        el.className = 'projectile';
        el.style.left = proj.x + 'px';
        el.style.top = proj.y + 'px';
        DOM.battleZone.appendChild(el);
        
        proj.element = el;
        gameState.projectiles.push(proj);
    },
    
    // Update all projectiles
    updateProjectiles(deltaTime) {
        gameState.projectiles = gameState.projectiles.filter(proj => {
            // Set initial direction on first update
            if (!proj.angle) {
                const dx = proj.target.x - proj.x;
                const dy = proj.target.y - proj.y;
                proj.angle = Math.atan2(dy, dx);
                proj.spawnX = proj.x;
                proj.spawnY = proj.y;
                proj.hitUnits = new Set();
                proj.pierceLimit = proj.tier + 1;
                proj.hitCount = 0;
            }
            
            // Store old position for swept collision detection
            const oldX = proj.x;
            const oldY = proj.y;
            
            // Move projectile in straight line
            proj.x += Math.cos(proj.angle) * GAME_CONFIG.PROJECTILE_SPEED * (deltaTime / 1000);
            proj.y += Math.sin(proj.angle) * GAME_CONFIG.PROJECTILE_SPEED * (deltaTime / 1000);
            
            // Check collision with enemies (using swept collision)
            if (this.checkProjectileHits(proj, oldX, oldY)) {
                return false; // Remove projectile if hit limit reached
            }
            
            // Update visual position
            if (proj.element) {
                proj.element.style.left = proj.x + 'px';
                proj.element.style.top = proj.y + 'px';
            }
            
            // Remove if traveled too far
            const distTraveled = Math.sqrt(
                Math.pow(proj.x - proj.spawnX, 2) + 
                Math.pow(proj.y - proj.spawnY, 2)
            );
            
            if (distTraveled > 800) {
                if (proj.element) proj.element.remove();
                return false;
            }
            
            return true;
        });
    },
    
    // Check if projectile hit any enemies (piercing logic with swept collision)
    checkProjectileHits(proj, oldX, oldY) {
        const enemies = gameState.units.filter(u => 
            !u.isDead && 
            u.owner !== proj.owner && 
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
        
        for (let enemy of enemies) {
            if (proj.hitUnits.has(enemy.id)) continue;
            
            // Use swept collision: check if line segment from old to new position intersects enemy
            const closestPoint = this.closestPointOnLine(oldX, oldY, proj.x, proj.y, enemy.x, enemy.y);
            const dist = Math.sqrt(
                Math.pow(closestPoint.x - enemy.x, 2) + 
                Math.pow(closestPoint.y - enemy.y, 2)
            );
            
            if (dist < 15) { // Slightly larger hit radius for swept collision
                // Play hit sound
                SoundSystem.playHit();
                
                const wasDead = enemy.hp <= 0;
                enemy.takeDamage(proj.damage);
                
                if (!wasDead && enemy.hp <= 0) {
                    CombatSystem.awardKillGold(enemy.upgradeLevel || 0, proj.owner);
                }
                
                proj.hitUnits.add(enemy.id);
                proj.hitCount++;
                
                if (proj.hitCount >= proj.pierceLimit) {
                    if (proj.element) {
                        proj.element.remove();
                        proj.element = null;
                    }
                    return true; // Signal to remove projectile
                }
            }
        }
        
        return false;
    },
    
    // Find closest point on line segment to a target point (for swept collision)
    closestPointOnLine(x1, y1, x2, y2, px, py) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            return { x: x1, y: y1 };
        }
        
        // Calculate parameter t for closest point
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
        
        return {
            x: x1 + t * dx,
            y: y1 + t * dy
        };
    },
    
    // Clean up old projectiles
    cleanupOldProjectiles(currentTime) {
        gameState.projectiles = gameState.projectiles.filter(proj => {
            if (!proj.createdAt) proj.createdAt = currentTime;
            if (currentTime - proj.createdAt > GAME_CONFIG.PROJECTILE_MAX_AGE) {
                if (proj.element) proj.element.remove();
                return false;
            }
            return true;
        });
    }
};
