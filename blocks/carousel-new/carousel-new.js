import { createOptimizedPicture, fetchPlaceholders, sampleRUM } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { renderButton } from '../../components/button/button.js';

const PLACEHOLDER_IMG = 'https://placehold.co/600x400?text=Image';
const BREAKPOINTS = [{ width: '750' }];
const DESC_LIMIT = 150;

function slidesPerView() {
  if (window.innerWidth >= 1024) return 2;
  return 1;
}

function clampDescription(text) {
  const clean = (text || '').trim();
  if (clean.length <= DESC_LIMIT) return clean;
  return `${clean.slice(0, DESC_LIMIT - 1)}…`;
}

function getBoolFromRow(row) {
  return (row?.textContent || '').trim().toLowerCase() === 'true';
}

function getNumberFromRow(row, fallback) {
  const n = parseInt((row?.textContent || '').trim(), 10);
  return Number.isFinite(n) ? Math.max(1000, n) : fallback;
}

function buildSlideFromRow(row, placeholders) {
  const [imgCol, altCol, headlineCol, descCol, linkCol] = [...row.children];

  // media
  let picture = imgCol?.querySelector('picture');
  let imgAlt = (altCol?.textContent || '').trim();
  if (picture) {
    const origImg = picture.querySelector('img');
    const optimized = createOptimizedPicture(origImg.src, imgAlt || origImg.alt || '', false, BREAKPOINTS);
    moveInstrumentation(origImg, optimized.querySelector('img'));
    picture = optimized;
  } else {
    const img = document.createElement('img');
    img.src = PLACEHOLDER_IMG;
    img.alt = imgAlt || 'Placeholder image';
    picture = document.createElement('picture');
    picture.append(img);
  }

  const headline = (headlineCol?.textContent || '').trim();
  const description = clampDescription(descCol?.textContent || '');
  const link = (linkCol?.textContent || linkCol?.querySelector('a')?.href || '').trim();

  const card = document.createElement('article');
  card.className = 'cn-card';

  const media = document.createElement('div');
  media.className = 'cn-media';
  media.append(picture);

  const body = document.createElement('div');
  body.className = 'cn-body';

  const h = document.createElement('h3');
  h.textContent = headline || placeholders?.learnMoreTitle || 'Use Case';
  const p = document.createElement('p');
  p.textContent = description || placeholders?.learnMoreDescription || '';

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'cn-cta';
  const label = placeholders?.learnMore || 'Learn More';
  const btn = renderButton({ link: link || '#', label, target: '_blank', block: document.createElement('div') });
  ctaWrap.append(btn);

  body.append(h, p, ctaWrap);
  card.append(media, body);

  return { card, cta: btn };
}

function buildSlideFromConfig(slide, placeholders) {
  const imgSrc = slide?.image || PLACEHOLDER_IMG;
  const imgAlt = slide?.alt || '';
  const optimized = createOptimizedPicture(imgSrc, imgAlt, false, BREAKPOINTS);

  const card = document.createElement('article');
  card.className = 'cn-card';

  const media = document.createElement('div');
  media.className = 'cn-media';
  media.append(optimized);

  const body = document.createElement('div');
  body.className = 'cn-body';
  const h = document.createElement('h3');
  h.textContent = (slide?.headline || '').trim() || placeholders?.learnMoreTitle || 'Use Case';
  const p = document.createElement('p');
  p.textContent = clampDescription(slide?.description || '');

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'cn-cta';
  const label = placeholders?.learnMore || 'Learn More';
  const btn = renderButton({ link: (slide?.link || '#'), label, target: '_blank', block: document.createElement('div') });
  ctaWrap.append(btn);

  body.append(h, p, ctaWrap);
  card.append(media, body);

  return { card, cta: btn };
}

function updateDots(dots, currentPage) {
  dots.querySelectorAll('button').forEach((b, i) => {
    b.setAttribute('aria-current', i === currentPage ? 'true' : 'false');
  });
}

