import { parentPort, workerData } from 'worker_threads';

import Block from "../model/Block";

const { blockData, difficulty } = workerData;

const block = Block.fromJSON(blockData);
block.mineBlock(difficulty);

parentPort?.postMessage({
    blockData: JSON.stringify(block)
});
