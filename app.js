// Global variables
let web3;
let userAccount;
let accountButtonHTML = "";

// Contract Objects
let factoryContract;
let escrowContract; // This will be dynamically created

// Contract ABIs (will be loaded)
let factoryABI;
let escrowABI;

// Contract Addresses
let factoryAddress;

// This maps the enum numbers to human-readable strings
const dealState = ["Created", "Funded", "Released", "Refunded"];

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // We no longer save the HTML here
        
        button.innerText = 'Copied!'; // Just set the text
        
        setTimeout(() => {
            // --- THIS IS THE FIX ---
            // Revert back to the correct HTML we saved on page load
            button.innerHTML = accountButtonHTML; 
        }, 1000); // Revert after 1 second
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
}

// This function runs when the page loads
window.addEventListener('load', async () => {
    // 1. Connect to Ganache
    await initWeb3();
    if (!web3) return console.error("Web3 failed to initialize.");

    try {
        // 2. Load BOTH contract ABIs
        await loadContractABIs();
        
        // 3. Load the deployed Factory address
        await loadFactoryAddress();

        // 4. Initialize the main Factory contract
        factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);
        console.log("EscrowFactory Contract Initialized:", factoryContract.options.address);

        // 5. Set up all button clicks
        setupEventListeners();

        // 6. Set default page
        // (The HTML already sets 'home' as active, so no function call is needed here)

    } catch (error)
 {
        console.error("Error loading DApp:", error);
        alert(`Error loading DApp: ${error.message}. Check console.`);
    }
});

// --- 1. INITIALIZATION FUNCTIONS ---

async function initWeb3() {
    const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
    web3 = new Web3(provider); 
    
    console.log('Connecting to Ganache...');
    try {
        const accounts = await web3.eth.getAccounts();
        userAccount = accounts[0];
        
        const accountButton = document.getElementById('accountButton');
        const shortAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        const blockieImgSrc = blockies.create({ seed: userAccount }).toDataURL();
        
        // --- THIS IS THE FIX ---
        // 1. Save the correct HTML to our global variable
        accountButtonHTML = `<img id="accountBlockie" src="${blockieImgSrc}" alt="blockie" /> ${shortAddress}`;
        
        // 2. Set the button's content
        accountButton.innerHTML = accountButtonHTML;
        
        console.log(`Connected with account: ${userAccount}`);
    
    } catch (error) {
        console.error("Could not get accounts from Ganache.", error);
        document.getElementById('accountButton').innerText = "Error";
        web3 = null;
    }
}

async function loadContractABIs() {
    // Fetch the Factory ABI
    const factoryResponse = await fetch('build/contracts/EscrowFactory.json');
    const factoryJson = await factoryResponse.json();
    factoryABI = factoryJson.abi;
    
    // Fetch the child Escrow ABI
    const escrowResponse = await fetch('build/contracts/Escrow.json');
    const escrowJson = await escrowResponse.json();
    escrowABI = escrowJson.abi;
    
    console.log("Loaded ABIs for Factory and Escrow");
}

async function loadFactoryAddress() {
    const factoryJson = await (await fetch('build/contracts/EscrowFactory.json')).json();
    const networkId = await web3.eth.net.getId();
    const networkData = factoryJson.networks[networkId];
    if (!networkData) {
        throw new Error(`Factory contract not deployed to the current network (ID: ${networkId}). Did you run 'truffle migrate'?`);
    }
    factoryAddress = networkData.address;
    console.log(`Factory contract address: ${factoryAddress}`);
}

// --- 2. EVENT LISTENERS SETUP (UPDATED) ---

