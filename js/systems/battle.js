// Battle system - handles combat, movement, and projectiles

function updateBattle(deltaTime, currentTime) {
    const battleWidth = DOM.battleZone.offsetWidth;
    const battleHeight = DOM.battleZone.offsetHeight;
    
    // Update all units
    for (let unit of gameState.units) {
        if (unit.isDead) continue;
        
        // Skip template units in build zones
        if (unit.element && (unit.element.parentElement === DOM.playerZone || 
                            unit.element.parentElement === DOM.aiZone)) {
            continue;
        }
        
        updateUnit(unit, deltaTime, currentTime, battleWidth);
        updateTargetLine(unit);
    }
    
    // Update projectiles
    updateProjectiles(deltaTime);
    
    // Check game over
    checkGameOver();
    
    updateUI();
}

function updateUnit(unit, deltaTime, currentTime, battleWidth) {
    // Find enemies in battle zone
    const enemies = gameState.units.filter(u => 
        !u.isDead && u.owner !== unit.owner && 
        u.element && u.element.parentElement === DOM.battleZone
    );
    
    // Clean up invalid targets (dead or not in battle anymore)
    if (unit.target && (unit.target.isDead || !enemies.includes(unit.target))) {
        unit.target = null;
    }
    
    if (enemies.length === 0) {
        // No enemies, but keep looking - don't lock this state
        moveTowardsEnemyBase(unit, deltaTime, battleWidth);
        return;
    }
    
    // Always try to find target if we don't have one (keep searching)
    if (!unit.target) {
        unit.target = findClosestEnemy(unit, enemies);
    }
    
    // If still no target after search, move forward
    if (!unit.target) {
        moveTowardsEnemyBase(unit, deltaTime, battleWidth);
        return;
    }
    
    const targetEnemy = unit.target;
    
    // Calculate actual 2D distance for attack range
    const dx = targetEnemy.x - unit.x;
    const dy = targetEnemy.y - unit.y;
    const actualDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (actualDistance > unit.attackRange) {
        // Move towards enemy (melee moves in both X and Y, ranged/caster only X)
        if (unit.type === 'melee') {
            moveTowardsEnemyMelee(unit, targetEnemy, deltaTime, battleWidth);
        } else {
            moveTowardsEnemy(unit, deltaTime, battleWidth);
        }
    } else {
        attackEnemy(unit, targetEnemy, enemies, currentTime);
    }
    
    // Update visual position
    if (unit.element) {
        unit.element.style.left = unit.x + 'px';
        unit.element.style.top = unit.y + 'px';
    }
    
    // Update cooldown bar
    unit.updateCooldownBar(currentTime);
}

function findClosestEnemy(unit, enemies) {
    if (!enemies || enemies.length === 0) return null;
    
    let closestEnemy = null;
    let closestDist = Infinity;
    
    for (let enemy of enemies) {
        // Use 2D distance for finding closest enemy
        const dx = enemy.x - unit.x;
        const dy = enemy.y - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
        }
    }
    
    return closestEnemy;
}

function moveTowardsEnemyBase(unit, deltaTime, battleWidth) {
    // Move horizontally only
    let newX = unit.x;
    if (unit.owner === 'player') {
        newX = unit.x + unit.speed * (deltaTime / 1000);
    } else {
        newX = unit.x - unit.speed * (deltaTime / 1000);
    }
    
    // Check collision before moving
    if (!checkBattlefieldCollision(newX, unit.y, unit)) {
        unit.x = newX;
    }
    
    // Check if reached enemy base
    if (unit.owner === 'player' && unit.x >= battleWidth - 10) {
        gameState.ai.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
        unit.isDead = true;
        if (unit.element) unit.element.remove();
    } else if (unit.owner === 'ai' && unit.x <= 10) {
        gameState.player.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
        unit.isDead = true;
        if (unit.element) unit.element.remove();
    }
    
    // Update position
    if (unit.element) {
        unit.element.style.left = unit.x + 'px';
        unit.element.style.top = unit.y + 'px';
    }
}

function checkBattlefieldCollision(newX, newY, movingUnit) {
    // Check collision only with friendly units (same team)
    const battleUnits = gameState.units.filter(u => 
        !u.isDead && 
        u.id !== movingUnit.id && 
        u.owner === movingUnit.owner && // Only check same team
        u.element && 
        u.element.parentElement === DOM.battleZone
    );
    
    for (let other of battleUnits) {
        const dist = Math.sqrt(
            Math.pow(other.x - newX, 2) + 
            Math.pow(other.y - newY, 2)
        );
        if (dist < 8) { // Very small collision radius
            return true; // Collision detected
        }
    }
    
    return false; // No collision
}

