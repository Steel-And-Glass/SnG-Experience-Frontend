import type { Metadata } from "next";
import { HomeHeader } from "@/features/home/components/home-header";
import { HomeHero } from "@/features/home/components/home-hero";
import { BrandManifesto } from "@/features/home/components/brand-manifesto";
import { FeaturedProjects } from "@/features/home/components/featured-projects";
import { ExperienceTeaser } from "@/features/home/components/experience-teaser";
import { SolutionsSection } from "@/features/home/components/solutions-section";
import { ProcessSection } from "@/features/home/components/process-section";
import { ContactSection } from "@/features/home/components/contact-section";
import { SiteFooter } from "@/features/home/components/site-footer";
import styles from "@/features/home/home.module.css";

export const metadata: Metadata = {
  title: "Steel & Glass | Arquitectura en vidrio",
  description: "Soluciones de vidrio y ventaner\u00eda que conectan arquitectura, paisaje y confort. Descubre Steel & Glass y vive nuestra experiencia guiada.",
};

export default function Home() {
  return <div lang="es" className={styles.home}>
    <a className={styles.skipLink} href="#contenido">Saltar al contenido</a>
    <HomeHeader />
    <main id="contenido">
      <HomeHero />
      <BrandManifesto />
      <FeaturedProjects />
      <ExperienceTeaser />
      <SolutionsSection />
      <ProcessSection />
      <ContactSection />
    </main>
    <SiteFooter />
  </div>;
}
