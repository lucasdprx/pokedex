// Compte et sauvegarde en ligne (Firebase) : les coches suivent la personne d'un appareil à l'autre.
// Le site marche sans : si ce fichier ne charge pas (hors ligne), les coches restent sur l'appareil
// et partent à la prochaine connexion.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDocFromServer, setDoc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyBFb_JOqAb65HIK857ISoScbkw43Lr70xQ",
  authDomain: "pokedex-go-eca47.firebaseapp.com",
  projectId: "pokedex-go-eca47",
  storageBucket: "pokedex-go-eca47.firebasestorage.app",
  messagingSenderId: "64675038202",
  appId: "1:64675038202:web:748f5bc0e998a42e021a43",
});
const auth = getAuth(app);
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch {
  db = initializeFirestore(app, {}); // navigation privée : pas de cache disque
}

const EMAIL_KEY = "pokedex-go-link-email";
const $ = id => document.getElementById(id);
let user = null, ref = null, ready = false, unsub = null;

// --- Envoi des coches ---
// SYNC_KEY vaut "clean:<uid>" quand l'appareil a les mêmes coches que ce compte ;
// sinon (coches faites hors connexion, premier passage) on fusionne au lieu d'écraser.
const isClean = () => user && localStorage.getItem(SYNC_KEY) === "clean:" + user.uid;

let waiting = 0, failTimer = null;
function track(promise) {
  waiting++;
  if (!failTimer) failTimer = setTimeout(() => showToast(true), 120000);
  promise.then(() => {
    if (--waiting) return;
    clearTimeout(failTimer); failTimer = null;
    showToast(false);
  }, () => { waiting--; showToast(true); });
}

function push() {
  if (!ready) return;
  const m = marksApi.get();
  track(setDoc(ref, { caught: m.caught, shiny: m.shiny, updated: serverTimestamp() }));
  localStorage.setItem(SYNC_KEY, "clean:" + user.uid);
}
window.syncPush = push;

const union = (a = [], b = []) => [...new Set([...a, ...b])];
const same = (a, b) => a.length === b.size && a.every(k => b.has(k));

async function start(u) {
  ref = doc(db, "users", u.uid);
  if (!isClean()) {
    // Fusion : rien n'est effacé, ni sur l'appareil ni sur le compte
    let remote;
    try {
      const snap = await getDocFromServer(ref);
      remote = snap.exists() ? snap.data() : {};
    } catch {
      showToast(true);
      addEventListener("online", () => user === u && start(u), { once: true });
      return;
    }
    if (user !== u) return;
    const m = marksApi.get();
    marksApi.set(union(m.caught, remote.caught), union(m.shiny, remote.shiny));
    showToast(false);
  }
  ready = true;
  if (!isClean()) push();
  // Le compte fait foi : ce qui change ailleurs arrive ici
  unsub = onSnapshot(ref, snap => {
    if (snap.metadata.hasPendingWrites || !snap.exists()) return;
    const d = snap.data();
    const c = d.caught || [], s = d.shiny || [];
    const m = marksApi.sets();
    if (!same(c, m.caught) || !same(s, m.shiny)) marksApi.set(c, s);
  });
}

// --- Écran du compte ---
const acct = $("acct");
const userIcon = acct.innerHTML;
function showAccount(u) {
  $("signIn").hidden = !!u;
  $("signOut").hidden = !u;
  $("acctWho").hidden = !u;
  $("acctWho").textContent = u ? (u.email || u.displayName || "") : "";
  const initial = u && (u.displayName || u.email || "?").trim()[0].toUpperCase();
  acct.innerHTML = u ? `<span class="av">${initial}</span>` : userIcon;
}

onAuthStateChanged(auth, u => {
  if (unsub) unsub();
  unsub = null; ready = false;
  user = u;
  showAccount(u);
  if (u) start(u);
  else showToast(false);
});

// --- Messages ---
const toast = $("toast");
function showToast(on) {
  toast.hidden = !(on && user);
  if (on) toast.innerHTML = `<b>${t("syncFail")}</b> : ${t("syncFailText")}`;
}

// --- Connexion ---
const loginDialog = $("loginDialog");
$("signIn").addEventListener("click", () => {
  $("acctMenu").hidden = true;
  $("acct").setAttribute("aria-expanded", false);
  loginDialog.showModal();
});
$("signOut").addEventListener("click", async () => {
  $("acctMenu").hidden = true;
  await signOut(auth);
  localStorage.removeItem(SYNC_KEY); // les coches restent sur l'appareil ; à fusionner à la reconnexion
});

const fail = err => {
  if (err && ["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(err.code)) return;
  alert(t("loginFail") + (err && (err.code || err.message) || ""));
};

$("googleBtn").addEventListener("click", async () => {
  loginDialog.close();
  const provider = new GoogleAuthProvider();
  auth.languageCode = LANG;
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(err.code)) {
      signInWithRedirect(auth, provider).catch(fail);
    } else fail(err);
  }
});
getRedirectResult(auth).catch(fail);

$("linkForm").addEventListener("submit", async ev => {
  ev.preventDefault();
  const email = $("loginEmail").value.trim();
  if (!email) return;
  auth.languageCode = LANG;
  try {
    await sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
  } catch (err) { fail(err); return; }
  localStorage.setItem(EMAIL_KEY, email);
  loginDialog.close();
  $("sentText").textContent = t("linkSentText", { email });
  $("sentDialog").showModal();
});

// Retour par le lien reçu par e-mail
if (isSignInWithEmailLink(auth, location.href)) {
  const link = location.href;
  const email = localStorage.getItem(EMAIL_KEY) || prompt(t("confirmEmail"));
  history.replaceState(null, "", location.pathname);
  if (email) {
    signInWithEmailLink(auth, email, link)
      .then(() => localStorage.removeItem(EMAIL_KEY))
      .catch(fail);
  }
}
