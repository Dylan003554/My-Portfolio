/* ========================================
   JavaScript — Portfolio Interactions
   ======================================== */

// ========================================
// PARTICLE BACKGROUND (Tech Blue Variants)
// ========================================
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let width, height;
    let mouse = { x: -9999, y: -9999 };
    const PARTICLE_COUNT = 75;
    const CONNECT_DISTANCE = 130;
    const MOUSE_RADIUS = 150;
    const particles = [];

    // Array of blue color variants (RGB tuples)
    const BLUE_PALETTE = [
        { r: 0, g: 210, b: 255 },   // Electric Cyan
        { r: 37, g: 99, b: 235 },   // Royal Blue
        { r: 56, g: 189, b: 248 },  // Sky Blue
        { r: 79, g: 70, b: 229 },   // Tech Indigo
        { r: 2, g: 132, b: 197 },   // Ocean Blue
        { r: 6, g: 182, b: 212 },   // Cyan
        { r: 96, g: 165, b: 250 },  // Soft Azure
        { r: 30, g: 64, b: 175 },   // Deep Sapphire
        { r: 147, g: 197, b: 253 }  // Ice Blue
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseRadius = Math.random() * 3 + 1.5;
            this.radius = this.baseRadius;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.color = BLUE_PALETTE[Math.floor(Math.random() * BLUE_PALETTE.length)];
            this.opacity = Math.random() * 0.45 + 0.25;
            this.baseOpacity = this.opacity;
            this.pulseSpeed = Math.random() * 0.02 + 0.008;
            this.pulseOffset = Math.random() * Math.PI * 2;
        }

        update(t) {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;
            if (this.y < -10) this.y = height + 10;
            if (this.y > height + 10) this.y = -10;

            this.radius = this.baseRadius + Math.sin(t * this.pulseSpeed + this.pulseOffset) * 0.8;

            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MOUSE_RADIUS) {
                const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * force * 4;
                this.y += Math.sin(angle) * force * 4;
                this.radius = this.baseRadius + force * 4;
                this.opacity = Math.min(1, this.baseOpacity + force * 0.5);
            } else {
                this.opacity += (this.baseOpacity - this.opacity) * 0.05;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECT_DISTANCE) {
                    const opacity = (1 - dist / CONNECT_DISTANCE) * 0.25;
                    const p1 = particles[i];
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    let tick = 0;
    function animate() {
        ctx.clearRect(0, 0, width, height);
        tick++;

        for (const p of particles) {
            p.update(tick);
            p.draw();
        }

        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();
})();

// ========================================
// STICKY HEADER
// ========================================
const header = document.getElementById('header');

if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ========================================
// MOBILE MENU TOGGLE
// ========================================
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');

if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => {
        navbar.classList.toggle('open');
        const icon = menuToggle.querySelector('i');
        if (navbar.classList.contains('open')) {
            icon.classList.replace('fa-bars', 'fa-xmark');
        } else {
            icon.classList.replace('fa-xmark', 'fa-bars');
        }
    });

    // Close mobile menu on nav link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('open');
            const icon = menuToggle.querySelector('i');
            icon.classList.replace('fa-xmark', 'fa-bars');
        });
    });
}

// ========================================
// ACTIVE NAV LINK ON SCROLL
// ========================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function setActiveLink() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', setActiveLink);

// ========================================
// SCROLL REVEAL (FADE-IN) ANIMATION
// ========================================
function addFadeInClass() {
    const elements = document.querySelectorAll(
        '.section-title, .section-subtitle, .about-content, .stats-grid, ' +
        '.skill-row, .project-card, .contact-info, .contact-form-card'
    );
    elements.forEach(el => el.classList.add('fade-in'));
}

function revealOnScroll() {
    const fadeElements = document.querySelectorAll('.fade-in');
    const triggerBottom = window.innerHeight * 0.88;

    fadeElements.forEach(el => {
        const elTop = el.getBoundingClientRect().top;
        if (elTop < triggerBottom) {
            el.classList.add('visible');
        }
    });
}

addFadeInClass();
revealOnScroll();
window.addEventListener('scroll', revealOnScroll);

