// Economy system - handles gold generation and rewards

function updatePassiveGold(deltaTime) {
    gameState.passiveGoldTimer += deltaTime;
    if (gameState.passiveGoldTimer >= GAME_CONFIG.PASSIVE_GOLD_INTERVAL) {
        const baseGold = GAME_CONFIG.PASSIVE_GOLD_AMOUNT;
        const economyBonus = gameState.player.economyLevel || 0;
        const tierBonus = gameState.player.unlockedTiers.length - 1; // +1 per tier unlocked (tier 1 is free)
        const aiTierBonus = gameState.ai.unlockedTiers.length - 1;
        
        gameState.player.gold += baseGold + economyBonus + tierBonus;
        gameState.ai.gold += Math.round((baseGold + aiTierBonus) * GAME_CONFIG.AI_GOLD_MULTIPLIER);
        gameState.passiveGoldTimer = 0;
    }
}

function awardKillGold(tier, owner) {
    const goldAmount = GAME_CONFIG.KILL_GOLD_BASE + (tier * GAME_CONFIG.KILL_GOLD_PER_TIER);
    if (owner === 'player') {
        gameState.player.gold += goldAmount;
    } else {
        gameState.ai.gold += Math.round(goldAmount * GAME_CONFIG.AI_GOLD_MULTIPLIER);
    }
}

function awardRoundGold() {
    const goldAmount = GAME_CONFIG.ROUND_GOLD_BASE + (gameState.round * GAME_CONFIG.ROUND_GOLD_PER_ROUND);
    gameState.player.gold += goldAmount;
    gameState.ai.gold += Math.round(goldAmount * GAME_CONFIG.AI_GOLD_MULTIPLIER);
}

function unlockTier(tier) {
    const costs = {
        2: GAME_CONFIG.TIER_2_UNLOCK_COST,
        3: GAME_CONFIG.TIER_3_UNLOCK_COST,
        4: GAME_CONFIG.TIER_4_UNLOCK_COST,
        5: GAME_CONFIG.TIER_5_UNLOCK_COST,
        6: GAME_CONFIG.TIER_6_UNLOCK_COST,
        7: GAME_CONFIG.TIER_7_UNLOCK_COST
    };
    
    const cost = costs[tier];
    
    if (gameState.player.gold < cost) {
        console.log('Not enough gold');
        return;
    }
    
    if (gameState.player.unlockedTiers.includes(tier)) {
        console.log('Already unlocked');
        return;
    }
    
    gameState.player.gold -= cost;
    gameState.player.unlockedTiers.push(tier);
    
    // Update UI
    const tierSection = document.getElementById(`tier-${tier}-units`);
    if (tierSection) {
        tierSection.classList.remove('locked');
        tierSection.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
        const unlockBtn = tierSection.querySelector('.unlock-btn');
        if (unlockBtn) unlockBtn.style.display = 'none';
    }
    
    updateUI();
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
