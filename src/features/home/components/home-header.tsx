"use client";

import { ArrowUpRightIcon } from "./arrow-up-right-icon";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { homeNavigation } from "../config/home-content";
import styles from "../home.module.css";

export function HomeHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return <header className={`${styles.header} ${scrolled || open ? styles.solidHeader : ""}`}>
    <Link href="#inicio" className={styles.brand} onClick={() => setOpen(false)} aria-label="steel and glass — inicio">steel <span>and</span> glass<span className={styles.brandCaption}>ARQUITECTURA EN VIDRIO</span></Link>
    <nav aria-label="Navegación principal" className={styles.desktopNav}>
      {homeNavigation.map((item) => <Link key={item.href} href={item.href} prefetch={false}>{item.label}</Link>)}
    </nav>
    <a className={styles.headerCta} href="#contacto">Agendar asesoría <ArrowUpRightIcon /></a>
    <Link className={styles.mobileExperience} href="/experiencia" prefetch={false}><span>Experiencia <ArrowUpRightIcon /></span></Link>
    <button ref={toggle} className={styles.menuButton} aria-expanded={open} aria-controls="home-mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? "Cerrar −" : "Menú +"}</span></button>
    <nav id="home-mobile-menu" aria-label="Navegación móvil" className={styles.mobileNav} hidden={!open}>
      {homeNavigation.map((item) => <Link key={item.href} href={item.href} prefetch={false} onClick={() => setOpen(false)}>{item.label}<ArrowUpRightIcon /></Link>)}
      <a href="#contacto" onClick={() => setOpen(false)}>Agendar asesoría <ArrowUpRightIcon /></a>
    </nav>
  </header>;
}
