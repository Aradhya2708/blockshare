// for cryptographic operations (signing, hashing) [NEEDS EXTENSIVE CHANGES]

import crypto from 'crypto';
import { loadMempool } from './mempoolUtils.js';
import { getBlockNumber, getPrevBlockHash } from './blockchainUtils.js';
import net from "net";

function sendCommand(command) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.connect(8080, '172.31.107.55', () => {
            console.log(`Connected`)
            client.write(command);
        });

        client.on('data', (data) => {
            resolve(data.toString());
            client.destroy(); // close the connection after receiving data
        });

        client.on('error', (err) => {
            reject(err);
        });
    });
}


// Save the blockchain state
export function saveBlockchainState(state) {
}

export function createBlockchainState() {
    // execute each txn in the Blockchain
}

// Verify the signature of the transaction
export function verifySignature(sender, recipient, amt, nonce, sign) {
    const data = `${sender}${recipient}${amt}${nonce}`;
    const verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(data));
    verifier.end();

    try {
        return verifier.verify(sender, sign, 'base64');
    } catch (error) {
        console.log('Signature verification failed: ', error.message);
        return false
    }

}

// Verify nonce (ensure the transaction is in correct order)
// CPP Function for Server
export function verifyNonce(sender, nonce) {

}

export function getBalanceByAddress(address) {
    const balance = 0; // CPP function
    return balance;
}

// Load the current blockchain state
export async function loadBlockchainState() {
    const response = await sendCommand(`GET_ALL`)
    // key:amt:nonce,key:amt:nonce

}

export async function getStateOfAddress(address) {
    const response = await sendCommand(`GET_BY_ADDRESS ${address}`);
    // "12:16" [CHECK]
    const nonce = response.split(":")[1];
    const balance = response.split(":")[0];

    return { balance, nonce };
}

// CPP Function for Server
export async function executeTxn(txn) {
    const response = await sendCommand(`EXECUTE ${txn.sender} ${rxn.recipient} ${txn.nonce} ${txn.amt}`)
    if (parseInt(response) < 0) {
        console.log("Failure in execution");
    }
    else if (parseInt(response) >= 0) {
        console.log("Transaction Executed Succesfully");
    }
}

export async function getStateHash() {
    const response = await sendCommand(`GET_STATE_HASH`);
    return parseInt(response);
}

// Block utils

// CPP Executable
export function verifyBlock(block) {

    // check prevHash = prev.hash
    // check hash

    return // bool
}

export const mineBlock = () => {

    const mempool = loadMempool();
    const stateHash = getStateHash();
    const prevBlockHash = getPrevBlockHash();
    const blockNumber = getBlockNumber() + 1;
    const data = `${prevBlockHash}${mempool}${stateHash}${blockNumber}`
    const { nonce, blockHash } = getNonceAndHash(JSON.stringify(data));
    const newBlock = { prevBlockHash, mempool, stateHash, blockNumber, nonce, blockHash };
    return newBlock;
}

// CPP function [MINING]
async function getNonceAndHash(message) {
    // message + 0 = 0000hash 
}



export function executeBlock(block) {
    block.transactions.forEach(txn => {
        executeTxn(txn);
    });
}