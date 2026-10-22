import { homeProcess } from "../config/home-content";
import styles from "../home.module.css";
export function ProcessSection() {
  return <section id="proceso" className={`${styles.section} ${styles.process}`} aria-labelledby="process-title">
    <div className={styles.processHeading}><p className={styles.eyebrow}>05 / De la idea al espacio</p><h2 id="process-title">El diseño necesita<br /><em>una gran ejecución.</em></h2></div>
    <ol className={styles.processList}>{homeProcess.map((step, index) => <li key={step.title}><span className={styles.processNumber}>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
  </section>;
}
