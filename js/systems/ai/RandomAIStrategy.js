// Random AI strategy - buys random units
class RandomAIStrategy extends AIStrategy {
    selectUnits(availableGold, unlockedTiers) {
        const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
            const def = UNIT_DEFINITIONS[key];
            return unlockedTiers.includes(def.tier) && def.cost <= availableGold;
        });
        
        if (availableUnits.length === 0) return null;
        
        // Heavily favor higher tier units (80% chance for highest tier)
        availableUnits.sort((a, b) => UNIT_DEFINITIONS[b].tier - UNIT_DEFINITIONS[a].tier);
        
        if (Math.random() < 0.8 && availableUnits.length > 0) {
            // Pick from top 20% (highest tiers)
            const topTier = availableUnits.slice(0, Math.max(1, Math.ceil(availableUnits.length * 0.2)));
            const randomUnit = topTier[Math.floor(Math.random() * topTier.length)];
            return UNIT_DEFINITIONS[randomUnit];
        }
        
        const randomUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
        return UNIT_DEFINITIONS[randomUnit];
    }
    
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        if (unlockedTiers.includes(tier)) return false;
        
        const costs = {
            2: 80, 3: 150, 4: 250, 5: 400, 6: 650, 7: 1000
        };
        const cost = costs[tier];
        
        if (currentGold >= cost) {
            return Math.random() > 0.3; // 70% chance to unlock
        }
        
        return false;
    }
    
    getPurchaseChance() {
        return 0.01; // 1% per frame
    }
}
