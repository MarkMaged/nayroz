// =============================================================
// Coptic Nayrouz (عيد النيروز القبطي) — script.js
// Vanilla JavaScript. The name/greeting interaction is entirely
// client-side (no reload, no navigation, no API round-trip).
// Optional, non-blocking Firebase logging is kept at the bottom
// purely as background analytics — it never gates the UI.
// =============================================================

// -------------------------------------------------------------
// Coptic year calculation
//
// Nayrouz (Coptic New Year) falls on 11 September (Gregorian),
// except it falls on 12 September in the Gregorian year that
// immediately precedes a Gregorian leap year — because the
// underlying Julian calendar's leap day lands a day later than
// the Gregorian one. This holds from 1900 through 2099.
// Coptic year = Gregorian year - 283 once Nayrouz has occurred
// this year, otherwise - 284.
// -------------------------------------------------------------
function isGregorianLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getNayrouzDay(gregorianYear) {
  return isGregorianLeapYear(gregorianYear + 1) ? 12 : 11;
}

function getCopticNewYear(date = new Date()) {
  const year = date.getFullYear();
  const nayrouzThisYear = new Date(year, 8, getNayrouzDay(year)); // month 8 = September
  const hasPassed = date >= nayrouzThisYear;
  return hasPassed ? year - 283 : year - 284;
}

const copticYearEl = document.getElementById("coptic-year");
if (copticYearEl) {
  copticYearEl.textContent = String(getCopticNewYear());
}

// -------------------------------------------------------------
// DOM references
// -------------------------------------------------------------
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");
const formMessage = document.getElementById("form-message");

const greetingOverlay = document.getElementById("greeting-overlay");
const greetingBackdrop = document.getElementById("greeting-backdrop");
const greetingCard = document.getElementById("greeting-card");
const greetingClose = document.getElementById("greeting-close");
const greetingName = document.getElementById("greeting-name");
const confettiLayer = document.getElementById("confetti-layer");

const MAX_NAME_LENGTH = 60;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lastFocusedEl = null;

// -------------------------------------------------------------
// Greeting overlay open/close
// -------------------------------------------------------------
function openGreeting(name) {
  // Safe by construction: textContent never interprets HTML/script.
  greetingName.textContent = name;

  lastFocusedEl = document.activeElement;
  greetingOverlay.hidden = false;
  greetingCard.focus();
  document.body.style.overflow = "hidden";

  spawnConfetti();
}

function closeGreeting() {
  greetingOverlay.hidden = true;
  document.body.style.overflow = "";
  confettiLayer.innerHTML = "";
  if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
    lastFocusedEl.focus();
  }
}

greetingClose.addEventListener("click", closeGreeting);
greetingBackdrop.addEventListener("click", closeGreeting);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !greetingOverlay.hidden) {
    closeGreeting();
  }
});

// -------------------------------------------------------------
// Confetti — lightweight, small fixed count, cleaned up via CSS
// animation lifetime (no continuous DOM growth).
// -------------------------------------------------------------
const CONFETTI_COLORS = ["#d4af37", "#f3d97e", "#7a1f2b", "#e8748a", "#6f8f3f", "#2ea8a0"];

function spawnConfetti() {
  if (reduceMotion) return;

  confettiLayer.innerHTML = "";
  const count = window.innerWidth < 640 ? 26 : 46;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 6 + Math.random() * 8;
    const shape = Math.floor(Math.random() * 3); // 0 diamond, 1 circle, 2 cross-bar

    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.background = color;

    if (shape === 0) {
      piece.style.transform = "rotate(45deg)";
    } else if (shape === 1) {
      piece.style.borderRadius = "50%";
    } else {
      piece.style.height = `${size / 3}px`;
      piece.style.borderRadius = "2px";
    }

    const duration = 2.6 + Math.random() * 1.8;
    const delay = Math.random() * 0.4;
    const drift = (Math.random() - 0.5) * 220;
    const spin = 250 + Math.random() * 400;

    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.setProperty("--drift", `${drift}px`);
    piece.style.setProperty("--spin", `${spin}deg`);

    fragment.appendChild(piece);
  }

  confettiLayer.appendChild(fragment);

  window.setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 5000);
}

// -------------------------------------------------------------
// Form submit — entirely client-side: no reload, no navigation,
// no required network call to show the greeting.
// -------------------------------------------------------------
function setFormMessage(text) {
  formMessage.textContent = text;
}

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim().slice(0, MAX_NAME_LENGTH);

  if (!name) {
    nameInput.classList.add("invalid");
    setFormMessage("من فضلك اكتب اسمك أولاً ❤️");
    nameInput.focus();
    nameInput.addEventListener(
      "animationend",
      () => nameInput.classList.remove("invalid"),
      { once: true }
    );
    return;
  }

  setFormMessage("");
  openGreeting(name);
  logVisitorInBackground(name);
});

nameInput.addEventListener("input", () => {
  if (nameInput.classList.contains("invalid")) {
    nameInput.classList.remove("invalid");
  }
  if (formMessage.textContent) {
    setFormMessage("");
  }
});

// -------------------------------------------------------------
// Decorative background: floating golden particles + palm leaves.
// Purely visual, DOM-light, respects prefers-reduced-motion.
// -------------------------------------------------------------
function initBackgroundEffects() {
  if (reduceMotion) return;

  const particlesContainer = document.getElementById("particles");
  const leavesContainer = document.getElementById("leaves");

  const particleCount = window.innerWidth < 600 ? 12 : 24;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("span");
    particle.className = "particle";

    const size = 2 + Math.random() * 4;
    const duration = 3 + Math.random() * 3.5;
    const delay = Math.random() * 5;

    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    particlesContainer.appendChild(particle);
  }

  const leafCount = window.innerWidth < 600 ? 3 : 6;
  for (let i = 0; i < leafCount; i++) {
    const leaf = document.createElement("span");
    leaf.className = "leaf-drift";
    leaf.innerHTML = '<svg viewBox="0 0 200 90"><use href="#motif-palm"></use></svg>';

    const duration = 26 + Math.random() * 16;
    const delay = Math.random() * -30;
    const left = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200;
    const size = 40 + Math.random() * 30;

    leaf.style.left = `${left}vw`;
    leaf.style.width = `${size}px`;
    leaf.style.animationDuration = `${duration}s`;
    leaf.style.animationDelay = `${delay}s`;
    leaf.style.setProperty("--drift", `${drift}px`);

    leavesContainer.appendChild(leaf);
  }
}

initBackgroundEffects();

// -------------------------------------------------------------
// Optional background logging (Firebase Firestore) — fire and
// forget. This never blocks or gates the celebration UI above;
// it only records that a visitor celebrated, for the site owner
// to see later in the Firebase Console.
// -------------------------------------------------------------
let logVisitorInBackground = () => {};

(async function initOptionalLogging() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js");
    const { getFirestore, collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js"
    );

    const firebaseConfig = {
      apiKey: "AIzaSyDfGdkRYHNjDbPuoQoMjoQiRJ4mHSi6GVo",
      authDomain: "nayroz-new-year.firebaseapp.com",
      projectId: "nayroz-new-year",
      storageBucket: "nayroz-new-year.firebasestorage.app",
      messagingSenderId: "178291135911",
      appId: "1:178291135911:web:1dca659a4abe50f1fbd282",
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    logVisitorInBackground = (name) => {
      addDoc(collection(db, "nayroz_users"), {
        name,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        console.warn("Background visitor log failed (non-blocking):", err);
      });
    };
  } catch (err) {
    console.warn("Optional Firebase logging unavailable (non-blocking):", err);
  }
})();
