// for broadcasting to other nodes
import axios from 'axios';
import { loadPeerNodes } from './fileUtils.js';

// Ping the node to check if it's alive and functional
export const pingNode = async (ip, port) => {
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
        const url = `http://${ip}:${port}/broadcast/txn`;

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
            await axios.post(`http://${node.ip}:${node.port}/node/broadcast/block`, block);
            console.log(`Successfully broadcasted block to node ${node.ip}:${node.port}`);
        } catch (error) {
            console.error(`Failed to broadcast block to node ${node.ip}:${node.port}: ${error.message}`);
        }
    });

    // Wait for all broadcast operations to complete
    await Promise.all(broadcastPromises);
};