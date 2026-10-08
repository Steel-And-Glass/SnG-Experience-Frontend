import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { designNeutralImage } from "../config/design-images";
import styles from "./design-scene-image.module.css";

function IncomingImage({ src, onReady, onFailure }: {
  src: string;
  onReady: (src: string) => void;
  onFailure: (src: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const timeout = window.setTimeout(() => onFailure(src), 15000);
    return () => window.clearTimeout(timeout);
  }, [src, loaded, onFailure]);

  return <Image src={src} alt="" fill sizes="100vw" loading="eager"
    className={`${styles.image} ${loaded ? styles.enter : styles.pending}`}
    onLoad={() => setLoaded(true)} onError={() => onFailure(src)}
    onAnimationEnd={() => { if (loaded) onReady(src); }} />;
}

// At most two layers: the last completed image stays opaque until its
// replacement has loaded and finished fading in. No questionnaire state here.
export function DesignSceneImage({ activeImageSrc }: { activeImageSrc: string }) {
  const [current, setCurrent] = useState(designNeutralImage);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [failed, setFailed] = useState<readonly string[]>([]);
  const target = failed.includes(activeImageSrc) ? designNeutralImage : activeImageSrc;
  // Lock the incoming layer until its fade completes. The latest prop is the
  // pending request, so rapid clicks never unmount a partially visible image.
  if (incoming === null && target !== current && !failed.includes(target)) setIncoming(target);
  const fail = useCallback((src: string) => {
    setFailed((previous) => previous.includes(src) ? previous : [...previous, src]);
    setIncoming((previous) => previous === src ? null : previous);
  }, []);

  return <>
    <Image src={current} alt="" fill sizes="100vw" className={styles.image} />
    {incoming !== null && <IncomingImage key={incoming} src={incoming} onFailure={fail}
      onReady={(src) => {
        if (src !== incoming) return;
        setCurrent(src);
        setIncoming(null);
      }} />}
  </>;
}
