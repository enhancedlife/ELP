import type { LandingSection, LandingSectionQuestion } from '@/lib/types';

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  );
}

function normalizeQuestion(raw: unknown): LandingSectionQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const q = String(o.q ?? o.question ?? '').trim();
  const aRaw = o.a ?? o.answer;
  const a = aRaw == null ? '' : String(aRaw);
  const answerHtmlRaw = o.answer_html;
  const answer_html =
    answerHtmlRaw != null && String(answerHtmlRaw).trim() !== ''
      ? String(answerHtmlRaw)
      : undefined;
  if (!q && !a.trim() && !answer_html) return null;
  return {
    q: q || 'Question',
    a,
    ...(answer_html ? { answer_html } : {}),
  };
}

function normalizeQuestions(arr: unknown): LandingSectionQuestion[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeQuestion).filter(Boolean) as LandingSectionQuestion[];
}

function normalizeSectionItem(raw: unknown, index: number): LandingSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const title = o.title != null ? String(o.title).trim() : '';
  const slugRaw = o.slug != null ? String(o.slug).trim() : '';
  const slug = slugRaw || (title ? slugify(title) : `section-${index}`);
  const content = o.content != null ? String(o.content) : undefined;
  let questions = normalizeQuestions(o.questions);
  if (questions.length === 0 && Array.isArray(o.items)) {
    questions = normalizeQuestions(o.items);
  }
  const hasContent = Boolean(content?.trim());
  if (!title && !hasContent && questions.length === 0) return null;
  return {
    slug,
    ...(title ? { title } : {}),
    ...(hasContent ? { content } : {}),
    ...(questions.length ? { questions } : {}),
  };
}

function normalizeKeyedSection(slug: string, val: unknown): LandingSection | null {
  if (!val || typeof val !== 'object') return null;
  const sec = val as Record<string, unknown>;
  const title = sec.title != null ? String(sec.title).trim() : '';
  const questions = normalizeQuestions(sec.questions);
  const content = sec.content != null ? String(sec.content) : undefined;
  const hasContent = Boolean(content?.trim());
  if (!title && !hasContent && questions.length === 0) return null;
  return {
    slug,
    title: title || slug,
    ...(hasContent ? { content } : {}),
    ...(questions.length ? { questions } : {}),
  };
}

/**
 * Turns CMS `sections` JSON into a uniform list of blocks for `LandingPageRenderer`.
 * Accepts:
 * - Array of `{ title?, slug?, content?, questions? | items? }`
 * - `{ categories: [...] }` with the same shape per category
 * - Legacy map `{ general: { title, questions }, ... }`
 */
export function normalizeLandingSections(raw: unknown): LandingSection[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s, i) => normalizeSectionItem(s, i))
      .filter(Boolean) as LandingSection[];
  }
  if (typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if ('categories' in o) {
    const cats = o.categories;
    if (!Array.isArray(cats)) return [];
    return cats
      .map((c, i) => normalizeSectionItem(c, i))
      .filter(Boolean) as LandingSection[];
  }
  return Object.entries(o)
    .map(([slug, val]) => normalizeKeyedSection(slug, val))
    .filter(Boolean) as LandingSection[];
}
