// Random AI strategy - buys random units
class RandomAIStrategy extends AIStrategy {
    selectUnits(availableGold, unlockedTiers) {
        const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
            const def = UNIT_DEFINITIONS[key];
            return unlockedTiers.includes(def.tier) && def.cost <= availableGold;
        });
        
        if (availableUnits.length === 0) return null;
        
        const randomUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
        return UNIT_DEFINITIONS[randomUnit];
    }
    
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        if (unlockedTiers.includes(tier)) return false;
        
        const cost = tier === 2 ? 80 : 150;
        
        if (currentGold >= cost) {
            return Math.random() > 0.5;
        }
        
        return false;
    }
    
    getPurchaseChance() {
        return 0.01; // 1% per frame
    }
}
