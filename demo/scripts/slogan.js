gsap.registerPlugin(ScrollTrigger);

const panels = gsap.utils.toArray(".panel");
let tl = gsap.timeline({
    paused: false, 
    scrollTrigger: {
        trigger: ".panel",
        start: "top top",
        end: "90% 0%",
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
        immediateRender: false // Prevents timeline from rendering immediately
    }
});

tl.to("#text-svg", {
        scale: 100,
        xPercent: -300,
        transformOrigin: "50% 50%",
        immediateRender: false
    })
    .to("#text-svg", {
        scale: "+=30",
        xPercent: "-=110",
        immediateRender: false
    });

// Check the scroll position on page load
window.addEventListener('load', () => {
    const scrollY = window.scrollY || window.pageYOffset;

    if (scrollY > 2260) {
        // Set the animation to its final state if scroll position is greater than 2260
        tl.progress(1); // Jump to the end of the animation
    } else {
        // Normal behavior when scroll is less than 2260
        ScrollTrigger.refresh();
    }
});

// Refresh ScrollTrigger on window resize
window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
});
