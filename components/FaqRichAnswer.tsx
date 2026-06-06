import { cn } from '@/lib/utils';
import { cmsHtmlProseClass } from '@/lib/cms-prose';

/** Inline / simple tags — if the answer only uses these, stray newlines can become `<br />`. */
const STRUCTURAL_HTML_RE = /<\s*(?:ul|ol|p|div|table|h[1-6]|blockquote)\b/i;

/** Treat answer as HTML when it looks like CMS markup (incl. mistaken `</br>`). */
const LOOKS_LIKE_HTML_RE =
  /<\s*\/?\s*(?:br|p|div|span|strong|b|em|i|u|a|ul|ol|li|h[1-6]|blockquote|hr)\b/i;

function looksLikeHtml(s: string): boolean {
  return (
    LOOKS_LIKE_HTML_RE.test(s) ||
    /<\s*\/\s*br\s*>/i.test(s) ||
    /<br\b/i.test(s)
  );
}

/** Some editors/store paths leave the two characters `\` + `n` instead of a newline. */
function decodeLiteralEscapes(s: string): string {
  return s.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n');
}

/**
 * Normalizes loose `<br>` / `</br>` and optionally turns newlines into `<br />`
 * (only when there is no block-level HTML, so lists/layout stay valid).
 */
export function prepareCmsAnswerFragment(raw: string): string {
  let s = raw.replace(/\r\n/g, '\n');
  s = s.replace(/<\/\s*br\s*>/gi, '<br />');
  s = s.replace(/<br\s*\/?>/gi, '<br />');
  if (!STRUCTURAL_HTML_RE.test(s)) {
    s = s.replace(/\n/g, '<br />');
  }
  return s;
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'ol'; items: string[] }
  | { type: 'ul'; items: string[] };

function parseAnswerBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let ol: string[] | null = null;
  let ul: string[] | null = null;
  let para: string[] = [];

  function flushPara() {
    if (para.length === 0) return;
    blocks.push({ type: 'p', text: para.join('\n') });
    para = [];
  }
  function flushOl() {
    if (ol?.length) blocks.push({ type: 'ol', items: ol });
    ol = null;
  }
  function flushUl() {
    if (ul?.length) blocks.push({ type: 'ul', items: ul });
    ul = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushOl();
      flushUl();
      flushPara();
      continue;
    }
    const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    const bullet = trimmed.match(/^[•\-\*]\s*(.+)$/);
    if (numbered) {
      flushPara();
      flushUl();
      if (!ol) ol = [];
      ol.push(numbered[2]!.trim());
      continue;
    }
    if (bullet) {
      flushPara();
      flushOl();
      if (!ul) ul = [];
      ul.push(bullet[1]!.trim());
      continue;
    }
    flushOl();
    flushUl();
    para.push(trimmed);
  }
  flushOl();
  flushUl();
  flushPara();
  return blocks;
}

type FaqRichAnswerProps = {
  /** Optional HTML answer (trusted CMS content only). */
  html?: string;
  /** Plain text / multiline with optional `1.` / `•` list lines. */
  text?: string;
  className?: string;
};

const answerProseClass = cn(
  cmsHtmlProseClass,
  'prose-sm max-w-none dark:prose-invert',
  'prose-p:text-muted-foreground prose-p:leading-relaxed',
  'prose-li:text-muted-foreground prose-li:leading-relaxed',
  'prose-strong:text-foreground/90',
);

export function FaqRichAnswer({ html, text, className }: FaqRichAnswerProps) {
  if (html?.trim()) {
    const inner = prepareCmsAnswerFragment(html.trim());
    return (
      <div
        className={cn(answerProseClass, 'mt-0', className)}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    );
  }
  const t = decodeLiteralEscapes(text ?? '');
  if (!t.trim()) return null;
  if (looksLikeHtml(t)) {
    const inner = prepareCmsAnswerFragment(t.trim());
    return (
      <div
        className={cn(answerProseClass, 'mt-0', className)}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    );
  }
  const blocks = parseAnswerBlocks(t);
  return (
    <div
      className={cn(
        'space-y-3 text-[0.9375rem] leading-[1.65] text-muted-foreground',
        className,
      )}
    >
      {blocks.map((b, i) => {
        if (b.type === 'p') {
          return (
            <p key={i} className="whitespace-pre-line">
              {b.text}
            </p>
          );
        }
        if (b.type === 'ol') {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5">
              {b.items.map((item, j) => (
                <li key={j} className="pl-1">
                  {item}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={i} className="list-disc space-y-1.5 pl-5">
            {b.items.map((item, j) => (
              <li key={j} className="pl-1">
                {item}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
