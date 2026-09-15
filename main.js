document.addEventListener('DOMContentLoaded', () => {
    initDropdownMenu();
    initProjectionVisualizer();
    initTicketGeneration();
    initHeroScrollSequence();
    initLeafParticles();
    initTypingSequence();
    initAllInOneReveal();
    initScrollAnimations();
    initAccordion();
});

/* =========================================
   Dropdown Menu Toggle (Burger)
   ========================================= */
function initDropdownMenu() {
    const toggleBtn = document.getElementById('burger-toggle');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    if (toggleBtn && fullscreenMenu) {
        // Toggle on click
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBtn.classList.toggle('open');
            fullscreenMenu.classList.toggle('open');
            if (navbar) navbar.classList.toggle('menu-open');
            
            // Toggle body scroll
            if (fullscreenMenu.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                toggleBtn.classList.remove('open');
                fullscreenMenu.classList.remove('open');
                if (navbar) navbar.classList.remove('menu-open');
                document.body.style.overflow = '';
            });
        });
    }

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

/* =========================================
   Interactive Screening Projection Visualizer
   ========================================= */
function initProjectionVisualizer() {
    const canvas = document.getElementById('projection-canvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('seating-slider');

    // Draw initial state
    drawVisualizer(ctx, canvas.width, canvas.height, slider.value);

    // Update on slider move
    slider.addEventListener('input', (e) => {
        // Use requestAnimationFrame for smooth drawing
        requestAnimationFrame(() => {
            drawVisualizer(ctx, canvas.width, canvas.height, e.target.value);
        });
    });
}

function drawVisualizer(ctx, width, height, seatingValue) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Normalize value from 0 to 1 (0 = Front Row A, 1 = Back Row G)
    const normalized = seatingValue / 100;

    // Calculate perspective parameters based on seating
    const fov = 1 + (normalized * 0.5); // Screen looks smaller from the back
    const verticalOffset = 50 - (normalized * 30); // Look up more from the front

    const centerX = width / 2;
    const centerY = height / 2 + verticalOffset;

    const isNocturne = document.body.classList.contains('theme-nocturne');
    const lineColor = isNocturne ? 'rgba(232, 233, 227, 0.2)' : 'rgba(26, 32, 28, 0.2)';
    const screenColor = isNocturne ? 'rgba(232, 233, 227, 0.8)' : 'rgba(26, 32, 28, 0.8)';

    // Background color sync (handled mostly by CSS, but ensure transparent clear)

    // 1. Draw Dome Grid (Perspective lines)
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    // Radial lines
    const numLines = 16;
    for (let i = 0; i < numLines; i++) {
        const angle = (Math.PI * i) / (numLines - 1);
        ctx.moveTo(centerX, centerY);
        const radius = width * 1.5;
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
    ctx.stroke();

    // Concentric arcs (Dome curvature)
    const numArcs = 5;
    for (let i = 1; i <= numArcs; i++) {
        ctx.beginPath();
        const radius = (width / numArcs) * i * fov;
        // Draw upper half circle (dome)
        ctx.arc(centerX, centerY, radius, Math.PI, 0);
        ctx.stroke();
    }

    // 2. Draw Screen
    const screenWidth = width * 0.6 * (1 / fov);
    const screenHeight = screenWidth * 0.4;
    const screenY = centerY - (width * 0.4) - (normalized * 20); // Screen moves relatively based on seating

    ctx.fillStyle = screenColor;

    // Slight curve to the screen to match dome
    ctx.beginPath();
    ctx.moveTo(centerX - screenWidth / 2, screenY);
    ctx.quadraticCurveTo(centerX, screenY - 10, centerX + screenWidth / 2, screenY);
    ctx.lineTo(centerX + screenWidth / 2, screenY + screenHeight);
    ctx.quadraticCurveTo(centerX, screenY + screenHeight - 10, centerX - screenWidth / 2, screenY + screenHeight);
    ctx.closePath();
    ctx.fill();

    // Screen glow (subtle)
    ctx.shadowColor = screenColor;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // 3. Draw Seating Indicator
    ctx.fillStyle = isNocturne ? '#e8e9e3' : '#1a201c';
    ctx.font = '14px Outfit, sans-serif';
    ctx.textAlign = 'center';

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const rowIdx = Math.min(Math.floor(normalized * rowLetters.length), rowLetters.length - 1);

    ctx.fillText(`Simulated View: Row ${rowLetters[rowIdx]}`, centerX, height - 20);
}

// Redraw if theme changes so the canvas lines update
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            const canvas = document.getElementById('projection-canvas');
            const slider = document.getElementById('seating-slider');
            if (canvas && slider) {
                drawVisualizer(canvas.getContext('2d'), canvas.width, canvas.height, slider.value);
            }
        }
    });
});
observer.observe(document.body, { attributes: true });


/* =========================================
   Ticket Generation
   ========================================= */
