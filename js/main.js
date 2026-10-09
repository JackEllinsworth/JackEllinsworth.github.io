const root = document.documentElement;

// ---------- Theme toggle ----------

// Follows the system theme until a choice is made. Saved choice is applied in <head>
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
    // localStorage can throw in private windows
    try {
      localStorage.setItem(THEME_KEY, btn.dataset.themeSet);
    } catch (err) {}
    updateThemeButtons();
  });
});

// Hidden by default so it's not a dead control without JS
if (themeGroup) themeGroup.hidden = false;
systemDark.addEventListener('change', updateThemeButtons);
// Catches data-theme changes from anywhere
new MutationObserver(updateThemeButtons).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
updateThemeButtons();

// ---------- Current section ----------

// Highlights the current nav link and updates the status line
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks
  .map((link) => ({ link, el: document.getElementById(link.getAttribute('href').slice(1)), name: link.textContent }))
  .filter((s) => s.el);

const statusSection = document.getElementById('status-sec');
const statusPosition = document.getElementById('status-pos');
const twoDigits = (n) => String(n).padStart(2, '0');
let activeIndex = null;

function updateCurrentSection() {
  // Section is current once its top passes ~1/3 down the screen
  const triggerLine = window.innerHeight * 0.35;
  let index = -1;
  sections.forEach((s, i) => {
    if (s.el.getBoundingClientRect().top <= triggerLine) index = i;
  });

  // Contact is too short to hit the line, so use it at the bottom of the page
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

  // Keep the active link in view on mobile
  if (index >= 0) {
    const link = sections[index].link;
    const nav = link.parentNode;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = link.offsetLeft - nav.offsetLeft - 16;
  }
}

// Throttle to once per frame
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

// ---------- Copy buttons ----------

const liveRegion = document.getElementById('live'); // Screen reader announcements

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
      // Clipboard blocked, select the text instead
      selectText(source);
      if (liveRegion) liveRegion.textContent = 'Selected. Press copy on your keyboard.';
    }
  });
});
