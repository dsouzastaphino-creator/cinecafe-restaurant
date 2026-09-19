/* =========================================
   CineCafe — main.js
   Full interactive layer
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Detect which page we're on
    const isHomePage = !!document.querySelector('.hero-scroll-container');

    // Always init — present on all pages
    initDropdownMenu();
    initAccordion();
    initScrollAnimations(); // Runs on all pages (sub-pages have GSAP classes too)

    // Homepage-only features
    if (isHomePage) {
        initProjectionVisualizer();
        initTicketGeneration();
        initHeroScrollSequence();
        initLeafParticles();
        initTypingSequence();
        initAllInOneReveal();
        initShowtimeCards();
        initSeatCounter('seat-minus', 'seat-plus', 'seat-count', 6, 1);
        initSeatCounter('table-minus', 'table-plus', 'table-count', 20, 1);
        initPriceSummary();
        initTableForm();
        initInquiryForm();
        initNewsletterForm();
        initHeroPersistentCTA();
        prefillFromShowtime();
        initEventCTAs();
    }
});

/* =========================================
   Navbar & Burger Menu
   ========================================= */
function initDropdownMenu() {
    const toggleBtn = document.getElementById('burger-toggle');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-cta-btn');
    const navbar = document.querySelector('.navbar');

    if (toggleBtn && fullscreenMenu) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = fullscreenMenu.classList.toggle('open');
            toggleBtn.classList.toggle('open', isOpen);
            if (navbar) navbar.classList.toggle('menu-open', isOpen);
            toggleBtn.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                fullscreenMenu.classList.remove('open');
                toggleBtn.classList.remove('open');
                if (navbar) navbar.classList.remove('menu-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullscreenMenu.classList.contains('open')) {
                fullscreenMenu.classList.remove('open');
                toggleBtn.classList.remove('open');
                if (navbar) navbar.classList.remove('menu-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                toggleBtn.focus();
            }
        });
    }

    // Navbar scroll state
    if (navbar) {
        const onScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
    }
}

/* =========================================
   Hero Persistent CTA
   ========================================= */
function initHeroPersistentCTA() {
    const heroCTA = document.getElementById('hero-persistent-cta');
    if (!heroCTA) return;

    let shown = false;
    const showOnScroll = () => {
        // Show after user has scrolled ~30% into the hero sequence
        const scrolledPct = window.scrollY / (window.innerHeight * 1.5);
        if (scrolledPct > 0.3 && !shown) {
            heroCTA.classList.add('visible');
            heroCTA.setAttribute('aria-hidden', 'false');
            shown = true;
        } else if (scrolledPct <= 0.3 && shown) {
            heroCTA.classList.remove('visible');
            heroCTA.setAttribute('aria-hidden', 'true');
            shown = false;
        }
    };

    window.addEventListener('scroll', showOnScroll, { passive: true });
}

/* =========================================
   Showtime Cards — Prefill ticket form
   ========================================= */
function initShowtimeCards() {
    const bookBtns = document.querySelectorAll('.btn-showtime');
    bookBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const filmValue = btn.getAttribute('data-film');
            if (filmValue) {
                prefillTicketForm(filmValue);
            }
            // Smooth scroll to the booking form
            const target = document.getElementById('ticket-booking');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function prefillTicketForm(filmValue) {
    const select = document.getElementById('screening-selection');
    if (!select) return;
    // Try to match the option value
    const options = Array.from(select.options);
    const match = options.find(opt => opt.value.includes(filmValue.split(' — ')[0]));
    if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event('change'));
    }
}

function prefillFromShowtime() {
    // If landing on page with ?show= query param, prefill
    const params = new URLSearchParams(window.location.search);
    if (params.get('show')) {
        prefillTicketForm(params.get('show'));
    }
}

/* =========================================
   Seat Counter — Generic
   ========================================= */
