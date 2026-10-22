import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AnswerValue, Question } from "../types/question";
import { finishCoverGeometry, finishHotspots } from "../config/design-finishes";
import styles from "./design-finish.module.css";

interface Props {
  question: Extract<Question, { type: "single-choice" }>;
  value: AnswerValue | undefined;
  onChange: (value: string) => void;
  progress?: { current: number; total: number };
  navigation: ReactNode;
  children?: ReactNode;
}

export function DesignFinishHotspots({ question, value, onChange, progress, navigation, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedId, setSelectedId] = useState<string>();
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const geometry = finishCoverGeometry(size.width, size.height);
  // Short desktop windows still show usable samples: height alone must not
  // replace the scene interaction with a dropdown.
  const fallback = size.width < 768;
  const selected = finishHotspots.find((spot) => spot.id === selectedId && spot.answerValue === value)
    ?? finishHotspots.find((spot) => spot.answerValue === value);
  const deferred = question.options.filter((option) => !finishHotspots.some((spot) => spot.answerValue === option.value));
  const label = question.options.find((option) => option.value === value)?.label;

  return <div ref={root} className={styles.root}>
    <div className={styles.hotspots} role="group" aria-labelledby={`${id}-question`}>
      {finishHotspots.map((spot) => {
        const option = question.options.find((item) => item.value === spot.answerValue);
        if (!option) return null;
        return <button key={spot.id} type="button" hidden={fallback} className={styles.hotspot}
          style={{ left: geometry.x + spot.x * geometry.scale, top: geometry.y + spot.y * geometry.scale,
            width: spot.width * geometry.scale, height: spot.height * geometry.scale }}
          aria-label={option.label} aria-pressed={selected?.id === spot.id}
          onClick={() => { setSelectedId(spot.id); onChange(spot.answerValue); }}>
          <span aria-hidden="true" className={styles.tooltip}>{option.label}</span>
        </button>;
      })}
    </div>
    <div data-finish-panels className={styles.panels}>
      <div className={styles.card}>
        {progress && <p className={styles.progress}>{String(progress.current).padStart(2, "0")} / {String(progress.total).padStart(2, "0")}</p>}
        <h2 id={`${id}-question`}>{question.text}{question.required && <><span aria-hidden="true"> *</span><span className="sr-only"> (obligatorio)</span></>}</h2>
        <p className={styles.help}>{fallback ? "Selecciona tu preferencia de acabado." : "Selecciona una muestra en la materialoteca."}</p>
        <div className={styles.fallback} hidden={!fallback}>
          <select aria-labelledby={`${id}-question`} required={question.required} value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}>
            <option value="" disabled>Selecciona una opción</option>
            {question.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        {!fallback && deferred.map((option) => <button key={option.value} type="button" className={styles.defer}
          aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
        <p role="status" className="sr-only">{label ? `Acabado seleccionado: ${label}` : "Sin respuesta."}</p>
        <div data-question-nav className={styles.navigation}>{navigation}</div>
      </div>
      {children && <div className={styles.card}>{children}</div>}
    </div>
  </div>;
}
