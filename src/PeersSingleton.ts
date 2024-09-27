import PeerManager from './service/PeerManager';

import * as config from '../configuration.json';
import Logger from "./service/Logger";
import Block from "./model/Block";

class PeersSingleton {
    private static instance: string[];
    private static peerManager = new PeerManager(config.peersFile);

    static getInstance(): string[] {
        if (!this.instance) {
            this.instance = this.peerManager.loadPeers();
        }

        return this.instance;
    }

    // Add a peer and update the list in memory and on disk
    static addPeer(peerUrl: string): boolean {
        const peers = this.getInstance();

        if (!peers.includes(peerUrl)) {
            peers.push(peerUrl);

            this.peerManager.savePeers(peers);
            this.instance = peers;
            return true;
        }

        return false;
    }

    // Remove a peer and update the list in memory and on disk
    static removePeer(peerUrl: string): boolean {
        let peers = PeersSingleton.getInstance();

        if (peers.includes(peerUrl)) {
            peers = peers.filter((peer) => peer !== peerUrl);

            this.peerManager.savePeers(peers);
            this.instance = peers;
            return true;
        }

        return false;
    }

    // Get the list of peers
    static getPeers(): string[] {
        return this.getInstance();
    }

    // Broadcast a new block to all peers
    static async broadcastNewBlock(block: Block): Promise<void> {
        const peers = this.getPeers();

        for (const peerUrl of peers) {
            try {
                await this.peerManager.broadcastNewBlock(block); // Delegate to PeerManager
                Logger.info(`Successfully broadcasted block to peer: ${peerUrl}`);
            } catch (error: Error | any) {
                console.error(`Error broadcasting block to peer ${peerUrl}:`, error.message);
            }
        }
    }
}

export default PeersSingleton;
