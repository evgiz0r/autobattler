// UI Manager - handles UI updates and event listeners

function initializeGame() {
    // Don't initialize AI strategy here - let user select first
    // AI strategy will be initialized when first unit is placed
    
    // Generate shop UI dynamically
    ShopManager.generateShop();
}

function displayAIStrategy(strategy) {
    // Update AI zone label with strategy name
    const aiZoneLabel = document.getElementById('ai-zone-label');
    if (aiZoneLabel) {
        aiZoneLabel.textContent = strategy.name;
    }
}

function displayPlayerAIStrategy(strategy) {
    // Update player zone label with strategy name (for AI vs AI mode)
    const playerZoneLabel = document.getElementById('player-zone-label');
    if (playerZoneLabel) {
        playerZoneLabel.textContent = strategy.name;
    }
}

function restartGame() {
    // Reset game state
    gameState.player.health = GAME_CONFIG.STARTING_HEALTH;
    gameState.player.gold = GAME_CONFIG.STARTING_GOLD;
    gameState.player.upgradeLevels = { melee: 0, ranged: 0, caster: 0, healer: 0 };
    gameState.player.economyLevel = 0;
    gameState.player.livesLost = 0;
    gameState.player.strategy = null;
    
    gameState.ai.health = GAME_CONFIG.STARTING_HEALTH;
    gameState.ai.gold = GAME_CONFIG.STARTING_GOLD;
    gameState.ai.upgradeLevels = { melee: 0, ranged: 0, caster: 0, healer: 0 };
    gameState.ai.livesLost = 0;
    gameState.ai.strategy = null;
    
    gameState.round = 0;
    gameState.roundTimer = GAME_CONFIG.ROUND_DURATION;
    gameState.roundStartTime = 0;
    gameState.isRoundActive = false;
    gameState.playerUnitsSpawned = 0;
    gameState.aiUnitsSpawned = 0;
    gameState.gameTime = 0;
    gameState.passiveGoldTimer = 0;
    // In AI vs AI mode, auto-start the game
    gameState.firstUnitPlaced = gameState.isAIvsAI;

    // Ensure the game is not paused after a restart so AI vs AI will run
    gameState.isPaused = false;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    
    // Clear all units
    gameState.units.forEach(unit => {
        if (unit.element) unit.element.remove();
        if (unit.targetLine) unit.targetLine.remove();
    });
    gameState.units = [];
    
    // Clear all projectiles
    gameState.projectiles.forEach(proj => {
        if (proj.element) proj.element.remove();
    });
    gameState.projectiles = [];
    
    // Clear cursor preview
    if (gameState.cursorPreview) {
        gameState.cursorPreview.remove();
        gameState.cursorPreview = null;
    }
    gameState.selectedUnitType = null;
    
    // Clear any game over message
    const messageDiv = document.getElementById('first-unit-message');
    if (messageDiv) {
        messageDiv.textContent = 'Place Your First Unit!';
        messageDiv.style.display = gameState.isAIvsAI ? 'none' : 'block';
        // Reset message styling
        messageDiv.style.fontSize = '';
        messageDiv.style.padding = '';
        messageDiv.style.top = '';
        messageDiv.style.left = '';
        messageDiv.style.transform = '';
    }
    
    // Reset zone labels
    const playerZoneLabel = document.getElementById('player-zone-label');
    const aiZoneLabel = document.getElementById('ai-zone-label');
    if (playerZoneLabel) playerZoneLabel.textContent = 'Build Area';
    if (aiZoneLabel) aiZoneLabel.textContent = 'AI';
    
    // Disable economy button unless in AI vs AI mode
    const economyBtn = document.getElementById('economy-upgrade-btn');
    if (economyBtn) economyBtn.disabled = !gameState.isAIvsAI;
    
    // Re-enable AI strategy buttons
    document.querySelectorAll('.ai-strategy-btn').forEach(btn => {
        btn.disabled = false;
    });
    document.querySelectorAll('.player-ai-strategy-btn').forEach(btn => {
        btn.disabled = false;
    });
    
    // Update shops
    updateUpgradeButtons();
    updateUI();
}

