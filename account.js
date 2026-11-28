// Signing in, and keeping your saved data in your Firebase account so it follows you to any computer.
// The rest of the app (app.js) starts only after you're signed in and your data is in this browser,
// so it keeps reading and saving with localStorage exactly as before.
import {
  DARK_KEY,
  isDarkNow,
  SYNCED_KEYS,
  authErrorMessage,
  cleanTwoStepCode,
  mergeSyncedData,
  newLoginError,
  normalizeUsername,
  profileError,
  signInError,
  syncedData,
  twoStepCodeError,
} from "./tasks.js";

// Firebase's web settings. These aren't secret: they only say which Firebase project to use.
// What keeps each person's tasks private is the security rule in the Firebase console, which lets
// people read and write only users/<their own id>/..., and lets anyone look up one username at a time
// (usernames/<name> holds that account's email, because Firebase signs people in by email).
const firebaseConfig = {
  apiKey: "AIzaSyCEHqfnSuYXc5mN9jh_1ry_Xfg03A04ZKM",
  authDomain: "due-next-93e5f.firebaseapp.com",
  projectId: "due-next-93e5f",
  storageBucket: "due-next-93e5f.firebasestorage.app",
  messagingSenderId: "200097834599",
  appId: "1:200097834599:web:9eca6090e03d2bca3c16c2",
};
const FIREBASE_URL = "https://www.gstatic.com/firebasejs/10.12.2";
const UPLOAD_DELAY_MS = 800;
const WELCOME_MS = 1800;

const authStatus = document.getElementById("auth-status");
const authRetry = document.getElementById("auth-retry");
const authForm = document.getElementById("auth-form");
const authLogin = document.getElementById("auth-login");
const authPassword = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const authSubmit = document.getElementById("auth-submit");
const authCodeRow = document.getElementById("auth-code-row");
const authCode = document.getElementById("auth-code");
const authRemember = document.getElementById("auth-remember");
const createForm = document.getElementById("create-form");
const createStepText = document.getElementById("create-step");
const createStepOne = document.getElementById("create-step-one");
const createStepTwo = document.getElementById("create-step-two");
const createUsername = document.getElementById("create-username");
const createPassword = document.getElementById("create-password");
const createEmail = document.getElementById("create-email");
const createFirstName = document.getElementById("create-first-name");
const createLastName = document.getElementById("create-last-name");
const createMessage = document.getElementById("create-message");
const createSubmit = document.getElementById("create-submit");
const createBack = document.getElementById("create-back");
const authWelcome = document.getElementById("auth-welcome");
const syncError = document.getElementById("sync-error");

let firebase;
let currentUser = null;
let createStep = 1;
let signingUp = false;
let signedInWithForm = false;
let appStarted = false;
let uploadTimer;
// "Remember me": your username, kept in this browser after you sign out so you only type your
// password. It's never synced, and unchecking Remember me forgets it.
const REMEMBERED_LOGIN_KEY = "due-remembered-login";
// A sign-in Firebase paused to ask for the two-step code, until the code is typed.
let waitingForCode = null;

export function currentAccountEmail() {
  return currentUser?.email ?? "";
}

// The name given when the account was made, or the email for accounts made before names existed.
export function currentAccountName() {
  return currentUser?.displayName || currentAccountEmail();
}

// Two-step sign-in: after the password, a 6-digit code from an authenticator app on your phone.
// (Firebase calls it multi-factor sign-in with TOTP codes. It needs "Firebase Authentication with
// Identity Platform" and TOTP switched on for the project; see README.)
function twoStepFactor() {
  const { auth } = firebase;
  const { FACTOR_ID } = auth.TotpMultiFactorGenerator;
  return auth.multiFactor(currentUser).enrolledFactors.find((factor) => factor.factorId === FACTOR_ID) ?? null;
}

export function twoStepIsOn() {
  return Boolean(currentUser && firebase?.auth.TotpMultiFactorGenerator) && twoStepFactor() !== null;
}

