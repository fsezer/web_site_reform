/** Shared entity schema for public pages (Step 2 SEO). */
const ORG = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  "@id": "https://www.sanastechnology.com/#organization",
  name: "Sanas Technology",
  legalName: "Sanas Technology",
  url: "https://www.sanastechnology.com/",
  logo: "https://www.sanastechnology.com/img/brand/logo-mark.png",
  image: "https://www.sanastechnology.com/img/meta_img/sanas_meta.png",
  foundingDate: "2004",
  slogan: "Kodun büyüsüyle, sonsuz çözümlere.",
  description:
    "Eskişehir merkezli, 2004’ten beri yazılım, bulut ve yapay zekâ çözümleri geliştiren teknoloji şirketi.",
  knowsAbout: [
    "Software Development",
    "Cloud Computing",
    "Artificial Intelligence",
    "Mobile Applications",
    "Logistics Software",
    "Fintech",
    "Healthcare Software",
  ],
  areaServed: [
    { "@type": "City", name: "Eskişehir" },
    { "@type": "Country", name: "Turkey" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Büyükdere Mah. Karagözlü Sok. No:46",
    addressLocality: "Odunpazarı",
    addressRegion: "Eskişehir",
    addressCountry: "TR",
  },
  telephone: "+905300130326",
  email: "info@sanastechnology.com",
  sameAs: ["https://istiklalyazilim.com"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: "+905300130326",
    email: "info@sanastechnology.com",
    url: "https://www.sanastechnology.com/contact.html",
    availableLanguage: ["tr", "en", "de", "sr"],
  },
};

export function injectOrganizationSchema() {
  if (document.querySelector('script[data-sanas-schema="org"]')) return;
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.dataset.sanasSchema = "org";
  el.textContent = JSON.stringify(ORG);
  document.head.appendChild(el);
}
