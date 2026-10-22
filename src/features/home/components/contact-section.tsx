import { ArrowUpRightIcon } from "./arrow-up-right-icon";
import Link from "next/link";
import { homeContact } from "../config/home-content";
import styles from "../home.module.css";
export function ContactSection() {
  return <section id="contacto" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-title">
    <p className={styles.eyebrow}>06 / La próxima conversación</p>
    <div className={styles.contactGrid}><h2 id="contact-title">Imaginemos juntos<br /><em>una nueva apertura.</em></h2><div><p>Cuéntanos sobre tu proyecto y descubre cómo podemos acompañarte desde la idea hasta la instalación.</p><Link className={styles.darkButton} href="/experiencia" prefetch={false}>Hablemos de tu proyecto <ArrowUpRightIcon /></Link><p className={styles.smallNote}>Comienza en nuestra experiencia guiada.</p></div></div>
    <div className={styles.contactDetails}><p>{homeContact.email}<br />{homeContact.phone}</p><p>{homeContact.location}</p>{homeContact.provisional && <p className={styles.smallNote}>Datos de contacto provisionales.<br />Pendientes de confirmación.</p>}</div>
  </section>;
}
