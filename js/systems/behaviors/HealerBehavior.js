// Healer unit behavior - heals allies within range
class HealerBehavior extends UnitBehavior {
    update(deltaTime, currentTime, battleContext) {
        // Clear target if it's fully healed or dead
        if (this.unit.target && (this.unit.target.isDead || this.unit.target.hp >= this.unit.target.maxHp)) {
            this.unit.target = null;
        }
        
        // Find closest wounded ally
        const closestAlly = this.findTarget(battleContext);
        
        if (!closestAlly) {
            // No wounded allies, move towards base
            MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
            return;
        }
        
        const distance = MathUtils.distance2D(this.unit, closestAlly);
        
        // Move towards wounded ally if out of range, stop if in range
        if (distance > this.unit.attackRange) {
            // Set target for movement
            this.unit.target = closestAlly;
            MovementSystem.moveTowardsTarget(this.unit, closestAlly, deltaTime, battleContext.battleWidth);
        } else {
            // In range, heal and stay in position
            const allies = battleContext.getAllies(this.unit.owner).filter(u => 
                u.id !== this.unit.id && u.hp < u.maxHp
            );
            
            // Filter allies within range
            const alliesInRange = allies.filter(ally => {
                const dist = MathUtils.distance2D(this.unit, ally);
                return dist <= this.unit.attackRange;
            });
            
            if (alliesInRange.length > 0) {
                // Heal allies in range
                this.healAllies(allies, currentTime);
            } else {
                // No wounded allies in range, move forward
                MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
            }
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
        if (currentTime - this.unit.lastAttackTime < this.unit.attackCooldown) {
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
