import './Tab.css'
import './ShapeShadows.css'
import { useShapeShadows, SHADOW_PRESETS, NEUTRAL_COLORS } from '../hooks/useShapeShadows'

export default function ShapeShadows() {
  const {
    config, hasSelection, applyStatus, appliedCount,
    pageColors, isGrabbingColors,
    hexInput, hexError,
    applyPreset, setColor, updateBlur, updateOpacity,
    setHexInput, grabPageColors, applyShShadow,
  } = useShapeShadows()

  const isApplying = applyStatus === 'applying'
  const isSuccess  = applyStatus === 'success'
  const isError    = applyStatus === 'error'

  // Decompose hex color to rgba for the preview
  const hex = config.color.replace('#', '')
  const r   = parseInt(hex.substring(0,2), 16)
  const g   = parseInt(hex.substring(2,4), 16)
  const b   = parseInt(hex.substring(4,6), 16)
  const spreadPx = Math.round(config.blur * 0.15)
  const previewShadow = config.blur === 0
    ? 'none'
    : `${config.offsetX * 1.5}px ${config.offsetY * 1.5}px ${config.blur}px ${spreadPx}px rgba(${r},${g},${b},${config.opacity / 100})`

  return (
    <div className="tab-content ss-root">
      <div className="tab-section">
        <h2 className="tab-heading">Shape Shadows</h2>
        <p className="tab-description">
          Pick a preset, choose a shadow colour, then apply — a clone is placed
          behind your element to simulate a drop shadow.
        </p>
      </div>

      {/* ── Live Preview ─────────────────────────────────────────────── */}
      <div className="ss-preview-wrap">
        <span className="ss-preview-label">Live Preview</span>
        <div className="ss-preview-stage">
          <div className="ss-preview-checker" />
          <div
            className="ss-shadow-clone"
            style={{
              background: `rgba(${r},${g},${b},${config.opacity / 100})`,
              filter:    `blur(${config.blur * 0.35}px)`,
              transform: `translate(${config.offsetX * 1.5}px, ${config.offsetY * 1.5}px)`,
            }}
          />
          <div className="ss-preview-shape" />
        </div>
        <div className="ss-preview-css-mode">
          <span className="ss-preview-css-label">CSS equivalent</span>
          <code className="ss-preview-css-value">box-shadow: {previewShadow}</code>
        </div>
      </div>

      {/* ── Presets ──────────────────────────────────────────────────── */}
      <div className="ss-section-label">Presets</div>
      <div className="ss-presets">
        {SHADOW_PRESETS.map((p) => {
          const active = config.preset === p.id
          const previewSh = `${p.offsetX * 1.5}px ${p.offsetY * 1.5}px ${p.blur}px rgba(${r},${g},${b},${p.opacity / 100})`
          return (
            <button
              key={p.id}
              className={`ss-preset ${active ? 'ss-preset--active' : ''}`}
              onClick={() => applyPreset(p)}
              type="button"
            >
              <div className="ss-preset-swatch">
                <div className="ss-preset-swatch-shape" style={{ boxShadow: previewSh }} />
              </div>
              <span className="ss-preset-name">{p.label}</span>
              <span className="ss-preset-meta">{p.blur}px · {p.opacity}%</span>
            </button>
          )
        })}
      </div>

      {/* ── Sliders ──────────────────────────────────────────────────── */}
      <div className="ss-controls">
        <SliderRow label="Blur"    value={config.blur}    min={0} max={100} unit="px" onChange={updateBlur} />
        <SliderRow label="Opacity" value={config.opacity} min={0} max={100} unit="%" onChange={updateOpacity} />
      </div>

      {/* ── Shadow Colour ─────────────────────────────────────────────── */}
      <div className="ss-color-section">
        <div className="ss-color-header">
          <span className="ss-section-label" style={{ marginBottom: 0 }}>Shadow Colour</span>
          <div className="ss-color-preview-badge" style={{ background: config.color }} />
        </div>

        {/* Neutral ramp */}
        <div className="ss-color-row-label">Neutrals</div>
        <div className="ss-color-row">
          {NEUTRAL_COLORS.map((nc) => (
            <button
              key={nc}
              type="button"
              className={`ss-swatch ${config.color.toUpperCase() === nc.toUpperCase() ? 'ss-swatch--active' : ''}`}
              style={{ background: nc, border: '2px solid rgba(255,255,255,0.12)' }}
              title={nc}
              onClick={() => setColor(nc)}
            />
          ))}
          {/* Gradient bar below the swatches */}
        </div>
        <div className="ss-neutral-bar" />

        {/* Page colours */}
        <div className="ss-color-row-label">
          Page Colours
          <button
            className="ss-grab-btn"
            type="button"
            onClick={grabPageColors}
            disabled={isGrabbingColors}
          >
            {isGrabbingColors
              ? <><span className="ss-mini-spin" />Scanning…</>
              : <><EyeDropperIcon />Grab</>
            }
          </button>
        </div>
        <div className="ss-color-row">
          {pageColors.length === 0 ? (
            <span className="ss-page-colors-hint">
              Select text elements in Canva then tap Grab
            </span>
          ) : (
            pageColors.map((pc) => (
              <button
                key={pc}
                type="button"
                className={`ss-swatch ss-swatch--page ${config.color.toUpperCase() === pc.toUpperCase() ? 'ss-swatch--active' : ''}`}
                style={{ background: pc }}
                title={pc}
                onClick={() => setColor(pc)}
              >
                <span className="ss-swatch-hex">{pc}</span>
              </button>
            ))
          )}
        </div>

        {/* Hex picker */}
        <div className="ss-hex-row">
          <span className="ss-hex-hash">#</span>
          <input
            className={`ss-hex-input ${hexError ? 'ss-hex-input--error' : ''}`}
            type="text"
            maxLength={7}
            placeholder="000000"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            spellCheck={false}
          />
          <div
            className="ss-hex-preview"
            style={{ background: hexError || !hexInput ? 'transparent' : config.color }}
          />
          {hexError && <span className="ss-hex-error">Invalid hex</span>}
        </div>
      </div>

      {/* ── Selection indicator ───────────────────────────────────────── */}
      <div className={`ss-selection-indicator ${hasSelection ? 'ss-selection-indicator--ready' : ''}`}>
        <div className={`ss-sel-dot ${hasSelection ? 'ss-sel-dot--on' : ''}`} />
        <span>
          {hasSelection ? 'Element selected — ready to apply' : 'Select a shape or image in Canva'}
        </span>
        {appliedCount > 0 && <span className="ss-applied-count">{appliedCount} applied</span>}
      </div>

      {/* ── Apply Button ─────────────────────────────────────────────── */}
      <button
        className={`ss-apply-btn ${isApplying ? 'ss-apply-btn--loading' : ''} ${isSuccess ? 'ss-apply-btn--done' : ''} ${isError ? 'ss-apply-btn--error' : ''} ${!hasSelection ? 'ss-apply-btn--disabled' : ''}`}
        onClick={applyShShadow}
        disabled={isApplying || !hasSelection}
        type="button"
      >
        {isApplying ? (
          <><span className="ss-spinner" />Generating shadow…</>
        ) : isSuccess ? (
          <><CheckIcon />Shadow applied!</>
        ) : isError ? (
          <><ErrorIcon />Failed — try again</>
        ) : (
          <><ShadowIcon />Apply Shadow</>
        )}
      </button>

      {isSuccess && (
        <p className="ss-feedback ss-feedback--ok">
          A clone was placed behind your element. Group both layers in Canva to lock the shadow in place.
        </p>
      )}
      {isError && (
        <p className="ss-feedback ss-feedback--err">
          Open inside Canva and select an image element first.
        </p>
      )}

      <div className="ss-technique">
        <div className="ss-technique-icon"><InfoIcon /></div>
        <p className="ss-technique-text">
          Shadows are created by placing a semi-transparent clone behind the original — a creative workaround for Canva's missing blur API.
        </p>
      </div>
    </div>
  )
}

/* ── Slider ─────────────────────────────────────────────────────────── */
interface SliderRowProps { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }
function SliderRow({ label, value, min, max, unit, onChange }: SliderRowProps) {
  return (
    <div className="ss-slider-group">
      <div className="ss-slider-header">
        <span className="ss-slider-label">{label}</span>
        <span className="ss-slider-value">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ss-range"
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────── */
function ShadowIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="8" y="8" width="13" height="13" rx="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" /></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function ErrorIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function InfoIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function EyeDropperIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 005 16v3h3a2 2 0 001.41-.59l6.6-6.6 1.41 1.41 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 000-1.64z" fill="currentColor" /></svg>
}
