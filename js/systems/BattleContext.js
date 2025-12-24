// Battle context - provides filtered unit lists and battle info
const BattleContext = {
    get battleWidth() {
        return DOM.battleZone.offsetWidth;
    },
    
    get battleHeight() {
        return DOM.battleZone.offsetHeight;
    },
    
    // Get all enemies for a specific owner
    getEnemies(owner) {
        return gameState.units.filter(u => 
            !u.isDead && 
            u.owner !== owner && 
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
    },
    
    // Get all allies for a specific owner
    getAllies(owner) {
        return gameState.units.filter(u => 
            !u.isDead && 
            u.owner === owner && 
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
    },
    
    // Get all units in battle zone
    getBattleUnits() {
        return gameState.units.filter(u => 
            !u.isDead && 
            u.element && 
            u.element.parentElement === DOM.battleZone
        );
    }
};
