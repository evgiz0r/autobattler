// Unit class definition
class Unit {
    constructor(definition, owner, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.owner = owner; // 'player' or 'ai'
        this.name = definition.name;
        this.type = definition.type;
        this.tier = definition.tier;
        
        // Stats
        this.hp = definition.hp;
        this.maxHp = definition.maxHp;
        this.damage = definition.damage;
        this.healAmount = definition.healAmount || 0;
        this.maxTargets = definition.maxTargets || 0;
        this.attackRange = definition.attackRange;
        this.attackCooldown = definition.attackCooldown;
        this.speed = definition.speed;
        this.aoeRadius = definition.aoeRadius || 0;
        
        // Position
        this.x = x;
        this.y = y;
        
        // State
        this.lastAttackTime = 0;
        this.target = null;
        this.isDead = false;
        this.createdAt = Date.now(); // Track creation time
        this.expirationTime = this.getExpirationTime(); // Time until unit expires in build zone
        this.pausedTime = 0; // Track total paused time
        this.lastPauseStart = null; // Track when pause started
        
        // DOM references
        this.element = null;
        this.targetLine = null;
        
        // Behavior system
        this.behavior = this.createBehavior();
    }
    
    createBehavior() {
        // Create appropriate behavior based on unit type
        switch(this.type) {
            case 'melee':
                return new MeleeBehavior(this);
            case 'ranged':
                return new RangedBehavior(this);
            case 'caster':
                return new CasterBehavior(this);
            case 'healer':
                return new HealerBehavior(this);
            default:
                return new MeleeBehavior(this);
        }
    }
    
    getExpirationTime() {
        // Consistent 60 seconds for all tiers
        return 60000;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            
            // Clean up DOM elements
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
            if (this.targetLine) {
                this.targetLine.remove();
                this.targetLine = null;
            }
        }
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        if (this.element) {
            const healthFill = this.element.querySelector('.health-bar-fill');
            if (healthFill) {
                const percent = (this.hp / this.maxHp) * 100;
                healthFill.style.width = percent + '%';
            }
            const hpText = this.element.querySelector('.unit-hp');
            if (hpText) {
                hpText.textContent = Math.ceil(this.hp);
            }
        }
    }
    
    updateCooldownBar(currentTime) {
        if (this.element) {
            const cooldownFill = this.element.querySelector('.cooldown-bar-fill');
            if (cooldownFill) {
                const timeSinceAttack = currentTime - this.lastAttackTime;
                const percent = Math.min(100, (timeSinceAttack / this.attackCooldown) * 100);
                cooldownFill.style.width = percent + '%';
            }
        }
    }
    
    updateExpirationTimer() {
        if (this.element) {
            const timerText = this.element.querySelector('.unit-timer');
            if (timerText) {
                // Account for paused time
                const elapsed = Date.now() - this.createdAt - this.pausedTime;
                const timeLeft = Math.max(0, this.expirationTime - elapsed);
                const seconds = Math.ceil(timeLeft / 1000);
                timerText.textContent = seconds + 's';
                
                // Change color when time is low
                if (seconds <= 10) {
                    timerText.style.color = '#e74c3c';
                } else if (seconds <= 20) {
                    timerText.style.color = '#f39c12';
                } else {
                    timerText.style.color = '#ecf0f1';
                }
            }
        }
    }
    
    canAttack(currentTime) {
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }
    
    attack(currentTime) {
        this.lastAttackTime = currentTime;
    }
}
