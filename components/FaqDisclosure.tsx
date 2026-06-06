import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type FaqDisclosureProps = {
  question: string;
  children: ReactNode;
  /** Stable id for anchor links / a11y */
  id?: string;
};

/**
 * Single FAQ accordion row — used on CMS FAQ pages and static fallbacks.
 */
export function FaqDisclosure({ question, children, id }: FaqDisclosureProps) {
  return (
    <details
      id={id}
      className={cn(
        'group rounded-xl border border-border/70 bg-card/80 shadow-sm ring-1 ring-black/[0.02] transition-[border-color,box-shadow]',
        'dark:ring-white/[0.04]',
        'hover:border-border hover:shadow',
        'open:border-primary/25 open:shadow-md open:ring-primary/10',
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-4',
          'text-left text-base font-medium leading-snug text-foreground sm:text-[1.0625rem]',
          'outline-none transition-colors hover:bg-muted/35',
          'rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronDown
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform duration-200 ease-out',
            'group-open:rotate-180',
          )}
          strokeWidth={2}
          aria-hidden
        />
        <span className="min-w-0 flex-1">{question}</span>
      </summary>
      <div className="border-t border-border/60 bg-muted/15 px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
        <div className="border-l-2 border-primary/25 pl-4 sm:pl-5">{children}</div>
      </div>
    </details>
  );
}
