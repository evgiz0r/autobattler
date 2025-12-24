// Combat system for attack and damage logic
const CombatSystem = {
    // Find closest enemy to a unit
    findClosestEnemy(unit, enemies) {
        if (!enemies || enemies.length === 0) return null;
        
        let closestEnemy = null;
        let closestDist = Infinity;
        
        for (let enemy of enemies) {
            const dist = MathUtils.distance2D(unit, enemy);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy;
    },
    
    // Perform melee attack
    performMeleeAttack(unit, target, currentTime) {
        if (!unit.canAttack(currentTime)) return;
        
        unit.attack(currentTime);
        
        // Create visual effect
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
            this.awardKillGold(target.tier, unit.owner);
        }
    },
    
    // Perform ranged attack (creates projectile)
    performRangedAttack(unit, target, currentTime) {
        if (!unit.canAttack(currentTime)) return;
        
        unit.attack(currentTime);
        ProjectileSystem.createProjectile(unit, target);
    },
    
    // Perform caster AOE attack
    performCasterAttack(unit, target, enemies, currentTime) {
        if (!unit.canAttack(currentTime)) return;
        
        unit.attack(currentTime);
        
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
        
        // Max targets based on tier
        const maxTargets = unit.tier + 1;
        
        // Find enemies in AOE radius
        const enemiesInRange = [];
        for (let enemy of enemies) {
            const dist = MathUtils.distance2D({ x: target.x, y: target.y }, enemy);
            if (dist <= unit.aoeRadius) {
                enemiesInRange.push({ enemy, dist });
            }
        }
        
        // Sort by distance and hit up to maxTargets
        enemiesInRange.sort((a, b) => a.dist - b.dist);
        
        for (let i = 0; i < Math.min(maxTargets, enemiesInRange.length); i++) {
            const enemy = enemiesInRange[i].enemy;
            const wasDead = enemy.hp <= 0;
            enemy.takeDamage(unit.damage);
            
            if (!wasDead && enemy.hp <= 0) {
                this.awardKillGold(enemy.tier, unit.owner);
            }
        }
    },
    
    // Award gold for killing an enemy
    awardKillGold(enemyTier, attackerOwner) {
        if (attackerOwner === 'player') {
            const goldAmount = GAME_CONFIG.KILL_GOLD_BASE + (enemyTier * GAME_CONFIG.KILL_GOLD_PER_TIER);
            gameState.player.gold += goldAmount;
        }
    }
};
