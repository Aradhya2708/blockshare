# BlockShare

A blockchain implementation with C++ core and JavaScript API layer. This project provides a distributed ledger system with REST API endpoints for client interactions.

## Features

- Decentralized peer-to-peer network
- Transaction processing and validation
- Account balance management
- Digital signature verification
- RESTful API interface

> Note: BlockShare currently works on Local Networks over the same WiFi connection. It serves as an excellent resource for anyone wanting to learn theoretical concepts of blockchain and practical blockchain development. 

## Prerequisites

- Node.js (v14 or higher)
- C++ compiler (supporting C++11 or higher)
- npm or yarn package manager
- Machine supporting WinSock2

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

1. Create .env with IP and PORT

2. Start the Node.js server:
```bash
npm run dev
```

3. Execute the blockchain core:
```bash
./blockchain
```

4. Add peer information in localdb/peers.json

## API Endpoints for Client

### Join Network
```bash
# say one of the nodes in the local network is running over 172.12.345.678:3000
curl -X POST http://172.12.345.678:3000/blockchain/contribute \
  -H "Content-Type: application/json" \
  -d '{
    "provided_port": 8080,
  }'
```

### Submit Transaction
```bash
curl -X POST http://172.12.345.678:3000/blockchain/submit-txn \
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
curl http://172.12.345.678:3000/blockchain/balance
```

### Get Account Balance
```bash
curl http://172.12.345.678:3000/blockchain/balance/0x123...abc
```

## Response Formats

### Balance Response
```json
{
  "account": "0x123...abc",
  "balance": 1000
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
