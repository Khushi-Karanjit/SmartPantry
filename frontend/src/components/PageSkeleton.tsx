import Skeleton from "./Skeleton";

interface PageSkeletonProps {
  cards?: number;
}

export default function PageSkeleton({ cards = 3 }: PageSkeletonProps) {
  return (
    <div className="page-skeleton" style={{ padding: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
      <header className="skeleton-header" style={{ marginBottom: '2rem' }}>
        <Skeleton width="40%" height="2rem" className="mb-2" />
        <Skeleton width="60%" height="1rem" />
      </header>

      <div className="skeleton-content grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="card section" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.5)' }}>
            <Skeleton width="30%" height="1rem" className="mb-3" />
            <Skeleton width="100%" height="1.5rem" className="mb-2" />
            <Skeleton width="80%" height="1.5rem" className="mb-4" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <Skeleton width="25%" height="1.5rem" borderRadius="999px" />
               <Skeleton width="25%" height="1.5rem" borderRadius="999px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
