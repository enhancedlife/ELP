'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { FaqPageHero } from '@/components/FaqPageHero';
import LandingPageRenderer from '@/components/LandingPageRenderer';
import { PageShell } from '@/components/PageShell';
import type { LandingPage } from '@/lib/types';
import { getFaqArticleByTopic } from '@/lib/api/website';

const HVY_FAQ_HERO_SUBTITLE = 'Find our most common questions and answers here.';

function topicSlugKey(segment: string): string {
  return segment.replace(/_/g, '-').toLowerCase();
}

function faqTopicHeroSubtitle(topic: string, page: LandingPage): string {
  if (topicSlugKey(topic) === 'hvy-faq') {
    return HVY_FAQ_HERO_SUBTITLE;
  }
  return page.meta_description?.trim() || 'Answers and resources for this topic.';
}

/** Sponsor FAQ hubs: no “back to generic /faq hub” link in the article shell. */
const FAQ_TOPIC_SEGMENTS_WITHOUT_HUB_LINK = new Set(['hvy-faq', 'aquila', 'aquila-faq']);

function faqTopicShowsHubLink(topic: string): boolean {
  return !FAQ_TOPIC_SEGMENTS_WITHOUT_HUB_LINK.has(topicSlugKey(topic));
}

export default function FaqTopicPage() {
  const params = useParams();
  const topic = typeof params.topic === 'string' ? params.topic : '';
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!topic) {
      setLoading(false);
      setMissing(true);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const doc = await getFaqArticleByTopic(topic);
      if (!cancelled) {
        setPage(doc);
        setMissing(!doc);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topic]);

  if (loading) {
    return (
      <div className="min-w-0 w-full">
        <FaqPageHero title="FAQ" subtitle="Loading topic…" />
        <div className="border-b border-border bg-background">
          <PageShell variant="article">
            <p className="text-center text-muted-foreground">Loading…</p>
          </PageShell>
        </div>
      </div>
    );
  }

  if (missing || !page) {
    return (
      <div className="min-w-0 w-full">
        <FaqPageHero
          title="FAQ page not found"
          subtitle="This topic is not published or the link may be incorrect."
        />
        <div className="border-b border-border bg-background">
          <PageShell variant="article">
            <p className="text-muted-foreground">
              No published page matches this topic. Create one in the dashboard (Content → FAQ pages) with slug{' '}
              <code className="rounded bg-muted px-1">{topic}</code> or{' '}
              <code className="rounded bg-muted px-1">faq-{topic}</code>.
            </p>
            {faqTopicShowsHubLink(topic) ? (
              <Link href="/faq" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                ← All FAQ topics
              </Link>
            ) : null}
          </PageShell>
        </div>
      </div>
    );
  }

  const hubBackLead = faqTopicShowsHubLink(topic) ? (
    <Link href="/faq" className="text-sm font-medium text-primary hover:underline">
      ← All FAQ topics
    </Link>
  ) : null;

  return (
    <div className="min-w-0 w-full">
      <FaqPageHero title={page.title} subtitle={faqTopicHeroSubtitle(topic, page)} />
      <div className="border-b border-border bg-background">
        <LandingPageRenderer
          page={page}
          shellVariant="article"
          omitHeader
          {...(hubBackLead ? { lead: hubBackLead } : {})}
        />
      </div>
    </div>
  );
}
