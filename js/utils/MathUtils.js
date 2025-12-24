// Math utility functions for game calculations
const MathUtils = {
    // Calculate 2D distance between two points/units
    distance2D(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Calculate angle between two points
    angleBetween(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return Math.atan2(dy, dx);
    },
    
    // Normalize a vector
    normalize(dx, dy) {
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return { x: 0, y: 0 };
        return { x: dx / length, y: dy / length };
    },
    
    // Convert radians to degrees
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
};
