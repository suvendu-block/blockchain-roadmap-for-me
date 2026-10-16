import { fmtEth, shortAddr, when } from "../lib/format.js";

/** The ledger: every tip mirrored from the chain, with its off-chain note */
export default function TipFeed({ tips, loading, highlightTx, onRefresh }) {
  return (
    <section className="ledger reveal" style={{ "--delay": "240ms" }}>
      <header className="ledger__head">
        <div>
          <h2>The Ledger</h2>
          <p className="ledger__sub">
            {loading ? "leafing through the pages…" : `${tips.length} recorded tip${tips.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="ledger__head-right">
          <span className="stamp" aria-hidden="true">
            verified
            <br />
            on-chain
          </span>
          <button type="button" className="btn btn--ghost" onClick={onRefresh}>
            refresh
          </button>
        </div>
      </header>

      {tips.length === 0 && !loading ? (
        <p className="ledger__empty">
          The ledger is empty — <em>be the first entry.</em>
        </p>
      ) : null}

      <ol className="ledger__rows">
        {tips.map((tip, i) => (
          <li
            key={tip.txHash}
            className={`row ${highlightTx === tip.txHash ? "row--new" : ""}`}
            style={{ "--i": i }}
          >
            <span className="row__time">{when(tip.timestamp)}</span>
            <span className="row__who">
              <strong>{tip.name || "Anonymous"}</strong>
              <span className="row__addr" title={tip.from}>
                {shortAddr(tip.from)}
              </span>
            </span>
            <span className="row__note">
              {tip.message ? tip.message : <em className="row__silent">left without a note</em>}
            </span>
            <span className="row__amount" title="tip amount">
              {fmtEth(tip.amount, 5)}
              <i>ETH</i>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
