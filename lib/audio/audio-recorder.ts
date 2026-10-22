export interface AudioRecorderOptions {
  onAudioData: (base64Pcm: string) => void;
  onVolumeChange?: (volume: number) => void;
  sampleRate?: number;
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private options: AudioRecorderOptions;
  private isRecording = false;
  private isMuted = false;

  constructor(options: AudioRecorderOptions) {
    this.options = {
      sampleRate: 16000,
      ...options,
    };
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.mediaStream = stream;

    // Use Web Audio API for resampling and PCM conversion
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // Buffer size 2048 or 4096 gives ~50-100ms chunks, optimal for live streaming
    const bufferSize = 2048;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    const targetRate = this.options.sampleRate || 16000;
    const inputRate = this.audioContext.sampleRate;

    this.processorNode.onaudioprocess = (event) => {
      if (!this.isRecording || this.isMuted) {
        if (this.options.onVolumeChange) this.options.onVolumeChange(0);
        return;
      }

      const inputBuffer = event.inputBuffer.getChannelData(0);

      // 1. Calculate volume RMS for visualizer
      if (this.options.onVolumeChange) {
        let sumSquares = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sumSquares += inputBuffer[i] * inputBuffer[i];
        }
        const rms = Math.sqrt(sumSquares / inputBuffer.length);
        const volume = Math.min(100, Math.round(rms * 280));
        this.options.onVolumeChange(volume);
      }

      // 2. Resample to 16,000 Hz if input is higher (e.g. 44100 / 48000)
      let pcm16: Int16Array;
      if (inputRate === targetRate) {
        pcm16 = this.floatToInt16(inputBuffer);
      } else {
        const resampled = this.downsample(inputBuffer, inputRate, targetRate);
        pcm16 = this.floatToInt16(resampled);
      }

      // 3. Convert Int16Array to Base64 and send
      if (pcm16.length > 0) {
        const base64 = this.int16ToBase64(pcm16);
        this.options.onAudioData(base64);
      }
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stop(): void {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignore already closed
      }
      this.audioContext = null;
    }

    if (this.options.onVolumeChange) {
      this.options.onVolumeChange(0);
    }
  }

  setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  private downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return buffer;
    const ratio = fromRate / toRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.min(Math.floor(i * ratio), buffer.length - 1);
      result[i] = buffer[sourceIndex];
    }
    return result;
  }

  private floatToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const output = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private int16ToBase64(int16Array: Int16Array): string {
    const uint8 = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
    let binary = "";
    const len = uint8.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const slice = uint8.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, slice as any);
    }
    return btoa(binary);
  }
}
