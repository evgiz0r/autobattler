// Rendering system - handles visual element creation

function createUnitElement(unit, container) {
    const el = document.createElement('div');
    el.className = `unit ${unit.owner} ${unit.type}`;
    el.style.left = unit.x + 'px';
    el.style.top = unit.y + 'px';
    
    el.innerHTML = `
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
