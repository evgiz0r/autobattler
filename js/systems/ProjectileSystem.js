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
            tier: unit.tier,
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
            
            // Move projectile in straight line
            proj.x += Math.cos(proj.angle) * GAME_CONFIG.PROJECTILE_SPEED * (deltaTime / 1000);
            proj.y += Math.sin(proj.angle) * GAME_CONFIG.PROJECTILE_SPEED * (deltaTime / 1000);
            
            // Check collision with enemies
            if (this.checkProjectileHits(proj)) {
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
    
    // Check if projectile hit any enemies (piercing logic)
    checkProjectileHits(proj) {
        const enemies = gameState.units.filter(u => 
            !u.isDead && 
            u.owner !== proj.owner && 
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
        
        for (let enemy of enemies) {
            if (proj.hitUnits.has(enemy.id)) continue;
            
            const dist = MathUtils.distance2D(proj, enemy);
            
            if (dist < 12) {
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
