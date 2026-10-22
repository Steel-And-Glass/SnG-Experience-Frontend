import { ArrowUpRightIcon } from "./arrow-up-right-icon";
import Link from "next/link";
import styles from "../home.module.css";
export function ExperienceTeaser() {
  return <section className={`${styles.section} ${styles.teaser}`} aria-labelledby="experience-title">
    <p className={styles.eyebrow}>03 / Experiencia Steel &amp; Glass</p>
    <div className={styles.teaserGrid}><h2 id="experience-title">Tu proyecto empieza<br /><em>antes de elegir<br />una ventana.</em></h2>
      <div className={styles.teaserAside}><p>Recorre nuestra experiencia guiada y descubre qué nivel de confort, diseño y desempeño encaja con tu forma de habitar.</p><Link className={styles.lightButton} href="/experiencia" prefetch={false}>Iniciar experiencia <ArrowUpRightIcon /></Link></div>
    </div>
    <div className={styles.concepts}><span>01 — Confort</span><span>02 — Diseño</span><span>03 — Desempeño</span></div>
  </section>;
}
