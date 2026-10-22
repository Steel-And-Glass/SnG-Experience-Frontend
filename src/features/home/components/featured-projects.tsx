import Image from "next/image";
import { featuredProjects } from "../config/home-content";
import styles from "../home.module.css";
export function FeaturedProjects() {
  return <section id="proyectos" className={`${styles.section} ${styles.projects}`} aria-labelledby="projects-title">
    <div className={styles.sectionTop}><p className={styles.eyebrow}>02 / Espacios que inspiran</p><span className={styles.smallNote}>Una selección de nuestra arquitectura en vidrio</span></div>
    <h2 id="projects-title">Proyectos donde el vidrio<br /><em>transforma la arquitectura.</em></h2>
    <div className={styles.projectGrid}>{featuredProjects.map((project, index) => <figure key={project.image} className={styles.project}>
      <div className={styles.projectImage}><Image src={project.image} alt={project.alt} fill sizes={index === 2 ? "(max-width: 700px) 90vw, 84vw" : "(max-width: 700px) 90vw, (max-width: 1100px) 44vw, 48vw"} /></div>
      <figcaption><div><span className={styles.projectNumber}>0{index + 1}</span><h3>{project.title}</h3></div><p>{project.category}</p></figcaption>
    </figure>)}</div>
  </section>;
}
