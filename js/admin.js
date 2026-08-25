/* Brëjka Café — admin panel logic
   ------------------------------------------------------------
   Two login modes, picked automatically:

   - Firebase mode (BACKEND === "firebase" and the Firebase SDK is
     loaded): real Firebase Authentication, e-mail + password. Create
     the admin account in Firebase Console → Authentication → Users.
   - Local/demo mode (fallback, e.g. testing offline without Firebase):
     the ADMIN_PASSWORD constant below. This is NOT real security —
     anyone who reads this file can see the password — it only exists
     so the panel still works when Firebase isn't configured.
   ------------------------------------------------------------ */
const ADMIN_PASSWORD = "brejka2026"; // only used in local/demo mode
const SESSION_KEY = "brejka_admin_session";

const USE_FIREBASE_AUTH =
  typeof BACKEND !== "undefined" &&
  BACKEND === "firebase" &&
  typeof firebase !== "undefined" &&
  !!firebase.auth;

let workingData = null; // in-memory copy being edited

/* ---------------- Auth ---------------- */
const loginWrap = document.getElementById("loginWrap");
const adminApp = document.getElementById("adminApp");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");

if (USE_FIREBASE_AUTH) {
  emailInput.style.display = "";
  emailInput.required = true;
}

function showApp() {
  loginWrap.style.display = "none";
  adminApp.style.display = "block";
  boot();
}
function showLogin() {
  loginWrap.style.display = "flex";
  adminApp.style.display = "none";
}

if (USE_FIREBASE_AUTH) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) showApp();
    else showLogin();
  });
} else if (sessionStorage.getItem(SESSION_KEY) === "1") {
  showApp();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  if (USE_FIREBASE_AUTH) {
    try {
      await firebase
        .auth()
        .signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value);
      // onAuthStateChanged (above) picks this up and calls showApp()
    } catch (err) {
      loginError.textContent = "Nie udało się zalogować — " + friendlyAuthError(err);
    }
    return;
  }

  if (passwordInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "1");
    showApp();
  } else {
    loginError.textContent = "Nieprawidłowe hasło. Spróbuj ponownie.";
  }
});

document.getElementById("restoreDefaultsBtn").addEventListener("click", async () => {
  const sure = confirm(
    "To nadpisze WSZYSTKIE zapisane dane (menu, godziny, galerię, itd.) " +
      "aktualnymi wartościami z kodu strony. Jeśli wprowadzałeś realne zmiany " +
      "w menu lub godzinach, zostaną one utracone. Kontynuować?"
  );
  if (!sure) return;
  try {
    workingData = await store.reset();
    renderCategories();
    renderHours();
    toast("Dane domyślne przywrócone ✓ — odśwież stronę główną, aby zobaczyć zmiany.");
  } catch (err) {
    console.error(err);
    toast("⚠ Nie udało się przywrócić danych domyślnych — sprawdź połączenie z Firebase.");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (USE_FIREBASE_AUTH) {
    firebase.auth().signOut();
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }
});

function friendlyAuthError(err) {
  const messages = {
    "auth/invalid-email": "nieprawidłowy adres e-mail.",
    "auth/user-not-found": "nie ma konta z tym adresem e-mail.",
    "auth/wrong-password": "błędne hasło.",
    "auth/invalid-credential": "błędny e-mail lub hasło.",
    "auth/too-many-requests": "zbyt wiele prób logowania — spróbuj ponownie za chwilę.",
    "auth/configuration-not-found":
      "logowanie e-mail/hasło nie jest jeszcze włączone w konsoli Firebase (Authentication → Sign-in method).",
  };
  return messages[err.code] || err.message;
}

/* ---------------- Boot ---------------- */
async function boot() {
  workingData = await store.load();
  renderCategories();
  renderHours();
  wireTabs();
}

function wireTabs() {
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.panel).classList.add("active");
    });
  });
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------------- Menu editor ---------------- */
const categoriesWrap = document.getElementById("categoriesWrap");

function renderCategories() {
  categoriesWrap.innerHTML = "";
  workingData.menu.forEach((cat, ci) => {
    const block = document.createElement("div");
    block.className = "cat-block";
    block.innerHTML = `
      <div class="cat-block-head">
        <input type="text" value="${escapeAttr(cat.category)}" data-role="cat-name" data-ci="${ci}" />
        <div class="row-actions">
          <button class="icon-btn" data-action="add-item" data-ci="${ci}" title="Dodaj pozycję">＋</button>
          <button class="icon-btn danger" data-action="del-cat" data-ci="${ci}" title="Usuń kategorię">🗑</button>
        </div>
      </div>
      <div class="items-wrap" data-ci="${ci}"></div>
    `;
    categoriesWrap.appendChild(block);
    renderItems(ci);
  });
}

