import { ec as EC } from 'elliptic';
import * as crypto from 'crypto';
import Transaction from '../model/Transaction';

const ec = new EC('secp256k1');

class WalletService {
    // Generate a public/private key pair
    static generateKeys(): { privateKey: string; publicKey: string } {
        const keyPair = ec.genKeyPair();
        const privateKey = keyPair.getPrivate('hex');
        const publicKey = keyPair.getPublic('hex');

        return { privateKey, publicKey };
    }

    // Derive public key from private key
    static getPublicKeyFromPrivateKey(privateKey: string): string {
        const keyPair = ec.keyFromPrivate(privateKey);
        return keyPair.getPublic('hex');
    }

    // Sign a transaction using the private key
    static signTransaction(privateKey: string, transaction: Transaction): string {
        const key = ec.keyFromPrivate(privateKey);
        const hash = transaction.calculateHash();

        const signature = key.sign(hash);

        return signature.toDER('hex');
    }

    // Helper function to hash a message
    static hashMessage(message: string): string {
        return crypto.createHash('sha256').update(message).digest('hex');
    }

    // Verify a transaction using the public key and signature
    static verifySignature(transaction: Transaction, publicKey: string, signature: string): boolean {
        const key = ec.keyFromPublic(publicKey, 'hex');
        const hash = transaction.calculateHash();

        return key.verify(hash, signature);
    }
}

export default WalletService;
