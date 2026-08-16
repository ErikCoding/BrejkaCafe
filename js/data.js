/**
 * Brëjka Café — data layer
 * ------------------------------------------------------------
 * Everything the site needs to render (café info, opening hours,
 * menu, gallery, social links) lives in DEFAULT_DATA below.
 *
 * Persistence is handled by `store`, a tiny abstraction with
 * get()/save() methods. Today it's backed by localStorage so the
 * site + admin panel work fully offline / locally. When you're
 * ready to go live, flip BACKEND to "firebase" and fill in
 * js/firebase-config.js — see js/firebase-sync.js and README.md
 * for the exact steps. Nothing else in main.js / admin.js needs
 * to change because both only ever talk to `store`.
 * ------------------------------------------------------------
 */

// ⚙️ "local"  -> localStorage (default, works offline, no setup)
// ⚙️ "firebase" -> Firestore + Storage (see js/firebase-sync.js)
// Now pointed at the real "brejkacafe" Firebase project (js/firebase-config.js).
// Falls back to localStorage automatically if the Firebase SDK/scripts
// aren't present (see the `store` picker at the bottom of this file),
// so the site still works if firebase-sync.js is ever removed.
const BACKEND = "firebase";

// Bump the trailing number whenever DEFAULT_DATA's built-in content
// changes (photos, copy, etc.) during development/testing. Browsers
// that already have an older key saved (e.g. from opening the admin
// panel and clicking "Zapisz zmiany" once, even without editing
// anything) will simply stop finding it and fall back cleanly to the
// new defaults, instead of silently keeping the old snapshot forever.
// Real menu/hours edits made by the café owner after launch are safe
// — only bump this if you need to force-clear test data.
const STORAGE_KEY = "brejka_cafe_data_v2";

/**
 * ⚠️ PLACEHOLDER CONTENT
 * Every value marked TODO below is a placeholder so the site can be
 * built and previewed before real client details are confirmed.
 * Replace them here, or (for menu + hours) simply edit them from
 * the admin panel at /admin.html — changes made there are saved
 * automatically and override these defaults.
 */
