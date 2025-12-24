// Game state
const gameState = {
    player: {
        health: 100,
        gold: 50,
        unlockedTiers: [1],
        economyLevel: 0
    },
    ai: {
        health: 100,
        gold: 50,
        unlockedTiers: [1]
    },
    round: 0,
    roundTimer: 8, // seconds until next round
    isRoundActive: false,
    units: [],
    projectiles: [],
    lastUpdateTime: 0,
    selectedUnitType: null, // For placement
    passiveGoldTimer: 0,
    isPaused: false,
    showTargetLines: false
};

// DOM elements
const playerZone = document.getElementById('player-zone');
const battleZone = document.getElementById('battle-zone');
const aiZone = document.getElementById('ai-zone');

// Initialize game
function init() {
    setupEventListeners();
    updateUI();
    requestAnimationFrame(gameLoop);
}

function setupEventListeners() {
    // Buy unit buttons - now selects unit for placement
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const unitType = btn.dataset.unit;
            selectUnitForPlacement(unitType);
        });
    });
    
    // Unlock tier buttons
    document.querySelectorAll('.unlock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tier = parseInt(btn.dataset.tier);
            unlockTier(tier);
        });
    });
    
    // Click to place unit in player zone
    playerZone.addEventListener('click', (e) => {
        if (gameState.selectedUnitType) {
            const rect = playerZone.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            placeUnit(gameState.selectedUnitType, x, y);
        }
    });
    
    // Show placement preview
    playerZone.addEventListener('mousemove', (e) => {
        if (gameState.selectedUnitType) {
            playerZone.style.cursor = 'crosshair';
        } else {
            playerZone.style.cursor = 'default';
        }
    });
    
    // Pause button
    document.getElementById('pause-btn').addEventListener('click', () => {
        gameState.isPaused = !gameState.isPaused;
        document.getElementById('pause-btn').textContent = gameState.isPaused ? 'Resume' : 'Pause';
    });
    
    // Target lines toggle button
    document.getElementById('target-lines-btn').addEventListener('click', () => {
        gameState.showTargetLines = !gameState.showTargetLines;
        document.getElementById('target-lines-btn').textContent = gameState.showTargetLines ? 'Hide Target Lines' : 'Show Target Lines';
        
        // Clean up existing lines if disabling
        if (!gameState.showTargetLines) {
            document.querySelectorAll('.target-line').forEach(line => line.remove());
            // Clear all unit targetLine references
            gameState.units.forEach(unit => {
                unit.targetLine = null;
            });
        }
    });
}

function selectUnitForPlacement(unitType) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    if (gameState.player.gold < definition.cost) {
        console.log('Not enough gold');
        return;
    }
    
    if (!gameState.player.unlockedTiers.includes(definition.tier)) {
        console.log('Tier locked');
        return;
    }
    
    gameState.selectedUnitType = unitType;
    console.log('Click in the blue zone to place ' + definition.name);
}

function placeUnit(unitType, x, y) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    if (gameState.player.gold < definition.cost) {
        console.log('Not enough gold');
        return;
    }
    
    // Check for collision with existing units in player zone
    const templateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === playerZone
    );
    
    // Limit max units in build zone to 15 for performance
    if (templateUnits.length >= 15) {
        console.log('Maximum units reached (15)');
        return;
    }
    
    for (let existing of templateUnits) {
        const dist = Math.sqrt(
            Math.pow(existing.x - x, 2) + 
            Math.pow(existing.y - y, 2)
        );
        if (dist < 25) { // Minimum distance between units
            console.log('Too close to another unit');
            return;
        }
    }
    
    gameState.player.gold -= definition.cost;
    
    // Create unit at clicked position
    const newUnit = new Unit(definition, 'player', x, y);
    gameState.units.push(newUnit);
    createUnitElement(newUnit, playerZone);
    
    // Keep unit selected so player can keep placing
    updateUI();
}

function unlockTier(tier) {
    const cost = tier === 2 ? 80 : 150;
    
    if (gameState.player.gold < cost) {
        console.log('Not enough gold');
        return;
    }
    
    if (gameState.player.unlockedTiers.includes(tier)) {
        console.log('Already unlocked');
        return;
    }
    
    gameState.player.gold -= cost;
    gameState.player.unlockedTiers.push(tier);
    
    // Unlock UI
    const tierSection = document.getElementById(`tier-${tier}-units`);
    tierSection.classList.remove('locked');
    tierSection.querySelectorAll('.buy-btn').forEach(btn => btn.disabled = false);
    tierSection.querySelector('.unlock-btn').style.display = 'none';
    
    updateUI();
}

