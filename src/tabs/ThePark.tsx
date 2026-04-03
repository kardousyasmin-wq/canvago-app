import { useState, useRef, useCallback } from 'react'
import './Tab.css'
import './ThePark.css'
import { useThePark } from '../hooks/useThePark'

type CardId = 'templates' | 'palette' | 'assets' | 'history'

export default function ThePark() {
  const [openCard, setOpenCard] = useState<CardId | null>(null)

  const toggle = (id: CardId) => setOpenCard((cur) => cur === id ? null : id)

  return (
    <div className="tab-content tp-root">
      <div className="tab-section">
        <h2 className="tab-heading">The Park</h2>
        <p className="tab-description">Your productivity hub — save palettes, park assets, and manage your creative workflow.</p>
      </div>

      <div className="tp-grid">
        <ParkCard
          id="templates"
          icon={<TemplatesIcon />}
          title="Templates"
          tagline="Browse saved templates"
          color="var(--tp-blue)"
          open={openCard === 'templates'}
          onToggle={() => toggle('templates')}
        >
          <TemplatesPanel />
        </ParkCard>

        <ParkCard
          id="palette"
          icon={<PaletteIcon />}
          title="Color Palettes"
          tagline="Save & reuse brand colours"
          color="var(--tp-violet)"
          open={openCard === 'palette'}
          onToggle={() => toggle('palette')}
        >
          <PalettePanel />
        </ParkCard>

        <ParkCard
          id="assets"
          icon={<AssetsIcon />}
          title="Asset Library"
          tagline="Park elements for reuse"
          color="var(--tp-green)"
          open={openCard === 'assets'}
          onToggle={() => toggle('assets')}
        >
          <AssetPanel />
        </ParkCard>

        <ParkCard
          id="history"
          icon={<HistoryIcon />}
          title="Version History"
          tagline="View past design states"
          color="var(--tp-amber)"
          open={openCard === 'history'}
          onToggle={() => toggle('history')}
        >
          <HistoryPanel />
        </ParkCard>
      </div>
    </div>
  )
}

/* ── Card wrapper ────────────────────────────────────────────────────── */
interface ParkCardProps {
  id: string
  icon: React.ReactNode
  title: string
  tagline: string
  color: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}
function ParkCard({ icon, title, tagline, color, open, onToggle, children }: ParkCardProps) {
  return (
    <div className={`tp-card ${open ? 'tp-card--open' : ''}`}>
      <button
        className="tp-card-header"
        style={{ '--tp-card-color': color } as React.CSSProperties}
        onClick={onToggle}
        type="button"
      >
        <div className="tp-card-icon-wrap" style={{ background: color }}>
          {icon}
        </div>
        <div className="tp-card-text">
          <span className="tp-card-title">{title}</span>
          <span className="tp-card-tagline">{tagline}</span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="tp-card-body">
          {children}
        </div>
      )}
    </div>
  )
}

/* ── Templates Panel ─────────────────────────────────────────────────── */
const TEMPLATE_PLACEHOLDERS = [
  { id: 'social', label: 'Social Post', dims: '1080×1080' },
  { id: 'banner', label: 'Banner',      dims: '1200×628' },
  { id: 'story',  label: 'Story',       dims: '1080×1920' },
  { id: 'logo',   label: 'Logo Card',   dims: '800×800' },
]

function TemplatesPanel() {
  return (
    <div className="tp-templates">
      <p className="tp-panel-hint">Quick-access saved design templates.</p>
      <div className="tp-template-grid">
        {TEMPLATE_PLACEHOLDERS.map((t) => (
          <button key={t.id} className="tp-template-card" type="button">
            <div className="tp-template-thumb">
              <TemplateThumbIcon />
            </div>
            <span className="tp-template-label">{t.label}</span>
            <span className="tp-template-dims">{t.dims}</span>
          </button>
        ))}
      </div>
      <p className="tp-panel-note">
        Template saving requires Canva's template API — coming in a future SDK version.
      </p>
    </div>
  )
}

