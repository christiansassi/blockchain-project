const popup = document.getElementById("popup");
const popupClose = document.getElementById("popup-close");
const popupMessage = document.getElementById("popup-message");
const modal = document.getElementsByClassName("modal-content")[0];

const CHAIN_ID = "0x7a69";

window.web3 = null;
window.contract = null;

function showPopup(title, message) {

    document.getElementById("page-loader").style.display = "none";

    popupMessage.innerHTML = popupMessage.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;
    popup.style.display = "block";
    modal.style.display = "block";
    document.body.classList.add("modal-open");

    popupClose.onclick = function() {
        //hide_popup();
        goBack();
    }
    
    window.onclick = function(event) {
        if (event.target === popup) {
            //hide_popup();
            goBack();
        }
    }
}

function hidePopup() {
    modal.style.display = "none";
    popup.style.display = "none";
    document.body.classList.remove("modal-open");

    popupClose.onclick = null;
    window.onclick = null;
}

function blockPage() {
    popup.style.display = "block";
    modal.style.display = "none";
    document.body.classList.remove("modal-open");

    popupClose.onclick = null;
    window.onclick = null;
}

function unblockPage() {
    popup.style.display = "none";
    modal.style.display = "block";
    document.body.classList.remove("modal-open");

    popupClose.onclick = null;
    window.onclick = null;
}

async function connectMetaMask() {

    try 
    {
        // Ask for connection
        return await ethereum.request({method: "eth_requestAccounts"});
    }
    catch(error)
    {   
        if(error.code == 4001)
            showPopup("MetaMask not connected", "Please, connect MetaMask to the website.")

        return null;
    }
}

async function getMetaMaskNetwork() {
    return await ethereum.request({ method: "eth_chainId" });
}

async function loadContract() {
    try {
        // Fetch ABI JSON file
        const response = await fetch("/static/abi/abi.json");
        const abi = await response.json();

        // Initialize Web3 and contract
        window.web3 = new Web3(window.ethereum);
        window.contract = new window.web3.eth.Contract(abi.abi, abi.address);

    } catch (error) {
        console.error("Error loading ABI:", error);
    }
}

async function initMetaMask() {

    // Check MetaMask installation
    if(!window.ethereum) {
        showPopup("MetaMask not installed", "Please, install MetaMask.")
        return;
    }

    window.ethereum.on("accountsChanged", (accounts) => {
        // Reload the page when the account is changed
        window.location.reload();
    });

    let accounts = await connectMetaMask();

    // If accounts is null, an error has occurred
    if(accounts === null)
    {
        showPopup("MetaMask not connected", "Please, connect MetaMask to the website.")
        return;
    }

    // Check chain. local Ethereum network uses 0x539
    if(await getMetaMaskNetwork() !== CHAIN_ID)
    {
        showPopup("Wrong error", "Please, connect to the appropriate network.")
        return;
    }

    await loadContract();
    unblockPage();

}

function goBack() {
    if(window.location.pathname == "/buyer") {
        window.location.href = "/demo";
    }
}

blockPage();
initMetaMask();