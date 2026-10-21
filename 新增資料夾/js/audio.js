/**
 * 展覽沉浸式音效引擎 - Web Audio API 程序化合成音效
 * 無需外部音訊檔案，無延遲、無 CORS 限制、支援全平台瀏覽器
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.masterGain = null;
    this.hasInteracted = false;
  }

  // 延遲初始化 AudioContext (符合瀏覽器 Autoplay 政策)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.hasInteracted = true;
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 1. 復古火車鳴笛聲 (多重泛音 + 滑音)
  playWhistle() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const duration = 1.4;

    // 和弦頻率 (近似經典蒸汽/電氣機車鳴笛和弦)
    const freqs = [349.23, 440.0, 523.25, 698.46]; // F4, A4, C5, F5
    const master = this.ctx.createGain();
    master.connect(this.masterGain);

    master.gain.setValueAtTime(0.001, now);
    master.gain.linearRampToValueAtTime(0.35, now + 0.15);
    master.gain.exponentialRampToValueAtTime(0.001, now + duration);

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.98, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + duration);

      gain.gain.value = 0.25 / freqs.length;
      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // 2. 鐵道進站鐘琴聲 (日台鐵道經典音階: G4 -> C5 -> D5 -> G5)
  playStationChime() {
    if (this.isMuted) return;
    this.init();
    const notes = [392.0, 523.25, 587.33, 783.99]; // G4, C5, D5, G5
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const noteTime = startTime + idx * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.85);
    });
  }

  // 3. 蓋紀念印章聲 (木質印章下壓清脆悶響)
  playStampSound() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // 重低音衝擊 (木頭撞擊台面)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);

    // 墨水黏滯微雜音
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // 4. 精緻 UI 互動觸控聲
  playButtonClick() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 5. 探索通關與獎勵旋律
  playSuccessFanfare() {
    if (this.isMuted) return;
    this.init();
    const chord = [
      { f: 523.25, t: 0 },    // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.50, t: 0.36 } // C6
    ];
    const now = this.ctx.currentTime;
    chord.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.01, now + n.t);
      gain.gain.linearRampToValueAtTime(0.2, now + n.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + 0.65);
    });
  }

  // 6. 時光列車行駛背景氛圍節奏 (Click-Clack)
  toggleTrainAmbience(forceStart = null) {
    this.init();
    const target = forceStart !== null ? forceStart : !this.isBgmPlaying;
    if (target === this.isBgmPlaying) return this.isBgmPlaying;

    this.isBgmPlaying = target;
    if (this.isBgmPlaying) {
      this._startRhythm();
    } else {
      this._stopRhythm();
    }
    return this.isBgmPlaying;
  }

  _startRhythm() {
    this._stopRhythm();
    const playTick = () => {
      if (!this.isBgmPlaying || this.isMuted) return;
      const now = this.ctx.currentTime;
      // 模擬鐵軌接縫節奏 (嗒嗒...嗒嗒)
      [0, 0.14, 0.45, 0.59].forEach(offset => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(75, now + offset);
        osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.06);

        gain.gain.setValueAtTime(0.08, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    };
    playTick();
    this.bgmTimer = setInterval(playTick, 1400);
  }

  _stopRhythm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// 導出全域音效單例
window.soundEngine = new SoundEngine();
