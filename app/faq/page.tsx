'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { FaqDisclosure } from '@/components/FaqDisclosure';
import { FaqRichAnswer } from '@/components/FaqRichAnswer';
import { FaqPageHero } from '@/components/FaqPageHero';
import LandingPageRenderer from '@/components/LandingPageRenderer';
import { PageShell } from '@/components/PageShell';
import type { LandingPage, LandingPageSummary } from '@/lib/types';
import { getLandingPageWithTimeout, listLandingPages } from '@/lib/api/website';

const FAQ_HUB_HERO_TITLE = 'Frequently Asked Questions';
const FAQ_HUB_HERO_SUBTITLE = 'Find our most common questions and answers here.';

/** URL segment for /faq/[topic] — skip main `faq` hub slug. */
function faqTopicHref(slug: string): string | null {
  if (slug === 'faq') return null;
  if (slug.startsWith('faq-')) return slug.slice(4);
  return slug;
}

export default function FAQPage() {
  const [pageContent, setPageContent] = useState<LandingPage | null>(null);
  const [faqPages, setFaqPages] = useState<LandingPageSummary[]>([]);
  const [listLoaded, setListLoaded] = useState(false);

  useEffect(() => {
    const fetchPageContent = async () => {
      const content = await getLandingPageWithTimeout('faq', 3000);
      setPageContent(content);
    };
    void fetchPageContent();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listLandingPages({ faqOnly: true });
      if (!cancelled) {
        setFaqPages(list);
        setListLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackFaqSections = {
    general: {
      title: 'General Questions',
      questions: [
        {
          q: 'What is PurePharma.ph?',
          a: 'PurePharma.ph is a trusted supplier of high-quality supplements and performance enhancement products.',
        },
        {
          q: 'Are your products safe?',
          a: 'Yes, all our products undergo rigorous testing and quality control measures.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes, we ship to multiple countries worldwide. Check our shipping page for details.',
        },
      ],
    },
    shipping: {
      title: 'Shipping & Delivery',
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Shipping times vary by location. Typically 5-10 business days for domestic orders and 10-20 business days for international orders.',
        },
        {
          q: 'What shipping methods do you offer?',
          a: 'We offer standard shipping, express shipping, and BitcoinPostage for select locations.',
        },
        {
          q: 'Can I track my order?',
          a: 'Yes, you will receive a tracking number via email once your order ships.',
        },
      ],
    },
    returns: {
      title: 'Returns & Refunds',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We accept returns within 30 days of purchase for unopened products in original packaging.',
        },
        {
          q: 'How do I initiate a return?',
          a: 'Contact our customer service team with your order number to initiate a return.',
        },
      ],
    },
    payment: {
      title: 'Payment Methods',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept Bitcoin (BTC) payments through our secure payment gateway.',
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, all payments are processed through secure, encrypted channels.',
        },
      ],
    },
    products: {
      title: 'Product Information',
      questions: [
        {
          q: 'How do I know which product is right for me?',
          a: 'Browse our product categories and read detailed descriptions. Contact Us if you need personalized recommendations.',
        },
        {
          q: 'Are product descriptions accurate?',
          a: 'Yes, we provide detailed and accurate product information on all product pages.',
        },
      ],
    },
    account: {
      title: 'Account & Orders',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click on "My Account" and then "Register" to create a new account.',
        },
        {
          q: 'How do I track my orders?',
          a: 'Log into your account and visit the "My Orders" section to view order status and tracking information.',
        },
      ],
    },
    'quality-guarantee': {
      title: 'Quality Guarantee',
      questions: [
        {
          q: 'What is your quality guarantee?',
          a: 'We guarantee that all our products meet the highest standards of quality and purity. Every product undergoes rigorous testing and quality control measures before being made available to our customers.',
        },
        {
          q: 'How do you ensure product quality?',
          a: 'We work with trusted manufacturers and conduct regular quality testing. All products are tested for purity, potency, and safety before distribution.',
        },
        {
          q: "What if I receive a product that doesn't meet quality standards?",
          a: 'If you have any concerns about product quality, please contact our customer service team immediately. We will investigate the issue and provide a replacement or full refund as appropriate.',
        },
        {
          q: 'Do you provide certificates of analysis?',
          a: 'Yes, certificates of analysis are available for our products. Contact Us if you need specific documentation for any product.',
        },
      ],
    },
  };

  const topicLinks = faqPages
    .map((p) => {
      const seg = faqTopicHref(p.slug);
      if (!seg) return null;
      return { slug: p.slug, title: p.title, href: `/faq/${encodeURIComponent(seg)}`, sort: p.sort_order };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));

  if (pageContent) {
    return (
      <main className="min-h-screen text-white pt-24 pb-16">
      <div className="min-w-0 w-full">
        <FaqPageHero title={FAQ_HUB_HERO_TITLE} subtitle={FAQ_HUB_HERO_SUBTITLE} />
        <div className="border-b border-border bg-background">
          <LandingPageRenderer page={pageContent} shellVariant="article" omitHeader />
          {listLoaded && topicLinks.length > 0 ? (
            <PageShell variant="article" className="mt-6 border-t border-border/70 pt-0 lg:mt-8">
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                More FAQ topics
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse additional sponsor and topic pages.</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {topicLinks.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={t.href}
                      className="block rounded-xl border border-border/70 bg-card/90 px-4 py-3.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-black/[0.02] transition-colors hover:border-primary/25 hover:bg-muted/50 dark:ring-white/[0.04]"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </PageShell>
          ) : null}
        </div>
      </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white pt-24 pb-16">
    <div className="min-w-0 w-full">
      <FaqPageHero title={FAQ_HUB_HERO_TITLE} subtitle={FAQ_HUB_HERO_SUBTITLE} />
      <div className="border-b border-border bg-background">
        <PageShell variant="article">
          {listLoaded && topicLinks.length > 0 ? (
            <div className="mb-10">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Topics</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {topicLinks.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={t.href}
                      className="block rounded-xl border border-border/70 bg-card/90 px-4 py-3.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-black/[0.02] transition-colors hover:border-primary/25 hover:bg-muted/50 dark:ring-white/[0.04]"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-10">
            {Object.entries(fallbackFaqSections).map(([slug, section]) => (
              <section key={slug} id={slug} className="scroll-mt-24">
                <header className="mb-6">
                  <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {section.title}
                  </h2>
                  <div className="mt-3 h-px w-10 rounded-full bg-primary/45" aria-hidden />
                </header>
                <div className="flex flex-col gap-3 sm:gap-3.5">
                  {section.questions.map((item, index) => (
                    <FaqDisclosure key={index} id={`${slug}-q-${index}`} question={item.q}>
                      <FaqRichAnswer text={item.a} />
                    </FaqDisclosure>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </PageShell>
      </div>
    </div>
    </main>
  );
}
