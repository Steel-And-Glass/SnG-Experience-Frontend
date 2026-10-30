import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import styles from "./design-scene-image.module.css";

type Frame = { src: string; scene: string; order: number };
type Transition = { frame: Frame; ready: boolean; variant: boolean };

function ImageLayer({ frame, transition, leaving, onLoad, onReady, onFailure }: {
  frame: Frame; transition?: Transition; leaving: boolean;
  onLoad: () => void; onReady: () => void; onFailure: (src: string) => void;
}) {
  const incoming = Boolean(transition);
  const ready = transition?.ready ?? false;
  useEffect(() => {
    if (!incoming || ready) return;
    const timeout = window.setTimeout(() => onFailure(frame.src), 15000);
    return () => window.clearTimeout(timeout);
  }, [frame.src, incoming, ready, onFailure]);
  const animation = transition ? ready ? transition.variant ? styles.variantEnter : styles.enter : styles.pending
    : leaving ? styles.variantLeave : "";
  return <Image src={frame.src} alt="" fill sizes="100vw"
    preload={!incoming && frame.scene === "exterior"} loading={incoming ? "eager" : undefined}
    className={`${styles.image} ${animation}`}
    onLoad={() => { if (incoming) onLoad(); }} onError={() => { if (incoming) onFailure(frame.src); }}
    onAnimationEnd={() => { if (incoming && ready) onReady(); }} />;
}

// Two layers, with the latest request queued until the active fade completes.
// Loading failures leave the last completed image visible.
export function DesignSceneImage({ activeImageSrc, sceneId, sceneOrder }: {
  activeImageSrc: string; sceneId: string; sceneOrder: number;
}) {
  const [current, setCurrent] = useState<Frame>({ src: activeImageSrc, scene: sceneId, order: sceneOrder });
  const [incoming, setIncoming] = useState<Transition | null>(null);
  const [failed, setFailed] = useState<readonly string[]>([]);
  if (!incoming && activeImageSrc !== current.src && !failed.includes(activeImageSrc)) {
    setIncoming({ frame: { src: activeImageSrc, scene: sceneId, order: sceneOrder }, ready: false,
      variant: sceneId === "diseno" && current.scene === sceneId });
  }
  const fail = useCallback((src: string) => {
    setFailed((previous) => previous.includes(src) ? previous : [...previous, src]);
    setIncoming((previous) => previous?.frame.src === src ? null : previous);
  }, []);
  const motion = {
    "--image-duration": incoming?.variant ? "650ms" : "700ms",
  } as CSSProperties;
  const crossfading = incoming?.variant && incoming.ready;
  // Keep the incoming DOM image when it becomes current. Changing src on a
  // different element at fade completion can expose another decode/paint.
  const frames = incoming ? [current, incoming.frame] : [current];
  return <div className={`${styles.layers} ${crossfading ? styles.crossfade : ""}`} style={motion}>
    {frames.map(frame => <ImageLayer key={frame.src} frame={frame}
      transition={incoming?.frame.src === frame.src ? incoming : undefined}
      leaving={Boolean(crossfading && frame.src === current.src)} onFailure={fail}
      onLoad={() => setIncoming((previous) => previous ? { ...previous, ready: true } : null)}
      onReady={() => { if (incoming?.frame.src === frame.src) { setCurrent(frame); setIncoming(null); } }} />)}
  </div>;
}
