import fs from 'fs';
import path from 'path';

const PEER_FILE = path.join(__dirname, '../localdb/peernodes.json');
const UTXO_FILE = path.join(__dirname, '../localdb/utxo.json');

// Helper function to ensure file exists
function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2)); // Create an empty JSON array
    }
}

// Load peer nodes from JSON file 
export function loadPeerNodes() {
    ensureFileExists(PEER_FILE); // Ensure the file exists before loading
    try {
        return JSON.parse(fs.readFileSync(PEER_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading peer nodes:', error.message);
        return [];
    }
}

// Save peer nodes to JSON file
export function savePeerNodes(peers) {
    ensureFileExists(PEER_FILE); // Ensure the file exists before saving
    try {
        fs.writeFileSync(PEER_FILE, JSON.stringify(peers, null, 2));
    } catch (error) {
        console.error('Error saving peer nodes:', error.message);
    }
}

// Merge peer node lists (avoid duplicates)
export function mergePeerNodes(localPeers, newPeers) {
    const mergedPeers = [...localPeers];
    newPeers.forEach(newPeer => {
        const exists = localPeers.some(localPeer => localPeer.ip === newPeer.ip && localPeer.port === newPeer.port);
        if (!exists) {
            mergedPeers.push(newPeer);
        }
    });
    return mergedPeers;
}

export function loadBlockchain() {
    //
}

export function saveBlockchain(blockchain) {
    // remove existing make new
}
