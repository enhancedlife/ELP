'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { listFaqSponsorNavPages } from '@/lib/api/website';
import type { LandingPageSummary } from '@/lib/types';

export type FaqSponsorNavContextValue = {
  pages: LandingPageSummary[];
  /** True only until the first successful load attempt finishes. */
  loading: boolean;
  /** Call after CMS changes if you need fresh links without a full reload. */
  refresh: () => Promise<void>;
};

const FaqSponsorNavContext = createContext<FaqSponsorNavContextValue | null>(null);

/**
 * Loads sponsor FAQ nav links once for the public site shell and shares them across the header
 * (desktop FAQ menu + mobile nav). The layout stays mounted on client-side route changes, so
 * this does not re-fetch on every page navigation.
 */
export function FaqSponsorNavProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<LandingPageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listFaqSponsorNavPages();
      setPages(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      pages,
      loading,
      refresh,
    }),
    [pages, loading, refresh],
  );

  return (
    <FaqSponsorNavContext.Provider value={value}>{children}</FaqSponsorNavContext.Provider>
  );
}

export function useFaqSponsorNav(): FaqSponsorNavContextValue {
  const ctx = useContext(FaqSponsorNavContext);
  if (!ctx) {
    throw new Error('useFaqSponsorNav must be used within FaqSponsorNavProvider');
  }
  return ctx;
}
