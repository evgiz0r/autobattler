// Unit stat definitions - Base units only
const UNIT_DEFINITIONS = {
    melee: {
        name: 'Melee',
        type: 'melee',
        cost: 15,
        hp: 120,
        maxHp: 120,
        damage: 16,
        attackRange: 35,
        attackCooldown: 6000,
        speed: 90,
        aoeRadius: 30
    },
    ranged: {
        name: 'Ranged',
        type: 'ranged',
        cost: 30,
        hp: 45,
        maxHp: 35,
        damage: 12,
        attackRange: 120,
        attackCooldown: 8000,
        speed: 80
    },
    caster: {
        name: 'Caster',
        type: 'caster',
        cost: 50,
        hp: 100,
        maxHp: 100,
        damage: 15,
        attackRange: 80,
        attackCooldown: 10000,
        speed: 65,
        aoeRadius: 20
    },
    healer: {
        name: 'Healer',
        type: 'healer',
        cost: 35,
        hp: 80,
        maxHp: 80,
        damage: 0,
        healAmount: 12,
        maxTargets: 2,
        attackRange: 30,
        attackCooldown: 6000,
        speed: 75,
        aoeRadius: 0
    }
};
