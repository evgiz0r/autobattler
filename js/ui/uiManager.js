// UI Manager - handles UI updates and event listeners

function initializeGame() {
    // Initialize AI strategy and display its nickname
    const strategy = initializeAIStrategy();
    displayAIStrategy(strategy);
    
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

function selectUnitForPlacement(unitType) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition) return;
    
    gameState.selectedUnitType = unitType;
    
    // Create cursor preview
    if (gameState.cursorPreview) {
        gameState.cursorPreview.remove();
    }
    
    const preview = document.createElement('div');
    preview.className = `unit player ${definition.type} cursor-preview`;
    preview.style.pointerEvents = 'none';
    preview.style.opacity = '0.6';
    preview.style.position = 'absolute';
    preview.style.display = 'none';
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
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            placeUnit(gameState.selectedUnitType, x, y);
        }
    });
    
    // Placement preview cursor
    DOM.playerZone.addEventListener('mousemove', (e) => {
        if (gameState.selectedUnitType) {
            DOM.playerZone.style.cursor = 'none';
            
            if (gameState.cursorPreview) {
                const rect = DOM.playerZone.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                gameState.cursorPreview.style.left = (x - 10) + 'px'; // Center on cursor
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
        const now = Date.now();
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
            const now = Date.now();
            gameState.isPaused = true;
            document.getElementById('pause-btn').textContent = 'Resume';
            
            // Mark pause start time for all units
            gameState.units.forEach(unit => {
                unit.lastPauseStart = now;
            });
        } else if (!document.hidden && gameState.isPaused) {
            // Tab visible again - unpause the game
            const now = Date.now();
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
    
    // AI strategy selector
    document.querySelectorAll('.ai-strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedStrategy = btn.dataset.strategy;
            console.log('AI Strategy button clicked:', selectedStrategy);
            if (selectedStrategy === 'RANDOM') {
                gameState.selectedAIStrategy = null;
            } else {
                gameState.selectedAIStrategy = selectedStrategy;
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
            
            // Initialize and display player AI strategy
            if (!gameState.player.strategy) {
                const strategies = Object.keys(AI_STRATEGIES);
                const chosenKey = strategies[Math.floor(Math.random() * strategies.length)];
                gameState.player.strategy = {
                    key: chosenKey,
                    ...AI_STRATEGIES[chosenKey]
                };
                displayPlayerAIStrategy(gameState.player.strategy);
            }
            
            // Disable AI vs AI button during gameplay
            btn.disabled = true;
            
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
            btn.textContent = 'AI vs AI';
            
            // Restore Build Area label
            const playerZoneLabel = document.getElementById('player-zone-label');
            if (playerZoneLabel) {
                playerZoneLabel.textContent = 'Build Area';
            }
        }
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
