import type { Metadata } from 'next';
import { Hero } from '../../components/sections/hero';
import { FeaturedCategories } from '../../components/sections/featured-categories';
import { FeaturedCollections } from '../../components/sections/featured-collections';
import { FeaturedProducts } from '../../components/sections/featured-products';
import { TrustIndicators } from '../../components/sections/trust-indicators';
import { TestimonialsStrip } from '../../components/sections/testimonials-strip';
import { BrandStory } from '../../components/sections/brand-story';
import { PromoBanner } from '../../components/sections/promo-banner';
import { BlogHighlights } from '../../components/sections/blog-highlights';
import { Newsletter } from '../../components/sections/newsletter';
import { Reveal } from '../../components/motion/reveal';
import { JsonLd } from '../../components/seo/json-ld';
import { homepageOrgJsonLd } from '../../components/seo/schemas';

export const metadata: Metadata = {
  title: 'Offisdesign — Furniture made to outlast trends',
  description:
    'Solid timber, traceable supply chains, ten-year warranties. Designed for everyday life — built in Britain.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Offisdesign',
    description: 'Furniture made to outlast trends.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Offisdesign' },
};

/**
 * Homepage — pure composition of section components. Each section owns its
 * loading, empty, and error states; the page just stacks them.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd payload={homepageOrgJsonLd()} />
      {/*
        No outer Stack: each section owns its own vertical rhythm so the page
        reads as an editorial sequence — contained content punctuated by the
        full-bleed promo and newsletter bands — rather than one uniform gap.
      */}
      <Hero />
      <Reveal>
        <TrustIndicators />
      </Reveal>
      <Reveal>
        <FeaturedCategories />
      </Reveal>
      <Reveal>
        <FeaturedCollections />
      </Reveal>
      <Reveal>
        <FeaturedProducts title="New arrivals" sort="recent" location="home_new" />
      </Reveal>
      <Reveal>
        <FeaturedProducts
          title="Workspace edits"
          collection="workspace"
          location="home_workspace"
        />
      </Reveal>
      <Reveal>
        <BrandStory />
      </Reveal>
      <Reveal>
        <PromoBanner />
      </Reveal>
      <Reveal>
        <TestimonialsStrip />
      </Reveal>
      <Reveal>
        <BlogHighlights />
      </Reveal>
      <Reveal>
        <Newsletter />
      </Reveal>
    </>
  );
}
