// Small bits of behaviour for the CV page. The page works fine without any
// of this (it just follows the system theme and has no highlighted nav link).

const root = document.documentElement;

// ---------- theme toggle ----------

// Follows the system setting until someone clicks Dark or Light, then
// remembers their choice. The saved value is applied by the inline script in
// <head> so it's set before the page paints.
const THEME_KEY = 'cv-theme';
const themeGroup = document.getElementById('theme');
const themeButtons = themeGroup ? [...themeGroup.querySelectorAll('button')] : [];
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme() {
  const chosen = root.getAttribute('data-theme');
  if (chosen === 'dark' || chosen === 'light') return chosen;
  return systemDark.matches ? 'dark' : 'light';
}

function updateThemeButtons() {
  const now = currentTheme();
  themeButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeSet === now));
  });
}

themeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    root.setAttribute('data-theme', btn.dataset.themeSet);
    // localStorage throws in some private windows, not worth breaking the toggle over
    try {
      localStorage.setItem(THEME_KEY, btn.dataset.themeSet);
    } catch (err) {}
    updateThemeButtons();
  });
});

// the toggle is hidden in the html so it doesn't show up as a dead control with js off
if (themeGroup) themeGroup.hidden = false;
systemDark.addEventListener('change', updateThemeButtons);
// also catches the attribute being changed from outside this script
new MutationObserver(updateThemeButtons).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
updateThemeButtons();

// ---------- current section ----------

// Works out which section is being read, highlights its nav link and updates
// the status line at the bottom.
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks
  .map((link) => ({ link, el: document.getElementById(link.getAttribute('href').slice(1)), name: link.textContent }))
  .filter((s) => s.el);

const statusSection = document.getElementById('status-sec');
const statusPosition = document.getElementById('status-pos');
const twoDigits = (n) => String(n).padStart(2, '0');
let activeIndex = null;

function updateCurrentSection() {
  // a section counts as "current" once its top is about a third of the way down the screen
  const triggerLine = window.innerHeight * 0.35;
  let index = -1;
  sections.forEach((s, i) => {
    if (s.el.getBoundingClientRect().top <= triggerLine) index = i;
  });

  // Contact is short so it never reaches the trigger line. If we're at the
  // very bottom of the page, just call it the last section.
  const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 4;
  if (atBottom && window.scrollY > 0) index = sections.length - 1;

  if (index === activeIndex) return;
  activeIndex = index;

  sections.forEach((s, i) => {
    if (i === index) s.link.setAttribute('aria-current', 'true');
    else s.link.removeAttribute('aria-current');
  });

  if (statusSection) statusSection.textContent = index < 0 ? 'Top' : sections[index].name;
  if (statusPosition) statusPosition.textContent = `${twoDigits(index + 1)}/${twoDigits(sections.length)}`;

  // on phones the nav scrolls sideways, so keep the active link in view
  if (index >= 0) {
    const link = sections[index].link;
    const nav = link.parentNode;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = link.offsetLeft - nav.offsetLeft - 16;
  }
}

// scroll fires constantly, so only do the work once per frame
let frameQueued = false;
function onScroll() {
  if (frameQueued) return;
  frameQueued = true;
  requestAnimationFrame(() => {
    frameQueued = false;
    updateCurrentSection();
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
updateCurrentSection();

// ---------- copy buttons ----------

const liveRegion = document.getElementById('live'); // read out by screen readers

function selectText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const source = document.getElementById(btn.dataset.copy);
    if (!source) return;
    const text = source.textContent.trim();

    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
      if (liveRegion) liveRegion.textContent = `Copied ${text}`;
      setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
    } catch (err) {
      // clipboard can be blocked (http, old browsers), so select the text instead
      selectText(source);
      if (liveRegion) liveRegion.textContent = 'Selected. Press copy on your keyboard.';
    }
  });
});
