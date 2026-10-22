import { ArrowUpRightIcon } from "./arrow-up-right-icon";
import Image from "next/image";
import Link from "next/link";
import { homeMedia } from "../config/home-media";
import styles from "../home.module.css";

export function HomeHero() {
  return <section id="inicio" className={styles.hero} aria-labelledby="hero-title">
    <Image src={homeMedia.hero} alt="" fill sizes="100vw" preload className={styles.heroImage} />
    <div className={styles.heroShade} />
    <div className={styles.heroContent}>
      <p className={styles.eyebrow}>Arquitectura · Luz · Confort</p>
      <h1 id="hero-title">Espacios que se abren<br /><em>a una nueva forma<br className={styles.mobileBreak} /> de habitar.</em></h1>
      <div className={styles.heroBottom}>
        <p>Diseñamos soluciones de vidrio y ventanería que conectan arquitectura, paisaje y confort.</p>
        <div className={styles.actions}><a className={styles.lightButton} href="#proyectos">Explorar proyectos <ArrowUpRightIcon /></a><Link className={styles.lightLink} href="/experiencia" prefetch={false}>Vivir la experiencia <ArrowUpRightIcon /></Link></div>
      </div>
    </div>
    <a className={styles.heroScroll} href="#manifiesto">Descubrir <span aria-hidden="true">↓</span></a>
  </section>;
}