function updateUI() {
    // Update lives display
    document.getElementById('player-lives').textContent = gameState.player.health;
    document.getElementById('ai-lives').textContent = gameState.ai.health;
    
    // Update comeback upgrades display (every 5 lives = 1 upgrade)
    const playerUpgrades = Math.floor(gameState.player.livesLost / 5);
    const aiUpgrades = Math.floor(gameState.ai.livesLost / 5);
    
    document.getElementById('player-boost').textContent = playerUpgrades > 0 ? `(+${playerUpgrades} lvl)` : '';
    document.getElementById('ai-boost').textContent = aiUpgrades > 0 ? `(+${aiUpgrades} lvl)` : '';
    
    // Show economy bonus in gold display
    const economyBonus = gameState.player.economyLevel || 0;
    const totalBonus = 1 + economyBonus; // base 1 + economy bonuses
    document.getElementById('player-gold').textContent = `${gameState.player.gold} (+${totalBonus}/s)`;
    
    const difficultyMultiplier = (GAME_CONFIG.DIFFICULTY[gameState.difficulty] || GAME_CONFIG.DIFFICULTY.MEDIUM).multiplier;
    const aiTotalBonus = Math.round(difficultyMultiplier * 10) / 10;
    
    document.getElementById('ai-gold').textContent = `${gameState.ai.gold} (+${aiTotalBonus}/s)`;
    document.getElementById('round-number').textContent = gameState.round;
    document.getElementById('round-timer').textContent = Math.ceil(gameState.roundTimer);
    
    // Update auto-upgrade countdown (every 3 rounds)
    const roundsUntilUpgrade = 3 - (gameState.round % 3);
    document.getElementById('upgrade-countdown').textContent = roundsUntilUpgrade;
    
    // Update affordability indicators for both player and AI shops
    document.querySelectorAll('.buy-btn[data-owner="player"]').forEach(btn => {
        const unitType = btn.dataset.unit;
        const definition = UNIT_DEFINITIONS[unitType];
        
        if (gameState.player.gold < definition.cost) {
            btn.classList.add('cannot-afford');
        } else {
            btn.classList.remove('cannot-afford');
        }
    });
    
    document.querySelectorAll('.buy-btn[data-owner="ai"]').forEach(btn => {
        const unitType = btn.dataset.unit;
        const definition = UNIT_DEFINITIONS[unitType];
        
        if (gameState.ai.gold < definition.cost) {
            btn.classList.add('cannot-afford');
        } else {
            btn.classList.remove('cannot-afford');
        }
    });
    
    // Update affordability indicators for upgrade buttons
    document.querySelectorAll('.upgrade-btn[data-owner="player"]').forEach(btn => {
        const unitType = btn.dataset.type;
        const upgradeLevel = gameState.player.upgradeLevels[unitType] || 0;
        const upgradeCost = ShopManager.getUpgradeCost(unitType, upgradeLevel);
        
        // Disable upgrades before game starts OR if can't afford
        if (gameState.round === 0 || gameState.player.gold < upgradeCost) {
            btn.classList.add('cannot-afford');
        } else {
            btn.classList.remove('cannot-afford');
        }
    });
    
    document.querySelectorAll('.upgrade-btn[data-owner="ai"]').forEach(btn => {
        const unitType = btn.dataset.type;
        const upgradeLevel = gameState.ai.upgradeLevels[unitType] || 0;
        const upgradeCost = ShopManager.getUpgradeCost(unitType, upgradeLevel);
        
        if (gameState.ai.gold < upgradeCost) {
            btn.classList.add('cannot-afford');
        } else {
            btn.classList.remove('cannot-afford');
        }
    });
}

// Helper to ensure cursor preview exists
function ensureCursorPreview() {
    if (!gameState.selectedUnitType) return;
    const definition = UNIT_DEFINITIONS[gameState.selectedUnitType];
    if (!definition) return;
    
    // Only create if it doesn't exist
    if (!gameState.cursorPreview || !gameState.cursorPreview.parentElement) {
        const preview = document.createElement('div');
        preview.className = `unit player ${definition.type} cursor-preview`;
        preview.innerHTML = `
            <div class="unit-hp">${definition.hp}</div>
            <div class="health-bar">
                <div class="health-bar-fill" style="width: 100%;"></div>
            </div>
        `;
        preview.style.pointerEvents = 'none';
        preview.style.opacity = '0.6';
        preview.style.position = 'absolute';
        preview.style.display = 'none'; // Start hidden, mousemove will show it
        DOM.playerZone.appendChild(preview);
        gameState.cursorPreview = preview;
    }
}

