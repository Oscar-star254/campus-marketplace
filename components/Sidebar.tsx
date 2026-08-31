import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/listings", label: "Browse", icon: "grid" },
  { href: "/sell", label: "Sell an item", icon: "tag" },
  { href: "/orders", label: "My orders", icon: "box" },
  { href: "/deals", label: "My deals", icon: "handshake" },
  { href: "/admin", label: "Admin", icon: "shield" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>;
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "tag":
      return <svg {...common}><path d="M12 2 2 12l9 9 11-11V4a2 2 0 0 0-2-2z" /><circle cx="16" cy="8" r="1.5" /></svg>;
    case "handshake":
      return <svg {...common}><path d="M8 12 3 9v6l5 3" /><path d="M16 12l5-3v6l-5 3" /><path d="M8 12h3l2 2 2-2h1" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 4 6v6c0 4.5 3.2 7.6 8 9 4.8-1.4 8-4.5 8-9V6z" /></svg>;
    case "box":
      return <svg {...common}><path d="M3 8 12 4l9 4-9 4-9-4Z" /><path d="M3 8v9l9 4 9-4V8" /><path d="M12 12v9" /></svg>;
    default:
      return null;
  }
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo">
        <span className="sidebar-logo-mark">Q</span>
        The Quad
      </Link>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="sidebar-link">
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-promo">
        <strong>List it in minutes</strong>
        <p>Selling something before term ends? Get it in front of buyers today.</p>
        <Link href="/sell" className="btn light">Sell an item</Link>
      </div>
    </aside>
  );
}