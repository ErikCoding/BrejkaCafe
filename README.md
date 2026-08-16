# Brëjka Café — strona internetowa

Statyczna strona (HTML/CSS/JS, bez frameworka i bez konieczności buildowania) dla
kawiarni Brëjka Café w Kartuzach. Działa lokalnie od razu po otwarciu pliku
`index.html`, a cała warstwa danych jest przygotowana pod przyszłe podpięcie
pod Firebase.

## Jak zobaczyć stronę

Najprościej odpalić lokalny serwer w folderze projektu (otwarcie `index.html`
bezpośrednio z dysku też zadziała, ale niektóre przeglądarki ograniczają
`fetch`/moduły przy `file://`, dlatego lokalny serwer jest bezpieczniejszy):

```bash
cd brejka-cafe
python3 -m http.server 8080
# potem wejdź na http://localhost:8080
```

Panel administratora: `http://localhost:8080/admin.html` (celowo nie ma do
niego linku w nawigacji — to jest ten "ukryty panel").
Domyślne hasło demo: **brejka2026** (zmień w `js/admin.js`, stała
`ADMIN_PASSWORD`).

## Struktura projektu

```
brejka-cafe/
├─ index.html                 ← strona główna
├─ admin.html                 ← ukryty panel administratora
├─ css/
│  ├─ style.css                ← style strony głównej
│  └─ admin.css                ← style panelu admina
├─ js/
│  ├─ data.js                  ← treść strony + warstwa zapisu (localStorage / Firebase)
│  ├─ main.js                  ← renderowanie strony głównej
│  ├─ admin.js                 ← logika panelu admina
│  ├─ firebase-config.example.js
│  └─ firebase-sync.example.js ← gotowa implementacja pod Firebase (patrz niżej)
└─ assets/img/                 ← logo + zdjęcia (w tym zdjęcia tymczasowe z Unsplash)
```

## ⚠️ Do zrobienia przed publikacją (dane tymczasowe)

Kilka rzeczy w kodzie to celowe placeholdery — działają i wyglądają dobrze,
ale trzeba je podmienić na prawdziwe dane klienta:

| Co | Gdzie | Jak zmienić |
|---|---|---|
| Numer telefonu | `js/data.js` → `cafe.phone` | wpisać realny numer |
| Zdjęcie kawy (sekcja "nasza kawa") | `js/data.js` → `roastImage.src` | podmienić na własne zdjęcie po dodaniu go do `assets/img/` |
| 3 zdjęcia w galerii | `js/data.js` → `gallery` (oznaczone `placeholder: true`) | podmienić na własne zdjęcia |
| Hasło do panelu admina | `js/admin.js` → `ADMIN_PASSWORD` | zmienić na docelowe (a docelowo — patrz sekcja Firebase) |

Menu i godziny otwarcia **nie trzeba** zmieniać w kodzie — można to zrobić
od razu w panelu administratora (`/admin.html`).

## Mapa Google

Obecnie mapa pokazuje samo centrum Kartuz jako placeholder. Aby wskazywała
dokładnie na kawiarnię:

