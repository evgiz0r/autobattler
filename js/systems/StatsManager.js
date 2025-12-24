// Stats manager for easier control over unit statistics
const StatsManager = {
    // Base multipliers for unit tiers
    tierMultipliers: {
        1: { hp: 1.0, damage: 1.0, speed: 1.0 },
        2: { hp: 2.0, damage: 2.0, speed: 1.15 },
        3: { hp: 4.0, damage: 4.0, speed: 1.3 }
    },
    
    // Type-specific modifiers
    typeModifiers: {
        melee: { hp: 2.5, damage: 0.6, speed: 1.1, attackRange: 0.8, attackCooldown: 0.95 },
        ranged: { hp: 0.5, damage: 3.0, speed: 1.0, attackRange: 1.2, attackCooldown: 1.0 },
        caster: { hp: 0.4, damage: 2.5, speed: 0.85, attackRange: 1.15, attackCooldown: 1.2 },
        healer: { hp: 0.65, damage: 0, speed: 0.95, attackRange: 1.0, attackCooldown: 1.5 }
    },
    
    // Global stat multiplier for balancing
    globalMultiplier: {
        hp: 1.0,
        damage: 1.0,
        speed: 1.0,
        attackRange: 1.0,
        attackCooldown: 1.0
    },
    
    // Apply modifiers to unit definition
    applyModifiers(baseStats) {
        const tier = baseStats.tier;
        const type = baseStats.type;
        
        const tierMult = this.tierMultipliers[tier] || this.tierMultipliers[1];
        const typeMod = this.typeModifiers[type] || { hp: 1, damage: 1, speed: 1, attackRange: 1, attackCooldown: 1 };
        
        // Create a modified copy
        const modified = { ...baseStats };
        
        // Apply tier and type modifiers
        if (modified.hp !== undefined) {
            modified.hp = Math.round(baseStats.hp * tierMult.hp * typeMod.hp * this.globalMultiplier.hp);
            modified.maxHp = modified.hp;
        }
        
        if (modified.damage !== undefined) {
            modified.damage = Math.round(baseStats.damage * tierMult.damage * typeMod.damage * this.globalMultiplier.damage);
        }
        
        if (modified.speed !== undefined) {
            modified.speed = Math.round(baseStats.speed * tierMult.speed * typeMod.speed * this.globalMultiplier.speed);
        }
        
        if (modified.attackRange !== undefined) {
            modified.attackRange = Math.round(baseStats.attackRange * typeMod.attackRange * this.globalMultiplier.attackRange);
        }
        
        if (modified.attackCooldown !== undefined) {
            modified.attackCooldown = Math.round(baseStats.attackCooldown * typeMod.attackCooldown * this.globalMultiplier.attackCooldown);
        }
        
        return modified;
    },
    
    // Set global multiplier (for difficulty/balance adjustments)
    setGlobalMultiplier(stat, value) {
        if (this.globalMultiplier.hasOwnProperty(stat)) {
            this.globalMultiplier[stat] = value;
        }
    },
    
    // Get stat info for a specific unit type and tier
    getUnitStats(unitType, tier) {
        const key = `${unitType}${tier}`;
        if (UNIT_DEFINITIONS[key]) {
            return this.applyModifiers(UNIT_DEFINITIONS[key]);
        }
        return null;
    }
};
