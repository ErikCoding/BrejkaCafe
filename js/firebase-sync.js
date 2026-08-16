/**
 * Firebase-backed implementation of the `store` interface used by
 * main.js / admin.js — a drop-in replacement for the localStorage
 * version in js/data.js. Active now that js/data.js has
 * BACKEND = "firebase" and this file is loaded (see index.html /
 * admin.html script order).
 *
 * The Firestore document layout mirrors DEFAULT_DATA in js/data.js
 * exactly (one document: cafes/brejka), so admin.js and main.js do
 * not need any changes beyond the BACKEND flag.
 *
 * Also exposes `window.firebaseAuth` (a plain `firebase.auth()`
 * instance) so admin.js can sign the café owner in/out with real
 * Firebase Authentication instead of the hardcoded demo password.
 *
 * One-time setup still needed in the Firebase console before this
 * actually works end-to-end (see README.md for the full checklist):
 *   1. Enable Firestore Database, Storage, and Authentication
 *      (Email/Password provider) for the "brejkacafe" project.
 *   2. Create one Authentication user (email + password) for the
 *      café owner — that's the admin login for /admin.html.
 *   3. Deploy firestore.rules / storage.rules with that user's UID
 *      filled in (`firebase deploy --only firestore:rules,storage:rules`).
 */

/* eslint-disable no-undef */
(function () {
  if (typeof firebase === "undefined") {
    console.warn(
      "firebase-sync.js loaded but the Firebase SDK scripts were not found. " +
        "Add the firebase-app / firebase-firestore / firebase-storage / " +
        "firebase-auth script tags before this file."
    );
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storageRef = firebase.storage().ref();

  window.firebaseAuth = firebase.auth();

  const DOC_PATH = "cafes/brejka";

  async function uploadImageIfNeeded(dataUrl, pathHint) {
    // Menu item images edited in the admin panel start life as base64
    // data URLs (see admin.js). Before saving to Firestore, upload
    // any new ones to Firebase Storage and store the resulting URL
    // instead, so Firestore documents stay small.
    if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
    const ref = storageRef.child(
      `menu-images/${pathHint}-${Date.now()}.jpg`
    );
    await ref.putString(dataUrl, "data_url");
    return await ref.getDownloadURL();
  }

  window.firebaseStore = {
    async load() {
      // Never let a Firestore hiccup (rules not deployed yet, database
      // not created yet, offline, etc.) take the whole public site
      // down with it — fall back to the defaults baked into the code
      // instead of throwing. Saving from the admin panel still throws
      // on failure (see save() below) so the admin actually finds out
      // if something didn't persist.
      try {
        const snap = await db.doc(DOC_PATH).get();
        if (!snap.exists) {
          // seed Firestore with the local defaults the first time
          await db.doc(DOC_PATH).set(DEFAULT_DATA);
          return structuredClone(DEFAULT_DATA);
        }
        return { ...structuredClone(DEFAULT_DATA), ...snap.data() };
      } catch (err) {
        console.warn(
          "Nie udało się połączyć z Firestore — pokazuję dane domyślne z kodu. " +
            "Sprawdź czy Firestore/Storage są włączone w konsoli Firebase i czy " +
            "reguły (firestore.rules) zostały wdrożone — patrz README.md.",
          err
        );
        return structuredClone(DEFAULT_DATA);
      }
    },

    async save(data) {
      // upload any freshly-picked images (data URLs) to Storage first
      for (const cat of data.menu) {
        for (const item of cat.items) {
          item.img = await uploadImageIfNeeded(item.img, item.id || item.name);
        }
      }
      await db.doc(DOC_PATH).set(data);
      return true;
    },

    async reset() {
      await db.doc(DOC_PATH).set(DEFAULT_DATA);
      return structuredClone(DEFAULT_DATA);
    },
  };
})();