1. Wejdź na [Google Maps](https://maps.google.com), wyszukaj dokładny adres.
2. Kliknij „Udostępnij” → „Umieść mapę” (Embed a map) i skopiuj adres z
   atrybutu `src` w wygenerowanym kodzie `<iframe>`.
3. Wklej go jako `cafe.mapEmbedUrl` w `js/data.js`.
4. Jako `cafe.mapLinkUrl` wklej zwykły link „Udostępnij” (do otwierania
   mapy w nowej karcie).

## Wygląd strony

Czarne tło, złoto i głęboka zieleń, nawiązujące wprost do wnętrza kawiarni
(lampy, fotele). Kolory można dostroić w `css/style.css` w sekcji `:root`.

## Panel administratora

Dostępny pod `/admin.html` (bez linku w menu — adres trzeba znać). Pozwala:

- edytować pozycje menu: nazwę, opis, cenę i zdjęcie (upload z dysku),
  dodawać/usuwać pozycje i całe kategorie,
- edytować godziny otwarcia dla każdego dnia tygodnia (w tym oznaczać dzień
  jako nieczynny),
- eksportować/importować dane jako plik JSON (kopia zapasowa),
- przywrócić dane domyślne.

Zapis danych: projekt jest teraz podpięty pod prawdziwy Firebase (projekt
`brejkacafe`) — patrz sekcja niżej co jeszcze trzeba włączyć w konsoli,
żeby to faktycznie zaczęło działać end-to-end. Dopóki Firestore/Storage/
Authentication nie są tam włączone, `firebase-sync.js` po cichu nie
zadziała i strona automatycznie wróci do zapisu lokalnego (`localStorage`)
— więc nic się nie wysypie, ale zmiany nie będą synchronizować się między
urządzeniami, dopóki nie dokończysz konfiguracji w konsoli Firebase.

Logowanie do panelu: teraz **prawdziwe Firebase Authentication**
(e-mail + hasło) zamiast demo-hasła — konto trzeba najpierw utworzyć w
konsoli Firebase (patrz kroki niżej).

## Firebase — status i co jeszcze zrobić w konsoli

Kod jest już w pełni podpięty (`js/firebase-config.js` z prawdziwym
configiem projektu `brejkacafe`, `js/firebase-sync.js` aktywny,
`BACKEND = "firebase"` w `js/data.js`, logowanie w `admin.html` przez
Firebase Auth). Zostały tylko kroki po stronie konsoli Firebase —
bez nich `/admin.html` będzie pokazywać błąd logowania, a strona główna
po cichu będzie działać na pustych/domyślnych danych:

1. **Włącz produkty** w [Firebase Console](https://console.firebase.google.com/project/brejkacafe):
   - Firestore Database → utwórz bazę (tryb produkcyjny).
   - Storage → włącz.
   - Authentication → Sign-in method → włącz **E-mail/hasło**.
2. **Utwórz konto admina**: Authentication → Users → Add user
   (e-mail + hasło, którymi będziesz logować się w `/admin.html`).
3. **Skopiuj UID** tego użytkownika (kolumna w tabeli Users).
4. W plikach `firestore.rules` i `storage.rules` podmień
   `REPLACE_WITH_ADMIN_UID` na to UID.
5. Wdróż reguły:
   ```bash
   npm install -g firebase-tools   # jeśli jeszcze nie masz
   firebase login
   firebase use --add              # wybierz projekt "brejkacafe"
   firebase deploy --only firestore:rules,storage:rules
   ```
6. Zaloguj się w `/admin.html` danymi z kroku 2 — od teraz zmiany w menu
   i godzinach zapisują się bezpośrednio w Firestore i są widoczne dla
   każdego odwiedzającego stronę, z dowolnego urządzenia.

## Podpięcie pod Firebase — jak to działa pod spodem

Warstwa danych (`js/data.js`) jest zbudowana wokół jednego obiektu
`store` z metodami `load()` / `save()` / `reset()` — `main.js` i
`admin.js` zawsze rozmawiają tylko z nim, więc nie musiały się zmienić,
kiedy backend przeszedł z `localStorage` na Firebase. Co dokładnie się
zmieniło (dla orientacji, jeśli będziesz to kiedyś modyfikować):

- `js/firebase-config.js` — prawdziwy config projektu `brejkacafe`
  (`apiKey`, `projectId` itd. — te wartości nie są tajne, bezpieczeństwo
  zapewniają reguły, nie ukrywanie configu).
- `js/firebase-sync.js` — implementacja `store` na Firestore + Storage,
  plus `window.firebaseAuth` używane przez `admin.js` do logowania.
- `index.html` / `admin.html` — dociągają SDK Firebase (4 skrypty
  `firebase-*-compat.js`) oraz `firebase-config.js` i `firebase-sync.js`
  **przed** `js/data.js`, żeby `window.firebaseStore` istniało zanim
  `data.js` go użyje.
- `js/data.js` — `BACKEND = "firebase"`. Jeśli z jakiegoś powodu SDK się
  nie załaduje (np. brak internetu), kod po cichu wraca do
  `localStorage`, więc strona nigdy się nie wysypuje — tylko przestaje
  synchronizować dane w chmurze.
- `js/admin.js` — logowanie automatycznie przełącza się na prawdziwe
  Firebase Authentication (`signInWithEmailAndPassword`) zamiast
  demo-hasła, wykrywając to samo `BACKEND === "firebase"`.

Reguły bezpieczeństwa (`firestore.rules`, `storage.rules`) i kroki
wdrożenia są opisane wyżej, w sekcji **„Firebase — status i co jeszcze
zrobić w konsoli”**.

## Hosting

Po podpięciu Firebase najprościej wdrożyć przez **Firebase Hosting**:

```bash
firebase deploy --only hosting
```

`firebase.json` ma już skonfigurowany katalog strony jako publiczny —
strona jest czysto statyczna, więc nie wymaga żadnego dodatkowego builda.
Możesz też wdrożyć wszystko naraz: `firebase deploy`.

## Źródła zdjęć tymczasowych

Zdjęcia oznaczone w kodzie jako `placeholder: true` pochodzą z Unsplash
(darmowa licencja) i służą wyłącznie jako tymczasowe wypełnienie do czasu
podmiany na prawdziwe zdjęcia kawiarni:

- ziarna kawy — Indra Projects, Unsplash
- wnętrze kawiarni — rawkkim, Unsplash
- kawa z latte art — Unsplash
- croissanty — Unsplash
