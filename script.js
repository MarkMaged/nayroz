// =============================================================
// Nowruz Greeting — script.js
// Vanilla JavaScript + Firebase Firestore (modular Web SDK, CDN)
// =============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// -------------------------------------------------------------
// 🔥 FIREBASE CONFIGURATION — PASTE YOUR REAL CONFIG HERE 🔥
//
// Get this object from:
//   Firebase Console → Project Settings → General →
//   "Your apps" → Web app → SDK setup and configuration → Config
//
// See README.md for the full step-by-step guide.
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const VISITORS_COLLECTION = "nowruz_visitors";
const MAX_NAME_LENGTH = 100;

let db = null;
let firebaseReady = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseReady = true;
} catch (err) {
  // Initialization fails, e.g. if firebaseConfig still holds placeholder
  // values, or Firestore isn't reachable. We handle this gracefully at
  // submit time rather than crashing the page.
  console.error("Firebase failed to initialize:", err);
  firebaseReady = false;
}

// -------------------------------------------------------------
// DOM references
// -------------------------------------------------------------
const nameScreen = document.getElementById("name-screen");
const greetingScreen = document.getElementById("greeting-screen");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");
const continueBtn = document.getElementById("continue-btn");
const formMessage = document.getElementById("form-message");
const greetingName = document.getElementById("greeting-name");

let isSubmitting = false;

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function setFormMessage(text, type = "error") {
  formMessage.textContent = text;
  formMessage.classList.toggle("success", type === "success");
}

function setLoading(isLoading) {
  isSubmitting = isLoading;
  continueBtn.disabled = isLoading;
  continueBtn.classList.toggle("loading", isLoading);
  continueBtn.querySelector(".btn-label").textContent = isLoading
    ? "Preparing your greeting..."
    : "Continue";
  continueBtn.setAttribute("aria-busy", String(isLoading));
}

function showGreeting(name) {
  // Safe by construction: textContent never interprets HTML/script.
  greetingName.textContent = name;

  nameScreen.classList.add("leaving");
  nameScreen.addEventListener(
    "animationend",
    () => {
      nameScreen.hidden = true;
      nameScreen.classList.remove("leaving");
      greetingScreen.hidden = false;
      greetingScreen.querySelector(".card").focus?.();
    },
    { once: true }
  );
}

async function saveVisitor(name) {
  if (!firebaseReady || !db) {
    throw new Error("Firebase is not initialized. Check firebaseConfig in script.js.");
  }

  const visitorData = {
    name,
    createdAt: serverTimestamp(),
    userAgent: navigator.userAgent || "unknown",
    language: navigator.language || "unknown",
  };

  await addDoc(collection(db, VISITORS_COLLECTION), visitorData);
}

// -------------------------------------------------------------
// Form submit handling
// -------------------------------------------------------------
nameForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting) return; // guard against duplicate submissions

  const rawName = nameInput.value;
  const name = rawName.trim().slice(0, MAX_NAME_LENGTH);

  if (!name) {
    nameInput.classList.add("invalid");
    setFormMessage("Please enter your name to continue. 🌸");
    nameInput.focus();
    nameInput.addEventListener(
      "animationend",
      () => nameInput.classList.remove("invalid"),
      { once: true }
    );
    return;
  }

  setFormMessage("");
  setLoading(true);

  try {
    await saveVisitor(name);
    setLoading(false);
    setFormMessage("Welcome! 🌷", "success");
    showGreeting(name);
  } catch (err) {
    console.error("Failed to save visitor to Firestore:", err);
    setLoading(false);
    setFormMessage("Something went wrong. Please try again.");
    // Name is intentionally left in the input so the user doesn't retype it.
  }
});

// Clear the invalid state as soon as the user starts typing again.
nameInput.addEventListener("input", () => {
  if (nameInput.classList.contains("invalid")) {
    nameInput.classList.remove("invalid");
  }
});

// -------------------------------------------------------------
// Decorative background: floating petals + sparkles
// (Purely visual — respects prefers-reduced-motion.)
// -------------------------------------------------------------
function initBackgroundEffects() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const petalsContainer = document.getElementById("petals");
  const sparklesContainer = document.getElementById("sparkles");
  const petalEmojis = ["🌸", "🌷", "🌼", "🌺"];

  const petalCount = window.innerWidth < 600 ? 10 : 18;
  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];

    const size = 14 + Math.random() * 18;
    const duration = 10 + Math.random() * 12;
    const delay = Math.random() * -20;
    const left = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 160;

    petal.style.left = `${left}vw`;
    petal.style.fontSize = `${size}px`;
    petal.style.animationDuration = `${duration}s`;
    petal.style.animationDelay = `${delay}s`;
    petal.style.setProperty("--drift", `${drift}px`);

    petalsContainer.appendChild(petal);
  }

  const sparkleCount = window.innerWidth < 600 ? 14 : 26;
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";

    const size = 3 + Math.random() * 5;
    const duration = 2.5 + Math.random() * 3;
    const delay = Math.random() * 5;

    sparkle.style.left = `${Math.random() * 100}vw`;
    sparkle.style.top = `${Math.random() * 100}vh`;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.animationDuration = `${duration}s`;
    sparkle.style.animationDelay = `${delay}s`;

    sparklesContainer.appendChild(sparkle);
  }
}

initBackgroundEffects();
