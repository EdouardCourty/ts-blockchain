# TypeScript Blockchain

[![CI Pipeline](https://github.com/EdouardCourty/ts-blockchain/actions/workflows/main.yml/badge.svg)](https://github.com/EdouardCourty/ts-blockchain/actions/workflows/main.yml)

This is a simple blockchain implementation in TypeScript.

## Installation

```shell
git clone git@github.com:EdoardCourty/ts-blockchain
cd ts-blockchain
yarn
yarn start
```

## Features

- Persistence
  - Blockchain history persistence (JSON file)
  - Peers persistence (JSON file)
- Peers
  - Add / Delete / List peers
  - Broadcast new blocks to known peers
  - Synchronise current blockchain state with known peers
  - Accept longest chain as valid when synchronising
- Transactions
  - Only signed transactions can be pushed and mined on the blockchain
  - Regular / Reward transactions
- Wallets (CLI)
  - Generate
  - Sign transaction
- Balance
  - Get balance of an address
- Mining
  - Proof of Work (Multi-threaded worker threads to ensure non-blocking workflow)
  - Rewarding

### To do

- Secure the synchronisation
- Implement a proper P2P networking layer
- Implement a proper consensus algorithm (currently longest chain wins, even if it is not the most recent one, or has a different history than the other peers's ones)

## Contributing

Feel free to contribute to this project by opening issues or pull requests. <br />
Please make sure the CI passes and that you've added unit tests covering your changes.

&copy; Edouard Courty, 2024
