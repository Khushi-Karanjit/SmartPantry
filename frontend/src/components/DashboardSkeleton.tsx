import Skeleton from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {/* Top Stats Skeleton */}
      <div className="grid-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card section stat-card-skeleton" style={{ padding: '1.5rem' }}>
            <Skeleton width="40%" height="0.75rem" className="mb-2" />
            <Skeleton width="60%" height="1.5rem" className="mb-2" />
            <Skeleton width="80%" height="0.75rem" />
          </div>
        ))}
      </div>

      {/* Bottom Sections Skeleton */}
      <div className="grid-2">
        {/* Alerts Skeleton */}
        <div className="card section">
          <div className="section-head">
            <Skeleton width="30%" height="1.25rem" />
            <Skeleton width="15%" height="0.75rem" />
          </div>
          <div className="alerts" style={{ padding: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="alert-skeleton" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <Skeleton width="2rem" height="2rem" borderRadius="50%" />
                <Skeleton width="70%" height="1rem" />
              </div>
            ))}
          </div>
        </div>

        {/* Kitchen Tools Skeleton */}
        <div className="card section">
          <div className="section-head">
            <Skeleton width="30%" height="1.25rem" />
          </div>
          <div className="tools-grid-skeleton" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem' }}>
            {[1, 2].map((i) => (
              <div key={i} className="tool-card-skeleton" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
                <Skeleton width="1.5rem" height="1.5rem" className="mb-3" />
                <Skeleton width="80%" height="1rem" className="mb-2" />
                <Skeleton width="60%" height="0.75rem" />
              </div>
            ))}
          </div>
        </div>

        {/* Composition Skeleton */}
        <div className="card section">
          <div className="section-head">
            <Skeleton width="40%" height="1.25rem" />
          </div>
          <div className="bars" style={{ padding: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bar-row-skeleton" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <Skeleton width="30%" height="0.75rem" />
                  <Skeleton width="10%" height="0.75rem" />
                </div>
                <Skeleton width="100%" height="0.5rem" borderRadius="1rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