export default async function decorate(block) {
  // placeholders for i18n labels
  const placeholders = await fetchPlaceholders();

  // Parse optional JSON config row (author convenience) or block rows
  const rows = [...block.querySelectorAll(':scope > div')];
  let autoTransition = false;
  let transitionSpeed = 5000;
  let slidesData = [];

  // Universal Editor fields (first two rows) if provided
  if (rows.length) {
    autoTransition = getBoolFromRow(rows[0]);
    transitionSpeed = getNumberFromRow(rows[1], 5000);
  }

  // If author pasted raw JSON as the only cell in first row, use it
  try {
    const jsonText = rows[0]?.textContent?.trim();
    if (jsonText?.startsWith('{') || jsonText?.startsWith('[')) {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        slidesData = parsed;
      } else if (parsed?.slides) {
        slidesData = parsed.slides;
        autoTransition = !!parsed.autoTransition;
        transitionSpeed = getNumberFromRow({ textContent: String(parsed.transitionSpeed) }, 5000);
      }
    }
  } catch (e) {
    // ignore; fallback to DOM parsing
  }

  // Structure
  const region = document.createElement('div');
  region.className = 'carousel-new';
  region.setAttribute('role', 'region');
  region.setAttribute('aria-roledescription', 'carousel');
  region.setAttribute('aria-label', 'Use case carousel');

  const nav = document.createElement('div');
  nav.className = 'cn-nav';
  const controls = document.createElement('div');
  controls.className = 'cn-controls';
  const prev = document.createElement('button');
  prev.className = 'cn-button cn-prev';
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.textContent = '‹';
  const next = document.createElement('button');
  next.className = 'cn-button cn-next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Next slide');
  next.textContent = '›';
  controls.append(prev, next);
  const dots = document.createElement('ul');
  dots.className = 'cn-dots';
  nav.append(controls, dots);

  const viewport = document.createElement('div');
  viewport.className = 'cn-viewport';
  const track = document.createElement('ol');
  track.className = 'cn-track';
  viewport.append(track);

  // Build slides
  const startIndex = slidesData.length ? 0 : 2; // skip config rows when parsing DOM
  const sourceRows = slidesData.length ? [] : rows.slice(startIndex);
  const slides = [];
  const ctas = [];

  if (slidesData.length) {
    slidesData.forEach((sd, idx) => {
      const li = document.createElement('li');
      li.className = 'cn-slide';
      const { card, cta } = buildSlideFromConfig(sd, placeholders);
      li.append(card);
      track.append(li);
      slides.push(li);
      ctas.push(cta);
      li.setAttribute('aria-hidden', 'true');
    });
  } else {
    sourceRows.forEach((row, idx) => {
      const li = document.createElement('li');
      li.className = 'cn-slide';
      moveInstrumentation(row, li);
      const { card, cta } = buildSlideFromRow(row, placeholders);
      li.append(card);
      track.append(li);
      slides.push(li);
      ctas.push(cta);
      li.setAttribute('aria-hidden', 'true');
      row.remove();
    });
  }

  // Clear and attach
  block.textContent = '';
  block.append(nav, viewport);

  // Pagination (pages depend on slidesPerView)
  const getPageCount = () => Math.max(1, Math.ceil(slides.length / slidesPerView()));
  const getPageForIndex = (i) => Math.floor(i / slidesPerView());
  let currentIndex = 0; // left-most visible slide index

  function applyVisibility() {
    const spv = slidesPerView();
    slides.forEach((s, i) => {
      const visible = i >= currentIndex && i < currentIndex + spv;
      s.setAttribute('aria-hidden', visible ? 'false' : 'true');
      s.querySelectorAll('a').forEach((a) => {
        if (visible) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1');
      });
    });
  }

  function updateTransform(instant = false) {
    const slide = slides[0];
    if (!slide) return;
    const slideWidth = slide.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0');
    const offset = currentIndex * (slideWidth + gap);
    if (instant) track.style.transition = 'none';
    track.style.transform = `translateX(${-offset}px)`;
    if (instant) requestAnimationFrame(() => { track.style.transition = ''; });
    updateDots(dots, getPageForIndex(currentIndex));
    applyVisibility();
    sampleRUM('carousel-new:change', { index: currentIndex });
  }

  function rebuildDots() {
    dots.textContent = '';
    const pages = getPageCount();
    for (let p = 0; p < pages; p += 1) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to page ${p + 1}`);
      b.addEventListener('click', () => {
        currentIndex = p * slidesPerView();
        updateTransform();
      });
      li.append(b);
      dots.append(li);
    }
    updateDots(dots, getPageForIndex(currentIndex));
  }

  // Controls
  prev.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateTransform();
  });
  next.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateTransform();
  });

  // Keyboard support: arrows navigate
  region.tabIndex = -1;
  region.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
  });

  // CTA analytics
  ctas.forEach((cta, i) => {
    cta.addEventListener('click', () => sampleRUM('carousel-new:cta-click', { index: i, href: cta.href }));
  });

  // Initialize
  rebuildDots();
  updateTransform(true);

  // Handle resize to recalc pages
  let resizeTO;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTO);
    resizeTO = window.setTimeout(() => {
      const pageBefore = getPageForIndex(currentIndex);
      rebuildDots();
      // keep user on the same page after layout change
      currentIndex = Math.min(pageBefore * slidesPerView(), Math.max(0, slides.length - slidesPerView()));
      updateTransform(true);
    }, 100);
  });

  // Auto-advance using rAF (opt-in)
  let rafId;
  let lastTs = 0;
  let acc = 0;
  function loop(ts) {
    if (!autoTransition) return;
    if (!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;
    acc += dt;
    if (acc >= transitionSpeed) {
      acc = 0;
      next.click();
    }
    rafId = requestAnimationFrame(loop);
  }

  if (autoTransition) {
    rafId = requestAnimationFrame(loop);
  }

  // Stop auto when user interacts
  const stopAuto = () => {
    autoTransition = false;
    if (rafId) cancelAnimationFrame(rafId);
  };
  prev.addEventListener('click', stopAuto, { once: true });
  next.addEventListener('click', stopAuto, { once: true });
  dots.addEventListener('click', stopAuto, { once: true });
}