// ========================================
// CONTACT FORM — Google Auth + Vercel API + Anti-Spam
// ========================================
(function () {
    const contactForm      = document.getElementById('contact-form');
    const btnSend          = document.getElementById('btn-send');
    const formStatus       = document.getElementById('form-status');
    const googleAuthBox    = document.getElementById('google-auth-box');
    const googleUserBadge  = document.getElementById('google-user-badge');
    const googleUserEmail  = document.getElementById('google-user-email');
    const btnGoogleLogout  = document.getElementById('btn-google-logout');
    const nameInput        = document.getElementById('name');
    const emailInput       = document.getElementById('email');

    if (!contactForm) return;

    // ─── ETAT D'AUTHENTIFICATION GOOGLE ──────────────────────────────────────
    let googleCredentialToken = null;

    // ─── ANTI-SPAM CONFIG ─────────────────────────────────────────────────────
    const MAX_SENDS_PER_SESSION = 3;
    const COOLDOWN_MS           = 60000;
    const MIN_FILL_TIME_MS      = 3000;

    let sendCount    = 0;
    let lastSendTime = 0;
    const formLoadTime = Date.now();

    // Vérification initiale si le Client ID Google est configuré
    const gIdOnload = document.getElementById('g_id_onload');
    if (gIdOnload && gIdOnload.getAttribute('data-client_id') === 'YOUR_GOOGLE_CLIENT_ID') {
        if (formStatus) {
            formStatus.textContent = '⚙ Clé Google manquante : Remplacez "YOUR_GOOGLE_CLIENT_ID" dans index.html par votre vrai ID client Google Cloud Console.';
            formStatus.className = 'form-status error';
        }
    }

    // Helper pour décoder le jeton JWT Google côté client (affichage UI rapide)
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Erreur parsing JWT:', e);
            return null;
        }
    }

    // ─── CALLBACK GOOGLE IDENTITY SERVICES ────────────────────────────────────
    window.handleGoogleCredentialResponse = function (response) {
        if (!response || !response.credential) {
            console.error('Réponse Google invalide');
            return;
        }

        const tokenPayload = parseJwt(response.credential);
        if (!tokenPayload || !tokenPayload.email) {
            formStatus.textContent = '✗ Impossible de lire les informations de votre compte Google.';
            formStatus.className = 'form-status error';
            return;
        }

        // Sauvegarde du jeton certifié
        googleCredentialToken = response.credential;

        // Pré-remplissage du champ email masqué
        if (emailInput) emailInput.value = tokenPayload.email;

        // Pré-remplissage du nom si vide
        if (tokenPayload.name && (!nameInput.value || nameInput.value.trim() === '')) {
            nameInput.value = tokenPayload.name;
        }

        // Mise à jour de l'affichage UI
        googleUserEmail.textContent = tokenPayload.email;
        if (googleAuthBox) googleAuthBox.style.display = 'none';
        if (googleUserBadge) googleUserBadge.style.display = 'flex';

        // Déverrouillage du bouton d'envoi
        btnSend.disabled = false;
        btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Envoyer le message</span>';
        formStatus.textContent = '✓ Compte Google vérifié avec succès. Vous pouvez envoyer votre message.';
        formStatus.className = 'form-status success';
    };

    // ─── GESTION DE LA DÉCONNEXION GOOGLE ──────────────────────────────────────
    if (btnGoogleLogout) {
        btnGoogleLogout.addEventListener('click', function () {
            googleCredentialToken = null;

            // Réinitialisation du champ email
            emailInput.value = '';
            emailInput.readOnly = false;
            googleUserEmail.textContent = '';

            // Bascule UI
            if (googleUserBadge) googleUserBadge.style.display = 'none';
            if (googleAuthBox) googleAuthBox.style.display = 'flex';

            // Verrouillage du bouton d'envoi
            btnSend.disabled = true;
            btnSend.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Authentifiez-vous avec Google pour envoyer</span>';
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            // Re-initialisation du bouton Google si nécessaire
            if (window.google && window.google.accounts && window.google.accounts.id) {
                window.google.accounts.id.cancel();
            }
        });
    }

    // ─── SOUMISSION DU FORMULAIRE VIA API BACKEND VERCEL ───────────────────────
    contactForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Vérification stricte : l'utilisateur DOIT être connecté Google
        if (!googleCredentialToken) {
            formStatus.textContent = '⚠ Veuillez vous connecter avec votre compte Google avant d\'envoyer.';
            formStatus.className = 'form-status error';
            return;
        }

        // 1. Honeypot check
        const honeypot = document.getElementById('website');
        if (honeypot && honeypot.value !== '') {
            formStatus.textContent = '✓ Message envoyé avec succès !';
            formStatus.className = 'form-status success';
            contactForm.reset();
            return;
        }

        // 2. Rate Limiting
        if (sendCount >= MAX_SENDS_PER_SESSION) {
            formStatus.textContent = "Trop de tentatives d'envoi";
            formStatus.className = 'form-status error';
            return;
        }

        const now = Date.now();
        const timeSinceLastSend = now - lastSendTime;
        if (lastSendTime > 0 && timeSinceLastSend < COOLDOWN_MS) {
            formStatus.textContent = "Trop de tentatives d'envoi";
            formStatus.className = 'form-status error';
            return;
        }

        // 3. Anti-bot speed check
        if (now - formLoadTime < MIN_FILL_TIME_MS) {
            formStatus.textContent = '✓ Message envoyé avec succès !';
            formStatus.className = 'form-status success';
            contactForm.reset();
            return;
        }

        // 4. Envoi de la requête au backend Vercel pour vérification et envoi EmailJS
        btnSend.disabled = true;
        btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Vérification et envoi...</span>';
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credential: googleCredentialToken,
                    name: nameInput.value,
                    subject: document.getElementById('subject').value,
                    message: document.getElementById('message').value,
                    honeypot: honeypot ? honeypot.value : ''
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sendCount++;
                lastSendTime = Date.now();
                formStatus.textContent = `✓ ${data.message || 'Message envoyé avec succès !'}`;
                formStatus.className = 'form-status success';
                
                // Réinitialiser les champs texte (sujet + message), tout en conservant le token Google
                document.getElementById('subject').value = '';
                document.getElementById('message').value = '';
            } else {
                formStatus.textContent = `✗ ${data.error || 'Erreur lors de l\'envoi du message.'}`;
                formStatus.className = 'form-status error';
            }
        } catch (error) {
            console.error('[Frontend] Erreur de communication avec le backend Vercel:', error);
            formStatus.textContent = '✗ Impossible de contacter le serveur d\'envoi. Vérifiez votre connexion.';
            formStatus.className = 'form-status error';
        } finally {
            if (googleCredentialToken) {
                btnSend.disabled = false;
                btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Envoyer le message</span>';
            }
        }
    });
})();


