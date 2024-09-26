import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import Logger from "./Logger";

class PeerManager {
    private readonly peersFilePath: string;

    constructor(peersFilePath: string) {
        this.peersFilePath = peersFilePath;
    }

    // Load peers from the JSON file
    loadPeers(): string[] {
        if (fs.existsSync(this.peersFilePath)) {
            const rawData = fs.readFileSync(this.peersFilePath, 'utf8');
            return JSON.parse(rawData);
        } else {
            return [];
        }
    }

    // Save peers to the JSON file
    savePeers(peers: string[]): void {
        const peerData = JSON.stringify(peers, null, 4);
        const dir = path.dirname(this.peersFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.peersFilePath, peerData, 'utf8');
    }

    // Broadcast a new block to all peers
    async broadcastNewBlock(block: any): Promise<void> {
        const peers = this.loadPeers(); // Load peers from the file
        for (const peerUrl of peers) {
            try {
                await axios.post(`${peerUrl}/blockchain/new-block`, { block });
                Logger.info(`Successfully notified peer: ${peerUrl}`);
            } catch (error: any) {
                Logger.error(`Error notifying peer ${peerUrl}:`, error.message);
            }
        }
    }
}

export default PeerManager;
