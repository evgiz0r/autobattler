// Economy system - handles gold generation and rewards

function updatePassiveGold(deltaTime) {
    // Only generate gold if game has started
    if (!gameState.firstUnitPlaced) return;
    
    gameState.passiveGoldTimer += deltaTime;
    if (gameState.passiveGoldTimer >= GAME_CONFIG.PASSIVE_GOLD_INTERVAL) {
        const baseGold = GAME_CONFIG.PASSIVE_GOLD_AMOUNT;
        const economyBonus = gameState.player.economyLevel || 0;
        const tierBonus = gameState.player.unlockedTiers.length - 1; // +1 per tier unlocked (tier 1 is free)
        const aiTierBonus = gameState.ai.unlockedTiers.length - 1;
        
        gameState.player.gold += baseGold + economyBonus + tierBonus;
        const difficultyMultiplier = (GAME_CONFIG.DIFFICULTY[gameState.difficulty] || GAME_CONFIG.DIFFICULTY.MEDIUM).multiplier;
        gameState.ai.gold += Math.round((baseGold + aiTierBonus) * difficultyMultiplier);
        gameState.passiveGoldTimer = 0;
    }
}

function awardKillGold(tier, owner) {
    const goldAmount = GAME_CONFIG.KILL_GOLD_BASE + (tier * GAME_CONFIG.KILL_GOLD_PER_TIER);
    if (owner === 'player') {
        gameState.player.gold += goldAmount;
    } else {
        const difficultyMultiplier = (GAME_CONFIG.DIFFICULTY[gameState.difficulty] || GAME_CONFIG.DIFFICULTY.MEDIUM).multiplier;
        gameState.ai.gold += Math.round(goldAmount * difficultyMultiplier);
    }
}

function awardRoundGold() {
    const goldAmount = GAME_CONFIG.ROUND_GOLD_BASE + (gameState.round * GAME_CONFIG.ROUND_GOLD_PER_ROUND);
    gameState.player.gold += goldAmount;
    const difficultyMultiplier = (GAME_CONFIG.DIFFICULTY[gameState.difficulty] || GAME_CONFIG.DIFFICULTY.MEDIUM).multiplier;
    gameState.ai.gold += Math.round(goldAmount * difficultyMultiplier);
}

function checkAutoUnlockTiers() {
    // Auto-unlock tiers based on rounds: Tier 2 at round 5, Tier 3 at round 10, etc.
    for (let tier = 2; tier <= 7; tier++) {
        const unlockRound = (tier - 1) * 5;
        
        if (gameState.round >= unlockRound && !gameState.player.unlockedTiers.includes(tier)) {
            gameState.player.unlockedTiers.push(tier);
            ShopManager.unlockTier(tier);
            console.log(`Tier ${tier} unlocked at round ${gameState.round}!`);
        }
        
        if (gameState.round >= unlockRound && !gameState.ai.unlockedTiers.includes(tier)) {
            gameState.ai.unlockedTiers.push(tier);
        }
    }
    
    // Update countdown displays
    ShopManager.updateCountdowns();
}

function upgradeEconomy() {
    const level = gameState.player.economyLevel || 0;
    const baseCost = 50;
    const upgradeCost = baseCost + (level * 25); // 50, 75, 100, 125, 150, ...
    
    if (gameState.player.gold < upgradeCost) {
        console.log('Not enough gold for economy upgrade');
        return;
    }
    
    gameState.player.gold -= upgradeCost;
    gameState.player.economyLevel++;
    
    // Update UI button
    const btn = document.getElementById('economy-upgrade-btn');
    const nextCost = baseCost + (gameState.player.economyLevel * 25);
    btn.textContent = `Economy +1g/s (${nextCost}g)`;
    
    console.log(`Economy upgraded! Now +${gameState.player.economyLevel}g/s`);
    updateUI();
}

// Make function globally accessible
window.upgradeEconomy = upgradeEconomy;
