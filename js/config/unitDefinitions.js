// Unit stat definitions - Base units only
const UNIT_DEFINITIONS = {
    melee: {
        name: 'Melee',
        type: 'melee',
        cost: 20,
        hp: 400,
        maxHp: 400,
        damage: 12,
        attackRange: 35,
        attackCooldown: 1000,
        speed: 96,
        aoeRadius: 25
    },
    ranged: {
        name: 'Ranged',
        type: 'ranged',
        cost: 25,
        hp: 60,
        maxHp: 60,
        damage: 22,
        attackRange: 120,
        attackCooldown: 1500,
        speed: 84
    },
    caster: {
        name: 'Caster',
        type: 'caster',
        cost: 30,
        hp: 50,
        maxHp: 50,
        damage: 55,
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
        healAmount: 25,
        maxTargets: 1,
        attackRange: 50,
        attackCooldown: 2500,
        speed: 72,
        aoeRadius: 0
    }
};
