const STATUS_MAP = {
    "0": "None",
    "1": "Paid",
    "2": "Accepted",
    "3": "Completed",
    "4": "Refund pending",
    "5": "Refund accepted",
    "6": "Refund declined"
};

function blockPage() {
    document.getElementById("popup").style.display = "block";
    document.getElementsByClassName("modal-content")[0].style.display = "none";
    document.body.classList.remove("modal-open");

    document.getElementById("page-loader").style.display = "flex";

    document.getElementById("popup-close").onclick = null;
    window.onclick = null;
}

function unblockPage() {
    document.getElementById("popup").style.display = "none";
    document.getElementsByClassName("modal-content")[0].style.display = "block";
    document.body.classList.remove("modal-open");

    document.getElementById("page-loader").style.display = "none";

    document.getElementById("popup-close").onclick = null;
    window.onclick = null;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000); // timestamp is in seconds

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

async function createOrders() {
    
    const grid = document.querySelector(".order-grid");

    try {

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const sender = accounts[0];

        const orders = await window.contract.methods.getBuyerOrders(sender).call()
        
        // Check if there are no orders and display the message
        if (orders.length === 0) {
            const noOrdersElement = document.createElement("div");
            noOrdersElement.classList.add("no-orders-container");
            noOrdersElement.innerHTML = `
                <div class="no-orders-emoticon">¯ \\_(ツ)_/¯</div>
                <div class="no-orders-text">&nbsp;&nbsp;No orders found</div>
            `;
            grid.appendChild(noOrdersElement);
            return;
        }
        
        const maxSellDelay = await window.contract.methods.getMaxSellDelay().call();
        const warranty = await window.contract.methods.getWarranty().call();

        const now = Math.floor(Date.now() / 1000);

        for(let i=0; i<orders.length; i++) {
            const order = orders[i];
            
            const buyer = order.buyer;
            const seller = order.seller;
            const id = order.id;
            const price = web3.utils.fromWei(order.price, "ether");
            const creationDate = formatTimestamp(order.creationDate);
            const status = order.status;
            
            var active = false;
            
            label = "Request Refund";

            if(status == "1") {
                active = now - parseInt(order.creationDate) > maxSellDelay;
            }
            else if(status == "2") {
                active = now <= parseInt(order.creationDate) + warranty;
            }
            else {
                active = status == "5";
                label = "Withdraw Refund";
            }

            const card = document.createElement("div");
            card.classList.add("order-card");

            card.innerHTML = `
                <div class="order-section top">
                    <h3 class="order-title">Order #${id}</h3>
                </div>
                <div class="order-section middle">
                    <p class="order-price">
                        <span class="price-amount" >${price}</span>
                        <span class="eth-symbol"><img src="static/assets/eth/colored.svg" alt="ETH" class="eth-logo" draggable="false"></span>
                    </p>
                    <p class="order-date">${creationDate}</p>
                    <p class="order-status">${STATUS_MAP[status]}</p>
                </div>
                <div class="order-section bottom">
                    <button class="refund-btn" ${active ? '' : 'disabled'} seller="${seller}" id="${id}" status="${status}">${label}</button>
                </div>
            `;

            grid.appendChild(card);

            console.log(order);
        }

    } catch (error) {
        console.error(error);
    }
}

function setupModalPopup() {
    const popup = document.getElementById("popup");
    const popupClose = document.getElementById("popup-close");
    const popupMessage = document.getElementById("popup-message");
    
    // Close modal when clicking the X
    popupClose.addEventListener("click", function() {
        popup.style.display = "none";
        document.body.classList.remove("modal-open");
    });
    
    // Close modal when clicking outside of it
    window.addEventListener("click", function(event) {
        if (event.target === popup) {
            popup.style.display = "none";
            document.body.classList.remove("modal-open");
        }
    });
    
    // Setup refund buttons
    const refundButtons = document.querySelectorAll(".refund-btn");
    refundButtons.forEach(button => {
        button.addEventListener("click", async function() {
            
            blockPage();

            try {
                
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const sender = accounts[0];
                
                const seller = this.getAttribute("seller");
                const id = this.getAttribute("id");
                const status = this.getAttribute("status");

                if(status == "5") {
                    await window.contract.methods.withdrawRefund(seller, id).send({from: sender});
                }
                else {
                    await window.contract.methods.requestRefund(seller, id).send({from: sender});
                }

                window.location.reload();

            } catch(error) {

            }

            unblockPage();
        });
    });
}

async function init() {

    blockPage();

    while(!window.contract) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await createOrders();
    setupModalPopup();

    unblockPage();
}

// Set up page after DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);

// In case DOM is already loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 1);
}