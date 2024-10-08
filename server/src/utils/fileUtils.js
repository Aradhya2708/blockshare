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

// Load UTXO data from JSON file
export function loadUTXO() {
    ensureFileExists(UTXO_FILE); // Ensure the file exists before loading
    try {
        return JSON.parse(fs.readFileSync(UTXO_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading UTXO data:', error.message);
        return [];
    }
}

// Save UTXO data to JSON file
export function saveUTXO(utxoData) {
    ensureFileExists(UTXO_FILE); // Ensure the file exists before saving
    try {
        fs.writeFileSync(UTXO_FILE, JSON.stringify(utxoData, null, 2));
    } catch (error) {
        console.error('Error saving UTXO data:', error.message);
    }
}

// Function to merge UTXO data (avoid duplicates)
export function mergeUTXO(currentUTXO, incomingUTXO) {
    const mergedUTXO = [...currentUTXO];

    incomingUTXO.forEach(newEntry => {
        const exists = mergedUTXO.some(entry => entry.public_key === newEntry.public_key);
        if (!exists) {
            mergedUTXO.push(newEntry);
        }
    });

    return mergedUTXO;
}
