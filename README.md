# Autobattler Game

A 1v1 autobattler game where you strategically place and upgrade units to battle against an AI opponent.

## Play Now

**[Play the game here!](https://evgiz0r.github.io/autobattler/)**

## How to Play

1. **Build Phase**: Place units in your build zone before the round starts
2. **Battle Phase**: Units automatically fight in the battlefield every 10 seconds
3. **Earn Gold**: Gain gold passively, from round rewards, and by killing enemy units
4. **Upgrade Strategy**: Manually upgrade your units or wait for auto-upgrades every 3 rounds
5. **Win Condition**: Reduce enemy lives to 0 (or play in Infinite Mode for endless battles!)

## Features

### Core Gameplay
- **4 Base Unit Types**: Melee (AoE damage), Ranged (long range), Caster (multi-target AoE), Healer (ally support)
- **Infinite Upgrade System**: Units scale with HP, damage, attack speed, and AoE radius
- **Dynamic Costs**: Unit costs increase by +5g per upgrade level, upgrade costs scale linearly (+20g per level)
- **Auto-Upgrades**: All units automatically gain +1 upgrade level every 3 rounds

### Game Modes
- **Standard Mode**: Battle AI until one side reaches 0 lives
- **Infinite Mode**: Toggle to play endlessly without game over
- **AI vs AI Mode**: Watch two AI strategies battle it out
- **Difficulty Settings**: Easy (0.8x gold), Medium (1.0x), Hard (1.2x AI gold multiplier)

### AI Personalities
The AI randomly selects one of 6 distinct strategies:
- **The Swarm**: Spams units constantly, never upgrades
- **The Perfectionist**: Balanced approach with 20% upgrade chance
- **The Sniper**: Specializes in ranged units (75% upgrade on ranged)
- **The Juggernaut**: Melee specialist (60% upgrade on melee)
- **The Archmage**: Caster focus with melee support
- **The Guardian**: Healer/Caster mix with guaranteed melee frontline

### Quality of Life
- **Visual Indicators**: Red X shows when you can't afford units/upgrades
- **AI Shop Display**: See what the AI is building and their upgrade levels
- **Target Lines**: Toggle to show/hide unit targeting (can be disabled)
- **Sound Effects**: Toggle sound on/off
- **Comeback Mechanic**: Units get +5% stats per life lost

### Balance Features
- **Stat Caps**: AoE capped at 2x base size, attack speed capped at 2x faster
- **Scaling AI Aggression**: AI buys more frequently as rounds progress
- **Smart Movement**: Units use random pathfinding to avoid getting stuck

## Unit Stats

| Unit | Cost | HP | Damage | Range | Speed | AoE | Cooldown |
|------|------|----|----|-------|-------|-----|----------|
| Melee | 20g | 400 | 15 | 35 | 96 | 25 | 1.0s |
| Ranged | 25g | 60 | 22 | 120 | 84 | - | 1.5s |
| Caster | 30g | 50 | 55 | 140 | 66 | 40 | 2.0s |
| Healer | 28g | 80 | 0 (heal: 25) | 50 | 72 | - | 2.5s |

*Stats scale with upgrades: +5% HP/damage per level, attack speed gets 5% faster, AoE grows 5% per level*

## Tips

- Melee units have AoE damage - great for clearing groups
- Casters hit multiple targets and scale well with upgrades
- Healers keep your army alive longer - protect them with melee
- Upgrade costs are linear (20g, 40g, 60g...) so upgrading is always valuable
- AI gets more aggressive as the game goes on - don't hoard gold!

## Development

Built with vanilla JavaScript, no frameworks required.

Have fun!
