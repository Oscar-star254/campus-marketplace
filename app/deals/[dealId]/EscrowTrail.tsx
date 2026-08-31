const STAGES = [
  { key: "awaiting_commission", label: "Agreed" },
  { key: "commission_paid", label: "Commission paid" },
  { key: "awaiting_deposit", label: "Approved" },
  { key: "deposit_paid", label: "Deposit paid" },
  { key: "completed", label: "Picked up" },
];

// Some statuses map onto the same visual stage (e.g. commission_paid and
// awaiting_deposit both mean "approved and moving on"), so this maps the
// deal's actual status to how far along the trail to show.
function stageIndexFor(status: string): number {
  const order = ["awaiting_commission", "commission_paid", "awaiting_deposit", "deposit_paid", "completed"];
  const idx = order.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function EscrowTrail({ status }: { status: string }) {
  if (status === "disputed" || status === "cancelled") {
    return (
      <div className="escrow-trail">
        <div className="escrow-step disputed">
          <span className="dot" />
          <span className="label">{status === "disputed" ? "Disputed" : "Cancelled"}</span>
        </div>
      </div>
    );
  }

  const currentIndex = stageIndexFor(status);

  return (
    <div className="escrow-trail">
      {STAGES.map((stage, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
        return (
          <div key={stage.key} className={`escrow-step ${state}`}>
            <span className="dot" />
            <span className="label">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}
