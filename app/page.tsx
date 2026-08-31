import HeroArt from "@/components/HeroArt";

const CATEGORIES = [
  { label: "New", icon: "✦" },
  { label: "Secondhand", icon: "↻" },
  { label: "Electronics", icon: "▤" },
  { label: "Books", icon: "▥" },
  { label: "Fashion", icon: "◐" },
  { label: "More", icon: "···" },
];

export default function HomePage() {
  return (
    <div>
      <div className="hero hero-with-art">
        <div className="hero-copy">
          <h1>Everything on campus, one trade away.</h1>
          <p>New stock alongside secondhand finds from other students — chat, agree a price, and we hold the deposit until pickup.</p>
          <a className="btn light" style={{ width: "auto", marginTop: "1rem", display: "inline-block" }} href="/listings">Browse what&apos;s up for grabs</a>
        </div>
        <HeroArt />
      </div>

      <div className="category-row">
        {CATEGORIES.map((c) => (
          <a className="category-item" href="/listings" key={c.label}>
            <span className="category-icon">{c.icon}</span>
            {c.label}
          </a>
        ))}
      </div>

      <h2>How a secondhand deal works</h2>
      <p>
        You won&apos;t hand over money — or your number — to a stranger blind.
        Message the seller, agree on a price, and the deposit only moves once
        both sides are ready.
      </p>
      <a href="/sell" style={{ color: "var(--purple)", fontWeight: 600 }}>Got something to sell?</a>
    </div>
  );
}