const DEFAULT_DATA = {
  cafe: {
    name: "Brëjka Café",
    owner: "Marta Jaworska",
    tagline: "Kawiarnia w sercu Kartuz",
    address: "Kościuszki 4, 83-300 Kartuzy",
    // TODO: replace with the real phone number
    phone: "+48 000 000 000",
    email: "kontakt@brejkacafe.pl",
    // Real Google Maps embed pointing at the café.
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2380.9834788147878!2d18.200802076854057!3d54.33122787259126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46fd9ba09c15194d%3A0x30a857df9d5bc2a1!2zQnLDq2prYSBDYWbDqQ!5e1!3m2!1spl!2spl!4v1786884860772!5m2!1spl!2spl",
    mapLinkUrl: "https://maps.app.goo.gl/KQDfj7H9Njg1tbJK7",
    about:
      "Brëjka Café to kameralne miejsce w samym sercu Kartuz, gdzie kaszubska gościnność spotyka się z nowoczesną kawiarnianą kulturą. Nazwa nawiązuje do „brëjki” — tradycyjnego kaszubskiego napoju, który od pokoleń rozgrzewał mieszkańców Kaszub. U nas znajdziesz spokojne wnętrze, dobrą kawę i domowe wypieki — idealne miejsce na poranną kawę, popołudniowe spotkanie czy chwilę tylko dla siebie.",
    roastNote:
      "Nasza kawa jest palona w małych partiach niemal wyłącznie dla Brëjka Café — świeżo, z dbałością o każdy detal, dzięki czemu każda filiżanka smakuje tak, jak powinna.",
  },

  hours: [
    { day: "Poniedziałek", open: "08:00", close: "18:00", closed: false },
    { day: "Wtorek", open: "08:00", close: "18:00", closed: false },
    { day: "Środa", open: "08:00", close: "18:00", closed: false },
    { day: "Czwartek", open: "08:00", close: "18:00", closed: false },
    { day: "Piątek", open: "08:00", close: "19:00", closed: false },
    { day: "Sobota", open: "09:00", close: "16:00", closed: false },
    { day: "Niedziela", open: "10:00", close: "15:00", closed: false },
  ],

  social: {
    facebook: "https://www.facebook.com/profile.php?id=61592905112508",
    instagram: "https://www.instagram.com/brejkacafe/",
    tiktok: "https://www.tiktok.com/@brjka_caf",
  },

  gallery: [
    { src: "assets/img/interior-gallery.jpg", alt: "Wnętrze Brëjka Café" },
    {
      src: "https://images.unsplash.com/photo-1750583834656-cfa910e44b22?q=80&w=1000&auto=format&fit=crop",
      alt: "Nowoczesne, minimalistyczne wnętrze kawiarni",
      placeholder: true,
    },
    {
      src: "https://images.unsplash.com/photo-1758900450186-e829f72d25fb?q=80&w=1000&auto=format&fit=crop",
      alt: "Kawa z latte art",
      placeholder: true,
    },
    {
      src: "https://images.unsplash.com/photo-1623334044303-241021148842?q=80&w=1000&auto=format&fit=crop",
      alt: "Świeże croissanty na stole",
      placeholder: true,
    },
  ],

  // Real photo from the café, shown next to the "roasted for us" note.
  roastImage: {
    src: "assets/img/coffee-bags.jpg",
    alt: "Kawa Brëjka Café — Jantar, palona na Kaszubach",
    placeholder: false,
  },

  menu: [
    {
      category: "Kawa",
      items: [
        {
          id: "esp",
          name: "Espresso",
          desc: "Klasyka — mocna i aromatyczna baza każdej kawy.",
          price: "8 zł",
          img: "",
        },
        {
          id: "cap",
          name: "Cappuccino",
          desc: "Espresso, mleko i delikatna pianka.",
          price: "13 zł",
          img: "",
        },
        {
          id: "flat",
          name: "Flat White",
          desc: "Podwójne espresso z aksamitnym mlekiem.",
          price: "15 zł",
          img: "",
        },
        {
          id: "brejka",
          name: "Kawa z Brëjki",
          desc: "Autorska kawa kawiarni — nasz sekretny przepis.",
          price: "17 zł",
          img: "",
        },
        {
          id: "latte",
          name: "Latte",
          desc: "Łagodna kawa mleczna, na ciepło lub z lodem.",
          price: "15 zł",
          img: "",
        },
      ],
    },
    {
      category: "Napoje",
      items: [
        {
          id: "tea",
          name: "Herbata liściasta",
          desc: "Wybór herbat czarnych, zielonych i owocowych.",
          price: "11 zł",
          img: "",
        },
        {
          id: "choc",
          name: "Czekolada na gorąco",
          desc: "Gęsta, prawdziwa czekolada — rozgrzewa w chwilę.",
          price: "16 zł",
          img: "",
        },
        {
          id: "lemon",
          name: "Domowa lemoniada",
          desc: "Sezonowe owoce i świeża mięta.",
          price: "14 zł",
          img: "",
        },
      ],
    },
    {
      category: "Słodkości",
      items: [
        {
          id: "cheese",
          name: "Sernik na zimno",
          desc: "Kremowy, lekki, robiony na miejscu.",
          price: "16 zł",
          img: "",
        },
        {
          id: "apple",
          name: "Szarlotka",
          desc: "Podawana na ciepło, z nutą cynamonu.",
          price: "15 zł",
          img: "",
        },
        {
          id: "croissant",
          name: "Croissant migdałowy",
          desc: "Maślany, chrupiący, z migdałową nutą.",
          price: "12 zł",
          img: "",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------
 * Store — localStorage implementation (default / BACKEND="local")
 * ------------------------------------------------------------ */
const localStore = {
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      // shallow-merge so newly added default fields still show up
      // for users who already have older saved data
      return { ...structuredClone(DEFAULT_DATA), ...parsed };
    } catch (e) {
      console.warn("Could not read saved data, falling back to defaults.", e);
      return structuredClone(DEFAULT_DATA);
    }
  },
  async save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },
  async reset() {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(DEFAULT_DATA);
  },
};

/**
 * `store` is what main.js / admin.js actually use. Swapping BACKEND to
 * "firebase" (after configuring js/firebase-config.js and including
 * js/firebase-sync.js on the page) transparently swaps the backing
 * implementation — no other code needs to change.
 */
const store =
  BACKEND === "firebase" && window.firebaseStore ? window.firebaseStore : localStore;
