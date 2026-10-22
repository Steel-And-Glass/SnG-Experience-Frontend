import Image from "next/image";
import { homeMedia } from "../config/home-media";
import { homeSolutions } from "../config/home-content";
import styles from "../home.module.css";
export function SolutionsSection() {
  return <section id="soluciones" className={`${styles.section} ${styles.solutions}`} aria-labelledby="solutions-title">
    <div className={styles.solutionImage}><Image src={homeMedia.solutions} alt="Pasillo delimitado por vidrio, abierto a la luz y al entorno" fill sizes="(max-width: 700px) 90vw, 45vw" /></div>
    <div className={styles.solutionContent}><p className={styles.eyebrow}>04 / Soluciones</p><h2 id="solutions-title">Más que sistemas.<br /><em>Más arquitectura.</em></h2>
      <ol className={styles.solutionList}>{homeSolutions.map((solution, index) => <li key={solution}><span>0{index + 1}</span>{solution}</li>)}</ol>
      <a className={styles.darkLink} href="#contacto">Conversemos sobre tu espacio <span aria-hidden="true">↗</span></a>
    </div>
  </section>;
}
