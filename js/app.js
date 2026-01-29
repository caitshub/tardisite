(() => {
  const menuToggle = document.getElementById('menuToggle');
    document.addEventListener('click', (e) => {
  if (!navMenu || !menuToggle) return;
  const clickInsideNav = navMenu.contains(e.target);
  const clickOnToggle = menuToggle.contains(e.target);
  if (!clickInsideNav && !clickOnToggle) setMenu(false);
});
  const navMenu = document.getElementById('navMenu');
  const sections = Array.from(document.querySelectorAll('.page-section'));
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setMenu(open) {
    if (!menuToggle || !navMenu) return;
    menuToggle.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  }

  // Menu toggle
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      setMenu(!navMenu.classList.contains('active'));
    });

    // Close menu on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  function setActiveNav(pageId) {
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-page="${pageId}"]`).forEach(l => l.classList.add('active'));
  }

  function showPage(pageId, { push = true, focus = true } = {}) {
    const target = document.getElementById(pageId);
    if (!target) return;

    sections.forEach(s => {
      const active = s.id === pageId;
      s.classList.toggle('active', active);
      s.hidden = !active;
      s.setAttribute('aria-hidden', String(!active));
    });

    setActiveNav(pageId);

    if (push) history.pushState({ pageId }, '', `#${pageId}`);

    // Close mobile menu after navigation
    if (window.innerWidth <= 768) setMenu(false);

    // Scroll + focus to simulate a “page change”
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });  
      }

  // Intercept nav clicks (including CTA + footer links because they use .nav-link)
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const pageId = link.dataset.page;
      if (!pageId) return;
      e.preventDefault();
      showPage(pageId, { push: true });
    });
  });

  // Deep links on load + hash edits
  function syncFromHash() {
    const pageId = location.hash.slice(1) || 'home';
    if (document.getElementById(pageId)) showPage(pageId, { push: false, focus: false });
    else showPage('home', { push: false, focus: false });
  }

  window.addEventListener('popstate', (e) => {
    const pageId = e.state?.pageId || location.hash.slice(1) || 'home';
    showPage(pageId, { push: false });
  });

  window.addEventListener('hashchange', syncFromHash);

  // Formspree AJAX submit
  function wireFormspree() {
    const form = document.getElementById('joinForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const statusEl = form.querySelector('.form-status');
      const submitBtn = form.querySelector('button[type="submit"]');

      const gotcha = form.querySelector('input[name="_gotcha"]');
      if (gotcha && gotcha.value) {
        if (statusEl) statusEl.textContent = 'Thank you! We will contact you soon.';
        form.reset();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) {
        statusEl.style.color = 'var(--text-light)';
        statusEl.textContent = 'Submitting...';
      }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          if (statusEl) {
            statusEl.style.color = 'var(--accent-teal)';
            statusEl.textContent = 'Thank you! Your application was sent.';
          }
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          if (statusEl) {
            statusEl.style.color = 'var(--accent-rose)';
            statusEl.textContent = data?.error || 'Sorry—there was a problem sending the form. Please try again.';
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.style.color = 'var(--accent-rose)';
          statusEl.textContent = 'Network error—please try again.';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Scroll-in animations
  function wireScrollAnimations() {
    const items = document.querySelectorAll(
      '.info-card, .timeline-item, .tool-card, .microscopy-item, .comparison-item'
    );

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

    items.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncFromHash();
    wireFormspree();
    wireScrollAnimations();
  });
})();
