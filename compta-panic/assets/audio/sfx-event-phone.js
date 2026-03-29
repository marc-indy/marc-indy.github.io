// SFX_EVENT_PHONE — Phone ring
// Alternating high tones
export const SFX_EVENT_PHONE = {
    key: 'SFX_EVENT_PHONE',
    volume: 0.8,
    priority: 'HIGH',
    play(ctx, dest) {
        const now = ctx.currentTime;
        // Two bursts, each with alternating tones
        for (let burst = 0; burst < 2; burst++) {
            const bStart = now + burst * 0.3;
            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 880;
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = 1100;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(this.volume * 0.4, bStart);
            gain.gain.setValueAtTime(this.volume * 0.4, bStart + 0.15);
            gain.gain.setValueAtTime(0, bStart + 0.16);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(dest);
            osc1.start(bStart);
            osc2.start(bStart);
            osc1.stop(bStart + 0.16);
            osc2.stop(bStart + 0.16);
        }
    }
};
