/* Brëjka Café — front-end rendering & interactions
   ------------------------------------------------------------
   Structural stuff (nav, scroll-reveal, scroll-spy) is wired up
   immediately and does NOT depend on `data`, so the page never gets
   stuck fully invisible just because a data source (e.g. Firestore,
   if it isn't fully set up yet) fails to load. Everything that
   actually needs `data` (about text, menu, hours, map, gallery,
   social links, footer) is rendered afterwards, each section wrapped
   so one bad field can't take the rest of the page down with it.
   ------------------------------------------------------------ */

/* ---------- Navbar scroll state + mobile toggle ----------
   Set the initial state immediately (not just inside the scroll
   listener) — otherwise a page that loads already scrolled (e.g. a
   mobile browser restoring scroll position, or a deep link to a
   section) shows the wrong navbar style until the next scroll event,
   which reads as the nav "glitching" before it settles. */
const navbar = document.getElementById("navbar");
function updateNavbarScrollState() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
}
updateNavbarScrollState();
window.addEventListener("scroll", updateNavbarScrollState);
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => navLinks.classList.remove("open"))
);

/* ---------- Mobile hero parallax ----------
   Desktop gets the "stays in place" effect for free via CSS
   `background-attachment: fixed` — cheap and perfectly smooth, but
   unreliable/janky on many phone browsers (Safari especially), which
   is why it's switched off for touch/narrow screens in style.css.
   This replaces it there with a lightweight JS-driven parallax: the
   image moves at a fraction of scroll speed instead of staying
   fully still, which gives the same sense of depth on scroll while
   staying smooth on real phones (a plain scroll-linked transform,
   GPU-composited, no jank). */
const heroBg = document.querySelector(".hero-bg");
if (heroBg) {
  const heroParallaxMQ = window.matchMedia("(max-width: 900px), (hover: none)");
  let ticking = false;
  function applyHeroParallax() {
    ticking = false;
    if (!heroParallaxMQ.matches) {
      heroBg.style.transform = "";
      return;
    }
    heroBg.style.transform = `translate3d(0, ${window.scrollY * 0.35}px, 0)`;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyHeroParallax);
      }
    },
    { passive: true }
  );
  applyHeroParallax();
}

/* ---------- Hidden admin link ----------
   The panel is intentionally not linked from the nav. A tiny, barely
   visible "·" next to the footer copyright links straight to
   /admin.html — easy to find if you know it's there, invisible to a
   regular visitor. */

/* ---------- Scroll reveal ----------
   Wired up immediately (not inside the data-fetching block below) so
   sections already in the static HTML always get a chance to fade in,
   even if data loading fails entirely. */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Nav scroll-spy: highlight the section in view ---------- */
const spyLinks = Array.from(navLinks.querySelectorAll('a[href^="#"]'));
const spySections = spyLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

function setActiveLink(id) {
  spyLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
}

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveLink(entry.target.id);
    });
  },
  { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
);
spySections.forEach((el) => spyObserver.observe(el));

function clearActiveLinkNearTop() {
  if (window.scrollY < 120) spyLinks.forEach((a) => a.classList.remove("active"));
}
clearActiveLinkNearTop();
window.addEventListener("scroll", clearActiveLinkNearTop);

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function placeholderThumb(name) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
    <rect width='60' height='60' fill='#1a1714'/>
    <text x='50%' y='58%' font-family='Georgia,serif' font-size='24' fill='#c9a24b' text-anchor='middle'>${letter}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Run one rendering step without letting a failure in it take down
// any of the other steps (or the reveal/scroll-spy wiring above).
function safely(label, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`Błąd renderowania sekcji „${label}” — reszta strony działa dalej.`, err);
  }
}

