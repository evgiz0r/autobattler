// Unit class definition
class Unit {
    constructor(definition, owner, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.owner = owner; // 'player' or 'ai'
        this.name = definition.name;
        this.type = definition.type;
        this.tier = definition.tier;
        
        // Apply comeback boost based on lives lost
        const ownerData = owner === 'player' ? gameState.player : gameState.ai;
        const comebackBoost = 1 + (ownerData.livesLost * GAME_CONFIG.COMEBACK_BOOST_PER_LIFE);
        
        // Stats (with comeback boost applied)
        this.hp = Math.round(definition.hp * comebackBoost);
        this.maxHp = Math.round(definition.maxHp * comebackBoost);
        this.damage = Math.round(definition.damage * comebackBoost);
        this.healAmount = definition.healAmount || 0;
        this.maxTargets = definition.maxTargets || 0;
        this.attackRange = definition.attackRange;
        this.attackCooldown = definition.attackCooldown;
        this.speed = definition.speed;
        this.aoeRadius = definition.aoeRadius || 0;
        
        // Position
        this.x = x;
        this.y = y;
        
        // Stuck detection
        this.lastPosition = { x: x, y: y };
        this.lastMovementCheck = 0;
        this.stuckCounter = 0;
        
        // State
        this.lastAttackTime = 0;
        this.target = null;
        this.isDead = false;
        this.spawnTime = null; // Track when unit spawned in battle (null for build zone units)
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
        // Consistent 40 seconds for all tiers
        return 40000;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            
            // Play death sound
            SoundSystem.playUnitDeath();
            
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
    
    isInvulnerable(currentTime) {
        // Units are invulnerable for 0.5 seconds after spawning
        if (this.spawnTime === null) return false;
        return (currentTime - this.spawnTime) < 500; // 500ms invulnerability
    }
    
    checkIfStuck(currentTime) {
        // Don't check stuck if unit recently attacked (they're supposed to be stationary)
        if (currentTime - this.lastAttackTime < 3000) {
            this.stuckCounter = 0;
            this.lastPosition = { x: this.x, y: this.y };
            this.lastMovementCheck = currentTime;
            return false;
        }
        
        // Check every 1000ms if unit has moved
        if (currentTime - this.lastMovementCheck < 1000) return false;
        
        const distanceMoved = Math.sqrt(
            Math.pow(this.x - this.lastPosition.x, 2) + 
            Math.pow(this.y - this.lastPosition.y, 2)
        );
        
        // If moved less than 3 pixels in 1 second, consider stuck
        if (distanceMoved < 3) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
        }
        
        this.lastPosition = { x: this.x, y: this.y };
        this.lastMovementCheck = currentTime;
        
        // Return true if stuck for 3 consecutive checks (3 seconds)
        return this.stuckCounter >= 3;
    }
    
    applyRandomUnstuck(deltaTime) {
        // Apply instant random movement to escape stuck position
        const randomAngle = Math.random() * Math.PI * 2;
        const unstuckDistance = 30; // Instant displacement
        
        this.x += Math.cos(randomAngle) * unstuckDistance;
        this.y += Math.sin(randomAngle) * unstuckDistance;
        
        // Keep within battlefield bounds
        this.y = Math.max(10, Math.min(260, this.y));
        
        // Reset stuck counter and force position update
        this.stuckCounter = 0;
        this.lastPosition = { x: this.x, y: this.y };
        
        // Update visual position immediately
        if (this.element) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }
    
    attack(currentTime) {
        this.lastAttackTime = currentTime;
    }
}