function selectUnitForPlacement(unitType) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    gameState.selectedUnitType = unitType;
    
    // Remove old preview if type changed
    if (gameState.cursorPreview) {
        gameState.cursorPreview.remove();
        gameState.cursorPreview = null;
    }
    
    // Create new preview immediately visible
    const preview = document.createElement('div');
    preview.className = `unit player ${definition.type} cursor-preview`;
    preview.innerHTML = `
        <div class="unit-hp">${definition.hp}</div>
        <div class="health-bar">
            <div class="health-bar-fill" style="width: 100%;"></div>
        </div>
    `;
    preview.style.pointerEvents = 'none';
    preview.style.opacity = '0.6';
    preview.style.position = 'absolute';
    preview.style.left = '0px';
    preview.style.top = '0px';
    preview.style.display = 'block';
    DOM.playerZone.appendChild(preview);
    gameState.cursorPreview = preview;
    
    if (gameState.player.gold < definition.cost) {
        console.log('Not enough gold for ' + definition.name + ' (need ' + definition.cost + ')');
    } else {
        console.log('Click in the blue zone to place ' + definition.name);
    }
}

function upgradeUnit(unitType) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    // Can't upgrade before game starts
    if (gameState.round === 0) {
        console.log('Cannot upgrade units before the game starts!');
        return;
    }
    
    const upgradeLevel = gameState.player.upgradeLevels[unitType] || 0;
    const upgradeCost = ShopManager.getUpgradeCost(unitType, upgradeLevel);
    
    if (gameState.player.gold < upgradeCost) {
        console.log(`Not enough gold to upgrade ${definition.name} (need ${upgradeCost}g)`);
        return;
    }
    
    gameState.player.gold -= upgradeCost;
    gameState.player.upgradeLevels[unitType]++;
    
    // Upgrade existing units of this type in player zone
    const playerUnits = gameState.units.filter(u => 
        u.type === unitType && 
        u.owner === 'player' && 
        u.element && 
        u.element.parentElement === DOM.playerZone
    );
    playerUnits.forEach(unit => {
        const newLevel = gameState.player.upgradeLevels[unitType];
        const hpMult = Math.pow(GAME_CONFIG.UPGRADE_HP_MULTIPLIER, newLevel);
        const dmgMult = Math.pow(GAME_CONFIG.UPGRADE_DAMAGE_MULTIPLIER, newLevel);
        const cooldownMult = Math.max(Math.pow(GAME_CONFIG.UPGRADE_COOLDOWN_MULTIPLIER, newLevel), GAME_CONFIG.MIN_COOLDOWN_MULTIPLIER);
        const aoeMult = Math.min(Math.pow(GAME_CONFIG.UPGRADE_AOE_MULTIPLIER, newLevel), GAME_CONFIG.MAX_AOE_MULTIPLIER);
        
        // Update unit stats
        const hpPercent = unit.hp / unit.maxHp; // Preserve HP percentage
        unit.maxHp = Math.round(definition.maxHp * hpMult);
        unit.hp = Math.round(unit.maxHp * hpPercent);
        unit.damage = Math.round(definition.damage * dmgMult);
        unit.healAmount = Math.round((definition.healAmount || 0) * dmgMult);
        unit.attackCooldown = Math.round(definition.attackCooldown * cooldownMult);
        unit.aoeRadius = Math.round((definition.aoeRadius || 0) * aoeMult);
        unit.upgradeLevel = newLevel;
        
        // Update healer targets
        if (definition.maxTargets) {
            const bonusTargets = Math.floor(newLevel / 5);
            unit.maxTargets = Math.min(definition.maxTargets + bonusTargets, 5);
        }
        
        // Update ranged pierce
        if (unitType === 'ranged') {
            unit.pierceCount = Math.min(Math.floor(newLevel / 5), 2);
        }
    });
    
    // Update shop display
    updateUpgradeButtons();
    updateUI();
    
    console.log(`Upgraded ${definition.name} to level ${gameState.player.upgradeLevels[unitType]}!`);
}

function updateUpgradeButtons() {
    // Update both player and AI shops
    ['player', 'ai'].forEach(owner => {
        const types = ['melee', 'ranged', 'caster', 'healer'];
        types.forEach(type => {
            const upgradeLevel = owner === 'player' ? gameState.player.upgradeLevels[type] : gameState.ai.upgradeLevels[type];
            const unitCost = ShopManager.getUnitCost(type, upgradeLevel);
            const upgradeCost = ShopManager.getUpgradeCost(type, upgradeLevel);
            
            // Update upgrade button
            const upgradeBtn = document.querySelector(`.upgrade-btn[data-type="${type}"][data-owner="${owner}"]`);
            if (upgradeBtn) {
                upgradeBtn.innerHTML = `
                    <div>Upgrade (${upgradeCost}g)</div>
                    <small>Lvl ${upgradeLevel} → ${upgradeLevel + 1}</small>
                `;
            }
            
            // Update buy button with new cost and stats
            const buyBtn = document.querySelector(`.buy-btn[data-unit="${type}"][data-owner="${owner}"]`);
            if (buyBtn) {
                const nameElem = buyBtn.querySelector('.unit-name');
                const statsElem = buyBtn.querySelector('.unit-stats');
                if (nameElem) {
                    nameElem.textContent = `${ShopManager.capitalizeFirst(type)} [Lvl ${upgradeLevel}] (${unitCost}g)`;
                }
                if (statsElem) {
                    statsElem.textContent = ShopManager.getStatsText(type, upgradeLevel);
                }
            }
        });
    });
}

