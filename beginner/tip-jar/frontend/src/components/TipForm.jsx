import { useState } from "react";
import { parseEther } from "ethers";
import { fmtEth, shortAddr } from "../lib/format.js";

const PRESETS = ["0.01", "0.05", "0.1", "0.25"];

/** The tip form: amount + name + message -> on-chain tx -> API metadata */
export default function TipForm({
  wallet,
  config,
  stats,
  busy,
  onTip,
  onConnect,
}) {
  const [preset, setPreset] = useState("0.05");
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const amount = custom !== "" ? custom : preset;
  const amountValid = /^\d*\.?\d+$/.test(amount) && Number(amount) > 0;
  const wrongChain =
    wallet.account && config?.ready && wallet.chainId !== config.chainId;
  const isOwner =
    stats?.onChain?.owner &&
    wallet.account &&
    stats.onChain.owner === wallet.account.toLowerCase();

  const submit = (e) => {
    e.preventDefault();
    if (!wallet.account) return onConnect();
    if (wrongChain)
      return wallet.switchChain({ chainId: config.chainId, rpcUrl: config.rpcUrl });
    if (!amountValid) return;
    onTip({ amount, name, message });
  };

  const buttonLabel = () => {
    if (!wallet.account) return wallet.hasWallet ? "connect wallet first" : "install metamask";
    if (wrongChain) return "switch to hardhat network";
    if (busy) return "dropping the tip…";
    if (!amountValid) return "enter an amount";
    return `drop ${amount} ETH in the jar`;
  };

  return (
    <form className="tipform reveal" style={{ "--delay": "160ms" }} onSubmit={submit}>
      <div className="tipform__head">
        <h2>Leave a tip</h2>
        <p className="tipform__sub">
          ETH goes straight into the <strong>Tip</strong> contract; your name &amp; note are filed
          in the ledger by the API.
        </p>
      </div>

      <fieldset className="tipform__amount">
        <legend>amount</legend>
        <div className="chips">
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${custom === "" && preset === value ? "chip--on" : ""}`}
              onClick={() => {
                setPreset(value);
                setCustom("");
              }}
            >
              {value}
            </button>
          ))}
          <label className="chip chip--custom">
            <input
              type="text"
              inputMode="decimal"
              placeholder="custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))}
              aria-label="Custom tip amount in ETH"
            />
            <span>ETH</span>
          </label>
        </div>
      </fieldset>

      <label className="field">
        <span className="field__label">sign the ledger as</span>
        <input
          type="text"
          maxLength={40}
          placeholder="Anonymous"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">
          note <em className="field__count">{280 - message.length}</em>
        </span>
        <textarea
          rows={3}
          maxLength={280}
          placeholder="say something nice (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <button
        type="submit"
        className="btn btn--big"
        disabled={busy || (wallet.account && (!config?.ready || !amountValid))}
      >
        {buttonLabel()}
      </button>

      {wallet.account ? (
        <p className="tipform__wallet">
          tipping as <span>{shortAddr(wallet.account)}</span>
          {stats?.onChain ? (
            <>
              {" · jar holds "}
              <span>{fmtEth(stats.onChain.totalWei)} ETH</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="tipform__wallet">
          every account on the local Hardhat node starts with 10,000 ETH — gas is free here.
        </p>
      )}
    </form>
  );
}
