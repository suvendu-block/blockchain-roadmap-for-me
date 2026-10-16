// Sends a tip from Hardhat account #1 straight to the deployed contract.
// Handy for demoing the app without MetaMask:
//   node scripts/send-test-tip.js ["0.05"] ["Alice"] ["Great project!"]
import { Contract, JsonRpcProvider, Wallet, parseEther, formatEther } from "ethers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HARDHAT_ACCOUNT_1 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const deployment = JSON.parse(
  await readFile(path.join(root, "deployments", "31337.json"), "utf8")
);

const provider = new JsonRpcProvider("http://127.0.0.1:8545");
const signer = new Wallet(HARDHAT_ACCOUNT_1, provider);
const tipJar = new Contract(deployment.address, deployment.abi, signer);

const amount = parseEther(process.argv[2] ?? "0.05");
const name = process.argv[3] ?? "Hardhat Harry";
const message = process.argv[4] ?? "Sent from the test-tip script";

console.log(`Tipping ${formatEther(amount)} ETH from ${signer.address}...`);
const tx = await tipJar.tip({ value: amount });
const receipt = await tx.wait();

const result = {
  txHash: receipt.hash,
  name,
  message,
  amount: amount.toString(),
  blockNumber: receipt.blockNumber,
};
console.log(JSON.stringify(result, null, 2));

// Attach the name/message to the tip through the API, like the frontend does
const res = await fetch("http://localhost:5000/api/tips", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ txHash: receipt.hash, name, message }),
});
console.log("API response:", res.status, await res.json());