// Finishes a sign-in (or a password check) that Firebase paused to ask for the code.
async function finishWithCode(paused, code) {
  const { auth } = firebase;
  const resolver = auth.getMultiFactorResolver(auth.instance, paused);
  const hint = resolver.hints.find((other) => other.factorId === auth.TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) throw paused;
  return resolver.resolveSignIn(auth.TotpMultiFactorGenerator.assertionForSignIn(hint.uid, cleanTwoStepCode(code)));
}

// Firebase only lets account changes happen after checking the password again (and the code, when
// two-step is on), so someone at an open laptop can't take over the account.
async function checkItsYou(password, code = "") {
  const { auth } = firebase;
  try {
    await auth.reauthenticateWithCredential(currentUser, auth.EmailAuthProvider.credential(currentUser.email, password));
  } catch (error) {
    if (error.code !== "auth/multi-factor-auth-required") throw error;
    if (!code) throw dueError("due/needs-code");
    await finishWithCode(error, code);
  }
}

// Other browsers signed in to this account are signed out afterward.
export async function changePassword(current, next, code = "") {
  await checkItsYou(current, code);
  await firebase.auth.updatePassword(currentUser, next);
}

// Step 1 of turning on two-step sign-in. Firebase requires a verified email, so if it isn't yet,
// this sends the verification link and returns { verifyEmail }. Otherwise it returns the secret
// for the authenticator app: { secret, link (for the QR code), key (to type in by hand) }.
export async function startTwoStep(password) {
  const { auth } = firebase;
  await auth.reload(currentUser);
  if (!currentUser.emailVerified) {
    await auth.sendEmailVerification(currentUser);
    return { verifyEmail: currentUser.email };
  }
  await checkItsYou(password);
  const session = await auth.multiFactor(currentUser).getSession();
  const secret = await auth.TotpMultiFactorGenerator.generateSecret(session);
  return { secret, link: secret.generateQrCodeUrl(currentUser.email, "Due Next"), key: secret.secretKey };
}

// Step 2: the first code from the app proves it's set up right, and turns two-step on.
export async function finishTwoStep(secret, code) {
  const { auth } = firebase;
  const assertion = auth.TotpMultiFactorGenerator.assertionForEnrollment(secret, cleanTwoStepCode(code));
  await auth.multiFactor(currentUser).enroll(assertion, "Authenticator app");
}

export async function turnOffTwoStep(password, code) {
  await checkItsYou(password, code);
  await firebase.auth.multiFactor(currentUser).unenroll(twoStepFactor());
}

// For Settings → Change password when the current one is forgotten: emails a reset link to this account.
export async function sendPasswordResetToMe() {
  const { auth } = firebase;
  await auth.sendPasswordResetEmail(auth.instance, currentUser.email);
}

// Saves any change still waiting, signs out, and clears this browser so the next person starts fresh.
export async function signOutOfDueNext() {
  clearTimeout(uploadTimer);
  await uploadNow();
  await firebase.auth.signOut(firebase.auth.instance);
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith("due-") && key !== REMEMBERED_LOGIN_KEY) storage.removeItem(key);
    }
  }
  location.reload();
}

async function loadFirebase() {
  const [app, auth, firestore] = await Promise.all([
    import(`${FIREBASE_URL}/firebase-app.js`),
    import(`${FIREBASE_URL}/firebase-auth.js`),
    import(`${FIREBASE_URL}/firebase-firestore.js`),
  ]);
  const firebaseApp = app.initializeApp(firebaseConfig);
  return {
    auth: { ...auth, instance: auth.getAuth(firebaseApp) },
    store: { ...firestore, instance: firestore.getFirestore(firebaseApp) },
  };
}

function usernameDocument(username) {
  const { store } = firebase;
  return store.doc(store.instance, "usernames", username);
}

// Firebase-style error for Due Next's own sign-in problems, so authErrorMessage can explain them.
function dueError(code) {
  return Object.assign(new Error(code), { code });
}

// The email to sign in with: the one typed, or the one saved with the username.
async function emailForLogin(login) {
  if (login.includes("@")) return login;
  const snapshot = await firebase.store.getDoc(usernameDocument(normalizeUsername(login)));
  if (!snapshot.exists()) throw dueError("due/username-not-found");
  return snapshot.data().email;
}

