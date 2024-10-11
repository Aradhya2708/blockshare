// for handling transaction requests

/*
POST Request /blockchain/transaction
{
    sender,
    recipient,
    amt,
    sign
}

processing by node:

    - verify Sign (sender, sign, data) [Assymetric Cryptography]
        - hash Transaction Data (reconstruct transaction hash)
        - get the public key in elliptic curve format [ECDSA]
        - verify sign against public key
    - Update UTXO
        - Load UTXO
        - sender.coins -= amt
        - recipient.coins += amt
        - save UTXO
    - Broadcast UTXO
        ? whole or just new txn?
    - add to memmpool
    - check if mempool fill
    - PoW (find Nonce)
    - Mine new Block
    - Broadcast Block
*/ 