import Blockchain from "../../src/model/Blockchain";
import Transaction from "../../src/model/Transaction";
import Block from "../../src/model/Block";

class TestBlockProvider {
    public static getBlockWithBalance(blockchain: Blockchain, address: string, balance: number): Block {
        const transaction = new Transaction(null, address, balance, 'REWARD');

        const block = new Block(1, new Date().toISOString(), [transaction], blockchain.getLatestBlock().hash);
        block.mineBlock(blockchain.difficulty);

        return block;
    }
}

export default TestBlockProvider;
