// Ranged unit behavior - maintains distance and shoots projectiles
class RangedBehavior extends UnitBehavior {
    update(deltaTime, currentTime, battleContext) {
        const enemies = battleContext.getEnemies(this.unit.owner);
        
        if (enemies.length === 0) {
            MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
            return;
        }
        
        // Clear target if it's dead, not in enemies list, or invulnerable
        if (this.unit.target && (this.unit.target.isDead || !enemies.includes(this.unit.target) || this.unit.target.isInvulnerable(currentTime))) {
            this.unit.target = null;
        }
        
        if (!this.unit.target) {
            this.unit.target = this.findTarget(battleContext);
        }
        
        if (!this.unit.target) {
            MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
            return;
        }
        
        const distance = MathUtils.distance2D(this.unit, this.unit.target);
        
        if (distance > this.unit.attackRange) {
            // Move towards target in 2D to get within range
            MovementSystem.moveTowardsTarget(this.unit, this.unit.target, deltaTime, battleContext.battleWidth);
        } else {
            CombatSystem.performRangedAttack(this.unit, this.unit.target, currentTime);
        }
    }
    
    findTarget(battleContext) {
        const enemies = battleContext.getEnemies(this.unit.owner);
        // Filter out invulnerable enemies
        const targetableEnemies = enemies.filter(e => !e.isInvulnerable(performance.now()));
        return CombatSystem.findClosestEnemy(this.unit, targetableEnemies);
    }
}