function initSeatCounter(minusId, plusId, displayId, max = 6, min = 1) {
    const minusBtn = document.getElementById(minusId);
    const plusBtn = document.getElementById(plusId);
    const display = document.getElementById(displayId);
    if (!minusBtn || !plusBtn || !display) return;

    let count = parseInt(display.textContent) || 2;

    const update = (newCount) => {
        count = Math.max(min, Math.min(max, newCount));
        display.textContent = count;
        minusBtn.disabled = count <= min;
        plusBtn.disabled = count >= max;
        if (displayId === 'seat-count') {
            updatePriceSummary();
        }
    };

    minusBtn.addEventListener('click', () => update(count - 1));
    plusBtn.addEventListener('click', () => update(count + 1));
    update(count); // Initialize button states
}

/* =========================================
   Price Summary Calculator
   ========================================= */
function initPriceSummary() {
    const screeningSelect = document.getElementById('screening-selection');
    const diningCheckbox = document.getElementById('add-dining');

    if (screeningSelect) {
        screeningSelect.addEventListener('change', updatePriceSummary);
    }
    if (diningCheckbox) {
        diningCheckbox.addEventListener('change', updatePriceSummary);
    }
}

function updatePriceSummary() {
    const screeningSelect = document.getElementById('screening-selection');
    const diningCheckbox = document.getElementById('add-dining');
    const priceDisplay = document.getElementById('estimated-price');
    const seatDisplay = document.getElementById('seat-count');

    if (!screeningSelect || !priceDisplay) return;

    const selectedOption = screeningSelect.options[screeningSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        priceDisplay.textContent = 'Select a screening to see pricing';
        return;
    }

    // Extract price from option value string like "Film — Date | ₹499/seat"
    const priceMatch = selectedOption.value.match(/₹(\d+)\/seat/);
    if (!priceMatch) return;

    const seatPrice = parseInt(priceMatch[1]);
    const seats = parseInt(seatDisplay?.textContent) || 2;
    const diningAddon = diningCheckbox?.checked ? 299 * seats : 0;
    const total = (seatPrice * seats) + diningAddon;

    priceDisplay.textContent = `₹${total.toLocaleString('en-IN')}${diningAddon ? ` (incl. dining add-on)` : ''}`;
}

/* =========================================
   Ticket Generation
   ========================================= */
