import SearchClient from './SearchClient';

// Server Component: reads `searchParams` as a page prop, not the
// useSearchParams() client hook — see app/collections/page.tsx for why
// that hook forces a Suspense boundary that was blocking real content.
export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return <SearchClient initialQuery={searchParams.q || ''} />;
}
