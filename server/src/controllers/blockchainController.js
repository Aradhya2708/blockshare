// Logic for handling blockchain-related requests

// adding users to blockshare:
/*
- user generate public-private key pair
- user send request to known node for IP and Port of healthy nodes
- user randomly request node to join 
axios.post
{
    "username":"",
    "public_key":""
}
@ http://<node-ip>:<node-port>/blockchain/register
? how to make sure valid?

- node approves/rejects request (manually/automatically?)
- node responds to newUser
- node adds newUser to utxo.json
- node syncs with other nodes
*/

import axios from 'axios';

import { loadPeerNodes, savePeerNodes, loadUTXO, saveUTXO } from '../utils/fileUtils.js';
import { pingNode } from './nodeController.js';

// Function to validate new user request
function validateUserRequest(req) {
    const { username, public_key } = req.body;
    if (!username || !public_key) {
        return false;
    }
    // Additional validation logic (e.g., format checks) can go here
    return true;
}

// Controller to handle user registration
export const registerUser = async (req, res) => {
    const isValidRequest = validateUserRequest(req);

    if (!isValidRequest) {
        return res.status(400).json({ message: 'Invalid registration request' });
    }

    const { username, public_key } = req.body;

    // Load UTXO database
    const utxoDB = loadUTXO();

    // Check if user is already registered
    const userExists = utxoDB.some((entry) => entry.public_key === public_key);
    if (userExists) {
        return res.status(400).json({ message: 'User already registered' });
    }

    // Add new user to UTXO database with 0 coins
    const newUser = {
        username,
        public_key,
        balance: 0,
    };
    utxoDB.push(newUser);

    // Save the updated UTXO database
    saveUTXO(utxoDB);

    // Broadcast the updated UTXO to other nodes
    await syncUTXOWithOtherNodes(utxoDB);

    return res.status(200).json({
        message: 'User registered successfully',
        newUser,
    });
};

// Function to sync UTXO database with other nodes
async function syncUTXOWithOtherNodes(utxoDB) {
    const peerNodes = loadPeerNodes(); // Load from peer database

    // Send the updated UTXO database to all peer nodes
    peerNodes.forEach(async (node) => {
        try {
            await axios.post(`http://${node.ip}:${node.port}/node/syncUTXO`, utxoDB);
        } catch (error) {
            console.error(`Failed to sync with node ${node.ip}:${node.port}: ${error.message}`);
        }
    });
}

// Function to validate new node request
function validateNewNode(req) {
    const { ip, port } = req.body;
    if (!ip || !port) {
        return false;
    }
    // Additional validation logic (e.g., IP format checks, port range checks) can go here
    return true;
}

// Function to handle new node registration
export const registerNode = async (req, res) => {
    const isValidRequest = validateNewNode(req);

    if (!isValidRequest) {
        return res.status(400).json({ message: 'Invalid node registration request' });
    }

    const newNode = req.body;

    const { ip, port } = newNode;

    // Ping the new node to verify that it’s live (? how it will work)
    const isNodeActive = await pingNode(ip, port);

    if (!isNodeActive) {
        return res.status(400).json({ message: 'Node verification failed' });
    }

    // Load peer nodes using utils
    const peerNodes = loadPeerNodes();

    // Check if the node already exists
    const nodeExists = peerNodes.some(node => node.ip === ip && node.port === port);
    if (nodeExists) {
        return res.status(400).json({ message: 'Node already exists' });
    }

    // Add the new node to peer nodes
    peerNodes.push(newNode);
    savePeerNodes(peerNodes);

    // Broadcast peer data to other nodes
    syncPeerDataWithOtherNodes(peerNodes);

    return res.status(200).json({ message: 'Node registered successfully' });
};

// Function to broadcast updated peer data
const syncPeerDataWithOtherNodes = async (peerNodes) => {
    for (const node of peerNodes) {
        try {
            await axios.post(`http://${node.ip}:${node.port}/node/syncPeers`, {
                peerNodes
            });
        } catch (error) {
            console.error(`Failed to sync with node ${node.ip}:${node.port}: ${error.message}`);
        }
    }
};