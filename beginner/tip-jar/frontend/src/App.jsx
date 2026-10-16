import { useCallback, useEffect, useRef, useState } from "react";
import { Contract, parseEther } from "ethers";
import { api } from "./api.js";
import { useWallet } from "./hooks/useWallet.js";
import TopBar from "./components/TopBar.jsx";
import JarCard from "./components/JarCard.jsx";
import TipForm from "./components/TipForm.jsx";
import TipFeed from "./components/TipFeed.jsx";

const POLL_MS = 12_000;

export default function App() {
  const wallet = useWallet();

  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toast, setToast] = useState(null); // { kind: "ok" | "bad", text }
  const [highlightTx, setHighlightTx] = useState(null);
  const [coinKey, setCoinKey] = useState(0);

  const toastTimer = useRef(null);
  const flash = useCallback((kind, text) => {
    clearTimeout(toastTimer.current);
    setToast({ kind, text });
    toastTimer.current = setTimeout(() => setToast(null), 7000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([api.stats(), api.tips(30)]);
      setStats(s);
      setTips(t.tips);
      setApiDown(false);
    } catch {
      setApiDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // boot: config + first data, then poll
  useEffect(() => {
    let alive = true;
    api
      .config()
      .then((c) => alive && setConfig(c))
      .catch(() => alive && setApiDown(true));
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
      clearTimeout(toastTimer.current);
    };
  }, [refresh]);

  const sendTip = useCallback(
    async ({ amount, name, message }) => {
      if (!config?.contractAddress) {
        flash("bad", "No contract address — deploy it and restart the API.");
        return;
      }
      setBusy(true);
      try {
        const signer = await wallet.getSigner();
        const contract = new Contract(config.contractAddress, config.abi, signer);
        const tx = await contract.tip({ value: parseEther(amount) });
        flash("ok", `transaction sent — waiting for the chain…`);
        const receipt = await tx.wait();

        await api.postTip({ txHash: receipt.hash, name, message });
        setHighlightTx(receipt.hash);
        setCoinKey((k) => k + 1);
        flash("ok", `tipped ${amount} ETH — entry stamped in the ledger.`);
        await refresh();
      } catch (err) {
        const reason =
          err?.code === 4001 || err?.code === "ACTION_REJECTED"
            ? "you rejected the transaction in your wallet."
            : err?.reason ?? err?.shortMessage ?? err?.message ?? "something went wrong.";
        flash("bad", reason);
      } finally {
        setBusy(false);
      }
    },
    [config, wallet, refresh, flash]
  );

  const withdraw = useCallback(async () => {
    if (!config?.contractAddress) {
      flash("bad", "No contract address — deploy it and restart the API.");
      return;
    }
    setWithdrawing(true);
    try {
      const signer = await wallet.getSigner();
      const contract = new Contract(config.contractAddress, config.abi, signer);
      const tx = await contract.withdraw();
      await tx.wait();
      setCoinKey(0);
      flash("ok", "the jar has been swept to the owner.");
      await refresh();
    } catch (err) {
      flash("bad", err?.shortMessage ?? err?.message ?? "withdraw failed.");
    } finally {
      setWithdrawing(false);
    }
  }, [config, wallet, refresh, flash]);

  const isOwner =
    stats?.onChain?.owner &&
    wallet.account &&
    stats.onChain.owner === wallet.account.toLowerCase();

  return (
    <div className="sheet">
      <TopBar
        chainId={wallet.chainId}
        config={config}
        wallet={wallet}
        onConnectClick={wallet.connect}
      />

      {apiDown ? (
        <p className="banner banner--bad">
          API unreachable — is the Express server running on port 5000?
        </p>
      ) : null}
      {wallet.error ? <p className="banner banner--bad">{wallet.error}</p> : null}

      <main className="grid">
        <JarCard
          stats={stats}
          owner={stats?.onChain?.owner}
          isOwner={isOwner}
          onWithdraw={withdraw}
          withdrawing={withdrawing}
          coinKey={coinKey}
        />
        <TipForm
          wallet={wallet}
          config={config}
          stats={stats}
          busy={busy}
          onTip={sendTip}
          onConnect={wallet.connect}
        />
        <TipFeed
          tips={tips}
          loading={loading}
          highlightTx={highlightTx}
          onRefresh={refresh}
        />
      </main>

      <footer className="foot reveal" style={{ "--delay": "320ms" }}>
        <p>
          contract <code>{config?.contractAddress ?? "not deployed"}</code>
          {config ? ` · chain ${config.chainId}` : ""}
        </p>
        <p className="foot__made">
          MERN + Solidity · tips settle in the <code>Tip</code> contract, notes live in MongoDB
        </p>
      </footer>

      {toast ? (
        <div className={`toast toast--${toast.kind}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
