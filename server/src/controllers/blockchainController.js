// Logic for handling blockchain-related requests
import { verifyNonce, loadBlockchainState, mineBlock, getBalanceByAddress } from '../utils/cryptoUtils.js';
import { loadPeerNodes, savePeerNodes, broadcastTransaction, broadcastBlock, syncPeerDataWithOtherNodes, pingNodeUtil, getIPv4FromIPv6 } from '../utils/networkUtils.js';
import { addToMempool, isMempoolFull, clearMempool } from '../utils/mempoolUtils.js';
import { addBlockToBlockchain } from '../utils/blockchainUtils.js';
import pkg from '../utils/ellipticUtils.cjs';
const { verifySignature } = pkg

// 172.31.113.190
/*
    {
        "port",
        "public_key"
        "sign"
    }

    node message verification through assymetric cryptography. middleware
*/

// Function to handle new node registration
export const registerNode = async (req, res) => {

    const { provided_port } = req.body;

    if (!provided_port) {
        return res.status(400).json({ message: 'No Port Provided' })
    }

    const ip = getIPv4FromIPv6(req.ip);

    // Ping the new node to verify that it’s live 
    const isNodeActive = pingNodeUtil(ip, provided_port);

    if (!isNodeActive) {
        return res.status(400).json({ message: 'Node verification failed at status' });
    }

    // Load peer nodes using utils
    const peerNodes = loadPeerNodes();


    // Check if the node already exists
    const nodeExists = peerNodes.some(node => node.ip === ip); // [check]
    if (nodeExists) {
        return res.status(400).json({ message: 'Node already exists' });
    }

    const newNode =
    {
        ip: ip,
        port: provided_port
    }

    // Add the new node to peer nodes
    peerNodes.push(newNode);
    savePeerNodes(peerNodes);

    // Broadcast peer data to other nodes
    await syncPeerDataWithOtherNodes(peerNodes);

    return res.status(200).json({ message: 'Node registered successfully' });
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
    await broadcastTransaction(transaction);

    // 4. Add transaction to the mempool, mine if full
    const addedToMempool = addToMempool(transaction);
    if (!addedToMempool) {
        return res.status(500).json({ error: 'Failed to add transaction to mempool' });
    }

    if (isMempoolFull()) {

        // mine
        const minedBlock = await mineBlock();

        // add to local blockchain
        await addBlockToBlockchain(minedBlock)

        // broadcast block
        await broadcastBlock(minedBlock);

        // clear mempool
        clearMempool();
    }

    res.status(200).json({
        message: 'Transaction submitted successfully',
        transaction
    });
};

// Controller to check balance by address
export const checkBalanceByAdd = async (req, res) => {
    const { address } = req.params;
    const balance = await getBalanceByAddress(address)

    // Return the balance of the address
    res.status(200).json({
        address,
        balance
    });
};

// Controller to get the entire blockchain state
export const getState = async (req, res) => {
    // Load the entire blockchain state
    const state = await loadBlockchainState();

    // Return the state
    res.status(200).json({
        state
    });
};