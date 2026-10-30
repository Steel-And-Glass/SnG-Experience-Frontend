import { ArrowUpRightIcon } from "./arrow-up-right-icon";
import Link from "next/link";
import { homeInstagram, homeNavigation } from "../config/home-content";
import styles from "../home.module.css";
export function SiteFooter() {
  return <footer className={styles.footer}><div className={styles.footerTop}><Link href="#inicio" className={styles.brand}>steel <span>and</span> glass</Link><p>Arquitectura que conecta.<br />Espacios que se viven.</p></div>
    <div className={styles.footerBottom}><nav aria-label="Navegación del pie de página">{homeNavigation.map((item) => <Link key={item.href} href={item.href} prefetch={false}>{item.label}</Link>)}</nav><a href={homeInstagram} target="_blank" rel="noopener noreferrer">Instagram <ArrowUpRightIcon /><span className="sr-only"> (abre en otra pestaña)</span></a><span>© {new Date().getFullYear()} steel and glass</span></div>
  </footer>;
}
