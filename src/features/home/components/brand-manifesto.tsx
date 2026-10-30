import styles from "../home.module.css";
export function BrandManifesto() {
  return <section id="manifiesto" className={`${styles.section} ${styles.manifesto}`} aria-labelledby="manifesto-title">
    <p className={styles.eyebrow}>01 / Nuestra mirada</p>
    <div><h2 id="manifesto-title">No hacemos ventanas.<br /><em>Creamos nuevas<br />formas de habitar.</em></h2>
      <div className={styles.manifestoCopy}><span className={styles.shortRule} /><p>El vidrio transforma la relación entre interior, paisaje y luz. En steel and glass combinamos diseño, ingeniería y precisión para crear soluciones que se integran naturalmente a la arquitectura.</p></div>
    </div>
  </section>;
}
