import Blockchain from "../../src/model/Blockchain";
import Block from "../../src/model/Block";
// @ts-ignore
import TestTransactionProvider from "./TestTransactionProvider";

class TestBlockProvider {
    public static getBlockWithBalance(blockchain: Blockchain, address: string, balance: number): Block {
        const transaction = TestTransactionProvider.getRewardTransaction(address, balance);

        const block = new Block(1, new Date().toISOString(), [transaction], blockchain.getLatestBlock().hash);
        block.mineBlock(blockchain.difficulty);

        return block;
    }
}

export default TestBlockProvider;
