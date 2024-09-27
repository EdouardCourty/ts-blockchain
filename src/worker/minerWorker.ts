import { parentPort, workerData } from 'worker_threads';

import BlockchainPersister from "../service/BlockchainPersister";

const { blockchainData, difficulty, reward, miningRewardAddress } = workerData;

// TODO: Refactor this so only the block to be mined is passed to the worker instead of the whole chain
const blockchain = BlockchainPersister.parseBlockchain(blockchainData, difficulty, reward);
const newBlock = blockchain.minePendingTransactions(miningRewardAddress);

parentPort?.postMessage({
    blockData: JSON.stringify(newBlock)
});
