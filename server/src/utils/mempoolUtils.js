// In-memory mempool array
let mempool = [];

// Load the in-memory mempool
export function loadMempool() {
    return mempool;
}

// Add a transaction to the in-memory mempool
export function addToMempool(transaction) {

    const exists = mempool.some(tx => tx.sign === transaction.sign);

    if (exists) {
        // If a transaction with the same signature exists, do not add it to the mempool
        return false;
    }
    
    mempool.push(transaction);
    return true;
}

// Check if the in-memory mempool is full (8 transactions)
export function isMempoolFull() {
    return mempool.length >= 8;
}

// Clear the in-memory mempool
export function clearMempool() {
    mempool = [];
    console.log("Mempool has been cleared in memory.");
}

export function showMempool() {
    console.log(mempool);
}
