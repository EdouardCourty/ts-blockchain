#!/usr/bin/env ts-node
import { Command } from 'commander';
import WalletService from '../service/WalletService';
import Transaction from '../model/Transaction';

const program = new Command();

// Generate a new wallet (public/private key pair)
program
    .command('generate-wallet')
    .description('Generate a new wallet and output the public and private keys')
    .action(() => {
        const { privateKey, publicKey } = WalletService.generateKeys();

        // Output the wallet details to the console
        console.log('Wallet created successfully!');
        console.log('Private Key (store securely):', privateKey); // Do not expose this!
        console.log('Public Key (Wallet Address):', publicKey);
    });

// Sign a transaction (only require privateKey; derive publicKey automatically)
program
    .command('sign-transaction')
    .description('Sign a transaction using your private key')
    .requiredOption('-p, --privateKey <privateKey>', 'Your private key')
    .requiredOption('-t, --to <toAddress>', 'Recipient address')
    .requiredOption('-a, --amount <amount>', 'Amount to send')
    .action((options) => {
        const { privateKey, to, amount } = options;

        // Derive public key from private key
        const publicKey = WalletService.getPublicKeyFromPrivateKey(privateKey);

        // Create and sign the transaction
        const transaction = new Transaction(publicKey, to, Number(amount));
        const signature = WalletService.signTransaction(privateKey, transaction);
        transaction.signature = signature;

        // Prepare the signed transaction payload
        const signedTransaction = {
            fromAddress: publicKey, // Sender's public key (fromAddress)
            toAddress: transaction.toAddress,
            amount: transaction.amount,
            signature: transaction.signature,
        };

        console.log(signedTransaction, JSON.stringify(signedTransaction));
    });

program.parse(process.argv);
