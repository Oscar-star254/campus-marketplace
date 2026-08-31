export default function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input placeholder="Search for items, brands, and more..." />
      </div>
      <div className="topbar-actions">
        <a href="/deals" className="topbar-icon-btn" title="My deals">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12 3 9v6l5 3" /><path d="M16 12l5-3v6l-5 3" /><path d="M8 12h3l2 2 2-2h1" />
          </svg>
        </a>
        <a href="/login" className="topbar-account">
          <span className="avatar">?</span>
        </a>
      </div>
    </div>
  );
}
