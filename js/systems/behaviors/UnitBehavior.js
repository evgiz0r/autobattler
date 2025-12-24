// Base unit behavior interface
class UnitBehavior {
    constructor(unit) {
        this.unit = unit;
    }
    
    update(deltaTime, currentTime, battleContext) {
        throw new Error('UnitBehavior.update() must be implemented');
    }
    
    findTarget(battleContext) {
        throw new Error('UnitBehavior.findTarget() must be implemented');
    }
}
