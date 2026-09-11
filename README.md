# 🌴 Coptic Nayrouz Greeting — عيد النيروز القبطي

A beautiful, responsive, single-page Coptic New Year (Nayrouz) greeting card
built with plain **HTML, CSS, and vanilla JavaScript**. The name/greeting
interaction is entirely client-side (no reload, no navigation, nothing waits
on a network call); an optional, non-blocking **Firebase Firestore** write
in the background lets the site owner see who stopped by.

No frameworks. No build step. This project is already wired up to a
dedicated Firebase project created for it, **`nayroz-new-year`** — the
config in [script.js](script.js) is filled in, so it works out of the box
once the security rules below are published.

## File structure

```text
nayroz/
│
├── index.html        → page structure (hero, name form, greeting overlay)
├── style.css         → all styling, gradients, animations, responsive layout
├── script.js         → Coptic year calc, form logic, greeting, Firebase logging
├── firestore.rules   → the security rules, as text you paste into the Console
└── README.md         → this file
```

## How it works

1. The visitor lands on the hero: **عيد النيروز القبطي**, the current Coptic
   year (calculated dynamically from today's date — never hard-coded), and a
   name form.
2. They type their name and press **احتفل بالنيروز**.
3. If the name is empty, an inline validation message appears
   ("من فضلك اكتب اسمك أولاً ❤️") and nothing else happens.
4. Otherwise a celebration overlay appears **immediately** — "Happy New
   Nayroz Year 🎉" with the visitor's name, Coptic decorations, and a
   confetti burst. This never waits on a network call: it's a purely
   client-side interaction (no reload, no navigation, no required API call).
5. In the background, the name is optionally also saved to Firestore
   (fire-and-forget) purely so the site owner can see who celebrated — if
   that write fails or is slow, the visitor never notices, since the
   greeting already rendered.

---

## 1. Firebase project (already configured)

This project uses a dedicated Firebase project created specifically for it,
**`nayroz-new-year`** — no new project needs to be created. The web app
config is already pasted into [script.js](script.js):

```js
const firebaseConfig = {
  apiKey: "AIzaSyDfGdkRYHNjDbPuoQoMjoQiRJ4mHSi6GVo",
  authDomain: "nayroz-new-year.firebaseapp.com",
  projectId: "nayroz-new-year",
  storageBucket: "nayroz-new-year.firebasestorage.app",
  messagingSenderId: "178291135911",
  appId: "1:178291135911:web:1dca659a4abe50f1fbd282",
  measurementId: "G-2T2XT3Y7BE",
};
```

This config is safe to expose in frontend code — it identifies your project
but does **not** grant admin access. Access control is handled entirely by
Firestore Security Rules (step 3 below), not by hiding this config.

Note: this project's Firebase Console setup snippet also included
`getAnalytics(app)` — that's left out of `script.js` on purpose. This app
only needs Firestore, and initializing Analytics would start collecting
browser/usage data beyond the `name` + `createdAt` this project is scoped
to store.

## 2. Enable Firestore Database (if not already enabled)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   open the **`nayroz-new-year`** project.
2. In the left sidebar, go to **Build → Firestore Database**. Since you
   mentioned Firestore is already enabled for this project, this should
   already show your (empty) database.
3. If you instead see a **Create database** button, click it, choose a
   location, and start in **Production mode** (we'll add strict security
   rules next).

You do **not** need to manually create any collection or table beforehand.
Firestore has no schema to define up front — the first successful `addDoc()`
call from the website will automatically create the `nayroz_users`
collection and its first document.

## 3. Configure Firestore Security Rules

**This step is required before the website can save anything.** A brand-new
(or "Production mode") Firestore database starts with the default rule
`allow read, write: if false;` — meaning *everything* is denied, including
the public `create` this app needs, until you explicitly publish rules that
allow it. Skipping this step is exactly what produces a browser console
error like:

```text
FirebaseError: Missing or insufficient permissions.
```

The full rules are in [firestore.rules](firestore.rules) in this repo — copy
them from there, or from here:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /nayroz_users/{visitorId} {

      allow create: if
        // Only "name" and "createdAt" are allowed — no extra fields.
        request.resource.data.keys().hasOnly(['name', 'createdAt']) &&
        request.resource.data.keys().hasAll(['name', 'createdAt']) &&

        // "name" must exist, be a string, non-empty, and reasonably short.
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 100 &&

        // "createdAt" must be a timestamp, and specifically the server's
        // own request time — this is what serverTimestamp() resolves to
        // at write time, so this does NOT reject serverTimestamp() calls.
        // It does reject a client-supplied/spoofed Timestamp value.
        request.resource.data.createdAt is timestamp &&
        request.resource.data.createdAt == request.time;

      // No client — authenticated or not — may read, update, or delete.
      allow read, update, delete: if false;
    }
  }
}
```

To publish it:

1. Go to the [Firebase Console](https://console.firebase.google.com/) →
   project **`nayroz-new-year`** → **Build → Firestore Database → Rules**.
2. Select all the existing text in the rules editor and replace it with the
   rules above.
3. Click **Publish**.
4. Wait a few seconds for the rules to propagate, then retry the website.

This means:

- ✅ The public page can **create** new visitor records (no sign-in required).
- 🚫 The public page **cannot read** the visitor list back.
- 🚫 The public page **cannot update** or **delete** any visitor record.
- 🚫 Documents with a missing/invalid `name`, a non-timestamp or spoofed
  `createdAt`, or any extra field beyond `name`/`createdAt` are rejected by
  Firestore itself, before they're ever written.
- ✅ `createdAt: serverTimestamp()` is correctly accepted: Firestore resolves
  that sentinel value to the server's actual request time *before* the rules
  run, so `request.resource.data.createdAt == request.time` matches it. A
  rule like `request.resource.data.createdAt is timestamp` alone would also
  pass, but adding the `== request.time` check additionally stops a client
  from writing an arbitrary (past or future) timestamp of its own choosing.

## 4. Run the project locally

This is a static site — no build tools or `npm install` required. You just
need to serve the files over HTTP (opening `index.html` directly via
`file://` can cause the Firebase module imports to be blocked by the
browser).

