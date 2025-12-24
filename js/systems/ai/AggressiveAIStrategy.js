// Aggressive AI strategy - focuses on rushing with cheaper units early
class AggressiveAIStrategy extends AIStrategy {
    selectUnits(availableGold, unlockedTiers) {
        // Aggressive AI: favor HIGHEST tier units to overwhelm quickly
        const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
            const def = UNIT_DEFINITIONS[key];
            return unlockedTiers.includes(def.tier) && def.cost <= availableGold;
        });
        
        if (availableUnits.length === 0) return null;
        
        // Sort by tier (HIGHEST first) - dramatically favor high tier
        availableUnits.sort((a, b) => UNIT_DEFINITIONS[b].tier - UNIT_DEFINITIONS[a].tier);
        
        // 90% chance to pick highest tier available
        if (Math.random() < 0.9) {
            return UNIT_DEFINITIONS[availableUnits[0]];
        }
        
        // Pick from top 30% (highest tiers)
        const topTier = availableUnits.slice(0, Math.max(1, Math.ceil(availableUnits.length * 0.3)));
        const randomUnit = topTier[Math.floor(Math.random() * topTier.length)];
        
        return UNIT_DEFINITIONS[randomUnit];
    }
    
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        if (unlockedTiers.includes(tier)) return false;
        
        const costs = {
            2: 80, 3: 150, 4: 250, 5: 400, 6: 650, 7: 1000
        };
        const cost = costs[tier];
        
        // Very aggressive unlocking - want highest tiers ASAP
        return currentGold >= cost * 1.1;
    }
    
    getPurchaseChance() {
        return 0.02; // 2% per frame - very aggressive
    }
}
