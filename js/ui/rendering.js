// Rendering system - handles visual element creation

function createUnitElement(unit, container) {
    const el = document.createElement('div');
    el.className = `unit ${unit.owner} ${unit.type}`;
    el.style.left = unit.x + 'px';
    el.style.top = unit.y + 'px';
    
    // Only show timer in build zones (player-zone and ai-zone)
    const isInBuildZone = container === DOM.playerZone || container === DOM.aiZone;
    const timerHtml = isInBuildZone ? '<div class="unit-timer">40s</div>' : '';
    
    el.innerHTML = `
        ${timerHtml}
        <div class="unit-hp">${unit.hp}</div>
        <div class="health-bar">
            <div class="health-bar-fill"></div>
        </div>
        <div class="cooldown-bar">
            <div class="cooldown-bar-fill"></div>
        </div>
    `;
    
    container.appendChild(el);
    unit.element = el;
    unit.updateHealthBar();
}
