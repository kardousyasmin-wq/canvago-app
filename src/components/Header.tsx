import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="header-title">CanvaGo</span>
      </div>
      <div className="header-badge">v1.0</div>
    </header>
  )
}