function createUnitElement(unit, container) {
    const el = document.createElement('div');
    el.className = `unit ${unit.owner} ${unit.type} tier-${unit.tier}`;
    el.style.left = unit.x + 'px';
    el.style.top = unit.y + 'px';
    el.innerHTML = `
        <div class="unit-hp">${unit.hp}</div>
        <div class="health-bar">
            <div class="health-bar-fill"></div>
        </div>
    `;
    
    container.appendChild(el);
    unit.element = el;
    unit.updateHealthBar();
}

function startRound() {
    gameState.isRoundActive = true;
    gameState.round++;
    
    // Clone template units from build zones to battle zone
    const templateUnits = gameState.units.filter(u => 
        u.element && (u.element.parentElement === playerZone || u.element.parentElement === aiZone)
    );
    
    templateUnits.forEach(templateUnit => {
        // Find matching definition
        const defKey = Object.keys(UNIT_DEFINITIONS).find(key => {
            const def = UNIT_DEFINITIONS[key];
            return def.name === templateUnit.name && def.tier === templateUnit.tier && def.type === templateUnit.type;
        });
        
        if (defKey) {
            // Spawn at same Y position, but at appropriate X edge of battleground
            const battleUnit = new Unit(
                UNIT_DEFINITIONS[defKey],
                templateUnit.owner,
                templateUnit.owner === 'player' ? 50 : battleZone.offsetWidth - 50,
                templateUnit.y // Use exact Y position from template
            );
            
            gameState.units.push(battleUnit);
            createUnitElement(battleUnit, battleZone);
        }
    });
    
    updateUI();
}

function endRound() {
    // Don't clear units, just award gold and reset timer
    
    // Award gold for completing round (very reduced)
    gameState.player.gold += 8 + (gameState.round * 2);
    gameState.ai.gold += 8 + (gameState.round * 2);
    
    gameState.roundTimer = 8; // Reset to 8 seconds
    updateUI();
}

function aiPurchaseUnits() {
    // Check AI unit count
    const aiTemplateUnits = gameState.units.filter(u => 
        u.element && u.element.parentElement === aiZone
    );
    
    if (aiTemplateUnits.length >= 15) return; // Max units limit
    
    // Simple AI: buy random units with available gold
    const availableUnits = Object.keys(UNIT_DEFINITIONS).filter(key => {
        const def = UNIT_DEFINITIONS[key];
        return gameState.ai.unlockedTiers.includes(def.tier) && def.cost <= gameState.ai.gold;
    });
    
    while (availableUnits.length > 0 && gameState.ai.gold >= 10 && aiTemplateUnits.length < 15) {
        const randomUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
        const definition = UNIT_DEFINITIONS[randomUnit];
        
        if (gameState.ai.gold < definition.cost) break;
        
        gameState.ai.gold -= definition.cost;
        
        const yPos = Math.random() * (aiZone.offsetHeight - 50) + 25;
        const aiUnit = new Unit(definition, 'ai', aiZone.offsetWidth - 50, yPos);
        gameState.units.push(aiUnit);
        createUnitElement(aiUnit, aiZone);
    }
    
    // AI unlocks tiers randomly
    if (!gameState.ai.unlockedTiers.includes(2) && gameState.ai.gold >= 80 && Math.random() > 0.5) {
        gameState.ai.gold -= 80;
        gameState.ai.unlockedTiers.push(2);
    }
    if (!gameState.ai.unlockedTiers.includes(3) && gameState.ai.gold >= 150 && Math.random() > 0.5) {
        gameState.ai.gold -= 150;
        gameState.ai.unlockedTiers.push(3);
    }
}

function updateUI() {
    document.getElementById('player-health').textContent = gameState.player.health;
    document.getElementById('player-gold').textContent = gameState.player.gold;
    document.getElementById('ai-health').textContent = gameState.ai.health;
    document.getElementById('ai-gold').textContent = gameState.ai.gold;
    document.getElementById('round-number').textContent = gameState.round;
    document.getElementById('round-timer').textContent = Math.ceil(gameState.roundTimer);
}

