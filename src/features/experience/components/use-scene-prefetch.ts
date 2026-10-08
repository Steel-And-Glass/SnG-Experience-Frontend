import { useEffect } from "react";
import { getImageProps } from "next/image";
import { scenes } from "../config/scenes";
import { designImages } from "../config/design-images";
import { finishImages } from "../config/design-finishes";

// Retain decoded images across scene mounts; failed requests remain retryable.
const prefetched = new Map<string, HTMLImageElement>();

export function useScenePrefetch(sceneId: string) {
  useEffect(() => {
    const scene = scenes.find((entry) => entry.id === sceneId);
    const next = scenes.find((entry) => entry.id === scene?.nextSceneId);
    const sources = next?.backgroundImage ? [next.backgroundImage] : [];
    if (sceneId === "diseno") {
      sources.push(...Object.values({ ...designImages, ...finishImages })
        .filter((entry) => entry.available).map((entry) => entry.src));
    }
    for (const src of sources) {
      // Match the rendered Image's responsive optimized URL, not just the R2 original.
      const { props } = getImageProps({ src, alt: "", fill: true, sizes: "100vw" });
      const key = `${props.src}|${window.innerWidth}|${window.devicePixelRatio}`;
      if (prefetched.has(key)) continue;
      const image = new window.Image();
      prefetched.set(key, image);
      image.decoding = "async";
      image.fetchPriority = "low";
      image.onerror = () => { prefetched.delete(key); };
      image.onload = () => { void image.decode().catch(() => {}); };
      image.sizes = props.sizes ?? "100vw";
      if (props.srcSet) image.srcset = props.srcSet;
      image.src = props.src;
    }
  }, [sceneId]);
}