function initTicketGeneration() {
    const form = document.getElementById('ticket-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const guestName = document.getElementById('guest-name').value.trim();
        const screening = document.getElementById('screening-selection').value;
        const seats = document.getElementById('seat-count').textContent;
        const diningChecked = document.getElementById('add-dining')?.checked;

        if (!guestName) {
            showFieldError('guest-name', 'Please enter your name');
            return;
        }
        if (!screening) {
            showFieldError('screening-selection', 'Please select a screening');
            return;
        }

        // Generate random ticket ID
        const ticketId = 'ADM-' + String(Math.floor(Math.random() * 9000) + 1000);

        // Populate template
        document.getElementById('tkt-name').textContent = guestName;
        document.getElementById('tkt-screening').textContent = screening.split(' | ')[0];
        document.getElementById('tkt-seats').textContent = `${seats} seat${seats > 1 ? 's' : ''}`;
        document.querySelector('.ticket-id').textContent = ticketId;

        const diningRow = document.getElementById('tkt-dining-row');
        const diningVal = document.getElementById('tkt-dining');
        if (diningChecked && diningRow && diningVal) {
            diningVal.textContent = `Cinema Combo × ${seats}`;
            diningRow.style.display = '';
        } else if (diningRow) {
            diningRow.style.display = 'none';
        }

        const template = document.getElementById('ticket-template');
        const previewArea = document.getElementById('ticket-preview-area');
        const resultContainer = document.getElementById('ticket-result');

        // Show submit loading state
        const submitBtn = document.getElementById('generate-ticket-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Generating...';
        submitBtn.disabled = true;

        // Show template temporarily for rendering
        template.style.cssText = 'position: relative; left: auto; opacity: 1; z-index: 1; pointer-events: auto;';

        try {
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(template, {
                scale: 2,
                backgroundColor: '#f4f6f3',
                useCORS: true
            });

            // Hide template again
            template.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0.01; z-index: -9999; pointer-events: none;';

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.alt = `CineCafe Ticket for ${guestName}`;

            // Show in preview area
            if (previewArea) {
                previewArea.innerHTML = '';
                previewArea.appendChild(img.cloneNode());
                // Style the preview image
                previewArea.querySelector('img').style.cssText = 'width:100%; border-radius:8px; box-shadow: var(--shadow-color);';
            }

            // Also show in result container (mobile — since preview is hidden on small screens)
            resultContainer.innerHTML = '';
            const mobileImg = img.cloneNode();
            mobileImg.style.cssText = 'width:100%; border-radius:8px;';
            resultContainer.appendChild(mobileImg);

            // Download link
            const downloadLink = document.createElement('a');
            downloadLink.href = img.src;
            downloadLink.download = `CineCafe_${ticketId}_${guestName.replace(/\s+/g, '_')}.png`;
            downloadLink.textContent = 'Download Digital Ticket';
            downloadLink.className = 'btn-secondary';
            downloadLink.style.cssText = 'display: inline-flex; margin-top: 1.25rem; width: 100%; justify-content: center;';
            resultContainer.appendChild(downloadLink);

            // Scroll to result on mobile
            if (window.innerWidth < 900) {
                resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

        } catch (error) {
            console.error('Ticket generation failed:', error);
            resultContainer.innerHTML = `<div style="padding: 1.5rem; border: 1px solid rgba(150,120,80,0.4); border-radius: 12px; text-align: center;">
                <p style="opacity: 0.8; margin:0;">✓ Booking received! Your ticket will be sent to your WhatsApp within 5 minutes. Ticket ID: <strong>${ticketId}</strong></p>
            </div>`;
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.style.borderBottomColor = '#e53e3e';
    field.focus();
    setTimeout(() => { field.style.borderBottomColor = ''; }, 3000);
}

/* =========================================
   Table Reservation Form
   ========================================= */
function initTableForm() {
    const form = document.getElementById('table-form');
    const successMsg = document.getElementById('table-success');
    if (!form) return;

    // Set min date to today
    const dateInput = document.getElementById('table-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('table-name').value.trim();
        const phone = document.getElementById('table-phone').value.trim();
        const date = document.getElementById('table-date').value;
        const time = document.getElementById('table-time').value;

        if (!name) { showFieldError('table-name', 'Required'); return; }
        if (!phone) { showFieldError('table-phone', 'Required'); return; }
        if (!date) { showFieldError('table-date', 'Required'); return; }
        if (!time) { showFieldError('table-time', 'Required'); return; }

        // In production, this would submit to a backend / WhatsApp API
        form.style.display = 'none';
        if (successMsg) {
            successMsg.classList.remove('hidden');
        }
    });
}

/* =========================================
   General Inquiry / Events Form
   ========================================= */
function initInquiryForm() {
    const form = document.getElementById('inquiry-form');
    const successMsg = document.getElementById('inquiry-success');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('inq-name').value.trim();
        if (!name) { showFieldError('inq-name', 'Required'); return; }

        form.style.display = 'none';
        if (successMsg) {
            successMsg.classList.remove('hidden');
        }
    });
}

/* =========================================
   Event CTA buttons — prefill inquiry subject
   ========================================= */
function initEventCTAs() {
    const eventCTAs = document.querySelectorAll('.event-cta, [data-subject]');
    eventCTAs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subject = btn.getAttribute('data-subject');
            if (!subject) return;
            const subjectSelect = document.getElementById('inq-subject');
            if (subjectSelect) {
                const options = Array.from(subjectSelect.options);
                const match = options.find(opt => opt.text.includes(subject.split(' ')[0]));
                if (match) subjectSelect.value = match.value;
            }
        });
    });
}