function setupEventListeners() {
    
    // --- Navigation Tabs (COMBINED AND FIXED) ---
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            
            // 1. Show the correct page
            showPage(pageId);
            
            // 2. Set the 'active' class on the button
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 3. Load data if the user clicks a data tab
            if (pageId === 'all-deals') {
                loadAllDeals();
            }
            if (pageId === 'my-deals') {
                loadMyDeals();
            }
        });

            // --- ADD THIS NEW LISTENER ---
        // Make the account button copy the full address on click
        document.getElementById('accountButton').addEventListener('click', (event) => {
            if (userAccount) {
                // Pass the *button itself* to the helper function
                copyToClipboard(userAccount, event.currentTarget); 
            }
        });
    });

    // --- Button: Refresh Deal Log ---
    document.getElementById('refreshAllDealsButton').addEventListener('click', loadAllDeals);
    
    // --- NEW Button: Refresh My Deals ---
    document.getElementById('refreshMyDealsButton').addEventListener('click', loadMyDeals);

    // --- Form: Create Escrow ---
    document.getElementById('createEscrowForm').addEventListener('submit', handleCreateEscrow);

    // --- Form: View/Load Escrow ---
    document.getElementById('viewEscrowForm').addEventListener('submit', handleLoadEscrow);
    
    // --- Form: Deposit Funds ---
    document.getElementById('depositForm').addEventListener('submit', handleDeposit);
    
    // --- Buttons: Release & Refund ---
    document.getElementById('releaseButton').addEventListener('click', handleRelease);
    document.getElementById('refundButton').addEventListener('click', handleRefund);

    // --- Button: Copy New Deal Address ---
    document.getElementById('copyNewDeal').addEventListener('click', (event) => {
        const textToCopy = document.getElementById('new-deal-address').innerText;
        copyToClipboard(textToCopy, event.target);
    });
}

// Function to show/hide pages
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    // Add a check in case the pageId is wrong
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
    } else {
        console.error(`Page not found: ${pageId}`);
        // Fallback to home
        document.getElementById('home').classList.add('active');
    }
}

// --- 3. HANDLER FUNCTIONS (Creating a Deal) ---

async function handleCreateEscrow(event) {
    event.preventDefault();
    
    // --- GET ALL 5 VALUES FROM THE FORM ---
    const buyer = document.getElementById('buyerAddress').value;
    const seller = document.getElementById('sellerAddress').value;
    const arbiter = document.getElementById('arbiterAddress').value;
    const amountEth = document.getElementById('dealAmount').value;
    const description = document.getElementById('dealDescription').value;
    
    // Convert the ETH amount to Wei for the smart contract
    const amountWei = web3.utils.toWei(amountEth, 'ether');

    console.log(`Attempting to create deal for Buyer: ${buyer}, Seller: ${seller}`);

    try {
        // --- UPDATED: Send all 5 arguments to the contract ---
        const receipt = await factoryContract.methods.createEscrow(buyer, seller, arbiter, amountWei, description)
            .send({ from: userAccount, gas: 1500000 }); // userAccount is still the one paying the gas

        console.log("Transaction successful, receipt:", receipt);

        const newAddress = receipt.events.EscrowCreated.returnValues.newEscrowAddress;

        document.getElementById('new-deal-address').innerText = newAddress;
        document.getElementById('new-deal-box').style.display = 'block';
        alert(`Success! New Escrow created at: ${newAddress}`);
        
        document.getElementById('createEscrowForm').reset();

    } catch (error) {
        console.error("Error creating escrow:", error);
        alert(`Error: ${error.message}`);
    }
}

// --- 4. HANDLER FUNCTIONS (Loading & Interacting with a Deal) ---

async function handleLoadEscrow(event) {
    event.preventDefault();
    const dealAddress = document.getElementById('escrowAddress').value;
    
    if (!web3.utils.isAddress(dealAddress)) {
        return alert("Invalid Ethereum address.");
    }
    
    console.log(`Loading details for deal: ${dealAddress}`);

    try {
        // *** THIS IS THE DYNAMIC PART ***
        // Create a new contract object for the *specific deal address*
        escrowContract = new web3.eth.Contract(escrowABI, dealAddress);
        console.log("Dynamic Escrow contract object created.");

        // Now, update the UI by calling functions on this new object
        await updateDealStatus();
        
        // Show the status box
        document.getElementById('deal-status-box').style.display = 'block';
        
    } catch (error) {
        console.error("Error loading escrow:", error);
        alert(`Error: ${error.message}`);
    }
}

