// AI Strategy interface
class AIStrategy {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
    }
    
    // Decide which units to purchase
    selectUnits(availableGold, unlockedTiers) {
        throw new Error('AIStrategy.selectUnits() must be implemented');
    }
    
    // Decide when to unlock tiers
    shouldUnlockTier(currentGold, tier, unlockedTiers) {
        throw new Error('AIStrategy.shouldUnlockTier() must be implemented');
    }
    
    // Get purchase frequency (chance per frame)
    getPurchaseChance() {
        throw new Error('AIStrategy.getPurchaseChance() must be implemented');
    }
}
