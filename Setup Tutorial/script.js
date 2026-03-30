document.addEventListener('DOMContentLoaded', () => {
    // ── Progress Bar ──────────────────────────────────
    const progressBar = document.getElementById('progress-bar');
    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if(progressBar) progressBar.style.width = pct + '%';
    }

    // ── Back to Top ───────────────────────────────────
    const btt = document.getElementById('back-to-top');
    function updateBTT() {
        if (!btt) return;
        if (window.scrollY > 300) {
            btt.classList.add('visible');
            btt.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        } else {
            btt.classList.remove('visible');
        }
    }

    // ── Active Nav Highlight ──────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#sidebar-nav-links a');

    function updateActiveNav() {
        let current = '';
        sections.forEach(sec => {
            const top = sec.getBoundingClientRect().top;
            if (top <= 120) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    // ── Scroll Reveal Animations ───────────────────────
    function reveal() {
        var reveals = document.querySelectorAll(".reveal");
        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 60;
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add("active");
            }
        }
    }

    window.addEventListener('scroll', () => {
        updateProgress();
        updateBTT();
        updateActiveNav();
        reveal();
    }, { passive: true });

    // ── Mobile Nav ────────────────────────────────────
    window.toggleMobileNav = function() {
        const drawer = document.getElementById('mobile-nav');
        if(drawer) {
            drawer.classList.toggle('open');
        }
    }

    const sidebarLinksContainer = document.getElementById('sidebar-nav-links');
    const mobileLinksContainer = document.getElementById('mobile-nav-links');
    if(sidebarLinksContainer && mobileLinksContainer) {
        mobileLinksContainer.innerHTML = sidebarLinksContainer.innerHTML;
        mobileLinksContainer.addEventListener('click', () => {
            document.getElementById('mobile-nav').classList.remove('open');
        });
    }

    // ── Copy to Clipboard ─────────────────────────────
    window.copyCode = function(btn) {
        const pre = btn.closest('.code-block').querySelector('pre');
        const text = pre.textContent;
        
        const successState = () => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                btn.classList.remove('copied');
            }, 2500);
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(successState);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            successState();
        }
    }

    // Initialize Copy Buttons with Icons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
    });
    
    // Add cool hover effect classes to badges
    document.querySelectorAll('.badge').forEach(b => b.classList.add('reveal'));

    // ── Init ──────────────────────────────────────────
    updateProgress();
    updateBTT();
    updateActiveNav();
    setTimeout(reveal, 100);
});
