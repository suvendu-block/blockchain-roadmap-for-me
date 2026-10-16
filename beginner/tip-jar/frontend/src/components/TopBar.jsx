import { shortAddr } from "../lib/format.js";

/** Sticky top bar: brand, chain badge, wallet button */
export default function TopBar({ chainId, config, wallet, onConnectClick }) {
  const wrongChain =
    wallet.account && config?.ready && wallet.chainId !== config.chainId;

  return (
    <header className="topbar reveal" style={{ "--delay": "0ms" }}>
      <div className="topbar__brand">
        <svg className="topbar__mark" viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="9" className="mark__plate" />
          <path
            d="M13 13h14l-1.6 16.2a3 3 0 0 1-3 2.8h-4.8a3 3 0 0 1-3-2.8L13 13Z"
            className="mark__jar"
          />
          <rect x="11.4" y="10" width="17.2" height="4.4" rx="2.2" className="mark__lid" />
          <circle cx="20" cy="23" r="4.4" className="mark__coin" />
          <text x="20" y="26.4" textAnchor="middle" className="mark__sym">
            ξ
          </text>
        </svg>
        <div>
          <h1 className="topbar__title">Tip Jar</h1>
          <p className="topbar__tag">an on-chain gratitude machine</p>
        </div>
      </div>

      <div className="topbar__right">
        <span className="pill pill--chain" title="Connected network">
          <span className="pill__dot" />
          {config?.ready ? `hardhat · ${chainId ?? config.chainId}` : "chain offline"}
        </span>

        {wallet.account ? (
          <div className="wallet-chip">
            <span className="wallet-chip__addr" title={wallet.account}>
              {shortAddr(wallet.account)}
            </span>
          </div>
        ) : null}

        {wrongChain ? (
          <button
            type="button"
            className="btn btn--stamp"
            onClick={() => wallet.switchChain({ chainId: config.chainId, rpcUrl: config.rpcUrl })}
          >
            switch network
          </button>
        ) : null}

        {!wallet.account ? (
          <button
            type="button"
            className="btn btn--gold"
            onClick={onConnectClick}
            disabled={wallet.connecting}
          >
            {wallet.connecting ? "connecting…" : wallet.hasWallet ? "connect wallet" : "no wallet"}
          </button>
        ) : null}
      </div>
    </header>
  );
}
