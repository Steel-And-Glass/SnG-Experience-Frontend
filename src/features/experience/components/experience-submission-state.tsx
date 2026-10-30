"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./experience-submission-state.module.css";

interface Props {
  state: "PLANNING" | "SUBMITTING" | "SUCCESS" | "ERROR";
  error: string;
  agenda?: ReactNode;
  onRetry: () => void;
  onEdit: () => void;
}

export function ExperienceSubmissionState({ state, error, agenda, onRetry, onEdit }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const received = state === "SUCCESS";
  const hasAgenda = (received || state === "PLANNING") && Boolean(agenda);
  useEffect(() => {
    if (state !== "SUBMITTING") heading.current?.focus();
  }, [state, hasAgenda]);
  const title = state === "SUBMITTING" ? "Estamos preparando tu proyecto."
    : state === "PLANNING" ? "Demos forma a tu proyecto."
    : state === "ERROR" ? "Tu información sigue aquí."
    : hasAgenda ? "Gracias, ya tenemos la información necesaria." : "Ya conocemos un poco mejor tu proyecto.";
  return <main lang="es" className={styles.page}>
    <header className={styles.header}><span className={styles.brand}>steel and glass</span><span className={styles.headerNote}>Arquitectura en vidrio</span></header>
    <div key={hasAgenda ? "agenda" : state} className={`${styles.layout} ${hasAgenda ? styles.withAgenda : ""}`}>
      <aside className={styles.rail} aria-hidden="true"><span>EXPERIENCIA S&amp;G</span><span className={styles.rule} /><span>Un proyecto.<br />Una nueva forma de habitar.</span></aside>
      <section className={styles.content} aria-labelledby="submission-heading" aria-busy={state === "SUBMITTING"}>
        <p className={styles.eyebrow} role="status">{received && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}{state === "ERROR" ? "NO PUDIMOS COMPLETAR EL ENVÍO" : received ? "PROYECTO RECIBIDO" : "EXPERIENCIA S&G"}</p>
        <h1 id="submission-heading" ref={heading} tabIndex={-1} className={styles.headline}>{title}</h1>
        {state === "SUBMITTING" ? <>
          <p className={styles.copy} role="status">Estamos enviando la información que compartiste con steel and glass.</p>
          <div className={styles.progress} aria-hidden="true"><span /></div>
          <p className={styles.note}>Un momento, por favor.</p>
        </> : state === "ERROR" ? <>
          <p className={styles.copy}>No logramos enviar tu proyecto en este momento. Puedes intentarlo nuevamente sin perder las respuestas ni los archivos que ya preparaste.</p>
          {error && <p role="alert" className={styles.detail}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={onRetry}>Reintentar envío <span aria-hidden="true">↗</span></button>
            <button type="button" className={styles.secondary} onClick={onEdit}>Revisar información</button>
          </div>
          <p className={styles.note}>Tus respuestas permanecen en esta sesión mientras sigas en esta página.</p>
        </> : hasAgenda ? agenda : <>
          <p className={styles.copy}>Gracias por compartir tu información con steel and glass. Nuestro equipo continuará con la revisión y se pondrá en contacto contigo.</p>
          <div className={styles.actions}><Link href="/" className={styles.primary}>Volver al inicio <span aria-hidden="true">↗</span></Link></div>
        </>}
      </section>
    </div>
    <footer className={styles.footer}><span>Diseño, confort y precisión.</span><span>steel and glass</span></footer>
  </main>;
}
