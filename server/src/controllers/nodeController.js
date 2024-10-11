import { loadPeerNodes, savePeerNodes, mergePeerNodes } from '../utils/fileUtils.js';
import { verifySignature, verifyNonce, addToMempool, updateState, loadBlockchainState, isMempoolFull, isMempoolFull, mineBlock, clearMempool } from '../utils/cryptoUtils.js';
import { pingNode } from '../utils/networkUtils.js';

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


// Controller for broadcasting transactions
export const broadcastTxn = async (req, res) => {
    const transaction = req.body;

    try {
        // 1. Verify the signature
        const isValidSignature = verifySignature(transaction);
        if (!isValidSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // 2. Verify the nonce
        const state = loadBlockchainState();
        const senderAccount = state[transaction.sender];
        if (!senderAccount) {
            return res.status(404).json({ error: 'Sender address not found in state' });
        }
        const isValidNonce = verifyNonce(transaction.nonce, senderAccount.nonce);
        if (!isValidNonce) {
            return res.status(400).json({ error: 'Invalid nonce' });
        }
        // 4. Add transaction to the mempool
        addToMempool(transaction);

        if (isMempoolFull()) {
            // mine
            const minedBlock = mineBlock();

            // broadcast block
            broadcastBlock(minedBlock);

            // clear mempool
            clearMempool();
        }

        // 5. Update the state (i.e., update the account balances)
        updateState(transaction);

        // Respond with success
        res.status(200).json({ message: 'Transaction broadcasted successfully', transaction });
    } catch (error) {
        console.error('Error in broadcasting transaction:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const broadcastBlock = async (req, res) => {

    // verify the block nonce
    // other stuff
    // change local state and blockchain
}