const popup = document.getElementById("popup");
const popupClose = document.getElementById("popup-close");
const popupMessage = document.getElementById("popup-message");
const modal = document.getElementsByClassName("modal-content")[0];

const chainId = "0x539";

var accounts;

function show_popup(title, message) {
    popupMessage.innerHTML = popupMessage.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;
    popup.style.display = "block";
    modal.style.display = "block";
    document.body.classList.add("modal-open");

    popupClose.onclick = function() {
        //hide_popup();
        go_back();
    }
    
    window.onclick = function(event) {
        if (event.target === popup) {
            //hide_popup();
            go_back();
        }
    }
}

function hide_popup() {
    modal.style.display = "none";
    popup.style.display = "none";
    document.body.classList.remove("modal-open");

    popupClose.onclick = null;
    window.onclick = null;
}

function block_page() {
    popup.style.display = "block";
    modal.style.display = "none";
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
            show_popup("MetaMask not connected", "Please, connect MetaMask to the website.")

        return null;
    }
}

async function getMetaMaskNetwork() {
    return await ethereum.request({ method: "eth_chainId" });
}

async function initMetaMask() {

    // Check MetaMask installation
    if(!window.ethereum) {
        show_popup("MetaMask not installed", "Please, install MetaMask.")
        return;
    }

    accounts = await connectMetaMask();

    // If accounts is null, an error has occurred
    if(accounts === null)
    {
        show_popup("MetaMask not connected", "Please, connect MetaMask to the website.")
        return;
    }

    // Check chain. local Ethereum network uses 0x539
    if(await getMetaMaskNetwork() !== chainId)
    {
        show_popup("Wrong error", "Please, connect to the appropriate network.")
        return;
    }

}

function go_back() {
    if(window.location.pathname == "/buyer") {
        window.location.href = "/demo";
    }
}

block_page();

initMetaMask();