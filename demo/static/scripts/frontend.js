// Theme
var isHovering = false;

// Light theme
var hasSwitchedToLight = false;

const topBar_backgroundColor_light = "white";
const topBar_border_light = "1px solid rgba(225, 225, 225)";

const runDemoButton_backgroundColor_light = "black";
const runDemoButton_color_light = "white";

const logoImg_light = "static/assets/logo-extended-light-mode.png";
const pageIcon_light = "static/assets/logo-light-mode.png";

// Dark theme
var hasSwitchedToDark = false;

const topBar_backgroundColor_dark = "black";
const topBar_border_dark = "1px solid rgba(30, 30, 30)";

const runDemoButton_backgroundColor_dark = "white";
const runDemoButton_color_dark = "black";

const logoImg_dark = "static/assets/logo-dark-mode.png";
const pageIcon_dark = "static/assets/logo-dark-mode.png";

// Animated values logic
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function observeAnimatedValues() {

    const objects = document.getElementsByClassName("animated-value");

    for (let object of objects) 
    {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateValue(object, 0, object.textContent, 2500);
                    observer.unobserve(entry.target);
                }
            });
        });

        observer.observe(object);
    }
}

// Animated elements logic
function observeAnimatedElements() {

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated-element');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.content').forEach(element => {
        observer.observe(element);
    });

}

// Theme switching logic
function switchToLight(force) {

    if(hasSwitchedToLight && !force)
        return

    hasSwitchedToLight = true;
    hasSwitchedToDark = false;

    const topBar = document.getElementsByClassName("top-bar")[0];
    topBar.style.backgroundColor = topBar_backgroundColor_light;
    topBar.style.border = topBar_border_light;

    if(!isHovering)
    {
        const runDemoButton = document.getElementsByClassName("run-demo")[0];
        runDemoButton.style.backgroundColor = runDemoButton_backgroundColor_light;
        runDemoButton.style.color = runDemoButton_color_light;
    }

    const logoImg = document.getElementsByClassName("logo")[0].getElementsByTagName("img")[0];
    logoImg.src = logoImg_light;

    document.getElementById("page-icon").href = pageIcon_light;
}

function switchToDark(force) {

    if(hasSwitchedToDark && !force)
        return

    hasSwitchedToDark = true;
    hasSwitchedToLight = false;

    const topBar = document.getElementsByClassName("top-bar")[0];
    topBar.style.backgroundColor = topBar_backgroundColor_dark;
    topBar.style.border = topBar_border_dark;

    if(!isHovering)
    {
        const runDemoButton = document.getElementsByClassName("run-demo")[0];
        runDemoButton.style.backgroundColor = runDemoButton_backgroundColor_dark;
        runDemoButton.style.color = runDemoButton_color_dark;
    }

    const logoImg = document.getElementsByClassName("logo")[0].getElementsByTagName("img")[0];
    logoImg.src = logoImg_dark;

    document.getElementById("page-icon").href = pageIcon_dark;
}

function switchTheme(force) {

    if (typeof force !== 'boolean')
        force = false;

    const scrollY = window.scrollY || window.pageYOffset;
    const scrollThreshold = 2260;

    if (scrollY > scrollThreshold)
        switchToDark(force);
    else
        switchToLight(force);
}

// Init
function initMetaMask() {
    observeAnimatedValues();

    window.addEventListener("scroll", switchTheme);
    switchTheme();

    // Fix hover problem
    const element = document.getElementsByClassName("run-demo")[0];

    element.addEventListener('mouseover', () => {
        isHovering = true;
        element.style.backgroundColor = '#22fe1a';
        element.style.color = 'black';
    });

    element.addEventListener('mouseout', () => {
        isHovering = false;
        switchTheme(true);
    });

    observeAnimatedElements()
}

// Start when document is loaded
document.addEventListener("DOMContentLoaded", initMetaMask);
