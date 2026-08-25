class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;
  private isMuted: boolean = false;
  private bgmMood: 'safehouse' | 'combat' | 'boss' = 'safehouse';

  constructor() {
    // 首次交互自動解鎖 AudioContext
    const unlock = () => {
      this.initContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playShot(type: string = 'revolver') {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;

    if (type === 'shotgun') {
      // 霰彈槍重低音轟鳴 + 擴散爆裂
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
      this.playNoiseBurst(0.2, 0.5);
    } else if (type === 'tommy') {
      // 衝鋒槍金屬連射
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
      this.playNoiseBurst(0.06, 0.3);
    } else {
      // 左輪手槍清脆點射
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
      this.playNoiseBurst(0.08, 0.4);
    }
  }

  public playSlash() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    // 刀光破空呼嘯 (Sharp Blade Whoosh & Slice)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);

    this.playNoiseBurst(0.04, 0.25);
  }

  public playHit() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    // 拳拳到肉實體打擊音效 (Punchy Impact Thump + Crunch)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);

    // 瞬態破裂音
    const snap = this.ctx.createOscillator();
    const snapG = this.ctx.createGain();
    snap.type = 'square';
    snap.frequency.setValueAtTime(800, t);
    snap.frequency.exponentialRampToValueAtTime(120, t + 0.035);
    snapG.gain.setValueAtTime(0.3, t);
    snapG.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    snap.connect(snapG);
    snapG.connect(this.ctx.destination);
    snap.start(t);
    snap.stop(t + 0.035);
  }

  public playCritHit() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    // 致命暴擊震撼音效 (Devastating Critical Slam + Glassy Crack)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(320, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
    subGain.gain.setValueAtTime(0.75, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.18);

    const hiOsc = this.ctx.createOscillator();
    const hiGain = this.ctx.createGain();
    hiOsc.type = 'sawtooth';
    hiOsc.frequency.setValueAtTime(3200, t);
    hiOsc.frequency.exponentialRampToValueAtTime(500, t + 0.06);
    hiGain.gain.setValueAtTime(0.5, t);
    hiGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    hiOsc.connect(hiGain);
    hiGain.connect(this.ctx.destination);
    hiOsc.start(t);
    hiOsc.stop(t + 0.06);
    this.playNoiseBurst(0.06, 0.4);
  }

  public playDodge() {
    if (this.isMuted || !this.ctx) return;
    this.playNoiseBurst(0.12, 0.25);
  }

  public playReload() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    // 兩聲金屬卡榫裝填聲
    const playClick = (time: number, freq: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.04);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + 0.04);
    };
    playClick(t, 900);
    playClick(t + 0.15, 1200);
  }

  public playParry() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;

    // 1. 金屬切削瞬間清脆硬質打擊音 (High-Q Metallic Transient Snap)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(4500, t);
    snapOsc.frequency.exponentialRampToValueAtTime(800, t + 0.035);

    snapGain.gain.setValueAtTime(0.65, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.035);

    // 2. 鋼鐵刀刃非整數倍頻金屬共鳴鳴響 (Steel Blade Inharmonic Resonant Partials)
    const partials = [
      { freq: 960, gain: 0.45, decay: 0.32, type: 'triangle' as OscillatorType },
      { freq: 1540, gain: 0.40, decay: 0.28, type: 'sine' as OscillatorType },
      { freq: 2480, gain: 0.35, decay: 0.36, type: 'sine' as OscillatorType },
      { freq: 3820, gain: 0.25, decay: 0.22, type: 'sine' as OscillatorType },
      { freq: 5200, gain: 0.18, decay: 0.16, type: 'sine' as OscillatorType }
    ];

    partials.forEach(p => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();

      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, t);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 0.96, t + p.decay);

      g.gain.setValueAtTime(p.gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);

      osc.connect(g);
      g.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + p.decay);
    });

    // 3. 金屬白噪聲高頻火花震盪 (Metallic Spark Burst)
    this.playNoiseBurst(0.025, 0.35);
  }

  public playCash() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.setValueAtTime(1900, t + 0.05);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playExplosion() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.4);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
    this.playNoiseBurst(0.35, 0.6);
  }

  public playBoonCard() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    const t = this.ctx.currentTime;
    // 爵士和弦 鋼琴音效 (Dm9)
    const freqs = [293.66, 349.23, 440.0, 523.25, 659.25];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.03);
      gain.gain.setValueAtTime(0.15, t + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + i * 0.03);
      osc.stop(t + 0.6);
    });
  }

  private playNoiseBurst(duration: number, volume: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  public setMood(mood: 'safehouse' | 'combat' | 'boss') {
    this.bgmMood = mood;
    if (!this.bgmInterval) {
      this.startProceduralJazz();
    }
  }

  private startProceduralJazz() {
    let step = 0;
    // 爵士貝斯音符 (D Dorian)
    const bassNotes = [73.42, 82.41, 87.31, 98.0, 110.0, 98.0, 87.31, 82.41];
    
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const note = bassNotes[step % bassNotes.length];
      
      // 撥弦低音提琴
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);
      
      const vol = this.bgmMood === 'combat' ? 0.2 : (this.bgmMood === 'boss' ? 0.3 : 0.12);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);

      // 鼓刷音 (Hi-hat brush)
      if (this.bgmMood !== 'safehouse') {
        this.playNoiseBurst(0.04, 0.08);
      }

      step++;
    }, 320);
  }
}

export const AudioManager = new AudioManagerClass();
