// Shop Manager - handles shop UI generation and updates for upgrade system

const ShopManager = {
    // Generate all shop UI dynamically
    generateShop() {
        this.generatePlayerShop();
        this.generateAIShop();
    },
    
    generatePlayerShop() {
        const grid = document.querySelector('#player-shop .units-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Create sections for 4 unit types
        const types = ['melee', 'ranged', 'caster', 'healer'];
        types.forEach(type => {
            const section = this.createUnitSection(type, 'player');
            grid.appendChild(section);
        });
    },
    
    generateAIShop() {
        const grid = document.querySelector('#ai-shop .units-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Create sections for 4 unit types (read-only for AI)
        const types = ['melee', 'ranged', 'caster', 'healer'];
        types.forEach(type => {
            const section = this.createUnitSection(type, 'ai');
            grid.appendChild(section);
        });
    },
    
    createUnitSection(type, owner) {
        const section = document.createElement('div');
        section.className = 'unit-section';
        
        // Get base definition and current upgrade level
        const def = UNIT_DEFINITIONS[type];
        const upgradeLevel = owner === 'player' ? (gameState.player.upgradeLevels[type] || 0) : (gameState.ai.upgradeLevels[type] || 0);
        const unitCost = this.getUnitCost(type, upgradeLevel);
        
        // Buy button
        const buyBtn = document.createElement('button');
        buyBtn.className = owner === 'player' ? 'buy-btn' : 'buy-btn ai-readonly';
        buyBtn.dataset.unit = type;
        buyBtn.dataset.owner = owner;
        if (owner === 'ai') buyBtn.disabled = true;
        buyBtn.innerHTML = `
            <div class="unit-name">${this.capitalizeFirst(type)} [Lvl ${upgradeLevel}] (${unitCost}g)</div>
            <small class="unit-stats">${this.getStatsText(type, upgradeLevel)}</small>
        `;
        
        // Upgrade button
        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = owner === 'player' ? 'upgrade-btn' : 'upgrade-btn ai-readonly';
        upgradeBtn.dataset.type = type;
        upgradeBtn.dataset.owner = owner;
        if (owner === 'ai') upgradeBtn.disabled = true;
        const upgradeCost = this.getUpgradeCost(type, upgradeLevel);
        upgradeBtn.innerHTML = `
            <div>Upgrade (${upgradeCost}g)</div>
            <small>Lvl ${upgradeLevel} → ${upgradeLevel + 1}</small>
        `;
        
        section.appendChild(buyBtn);
        section.appendChild(upgradeBtn);
        
        return section;
    },
    
    getUnitCost(type, upgradeLevel) {
        const def = UNIT_DEFINITIONS[type];
        // Unit cost increases by +5 per upgrade level
        return def.cost + (upgradeLevel * 5);
    },
    
    getUpgradeCost(type, upgradeLevel) {
        // Upgrade cost starts at 20, increases by +20 per level
        return 20 + (upgradeLevel * 20);
    },
    
    getStatsText(type, upgradeLevel) {
        const def = UNIT_DEFINITIONS[type];
        const hpMult = Math.pow(GAME_CONFIG.UPGRADE_HP_MULTIPLIER, upgradeLevel);
        const dmgMult = Math.pow(GAME_CONFIG.UPGRADE_DAMAGE_MULTIPLIER, upgradeLevel);
        
        const hp = Math.round(def.hp * hpMult);
        
        if (type === 'healer') {
            const heal = Math.round(def.healAmount * dmgMult);
            return `HP:${hp} HEAL:${heal} TGTS:${def.maxTargets} RNG:${def.attackRange}`;
        } else if (type === 'caster') {
            const dmg = Math.round(def.damage * dmgMult);
            return `HP:${hp} DMG:${dmg} RNG:${def.attackRange} AOE:${def.aoeRadius}`;
        } else {
            const dmg = Math.round(def.damage * dmgMult);
            return `HP:${hp} DMG:${dmg} RNG:${def.attackRange} SPD:${def.speed}`;
        }
    },
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};
