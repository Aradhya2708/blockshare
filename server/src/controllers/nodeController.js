import { loadPeerNodes, savePeerNodes, mergePeerNodes, loadUTXO, saveUTXO } from '../utils/fileUtils.js';
import { pingNode } from '../utils/networkUtils.js';

// Function to handle receiving UTXO data from another node
export const syncUTXO = (req, res) => {
    const incomingUTXO = req.body;

    // Load the current UTXO database using utils
    const localUTXO = loadUTXO();

    // Merge the incoming UTXO with the current UTXO
    const updatedUTXO = mergeUTXO(localUTXO, incomingUTXO);

    // Save the updated UTXO database using utils
    saveUTXO(updatedUTXO);

    return res.status(200).json({ message: 'UTXO synced successfully' });
};

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

// Syncing Blockchain
