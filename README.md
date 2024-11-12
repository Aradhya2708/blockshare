<div align="center">

# BlockShare

[<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="60">](https://javascript.com)
[<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/cplusplus/cplusplus-original.svg" width="60">](https://isocpp.org/)
[<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="60">](https://nodejs.org/)

[![Open in Visual Studio Code](https://img.shields.io/badge/Open%20in%20VS%20Code-007ACC?logo=visual-studio-code&logoColor=white)](https://vscode.dev/)
[![Contributors](https://img.shields.io/github/contributors/Aradhya2708/blockshare)](https://github.com/Aradhya2708/blockshare/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/Aradhya2708/blockshare?style=social)](https://github.com/Aradhya2708/blockshare/network/members)
[![Stars](https://img.shields.io/github/stars/Aradhya2708/blockshare?style=social)](https://github.com/Aradhya2708/blockshare/stargazers)
[![License](https://img.shields.io/github/license/Aradhya2708/blockshare)](https://github.com/Aradhya2708/blockshare/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-v14+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![C++ Version](https://img.shields.io/badge/C++-11%2B-blue?logo=c%2B%2B&logoColor=white)](https://isocpp.org/)

*A Local Blockchain Network for Learning and Experimentation*

[Key Features](#key-features) • [Installation](#installation) • [Documentation](#api-endpoints-for-client) • [Contributing](#contributing)

</div>

## 🌟 Overview

BlockShare is a decentralized ledger and blockchain platform designed for running your own cryptocurrency in a local network environment. With a C++ core handling blockchain operations and a JavaScript-based API layer for client interactions, BlockShare provides a functional peer-to-peer network that supports transaction processing, balance management, and digital signature verification.

## 🚀 Key Features

- 🌐 **Local Cryptocurrency Network**: Launch and manage a cryptocurrency network within a local WiFi environment.
- 🔄 **Peer-to-Peer Node Communication**: Supports decentralized networking for nodes to communicate, process transactions, and maintain data consistency.
- 🔒 **Secure Transactions**: Handles transaction signing and validation with digital signature verification.
- 🛠️ **RESTful API for Client Interactions**: Offers API endpoints for network participation, transaction submissions, and balance inquiries.
- 💰 **Balance Management**: Track individual account balances and total network balance.

> ⚠️ **Note**: BlockShare is intended for local network setups and educational purposes, not for deployment on public networks. It's a valuable resource for anyone wanting a hands-on approach to learning blockchain principles and creating a small-scale cryptocurrency.


## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **C++ Compiler** (supporting C++11 or higher)
- **npm** or **yarn** package manager
- **Machine with WinSock2** support for network operations


## 🔧 Installation

<details>
  
<summary>Step-by-step guide</summary>

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
</details>

## 🖥️ Running a Node

1. Create ```.env``` with IP and PORT

2. Start the Node.js server:
```bash
npm run dev
```

3. Execute the blockchain core:
```bash
./blockchain
```

4. Add peer information in ```/localdb/peers.json```

5. Modify and execute Native Miner ```/native/hashNonce.cpp```
```bash
./hashNonce
```


## 📡 API Endpoints for Client

Here’s how you can interact with your local BlockShare via REST API

### 🤝 Join Network
Allow a new node to join the local network by specifying the desired port.
```bash
# say one of the nodes in the local network is running over 172.12.345.678:3000
curl -X POST http://172.12.345.678:3000/blockchain/contribute \
  -H "Content-Type: application/json" \
  -d '{
    "provided_port": 8080,
  }'
```

### 💸 Submit Transaction
Submit a transaction, including details like sender, recipient, amount, nonce, and a signature.
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

### 💰 Get Total Balance
Retrieve the total balance across the network.
```bash
curl http://172.12.345.678:3000/blockchain/balance
```

### 👤 Get Account Balance
Get the balance for a specific account address.
```bash
curl http://172.12.345.678:3000/blockchain/balance/0x123...abc
```

## 📊 Sample Response Formats

### Balance Response
A typical balance response structure.
```json
{
  "account": "0x123...abc",
  "balance": 1000
}
```

## 🤝 Contributing
 
1. Fork the repository to start working on your changes.
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request to merge your changes.
