
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Año automático
    const footerYear = document.querySelector("footer p:last-child");

    if (footerYear) {
        footerYear.textContent = `© ${new Date().getFullYear()} IA Challenge`;
    }

    // Animación de aparición
    const elements = document.querySelectorAll(
        ".hero-content, .hero-visual, .section-intro, .feature-card, .quote-section"
    );

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        elements.forEach(element => {
            element.classList.add("reveal");
            observer.observe(element);
        });
    } else {
        elements.forEach(element => element.classList.add("visible"));
    }
});
