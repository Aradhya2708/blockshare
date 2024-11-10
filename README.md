# BlockShare

A blockchain implementation with C++ core and JavaScript API layer. This project provides a distributed ledger system with REST API endpoints for client interactions.

## Features

- Decentralized peer-to-peer network
- Transaction processing and validation
- Account balance management
- Digital signature verification
- RESTful API interface

## Prerequisites

- Node.js (v14 or higher)
- C++ compiler (supporting C++11 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Aradhya2708blockshare.git
cd blockshare
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Compile C++ components:
```bash
# Compile main blockchain implementation
g++ blockchain.cpp -o blockchain -lws2_32

# Compile hash nonce utility
g++ hashNonce.cpp -o hashNonce
```

## Running a Node

1. Start the Node.js server:
```bash
npm run dev
```

2. Execute the blockchain core:
```bash
./blockchain
```

3. Add peer information in localdb/peers.json

## API Endpoints

### Join Network
```bash
curl -X POST http://localhost:3000/contribute \
  -H "Content-Type: application/json" \
  -d '{
    "provided_port": 8080,
  }'
```

### Submit Transaction
```bash
curl -X POST http://localhost:3000/submit-txn \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "sender_address",
    "recipient": "recipient_address",
    "amt": 100,
    "nonce": 12345,
    "sign": "transaction_signature"
  }'
```

### Get Total Balance
```bash
curl http://localhost:3000/balance
```

### Get Account Balance
```bash
curl http://localhost:3000/balance/0x123...abc
```

## Response Formats

### Balance Response
```json
{
  "account": "0x123...abc",
  "balance": 1000
}
```

### Transaction Response
```json
{
  "status": "success",
  "transaction_hash": "0x456...def"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
