// Melee unit behavior - moves in 2D towards target and attacks in melee range
class MeleeBehavior extends UnitBehavior {
    update(deltaTime, currentTime, battleContext) {
        const enemies = battleContext.getEnemies(this.unit.owner);
        
        if (enemies.length === 0) {
            MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
            return;
        }
        
        if (!this.unit.target || this.unit.target.isDead || !enemies.includes(this.unit.target)) {
            this.unit.target = this.findTarget(battleContext);
        }
        
        if (!this.unit.target) {
            MovementSystem.moveTowardsBase(this.unit, deltaTime, battleContext.battleWidth);
            return;
        }
        
        const distance = MathUtils.distance2D(this.unit, this.unit.target);
        
        if (distance > this.unit.attackRange) {
            MovementSystem.moveTowardsTarget(this.unit, this.unit.target, deltaTime, battleContext.battleWidth);
        } else {
            CombatSystem.performMeleeAttack(this.unit, this.unit.target, currentTime);
        }
    }
    
    findTarget(battleContext) {
        const enemies = battleContext.getEnemies(this.unit.owner);
        return CombatSystem.findClosestEnemy(this.unit, enemies);
    }
}
