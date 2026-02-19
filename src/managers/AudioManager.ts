/**
 * Web Audio API ベースのサウンド管理。
 * BGM (ループ) と SE (ワンショット) を再生する。
 * ブラウザの自動再生ポリシー対策として init() をユーザー操作時に呼ぶ。
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private seGain: GainNode | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;

  private buffers = new Map<string, AudioBuffer>();
  private initialized = false;

  private static instance: AudioManager;

  static get current(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** ユーザー操作のタイミングで呼ぶ */
  init(): void {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.3;
    this.bgmGain.connect(this.ctx.destination);
    this.seGain = this.ctx.createGain();
    this.seGain.gain.value = 0.5;
    this.seGain.connect(this.ctx.destination);

    this.generateSounds();
    this.initialized = true;
  }

  playBGM(): void {
    if (!this.ctx || !this.bgmGain) return;
    this.stopBGM();
    const buf = this.buffers.get("bgm");
    if (!buf) return;
    this.bgmSource = this.ctx.createBufferSource();
    this.bgmSource.buffer = buf;
    this.bgmSource.loop = true;
    this.bgmSource.connect(this.bgmGain);
    this.bgmSource.start();
  }

  stopBGM(): void {
    if (this.bgmSource) {
      this.bgmSource.stop();
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
  }

  playSE(name: string): void {
    if (!this.ctx || !this.seGain) return;
    const buf = this.buffers.get(name);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.seGain);
    src.start();
  }

  /** 短いビープ音を procedural に生成 */
  private generateSounds(): void {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;

    // Shot SE (短い高音ビープ 0.08s)
    this.buffers.set("shot", this.createTone(sr, 0.08, 880, 0.3));

    // Explosion SE (ノイズ + 減衰 0.25s)
    this.buffers.set("explosion", this.createNoise(sr, 0.25));

    // Hit SE (短い低音 0.1s)
    this.buffers.set("hit", this.createTone(sr, 0.1, 220, 0.4));

    // BGM (シンプルなアルペジオループ 2s)
    this.buffers.set("bgm", this.createBGM(sr, 2.0));
  }

  private createTone(sr: number, duration: number, freq: number, vol: number): AudioBuffer {
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const env = 1 - t / duration;
      data[i] = Math.sin(2 * Math.PI * freq * t) * env * vol;
    }
    return buf;
  }

  private createNoise(sr: number, duration: number): AudioBuffer {
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = 1 - i / len;
      data[i] = (Math.random() * 2 - 1) * env * 0.4;
    }
    return buf;
  }

  private createBGM(sr: number, duration: number): AudioBuffer {
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    const notes = [262, 330, 392, 523, 392, 330, 262, 330];
    const noteLen = len / notes.length;
    for (let n = 0; n < notes.length; n++) {
      const freq = notes[n];
      for (let i = 0; i < noteLen; i++) {
        const idx = Math.floor(n * noteLen + i);
        if (idx >= len) break;
        const t = i / sr;
        const env = Math.max(0, 1 - (i / noteLen) * 0.8);
        data[idx] = Math.sin(2 * Math.PI * freq * t) * env * 0.15;
      }
    }
    return buf;
  }
}
