const popup = document.getElementById("popup");
const popupClose = document.getElementById("popup-close");
const popupMessage = document.getElementById("popup-message");

const chainId = "0x539";

var accounts;

async function connectMetaMask() {

    try 
    {
        // Ask for connection
        return await ethereum.request({method: "eth_requestAccounts"});
    }
    catch(error)
    {   
        if(error.code == 4001)
        {
            popupMessage.innerText = "Please, connect MetaMask to the website";
            popup.style.display = "block";
            document.body.classList.add("modal-open");
        }

        return null;
    }
}

async function getMetaMaskNetwork() {
    return await ethereum.request({ method: "eth_chainId" });
}

async function initMetaMask() {

    // Check MetaMask installation
    if(!window.ethereum)
        return;

    accounts = await connectMetaMask();

    // If accounts is null, an error has occurred
    if(accounts === null)
        return;

    // Check chain. local Ethereum network uses 0x539
    if(await getMetaMaskNetwork() !== chainId)
    {
        popupMessage.innerText = "Wrong network";
        popup.style.display = "block";
        document.body.classList.add("modal-open");

        return;
    }

}

popupClose.onclick = function() {
    popup.style.display = "none";
    document.body.classList.remove("modal-open");
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    if (event.target === popup) {
        popup.style.display = "none";
        document.body.classList.remove("modal-open");
    }
}

document.getElementsByClassName("launch-app")[0].addEventListener("click", async () => {
    initMetaMask();
});
