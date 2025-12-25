// Healer unit behavior - heals allies within range
class HealerBehavior extends UnitBehavior {
    update(deltaTime, currentTime, battleContext) {
        // Always move towards base - healers only heal allies they pass, don't chase backwards
        MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
        
        // Find wounded allies in range and heal them
        const allies = battleContext.getAllies(this.unit.owner).filter(u => 
            u.id !== this.unit.id && u.hp < u.maxHp
        );
        
        // Filter allies within range
        const alliesInRange = allies.filter(ally => {
            const dist = MathUtils.distance2D(this.unit, ally);
            return dist <= this.unit.attackRange;
        });
        
        if (alliesInRange.length > 0) {
            // Heal allies in range while continuing to move forward
            this.healAllies(allies, currentTime);
        }
    }
    
    findTarget(battleContext) {
        const allies = battleContext.getAllies(this.unit.owner).filter(u => 
            u.id !== this.unit.id && u.hp < u.maxHp
        );
        
        if (allies.length === 0) return null;
        
        let closest = null;
        let minDist = Infinity;
        
        for (let ally of allies) {
            const dist = MathUtils.distance2D(this.unit, ally);
            if (dist < minDist) {
                minDist = dist;
                closest = ally;
            }
        }
        
        return closest;
    }
    
    healAllies(allies, currentTime) {
        const effectiveCooldown = this.unit.attackCooldown / gameState.gameSpeed;
        if (currentTime - this.unit.lastAttackTime < effectiveCooldown) {
            return;
        }
        
        this.unit.lastAttackTime = currentTime;
        
        // Filter allies within range
        const alliesInRange = allies.filter(ally => {
            const dist = MathUtils.distance2D(this.unit, ally);
            return dist <= this.unit.attackRange;
        });
        
        if (alliesInRange.length === 0) return;
        
        // Sort by HP percentage and distance
        const sortedAllies = alliesInRange.slice().sort((a, b) => {
            const hpPercentA = a.hp / a.maxHp;
            const hpPercentB = b.hp / b.maxHp;
            
            if (Math.abs(hpPercentA - hpPercentB) > 0.1) {
                return hpPercentA - hpPercentB;
            }
            
            const distA = MathUtils.distance2D(a, this.unit);
            const distB = MathUtils.distance2D(b, this.unit);
            return distA - distB;
        });
        
        // Heal up to maxTargets
        const targetsToHeal = Math.min(this.unit.maxTargets, sortedAllies.length);
        
        for (let i = 0; i < targetsToHeal; i++) {
            const ally = sortedAllies[i];
            ally.hp = Math.min(ally.hp + this.unit.healAmount, ally.maxHp);
            
            if (ally.element) {
                const healthBar = ally.element.querySelector('.health-bar-fill');
                if (healthBar) {
                    const healthPercent = (ally.hp / ally.maxHp) * 100;
                    healthBar.style.width = healthPercent + '%';
                }
            }
        }
    }
}
