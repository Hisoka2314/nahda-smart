import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Mail,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ProductCard } from "@/components/product/product-card";
import { BrandMark } from "@/components/shop/brand-mark";
import { CategoryCard } from "@/components/shop/category-card";
import { NewsletterForm } from "@/components/shop/newsletter-form";
import { SectionCarousel } from "@/components/shop/section-carousel";
import { getPublicHomeData } from "@/lib/services/public-catalogue";

const trustBlocks = [
  {
    title: "Livraison partout au Maroc",
    description: "Rapide & sécurisée",
    icon: Truck,
  },
  {
    title: "Paiement à la livraison",
    description: "Payez à réception",
    icon: PackageCheck,
  },
  {
    title: "Retrait sur place",
    description: "Disponible en magasin",
    icon: Store,
  },
  {
    title: "Garantie & SAV",
    description: "Pièces d’origine garanties",
    icon: ShieldCheck,
  },
  {
    title: "Support expert",
    description: "À votre écoute",
    icon: Headphones,
  },
];

const heroStats = ["Solutions fiables", "Livraison Maroc", "Support expert"];

// La page est pré-rendue mais se régénère au plus toutes les 5 minutes :
// les produits/compteurs suivent la base sans nécessiter de rebuild.
export const revalidate = 300;

export default async function Home() {
  const homeData = await getPublicHomeData();

  return (
    <ShopLayout>
      <main className="bg-background">
        <section className="relative overflow-hidden bg-nahda-ink text-white">
          <div className="absolute inset-0">
            <Image
              src="/generated/hero-tech-premium.png"
              alt="Matériel informatique, réseau, sécurité et télécommunication"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-[0.92]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.98)_0%,rgba(5,7,6,0.86)_34%,rgba(5,7,6,0.30)_100%)]" />
            <div className="absolute left-[12%] top-[22%] h-40 w-40 rounded-full bg-nahda-olive/[0.18] blur-3xl animate-glow-soft" />
          </div>

          <Container className="relative grid min-h-[590px] items-center py-14 sm:py-[72px] lg:min-h-[620px] lg:grid-cols-[0.82fr_1fr]">
            <Reveal className="min-w-0 max-w-2xl">
              <Badge variant="olive" className="mb-5">
                Votre partenaire tech au Maroc
              </Badge>
              <h1 className="max-w-full text-[2.05rem] font-black leading-[1.12] tracking-normal sm:text-5xl lg:text-6xl">
                <span className="block">Équipez votre</span>
                <span className="block">entreprise avec</span>
                <span className="block">le meilleur de la</span>
                <span className="block text-[#a8c84c]">technologie</span>
              </h1>
              <p className="mt-5 max-w-[330px] break-words text-base leading-8 text-white/[0.78] sm:max-w-xl md:text-lg">
                Spécialiste en informatique, réseaux, sécurité et
                télécommunication. Des solutions fiables, un service expert.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/catalogue">
                  <Button size="lg" className="w-full sm:w-auto">
                    Découvrir les produits
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/demande-devis">
                  <Button variant="lightOutline" size="lg" className="w-full sm:w-auto">
                    Demander un devis
                  </Button>
                </Link>
              </div>
              <div className="mt-9 grid grid-cols-1 gap-3 text-sm text-white/[0.8] sm:flex sm:flex-wrap sm:gap-4">
                {heroStats.map((item, index) => (
                  <span
                    key={item}
                    className="inline-flex min-w-0 items-center gap-2 whitespace-nowrap"
                  >
                    {index === 0 ? (
                      <ShieldCheck size={18} className="text-[#a8c84c]" />
                    ) : index === 1 ? (
                      <Truck size={18} className="text-[#a8c84c]" />
                    ) : (
                      <Headphones size={18} className="text-[#a8c84c]" />
                    )}
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-2" aria-hidden="true">
                <span className="h-2.5 w-8 rounded-full bg-[#a8c84c]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.7]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
              </div>
            </Reveal>

            <div className="pointer-events-none hidden min-h-[440px] items-end justify-end lg:flex">
              <div className="animate-float-soft rounded-card border border-white/10 bg-white/[0.08] p-5 shadow-premium backdrop-blur">
                <Sparkles className="text-[#a8c84c]" size={26} />
                <p className="mt-3 max-w-[220px] text-sm font-semibold leading-6 text-white/[0.78]">
                  Catalogue IT, réseau et sécurité prêt pour particuliers et B2B.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <Container className="relative z-10 -mt-10">
          <Reveal>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {trustBlocks.map((item) => (
                <div key={item.title} className="premium-card p-5">
                  <item.icon className="text-nahda-olive" size={30} />
                  <h2 className="mt-4 text-base font-black text-nahda-ink">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>

        <Container id="categories" className="py-14">
          <Reveal>
            <SectionTitle
              eyebrow="Catalogue"
              title="Catégories populaires"
              description="Des familles produits claires pour trouver vite le bon matériel informatique, réseau ou sécurité."
            />
          </Reveal>
          <SectionCarousel
            ariaLabel="Catégories populaires"
            className="mt-7"
          >
            {homeData.categories.map((category, index) => (
              <div
                key={category.slug}
                className="w-[82vw] max-w-[326px] shrink-0 snap-start sm:w-[310px] lg:w-[300px]"
              >
                <Reveal delay={index * 0.035}>
                  <CategoryCard category={category} />
                </Reveal>
              </div>
            ))}
          </SectionCarousel>
        </Container>

        <section id="produits" className="bg-white py-14">
          <Container>
            <Reveal>
              <SectionTitle
                eyebrow="Sélection"
                title="Meilleures ventes"
                description="Une sélection soignée de produits performants pour les besoins particuliers, professionnels et B2B."
                action={
                  <Link
                    href="/catalogue"
                    className="inline-flex items-center gap-2 text-sm font-black text-nahda-olive"
                  >
                    Voir tout <ArrowRight size={16} />
                  </Link>
                }
              />
            </Reveal>
            <SectionCarousel
              ariaLabel="Meilleures ventes"
              className="mt-7"
            >
              {homeData.featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="w-[84vw] max-w-[336px] shrink-0 snap-start sm:w-[320px] lg:w-[306px]"
                >
                  <Reveal delay={index * 0.025}>
                    <ProductCard product={product} />
                  </Reveal>
                </div>
              ))}
            </SectionCarousel>
          </Container>
        </section>

        <Container className="py-14">
          <Reveal>
            <div className="grid overflow-hidden rounded-card bg-nahda-ink text-white shadow-premium lg:grid-cols-[0.95fr_1.05fr]">
              <div className="p-8 md:p-10">
                <Badge variant="promo">Offres spéciales</Badge>
                <h2 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                  Jusqu’à -25%
                </h2>
                <p className="mt-4 max-w-md text-lg leading-8 text-white/[0.74]">
                  Sur une sélection de produits performants et fiables.
                </p>
                <Link href="/catalogue?promo=1" className="mt-8 inline-block">
                  <Button size="lg">
                    Découvrir les offres
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
              <div className="tech-grid relative min-h-[280px] border-t border-white/10 lg:border-l lg:border-t-0">
                <Image
                  src="/generated/promo-offer.svg"
                  alt="Offres spéciales Nahda Smart"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </Container>

        <section className="bg-white py-12">
          <Container>
            <Reveal>
              <div className="premium-card grid gap-6 p-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase text-nahda-olive">
                    Marques de confiance
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-nahda-ink">
                    Un univers multi-marques, prêt pour les assets fournisseurs.
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {homeData.brands.map((brand) => (
                    <div
                      key={brand.slug}
                      className="grid min-h-[72px] place-items-center rounded-[10px] border border-border-soft bg-white px-3 transition hover:border-nahda-olive/[0.45] hover:shadow-card"
                    >
                      <BrandMark brand={brand} className="w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        <Container className="py-14">
          <Reveal>
            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="premium-card p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Mail className="text-nahda-olive" size={30} />
                    <h2 className="mt-3 text-2xl font-black text-nahda-ink">
                      Restez informé des nouveautés & promotions
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      Recevez les arrivages tech, offres ponctuelles et conseils
                      d’achat pour votre entreprise.
                    </p>
                  </div>
                  <NewsletterForm />
                </div>
              </div>
              <div className="rounded-card bg-nahda-olive-dark p-6 text-white shadow-premium">
                <PhoneCall className="text-[#a8c84c]" size={30} />
                <h2 className="mt-3 text-2xl font-black">
                  Besoin d’un conseil ?
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/[0.72]">
                  Notre équipe vous aide à choisir les bons produits pour votre
                  besoin particulier ou professionnel.
                </p>
                <Link href="/contact" className="mt-6 inline-block">
                  <Button variant="lightOutline">
                    Nous contacter
                    <ArrowRight size={17} />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>

        <Container className="pb-14">
          <Reveal>
            <div className="grid gap-4 rounded-card border border-border-soft bg-white p-5 shadow-card sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-nahda-olive" size={28} />
                <div>
                  <p className="text-2xl font-black text-nahda-ink">+10 000</p>
                  <p className="text-sm text-neutral-600">Produits disponibles</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-nahda-olive" size={28} />
                <div>
                  <p className="text-2xl font-black text-nahda-ink">+5 000</p>
                  <p className="text-sm text-neutral-600">Clients satisfaits</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-nahda-olive" size={28} />
                <div>
                  <p className="text-2xl font-black text-nahda-ink">
                    Service expert
                  </p>
                  <p className="text-sm text-neutral-600">Support technique</p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </main>
    </ShopLayout>
  );
}
