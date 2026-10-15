// Minimal human-readable ABI for the Tip contract, used by the API server.
// The frontend receives this same ABI through GET /api/config.
export const TIP_ABI = [
  "function tip() payable",
  "function withdraw()",
  "function owner() view returns (address)",
  "function getTipCount() view returns (uint256)",
  "function getTotalTips() view returns (uint256)",
  "function getUserTipCount(address user) view returns (uint256)",
  "function getTips() view returns (address[] fromAddresses, uint256[] amounts, uint256[] timestamps)",
  "event Tipped(address indexed from, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed to, uint256 amount)",
];
