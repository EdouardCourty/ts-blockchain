import Blockchain from "../../src/model/Blockchain";
import Block from "../../src/model/Block";
// @ts-ignore
import TestTransactionProvider from "./TestTransactionProvider";
import Miner from "../../src/service/Miner";

class TestBlockProvider {
    public static getBlockWithBalance(blockchain: Blockchain, address: string, balance: number): Block {
        const transaction = TestTransactionProvider.getRewardTransaction(address, balance);

        const block = new Block(blockchain.getLatestBlock().index + 1, new Date().toISOString(), [transaction], blockchain.getLatestBlock().hash);
        return Miner.mineBlock(block, blockchain.difficulty);
    }

    public static getEmptyBlock(previousBlock: Block|null = null, difficulty: number|null = null): Block {
        const block = new Block(
            previousBlock !== null ? previousBlock.index + 1 : 1,
            new Date().toISOString(),
            [],
            previousBlock ? previousBlock.hash : ''
        );

        return Miner.mineBlock(block, difficulty || 1);
    }
}

export default TestBlockProvider;
