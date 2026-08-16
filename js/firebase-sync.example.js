/**
 * Firebase-backed implementation of the `store` interface used by
 * main.js / admin.js — a drop-in replacement for the localStorage
 * version in js/data.js.
 *
 * ---- How to switch the site over to Firebase ----
 * 1. Create a Firebase project → enable Firestore, Storage, and
 *    Authentication (Email/Password) for the admin login.
 * 2. Copy js/firebase-config.example.js → js/firebase-config.js and
 *    fill in your real project config.
 * 3. Copy this file → js/firebase-sync.js (drop ".example" from the
 *    name).
 * 4. In index.html and admin.html, add BEFORE the data.js <script>
 *    tag:
 *      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
 *      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
 *      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>
 *      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
 *      <script src="js/firebase-config.js"></script>
 *      <script src="js/firebase-sync.js"></script>
 * 5. In js/data.js, change:  const BACKEND = "local";  ->  "firebase"
 * 6. In admin.html, replace the simple password form with Firebase
 *    Authentication (signInWithEmailAndPassword) — the ADMIN_PASSWORD
 *    constant in admin.js is a placeholder only and should be removed.
 *
 * The Firestore document layout mirrors DEFAULT_DATA in data.js
 * exactly (one document: cafes/brejka), so admin.js and main.js do
 * not need any changes beyond the BACKEND flag.
 */

/* eslint-disable no-undef */
(function () {
  if (typeof firebase === "undefined") {
    console.warn(
      "firebase-sync.js loaded but the Firebase SDK scripts were not found. " +
        "Add the firebase-app / firebase-firestore / firebase-storage script " +
        "tags before this file."
    );
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storageRef = firebase.storage().ref();

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
      const snap = await db.doc(DOC_PATH).get();
      if (!snap.exists) {
        // seed Firestore with the local defaults the first time
        await db.doc(DOC_PATH).set(DEFAULT_DATA);
        return structuredClone(DEFAULT_DATA);
      }
      return { ...structuredClone(DEFAULT_DATA), ...snap.data() };
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