function renderItems(ci) {
  const wrap = categoriesWrap.querySelector(`.items-wrap[data-ci="${ci}"]`);
  const cat = workingData.menu[ci];
  wrap.innerHTML = cat.items
    .map((item, ii) => {
      const thumb = item.img && item.img.trim() ? item.img : svgPlaceholder(item.name);
      return `
      <div class="admin-item-row" data-ci="${ci}" data-ii="${ii}">
        <img class="thumb" src="${thumb}" data-action="pick-image" data-ci="${ci}" data-ii="${ii}" title="Kliknij, aby zmienić zdjęcie" />
        <div class="field-name">
          <span class="field-label">Nazwa</span>
          <input type="text" value="${escapeAttr(item.name)}" data-field="name" data-ci="${ci}" data-ii="${ii}" />
        </div>
        <div class="field-desc">
          <span class="field-label">Opis</span>
          <input type="text" value="${escapeAttr(item.desc)}" data-field="desc" data-ci="${ci}" data-ii="${ii}" />
        </div>
        <div class="field-price">
          <span class="field-label">Cena</span>
          <input type="text" value="${escapeAttr(item.price)}" data-field="price" data-ci="${ci}" data-ii="${ii}" />
        </div>
        <div class="row-actions">
          <button class="icon-btn danger" data-action="del-item" data-ci="${ci}" data-ii="${ii}" title="Usuń pozycję">🗑</button>
        </div>
      </div>`;
    })
    .join("");
}

function svgPlaceholder(name) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'>
    <rect width='44' height='44' fill='#1a1714'/>
    <text x='50%' y='56%' font-family='Georgia,serif' font-size='18' fill='#c9a24b' text-anchor='middle'>${letter}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// input edits -> update workingData in-memory
categoriesWrap.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.role === "cat-name") {
    workingData.menu[+t.dataset.ci].category = t.value;
  } else if (t.dataset.field) {
    const { ci, ii, field } = t.dataset;
    workingData.menu[+ci].items[+ii][field] = t.value;
  }
});

// buttons: add/delete item, add/delete category, pick image
categoriesWrap.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const ci = +btn.dataset.ci;

  if (action === "add-item") {
    workingData.menu[ci].items.push({
      id: "item-" + Date.now(),
      name: "Nowa pozycja",
      desc: "Opis…",
      price: "0 zł",
      img: "",
    });
    renderItems(ci);
  }
  if (action === "del-item") {
    const ii = +btn.dataset.ii;
    workingData.menu[ci].items.splice(ii, 1);
    renderItems(ci);
  }
  if (action === "del-cat") {
    if (confirm("Usunąć całą kategorię wraz z pozycjami?")) {
      workingData.menu.splice(ci, 1);
      renderCategories();
    }
  }
  if (action === "pick-image") {
    const ii = +btn.dataset.ii;
    const input = document.getElementById("imageFileInput");
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        workingData.menu[ci].items[ii].img = reader.result; // base64 data URL
        renderItems(ci);
      };
      reader.readAsDataURL(file);
      input.value = "";
    };
    input.click();
  }
});

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  workingData.menu.push({ category: "Nowa kategoria", items: [] });
  renderCategories();
});

document.getElementById("saveMenuBtn").addEventListener("click", async () => {
  try {
    await store.save(workingData);
    toast("Menu zapisane ✓ — odśwież stronę główną, aby zobaczyć zmiany.");
  } catch (err) {
    console.error(err);
    toast("⚠ Nie udało się zapisać — sprawdź połączenie z Firebase.");
  }
});

document.getElementById("revertMenuBtn").addEventListener("click", async () => {
  workingData = await store.load();
  renderCategories();
  toast("Zmiany w menu cofnięte.");
});

/* ---------------- Hours editor ---------------- */
const hoursWrap = document.getElementById("hoursWrap");

function renderHours() {
  hoursWrap.innerHTML = workingData.hours
    .map(
      (h, i) => `
      <div class="hours-editor-row" data-i="${i}">
        <div class="hours-day">${escapeAttr(h.day)}</div>
        <div class="hours-field hours-field-open">
          <span class="field-label">Od</span>
          <input type="time" value="${h.open}" data-field="open" data-i="${i}" ${h.closed ? "disabled" : ""} />
        </div>
        <div class="hours-field hours-field-close">
          <span class="field-label">Do</span>
          <input type="time" value="${h.close}" data-field="close" data-i="${i}" ${h.closed ? "disabled" : ""} />
        </div>
        <label class="checkbox-line">
          <input type="checkbox" data-field="closed" data-i="${i}" ${h.closed ? "checked" : ""} />
          Nieczynne
        </label>
      </div>`
    )
    .join("");
}

hoursWrap.addEventListener("input", (e) => {
  const t = e.target;
  if (!t.dataset.field) return;
  const i = +t.dataset.i;
  if (t.dataset.field === "closed") {
    workingData.hours[i].closed = t.checked;
    renderHours();
  } else {
    workingData.hours[i][t.dataset.field] = t.value;
  }
});

document.getElementById("saveHoursBtn").addEventListener("click", async () => {
  try {
    await store.save(workingData);
    toast("Godziny zapisane ✓ — odśwież stronę główną, aby zobaczyć zmiany.");
  } catch (err) {
    console.error(err);
    toast("⚠ Nie udało się zapisać — sprawdź połączenie z Firebase.");
  }
});

document.getElementById("revertHoursBtn").addEventListener("click", async () => {
  workingData = await store.load();
  renderHours();
  toast("Zmiany w godzinach cofnięte.");
});

function escapeAttr(str) {
  return (str ?? "").toString().replace(/"/g, "&quot;");
}