// Helper function to get all deal info and update the UI
async function updateDealStatus() {
    if (!escrowContract) return;
    
    // Call "view" functions on the child contract
    const state = await escrowContract.methods.currentState().call();
    const buyer = await escrowContract.methods.buyer().call();
    const seller = await escrowContract.methods.seller().call();
    const arbiter = await escrowContract.methods.arbiter().call();
    const description = await escrowContract.methods.dealDescription().call();
    const amountWei = await escrowContract.methods.dealAmount().call();
    
    // Convert Wei back to ETH for display
    const amountEth = web3.utils.fromWei(amountWei, 'ether');

    // --- UPDATE THE HTML ---
    document.getElementById('deal-status').innerText = dealState[state];
    document.getElementById('deal-description').innerText = description;
    document.getElementById('deal-amount').innerText = amountEth;
    document.getElementById('deal-buyer').innerText = buyer;
    document.getElementById('deal-seller').innerText = seller;
    document.getElementById('deal-arbiter').innerText = arbiter;
    
    // --- ADD THIS NEW LOGIC ---
    
    // 1. Generate Blockies
    // The blockies.create() function returns a canvas element
    document.getElementById('buyer-blockie').src = blockies.create({ seed: buyer }).toDataURL();
    document.getElementById('seller-blockie').src = blockies.create({ seed: seller }).toDataURL();
    document.getElementById('arbiter-blockie').src = blockies.create({ seed: arbiter }).toDataURL();

    // 2. Set Status Badge
    const badge = document.getElementById('deal-status-badge');
    badge.className = 'status-badge'; // Clear old classes
    // Add the new class based on state (e.g., "status-funded")
    badge.classList.add(`status-${dealState[state].toLowerCase()}`); 
    
    // Show/hide the deposit form based on state
    if (state == 0) { // "Created"
        document.getElementById('depositForm').style.display = 'block';
    } else {
        document.getElementById('depositForm').style.display = 'none';
    }
}

// Buyer deposits funds (UPDATED)
async function handleDeposit(event) {
    event.preventDefault();
    
    // --- UPDATED: No more input field! ---
    // We read the required amount directly from the contract
    try {
        const amountWei = await escrowContract.methods.dealAmount().call();
        console.log(`Attempting to deposit agreed amount: ${amountWei} Wei`);

        await escrowContract.methods.deposit()
            .send({ from: userAccount, value: amountWei, gas: 300000 });
            
        alert("Deposit successful!");
        await updateDealStatus(); // Refresh UI
    } catch (error) {
        console.error("Error depositing funds:", error);
        // This will now catch "Must deposit the exact deal amount"
        alert(`Error: ${error.message}`); 
    }
}

// Buyer/Arbiter releases funds to seller
async function handleRelease() {
    console.log("Attempting to release funds...");
    try {
        await escrowContract.methods.releaseFunds()
            .send({ from: userAccount, gas: 300000 });
            
        alert("Funds released to seller!");
        await updateDealStatus(); // Refresh UI
    } catch (error) {
        console.error("Error releasing funds:", error);
        alert(`Error: ${error.message}`);
    }
}

// Seller/Arbiter refunds funds to buyer
async function handleRefund() {
    console.log("Attempting to refund funds...");
    try {
        await escrowContract.methods.refundFunds()
            .send({ from: userAccount, gas: 300000 });
            
        alert("Funds refunded to buyer!");
        await updateDealStatus(); // Refresh UI
    } catch (error) {
        console.error("Error refunding funds:", error);
        alert(`Error: ${error.message}`);
    }
}

// --- 5. UPDATED FUNCTION (Loading All Deals as a Log with Status) ---

async function loadAllDeals() {
    if (!factoryContract) {
        return alert("Factory contract not loaded.");
    }
    
    const allDealsList = document.getElementById('allDealsList');
    // Update colspan to 4 for the new "Copy" column
    allDealsList.innerHTML = '<tr><td colspan="4">Loading...</td></tr>'; 
    
    try {
        const dealAddresses = await factoryContract.methods.getAllEscrows().call();
        
        allDealsList.innerHTML = ''; // Clear 'Loading...'
        
        if (dealAddresses.length === 0) {
            // Update colspan to 4
            allDealsList.innerHTML = '<tr><td colspan="4">No deals created yet.</td></tr>';
            return;
        }
        
        let index = 0;
        for (const address of dealAddresses) {
            
            const tempEscrow = new web3.eth.Contract(escrowABI, address);
            const statusIndex = await tempEscrow.methods.currentState().call();
            const statusText = dealState[statusIndex];
            
            const tr = document.createElement('tr');
            
            // Cell 1: Tag #
            const tdTag = document.createElement('td');
            tdTag.innerText = index; // Tag #
            
            // Cell 2: Address
            const tdAddress = document.createElement('td');
            tdAddress.innerText = address; // Address
            
            // Cell 3: Status (with badge)
            const tdStatus = document.createElement('td');
            tdStatus.innerHTML = `<span class="status-badge status-${statusText.toLowerCase()}"></span> ${statusText}`;
            
            // Cell 4: Copy Button
            const tdCopy = document.createElement('td');
            const copyBtn = document.createElement('button');
            copyBtn.innerText = 'Copy';
            copyBtn.className = 'copy-btn';
            copyBtn.onclick = (event) => { // Add click listener directly
                copyToClipboard(address, event.target);
            };
            tdCopy.appendChild(copyBtn);
            
            tr.appendChild(tdTag);
            tr.appendChild(tdAddress);
            tr.appendChild(tdStatus);
            tr.appendChild(tdCopy);
            
            allDealsList.appendChild(tr);
            
            index++; // Increment the Tag #
        }
        
    } catch (error) {
        console.error("Error loading all deals:", error);
        allDealsList.innerHTML = '<tr><td colspan="4">Error loading deals. Check console.</td></tr>';
    }
}


