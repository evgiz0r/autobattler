// Shop Manager - handles shop UI generation and updates

const ShopManager = {
    // Generate all shop UI dynamically
    generateShop() {
        const shopContainer = document.getElementById('unit-shop');
        if (!shopContainer) return;
        
        shopContainer.innerHTML = '<h3>Unit Shop</h3>';
        
        // Create horizontal tier sections
        for (let tier = 1; tier <= 7; tier++) {
            const tierSection = this.createTierSection(tier);
            shopContainer.appendChild(tierSection);
        }
    },
    
    createTierSection(tier) {
        const section = document.createElement('div');
        section.id = `tier-${tier}-units`;
        section.className = tier === 1 ? 'tier-section' : 'tier-section locked';
        
        // Tier header with countdown
        const header = document.createElement('div');
        header.className = 'tier-header';
        
        const title = document.createElement('h4');
        title.textContent = `Tier ${tier}`;
        header.appendChild(title);
        
        if (tier > 1) {
            const countdown = document.createElement('span');
            countdown.className = 'tier-countdown';
            countdown.id = `tier-${tier}-countdown`;
            countdown.textContent = this.getCountdownText(tier);
            header.appendChild(countdown);
        }
        
        section.appendChild(header);
        
        // Unit buttons container (horizontal)
        const unitsContainer = document.createElement('div');
        unitsContainer.className = 'units-container';
        
        // Add unit buttons for each type
        const types = ['melee', 'ranged', 'caster', 'healer'];
        types.forEach(type => {
            const unitKey = `${type}${tier}`;
            if (UNIT_DEFINITIONS[unitKey]) {
                const btn = this.createUnitButton(unitKey, tier > 1);
                unitsContainer.appendChild(btn);
            }
        });
        
        section.appendChild(unitsContainer);
        
        return section;
    },
    
    createUnitButton(unitKey, disabled) {
        const def = UNIT_DEFINITIONS[unitKey];
        const btn = document.createElement('button');
        btn.className = 'buy-btn';
        btn.dataset.unit = unitKey;
        btn.disabled = disabled;
        
        // Button content
        const name = document.createElement('div');
        name.className = 'unit-name';
        name.textContent = `${this.capitalizeFirst(def.type)} (${def.cost}g)`;
        btn.appendChild(name);
        
        const stats = document.createElement('small');
        stats.className = 'unit-stats';
        
        if (def.type === 'healer') {
            stats.textContent = `HP:${def.hp} HEAL:${def.healAmount} TGTS:${def.maxTargets} RNG:${def.attackRange}`;
        } else if (def.type === 'caster') {
            stats.textContent = `HP:${def.hp} DMG:${def.damage} RNG:${def.attackRange} AOE:${def.aoeRadius}`;
        } else {
            stats.textContent = `HP:${def.hp} DMG:${def.damage} RNG:${def.attackRange} SPD:${def.speed}`;
        }
        
        btn.appendChild(stats);
        
        return btn;
    },
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    getCountdownText(tier) {
        const unlockRound = (tier - 1) * 5;
        const currentRound = gameState.round;
        const roundsLeft = Math.max(0, unlockRound - currentRound);
        
        if (roundsLeft === 0 && gameState.player.unlockedTiers.includes(tier)) {
            return 'Unlocked';
        } else if (roundsLeft === 0) {
            return 'Unlocking...';
        } else {
            return `Unlocks in ${roundsLeft} rounds`;
        }
    },
    
    updateCountdowns() {
        for (let tier = 2; tier <= 7; tier++) {
            const countdown = document.getElementById(`tier-${tier}-countdown`);
            if (countdown) {
                countdown.textContent = this.getCountdownText(tier);
            }
        }
    },
    
    unlockTier(tier) {
        const tierSection = document.getElementById(`tier-${tier}-units`);
        if (tierSection) {
            tierSection.classList.remove('locked');
            tierSection.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
        }
        
        const countdown = document.getElementById(`tier-${tier}-countdown`);
        if (countdown) {
            countdown.textContent = 'Unlocked';
            countdown.style.color = '#2ecc71';
        }
    }
};
