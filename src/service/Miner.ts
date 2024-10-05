import Block from '../model/Block';
import Logger from './Logger';

class Miner {
    static mineBlock(block: Block, difficulty: number, startNonce: number = 0, step: number = 1): Block {
        block.nonce = startNonce;
        const target = Array(difficulty + 1).join('0');

        while (block.hash.substring(0, difficulty) !== target) {
            block.nonce += step;
            block.hash = block.calculateHash();
        }

        Logger.info(`Block mined with nonce ${block.nonce} and hash ${block.hash}.`);
        return block;
    }
}

export default Miner;
