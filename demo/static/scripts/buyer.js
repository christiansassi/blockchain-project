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
        <p class="price">€${randomPrice}</p>
        <button>Buy</button>
    `;

    grid.appendChild(card);
});
