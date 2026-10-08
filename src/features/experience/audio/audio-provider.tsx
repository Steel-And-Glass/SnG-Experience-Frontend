"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { ExperienceAudioController } from "./controller";
import { experienceAudioConfig } from "./config";

const AudioContext = createContext<ExperienceAudioController | null>(null);

export function ExperienceAudioProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() => new ExperienceAudioController(experienceAudioConfig));
  useEffect(() => {
    controller.setBaseVolume(experienceAudioConfig.baseVolume);
  }, [controller]);
  useEffect(() => {
    controller.prepare();
    return () => controller.dispose();
  }, [controller]);
  return <AudioContext.Provider value={controller}>{children}</AudioContext.Provider>;
}

export function useExperienceAudio() {
  const controller = useContext(AudioContext);
  if (!controller) throw new Error("ExperienceAudioProvider is required");
  return controller;
}

export function ExperienceAudioControl() {
  const controller = useExperienceAudio();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const label = !state.available ? "Sonido no disponible" : state.starting ? "Activando sonido" :
    state.failed ? "Reintentar sonido" : !state.enabled ? "Activar sonido" :
    state.muted ? "Sonido silenciado" : "Sonido activado";
  return <button type="button" disabled={!state.available || state.starting}
    aria-label={state.enabled ? (state.muted ? "Reactivar sonido" : "Silenciar sonido") : label}
    aria-pressed={state.enabled && !state.muted}
    className="fixed right-5 top-12 z-20 min-h-11 sm:right-8 lg:right-10 shrink-0 rounded-sm px-2 text-[11px] text-stone-200 enabled:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-100 disabled:opacity-60"
    onClick={() => {
      if (state.enabled) controller.setMuted(!state.muted);
      else void controller.enable();
    }}>{label}</button>;
}