// --- 6. NEW FUNCTION (The "My Deals" Dashboard Scanner) ---

async function loadMyDeals() {
    if (!factoryContract || !userAccount) {
        return alert("DApp not initialized. Please connect.");
    }

    const myDealsList = document.getElementById('myDealsList');
    myDealsList.innerHTML = '<tr><td colspan="5">Scanning the blockchain for your deals...</td></tr>';

    // We need our connected address in a consistent format
    const userAddress = userAccount.toLowerCase();
    let dealsFound = 0; // A counter

    try {
        const dealAddresses = await factoryContract.methods.getAllEscrows().call();
        
        if (dealAddresses.length === 0) {
            myDealsList.innerHTML = '<tr><td colspan="5">No deals found on the platform yet.</td></tr>';
            return;
        }

        // Clear the "Loading" message
        myDealsList.innerHTML = '';

        let index = 0; // This is the Tag #
        for (const address of dealAddresses) {
            // 1. Create a temp object for this deal
            const tempEscrow = new web3.eth.Contract(escrowABI, address);

            // 2. Get the 3 parties for this deal
            // We use Promise.all to fetch them in parallel
            const [buyer, seller, arbiter] = await Promise.all([
                tempEscrow.methods.buyer().call(),
                tempEscrow.methods.seller().call(),
                tempEscrow.methods.arbiter().call()
            ]);

            let userRole = "";

            // 3. Check if our address matches any of them
            if (buyer.toLowerCase() === userAddress) {
                userRole = "Buyer";
            } else if (seller.toLowerCase() === userAddress) {
                userRole = "Seller";
            } else if (arbiter.toLowerCase() === userAddress) {
                userRole = "Arbiter";
            }

            // 4. If we found a match (userRole is not empty), show this deal
            if (userRole !== "") {
                dealsFound++; // Increment the counter

                // Get the status
                const statusIndex = await tempEscrow.methods.currentState().call();
                const statusText = dealState[statusIndex];

                // Build the table row
                const tr = document.createElement('tr');

                const tdTag = document.createElement('td');
                tdTag.innerText = index; // Tag #

                const tdRole = document.createElement('td');
                tdRole.innerText = userRole; // My Role

                const tdStatus = document.createElement('td');
                tdStatus.innerHTML = `<span class="status-badge status-${statusText.toLowerCase()}"></span> ${statusText}`;

                const tdAddress = document.createElement('td');
                tdAddress.innerText = address;

                const tdCopy = document.createElement('td');
                const copyBtn = document.createElement('button');
                copyBtn.innerText = 'Copy';
                copyBtn.className = 'copy-btn';
                copyBtn.onclick = (event) => {
                    copyToClipboard(address, event.target);
                };
                tdCopy.appendChild(copyBtn);

                tr.appendChild(tdTag);
                tr.appendChild(tdRole);
                tr.appendChild(tdStatus);
                tr.appendChild(tdAddress);
                tr.appendChild(tdCopy);

                myDealsList.appendChild(tr);
            }
            index++; // Increment Tag # for every loop
        }

        // 5. If we finished the loop and found nothing
        if (dealsFound === 0) {
            myDealsList.innerHTML = '<tr><td colspan="5">No deals found where you are a participant.</td></tr>';
        }

    } catch (error) {
        console.error("Error loading my deals:", error);
        myDealsList.innerHTML = '<tr><td colspan="5">Error loading deals. Check console.</td></tr>';
    }
}