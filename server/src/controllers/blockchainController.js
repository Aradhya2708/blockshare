// Logic for handling blockchain-related requests
import { verifyNonce, loadBlockchainState, mineBlock, getBalanceByAddress } from '../utils/cryptoUtils.js';
import { loadPeerNodes, savePeerNodes, broadcastTransaction, broadcastBlock, syncPeerDataWithOtherNodes, pingNodeUtil, getIPv4FromIPv6 } from '../utils/networkUtils.js';
import { addToMempool, isMempoolFull, clearMempool, showMempool } from '../utils/mempoolUtils.js';
import { addBlockToBlockchain, loadBlockchain } from '../utils/blockchainUtils.js';
import pkg from '../utils/ellipticUtils.cjs';
const { verifySignature, generateKeyPair } = pkg

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
    syncPeerDataWithOtherNodes(peerNodes);

    return res.status(200).json({ message: 'Node registered successfully' });
};

// Submit a transaction
export const submitTxn = async (req, res) => {
    const { sender, recipient, amt, data, nonce, sign } = req.body;

    if (!sender || !recipient || !amt || !nonce || !sign ) {
        return res.status(400).json({ error: 'All fields (sender, recipient, amt, nonce, sign, timestamp) are required' });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const transaction = { sender, recipient, amt, data, nonce, timestamp, sign };

    // 1. Verify the signature
    const isSignatureValid = verifySignature(transaction);
    if (!isSignatureValid) {
        return res.status(400).json({ error: 'Invalid signature' });
    }
    console.debug("sign verified")

    // 2. Verify the nonce (to prevent replay attacks) 
    const isNonceValid = verifyNonce(sender, nonce);
    if (!isNonceValid) {
        return res.status(400).json({ error: 'Invalid nonce' });
    }
    console.debug("nonce validated")

    // 3. Broadcast the transaction to peers
    await broadcastTransaction(transaction);

    // 4. Add transaction to the mempool, mine if full
    addToMempool(transaction);
    console.debug("added to mempool")
    showMempool()

    if (isMempoolFull()) {

        mineBlock()
            .then((minedBlock) => {
                console.log("Block has been mined:", minedBlock);
                return addBlockToBlockchain(minedBlock);
            })
            .then((minedBlock) => {
                console.log("Block added to blockchain:", minedBlock);
                return broadcastBlock(minedBlock);
            })
            .then(() => {
                console.log("Block broadcasted successfully.");
                clearMempool();
            })
            .catch((error) => {
                console.error("Error in mining process:", error);
                res.status(500).json({ error: "Error in mining process" });
            });
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
    console.log(balance);

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

export const generateKeyPairRoute = async (req, res) => {
    const { publicKey, privateKey } = generateKeyPair();

    res.status(400).json({
        publicKey,
        privateKey
    })
}

export const getBlockchainAtTimestamp = async (req, res) => {
    try {
        const { timestamp } = req.query;
        if (!timestamp) {
            return res.status(400).json({ error: "Timestamp query parameter is required" });
        }

        const blockchain = await loadBlockchain();
        const filteredBlocks = blockchain.blocks.filter(block => 
            block.transactions.some(tx => parseInt(tx.timestamp) <= parseInt(timestamp))
        );

        res.json({
            blockchainHeader: {
                blockchainLength: filteredBlocks.length
            },
            blocks: filteredBlocks
        });
    } catch (error) {
        console.error("Error fetching blockchain at timestamp:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};