/* =========================================
   Newsletter Form
   ========================================= */
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const success = document.getElementById('newsletter-success');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletter-email').value;
        if (!email || !email.includes('@')) {
            showFieldError('newsletter-email', 'Valid email required');
            return;
        }
        form.style.display = 'none';
        if (success) success.classList.remove('hidden');
    });
}

/* =========================================
   Interactive Projection Visualizer
   ========================================= */
function initProjectionVisualizer() {
    const canvas = document.getElementById('projection-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('seating-slider');
    const rowLabel = document.getElementById('current-row-label');

    drawVisualizer(ctx, canvas.width, canvas.height, slider.value);

    slider.addEventListener('input', (e) => {
        requestAnimationFrame(() => {
            drawVisualizer(ctx, canvas.width, canvas.height, e.target.value);
            // Update live label
            const normalized = e.target.value / 100;
            const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            const idx = Math.min(Math.floor(normalized * rows.length), rows.length - 1);
            if (rowLabel) rowLabel.textContent = rows[idx];
        });
    });
}

function drawVisualizer(ctx, width, height, seatingValue) {
    ctx.clearRect(0, 0, width, height);

    const normalized = seatingValue / 100;
    const fov = 1 + (normalized * 0.5);
    const verticalOffset = 50 - (normalized * 30);
    const centerX = width / 2;
    const centerY = height / 2 + verticalOffset;

    const isNocturne = document.body.classList.contains('theme-nocturne');
    const lineColor = isNocturne ? 'rgba(243, 245, 251, 0.12)' : 'rgba(53, 50, 48, 0.1)';
    const screenColor = isNocturne ? 'rgba(243, 245, 251, 0.85)' : 'rgba(53, 50, 48, 0.85)';
    const accentColor = 'rgba(150, 120, 80, 0.6)';

    // 1. Dome Grid (radial lines)
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    const numLines = 20;
    for (let i = 0; i < numLines; i++) {
        const angle = (Math.PI * i) / (numLines - 1);
        ctx.moveTo(centerX, centerY);
        const radius = width * 1.5;
        ctx.lineTo(
            centerX + Math.cos(angle) * radius,
            centerY - Math.sin(angle) * radius
        );
    }
    ctx.stroke();

    // Concentric arcs
    const numArcs = 6;
    for (let i = 1; i <= numArcs; i++) {
        ctx.beginPath();
        ctx.strokeStyle = i === Math.round(normalized * numArcs + 1) ? accentColor : lineColor;
        ctx.lineWidth = i === Math.round(normalized * numArcs + 1) ? 2 : 1;
        const radius = (width / numArcs) * i * fov;
        ctx.arc(centerX, centerY, radius, Math.PI, 0);
        ctx.stroke();
    }

    // 2. Screen
    const screenWidth = width * 0.55 * (1 / fov);
    const screenHeight = screenWidth * 0.38;
    const screenY = centerY - (width * 0.38) - (normalized * 20);

    // Screen glow
    ctx.shadowColor = screenColor;
    ctx.shadowBlur = 15;

    ctx.fillStyle = screenColor;
    ctx.beginPath();
    ctx.moveTo(centerX - screenWidth / 2, screenY);
    ctx.quadraticCurveTo(centerX, screenY - 12, centerX + screenWidth / 2, screenY);
    ctx.lineTo(centerX + screenWidth / 2, screenY + screenHeight);
    ctx.quadraticCurveTo(centerX, screenY + screenHeight - 8, centerX - screenWidth / 2, screenY + screenHeight);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Row indicator
    const textColor = isNocturne ? '#f3f5fb' : '#353230';
    ctx.fillStyle = textColor;
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const rowIdx = Math.min(Math.floor(normalized * rows.length), rows.length - 1);
    ctx.fillText(`Simulated View · Row ${rows[rowIdx]}`, centerX, height - 16);

    // 4. Viewer dot (seat position)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(150, 120, 80, 0.8)';
    ctx.arc(centerX, centerY + 10 + (normalized * 30), 5, 0, Math.PI * 2);
    ctx.fill();
}

// Redraw on theme change
const themeObserver = new MutationObserver((mutations) => {
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
themeObserver.observe(document.body, { attributes: true });

/* =========================================
   Hero Scroll Sequence Animation (GSAP)
   ========================================= */
function initHeroScrollSequence() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Parallax zoom on hero bg
        gsap.to(heroBg, {
            scrollTrigger: {
                trigger: '.hero-scroll-container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.5
            },
            scale: 1,
            ease: 'none'
        });

        // Blur overlay fade in at end of hero scroll
        const blurOverlay = document.querySelector('.gsap-blur-overlay');
        if (blurOverlay) {
            gsap.to(blurOverlay, {
                scrollTrigger: {
                    trigger: '.hero-scroll-container',
                    start: '90% bottom',
                    end: 'bottom bottom',
                    scrub: true
                },
                opacity: 1,
                ease: 'none'
            });
        }
        
        // Switch navbar to dark text when dome section arrives
        ScrollTrigger.create({
            trigger: '.dome-viewport',
            start: 'top 80px',
            onEnter: () => document.querySelector('.navbar')?.classList.add('past-hero'),
            onLeaveBack: () => document.querySelector('.navbar')?.classList.remove('past-hero')
        });
    }
}

/* =========================================
   Typing Sequence Animation (GSAP)
   ========================================= */
function initTypingSequence() {
    const words = document.querySelectorAll('.seq-word');
    if (!words.length || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.hero-scroll-container',
            start: 'top top',
            end: '85% bottom',
            scrub: 1.2
        }
    });

    words.forEach((word, index) => {
        tl.to(word, { opacity: 1, y: 0, duration: 1, ease: 'power1.out' });
        tl.to(word, { opacity: 1, duration: 0.5 });
        if (index !== words.length - 1) {
            tl.to(word, { opacity: 0, y: -20, duration: 0.8, ease: 'power1.in' });
        }
    });

    // Add empty space so the last word holds on screen before dome viewport covers it
    tl.to({}, { duration: 4 });

    // Clouds retreat outward
    tl.to('.cloud-right', { x: '100vw', duration: 4.5, ease: 'power2.inOut' }, 0);
    tl.to('.cloud-left', { x: '-100vw', duration: 4.5, ease: 'power2.inOut' }, 0);
}