function accountDocument() {
  const { store } = firebase;
  return store.doc(store.instance, "users", currentUser.uid, "state", "main");
}

// Shows one part of the sign-in card (status, sign-in form, create form, or welcome) and hides the rest.
function showOnly(part) {
  for (const element of [authStatus, authForm, createForm, authWelcome]) element.hidden = element !== part;
  if (part !== authStatus) authRetry.hidden = true;
}

function showStatus(text, { canRetry = false } = {}) {
  authStatus.textContent = text;
  showOnly(authStatus);
  authRetry.hidden = !canRetry;
}

function rememberedLogin() {
  try {
    return localStorage.getItem(REMEMBERED_LOGIN_KEY) ?? "";
  } catch {
    return "";
  }
}

// Checked: stay signed in until Sign out, and keep the username here. Unchecked: signed out when the
// browser closes, and nothing of yours is left behind (for a shared or library computer).
async function applyRememberMe(login) {
  const { auth } = firebase;
  const remember = authRemember.checked;
  await auth.setPersistence(auth.instance, remember ? auth.browserLocalPersistence : auth.browserSessionPersistence);
  try {
    if (remember) localStorage.setItem(REMEMBERED_LOGIN_KEY, login);
    else localStorage.removeItem(REMEMBERED_LOGIN_KEY);
  } catch {
    // Storage is off: the username just isn't filled in next time.
  }
}

function showSignIn() {
  waitingForCode = null;
  authCodeRow.hidden = true;
  authCode.value = "";
  showOnly(authForm);
  showMessage(authMessage, "");
  const login = rememberedLogin();
  if (login && !authLogin.value) authLogin.value = login;
  (authLogin.value ? authPassword : authLogin).focus();
}

function showCreateAccount() {
  showOnly(createForm);
  showCreateStep(1);
}

function showCreateStep(step) {
  createStep = step;
  createStepText.textContent = `Step ${step} of 2`;
  createStepOne.hidden = step !== 1;
  createStepTwo.hidden = step !== 2;
  createBack.hidden = step !== 2;
  createSubmit.textContent = step === 1 ? "Next" : "Create account";
  showMessage(createMessage, "");
  (step === 1 ? createUsername : createEmail).focus();
}

function showMessage(element, text, { isInfo = false } = {}) {
  element.textContent = text;
  element.classList.toggle("is-info", isInfo);
}

// Brings your saved data into this browser. A brand-new account starts with whatever is already
// saved here, so the tasks you had before accounts existed move into it. Signing in with the form
// keeps this browser's own tasks too; a browser that was already signed in just takes the account's
// data, so tasks deleted on another computer don't come back.
async function loadAccountData({ keepLocalData }) {
  const { store } = firebase;
  const snapshot = await store.getDoc(accountDocument());
  if (!snapshot.exists()) {
    await uploadNow();
    return;
  }
  const accountValues = snapshot.data().values ?? {};
  const values = keepLocalData ? mergeSyncedData(accountValues, syncedData(localStorage)) : accountValues;
  for (const key of SYNCED_KEYS) {
    if (typeof values[key] === "string") localStorage.setItem(key, values[key]);
    else localStorage.removeItem(key);
  }
  document.documentElement.dataset.theme = localStorage.getItem("due-theme") || "pastel";
  const background = localStorage.getItem("due-background");
  // Grid was replaced by Soft glow; it's switched over (and saved) when the app starts.
  document.documentElement.dataset.background = background === "grid" ? "glow" : background || "plain";
  applyDarkMode();
  if (keepLocalData) await uploadNow();
}

async function uploadNow() {
  if (!currentUser) return;
  const { store } = firebase;
  try {
    await store.setDoc(accountDocument(), { values: syncedData(localStorage), updatedAt: store.serverTimestamp() });
    syncError.hidden = true;
  } catch {
    syncError.textContent = "Couldn't save to your account. Your changes are kept on this computer and will be saved with your next change.";
    syncError.hidden = false;
  }
}

function queueUpload() {
  clearTimeout(uploadTimer);
  uploadTimer = setTimeout(uploadNow, UPLOAD_DELAY_MS);
}

