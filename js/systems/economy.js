// Economy system - handles gold generation and rewards

function updatePassiveGold(deltaTime) {
    gameState.passiveGoldTimer += deltaTime;
    if (gameState.passiveGoldTimer >= GAME_CONFIG.PASSIVE_GOLD_INTERVAL) {
        const baseGold = GAME_CONFIG.PASSIVE_GOLD_AMOUNT;
        const bonusGold = gameState.player.economyLevel || 0;
        gameState.player.gold += baseGold + bonusGold;
        gameState.ai.gold += Math.round(baseGold * GAME_CONFIG.AI_GOLD_MULTIPLIER);
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
    const cost = tier === 2 ? GAME_CONFIG.TIER_2_UNLOCK_COST : GAME_CONFIG.TIER_3_UNLOCK_COST;
    
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
    tierSection.classList.remove('locked');
    tierSection.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
    tierSection.querySelector('.unlock-btn').style.display = 'none';
    
    updateUI();
}

function upgradeEconomy() {
    const level = gameState.player.economyLevel || 0;
    const costs = [50, 100, 150];
    
    if (level >= 3) {
        console.log('Economy maxed out!');
        return;
    }
    
    const cost = costs[level];
    
    if (gameState.player.gold < cost) {
        console.log('Not enough gold for economy upgrade');
        return;
    }
    
    gameState.player.gold -= cost;
    gameState.player.economyLevel++;
    
    // Update UI button
    const btn = document.getElementById('economy-upgrade-btn');
    if (gameState.player.economyLevel >= 3) {
        btn.textContent = 'Economy Maxed';
        btn.disabled = true;
    } else {
        const nextCost = costs[gameState.player.economyLevel];
        btn.textContent = `Economy +${gameState.player.economyLevel + 1}g/s (${nextCost}g)`;
    }
    
    console.log(`Economy upgraded! Now +${gameState.player.economyLevel}g/s`);
    updateUI();
}

// Make function globally accessible
window.upgradeEconomy = upgradeEconomy;
