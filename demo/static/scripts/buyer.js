async function get_eth_price() {
    const url = 'https://api.binance.com/api/v3/ticker/price?symbol=ETHEUR';

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.price;
    } catch (error) {
        console.error('Error fetching ETH price:', error);
        return null;
    }
}

async function update_prices() {
    const eth_price = await get_eth_price(); // Fetch ETH price

    let a = 0.01 / eth_price;
    let c = (a.toString().split('.')[1] || '').length;

    // Reduce the decimal precision progressively
    while (true) {
        if((parseFloat(a.toFixed(c)) * eth_price).toFixed(2) !== "0.01") {
            c = c + 1;
            break;
        }
        c--; // Decrease precision until the amount changes
    }

    console.log(eth_price);

    // Loop through elements with class "price"
    Array.from(document.getElementsByClassName("price-amount")).forEach(item => {
        // Calculate price in ETH
        let price_in_eth = item.attributes["price"].value / eth_price;

        // Update the text with price in ETH using template literals
        item.innerText = parseFloat(price_in_eth.toFixed(c));
    });
}

// Helper function to generate a random number between min and max
const getRandomArbitrary = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Function to shuffle an array in-place (Fisher-Yates algorithm)
const shuffle = array => {
    let currentIndex = array.length;

    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Swap elements
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
};

// Item descriptions for the back of the cards
const itemDescriptions = {
    "Banana": "Thrown on the track to send racers that hit it with a spin.",
    "Blooper": "Squirts ink on opponents ahead of the user, obscuring their vision.",
    "Bob Omb": "Thrown on the track and explodes after a few seconds or coming into contact with an obstacle or racer, in which they lose their item.",
    "Bullet Bill": "Temporarily transforms the kart into a fast Bullet Bill that auto-pilots the track, grants invincibility and gains the ability to flip racers over and leaving them itemless.",
    "Fake Item Block": "Thrown on the track to flip over any racer that mistakes it for an Item Box.",
    "Golden Mushroom": "Grants unlimited use of a Mushroom for 7.5 seconds.",
    "Green Shell": "Thrown on the track and travels straight, hitting walls, obstacles and flipping racers in its path.",
    "Lightning": "Strikes all opponents when used, dropping their items, shrinking them and slowing them down. Racers in the lower postions recover quicker.",
    "Mega Mushroom": "Enlargens the racer for 7.5 seconds, allowing them to flatten racers that come into contact. It also protects from all items except Stars, Bullet Bills and Lightning.",
    "Mushroom": "Used for a temporary speed boost which also negates speed loss when off-road.",
    "Pow Block": "Spawns a POW Block on opponents ahead of the user, which periodically flattens. On the third strike, it flips them over and leaves them itemless. It can be avoided by shaking the controller, doing a trick or being in mid-air.",
    "Red Shell": "Like a Green Shell, but it homes on an opponent in front when thrown forwards.",
    "Spiny Shell": "Pursues the leader and strikes them and any nearby racers in a massive explosion.",
    "Super Star": "For 7.5 seconds, the kart's speed increases, invincibility is granted, and racers that come into contact will flip over.",
    "Thunder Cloud": "Spawns a Thunder Cloud above the user, speeding them up and negating speed loss when off-road. They can pass it onto nearby racers, with the holder getting shocked like Lightning after 10 seconds.",
    "Triple Bananas": "3 Bananas stack behind the racer's kart.",
    "Triple Green Shells": "3 Green Shells rotate around the racer's kart.",
    "Triple Mushrooms": "3 Mushrooms are given. It is the default item in Time Trials.",
    "Triple Red Shells": "3 Red Shells rotate around the racer's kart."
};

// Extra details for the back of cards
const getItemDetails = (itemName) => {
    const rarity = getRandomArbitrary(1, 10);
    const games = getRandomArbitrary(1, 8);
    return `
        ${itemDescriptions[itemName] || "-"}
    `;
};

// Prefix for the images
const prefix = "../static/assets/products/";

// List of product images
let products = [
    "banana.webp", "blooper.webp", "bob_omb.webp", "bullet_bill.webp",
    "fake_item_block.webp", "golden_mushroom.webp", "green_shell.webp", "lightning.webp",
    "mega_mushroom.webp", "mushroom.webp", "pow_block.webp", "red_shell.webp",
    "spiny_shell.webp", "super_star.webp", "thunder_cloud.webp", "triple_bananas.webp",
    "triple_green_shells.webp", "triple_mushrooms.webp", "triple_red_shells.webp"
];

