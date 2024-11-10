// for cryptographic operations (signing, hashing) [NEEDS EXTENSIVE CHANGES]

import crypto from 'crypto';
import { loadMempool } from './mempoolUtils.js';
import { getBlockNumber, getPrevBlockHash } from './blockchainUtils.js';
import net from "net";
import { exec } from 'child_process';

import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exePath = path.resolve(__dirname, '../../../native/hashNonce.exe');

function sendCommand(command) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.connect(8080, process.env.IP, () => {
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

// Verify nonce (ensure the transaction is in correct order)
// CPP Function for Server
export async function verifyNonce(sender, nonce) {
    const res = await getStateOfAddress(sender)
    if (parseInt(res.nonce) === parseInt(nonce) - 1) {
        return true;
    }

    return false;
}

export async function getBalanceByAddress(address) {
    const { balance, nonce } = await getStateOfAddress(address);
    console.log(balance);
    return balance;
}

// !------- COMMANDS FOR INTERACTING WITH BLOCKCHAINSTATE.EXE -------!

// Load the current blockchain state
export async function loadBlockchainState() {
    const response = await sendCommand(`GET_ALL`)
    const state = response.split(',').map(entry => ({
        [entry.split(':')[0]]: {
            balance: entry.split(':')[1],
            nonce: entry.split(':')[2]
        }
    }));
    return state;
}

export async function getStateOfAddress(address) {
    const response = await sendCommand(`GET_BY_ADDRESS ${address}`);
    // "12:16" [CHECK]
    const nonceStr = response.split(":")[1];
    const balanceStr = response.split(":")[0];

    console.log("tis balance str", balanceStr);

    const balance = parseInt(balanceStr)
    const nonce = parseInt(nonceStr);

    return { balance, nonce };
}

// // CPP Function for Server



// Block utils

export function verifyBlock(block) {
    console.log(block);
    const { prevBlockHash, transactions, blockNumber, nonce, blockHash } = block;
    const data = `${prevBlockHash}${JSON.stringify(transactions)}${blockNumber}${nonce}`
    const calcHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

    return calcHash === blockHash;
}

export const mineBlock = async () => {
    const transactions = loadMempool();

    const prevBlockHash = await getPrevBlockHash();
    // console.log(prevBlockHash)
    const blockNumber = await getBlockNumber() + 1;
    // console.log(blockNumber)
    const data = `${prevBlockHash}${JSON.stringify(transactions)}${blockNumber}`
    // console.log(JSON.stringify(transactions));
    const { nonce, blockHash } = await getNonceAndHash((data));
    console.log("mined!");
    const newBlock = { prevBlockHash, transactions, blockNumber, nonce, blockHash };
    return newBlock;
}

function runSha256(baseString, k) {
    return new Promise((resolve, reject) => {
        // Run the C++ executable with the base string and number of leading zeros
        exec(`"${exePath}" "${baseString}" ${k}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return reject(new Error(stderr));
            }
            try {
                // Parse and log the JSON output from the C++ program
                const output = JSON.parse(stdout.trim());
                resolve(output);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

//console.log(runSha256("Arpan",5).then(console.log))

// CPP function [MINING]
async function getNonceAndHash(message) {
    try {
        const { result, hash } = await runSha256(message, 3);
        console.log(result, hash);
        const nonce = parseInt(result);
        const blockHash = hash
        return { nonce, blockHash };
    } catch (error) {
        console.error("Error in getNonceAndHash:", error);
        return null;
    }
}