// app.js saves everything with localStorage. Watching those saves here sends each change to your
// account without app.js needing to know about Firebase.
function watchSavedChanges() {
  const { setItem, removeItem } = Storage.prototype;
  Storage.prototype.setItem = function (key, value) {
    setItem.call(this, key, value);
    if (this === localStorage && SYNCED_KEYS.includes(key)) queueUpload();
  };
  Storage.prototype.removeItem = function (key) {
    removeItem.call(this, key);
    if (this === localStorage && SYNCED_KEYS.includes(key)) queueUpload();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      clearTimeout(uploadTimer);
      uploadNow();
    }
  });
}

async function startApp() {
  appStarted = true;
  document.body.classList.remove("signed-out");
  watchSavedChanges();
  await import("./app.js");
}

async function handleSignedIn(user) {
  currentUser = user;
  showStatus("Loading your tasks…");
  try {
    await loadAccountData({ keepLocalData: signedInWithForm });
  } catch {
    showStatus("Couldn't load your tasks. Check your internet, then try again.", { canRetry: true });
    return;
  }
  await startApp();
}

// A screen check runs the app on pretend data kept in memory, with no account and nothing saved.
// If index.html couldn't swap in that memory, it stops rather than risk the real data.
async function startScreenCheck() {
  if (!window.dueScreenCheck || window.dueScreenCheck.storage !== localStorage) {
    showStatus("This screen check couldn't start safely, so it stopped.");
    return;
  }
  appStarted = true;
  document.body.classList.remove("signed-out");
  await import("./app.js");
}

async function start() {
  if (new URLSearchParams(location.search).has("screen-check")) {
    startScreenCheck();
    return;
  }
  showStatus("Loading…");
  try {
    firebase = await loadFirebase();
  } catch {
    showStatus("Couldn't reach Due Next. Check your internet, then try again.", { canRetry: true });
    return;
  }
  const { auth } = firebase;
  auth.onAuthStateChanged(auth.instance, (user) => {
    if (appStarted || signingUp) return;
    if (user) handleSignedIn(user);
    else showSignIn();
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const login = authLogin.value.trim();
  const password = authPassword.value;
  const problem = signInError({ login, password });
  showMessage(authMessage, problem);
  if (problem) return;

  const { auth } = firebase;
  if (waitingForCode) {
    const codeProblem = twoStepCodeError(authCode.value);
    showMessage(authMessage, codeProblem);
    if (codeProblem) {
      authCode.focus();
      return;
    }
  }
  authSubmit.disabled = true;
  authSubmit.textContent = "Signing in…";
  signedInWithForm = true;
  try {
    if (waitingForCode) await finishWithCode(waitingForCode, authCode.value);
    else {
      await applyRememberMe(login);
      await auth.signInWithEmailAndPassword(auth.instance, await emailForLogin(login), password);
    }
  } catch (error) {
    signedInWithForm = false;
    if (error.code === "auth/multi-factor-auth-required") {
      // Password was right; now the code from the authenticator app.
      waitingForCode = error;
      authCodeRow.hidden = false;
      showMessage(authMessage, "Password ✓ Now type the 6-digit code from your authenticator app.", { isInfo: true });
      authCode.focus();
    } else {
      showMessage(authMessage, authErrorMessage(error.code));
    }
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = "Sign in";
  }
});

// Step 1 checks the username is free; step 2 makes the account, claims the username, and saves the name.
async function submitCreateStep() {
  const username = normalizeUsername(createUsername.value);
  if (createStep === 1) {
    const problem = newLoginError({ username, password: createPassword.value });
    if (problem) return showMessage(createMessage, problem);
    createSubmit.textContent = "Checking…";
    const snapshot = await firebase.store.getDoc(usernameDocument(username));
    if (snapshot.exists()) throw dueError("due/username-taken");
    return showCreateStep(2);
  }

  const email = createEmail.value.trim();
  const firstName = createFirstName.value.trim();
  const lastName = createLastName.value.trim();
  const problem = profileError({ email, firstName, lastName });
  if (problem) return showMessage(createMessage, problem);
  const { auth, store } = firebase;
  createSubmit.textContent = "Creating account…";
  signingUp = true;
  const { user } = await auth.createUserWithEmailAndPassword(auth.instance, email, createPassword.value);
  try {
    // The security rule only allows creating a username, never replacing one, so this fails if
    // someone else claimed it after step 1.
    await store.setDoc(usernameDocument(username), { uid: user.uid, email: user.email });
  } catch {
    await user.delete().catch(() => {});
    throw dueError("due/username-taken");
  }
  // The account already works without the name, so a failure here shouldn't stop sign-up.
  await auth.updateProfile(user, { displayName: `${firstName} ${lastName}` }).catch(() => {});
  document.getElementById("auth-welcome-name").textContent = `Welcome, ${firstName}.`;
  showOnly(authWelcome);
  setTimeout(() => handleSignedIn(user), WELCOME_MS);
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const stepLabel = createSubmit.textContent;
  createSubmit.disabled = true;
  try {
    await submitCreateStep();
  } catch (error) {
    signingUp = false;
    if (error.code === "due/username-taken") showCreateStep(1);
    showMessage(createMessage, authErrorMessage(error.code));
  } finally {
    createSubmit.disabled = false;
    if (createSubmit.textContent.endsWith("…")) createSubmit.textContent = stepLabel;
  }
});