// Shuffle the products array
shuffle(products);

// Map product names and image paths to formatted structure
products = products.map(product => {
    const formattedName = product
        .replace(/\.[^.]+$/, '') // Remove file extension
        .replace(/_/g, ' ')      // Replace underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize each word

    return [`${prefix}${product}`, formattedName];
});

// Select the grid container for appending product cards
const grid = document.querySelector(".product-grid");

// Function to generate random star ratings (1 to 5 stars)
const getRandomStars = () => {
    const rating = Math.floor(Math.random() * 5) + 1;
    return `<span class="stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>`;
};

// Create product cards dynamically
products.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const productName = product[1];
    const itemDetails = getItemDetails(productName);
    const randomPrice = (getRandomArbitrary(1, 1000) / 100).toFixed(2); // Random price between €1 and €100

    // Create the inner container for flip effect
    const cardInner = document.createElement("div");
    cardInner.classList.add("card-inner");

    // Create front of card
    const cardFront = document.createElement("div");
    cardFront.classList.add("card-front");
    cardFront.innerHTML = `
        <img src="${product[0]}" alt="Product Image" class="product-image" draggable="false">
        <h3>${productName}</h3>
        <p>${getRandomStars()}</p>
        <p class="price">
            <span class="price-amount" price=${randomPrice}>-</span>
            <span class="eth-symbol"><img src="static/assets/eth/colored.svg" alt="ETH" class="eth-logo" draggable="false"></span>
        </p>
        <button class="buy-btn">Buy</button>
    `;

    // Create back of card - just text content, no buttons
    const cardBack = document.createElement("div");
    cardBack.classList.add("card-back");
    cardBack.innerHTML = `
        <h3>${productName}</h3>
        <div class="card-back-content">
            <p>${itemDetails}</p>
        </div>
    `;

    // Append front and back to cardInner
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);

    // Append cardInner to card
    card.appendChild(cardInner);

    grid.appendChild(card);
});

// Track the currently flipped card
let currentlyFlippedCard = null;

// Add event listeners for card flipping
function setupCardFlip() {
    const cards = document.querySelectorAll(".product-card");
    const buyButtons = document.querySelectorAll(".buy-btn");

    cards.forEach(card => {
        card.addEventListener("click", function(event) {
            // If there's already a card flipped and it's not this one
            if (currentlyFlippedCard && currentlyFlippedCard !== this) {
                // Unflip the currently flipped card and enable the button
                currentlyFlippedCard.classList.remove("flipped");
                const currentlyFlippedButton = currentlyFlippedCard.querySelector(".buy-btn");
                currentlyFlippedButton.disabled = false;  // Re-enable button
            }
            
            // Toggle the clicked card
            this.classList.toggle("flipped");

            // Disable or enable the button based on the card flip state
            const buyButton = this.querySelector(".buy-btn");
            if (this.classList.contains("flipped")) {
                buyButton.disabled = true;  // Disable button when card is flipped
            } else {
                buyButton.disabled = false;  // Re-enable button when card is flipped back
            }
            
            // Update the currently flipped card reference
            if (this.classList.contains("flipped")) {
                currentlyFlippedCard = this;
            } else {
                currentlyFlippedCard = null;
            }
        });
    });

    // Prevent buy button from triggering card flip
    buyButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.stopPropagation();
            alert("Item added to cart!");
        });
    });
}

function update_progress_bar(value, max_value) {
    let bar = document.getElementsByClassName("eth-bar")[0];
    bar.style.width = parseInt(value * 100 / max_value) + '%';
}

async function init_price_updates() {

    let progress = 0;
    let max_progress = 5;
    
    update_progress_bar(progress, max_progress);
    await update_prices();

    setInterval(async () => {

        update_progress_bar(progress, max_progress);

        if(progress == max_progress) {
            progress = 0;
            await update_prices();
        }
        else {
            progress = progress + 1;
        }

    }, 1000);
}

// Initialize everything
init_price_updates();

// Set up card flip after DOM is fully loaded
document.addEventListener("DOMContentLoaded", setupCardFlip);

// In case DOM is already loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(setupCardFlip, 1);
}