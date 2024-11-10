# BlockShare Technical Documentation

## Architecture Overview

### Core Components
1. **Blockchain Core (C++)**
   - Block structure and chain management
   - Consensus mechanism (LCR)
   - Transaction nonce validation 
   - State management

2. **API Layer (Node.js)**
   - RESTful interface
   - Transaction Signature Validation
   - Block Validation
   - P2P Network communication
   - Client request handling
    
3. **Native Miner (C++)**
   - Calculate Nonce for Cryptographic Puzzle
  
4. **Web Client (MERN)**
   - Web Interface
   - Utility tools for Signing, generating Assymetric Cryptographic Key Pairs

## Implementation Details

### Block Structure
```cpp
class Block {
public:
    string prevHash;
    string message;
    int blockNumber;
    string hash;
    vector<shared_ptr<Block>> children;
    shared_ptr<Block> parent;

    Block(string prevHash, string message, int blockNumber, string hash)
        : prevHash(prevHash), message(message), blockNumber(blockNumber), hash(hash) {}
};
```

### Blockchain Structure
```cpp
class Blockchain {
public:
    unordered_map<int, vector<shared_ptr<Block>>> levels; // Blocks stored by level
    vector<shared_ptr<Block>> confirmedBlockchain;

    int confirmedLength;
    string lastHash;
    bool isGenesisAdded = false;

    shared_ptr<Block> Genesis;
}
```

### Longest Chain Rule and Consensus
- The chain with the most accumulated blocks is considered the valid chain
- When a node receives blocks, it:
  1. Validates the new blocks
  2. Compares the length with its current chain
  3. Switches to the longer chain if one is found
- When a conflict is detected, nodes:
  1. Temporarily maintain all chain versions
  2. Continue building on the arbitarily left chain
  3. Prune the shorter fork once the longest chain is clearly established

### Transaction Processing
1. Transaction Validation:
   - Digital signature verification
   - Nonce checking for replay protection

2. State Management:
   - Blockchain State stored as Merkle-Patricia Tree
   - Upon request for Transaction Execution to state
     - Nonce is verified
     - if verified, Balance is updated and nonce is updated
   - Prevents Replay Attacks


### Network Protocol
1. **Node Discovery**
   - New nodes register via `/contribute` endpoint
   - Peer list maintained in storage

2. **Transaction Propagation**
   - Broadcast to all peers

### Data Structures
1. **Merkle Patricia Tree**

2. **Blockchain**

## Code Organization

```
src/
├── 
```

## Security Considerations

1. **Transaction Security**
   - ECDSA signature verification
   - Replay attack prevention

2. **Network Security**
   - Node authentication

## Development Guidelines

1. **Coding Standards**
   - C++11 or higher
   - JavaScript
   - Comprehensive unit tests

2. **Testing**
   - Unit tests for core components
   - Integration tests for API
   - Network simulation tests
