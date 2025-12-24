// Balanced AI strategy - tries to maintain a good unit composition
class BalancedAIStrategy extends AIStrategy {
    constructor(difficulty = 'normal') {
        super(difficulty);
        this.desiredComposition = {
            melee: 0.4,
            ranged: 0.35,
            caster: 0.15,
            healer: 0.1
        };
    }
    
    selectUnits(availableGold, unlockedTiers) {
        const aiUnits = gameState.units.filter(u => 
            u.owner === 'ai' && 
            u.element && 
            u.element.parentElement === DOM.aiZone
        );
        
        // Count current composition
        const composition = {
            melee: 0,
            ranged: 0,
            caster: 0,
            healer: 0
        };
        
        aiUnits.forEach(u => {
            if (composition.hasOwnProperty(u.type)) {
                composition[u.type]++;
            }
        });
        
        const total = aiUnits.length || 1;
        
        // Find which type is most lacking
        let mostNeeded = 'melee';
        let biggestDeficit = -Infinity;
        
        for (let type in this.desiredComposition) {
            const currentRatio = composition[type] / total;
            const deficit = this.desiredComposition[type] - currentRatio;
            if (deficit > biggestDeficit) {
                biggestDeficit = deficit;
                mostNeeded = type;
            }
        }
        
        // Find highest tier unit of the needed type that we can afford
        const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
            const def = UNIT_DEFINITIONS[key];
            return def.type === mostNeeded && 
                   unlockedTiers.includes(def.tier) && 
                   def.cost <= availableGold;
        });
        
        if (availableUnits.length === 0) {
            // Fallback to any unit
            const anyUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
                const def = UNIT_DEFINITIONS[key];
                return unlockedTiers.includes(def.tier) && def.cost <= availableGold;
            });
            
            if (anyUnits.length === 0) return null;
            
            const randomUnit = anyUnits[Math.floor(Math.random() * anyUnits.length)];
            return UNIT_DEFINITIONS[randomUnit];
        }
        
        // Sort by tier (prefer higher tier)
        availableUnits.sort((a, b) => UNIT_DEFINITIONS[b].tier - UNIT_DEFINITIONS[a].tier);
        
        return UNIT_DEFINITIONS[availableUnits[0]];
    }
    
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        if (unlockedTiers.includes(tier)) return false;
        
        const cost = tier === 2 ? 80 : 150;
        
        // More aggressive unlocking based on difficulty
        const threshold = this.difficulty === 'hard' ? 1.2 : 1.5;
        
        return currentGold >= cost * threshold;
    }
    
    getPurchaseChance() {
        if (this.difficulty === 'easy') return 0.005;
        if (this.difficulty === 'hard') return 0.015;
        return 0.01; // normal
    }
}
