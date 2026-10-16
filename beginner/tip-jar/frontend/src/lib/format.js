import { formatEther } from "ethers";

/** Format a wei string as a friendly ETH amount, e.g. 50000000000000000 -> "0.05" */
export function fmtEth(wei, digits = 4) {
  try {
    const value = Number(formatEther(BigInt(wei)));
    return value.toLocaleString("en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    });
  } catch {
    return "?";
  }
}

/** 0xf39F...2266 */
export function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function when(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " +
    d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Milestone ladder the jar fills toward, in ETH */
export const MILESTONES = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10].map((eth) =>
  (BigInt(Math.round(eth * 100)) * 10n ** 16n).toString()
);

/** Returns { next, pct } describing how full the jar is toward its next stamp */
export function jarProgress(balanceWei) {
  const balance = BigInt(balanceWei ?? "0");
  let next = MILESTONES.map(BigInt).find((m) => balance < m);
  if (next === undefined) {
    // beyond the ladder: keep growing by 50%
    next = balance + balance / 2n;
    if (next === 0n) next = 10n ** 16n;
  }
  const pct = Number((balance * 10000n) / next) / 10000;
  return { next: next.toString(), pct };
}
