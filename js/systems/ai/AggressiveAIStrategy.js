// Aggressive AI strategy - focuses on rushing with cheaper units early
class AggressiveAIStrategy extends AIStrategy {
    selectUnits(availableGold, unlockedTiers) {
        // Prefer cheaper units to spam more units
        const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
            const def = UNIT_DEFINITIONS[key];
            return unlockedTiers.includes(def.tier) && def.cost <= availableGold;
        });
        
        if (availableUnits.length === 0) return null;
        
        // Sort by cost (prefer cheaper)
        availableUnits.sort((a, b) => UNIT_DEFINITIONS[a].cost - UNIT_DEFINITIONS[b].cost);
        
        // Pick from the cheapest 40%
        const topCheap = availableUnits.slice(0, Math.max(1, Math.ceil(availableUnits.length * 0.4)));
        const randomUnit = topCheap[Math.floor(Math.random() * topCheap.length)];
        
        return UNIT_DEFINITIONS[randomUnit];
    }
    
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        if (unlockedTiers.includes(tier)) return false;
        
        const cost = tier === 2 ? 80 : 150;
        
        // Only unlock if we have plenty of gold (prefer spending on units)
        return currentGold >= cost * 2;
    }
    
    getPurchaseChance() {
        return 0.02; // 2% per frame - very aggressive
    }
}