function setupEventListeners() {
    // Unit purchase buttons - delegate from player shop container only
    const playerShop = document.getElementById('player-shop');
    if (playerShop) {
        playerShop.addEventListener('click', (e) => {
            const buyBtn = e.target.closest('.buy-btn');
            if (buyBtn && buyBtn.dataset.owner === 'player') {
                const unitType = buyBtn.dataset.unit;
                selectUnitForPlacement(unitType);
                return;
            }
            
            const upgradeBtn = e.target.closest('.upgrade-btn');
            if (upgradeBtn && upgradeBtn.dataset.owner === 'player') {
                const unitType = upgradeBtn.dataset.type;
                upgradeUnit(unitType);
                return;
            }
        });
    }
    
    // Unit placement in player zone
    DOM.playerZone.addEventListener('click', (e) => {
        if (gameState.selectedUnitType) {
            const rect = DOM.playerZone.getBoundingClientRect();
            const x = e.clientX - rect.left - 20; // Center the unit (half of 40px width)
            const y = e.clientY - rect.top - 20; // Center the unit (half of 40px height)
            placeUnit(gameState.selectedUnitType, x, y);
            
            // Temporarily hide the preview to avoid blur/overlap with placed unit
            if (gameState.cursorPreview) {
                gameState.cursorPreview.style.display = 'none';
            }
        }
    });
    
    // Placement preview cursor
    DOM.playerZone.addEventListener('mousemove', (e) => {
        if (gameState.selectedUnitType) {
            DOM.playerZone.style.cursor = 'none';
            
            // Ensure preview exists
            ensureCursorPreview();
            
            if (gameState.cursorPreview) {
                const rect = DOM.playerZone.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                gameState.cursorPreview.style.left = (x - 10) + 'px';
                gameState.cursorPreview.style.top = (y - 10) + 'px';
                gameState.cursorPreview.style.display = 'block';
            }
        } else {
            DOM.playerZone.style.cursor = 'default';
            if (gameState.cursorPreview) {
                gameState.cursorPreview.style.display = 'none';
            }
        }
    });
    
    // Hide cursor preview when leaving player zone
    DOM.playerZone.addEventListener('mouseleave', () => {
        if (gameState.cursorPreview) {
            gameState.cursorPreview.style.display = 'none';
        }
    });
    
    // Pause button
    document.getElementById('pause-btn').addEventListener('click', () => {
        const wasPaused = gameState.isPaused;
        gameState.isPaused = !gameState.isPaused;
        document.getElementById('pause-btn').textContent = gameState.isPaused ? 'Resume' : 'Pause';
        
        // Track pause time for all units
        const now = gameState.gameTime;
        if (gameState.isPaused) {
            // Game just paused - mark pause start time for all units
            gameState.units.forEach(unit => {
                unit.lastPauseStart = now;
            });
        } else if (wasPaused) {
            // Game just unpaused - add elapsed pause time to all units
            gameState.units.forEach(unit => {
                if (unit.lastPauseStart) {
                    unit.pausedTime += now - unit.lastPauseStart;
                    unit.lastPauseStart = null;
                }
            });
        }
    });
    
    // Page Visibility API - pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !gameState.isPaused) {
            // Tab hidden - pause the game
            const now = gameState.gameTime;
            gameState.isPaused = true;
            document.getElementById('pause-btn').textContent = 'Resume';
            
            // Mark pause start time for all units
            gameState.units.forEach(unit => {
                unit.lastPauseStart = now;
            });
        } else if (!document.hidden && gameState.isPaused) {
            // Tab visible again - unpause the game
            const now = gameState.gameTime;
            gameState.isPaused = false;
            document.getElementById('pause-btn').textContent = 'Pause';
            
            // Add elapsed pause time to all units
            gameState.units.forEach(unit => {
                if (unit.lastPauseStart) {
                    unit.pausedTime += now - unit.lastPauseStart;
                    unit.lastPauseStart = null;
                }
            });
        }
    });
    
    // Target lines toggle
    document.getElementById('target-lines-btn').addEventListener('click', () => {
        gameState.showTargetLines = !gameState.showTargetLines;
        document.getElementById('target-lines-btn').textContent = 
            gameState.showTargetLines ? 'Hide Target Lines' : 'Show Target Lines';
        
        // Clean up existing lines if disabling
        if (!gameState.showTargetLines) {
            document.querySelectorAll('.target-line').forEach(line => line.remove());
            gameState.units.forEach(unit => {
                unit.targetLine = null;
            });
        }
    });
    
    // Economy upgrade
    document.getElementById('economy-upgrade-btn').addEventListener('click', () => {
        upgradeEconomy();
    });
    
    // Restart button
    document.getElementById('restart-btn').addEventListener('click', () => {
        location.reload();
    });
    
    // AI settings toggle
    document.getElementById('ai-settings-toggle').addEventListener('click', () => {
        const content = document.getElementById('ai-settings-content');
        const toggleBtn = document.getElementById('ai-settings-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleBtn.classList.add('expanded');
        } else {
            content.style.display = 'none';
            toggleBtn.classList.remove('expanded');
        }
    });
    
    // Speed control buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseInt(btn.dataset.speed);
            gameState.gameSpeed = speed;
            
            // Update active button styling
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Player AI strategy selection buttons (for AI vs AI mode)
    document.querySelectorAll('.player-ai-strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const strategy = btn.dataset.strategy;
            console.log('Player AI strategy button clicked:', strategy);
            
            gameState.selectedPlayerAIStrategy = strategy;
            
            // Update active state
            document.querySelectorAll('.player-ai-strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // AI strategy selector
    document.querySelectorAll('.ai-strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedStrategy = btn.dataset.strategy;
            console.log('AI Strategy button clicked:', selectedStrategy);
            if (selectedStrategy === 'RANDOM') {
                gameState.selectedAIStrategy = null;
                // Update label to show random
                const aiZoneLabel = document.getElementById('ai-zone-label');
                if (aiZoneLabel) aiZoneLabel.textContent = 'AI (Random)';
            } else {
                gameState.selectedAIStrategy = selectedStrategy;
                // Update label to show selected strategy name
                const strategyName = AI_STRATEGIES[selectedStrategy]?.name || 'AI';
                const aiZoneLabel = document.getElementById('ai-zone-label');
                if (aiZoneLabel) aiZoneLabel.textContent = strategyName;
            }
            
            // Update active button styling
            document.querySelectorAll('.ai-strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            console.log('Selected AI strategy:', gameState.selectedAIStrategy);
        });
    });
    
    // AI vs AI mode toggle
    document.getElementById('ai-vs-ai-btn').addEventListener('click', () => {
        gameState.isAIvsAI = !gameState.isAIvsAI;
        const btn = document.getElementById('ai-vs-ai-btn');
        
        if (gameState.isAIvsAI) {
            btn.style.background = '#2ecc71';
            btn.textContent = 'AI vs AI: ON';
            
            // Start the game if not started
            if (!gameState.firstUnitPlaced) {
                gameState.firstUnitPlaced = true;
                const messageDiv = document.getElementById('first-unit-message');
                messageDiv.style.display = 'none';
                
                // Enable economy button
                const economyBtn = document.getElementById('economy-upgrade-btn');
                if (economyBtn) {
                    economyBtn.disabled = false;
                }
            }
        } else {
            btn.style.background = '';
            btn.textContent = 'AI vs AI: OFF';
            btn.disabled = false;
            // Restore Build Area label
            const playerZoneLabel = document.getElementById('player-zone-label');
            if (playerZoneLabel) {
                playerZoneLabel.textContent = 'Build Area';
            }
        }
        
        // Restart the game with new settings
        restartGame();
    });
    
    // Difficulty selector
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update difficulty
            gameState.difficulty = btn.dataset.difficulty;
            
            // Update active button styling
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update AI boost display
            updateUI();
        });
    });
    
    // Sound toggle button
    document.getElementById('sound-toggle-btn').addEventListener('click', () => {
        SoundSystem.toggle();
        const btn = document.getElementById('sound-toggle-btn');
        btn.textContent = SoundSystem.enabled ? 'Sound: ON' : 'Sound: OFF';
        btn.style.background = SoundSystem.enabled ? '' : '#e74c3c';
    });
    
    // Infinite mode toggle button
    document.getElementById('infinite-mode-btn').addEventListener('click', () => {
        gameState.infiniteMode = !gameState.infiniteMode;
        const btn = document.getElementById('infinite-mode-btn');
        btn.textContent = gameState.infiniteMode ? 'Infinite Mode: ON' : 'Infinite Mode: OFF';
        btn.style.background = gameState.infiniteMode ? '#2ecc71' : '';
    });
}