function moveTowardsEnemyMelee(unit, target, deltaTime, battleWidth) {
    // Melee units move in both X and Y to reach their target
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const moveAmount = unit.speed * (deltaTime / 1000);
        const newX = unit.x + (dx / distance) * moveAmount;
        const newY = unit.y + (dy / distance) * moveAmount;
        
        // Try to move, if collision try partial movement
        if (!checkBattlefieldCollision(newX, newY, unit)) {
            unit.x = newX;
            unit.y = newY;
        } else {
            // Try moving only in X direction
            if (!checkBattlefieldCollision(newX, unit.y, unit)) {
                unit.x = newX;
            } else if (!checkBattlefieldCollision(unit.x, newY, unit)) {
                // Try moving only in Y direction
                unit.y = newY;
            }
        }
    }
    
    // Check if reached enemy base
    if (unit.owner === 'player' && unit.x >= battleWidth - 10) {
        gameState.ai.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
        unit.isDead = true;
        if (unit.element) {
            unit.element.remove();
            unit.element = null;
        }
    } else if (unit.owner === 'ai' && unit.x <= 10) {
        gameState.player.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
        unit.isDead = true;
        if (unit.element) {
            unit.element.remove();
            unit.element = null;
        }
    }
}

function moveTowardsEnemy(unit, deltaTime, battleWidth) {
    // Move horizontally only to maintain lanes (ranged/caster)
    let newX = unit.x;
    if (unit.owner === 'player') {
        newX = unit.x + unit.speed * (deltaTime / 1000);
    } else {
        newX = unit.x - unit.speed * (deltaTime / 1000);
    }
    
    // Try to move, allow movement even with slight collision
    if (!checkBattlefieldCollision(newX, unit.y, unit)) {
        unit.x = newX;
    } else {
        // Try smaller step if blocked
        const smallerStep = unit.speed * (deltaTime / 1000) * 0.3;
        const smallerX = unit.owner === 'player' ? 
            unit.x + smallerStep : 
            unit.x - smallerStep;
        if (!checkBattlefieldCollision(smallerX, unit.y, unit)) {
            unit.x = smallerX;
        }
    }
    
    // Check if reached enemy base during movement
    if (unit.owner === 'player' && unit.x >= battleWidth - 10) {
        gameState.ai.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
        unit.isDead = true;
        if (unit.element) {
            unit.element.remove();
            unit.element = null;
        }
    } else if (unit.owner === 'ai' && unit.x <= 10) {
        gameState.player.health -= GAME_CONFIG.BASE_DAMAGE_TO_CORE;
        unit.isDead = true;
        if (unit.element) {
            unit.element.remove();
            unit.element = null;
        }
    }
}

function attackEnemy(unit, closestEnemy, enemies, currentTime) {
    if (!unit.canAttack(currentTime)) return;
    
    unit.attack(currentTime);
    
    if (unit.type === 'melee') {
        handleMeleeAttack(unit, closestEnemy);
    } else if (unit.type === 'ranged') {
        createProjectile(unit, closestEnemy);
    } else if (unit.type === 'caster') {
        handleCasterAttack(unit, closestEnemy, enemies);
    }
}

function handleMeleeAttack(unit, target) {
    // Create melee attack animation
    const meleeEffect = document.createElement('div');
    meleeEffect.style.position = 'absolute';
    meleeEffect.style.left = (target.x - 15) + 'px';
    meleeEffect.style.top = (target.y - 15) + 'px';
    meleeEffect.style.width = '30px';
    meleeEffect.style.height = '30px';
    meleeEffect.style.border = '3px solid #e74c3c';
    meleeEffect.style.borderRadius = '50%';
    meleeEffect.style.backgroundColor = 'rgba(231, 76, 60, 0.4)';
    meleeEffect.style.pointerEvents = 'none';
    meleeEffect.style.animation = 'melee-hit 0.2s ease-out';
    DOM.battleZone.appendChild(meleeEffect);
    
    setTimeout(() => meleeEffect.remove(), 200);
    
    const wasDead = target.hp <= 0;
    target.takeDamage(unit.damage);
    
    if (!wasDead && target.hp <= 0) {
        awardKillGold(target.tier, unit.owner);
    }
}

