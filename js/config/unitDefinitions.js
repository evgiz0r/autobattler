// Unit stat definitions - Base units only
const UNIT_DEFINITIONS = {
    melee: {
        name: 'Melee',
        type: 'melee',
        cost: 20,
        hp: 320,
        maxHp: 320,
        damage: 22,
        attackRange: 35,
        attackCooldown: 1000,
        speed: 77,
        aoeRadius: 25
    },
    ranged: {
        name: 'Ranged',
        type: 'ranged',
        cost: 25,
        hp: 60,
        maxHp: 60,
        damage: 18,
        attackRange: 100,
        attackCooldown: 1700,
        speed: 84
    },
    caster: {
        name: 'Caster',
        type: 'caster',
        cost: 30,
        hp: 50,
        maxHp: 50,
        damage: 28,
        attackRange: 140,
        attackCooldown: 2000,
        speed: 66,
        aoeRadius: 40
    },
    healer: {
        name: 'Healer',
        type: 'healer',
        cost: 28,
        hp: 80,
        maxHp: 80,
        damage: 0,
        healAmount: 22,
        maxTargets: 1,
        attackRange: 50,
        attackCooldown: 3000,
        speed: 40,
        aoeRadius: 0
    }
};