function gameLoop(timestamp) {
    if (!gameState.lastUpdateTime) {
        gameState.lastUpdateTime = timestamp;
    }
    
    const deltaTime = timestamp - gameState.lastUpdateTime;
    gameState.lastUpdateTime = timestamp;
    
    if (!gameState.isPaused) {
        // Passive gold generation (1 gold per 5 seconds)
        gameState.passiveGoldTimer += deltaTime;
        if (gameState.passiveGoldTimer >= 5000) {
            gameState.player.gold += 1;
            gameState.passiveGoldTimer = 0;
        }
        
        // Always update battle
        updateBattle(deltaTime, timestamp);
        
        // Clean up dead units from array periodically
        gameState.units = gameState.units.filter(unit => {
            if (unit.isDead && unit.element === null) {
                return false;
            }
            return true;
        });
        
        // Clean up projectiles that are too old (performance)
        gameState.projectiles = gameState.projectiles.filter(proj => {
            if (!proj.createdAt) proj.createdAt = timestamp;
            if (timestamp - proj.createdAt > 5000) { // Remove after 5 seconds
                if (proj.element) proj.element.remove();
                return false;
            }
            return true;
        });
        
        // AI continues buying units
        if (Math.random() < 0.01) { // 1% chance per frame (reduced from 2%)
            aiPurchaseUnits();
        }
        
        // Always count down round timer to spawn new waves
        gameState.roundTimer -= deltaTime / 1000;
        if (gameState.roundTimer <= 0) {
            endRound();
            startRound();
        }
    }
    
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

function updateBattle(deltaTime, currentTime) {
    const battleWidth = battleZone.offsetWidth;
    const battleHeight = battleZone.offsetHeight;
    
    // Update units
    for (let unit of gameState.units) {
        if (unit.isDead) continue;
        
        // Skip template units in build zones
        if (unit.element && (unit.element.parentElement === playerZone || unit.element.parentElement === aiZone)) {
            continue;
        }
        
        // Find enemy targets (only in battle zone)
        const enemies = gameState.units.filter(u => 
            !u.isDead && u.owner !== unit.owner && 
            u.element && u.element.parentElement === battleZone
        );
        
        // Clean up target if it's dead or no longer valid
        if (unit.target && (unit.target.isDead || !enemies.includes(unit.target))) {
            unit.target = null;
        }
        
        if (enemies.length === 0) {
            // No enemies, keep moving forward (X only, maintain Y)
            if (unit.owner === 'player') {
                unit.x += unit.speed * (deltaTime / 1000);
            } else {
                unit.x -= unit.speed * (deltaTime / 1000);
            }
            
            // Check if unit reached enemy side
            if (unit.owner === 'player' && unit.x >= battleWidth - 10) {
                gameState.ai.health -= 5;
                unit.isDead = true;
                if (unit.element) unit.element.remove();
            } else if (unit.owner === 'ai' && unit.x <= 10) {
                gameState.player.health -= 5;
                unit.isDead = true;
                if (unit.element) unit.element.remove();
            }
            
            // Update position
            if (unit.element) {
                unit.element.style.left = unit.x + 'px';
                unit.element.style.top = unit.y + 'px';
            }
            continue;
        }
        
        let closestEnemy = null;
        let closestDist = Infinity;
        
        for (let enemy of enemies) {
            // Only calculate horizontal distance so units stay in lanes
            const dist = Math.abs(enemy.x - unit.x);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }
        
        unit.target = closestEnemy;
        
        // Move or attack (X only, maintain Y position)
        if (closestDist > unit.attackRange) {
            // Move towards enemy horizontally only
            if (unit.owner === 'player') {
                unit.x += unit.speed * (deltaTime / 1000);
            } else {
                unit.x -= unit.speed * (deltaTime / 1000);
            }
            
            // Check if unit reached enemy side
            if (unit.owner === 'player' && unit.x >= battleWidth - 10) {
                gameState.ai.health -= 5;
                unit.isDead = true;
                if (unit.element) {
                    unit.element.remove();
                    unit.element = null;
                }
            } else if (unit.owner === 'ai' && unit.x <= 10) {
                gameState.player.health -= 5;
                unit.isDead = true;
                if (unit.element) {
                    unit.element.remove();
                    unit.element = null;
                }
            }
        } else {
            // Attack
            if (unit.canAttack(currentTime)) {
                unit.attack(currentTime);
                
                if (unit.type === 'melee') {
                    // Instant damage
                    const wasDead = closestEnemy.hp <= 0;
                    closestEnemy.takeDamage(unit.damage);
                    if (!wasDead && closestEnemy.hp <= 0 && unit.owner === 'player') {
                        // Award gold for kill (reduced)
                        gameState.player.gold += 3 + closestEnemy.tier * 1;
                    }
                } else if (unit.type === 'ranged') {
                    // Create projectile
                    createProjectile(unit, closestEnemy);
                } else if (unit.type === 'caster') {
                    // AOE damage with animation
                    // Create visual effect
                    const aoeEffect = document.createElement('div');
                    aoeEffect.style.position = 'absolute';
                    aoeEffect.style.left = (closestEnemy.x - unit.aoeRadius) + 'px';
                    aoeEffect.style.top = (closestEnemy.y - unit.aoeRadius) + 'px';
                    aoeEffect.style.width = (unit.aoeRadius * 2) + 'px';
                    aoeEffect.style.height = (unit.aoeRadius * 2) + 'px';
                    aoeEffect.style.border = '2px solid #9b59b6';
                    aoeEffect.style.borderRadius = '50%';
                    aoeEffect.style.backgroundColor = 'rgba(155, 89, 182, 0.3)';
                    aoeEffect.style.pointerEvents = 'none';
                    aoeEffect.style.animation = 'pulse 0.3s ease-out';
                    battleZone.appendChild(aoeEffect);
                    
                    setTimeout(() => aoeEffect.remove(), 300);
                    
                    for (let enemy of enemies) {
                        const dist = Math.sqrt(
                            Math.pow(enemy.x - closestEnemy.x, 2) + 
                            Math.pow(enemy.y - closestEnemy.y, 2)
                        );
                        if (dist <= unit.aoeRadius) {
                            const wasDead = enemy.hp <= 0;
                            enemy.takeDamage(unit.damage);
                            if (!wasDead && enemy.hp <= 0 && unit.owner === 'player') {
                                gameState.player.gold += 3 + enemy.tier * 1;
                            }
                        }
                    }
                }
            }
        }
        
        // Update element position
        if (unit.element) {
            unit.element.style.left = unit.x + 'px';
            unit.element.style.top = unit.y + 'px';
        }
        
        // Draw target line if enabled and has valid target
        if (gameState.showTargetLines && unit.target && !unit.target.isDead && unit.element && unit.element.parentElement === battleZone) {
            if (!unit.targetLine) {
                unit.targetLine = document.createElement('div');
                unit.targetLine.className = 'target-line';
                battleZone.appendChild(unit.targetLine);
            }
            
            // Calculate line position and rotation
            const dx = unit.target.x - unit.x;
            const dy = unit.target.y - unit.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            unit.targetLine.style.width = length + 'px';
            unit.targetLine.style.left = unit.x + 'px';
            unit.targetLine.style.top = unit.y + 'px';
            unit.targetLine.style.transform = `rotate(${angle}deg)`;
            unit.targetLine.style.transformOrigin = '0 0';
        } else {
            // Clean up line if it exists but shouldn't be shown
            if (unit.targetLine) {
                unit.targetLine.remove();
                unit.targetLine = null;
            }
        }
    }
    
    // Update projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
        if (proj.target.isDead) {
            if (proj.element) {
                proj.element.remove();
                proj.element = null;
            }
            return false;
        }
        
        const dx = proj.target.x - proj.x;
        const dy = proj.target.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
            // Hit target
            const wasDead = proj.target.hp <= 0;
            proj.target.takeDamage(proj.damage);
            if (!wasDead && proj.target.hp <= 0 && proj.owner === 'player') {
                // Award gold for kill
                gameState.player.gold += 5 + proj.target.tier * 2;
            }
            if (proj.element) {
                proj.element.remove();
                proj.element = null;
            }
            return false;
        }
        
        const angle = Math.atan2(dy, dx);
        proj.x += Math.cos(angle) * 200 * (deltaTime / 1000);
        proj.y += Math.sin(angle) * 200 * (deltaTime / 1000);
        
        if (proj.element) {
            proj.element.style.left = proj.x + 'px';
            proj.element.style.top = proj.y + 'px';
        }
        
        return true;
    });
    
    // Check game over conditions
    if (gameState.player.health <= 0 || gameState.ai.health <= 0) {
        alert(gameState.player.health > 0 ? 'You Win!' : 'You Lose!');
        location.reload();
    }
    
    updateUI();
}

function createProjectile(unit, target) {
    const proj = {
        x: unit.x,
        y: unit.y,
        target: target,
        damage: unit.damage,
        owner: unit.owner,
        element: null,
        createdAt: performance.now()
    };
    
    const el = document.createElement('div');
    el.className = 'projectile';
    el.style.left = proj.x + 'px';
    el.style.top = proj.y + 'px';
    battleZone.appendChild(el);
    
    proj.element = el;
    gameState.projectiles.push(proj);
}

// Start the game
init();
