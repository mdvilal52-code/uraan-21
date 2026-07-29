import CollectionsClient from './CollectionsClient';

// Server Component: reads `searchParams` as a page prop, not the
// useSearchParams() client hook — that hook requires the whole subtree
// behind a Suspense boundary, which was blocking the entire page (navbar,
// heading, product grid) from painting until client JS fully hydrated.
// Reading params here lets the page SSR with real content immediately.
export default function CollectionsPage({
  searchParams,
}: {
  searchParams: { type?: string; price?: string; q?: string };
}) {
  return (
    <CollectionsClient
      initialType={searchParams.type || ''}
      initialPrice={searchParams.price || ''}
      initialQuery={searchParams.q || ''}
    />
  );
}
