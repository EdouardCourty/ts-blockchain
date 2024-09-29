import WalletService from '../../src/service/WalletService';
// @ts-ignore
import TestTransactionProvider from "../support/TestTransactionProvider";

describe('WalletService', () => {
    it('should generate a valid key pair', () => {
        const { privateKey, publicKey } = WalletService.generateKeys();

        expect(privateKey).toBeDefined();
        expect(publicKey).toBeDefined();
        expect(privateKey.length).toBeGreaterThan(0);
        expect(publicKey.length).toBeGreaterThan(0);
    });

    it('should derive the correct public key from a private key', () => {
        const { privateKey, publicKey } = WalletService.generateKeys();
        const derivedPublicKey = WalletService.getPublicKeyFromPrivateKey(privateKey);

        expect(derivedPublicKey).toBe(publicKey);
    });

    it('should sign a transaction and generate a valid signature', () => {
        const { privateKey, publicKey } = WalletService.generateKeys();
        const transaction = TestTransactionProvider.getTransaction(publicKey, 'recipientAddress', 100, '')

        // Sign the transaction using the private key
        const signature = WalletService.signTransaction(privateKey, transaction);

        expect(signature).toBeDefined();
        expect(signature.length).toBeGreaterThan(0); // Ensure signature is generated
    });

    it('should verify a valid signature', () => {
        const { privateKey, publicKey } = WalletService.generateKeys();
        const transaction = TestTransactionProvider.getTransaction(publicKey, 'recipientAddress', 100)

        // Sign the transaction using the private key
        const signature = WalletService.signTransaction(privateKey, transaction);

        // Verify the signature using the public key
        const isValid = WalletService.verifySignature(transaction, publicKey, signature);

        expect(isValid).toBe(true); // The signature should be valid
    });

    it('should reject an invalid signature', () => {
        const { privateKey, publicKey } = WalletService.generateKeys();
        const wrongPublicKey = WalletService.generateKeys().publicKey;
        const transaction = TestTransactionProvider.getTransaction(publicKey, 'recipientAddress', 100);

        // Sign the transaction using the private key
        const signature = WalletService.signTransaction(privateKey, transaction);

        // Verify the signature using a wrong public key
        const isValid = WalletService.verifySignature(transaction, wrongPublicKey, signature);

        expect(isValid).toBe(false); // The signature should not be valid with the wrong public key
    });
});
