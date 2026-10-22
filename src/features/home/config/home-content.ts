import { homeMedia } from "./home-media";

export const homeNavigation = [
  { label: "Inicio", href: "#inicio" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Experiencia", href: "/experiencia" },
  { label: "Proceso", href: "#proceso" },
  { label: "Contacto", href: "#contacto" },
];

// TODO: Replace with verified Steel & Glass project metadata.
// Descriptive provisional titles only; no unverified locations or client names.
export const featuredProjects = [
  { title: "Proyecto urbano", category: "Fachada arquitectónica", image: homeMedia.projects.building, alt: "Exterior de un edificio con ventanería y fachada acristalada" },
  { title: "Residencia contemporánea", category: "Ventanería residencial", image: homeMedia.projects.residence, alt: "Exterior de una residencia de tonos grises con grandes ventanas" },
  { title: "Una apertura al paisaje", category: "Grandes aperturas", image: homeMedia.projects.landscape, alt: "Arquitectura y paisaje conectados a través del vidrio" },
];

export const homeSolutions = ["Grandes aperturas", "Ventanería arquitectónica", "Puertas y puerta-ventanas", "Fachadas y cerramientos", "Soluciones especiales"];
export const homeProcess = [
  { title: "Escuchamos tu proyecto", text: "Cada espacio empieza por una conversación. Entendemos cómo quieres vivirlo." },
  { title: "Diseñamos la mejor solución", text: "Damos forma a una propuesta que dialoga con la arquitectura y tus necesidades." },
  { title: "Fabricamos con precisión", text: "Llevamos la intención del diseño a cada encuentro, perfil y detalle." },
  { title: "Instalamos con excelencia", text: "Acompañamos la ejecución para que la idea encuentre su lugar en el espacio." },
];

// TODO: Replace with verified Steel & Glass contact information.
export const homeContact = { email: "contacto@steelandglass.com", phone: "+57 316 332 9424", location: "Colombia", provisional: true };
// Supplied brand account; centralized for future editorial updates.
export const homeInstagram = "https://instagram.com/steelandglass__";
