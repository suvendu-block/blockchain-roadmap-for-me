import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const { ethers } = await network.create();

const factory = await ethers.getContractFactory("Tip");
const tipJar = await factory.deploy();
const deploymentTx = tipJar.deploymentTransaction();
if (deploymentTx) {
  await deploymentTx.wait();
}

const address = await tipJar.getAddress();
const networkInfo = await ethers.provider.getNetwork();
const abi = JSON.parse(factory.interface.formatJson());

const deployment = {
  contract: "Tip",
  address,
  chainId: Number(networkInfo.chainId),
  deployedAt: new Date().toISOString(),
  abi,
};

const deploymentsDir = path.join(process.cwd(), "deployments");
await mkdir(deploymentsDir, { recursive: true });
const outFile = path.join(deploymentsDir, `${deployment.chainId}.json`);
await writeFile(outFile, JSON.stringify(deployment, null, 2), "utf8");

console.log(`Tip deployed to ${address} (chainId ${deployment.chainId})`);
console.log(`Deployment saved to ${outFile}`);
