import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

/**
 * MetaMask-style wallet state:
 *  - silent eager reconnect (no popup on load)
 *  - account/chain change listeners
 *  - network switching helpers for the local Hardhat chain
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const hasWallet = typeof window !== "undefined" && Boolean(window.ethereum);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return undefined;

    const onAccounts = (accounts) => setAccount(accounts[0] ?? null);
    const onChain = (id) => setChainId(Number.parseInt(id, 16));

    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);

    eth
      .request({ method: "eth_accounts" })
      .then((accounts) => setAccount(accounts[0] ?? null))
      .catch(() => {});
    eth
      .request({ method: "eth_chainId" })
      .then((id) => setChainId(Number.parseInt(id, 16)))
      .catch(() => {});

    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet found — install MetaMask to tip.");
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0] ?? null);
      const id = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(Number.parseInt(id, 16));
    } catch (err) {
      setError(err?.message ?? "Wallet connection was rejected.");
    } finally {
      setConnecting(false);
    }
  }, []);

  /** Switch the wallet to the given chain, adding it if the wallet doesn't know it */
  const switchChain = useCallback(async (target) => {
    if (!window.ethereum) return;
    const hexId = `0x${Number(target.chainId).toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexId }],
      });
    } catch (err) {
      //4902 = chain unknown to the wallet -> register it
      if (err?.code === 4902 || err?.data?.originalError?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexId,
              chainName: `Hardhat Local (${target.chainId})`,
              rpcUrls: [target.rpcUrl],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw err;
      }
    }
  }, []);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet found.");
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  }, []);

  return {
    account,
    chainId,
    connecting,
    error,
    hasWallet,
    connect,
    switchChain,
    getSigner,
  };
}
