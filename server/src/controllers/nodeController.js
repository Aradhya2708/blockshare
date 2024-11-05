import { loadPeerNodes, savePeerNodes, mergePeerNodes } from '../utils/fileUtils.js';
import { verifySignature, verifyNonce, addToMempool, isMempoolFull, mineBlock, clearMempool, executeMempool, verifyBlock, addBlockToChain } from '../utils/cryptoUtils.js';
import { pingNode } from '../utils/networkUtils.js';
import { broadcastTransaction, broadcastBlock } from '../utils/networkUtils.js';

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
            addBlockToChain();

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

    // verify the block hash and nonce
    verifyBlock();

    // add to local blockchain
    addBlockToChain()

    // execute
    executeBlock()
}

export const syncBlockchain = async (req, res) => {
    //
}