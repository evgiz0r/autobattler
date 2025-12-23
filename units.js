// Unit definitions
const UNIT_DEFINITIONS = {
    melee1: {
        name: 'Melee T1',
        type: 'melee',
        tier: 1,
        cost: 10,
        hp: 150,
        maxHp: 150,
        damage: 25,
        attackRange: 35,
        attackCooldown: 1000,
        speed: 80
    },
    ranged1: {
        name: 'Ranged T1',
        type: 'ranged',
        tier: 1,
        cost: 15,
        hp: 60,
        maxHp: 60,
        damage: 20,
        attackRange: 120,
        attackCooldown: 1500,
        speed: 70
    },
    caster1: {
        name: 'Caster T1',
        type: 'caster',
        tier: 1,
        cost: 20,
        hp: 50,
        maxHp: 50,
        damage: 20,
        attackRange: 100,
        attackCooldown: 2000,
        speed: 55,
        aoeRadius: 40
    },
    melee2: {
        name: 'Melee T2',
        type: 'melee',
        tier: 2,
        cost: 30,
        hp: 300,
        maxHp: 300,
        damage: 50,
        attackRange: 40,
        attackCooldown: 900,
        speed: 90
    },
    ranged2: {
        name: 'Ranged T2',
        type: 'ranged',
        tier: 2,
        cost: 40,
        hp: 120,
        maxHp: 120,
        damage: 40,
        attackRange: 150,
        attackCooldown: 1300,
        speed: 80
    },
    caster2: {
        name: 'Caster T2',
        type: 'caster',
        tier: 2,
        cost: 50,
        hp: 100,
        maxHp: 100,
        damage: 35,
        attackRange: 130,
        attackCooldown: 1800,
        speed: 70,
        aoeRadius: 50
    },
    melee3: {
        name: 'Melee T3',
        type: 'melee',
        tier: 3,
        cost: 80,
        hp: 600,
        maxHp: 600,
        damage: 100,
        attackRange: 45,
        attackCooldown: 800,
        speed: 100
    },
    ranged3: {
        name: 'Ranged T3',
        type: 'ranged',
        tier: 3,
        cost: 100,
        hp: 250,
        maxHp: 250,
        damage: 80,
        attackRange: 180,
        attackCooldown: 1100,
        speed: 90
    },
    caster3: {
        name: 'Caster T3',
        type: 'caster',
        tier: 3,
        cost: 120,
        hp: 200,
        maxHp: 200,
        damage: 60,
        attackRange: 160,
        attackCooldown: 1600,
        speed: 80,
        aoeRadius: 60
    }
};

// Unit class
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
        
        // DOM element
        this.element = null;
        this.targetLine = null;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            // Remove from DOM immediately
            if (this.element) {
                this.element.remove();
                this.element = null; // Clear reference for garbage collection
            }
            // Clean up target line if exists
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
    
    canAttack(currentTime) {
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }
    
    attack(currentTime) {
        this.lastAttackTime = currentTime;
    }
}
