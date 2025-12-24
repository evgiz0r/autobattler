// Caster unit behavior - casts AOE spells at enemies
class CasterBehavior extends UnitBehavior {
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
            MovementSystem.moveHorizontally(this.unit, deltaTime, battleContext.battleWidth, this.unit.target);
        } else {
            CombatSystem.performCasterAttack(this.unit, this.unit.target, enemies, currentTime);
        }
    }
    
    findTarget(battleContext) {
        const enemies = battleContext.getEnemies(this.unit.owner);
        return CombatSystem.findClosestEnemy(this.unit, enemies);
    }
}
