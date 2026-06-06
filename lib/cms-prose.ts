/**
 * Shared Typography styles for HTML coming from Django CMS (`content`, `sections[].content`).
 * Use with @tailwindcss/typography; respects light/dark via CSS variables.
 */
export const cmsHtmlProseClass =
  [
    'prose prose-neutral max-w-none dark:prose-invert',
    'prose-base md:prose-lg',
    'prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-foreground',
    'prose-headings:mt-8 prose-headings:mb-3 first:prose-headings:mt-0',
    'prose-h1:text-balance prose-h1:text-2xl md:prose-h1:text-3xl',
    'prose-h2:text-xl md:prose-h2:text-2xl',
    'prose-h3:text-lg md:prose-h3:text-xl',
    'prose-p:leading-[1.7] prose-p:text-foreground/90',
    'prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline',
    'prose-strong:text-foreground',
    'prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-muted-foreground',
    'prose-ul:my-5 prose-ol:my-5 prose-li:my-1.5 prose-li:marker:text-primary/70',
    'prose-hr:border-border',
    'prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm',
    'prose-table:w-full prose-table:text-sm prose-table:border-collapse',
    'prose-table:rounded-lg prose-table:border prose-table:border-border',
    'prose-th:border prose-th:border-border prose-th:bg-muted/60 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold',
    'prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2',
    'prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none',
    'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg',
  ].join(' ');
