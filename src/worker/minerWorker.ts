import { parentPort, workerData } from 'worker_threads';
import Block from '../model/Block';
import Miner from '../service/Miner';

const { blockData, difficulty, startNonce, step } = workerData;

const block = Block.fromJSON(blockData);
const minedBlock = Miner.mineBlock(block, difficulty, step, startNonce)

parentPort?.postMessage({
    blockData: minedBlock.toJSON(),
});
