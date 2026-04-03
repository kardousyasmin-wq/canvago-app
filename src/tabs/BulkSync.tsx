import './Tab.css'
import './BulkSync.css'
import { useBulkSync } from '../hooks/useBulkSync'

export default function BulkSync() {
  const { selectedInfo, syncStatus, syncResult, handleSync, canSync } = useBulkSync()

  const isLoading = syncStatus === 'loading'
  const isSuccess = syncStatus === 'success'
  const isError = syncStatus === 'error'

  return (
    <div className="tab-content">
      <div className="tab-section">
        <h2 className="tab-heading">Bulk Sync</h2>
        <p className="tab-description">
          Select any element on your canvas, then sync its position and size to all
          matching elements across every page.
        </p>
      </div>

      {/* Selection Status Card */}
      <div className={`selection-card ${selectedInfo.type !== 'none' ? 'selection-card--active' : ''}`}>
        <div className="selection-card-icon">
          <SelectionIcon type={selectedInfo.type} />
        </div>
        <div className="selection-card-body">
          <span className="selection-card-label">
            {selectedInfo.type === 'none'
              ? 'No element selected'
              : selectedInfo.type === 'image'
              ? `Image selected`
              : selectedInfo.type === 'plaintext'
              ? `Text element selected`
              : `Element selected`}
          </span>
          <span className="selection-card-hint">
            {selectedInfo.type === 'none'
              ? 'Select an element in Canva to get started'
              : selectedInfo.count === 1
              ? '1 element ready to sync'
              : `${selectedInfo.count} elements ready to sync`}
          </span>
        </div>
        <div className={`selection-dot ${selectedInfo.type !== 'none' ? 'selection-dot--on' : ''}`} />
      </div>

      {/* Sync Info row */}
      <div className="sync-info-row">
        <InfoPill icon="🔍" label="Matches by" value={selectedInfo.type === 'image' ? 'asset ref' : selectedInfo.type === 'plaintext' ? 'text content' : '—'} />
        <InfoPill icon="📐" label="Syncs" value="position + size" />
        <InfoPill icon="📄" label="Scope" value="all pages" />
      </div>

      {/* Sync Button */}
      <button
        className={`sync-btn ${isLoading ? 'sync-btn--loading' : ''} ${isSuccess ? 'sync-btn--done' : ''} ${isError ? 'sync-btn--error' : ''} ${!canSync ? 'sync-btn--disabled' : ''}`}
        onClick={handleSync}
        disabled={isLoading || !canSync}
        type="button"
      >
        {isLoading ? (
          <>
            <span className="sync-spinner" />
            Syncing across pages…
          </>
        ) : isSuccess ? (
          <>
            <CheckIcon />
            Sync Complete
          </>
        ) : isError ? (
          <>
            <ErrorIcon />
            Sync Failed — Retry
          </>
        ) : (
          <>
            <SyncIcon />
            Sync Elements
          </>
        )}
      </button>

      {/* Result / Warning */}
      {isSuccess && syncResult && (
        <div className="sync-result sync-result--success">
          <CheckIcon />
          <span>{syncResult.message}</span>
        </div>
      )}

      {isError && syncResult && (
        <div className="sync-result sync-result--error">
          <ErrorIcon />
          <span>Something went wrong. Make sure you are inside Canva and an element is selected.</span>
        </div>
      )}

      {!canSync && syncStatus === 'idle' && (
        <p className="sync-hint">
          Open this app inside Canva and select an element on your canvas first.
        </p>
      )}
    </div>
  )
}

/* ---------- Small inline icons & sub-components ---------- */

function SelectionIcon({ type }: { type: string }) {
  if (type === 'image') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'plaintext') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h10M4 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 9l-3 3 3 3M19 9l3 3-3 3M14 4l-4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SyncIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="info-pill">
      <span className="info-pill-icon">{icon}</span>
      <div className="info-pill-text">
        <span className="info-pill-label">{label}</span>
        <span className="info-pill-value">{value}</span>
      </div>
    </div>
  )
}