/* =========================================
   All In One Place Reveal (GSAP)
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

    // Reveal "ALL IN ONE PLACE"
    tl.to('.all-in-one-title', {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
    });
    tl.to('.all-in-one-title', { opacity: 1, duration: 0.5 });

    // Fade out title
    tl.to('.all-in-one-title', {
        opacity: 0,
        filter: 'blur(10px)',
        scale: 1.05,
        y: -40,
        duration: 1.2,
        ease: 'power2.in'
    });

    // Enable pointer events on options
    tl.set('.looking-for-container', { pointerEvents: 'auto' });

    // Reveal "WHAT ARE YOU LOOKING FOR?"
    tl.to('.looking-for-title', {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
    }, '-=0.5');

    // Stagger reveal options
    const options = document.querySelectorAll('.option-link');
    if (options.length) {
        tl.to(options, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.3,
            ease: 'back.out(1.4)'
        }, '-=0.5');
    }
}

/* =========================================
   Leaf Particles (GSAP)
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

    const isMobile = window.innerWidth < 768;
    const leafCount = isMobile ? 10 : 22;

    for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf-particle';
        leaf.setAttribute('aria-hidden', 'true');

        const randomImage = leafImages[Math.floor(Math.random() * leafImages.length)];
        leaf.innerHTML = `<img src="${randomImage}" alt="" loading="eager" />`;
        heroSection.appendChild(leaf);

        const depth = Math.random();
        const size = depth > 0.8
            ? (Math.random() * 90 + 130)   // Foreground: large
            : depth > 0.4
                ? (Math.random() * 35 + 70)  // Midground: medium
                : (Math.random() * 18 + 35); // Background: small

        const opacity = depth > 0.8 ? 0.35 : depth > 0.4 ? 0.95 : 0.55;
        const blur = depth > 0.8 ? 10 : depth > 0.4 ? 0 : 3;

        gsap.set(leaf, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight - window.innerHeight,
            width: size,
            height: size,
            opacity,
            filter: `blur(${blur}px)`,
            rotationX: Math.random() * 360,
            rotationY: Math.random() * 360,
            rotationZ: Math.random() * 360
        });

        animateLeaf(leaf, depth);
    }
}

function animateLeaf(leaf, depth) {
    const baseDuration = depth > 0.8 ? 8 : depth > 0.4 ? 14 : 20;
    const duration = baseDuration + (Math.random() * 4);
    const startX = gsap.getProperty(leaf, 'x');
    const swayAmount = (Math.random() * 250) + 80;
    const swayDirection = Math.random() > 0.5 ? 1 : -1;

    gsap.to(leaf, {
        y: window.innerHeight + 100,
        rotationX: '+=' + (Math.random() * 720 - 360),
        rotationY: '+=' + (Math.random() * 720 - 360),
        rotationZ: '+=' + (Math.random() * 360 - 180),
        duration,
        ease: 'none',
        onComplete: () => {
            gsap.set(leaf, { y: -100, x: Math.random() * window.innerWidth });
            animateLeaf(leaf, depth);
        }
    });

    gsap.to(leaf, {
        x: startX + (swayAmount * swayDirection),
        duration: duration / (Math.random() * 2 + 1.5),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
    });
}

/* =========================================
   Scroll Reveal Animations (GSAP)
   ========================================= */
