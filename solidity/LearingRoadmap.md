# Solidity Learning Roadmap

## Basics

- Contract structure, pragma, and SPDX license
- Data types: `uint`, `int`, `bool`, `address`, `bytes`, `string`
- State, local, and global variables (`msg.sender`, `msg.value`, `block.timestamp`)
- Constants and immutables
- Functions: parameters, return values, named returns
- Visibility: `public`, `private`, `internal`, `external`
- State mutability: `view`, `pure`, `payable`
- Control flow: `if/else`, `for`, `while`
- Arrays: fixed, dynamic, `push`, `pop`
- Mappings and nested mappings
- Structs and enums
- Data locations: `storage`, `memory`, `calldata`
- Constructors
- Events and `emit`
- Errors: `require`, `revert`, `assert`, custom errors
- Modifiers
- Sending ETH: `transfer`, `send`, `call`
- `receive` and `fallback` functions

## Intermediate

- Inheritance, `virtual` and `override`, multiple inheritance
- Abstract contracts and interfaces
- Libraries and `using for`
- Imports and project structure
- ERC-20 and ERC-721 (and ERC-1155)
- OpenZeppelin: `Ownable`, `AccessControl`, `Pausable`, `ReentrancyGuard`
- `try/catch` and low-level calls (`call`, `staticcall`)
- ABI encoding: `abi.encode`, `abi.encodePacked`, `abi.decode`
- Hashing and signatures: `keccak256`, `ecrecover`, `EIP-712`
- Merkle proofs
- User-defined value types and file-level functions
- Time-based logic and deadlines
- Chainlink price feeds and VRF
- Foundry basics: `forge test`, cheatcodes, `vm.prank`, `vm.expectRevert`
- Fuzz testing
- Deploying scripts, the Sepolia testnet, Etherscan verification

## Advanced

- Storage layout and slot packing
- `delegatecall`
- Proxy patterns: Transparent, UUPS, Beacon, Diamond (ERC-2535)
- Initializers and storage gaps
- Inline assembly and Yul
- Gas optimization: `unchecked`, `calldata`, caching storage reads, custom errors
- Transient storage (`tstore` and `tload`)
- `CREATE` and `CREATE2`, minimal proxies (clones, ERC-1167)
- ERC-4626 vaults
- ERC-2612 permit, meta-transactions, ERC-4337 account abstraction
- EIP-7702 delegated accounts
- Invariant testing, fork testing, formal verification basics
- Security bugs: reentrancy (including cross-function and read-only), access control, integer rounding, oracle manipulation, front-running and MEV, signature replay, flash-loan attacks, storage collisions
- Protocol internals: Uniswap V2 and V3, Aave, Compound
- Governance: Governor and timelock
- Cross-chain messaging basics
- Static analysis with Slither, fuzzing with Echidna
- Reading audit reports and competing in audit contests