function handleCasterAttack(unit, target, enemies) {
    // Create AOE visual effect
    const aoeEffect = document.createElement('div');
    aoeEffect.style.position = 'absolute';
    aoeEffect.style.left = (target.x - unit.aoeRadius) + 'px';
    aoeEffect.style.top = (target.y - unit.aoeRadius) + 'px';
    aoeEffect.style.width = (unit.aoeRadius * 2) + 'px';
    aoeEffect.style.height = (unit.aoeRadius * 2) + 'px';
    aoeEffect.style.border = '2px solid #9b59b6';
    aoeEffect.style.borderRadius = '50%';
    aoeEffect.style.backgroundColor = 'rgba(155, 89, 182, 0.3)';
    aoeEffect.style.pointerEvents = 'none';
    aoeEffect.style.animation = 'pulse 0.3s ease-out';
    DOM.battleZone.appendChild(aoeEffect);
    
    setTimeout(() => aoeEffect.remove(), 300);
    
    // Max targets based on tier: T1=2, T2=3, T3=4
    const maxTargets = unit.tier + 1;
    let targetsHit = 0;
    
    // Find enemies in AOE radius and sort by distance
    const enemiesInRange = [];
    for (let enemy of enemies) {
        const dist = Math.sqrt(
            Math.pow(enemy.x - target.x, 2) + 
            Math.pow(enemy.y - target.y, 2)
        );
        
        if (dist <= unit.aoeRadius) {
            enemiesInRange.push({ enemy, dist });
        }
    }
    
    // Sort by distance (closest first) and hit up to maxTargets
    enemiesInRange.sort((a, b) => a.dist - b.dist);
    
    for (let i = 0; i < Math.min(maxTargets, enemiesInRange.length); i++) {
        const enemy = enemiesInRange[i].enemy;
        const wasDead = enemy.hp <= 0;
        enemy.takeDamage(unit.damage);
        
        if (!wasDead && enemy.hp <= 0) {
            awardKillGold(enemy.tier, unit.owner);
        }
        targetsHit++;
    }
}

function updateTargetLine(unit) {
    if (gameState.showTargetLines && 
        unit.target && 
        !unit.target.isDead && 
        unit.element && 
        unit.element.parentElement === DOM.battleZone) {
        
        if (!unit.targetLine) {
            unit.targetLine = document.createElement('div');
            unit.targetLine.className = 'target-line';
            DOM.battleZone.appendChild(unit.targetLine);
        }
        
        // Calculate line position and rotation
        const dx = unit.target.x - unit.x;
        const dy = unit.target.y - unit.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        unit.targetLine.style.width = length + 'px';
        unit.targetLine.style.left = unit.x + 'px';
        unit.targetLine.style.top = unit.y + 'px';
        unit.targetLine.style.transform = `rotate(${angle}deg)`;
        unit.targetLine.style.transformOrigin = '0 0';
    } else {
        // Clean up line if it shouldn't be shown
        if (unit.targetLine) {
            unit.targetLine.remove();
            unit.targetLine = null;
        }
    }
}

function createProjectile(unit, target) {
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
}

function updateProjectiles(deltaTime) {
    gameState.projectiles = gameState.projectiles.filter(proj => {
        // Set initial direction on first update (move in straight line, not tracking)
        if (!proj.angle) {
            const dx = proj.target.x - proj.x;
            const dy = proj.target.y - proj.y;
            proj.angle = Math.atan2(dy, dx);
            proj.spawnX = proj.x;
            proj.spawnY = proj.y;
            proj.hitUnits = new Set();
            proj.pierceLimit = proj.tier + 1; // T1=2, T2=3, T3=4
            proj.hitCount = 0;
        }
        
        // Move projectile in straight line
        proj.x += Math.cos(proj.angle) * GAME_CONFIG.PROJECTILE_SPEED * (deltaTime / 1000);
        proj.y += Math.sin(proj.angle) * GAME_CONFIG.PROJECTILE_SPEED * (deltaTime / 1000);
        
        // Check all enemies for piercing damage
        const enemies = gameState.units.filter(u => 
            !u.isDead && 
            u.owner !== proj.owner && 
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
        
        for (let enemy of enemies) {
            // Skip if already hit this enemy
            if (proj.hitUnits.has(enemy.id)) continue;
            
            const dx = enemy.x - proj.x;
            const dy = enemy.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Check if hit this enemy
            if (dist < 12) {
                const wasDead = enemy.hp <= 0;
                enemy.takeDamage(proj.damage);
                
                if (!wasDead && enemy.hp <= 0) {
                    awardKillGold(enemy.tier, proj.owner);
                }
                
                // Mark this unit as hit
                proj.hitUnits.add(enemy.id);
                proj.hitCount++;
                
                // Remove projectile if hit limit reached
                if (proj.hitCount >= proj.pierceLimit) {
                    if (proj.element) {
                        proj.element.remove();
                        proj.element = null;
                    }
                    return false;
                }
            }
        }
        
        if (proj.element) {
            proj.element.style.left = proj.x + 'px';
            proj.element.style.top = proj.y + 'px';
        }
        
        // Calculate distance traveled from spawn point
        const distTraveled = Math.sqrt(
            Math.pow(proj.x - proj.spawnX, 2) + 
            Math.pow(proj.y - proj.spawnY, 2)
        );
        
        // Remove if traveled too far (beyond screen)
        if (distTraveled > 800) {
            if (proj.element) {
                proj.element.remove();
                proj.element = null;
            }
            return false;
        }
        
        return true;
    });
}

function checkGameOver() {
    if (gameState.player.health <= 0 || gameState.ai.health <= 0) {
        alert(gameState.player.health > 0 ? 'You Win!' : 'You Lose!');
        location.reload();
    }
}
