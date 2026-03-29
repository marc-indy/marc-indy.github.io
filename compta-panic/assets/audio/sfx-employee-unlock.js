// SFX_EMPLOYEE_UNLOCK — Déblocage employé : son magique shimmer
// Sine wave 600→1200Hz avec décroissance douce, deux oscillateurs désyntonisés, 500ms
export const SFX_EMPLOYEE_UNLOCK = {
    key: 'SFX_EMPLOYEE_UNLOCK',
    volume: 0.55,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        const dur = 0.5;
        // Primary shimmer sweep
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + dur * 0.65);
        osc.frequency.exponentialRampToValueAtTime(900, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume, now + 0.04);
        gain.gain.setValueAtTime(this.volume, now + 0.28);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain).connect(dest);
        osc.start(now);
        osc.stop(now + dur + 0.05);
        // Shimmer second osc — slightly detuned for sparkle
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(618, now);
        osc2.frequency.exponentialRampToValueAtTime(1236, now + dur * 0.65);
        osc2.frequency.exponentialRampToValueAtTime(927, now + dur);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(this.volume * 0.28, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc2.connect(gain2).connect(dest);
        osc2.start(now);
        osc2.stop(now + dur + 0.05);
        // High sparkle ding at peak
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = 2400;
        const gain3 = ctx.createGain();
        gain3.gain.setValueAtTime(0, now + 0.28);
        gain3.gain.linearRampToValueAtTime(this.volume * 0.18, now + 0.30);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc3.connect(gain3).connect(dest);
        osc3.start(now + 0.28);
        osc3.stop(now + 0.48);
    }
};