/* ── Palette Panel ───────────────────────────────────────────────────── */
function PalettePanel() {
  const { palettes, grabbedColors, grabStatus, grabColors, savePalette, deletePalette } = useThePark()
  const [paletteName, setPaletteName] = useState('')

  const isGrabbing = grabStatus === 'grabbing'
  const hasDraft   = grabbedColors.length > 0

  return (
    <div className="tp-palette-panel">
      <p className="tp-panel-hint">
        Select coloured text in Canva, then tap Grab to capture a palette from your design.
      </p>

      {/* Grab area */}
      <div className="tp-grab-area">
        <button
          className={`tp-grab-btn ${isGrabbing ? 'tp-grab-btn--loading' : ''}`}
          type="button"
          onClick={grabColors}
          disabled={isGrabbing}
        >
          {isGrabbing ? <><span className="tp-mini-spin" />Scanning colours…</> : <><EyeDropperIcon />Grab Colours from Design</>}
        </button>

        {grabStatus === 'error' && (
          <p className="tp-error-note">Could not read colours. Select coloured text elements first.</p>
        )}
      </div>

      {/* Draft palette */}
      {hasDraft && (
        <div className="tp-draft-palette">
          <div className="tp-draft-swatches">
            {grabbedColors.map((c) => (
              <div key={c} className="tp-draft-swatch" style={{ background: c }} title={c} />
            ))}
          </div>
          <div className="tp-draft-save-row">
            <input
              className="tp-palette-name-input"
              type="text"
              placeholder="Palette name…"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              maxLength={32}
            />
            <button
              className="tp-save-btn"
              type="button"
              onClick={() => { savePalette(paletteName); setPaletteName('') }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Saved palettes */}
      {palettes.length > 0 && (
        <div className="tp-saved-palettes">
          <div className="tp-subsection-label">Saved Palettes</div>
          {palettes.map((p) => (
            <div key={p.id} className="tp-palette-row">
              <div className="tp-palette-info">
                <span className="tp-palette-name">{p.name}</span>
                <div className="tp-palette-swatches">
                  {p.colors.map((c) => (
                    <div key={c} className="tp-mini-swatch" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>
              <button
                className="tp-delete-btn"
                type="button"
                onClick={() => deletePalette(p.id)}
                title="Delete palette"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {palettes.length === 0 && !hasDraft && (
        <div className="tp-empty-state">
          <PaletteIcon />
          <p>No palettes saved yet</p>
        </div>
      )}
    </div>
  )
}

/* ── Asset Panel ─────────────────────────────────────────────────────── */
function AssetPanel() {
  const { assets, parkStatus, hasImageSel, parkAsset, placeAsset, deleteAsset } = useThePark()
  const [assetLabel, setAssetLabel]   = useState('')
  const [isDragOver, setIsDragOver]   = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const isParking = parkStatus === 'parking'
  const isPlaced  = parkStatus === 'placed'

  const handlePark = useCallback(() => {
    parkAsset(assetLabel)
    setAssetLabel('')
  }, [assetLabel, parkAsset])

  return (
    <div className="tp-asset-panel">
      <p className="tp-panel-hint">
        Select an image in Canva, name it, then park it for quick reuse across pages.
      </p>

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        className={`tp-drop-zone ${isDragOver ? 'tp-drop-zone--over' : ''} ${!hasImageSel ? 'tp-drop-zone--empty' : 'tp-drop-zone--ready'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (hasImageSel) handlePark() }}
      >
        <div className="tp-drop-icon">
          <BoxIcon />
        </div>
        {hasImageSel ? (
          <p className="tp-drop-text tp-drop-text--ready">Image selected — name it and park!</p>
        ) : (
          <p className="tp-drop-text">Select an image in Canva or drag one here</p>
        )}
      </div>

      {/* Park controls */}
      <div className="tp-park-controls">
        <input
          className="tp-asset-label-input"
          type="text"
          placeholder="Asset name…"
          value={assetLabel}
          onChange={(e) => setAssetLabel(e.target.value)}
          maxLength={40}
          disabled={!hasImageSel}
        />
        <button
          className={`tp-park-btn ${isParking ? 'tp-park-btn--loading' : ''} ${isPlaced ? 'tp-park-btn--done' : ''} ${!hasImageSel ? 'tp-park-btn--disabled' : ''}`}
          type="button"
          onClick={handlePark}
          disabled={isParking || !hasImageSel}
        >
          {isParking ? <><span className="tp-mini-spin" />Parking…</>
           : isPlaced  ? <><CheckSmallIcon />Parked!</>
           : <><ParkIcon />Park Asset</>}
        </button>
      </div>

      {/* Parked assets list */}
      {assets.length > 0 ? (
        <div className="tp-assets-list">
          <div className="tp-subsection-label">Parked ({assets.length})</div>
          {assets.map((a) => (
            <div key={a.id} className="tp-asset-row">
              <div className="tp-asset-icon"><BoxSmallIcon /></div>
              <div className="tp-asset-info">
                <span className="tp-asset-name">{a.label}</span>
                <span className="tp-asset-date">{new Date(a.parkedAt).toLocaleDateString()}</span>
              </div>
              <button className="tp-place-btn" type="button" onClick={() => placeAsset(a)} title="Place on page">
                <PlaceIcon />
              </button>
              <button className="tp-delete-btn" type="button" onClick={() => deleteAsset(a.id)} title="Remove">
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="tp-empty-state">
          <BoxIcon />
          <p>No assets parked yet</p>
        </div>
      )}
    </div>
  )
}

/* ── History Panel ───────────────────────────────────────────────────── */
const MOCK_HISTORY = [
  { id: 'h1', label: 'Current version',   time: 'Just now',    active: true },
  { id: 'h2', label: 'Before shadow edit', time: '5 min ago',  active: false },
  { id: 'h3', label: 'Initial layout',    time: '22 min ago',  active: false },
  { id: 'h4', label: 'First draft',       time: '1 hour ago',  active: false },
]

function HistoryPanel() {
  return (
    <div className="tp-history-panel">
      <p className="tp-panel-hint">
        Version history is managed by Canva. These checkpoints reflect your recent session activity.
      </p>
      <div className="tp-history-list">
        {MOCK_HISTORY.map((h, i) => (
          <div key={h.id} className={`tp-history-row ${h.active ? 'tp-history-row--active' : ''}`}>
            <div className="tp-history-line-wrap">
              <div className={`tp-history-dot ${h.active ? 'tp-history-dot--active' : ''}`} />
              {i < MOCK_HISTORY.length - 1 && <div className="tp-history-line" />}
            </div>
            <div className="tp-history-info">
              <span className="tp-history-label">{h.label}</span>
              <span className="tp-history-time">{h.time}</span>
            </div>
            {!h.active && (
              <button className="tp-restore-btn" type="button">Restore</button>
            )}
            {h.active && <span className="tp-active-badge">Active</span>}
          </div>
        ))}
      </div>
      <p className="tp-panel-note">
        Full version restore requires Canva's version API — currently view-only.
      </p>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`tp-chevron ${open ? 'tp-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TemplatesIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /></svg>
}
function PaletteIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="10" r="1.5" fill="currentColor" /><circle cx="12" cy="7" r="1.5" fill="currentColor" /><circle cx="16" cy="10" r="1.5" fill="currentColor" /><path d="M12 22c0-4 4-4 4-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function AssetsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function HistoryIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function EyeDropperIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 005 16v3h3a2 2 0 001.41-.59l6.6-6.6 1.41 1.41 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 000-1.64z" fill="currentColor" /></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function BoxIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}
function BoxSmallIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2" /></svg>
}
function ParkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 9H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" /><path d="M12 12v5M9.5 14.5L12 12l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 9V7a4 4 0 018 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
function PlaceIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function CheckSmallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function TemplateThumbIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" /></svg>
}
