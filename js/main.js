/* ---------- Mobile nav ---------- */
const toggle = document.querySelector('.nav__toggle');
const links = document.querySelector('.nav__links');

toggle.addEventListener('click', () => {
  const isOpen = links.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', isOpen);
});

links.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Scroll-driven loading intro ---------- */
(function initIntro() {
  const body = document.body;
  const intro = document.getElementById('intro');
  const video = document.getElementById('introVideo');
  const hint = document.getElementById('introHint');
  const spacer = document.getElementById('introScroll');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Instant jump to top, bypassing the page's smooth-scroll behavior.
  function jumpToTop() {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }

  // Always begin the intro from the top — don't let the browser restore the
  // previous scroll position on refresh (which would drop you mid-intro).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  jumpToTop();

  // Nothing to scrub? Just show the site.
  if (!intro || !video || !spacer || reduceMotion) {
    complete(true);
    return;
  }

  let duration = 6;            // fallback until metadata arrives
  let done = false;
  let ticking = false;

  video.addEventListener('loadedmetadata', () => {
    if (isFinite(video.duration) && video.duration > 0) duration = video.duration;
  });

  // Some browsers restore scroll after 'load' / when returning via back-forward
  // cache; force the top again in those cases so the intro isn't skipped.
  window.addEventListener('load', jumpToTop);
  window.addEventListener('pageshow', jumpToTop);

  function scrubDistance() {
    // Scroll length allotted to the intro (spacer height minus one viewport,
    // so the video reaches its final frame right as the spacer scrolls away).
    return Math.max(1, spacer.offsetHeight - window.innerHeight);
  }

  function onScroll() {
    if (done || ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;
    if (done) return;

    const progress = Math.min(1, Math.max(0, window.scrollY / scrubDistance()));

    // Map scroll progress onto the video timeline.
    const target = progress * duration;
    if (Math.abs(target - video.currentTime) > 0.01) {
      try { video.currentTime = target; } catch (e) { /* seeking not ready yet */ }
    }

    // Fade the scroll hint out as soon as the user engages.
    if (hint) hint.style.opacity = progress > 0.04 ? '0' : '';

    if (progress >= 0.995) complete(false);
  }

  function complete(skipScrub) {
    if (done) return;
    done = true;
    window.removeEventListener('scroll', onScroll);

    // Collapse the intro's scroll room and snap the real site to the top,
    // then let the ethereal fade take over.
    spacer.style.height = '0px';
    body.classList.remove('intro-active');
    body.classList.add('intro-complete');
    jumpToTop();

    // Fully remove the overlay from the flow after it has dissolved.
    intro.addEventListener('transitionend', function handler(ev) {
      if (ev.propertyName === 'opacity') {
        intro.remove();
        intro.removeEventListener('transitionend', handler);
      }
    });
    if (skipScrub) intro.remove();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Prime the decoder: a muted play/pause warms it up so scrubbed frames
  // render immediately on the first scroll.
  video.addEventListener('loadeddata', () => {
    const p = video.play();
    if (p && p.then) {
      p.then(() => { video.pause(); video.currentTime = 0; }).catch(() => {});
    } else {
      try { video.pause(); video.currentTime = 0; } catch (e) {}
    }
    update();
  });
})();
