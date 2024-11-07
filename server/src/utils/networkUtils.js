// for broadcasting to other nodes
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PEER_FILE = path.join(__dirname, '../localdb/peernodes.json');

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


// Ping the node to check if it's alive and functional
export const pingNodeUtil = async (ip, port) => {
    try {
        const response = await axios.get(`http://${ip}:${port}/blockchain/ping`);
        return response.status === 200;
    } catch (error) {
        console.error(`Failed to ping node ${ip}:${port}: ${error.message}`);
        return false;
    }
};

// Utility function to broadcast a transaction to all peers
export const broadcastTransaction = async (transaction) => {
    const peers = loadPeerNodes(); // Load the list of peer nodes
    const promises = []; // Array to hold the promises for broadcasting

    // Iterate through each peer and send the broadcast request
    for (const peer of peers) {
        const { ip, port } = peer;
        const url = `http://${ip}:${port}/recieve/txn`;

        // Create a promise for the request
        const promise = axios.post(url, transaction)
            .then(response => {
                console.log(`Transaction broadcasted to ${ip}:${port} successfully`, response.data);
            })
            .catch(error => {
                console.error(`Failed to broadcast transaction to ${ip}:${port}`, error.message);
            });

        // Push the promise to the array
        promises.push(promise);
    }

    // Wait for all broadcasts to complete
    await Promise.all(promises);
};

// Function to broadcast the mined block to all peer nodes
export const broadcastBlock = async (block) => {
    // Load peer nodes from the local storage
    const peerNodes = loadPeerNodes();

    // Iterate through all peer nodes and send a POST request to /broadcast/block
    const broadcastPromises = peerNodes.map(async (node) => {
        try {
            // Send the POST request to the /broadcast/block endpoint of each node
            await axios.post(`http://${node.ip}:${node.port}/node/recieve/block`, block);
            console.log(`Successfully broadcasted block to node ${node.ip}:${node.port}`);
        } catch (error) {
            console.error(`Failed to broadcast block to node ${node.ip}:${node.port}: ${error.message}`);
        }
    });

    // Wait for all broadcast operations to complete
    await Promise.all(broadcastPromises);
};

// Function to broadcast updated peer data
export const syncPeerDataWithOtherNodes = async (peerNodes) => {
    for (const node of peerNodes) {
        try {
            await axios.post(`http://${node.ip}:${node.port}/node/sync/peers`, {
                peerNodes
            });
        } catch (error) {
            console.error(`Failed to sync with node ${node.ip}:${node.port}: ${error.message}`);
        }
    }
};