Any of these work:

```bash
# Option 1: Python (built into most systems)
python3 -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: VS Code
# Install the "Live Server" extension, right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8000` in your browser.

## 5. Deploy to GitHub Pages (or any static host)

**GitHub Pages:**

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (e.g. `main`) and root folder (`/`).
4. Save. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/`.

**Other static hosts** (Netlify, Vercel, Firebase Hosting, Cloudflare Pages)
work the same way — just point them at this folder. No build command is
needed since there's no bundler involved.

> 💡 If you deploy to a new domain, make sure it's an authorized domain in
> **Firebase Console → Authentication → Settings → Authorized domains**
> (this list also affects some Firestore/App Check configurations). For
> plain Firestore writes without Firebase Auth, this step usually isn't
> required, but it's good practice to check.

## 6. View visitors in the Firebase Console

Since the app intentionally cannot read the visitor list back (see the
security rules above), the Firebase Console is the only place to view it.
Firestore is schemaless — there's no SQL-style table to create manually; a
collection simply appears the first time a document is written to it.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Open the **`nayroz-new-year`** project.
3. Go to **Build → Firestore Database → Data**.
4. Open the website (see "Run the project locally" above), enter a name
   (e.g. "Ahmed"), and click **Continue**.
5. Back in the console, the **`nayroz_users`** collection now appears
   automatically with one auto-generated document ID inside it:

   ```text
   nayroz_users
      └── <auto-generated document ID>
             ├── name: "Ahmed"
             └── createdAt: September 11, 2026 at ...
   ```

6. Each document contains **only** these two fields — nothing else is ever
   saved:

   ```js
   {
     name: "Ahmed",
     createdAt: <Firestore Timestamp>
   }
   ```

7. Submit a few more names and confirm each one creates its own separate
   document (never overwriting a previous one), each with its own
   auto-generated ID rather than the visitor's name as the ID.

---

## Troubleshooting

### "FirebaseError: Missing or insufficient permissions."

This means Firestore itself rejected the write — it's not a bug in
`script.js`. It happens when:

- The Firestore Security Rules haven't been published yet (see "Configure
  Firestore Security Rules" above) — this is the most common cause, and
  what a freshly-created Production-mode database defaults to.
- The rules were published but don't match the document being written —
  e.g. a typo in the collection name, a stray extra field, or `name` being
  empty/too long.

To confirm the rules are the cause: open **Firebase Console → Firestore
Database → Rules** and check the currently published rules match
[firestore.rules](firestore.rules) exactly, then hit **Publish** again even
if they look right (this is a real fix — the editor can hold unsaved/unpublished
edits). Then reload the website and try again.

### `net::ERR_BLOCKED_BY_CLIENT` on the Firestore request

This is almost always caused by a **browser extension** — most commonly an ad
blocker or privacy tool (uBlock Origin, AdBlock Plus, Brave Shields, Privacy
Badger, etc.) — that blocks requests whose URL contains patterns like
`/channel` or matches a "tracking/analytics" filter list. Firestore's
real-time `Write/channel` streaming endpoint is a frequent false-positive
target for these lists. It is **not** a bug in this project's code, and it is
unrelated to the "Missing or insufficient permissions" error — Firestore's
SDK automatically falls back to a different transport when this happens, so
a blocked `/channel` request alone does not necessarily break the save.

To confirm whether an extension is responsible:

1. **Open the site in an Incognito/Private window** with extensions disabled
   (Chrome Incognito disables most extensions by default unless you've
   explicitly allowed them to run there) and try again.
2. **Temporarily disable your extensions** one at a time (starting with any
   ad blocker or privacy/security extension) in your normal window, reload,
   and retry.
3. **Try a different browser** you don't have extensions installed in.

If the error disappears in any of these cases, an extension was responsible
and no code change is needed. If `Missing or insufficient permissions` still
appears even with extensions fully disabled, that confirms the real issue is
the Firestore rules, not the browser extension — fix that first as described
above.

## Security notes

- Only the **Firebase Web SDK** (public, client-safe) is used — never the
  Admin SDK or any service-account credentials, which must never appear in
  frontend code. The API key in `firebaseConfig` is not a secret; it only
  identifies the project, and real protection comes from the Firestore rules.
- Only two fields are ever collected: **`name`** and **`createdAt`**. No
  passwords, emails, phone numbers, addresses, precise location, IP address,
  user agent, or device/browser information is saved.
- The visitor's name is displayed using `textContent` (never `innerHTML`),
  so it cannot be used to inject HTML or scripts into the page.
- Name length is capped at 60 characters in the UI (`maxlength`); the
  Firestore rules separately enforce a 100-character server-side limit and
  reject any document that contains fields other than `name`/`createdAt`.

## Customizing

- **Colors & fonts**: edit the CSS custom properties at the top of
  [style.css](style.css) (`:root { ... }`).
- **Greeting content**: edit the text inside `#greeting-overlay` in
  [index.html](index.html).
- **Firestore collection name**: change the collection name passed to
  `collection(db, ...)` in [script.js](script.js) (remember to update your
  security rules to match).

Happy Coptic Nayrouz! 🌴 عيد نيروز سعيد
