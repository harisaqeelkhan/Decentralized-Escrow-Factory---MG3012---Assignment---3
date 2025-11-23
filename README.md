# Decentralized-Escrow-Factory---MG3012---Assignment---3

## Assignment 3 Information
- **Student Name:** Muhammad Haris Khan  
- **Roll Number:** 23i-5558  
- **Batch:** 23  
- **Course Name:** Dr. Usama Arshad  
- **Instructor:** MG3012 - Blockchain Technology for Business  

---

# Decentralized Escrow Factory DApp

This project is a fully decentralized, trustless escrow service built on the Ethereum blockchain. It serves as a proof-of-concept for replacing traditional middlemen like Upwork or eBay, who charge high fees and introduce counterparty risk.

This DApp uses a **Factory Pattern** to create new, unique, and secure escrow smart contracts for each individual deal, ensuring that funds are isolated and the terms are immutable.

## 🚀 Purpose: The "Upwork Killer"

In a traditional freelance deal, the Buyer and Seller have a trust problem:
* **The Seller asks:** "If I do the work, how do I know the Buyer will pay?"
* **The Buyer asks:** "If I pay, how do I know the Seller will do the work?"

This DApp solves this by acting as the automated middleman.
1.  A deal is created, locking in the **Buyer**, **Seller**, **Arbiter** (a neutral third party), and the **Price**.
2.  The Buyer deposits the ETH into the contract, where it is held securely.
3.  The Seller, seeing the funds are locked, completes the work.
4.  The Buyer can then **Release** the funds, or the Arbiter can step in to **Refund** or **Release** in case of a dispute.

All of this is achieved with zero platform fees, instant settlement, and verifiable code.

## ✨ Features

* **Modern SPA Interface:** A clean, multi-page layout with a persistent header and connected wallet display.
* **Factory Contract:** A single factory deploys new, isolated `Escrow.sol` contracts for each deal.
* **Role-Based:** Each deal is defined by a `Buyer`, `Seller`, and `Arbiter`.
* **Personalized "My Deals" Dashboard:** A user-centric page that scans the blockchain and displays only the deals where the connected user is a participant.
* **Public Deal Log:** A transparent log of *all* deals ever created by the factory, with live status updates (Created, Funded, Released, Refunded).
* **Visual Polish:**
    * **Blockies:** Automatic, colorful icons for all Ethereum addresses.
    * **Status Badges:** Color-coded badges for at-a-glance deal status.
    * **Copy-to-Clipboard:** Easy-to-use buttons for all addresses.

## 🛠️ Tech Stack

* **Smart Contracts:** Solidity `^0.5.0`
* **Development Environment:** Truffle Suite
* **Local Blockchain:** Ganache
* **Frontend:** HTML5, CSS3 (Modern Redesign), JavaScript (ES6+)
* **Web3 Library:** Web3.js
* **Icons:** Blockies (Identicon library)

## 📁 Project Structure

```
your-project-name/
├── build/                  # Compiled contract artifacts (ABIs)
│   └── contracts/
│       ├── Escrow.json
│       └── EscrowFactory.json
├── contracts/              # Solidity smart contracts
│   ├── Escrow.sol          # The template contract for a single deal
│   ├── EscrowFactory.sol   # The factory contract that creates deals
│   └── Migrations.sol      # Truffle's migration tracking contract
├── migrations/             # Deployment scripts
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── test/                   # Smart contract tests
├── app.js                  # Main frontend logic (Web3 integration)
├── index.html              # Main user interface structure
├── style.css               # Styling and layout
├── truffle-config.js       # Truffle configuration (network, compiler)
└── README.md               # Project documentation
```

## ⚙️ Setup and Installation

### 1. Prerequisites

* Node.js (v16+ recommended)
* Truffle (`npm install -g truffle`)
* Ganache (Local blockchain GUI)

### 2. Clone & Install

1.  Clone this repository (or download the ZIP).
2.  Navigate into the project directory:
    ```bash
    cd your-project-folder
    ```
3.  Install project dependencies (if any, though this project needs none beyond Truffle):
    ```bash
    npm install
    ```

### 3. Running the DApp

1.  **Start Ganache:** Open the Ganache application and start a "Quickstart" Ethereum workspace.
2.  **Compile Contracts:**
    ```bash
    truffle compile
    ```
3.  **Deploy Contracts:**
    ```bash
    truffle migrate --reset
    ```
4.  **Run the Frontend:**
    * This project uses the "Live Server" VS Code extension.
    * Right-click `index.html` and select **"Open with Live Server"**.
    * The DApp will open in your browser, automatically connect to Ganache, and be ready to use.


### 1. Truffle Compile & Migrate

### 2. Home Page

### 3. Create New Deal Page

### 4. "My Deals" Dashboard

### 5. "Deal Log" (Public)
