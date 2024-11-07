import axios from 'axios';

import { verifySignature, verifyNonce, mineBlock, verifyBlock, executeBlock } from '../utils/cryptoUtils.js';
import { broadcastBlock, mergePeerNodes, savePeerNodes, loadPeerNodes } from '../utils/networkUtils.js';
import { addToMempool, isMempoolFull, clearMempool, executeMempool } from '../utils/mempoolUtils.js';
import { saveBlockchain, loadBlockchain, verifyBlockchain, addBlockToBlockchain, getLocalBlockchainLength } from '../utils/blockchainUtils.js';

// Function to sync peer nodes
export const syncPeers = (req, res) => {
    const incomingPeerNodes = req.body.peerNodes;

    // Load the local peer nodes using utils
    const localPeerNodes = loadPeerNodes();

    // Merge the new peers with the local peers (avoiding duplicates)
    const mergedPeerNodes = mergePeerNodes(localPeerNodes, incomingPeerNodes);

    // Save the merged peer nodes list using utils
    savePeerNodes(mergedPeerNodes);

    return res.status(200).json({ message: 'Peers synced successfully' });
};

// Ping route to verify node availability
export const pingNode = (req, res) => {
    return res.status(200).json({ message: 'Node is alive' });
};


// Controller for recieving broadcasted transactions 
export const recieveTxn = async (req, res) => {
    const transaction = req.body;

    try {
        // 1. Verify the signature
        const isValidSignature = verifySignature(transaction.sender, transaction.recipient, transaction.amt, transaction.nonce, transaction.sign);
        if (!isValidSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // 2. Verify the nonce of txn
        const isNonceValid = verifyNonce(transaction.sender, transaction.nonce);
        if (!isNonceValid) {
            return res.status(400).json({ error: 'Invalid nonce' });
        }

        // 4. Add transaction to the mempool
        const addedToMempool = addToMempool(transaction);
        if (!addedToMempool) {
            return res.status(500).json({ error: 'Failed to add transaction to mempool' });
        }

        if (isMempoolFull()) {

            // execute mempool
            executeMempool();

            // mine
            const minedBlock = mineBlock();

            // add to local blockchain
            addBlockToBlockchain();

            // broadcast block
            broadcastBlock(minedBlock);

            // clear mempool
            clearMempool();
        }
        // Respond with success
        res.status(200).json({ message: 'Transaction recieved successfully', transaction });
    } catch (error) {
        console.error('Error in recieving transaction:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const recieveBlock = async (req, res) => {

    const incomingBlock = req.body.block;
    // verify the block hash and nonce
    if (!verifyBlock(incomingBlock)) {
        res.status(400).json({ error: `Block not verified` })
    };

    // add to local blockchain
    addBlockToBlockchain(incomingBlock)

    // execute
    executeBlock(incomingBlock)
}

export const syncBlockchain = async (req, res) => {
    const incomingBlockchain = req.body.blockchain
    verifyBlockchain(incomingBlockchain);

    // if verified
    saveBlockchain(incomingBlockchain);
}

export const requestSyncPeers = async (req, res) => {
    const { port } = req.body;
    const ip = req.ip;

    try {
        // Make a request to the peer to get their list of peer nodes
        const peerResponse = await axios.post(`http://${ip}:${port}/sync/peers`, {
            peerNodes: loadPeerNodes()
        });

        // Respond based on peer's response
        if (peerResponse.status === 200) {
            return res.status(200).json({ message: 'Requested peer nodes to sync peers successfully' });
        } else {
            return res.status(peerResponse.status).json({ error: peerResponse.data.error || 'Failed to request peer nodes sync' });
        }
    } catch (error) {
        console.error('Error requesting sync of peers:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// check here only if my length is longer or not
export const requestSyncBlockchain = async (req, res) => {
    const { port } = req.body;
    const ip = req.ip;

    try {
        const peerBlockchainLength = getLocalBlockchainLength();

        if (peerBlockchainLength <= req.length) {// req.length stores length of blockchain of requester
            return res.status().json({ error: 'Requester already has a longer blockchain' })
        }

        // Request peer to send their blockchain for syncing
        const peerResponse = await axios.post(`http://${ip}:${port}/sync/blockchain`, {
            blockchain: loadBlockchain()
        });

        // Respond based on peer's response
        if (peerResponse.status === 200) {
            return res.status(200).json({ message: 'Requested peer to sync blockchain successfully' });
        } else {
            return res.status(peerResponse.status).json({ error: peerResponse.data.error || 'Failed to request peer blockchain sync' });
        }
    } catch (error) {
        console.error('Error requesting sync of blockchain:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}