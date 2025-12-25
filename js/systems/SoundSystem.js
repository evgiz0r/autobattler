// Simple sound system using Web Audio API

const SoundSystem = {
    audioContext: null,
    enabled: true,
    lastSoundTimes: {
        hit: 0,
        death: 0,
        round: 0
    },
    
    init() {
        // Create AudioContext on first user interaction
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    },
    
    playRoundBegin() {
        if (!this.enabled) return;
        this.init();
        
        // Play ascending notes (softer and shorter)
        this.playNote(523.25, 0, 0.06); // C
        this.playNote(659.25, 0.06, 0.06); // E
        this.playNote(783.99, 0.12, 0.08); // G
    },
    
    playUnitDeath() {
        if (!this.enabled) return;
        this.init();
        
        // Play descending notes (softer and shorter)
        this.playNote(440, 0, 0.05); // A
        this.playNote(349.23, 0.05, 0.06); // F
    },
    
    playHit() {
        if (!this.enabled) return;
        this.init();
        
        // Throttle hit sounds at high game speeds (min 30ms between hits in real time)
        const now = this.audioContext.currentTime;
        const minInterval = 0.03; // 30ms minimum between hit sounds
        if (now - this.lastSoundTimes.hit < minInterval) {
            return; // Skip this sound, too soon after last one
        }
        this.lastSoundTimes.hit = now;
        
        // Play short percussive hit
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Soft percussive sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, now);
        
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        
        oscillator.start(now);
        oscillator.stop(now + 0.03);
    },
    
    playNote(frequency, delay, duration) {
        const now = this.audioContext.currentTime + delay;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
};
