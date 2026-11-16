// Shows your Google Calendar events on Due Next's calendar. Due Next asks Google only for read-only
// access, so it can never add, change, or delete anything in your Google Calendar. Events are fetched
// fresh from Google and never saved to your Due Next account.
import { addDays, GOOGLE_WANTED_KEY, googleEventDays } from "./tasks.js";

// Google's ID for Due Next's sign-in. Like the Firebase settings, it isn't secret: it only says which
// app is asking, and Google only lets it be used from Due Next's own web addresses.
const CLIENT_ID = "200097834599-ioco54qffmbfh3r1tph98gihv9tosudo.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const API = "https://www.googleapis.com/calendar/v3";
// Remembers in this browser that you connected, and with which Google account.
const CONNECTED_KEY = "due-google-calendar";
// Google's access pass lasts about an hour. It's kept in this browser (never in the account) until
// it runs out, so reopening Due Next within the hour doesn't send you back to Google's window.
// Signing out clears it.
const TOKEN_KEY = "due-google-token";
const REFRESH_MS = 5 * 60 * 1000;
// Fetches a little past what's on screen, so moving a week or two doesn't wait on Google.
const EXTRA_DAYS = 14;

let tokenClient = null;
let token = null;
let entries = [];
let loadedRange = null;
let wantedRange = null;
let status = "off";
let account = "";
let fetching = false;
let keepingCurrent = false;
let notifyChange = () => {};

function readJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function setStatus(next) {
  status = next;
  notifyChange();
}

// "off" (not connected), "suggest" (connected on another computer, not this one yet), "loading",
// "connected", "reconnect" (Google needs a click), or "error".
export function googleCalendarStatus() {
  return { status, account };
}

export function googleCalendarEntries() {
  return entries;
}

function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Couldn't reach Google."));
    document.head.append(script);
  });
}

// Opens Google's window to ask for access. Must run from a click, or the browser blocks the window.
function requestToken(prompt) {
  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      login_hint: account || undefined,
      callback: (response) => {
        if (response.error) reject(new Error(response.error));
        else resolve(response);
      },
      error_callback: (problem) => reject(new Error(problem.type)),
    });
    tokenClient.requestAccessToken({ prompt });
  });
}

function hasFreshToken() {
  return token !== null && token.expiresAt > Date.now() + 60 * 1000;
}

async function googleGet(path, params = {}) {
  const url = new URL(API + path);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token.value}` } });
  if (response.status === 401) {
    token = null;
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("expired");
  }
  if (!response.ok) throw new Error(`Google answered ${response.status}`);
  return response.json();
}

function dateKeyToIso(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toISOString();
}

// Loads every calendar you have turned on in Google Calendar, for the wanted dates.
async function refresh() {
  if (!wantedRange || status === "off" || fetching) return;
  if (!hasFreshToken()) {
    setStatus("reconnect");
    return;
  }
  fetching = true;
  const range = { start: addDays(wantedRange.start, -EXTRA_DAYS), end: addDays(wantedRange.end, EXTRA_DAYS) };
  try {
    const calendars = (await googleGet("/users/me/calendarList")).items.filter((calendar) => calendar.selected);
    const lists = await Promise.all(
      calendars.map(async (calendar) => {
        const { items } = await googleGet(`/calendars/${encodeURIComponent(calendar.id)}/events`, {
          timeMin: dateKeyToIso(range.start),
          timeMax: dateKeyToIso(addDays(range.end, 1)),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "2500",
        });
        return items.flatMap((event) => googleEventDays(event, calendar.backgroundColor ?? ""));
      }),
    );
    entries = lists.flat();
    loadedRange = range;
    account = calendars.find((calendar) => calendar.primary)?.id ?? account;
    localStorage.setItem(CONNECTED_KEY, JSON.stringify({ account }));
    // Only written when it changes, since every write is also saved to the account.
    const wanted = JSON.stringify({ account });
    if (localStorage.getItem(GOOGLE_WANTED_KEY) !== wanted) localStorage.setItem(GOOGLE_WANTED_KEY, wanted);
    setStatus("connected");
  } catch (error) {
    setStatus(error.message === "expired" ? "reconnect" : "error");
  } finally {
    fetching = false;
  }
}

// Checks Google again every 5 minutes and whenever you come back to this tab.
function keepCurrent() {
  if (keepingCurrent) return;
  keepingCurrent = true;
  setInterval(refresh, REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
}

// Tells this module which dates are on screen; loads them if they haven't been loaded yet.
export function showGoogleRange(start, end) {
  wantedRange = { start, end };
  if (status === "connected" && (!loadedRange || start < loadedRange.start || end > loadedRange.end)) refresh();
}

// Connecting the first time asks for permission; reconnecting just gets a new pass from Google.
export async function connectGoogleCalendar() {
  const before = status;
  const firstTime = before === "off";
  setStatus("loading");
  try {
    await loadGoogleScript();
    const response = await requestToken(firstTime ? "consent" : "");
    if (!google.accounts.oauth2.hasGrantedAllScopes(response, SCOPE)) throw new Error("not allowed");
    token = { value: response.access_token, expiresAt: Date.now() + Number(response.expires_in) * 1000 };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    status = "connected";
    keepCurrent();
    await refresh();
  } catch {
    setStatus(before === "suggest" ? "suggest" : firstTime ? "off" : "reconnect");
    throw new Error(firstTime ? "Google Calendar wasn't connected." : "Couldn't reconnect to Google Calendar.");
  }
}

export function disconnectGoogleCalendar() {
  if (token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(token.value, () => {});
  token = null;
  entries = [];
  loadedRange = null;
  account = "";
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CONNECTED_KEY);
  // Disconnecting here also stops the other computers from offering to connect.
  localStorage.removeItem(GOOGLE_WANTED_KEY);
  setStatus("off");
}

// Picks up where this browser left off, and keeps the events current while Due Next is open.
export function startGoogleCalendar(onChange) {
  notifyChange = onChange;
  const saved = readJson(localStorage, CONNECTED_KEY);
  if (!saved) {
    const wanted = readJson(localStorage, GOOGLE_WANTED_KEY);
    if (wanted) {
      account = wanted.account ?? "";
      status = "suggest";
    }
    return;
  }
  account = saved.account ?? "";
  // Connected before the account remembered it: remember it now, so other computers offer it too.
  if (localStorage.getItem(GOOGLE_WANTED_KEY) === null) localStorage.setItem(GOOGLE_WANTED_KEY, JSON.stringify({ account }));
  const savedToken = readJson(localStorage, TOKEN_KEY);
  if (savedToken?.value && savedToken.expiresAt > Date.now()) token = savedToken;
  status = hasFreshToken() ? "connected" : "reconnect";
  keepCurrent();
}