function initTicketGeneration() {
    const form = document.getElementById('ticket-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const guestName = document.getElementById('guest-name').value;
        const screening = document.getElementById('screening-selection').value;

        // Populate Template
        document.getElementById('tkt-name').textContent = guestName;
        document.getElementById('tkt-screening').textContent = screening;

        const template = document.getElementById('ticket-template');
        const resultContainer = document.getElementById('ticket-result');

        // Show template offscreen for rendering
        template.style.left = '0';
        template.style.position = 'relative';

        // Generate Image using html2canvas
        try {
            const canvas = await html2canvas(template, {
                scale: 2, // High resolution
                backgroundColor: '#f4f6f3'
            });

            // Hide template again
            template.style.left = '-9999px';
            template.style.position = 'absolute';

            // Create image element
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.alt = 'Your CineCafe Ticket';

            // Clear previous and append new
            resultContainer.innerHTML = '';
            resultContainer.appendChild(img);

            // Optional: Create a download link below it
            const downloadLink = document.createElement('a');
            downloadLink.href = img.src;
            downloadLink.download = `CineCafe_Ticket_${guestName.replace(/\s+/g, '_')}.png`;
            downloadLink.textContent = 'Download Digital Keepsake';
            downloadLink.className = 'btn-secondary';
            downloadLink.style.display = 'block';
            downloadLink.style.marginTop = '1rem';
            downloadLink.style.textAlign = 'center';
            resultContainer.appendChild(downloadLink);

            // Smooth scroll to ticket
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            console.error("Ticket generation failed:", error);
            alert("Sorry, we couldn't generate the ticket right now.");
        }
    });
}

/* =========================================
   Hero Scroll Sequence Animation
   ========================================= */
function initHeroScrollSequence() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;
    
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // Zoom out the background while the section is sticky
        gsap.to(heroBg, {
            scrollTrigger: {
                trigger: '.hero-scroll-container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1 
            },
            scale: 1, 
            ease: 'none'
        });
        
        // Fade in the blur overlay at the end of the scroll
        const blurOverlay = document.querySelector('.gsap-blur-overlay');
        if (blurOverlay) {
            gsap.to(blurOverlay, {
                scrollTrigger: {
                    trigger: '.hero-scroll-container',
                    start: 'bottom bottom',
                    end: '+=150', // blur as it scrolls away
                    scrub: true
                },
                opacity: 1,
                ease: 'none'
            });
        }
        
        // Turn navbar text black (or theme text color) when entering the next section
        ScrollTrigger.create({
            trigger: '.dome-viewport',
            start: 'top 60px', // When the dome viewport hits the navbar
            onEnter: () => document.querySelector('.navbar').classList.add('past-hero'),
            onLeaveBack: () => document.querySelector('.navbar').classList.remove('past-hero')
        });
    }
}

/* =========================================
   Flying Leaf Particles (Realistic 3D & Mobile Optimized)
   ========================================= */
const leafImages = [
    'assets/Leaf Animation/leaf-1.png',
    'assets/Leaf Animation/leaf-2.webp',
    'assets/Leaf Animation/leaf-3.webp',
    'assets/Leaf Animation/leaf-4.webp'
];

function initLeafParticles() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection || typeof gsap === 'undefined') return;
    
    const leafCount = window.innerWidth < 768 ? 12 : 25; // Less leaves on mobile for performance
    
    for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf-particle';
        
        // Inject a random image leaf
        const randomImage = leafImages[Math.floor(Math.random() * leafImages.length)];
        leaf.innerHTML = `<img src="${randomImage}" alt="" aria-hidden="true" />`;
        heroSection.appendChild(leaf);
        
        // Depth variables to simulate a camera lens (Foreground, Midground, Background)
        const depth = Math.random();
        
        // Cinematic Size ranges based on depth
        const size = depth > 0.8 ? (Math.random() * 100 + 150) : // Foreground: large (150px - 250px)
                     depth > 0.4 ? (Math.random() * 40 + 80) :   // Midground: medium (80px - 120px)
                     (Math.random() * 20 + 40);                  // Background: small (40px - 60px)
        
        // Opacity and blur based on depth
        const opacity = depth > 0.8 ? 0.4 : (depth > 0.4 ? 1.0 : 0.6); // Increased overall opacity for real images
        const blur = depth > 0.8 ? 10 : (depth > 0.4 ? 0 : 3); // Deeper blur for foreground
        
        gsap.set(leaf, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight - window.innerHeight, // Start higher up
            width: size,
            height: size,
            opacity: opacity,
            filter: `blur(${blur}px)`, // Set static blur, don't animate filter for performance
            rotationX: Math.random() * 360,
            rotationY: Math.random() * 360,
            rotationZ: Math.random() * 360
        });
        
        animateLeaf(leaf, depth);
    }
}

