import type { ExperienceAudioConfig } from "./config";

export interface AudioState {
  available: boolean;
  initialized: boolean;
  enabled: boolean;
  muted: boolean;
  starting: boolean;
  failed: boolean;
  baseVolume: number;
  effectiveVolume: number;
}

const clamp = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export class ExperienceAudioController {
  private audio?: HTMLAudioElement;
  private frame?: number;
  private generation = 0;
  private listeners = new Set<() => void>();
  private state: AudioState;

  constructor(private config: ExperienceAudioConfig) {
    this.state = {
      available: Boolean(config.source), initialized: false, enabled: false,
      muted: false, starting: false, failed: false,
      baseVolume: clamp(config.baseVolume), effectiveVolume: clamp(config.baseVolume),
    };
  }

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private onError = () => {
    this.generation++;
    this.cancelFade();
    this.audio?.pause();
    this.update({ enabled: false, starting: false, failed: true });
  };

  // Prepare the same media element that enable() will play, without autoplay.
  prepare() {
    if (!this.config.source || this.audio || typeof Audio === "undefined") return;
    this.audio = new Audio();
    this.audio.autoplay = false;
    this.audio.preload = "auto";
    this.audio.loop = this.config.loop;
    this.audio.volume = this.state.effectiveVolume;
    this.audio.muted = this.state.muted;
    this.audio.addEventListener("error", this.onError);
    this.audio.src = this.config.source;
    this.update({ initialized: true });
    this.audio.load();
  }

  // Playback still requires an explicit user action.
  async enable() {
    if (!this.config.source || this.state.starting) return;
    const generation = ++this.generation;
    this.update({ starting: true, failed: false });
    try {
      this.prepare();
      if (!this.audio) throw new Error("Audio is unavailable");
      if (this.audio.error) this.audio.load();
      this.audio.volume = this.state.effectiveVolume;
      this.audio.muted = this.state.muted;
      await this.audio.play();
      if (generation === this.generation) this.update({ enabled: true, starting: false });
    } catch {
      if (generation === this.generation) this.update({ enabled: false, starting: false, failed: true });
    }
  }

  setMuted(muted: boolean) {
    if (!this.config.source) return;
    if (this.audio) this.audio.muted = muted;
    this.update({ muted });
  }

  private cancelFade() {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  // Seconds; a replacement fade starts from the last applied effective volume.
  setEffectiveVolume(target: number, duration = 0.3) {
    if (!this.config.source) return;
    this.cancelFade();
    const end = clamp(target);
    const start = this.state.effectiveVolume;
    const apply = (value: number) => {
      if (this.audio) this.audio.volume = value;
      this.update({ effectiveVolume: value });
    };
    if (!this.audio || !Number.isFinite(duration) || duration <= 0) { apply(end); return; }
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - started) / (duration * 1000)));
      apply(start + (end - start) * progress);
      this.frame = progress < 1 ? requestAnimationFrame(tick) : undefined;
    };
    this.frame = requestAnimationFrame(tick);
  }

  restoreBaseVolume(duration = 0.3) {
    this.setEffectiveVolume(this.state.baseVolume, duration);
  }

  // Keep a mounted controller in sync with configuration edits, preserving attenuation.
  setBaseVolume(volume: number) {
    const baseVolume = clamp(volume);
    if (baseVolume === this.state.baseVolume) return;
    const factor = this.state.baseVolume > 0 ? this.state.effectiveVolume / this.state.baseVolume : 1;
    this.update({ baseVolume });
    this.setEffectiveVolume(baseVolume * factor);
  }

  dispose() {
    this.generation++;
    this.cancelFade();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener("error", this.onError);
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = undefined;
    }
    this.update({ initialized: false, enabled: false, starting: false, failed: false });
  }
}
