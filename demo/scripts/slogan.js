gsap.registerPlugin(ScrollTrigger);

const panels = gsap.utils.toArray(".panel")
let tl = gsap.timeline({
    paused: true
})
tl.to("#text-svg", {
        scale: 100,
        xPercent: -300,
        transformOrigin: "50% 50%",
    })
    .to("#text-svg", {
        scale: "+=30",
        xPercent: "-=110"
    })

panels.forEach(panel => {
    ScrollTrigger.create({
        trigger: panel,
        start: "top top",
        end: "90% 0%",
        scrub: 1,
        pin: true,
        animation: tl.play()
    })
})
