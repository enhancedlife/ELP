import type { ReactNode } from 'react';

import type { LandingPage, LandingSection } from '@/lib/types';

import { FaqDisclosure } from '@/components/FaqDisclosure';
import { FaqRichAnswer } from '@/components/FaqRichAnswer';
import { PageShell, type PageShellVariant } from '@/components/PageShell';
import { cmsHtmlProseClass } from '@/lib/cms-prose';
import { normalizeLandingSections } from '@/lib/normalize-landing-sections';
import { cn } from '@/lib/utils';

function SectionBlock({ section, index }: { section: LandingSection; index: number }) {
  const sectionId = section.slug || section.title || `section-${index}`;

  return (
    <section id={sectionId} className="mt-8 border-t border-border pt-8 first:mt-6 first:border-t-0 first:pt-0">
      {section.title && (
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">{section.title}</h2>
      )}

      {section.content && (
        <div
          className={cn(cmsHtmlProseClass)}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}

      {Array.isArray(section.questions) && section.questions.length > 0 && (
        <div className="mt-4 grid gap-3">
          {section.questions.map((qa, idx) => (
            <details
              key={`${sectionId}-q-${idx}`}
              className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
            >
              <summary className="cursor-pointer font-semibold text-foreground">{qa.q}</summary>
              <FaqRichAnswer html={qa.answer_html} text={qa.a} />
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

type LandingPageRendererProps = {
  page: LandingPage;
  className?: string;
  /** Width of the outer shell (default `landing` for home). */
  shellVariant?: PageShellVariant;
  /** Rendered above the title (e.g. back link). */
  lead?: ReactNode;
  /** When true, skip the centered H1 (e.g. title already shown in a page hero). */
  omitHeader?: boolean;
};

export default function LandingPageRenderer({
  page,
  className,
  shellVariant = 'landing',
  lead,
  omitHeader = false,
}: LandingPageRendererProps) {
  const sections = normalizeLandingSections(page.sections as unknown);
  const hasLead = Boolean(lead);
  /** Avoid an empty “lead row” (rule + gap) when the hero already carries the title and there is no intro body. */
  const hasPreSectionsBlock = hasLead || Boolean(page.content?.trim()) || !omitHeader;

  return (
    <PageShell variant={shellVariant} className={className}>
      {hasLead ? <div className="mb-8 border-b border-border/60 pb-6">{lead}</div> : null}
      {!omitHeader ? (
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {page.title}
          </h1>
        </header>
      ) : null}

      {page.content && (
        <div
          className={cn(cmsHtmlProseClass, 'mx-auto w-full max-w-3xl overflow-x-auto')}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}

      {sections.length > 0 && (
        <div
          className={cn(
            'mx-auto max-w-3xl',
            hasPreSectionsBlock &&
              'mt-8 border-t border-border/70 pt-8 sm:mt-10 sm:pt-10',
          )}
        >
          {sections.map((section, index) => (
            <SectionBlock key={section.slug || section.title || index} section={section} index={index} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
