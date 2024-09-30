import Transaction from "../../src/model/Transaction";

class TestTransactionProvider {
    public static getTransaction(from: string, to: string, amount: number, signature: string|null = null): Transaction {
        const newTransaction = new Transaction(from, to, amount, 'REGULAR', new Date().toISOString());
        newTransaction.signature = signature || 'signature_' + newTransaction.calculateHash();

        return newTransaction;
    }

    public static getRewardTransaction(to: string, amount: number): Transaction {
        const rewardTransaction = new Transaction(null, to, amount, 'REWARD', new Date().toISOString());
        rewardTransaction.signature = '';

        return rewardTransaction;
    }
}

export default TestTransactionProvider;
