import './Tab.css'
import './DeepSwap.css'
import { useDeepSwap } from '../hooks/useDeepSwap'
import type { SlotState } from '../hooks/useDeepSwap'

export default function DeepSwap() {
  const {
    source,
    target,
    hasActiveSelection,
    swapStatus,
    swapResult,
    estimatedCount,
    canLockSource,
    canLockTarget,
    canSwap,
    lockSource,
    lockTarget,
    clearSlot,
    requestSwap,
    cancelSwap,
    confirmSwap,
    reset,
  } = useDeepSwap()

  const isSwapping = swapStatus === 'swapping'
  const isSuccess = swapStatus === 'success'
  const isError = swapStatus === 'error'
  const isConfirming = swapStatus === 'confirming'

  return (
    <div className="tab-content deepswap-root">
      <div className="tab-section">
        <h2 className="tab-heading">Deep Swap</h2>
        <p className="tab-description">
          Lock a source element, choose a target, then replace every instance
          across all pages while preserving scale and rotation.
        </p>
      </div>

      {/* Steps guide */}
      <div className="ds-steps">
        <Step num={1} done={source.locked} active={!source.locked} label="Lock source" />
        <div className="ds-step-line" />
        <Step num={2} done={target.locked} active={source.locked && !target.locked} label="Lock target" />
        <div className="ds-step-line" />
        <Step num={3} done={isSuccess} active={canSwap} label="Swap" />
      </div>

      {/* Slots */}
      <div className="ds-slots">
        <Slot
          label="Source"
          sublabel="Element to replace"
          slot={source}
          canLock={canLockSource}
          onLock={lockSource}
          onClear={() => clearSlot('source')}
          hasActiveSelection={hasActiveSelection}
          variant="source"
        />

        <div className="ds-slots-divider">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <Slot
          label="Target"
          sublabel="Replacement element"
          slot={target}
          canLock={canLockTarget}
          onLock={lockTarget}
          onClear={() => clearSlot('target')}
          hasActiveSelection={hasActiveSelection && source.locked}
          variant="target"
        />
      </div>

      {/* Preserved attributes badge row */}
      <div className="ds-preserve-row">
        <PreserveBadge icon={<ScaleIcon />} label="Scale" />
        <PreserveBadge icon={<RotateIcon />} label="Rotation" />
        <PreserveBadge icon={<PositionIcon />} label="Position" />
      </div>

      {/* Swap Button */}
      <button
        className={`ds-swap-btn ${!canSwap && !isSwapping ? 'ds-swap-btn--disabled' : ''} ${isSwapping ? 'ds-swap-btn--loading' : ''} ${isSuccess ? 'ds-swap-btn--done' : ''} ${isError ? 'ds-swap-btn--error' : ''}`}
        onClick={isSuccess || isError ? reset : requestSwap}
        disabled={isSwapping || (!canSwap && !isSuccess && !isError)}
        type="button"
      >
        {isSwapping ? (
          <><span className="ds-spinner" />Swapping…</>
        ) : isSuccess ? (
          <><CheckIcon />Done — Swap Again</>
        ) : isError ? (
          <><ErrorIcon />Failed — Try Again</>
        ) : (
          <><SwapIcon />Swap Elements</>
        )}
      </button>

      {/* No-SDK hint */}
      {!source.locked && !hasActiveSelection && (
        <p className="ds-hint">
          Open inside Canva and select an image to get started.
        </p>
      )}

      {/* Success/Error feedback */}
      {isSuccess && swapResult && (
        <div className="ds-result ds-result--success">
          <CheckIcon /><span>{swapResult.message}</span>
        </div>
      )}
      {isError && swapResult && (
        <div className="ds-result ds-result--error">
          <ErrorIcon /><span>Swap failed — make sure both elements are selected in Canva.</span>
        </div>
      )}

      {/* Safety Check Modal */}
      {isConfirming && (
        <SafetyModal
          count={estimatedCount || 1}
          onConfirm={confirmSwap}
          onCancel={cancelSwap}
        />
      )}
    </div>
  )
}

/* ---------- Sub-components ---------- */

function Step({ num, done, active, label }: { num: number; done: boolean; active: boolean; label: string }) {
  return (
    <div className={`ds-step ${done ? 'ds-step--done' : active ? 'ds-step--active' : ''}`}>
      <div className="ds-step-circle">
        {done ? <CheckIcon /> : num}
      </div>
      <span className="ds-step-label">{label}</span>
    </div>
  )
}

interface SlotProps {
  label: string
  sublabel: string
  slot: SlotState
  canLock: boolean
  onLock: () => void
  onClear: () => void
  hasActiveSelection: boolean
  variant: 'source' | 'target'
}

function Slot({ label, sublabel, slot, canLock, onLock, onClear, hasActiveSelection, variant }: SlotProps) {
  return (
    <div className={`ds-slot ds-slot--${variant} ${slot.locked ? 'ds-slot--locked' : ''}`}>
      <div className="ds-slot-header">
        <div className="ds-slot-titles">
          <span className="ds-slot-label">{label}</span>
          <span className="ds-slot-sublabel">{sublabel}</span>
        </div>
        {slot.locked && (
          <button className="ds-slot-clear" onClick={onClear} type="button" title="Clear slot">
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="ds-slot-body">
        {slot.locked ? (
          <div className="ds-slot-locked-content">
            <div className="ds-slot-icon ds-slot-icon--locked">
              <ImageIcon />
            </div>
            <div className="ds-slot-locked-info">
              <span className="ds-slot-locked-label">{slot.label}</span>
              <span className="ds-slot-locked-ref">ref: {String(slot.ref).slice(0, 12)}…</span>
            </div>
            <div className="ds-lock-badge">
              <LockIcon />
              Locked
            </div>
          </div>
        ) : (
          <div className="ds-slot-empty">
            <div className="ds-slot-icon">
              {variant === 'source' ? <SourceIcon /> : <TargetIcon />}
            </div>
            <span className="ds-slot-empty-hint">
              {hasActiveSelection
                ? 'Image selected — lock it below'
                : `Select an image in Canva`}
            </span>
          </div>
        )}
      </div>

      {!slot.locked && (
        <button
          className={`ds-lock-btn ds-lock-btn--${variant} ${!canLock ? 'ds-lock-btn--disabled' : ''}`}
          onClick={onLock}
          disabled={!canLock}
          type="button"
        >
          <LockIcon />
          Lock as {label}
        </button>
      )}
    </div>
  )
}

function PreserveBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="ds-preserve-badge">
      <span className="ds-preserve-icon">{icon}</span>
      <span className="ds-preserve-label">{label}</span>
    </div>
  )
}

function SafetyModal({ count, onConfirm, onCancel }: { count: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="ds-modal-overlay" onClick={onCancel}>
      <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ds-modal-icon">
          <WarningIcon />
        </div>
        <h3 className="ds-modal-title">Safety Check</h3>
        <p className="ds-modal-body">
          This will replace{' '}
          <strong className="ds-modal-count">{count} element{count !== 1 ? 's' : ''}</strong>{' '}
          across all pages. This action cannot be undone.
        </p>
        <div className="ds-modal-actions">
          <button className="ds-modal-cancel" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="ds-modal-confirm" onClick={onConfirm} type="button">
            <SwapIcon />
            Replace {count} element{count !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Icons ---------- */
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function ErrorIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function SwapIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function LockIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function CloseIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function ImageIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function SourceIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function TargetIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function WarningIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function ScaleIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 3H3m18 0v6m0-6l-6 6M3 21h18M3 21v-6m0 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function RotateIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function PositionIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