function animateLeaf(leaf, depth) {
    // Leaves closer (high depth) fall faster
    const baseDuration = depth > 0.8 ? 8 : (depth > 0.4 ? 14 : 20);
    const duration = baseDuration + (Math.random() * 4);
    
    // Physics: Random wind direction swaying
    const startX = gsap.getProperty(leaf, "x");
    const swayAmount = (Math.random() * 300) + 100;
    const swayDirection = Math.random() > 0.5 ? 1 : -1;
    
    // 1. Tumbling & Falling Animation
    gsap.to(leaf, {
        y: window.innerHeight + 100,
        rotationX: "+=" + (Math.random() * 720 - 360), // Tumble in 3D
        rotationY: "+=" + (Math.random() * 720 - 360),
        rotationZ: "+=" + (Math.random() * 360 - 180),
        duration: duration,
        ease: "none",
        onComplete: () => {
            gsap.set(leaf, {
                y: -100,
                x: Math.random() * window.innerWidth
            });
            animateLeaf(leaf, depth); // Loop
        }
    });
    
    // 2. Sine Wave Swaying (Left to Right independently of falling)
    gsap.to(leaf, {
        x: startX + (swayAmount * swayDirection),
        duration: duration / (Math.random() * 2 + 1.5), // Sway speed independent of fall speed
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
    });
}

/* =========================================
   Hero Typing Sequence Animation
   ========================================= */
function initTypingSequence() {
    const words = document.querySelectorAll('.seq-word');
    if (!words.length || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    // Create a timeline bound to the scroll of the hero container
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.hero-scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1
        }
    });

    // Sequence each word fading in and out precisely over the scroll distance
    words.forEach((word, index) => {
        // Fade in and slide up slightly
        tl.to(word, { opacity: 1, y: 0, duration: 1, ease: 'power1.out' });
        
        // Hold on screen briefly
        tl.to(word, { opacity: 1, duration: 0.5 });
        
        // If it's not the final highlight phrase, fade it out to make room for the next
        if (index !== words.length - 1) {
            tl.to(word, { opacity: 0, y: -20, duration: 1, ease: 'power1.in' });
        }
    });

    // Clouds start on screen and retreat outwards as user starts scrolling
    tl.to('.cloud-right', {
        x: '100vw', // Retreats fully offscreen to the right
        duration: 3, 
        ease: 'power2.inOut'
    }, 0); 
    tl.to('.cloud-left', {
        x: '-100vw', // Retreats fully offscreen to the left
        duration: 3, 
        ease: 'power2.inOut'
    }, 0); // Absolute time 0 ensures it doesn't push the text animations back!
}

/* =========================================
   All In One Place Reveal Animation
   ========================================= */
function initAllInOneReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.dome-viewport',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1
        }
    });

    // 1. Reveal "ALL IN ONE PLACE"
    tl.to('.all-in-one-title', {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
    });
    
    // Hold it on screen briefly
    tl.to('.all-in-one-title', { opacity: 1, duration: 0.5 });
    
    // 2. Fade it out upwards
    tl.to('.all-in-one-title', {
        opacity: 0,
        filter: 'blur(10px)',
        scale: 1.05,
        y: -40,
        duration: 1.5,
        ease: 'power2.in'
    });

    // Enable clicks on options
    tl.set('.looking-for-container', { pointerEvents: 'auto' });

    // 3. Reveal "WHAT ARE YOU LOOKING FOR?"
    tl.to('.looking-for-title', {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
    }, '-=0.5'); // Start as the previous title is fading out

    // 4. Reveal the options with a stagger
    const options = document.querySelectorAll('.looking-options li');
    if (options.length) {
        tl.to(options, {
            opacity: 1,
            y: 0,
            duration: 1.5,
            stagger: 0.4,
            ease: 'back.out(1.5)'
        }, '-=0.5');
    }
}

/* =========================================
   New Scroll Animations
   ========================================= */
function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Fade Up Elements
    gsap.utils.toArray('.gsap-fade-up').forEach(elem => {
        gsap.fromTo(elem, 
            { opacity: 0, y: 40 },
            { 
                scrollTrigger: { trigger: elem, start: 'top 80%' },
                opacity: 1, y: 0, duration: 1, ease: 'power2.out'
            }
        );
    });

    // Stagger Cards
    gsap.utils.toArray('.gourmet-grid').forEach(grid => {
        const cards = grid.querySelectorAll('.gsap-stagger-card');
        if (cards.length) {
            gsap.fromTo(cards, 
                { opacity: 0, y: 30 },
                { 
                    scrollTrigger: { trigger: grid, start: 'top 80%' },
                    opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out'
                }
            );
        }
    });

    // Slide Left / Right
    gsap.utils.toArray('.gsap-slide-left').forEach(elem => {
        gsap.fromTo(elem, 
            { opacity: 0, x: -50 },
            { 
                scrollTrigger: { trigger: elem, start: 'top 80%' },
                opacity: 1, x: 0, duration: 1, ease: 'power2.out'
            }
        );
    });
    gsap.utils.toArray('.gsap-slide-right').forEach(elem => {
        gsap.fromTo(elem, 
            { opacity: 0, x: 50 },
            { 
                scrollTrigger: { trigger: elem, start: 'top 80%' },
                opacity: 1, x: 0, duration: 1, ease: 'power2.out'
            }
        );
    });
}

/* =========================================
   FAQ Accordion
   ========================================= */
function initAccordion() {
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            // Optional: Close others for accordion style
            accordions.forEach(other => {
                if (other !== this) {
                    other.classList.remove('active');
                    other.nextElementSibling.style.maxHeight = null;
                }
            });

            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}
