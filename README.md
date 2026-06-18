# 🚀 Blockchain-Ledger-API

*A Lightweight Blockchain Ledger System for Learning & Experimentation*

---

## 🌟 Overview

Blockchain-Ledger-API is a decentralized blockchain-based system designed to simulate a cryptocurrency network in a local environment. It combines a **C++ core for blockchain operations** with a **Node.js REST API layer** for client interaction.

This project is built to help developers understand core blockchain concepts like:

* Distributed ledgers
* Peer-to-peer communication
* Transaction validation
* Cryptographic signatures

---

## ⚡ Features

* 🔗 **Decentralized Ledger System** – Simulates blockchain data structure and storage
* 🌐 **Peer-to-Peer Communication** – Nodes connect and sync over a local network
* 🔐 **Secure Transactions** – Digital signature-based validation
* 📡 **REST API Support** – Interact with blockchain using HTTP endpoints
* 💰 **Balance Tracking** – Check account and total network balances

---

## 🧠 Tech Stack

* **C++ (C++11+)** – Core blockchain logic
* **Node.js (v14+)** – API layer
* **JavaScript** – Client interaction
* **WinSock2** – Networking (Windows)

---

## 📋 Prerequisites

Make sure you have:

* Node.js (v14 or above)
* C++ Compiler (GCC / MinGW)
* npm or yarn
* Windows system (for WinSock support)

---

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/Blockchain-Ledger-API.git
cd Blockchain-Ledger-API
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile C++ Files

```bash
g++ blockchain.cpp -o blockchain -lws2_32
g++ hashNonce.cpp -o hashNonce
```

---

## ▶️ Running the Project

### Step 1: Setup Environment

Create a `.env` file with:

```
IP=your-ip-address
PORT=3000
```

### Step 2: Start Server

```bash
npm run dev
```

### Step 3: Run Blockchain Core

```bash
./blockchain
```

---

## 📡 API Endpoints

### 🤝 Join Network

```bash
POST /blockchain/contribute
```

### 💸 Submit Transaction

```bash
POST /blockchain/submit-txn
```

### 💰 Get Balance

```bash
GET /blockchain/balance
```

---

## 🎯 Purpose

This project is built for:

* Learning blockchain fundamentals
* Understanding distributed systems
* Experimenting with local crypto networks

⚠️ Not intended for production or real financial use.

---

## ✨ Future Improvements

* Add frontend dashboard
* Improve consensus mechanism
* Add mining simulation
* Docker support

---

## 👩‍💻 Author

Developed and customized by **Lathiga**

---

## 📜 License

This project follows the MIT License.