// Changing the username or password after the code was asked for starts the sign-in over.
for (const field of [authLogin, authPassword]) {
  field.addEventListener("input", () => {
    if (!waitingForCode) return;
    waitingForCode = null;
    authCodeRow.hidden = true;
    authCode.value = "";
    showMessage(authMessage, "");
  });
}

createBack.addEventListener("click", () => showCreateStep(1));
document.getElementById("show-create-account").addEventListener("click", showCreateAccount);
document.getElementById("show-sign-in").addEventListener("click", showSignIn);

document.getElementById("auth-forgot").addEventListener("click", async () => {
  const login = authLogin.value.trim();
  if (!login) {
    showMessage(authMessage, "Type your username or email, then click Forgot password again.");
    authLogin.focus();
    return;
  }
  const { auth } = firebase;
  try {
    await auth.sendPasswordResetEmail(auth.instance, await emailForLogin(login));
    showMessage(authMessage, "If that account exists, a link to reset your password is on its way to its email.", {
      isInfo: true,
    });
  } catch (error) {
    showMessage(authMessage, authErrorMessage(error.code));
  }
});

authRetry.addEventListener("click", () => {
  if (currentUser) handleSignedIn(currentUser);
  else start();
});

// An eye button inside every password box: click to see what you typed, click again to hide it.
const EYE_OPEN =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const EYE_CLOSED =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 4l16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

function addPasswordEye(input) {
  const holder = document.createElement("span");
  holder.className = "password-field";
  input.replaceWith(holder);
  const eye = document.createElement("button");
  eye.type = "button";
  eye.className = "password-eye";
  const show = (visible) => {
    input.type = visible ? "text" : "password";
    eye.innerHTML = visible ? EYE_CLOSED : EYE_OPEN;
    eye.setAttribute("aria-pressed", String(visible));
    eye.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    eye.title = visible ? "Hide password" : "Show password";
  };
  eye.addEventListener("click", () => {
    show(input.type === "password");
    input.focus();
  });
  // Clearing the form (after changing a password, say) hides it again.
  input.form?.addEventListener("reset", () => show(false));
  holder.append(input, eye);
  show(false);
}

for (const input of document.querySelectorAll('input[type="password"]')) addPasswordEye(input);

// Dark mode, from Settings → Look. Set here, before signing in, so every screen matches; app.js
// checks again each minute for "At night".
export function applyDarkMode() {
  let setting = null;
  try {
    setting = JSON.parse(localStorage.getItem(DARK_KEY) ?? "null");
  } catch {
    // Unreadable or no storage: follow the computer.
  }
  const computerIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.dark = isDarkNow(setting, new Date(), computerIsDark) ? "on" : "off";
}
applyDarkMode();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyDarkMode);

start();
