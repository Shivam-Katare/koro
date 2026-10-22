export interface AudioPlayerOptions {
  sampleRate?: number;
  onVolumeChange?: (volume: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private options: AudioPlayerOptions;
  private isPlaying = false;
  private animFrameId: number | null = null;

  constructor(options: AudioPlayerOptions = {}) {
    this.options = {
      sampleRate: 24000,
      ...options,
    };
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: this.options.sampleRate || 24000 });
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.connect(this.audioContext.destination);
      this.startVolumeLoop();
    }
    return this.audioContext;
  }

  async playChunk(base64Pcm: string): Promise<void> {
    const ctx = this.initAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const float32Data = this.base64ToFloat32(base64Pcm);
    if (!float32Data || float32Data.length === 0) return;

    const audioBuffer = ctx.createBuffer(
      1,
      float32Data.length,
      this.options.sampleRate || 24000
    );
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    if (this.analyserNode) {
      source.connect(this.analyserNode);
    } else {
      source.connect(ctx.destination);
    }

    const currentTime = ctx.currentTime;
    // Schedule ahead for smooth gapless playback
    const startTime = Math.max(currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuffer.duration;

    this.activeSources.push(source);
    this.updatePlayingState(true);

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
      if (this.activeSources.length === 0 && ctx.currentTime >= this.nextPlayTime - 0.05) {
        this.updatePlayingState(false);
      }
    };
  }

  // Stop playback immediately on user interruption
  stop(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignore if already ended
      }
    }
    this.activeSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    } else {
      this.nextPlayTime = 0;
    }
    this.updatePlayingState(false);
    if (this.options.onVolumeChange) {
      this.options.onVolumeChange(0);
    }
  }

  close(): void {
    this.stop();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignore
      }
      this.audioContext = null;
    }
  }

  private updatePlayingState(playing: boolean): void {
    if (this.isPlaying !== playing) {
      this.isPlaying = playing;
      if (this.options.onPlaybackStateChange) {
        this.options.onPlaybackStateChange(playing);
      }
    }
  }

  private startVolumeLoop(): void {
    if (!this.options.onVolumeChange) return;

    const dataArray = new Uint8Array(128);
    const update = () => {
      if (this.analyserNode && this.isPlaying) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const vol = Math.min(100, Math.round((avg / 255) * 100));
        this.options.onVolumeChange!(vol);
      } else if (!this.isPlaying) {
        this.options.onVolumeChange!(0);
      }
      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    return float32;
  }
}