/* ---------- Data-dependent rendering ---------- */
(async function () {
  let data;
  try {
    data = await store.load();
  } catch (err) {
    console.error(
      "Nie udało się wczytać danych strony (np. Firestore jeszcze nie w pełni skonfigurowany) — używam wartości domyślnych z kodu, żeby strona i tak działała.",
      err
    );
    data = typeof DEFAULT_DATA !== "undefined" ? structuredClone(DEFAULT_DATA) : null;
  }
  if (!data) return;

  safely("O nas", () => {
    document.getElementById("aboutText").textContent = data.cafe.about;
  });

  safely("Nasza kawa", () => {
    const roastImg = document.getElementById("roastImg");
    roastImg.src = data.roastImage.src;
    roastImg.alt = data.roastImage.alt;
    const roastBadge = document.getElementById("roastBadge");
    if (data.roastImage.placeholder) {
      roastBadge.textContent = "Zdjęcie tymczasowe · Unsplash";
      roastBadge.style.display = "";
    } else {
      roastBadge.style.display = "none";
    }
    document.getElementById("roastNote").textContent = `„${data.cafe.roastNote}”`;
  });

  safely("Menu", () => {
    const menuTabs = document.getElementById("menuTabs");
    const menuGrid = document.getElementById("menuGrid");

    function renderMenu(activeIndex) {
      menuTabs.innerHTML = "";
      data.menu.forEach((cat, i) => {
        const b = document.createElement("button");
        b.className = "menu-tab" + (i === activeIndex ? " active" : "");
        b.type = "button";
        b.textContent = cat.category;
        b.addEventListener("click", () => renderMenu(i));
        menuTabs.appendChild(b);
      });

      menuGrid.innerHTML = "";
      const cat = data.menu[activeIndex];
      if (!cat) return;
      cat.items.forEach((item) => {
        const el = document.createElement("div");
        el.className = "menu-item";
        const imgSrc = item.img && item.img.trim() ? item.img : placeholderThumb(item.name);
        el.innerHTML = `
          <img class="menu-item-img" src="${imgSrc}" alt="${escapeHtml(item.name)}" />
          <div class="menu-item-body">
            <div class="menu-item-top">
              <h4>${escapeHtml(item.name)}</h4>
              <span class="menu-item-dots"></span>
              <span class="menu-item-price">${escapeHtml(item.price)}</span>
            </div>
            <p>${escapeHtml(item.desc)}</p>
          </div>`;
        menuGrid.appendChild(el);
      });
    }
    renderMenu(0);
  });

  safely("Godziny", () => {
    const hoursList = document.getElementById("hoursList");
    const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
    hoursList.innerHTML = data.hours
      .map((h, i) => {
        const isToday = i === todayIdx;
        const timeText = h.closed ? "Nieczynne" : `${h.open} – ${h.close}`;
        return `<div class="hours-row ${isToday ? "today" : ""} ${h.closed ? "closed" : ""}">
          <span class="day">${escapeHtml(h.day)}</span>
          <span class="time">${timeText}</span>
        </div>`;
      })
      .join("");
  });

  safely("Mapa", () => {
    document.getElementById("mapFrame").src = data.cafe.mapEmbedUrl;
    document.getElementById("mapLink").href = data.cafe.mapLinkUrl;
    document.getElementById("mapAddress").textContent = data.cafe.address;
  });

  safely("Galeria", () => {
    const galleryGrid = document.getElementById("galleryGrid");
    galleryGrid.innerHTML = data.gallery
      .map(
        (g, i) =>
          `<div class="gallery-item" data-i="${i}"><img src="${g.src}" alt="${escapeHtml(
            g.alt || ""
          )}" loading="lazy" /></div>`
      )
      .join("");

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    galleryGrid.querySelectorAll(".gallery-item").forEach((el) => {
      el.addEventListener("click", () => {
        const g = data.gallery[+el.dataset.i];
        lightboxImg.src = g.src;
        lightboxImg.alt = g.alt || "";
        lightbox.classList.add("open");
      });
    });
    document.getElementById("lightboxClose").addEventListener("click", () =>
      lightbox.classList.remove("open")
    );
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lightbox.classList.remove("open");
    });
  });

  safely("Social media", () => {
    document.getElementById("fbLink").href = data.social.facebook || "#";
    document.getElementById("igLink").href = data.social.instagram || "#";
    document.getElementById("ttLink").href = data.social.tiktok || "#";
  });

  safely("Stopka", () => {
    document.getElementById("footerAddress").textContent = data.cafe.address;
    document.getElementById("year").textContent = new Date().getFullYear();
  });
})();