function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.utils.toArray('.gsap-fade-up').forEach(elem => {
        gsap.fromTo(elem,
            { opacity: 0, y: 45 },
            {
                scrollTrigger: { trigger: elem, start: 'top 82%' },
                opacity: 1, y: 0, duration: 1, ease: 'power2.out'
            }
        );
    });

    gsap.utils.toArray('.gourmet-grid').forEach(grid => {
        const cards = grid.querySelectorAll('.gsap-stagger-card');
        if (cards.length) {
            gsap.fromTo(cards,
                { opacity: 0, y: 35 },
                {
                    scrollTrigger: { trigger: grid, start: 'top 82%' },
                    opacity: 1, y: 0, duration: 0.9, stagger: 0.18, ease: 'power2.out'
                }
            );
        }
    });

    gsap.utils.toArray('.gsap-slide-left').forEach(elem => {
        gsap.fromTo(elem,
            { opacity: 0, x: -55 },
            {
                scrollTrigger: { trigger: elem, start: 'top 82%' },
                opacity: 1, x: 0, duration: 1, ease: 'power2.out'
            }
        );
    });

    gsap.utils.toArray('.gsap-slide-right').forEach(elem => {
        gsap.fromTo(elem,
            { opacity: 0, x: 55 },
            {
                scrollTrigger: { trigger: elem, start: 'top 82%' },
                opacity: 1, x: 0, duration: 1, ease: 'power2.out'
            }
        );
    });

    // Stagger showtime cards
    const showtimeCards = document.querySelectorAll('.showtime-card');
    if (showtimeCards.length) {
        gsap.fromTo(showtimeCards,
            { opacity: 0, y: 30 },
            {
                scrollTrigger: { trigger: '.showtimes-grid', start: 'top 85%' },
                opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out'
            }
        );
    }
}

/* =========================================
   FAQ Accordion
   ========================================= */
function initAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            // Close all others
            headers.forEach(other => {
                if (other !== this) {
                    other.classList.remove('active');
                    other.setAttribute('aria-expanded', 'false');
                    const otherContent = other.nextElementSibling;
                    if (otherContent) otherContent.style.maxHeight = null;
                }
            });

            // Toggle this one
            const newState = !isExpanded;
            this.classList.toggle('active', newState);
            this.setAttribute('aria-expanded', String(newState));

            const content = this.nextElementSibling;
            if (content) {
                content.style.maxHeight = newState ? content.scrollHeight + 'px' : null;
            }
        });
    });
}
