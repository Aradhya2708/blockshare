// Logic for handling blockchain-related requests

import axios from 'axios';

import { loadPeerNodes, savePeerNodes } from '../utils/fileUtils.js';
import { verifySignature, verifyNonce, addToMempool, updateState, loadBlockchainState, isMempoolFull, mineBlock, clearMempool } from '../utils/cryptoUtils.js';
import { pingNode } from './nodeController.js';
import { broadcastTransaction, broadcastBlock } from '../utils/networkUtils.js';

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
            await axios.post(`http://${node.ip}:${node.port}/node/sync/peers`, {
                peerNodes
            });
        } catch (error) {
            console.error(`Failed to sync with node ${node.ip}:${node.port}: ${error.message}`);
        }
    }
};

// Submit a transaction
export const submitTxn = async (req, res) => {
    const { sender, recipient, amt, nonce, sign } = req.body;

    if (!sender || !recipient || !amt || !nonce || !sign) {
        return res.status(400).json({ error: 'All fields (sender, recipient, amt, nonce, sign) are required' });
    }

    // 1. Verify the signature
    const isSignatureValid = verifySignature(sender, recipient, amt, nonce, sign);
    if (!isSignatureValid) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // 2. Verify the nonce (to prevent replay attacks)
    const isNonceValid = verifyNonce(sender, nonce);
    if (!isNonceValid) {
        return res.status(400).json({ error: 'Invalid nonce' });
    }

    // 3. Broadcast the transaction to peers
    const transaction = { sender, recipient, amt, nonce, sign };
    broadcastTransaction(transaction);

    // 4. Add transaction to the mempool
    const addedToMempool = addToMempool(transaction);
    if (!addedToMempool) {
        return res.status(500).json({ error: 'Failed to add transaction to mempool' });
    }

    // 5. Update the state (i.e., update the account balances)
    const stateUpdateResult = updateState(transaction);
    if (!stateUpdateResult.success) {
        return res.status(500).json({ error: 'Failed to update blockchain state' });
    }

    if (isMempoolFull()) {
        // mine
        const minedBlock = mineBlock();

        // broadcast block
        broadcastBlock(minedBlock);

        // clear mempool
        clearMempool();
    }

    res.status(200).json({
        message: 'Transaction submitted successfully',
        transaction
    });
};

// Controller to check balance by address
export const checkBalanceByAdd = (req, res) => {
    const { address } = req.params;

    // Load the blockchain state
    const state = loadBlockchainState();

    // Check if the address exists in the state
    const account = state[address];
    if (!account) {
        return res.status(404).json({ error: 'Address not found in blockchain state' });
    }

    // Return the balance of the address
    res.status(200).json({
        address,
        balance: account.balance
    });
};

// Controller to get the entire blockchain state
export const getState = (req, res) => {
    // Load the entire blockchain state
    const state = loadBlockchainState();

    // Return the state
    res.status(200).json({
        state
    });
};