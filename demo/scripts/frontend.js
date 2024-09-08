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
    for (let object of objects) {
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

function switchToDark() {
    const topBar = document.getElementsByClassName("top-bar")[0];
    topBar.style.backgroundColor = "black";
    topBar.style.border = "1px solid rgba(30, 30, 30)";

    const textButton = document.getElementsByClassName("text")[0];
    textButton.style.backgroundColor = "white";
    textButton.style.color = "black";

    const logoImg = document.getElementsByClassName("logo")[0].getElementsByTagName("img")[0];
    logoImg.src = "assets/logo-dark-mode.png";

    document.getElementById("page-icon").href = "assets/logo-dark-mode.png";
}

function switchToLight() {

    const topBar = document.getElementsByClassName("top-bar")[0];
    topBar.style.backgroundColor = "white";
    topBar.style.border = "1px solid rgb(225, 225, 225)";

    const textButton = document.getElementsByClassName("text")[0];
    textButton.style.backgroundColor = "black";
    textButton.style.color = "white";

    const logoImg = document.getElementsByClassName("logo")[0].getElementsByTagName("img")[0];
    logoImg.src = "assets/logo-extended-light-mode.png";

    document.getElementById("page-icon").href = "assets/logo-light-mode.png";
}

function handleScroll() {

    const scrollY = window.scrollY || window.pageYOffset;
    const scrollThreshold = 2260;

    if (scrollY > scrollThreshold)
        switchToDark();
    else
        switchToLight();
}

function init() {
    observeAnimatedValues();
    window.addEventListener("scroll", handleScroll);
    handleScroll();
}

document.addEventListener("DOMContentLoaded", init);
