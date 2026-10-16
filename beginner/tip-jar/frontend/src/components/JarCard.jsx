import { fmtEth, jarProgress, shortAddr } from "../lib/format.js";

/** The hero panel: big balance, a jar that fills toward the next milestone, stats, owner sweep */
export default function JarCard({ stats, owner, isOwner, onWithdraw, withdrawing, coinKey }) {
  const totalWei = stats?.onChain?.totalWei ?? "0";
  const { next, pct } = jarProgress(totalWei);
  const fillPct = Math.min(96, Math.max(0, pct * 100));

  const tipCount = stats?.onChain?.tipCount ?? 0;
  const blockNumber = stats?.onChain?.blockNumber ?? "—";
  const top = stats?.topTippers?.[0];

  return (
    <section className="jar-card reveal" style={{ "--delay": "80ms" }}>
      <div className="jar-card__balance">
        <p className="jar-card__label">in the jar right now</p>
        <p className="jar-card__amount">
          {fmtEth(totalWei)}
          <span className="jar-card__unit">ETH</span>
        </p>
        <p className="jar-card__milestone">
          next stamp at <strong>{fmtEth(next, 3)} ETH</strong>
          <span className="jar-card__meter" aria-hidden="true">
            <span style={{ width: `${fillPct}%` }} />
          </span>
        </p>
      </div>

      <div className="jar-card__jar">
        <svg viewBox="0 0 220 270" className="jarsvg" role="img" aria-label="Tip jar illustration">
          <defs>
            <linearGradient id="coinFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F6C552" />
              <stop offset="100%" stopColor="#D99412" />
            </linearGradient>
            <clipPath id="jarClip">
              <path d="M42 74 h136 a10 10 0 0 1 10 10 v146 a20 20 0 0 1 -20 20 H52 a20 20 0 0 1 -20 -20 V84 a10 10 0 0 1 10 -10 Z" />
            </clipPath>
          </defs>

          {/* coins inside, revealed by fill level */}
          <g clipPath="url(#jarClip)">
            <rect
              x="30"
              y={250 - (fillPct / 100) * 176}
              width="160"
              height={(fillPct / 100) * 176 + 10}
              fill="url(#coinFill)"
              className="jarsvg__fill"
            />
            <g className="jarsvg__coinlines" stroke="#B87A0B" strokeWidth="2" opacity="0.55">
              <line x1="34" y1={244 - (fillPct / 100) * 140} x2="186" y2={244 - (fillPct / 100) * 140} />
              <line x1="34" y1={228 - (fillPct / 100) * 110} x2="186" y2={228 - (fillPct / 100) * 110} />
              <line x1="34" y1={212 - (fillPct / 100) * 80} x2="186" y2={212 - (fillPct / 100) * 80} />
            </g>
          </g>

          {/* glass outline */}
          <path
            d="M42 74 h136 a10 10 0 0 1 10 10 v146 a20 20 0 0 1 -20 20 H52 a20 20 0 0 1 -20 -20 V84 a10 10 0 0 1 10 -10 Z"
            fill="none"
            stroke="#17140E"
            strokeWidth="5"
          />
          {/* lid */}
          <rect x="58" y="52" width="104" height="26" rx="10" fill="#17140E" />
          <rect x="94" y="58" width="32" height="6" rx="3" fill="#F0B429" />
          {/* gloss */}
          <path d="M56 96 q-6 46 2 112" fill="none" stroke="#FFFDF6" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
          {/* falling coin */}
          <g key={coinKey} className={coinKey ? "jarsvg__drop" : undefined}>
            <circle cx="110" cy="30" r="11" fill="#F0B429" stroke="#17140E" strokeWidth="3" />
            <text x="110" y="35" textAnchor="middle" fontSize="13" fontWeight="700" fill="#17140E" fontFamily="Georgia, serif">
              ξ
            </text>
          </g>
        </svg>
      </div>

      <dl className="jar-card__stats">
        <div>
          <dt>tips</dt>
          <dd>{tipCount}</dd>
        </div>
        <div>
          <dt>latest block</dt>
          <dd>#{blockNumber}</dd>
        </div>
        <div className="jar-card__stat--wide">
          <dt>top tipper</dt>
          <dd title={top?.address}>
            {top ? `${shortAddr(top.address)} · ${fmtEth(top.totalWei)} ETH` : "—"}
          </dd>
        </div>
      </dl>

      {isOwner && (
        <div className="jar-card__owner">
          <span className="stamp stamp--small">you are the jar owner</span>
          <button
            type="button"
            className="btn btn--stamp"
            onClick={onWithdraw}
            disabled={withdrawing || stats?.onChain?.tipCount === 0}
          >
            {withdrawing ? "sweeping…" : "sweep jar to owner"}
          </button>
        </div>
      )}

      {owner && !isOwner ? (
        <p className="jar-card__owner-note">jar is tended by {shortAddr(owner)}</p>
      ) : null}
    </section>
  );
}
