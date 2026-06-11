export type LandingSectionQuestion = {
  q: string;
  a: string;
  /** When set, rendered as HTML instead of parsing `a` as plain text. */
  answer_html?: string;
};

export type LandingSection = {
  slug?: string;
  title?: string;
  content?: string;
  questions?: LandingSectionQuestion[];
};

export type LandingPage = {
  slug: string;
  title: string;
  content?: string;
  sections?: LandingSection[];
  meta_title?: string | null;
  meta_description?: string | null;
};

/** Public list entry from GET /api/landing-pages */
export type LandingPageSummary = {
  slug: string;
  title: string;
  sort_order: number;
  is_faq: boolean;
  /** When set to "sponsors", page is listed under Sponsors' FAQ in the header (see faq_nav_*). */
  faq_nav_group?: string;
  faq_nav_label?: string;
  faq_nav_order?: number;
};

/** Dashboard landing page row (includes id) */
export type LandingPageRecord = LandingPageSummary & {
  id: number;
  content?: string | null;
  sections?: LandingSection[] | null;
  meta?: Record<string, unknown> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active: boolean;
  faq_nav_group?: string;
  faq_nav_label?: string;
  faq_nav_order?: number;
  deleted_at?: string | null;
};

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  date: string;
  image: string;
};

export type BlogPostDetail = BlogPostSummary & {
  body: string;
  published_at?: string;
};

export type BlogArchiveResponse = {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: BlogPostSummary[];
};

/** Dashboard blog post row */
export type BlogPostRecord = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time_minutes: number;
  image_url: string;
  /** Set when a file was uploaded; overrides image_url on the public site. */
  thumbnail_url?: string | null;
  /** Effective card image (upload or URL). */
  card_image_url?: string;
  body: string;
  published_at: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PartnersPagePillar = {
  title: string;
  body: string;
  /** Maps to Lucide icon on the public page. */
  icon?: string;
};

export type PartnersPageSettings = {
  id: number;
  banner_image_url: string;
  banner_kicker: string;
  hero_title: string;
  hero_lead: string;
  intro_heading: string;
  intro_body: string;
  pillars: PartnersPagePillar[];
  link_primary_label: string;
  link_primary_url: string;
  link_secondary_label: string;
  link_secondary_url: string;
  updated_at: string;
};

export type Sponsor = {
  id: number;
  name: string;
  website_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  /** Section heading on the public sponsors page (e.g. “Supplements & health”). */
  category?: string | null;
  is_active: boolean;
  sort_order: number;
  /** ISO datetime when archived via soft delete; omitted or null when active row. */
  deleted_at?: string | null;
};

