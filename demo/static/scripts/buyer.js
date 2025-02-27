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
    let b = a;
    let c = (a.toString().split('.')[1] || '').length;

    // Reduce the decimal precision progressively
    while (true) {

        if((parseFloat(a.toFixed(c)) * eth_price).toFixed(2) !== "0.01")
        {
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

    const randomPrice = (getRandomArbitrary(1, 1000) / 100).toFixed(2); // Random price between €1 and €100

    card.innerHTML = `
        <img src="${product[0]}" alt="Product Image" class="product-image">
        <h3>${product[1]}</h3>
        <p>${getRandomStars()}</p>
        <p class="price">
            <span class="price-amount" price=${randomPrice}>-</span>
            <span class="eth-symbol"><img src="static/assets/eth/colored.svg" alt="ETH" class="eth-logo"></span>
        </p>
        <button>Buy</button>
    `;

    grid.appendChild(card);
});

async function init_price_updates() {

    await update_prices();

    setInterval(async () => {
        await update_prices();
    }, 5000);
}

init_price_updates();