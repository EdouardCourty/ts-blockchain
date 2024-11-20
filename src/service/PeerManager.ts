import * as fs from 'fs';
import * as path from 'path';

import * as config from '../../configuration.json';

import Logger from "./Logger";
import httpClient from "./HttpClient";
import Block from "../model/Block";
import Transaction from "../model/Transaction";
import Blockchain from "../model/Blockchain";

class PeerManager {
    private static instance: PeerManager;

    private peers: string[];
    private readonly peersFilePath: string;

    constructor() {
        this.peersFilePath = config.persistence.peersFile;
        this.peers = this.loadPeers(); // Load peers when instantiated
    }

    // Singleton pattern: Get the single instance of the PeerManager
    public static getInstance(): PeerManager {
        if (!PeerManager.instance) {
            PeerManager.instance = new PeerManager();
        }
        return PeerManager.instance;
    }

    // Load peers from the JSON file
    private loadPeers(): string[] {
        if (fs.existsSync(this.peersFilePath)) {
            const rawData = fs.readFileSync(this.peersFilePath, 'utf8');
            return JSON.parse(rawData);
        } else {
            return [];
        }
    }

    // Save peers to the JSON file
    private savePeers(): void {
        const peerData = JSON.stringify(this.peers, null, 4);
        const dir = path.dirname(this.peersFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.peersFilePath, peerData, 'utf8');
    }

    // Add a peer and update the list in memory and on disk
    public addPeer(peerUrl: string): boolean {
        if (!this.peers.includes(peerUrl)) {
            this.peers.push(peerUrl);
            this.savePeers();  // Save peers to file after adding
            Logger.info(`Peer added: ${peerUrl}`);
            return true;
        }
        Logger.info(`Peer already exists: ${peerUrl}`);
        return false;
    }

    // Remove a peer and update the list in memory and on disk
    public removePeer(peerUrl: string): boolean {
        if (this.peers.includes(peerUrl)) {
            this.peers = this.peers.filter((peer) => peer !== peerUrl);
            this.savePeers();  // Save peers to file after removal
            Logger.info(`Peer removed: ${peerUrl}`);
            return true;
        }
        Logger.info(`Peer not found: ${peerUrl}`);
        return false;
    }

    // Get the list of peers
    public getPeers(): string[] {
        return this.peers;
    }

    // Broadcast a new block to all peers
    public async broadcastNewBlock(block: Block): Promise<void> {
        for (const peerUrl of this.peers) {
            try {
                await httpClient.post(`${peerUrl}/blocks`, block.toJSON());
                Logger.info(`Successfully broadcasted block to peer: ${peerUrl}`);
            } catch (error: any) {
                Logger.error(`Error broadcasting block to peer ${peerUrl}: ${error.message} - ${JSON.stringify(error.response?.data)}`);
            }
        }
    }

    // Broadcast a new transaction to all peers
    public async broadcastNewTransaction(transaction: Transaction): Promise<void> {
        for (const peerUrl of this.peers) {
            try {
                await httpClient.post(`${peerUrl}/transactions`, {
                    ...transaction.toJSON(),
                    isBroadcast: true
                });
                Logger.info(`Successfully broadcasted transaction to peer: ${peerUrl}`);
            } catch (error: any) {
                Logger.error(`Error broadcasting transaction to peer ${peerUrl}: ${error.message} - ${JSON.stringify(error.response?.data)}`);
            }
        }
    }

    // Fetch the blockchain from a peer
    async fetchBlockchain(peerUrl: string): Promise<Blockchain|null> {
        try {
            const response = await httpClient.get(`${peerUrl}/blockchain`);
            return Blockchain.fromJSON(response.data);
        } catch (error: any) {
            Logger.error(`Failed to fetch blockchain from peer ${peerUrl}: ${error.message}`);
            return null;
        }
    }

    // Fetch all peer blockchains
    async fetchAllPeerBlockchains(): Promise<Blockchain[]> {
        const peers = this.loadPeers();
        const blockchains = await Promise.all(peers.map(peer => this.fetchBlockchain(peer)));

        return blockchains.filter(blockchain => blockchain !== null);  // Filter out null responses
    }
}

export default PeerManager;
