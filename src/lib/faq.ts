export interface FaqItem {
  q: string;
  a: string;
}

/** FAQPage structured data, or null when there is nothing to describe. */
export function faqJsonLd(items: FaqItem[]): object | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
