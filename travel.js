// Travel time to events, from OpenStreetMap's free services: Photon suggests places as you type,
// and the OSRM route servers say how long the trip takes. Neither needs an account.
// Your location is only sent to these services to rank places and work out a trip; it's never saved.

const SUGGEST_API = "https://photon.komoot.io/api/";
const ROUTE_SERVERS = {
  walk: "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
  bike: "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
  drive: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
};
// A location from the last few minutes is close enough, and saves asking the browser again.
const LOCATION_MAX_AGE_MS = 5 * 60_000;
const LOCATION_TIMEOUT_MS = 30_000;
const LOCATION_DENIED =
  "Due Next isn't allowed to see your location. Check System Settings → Privacy & Security → Location Services, and your browser's settings for this site.";
// The area of the last place you picked (or where you last were), kept in this browser only, so
// suggestions are near you even when location is off.
const NEAR_KEY = "due-near";

function rememberArea({ lat, lon }) {
  try {
    localStorage.setItem(NEAR_KEY, JSON.stringify({ lat, lon }));
  } catch {
    // Suggestions are just less local next time.
  }
}

function rememberedArea() {
  try {
    const area = JSON.parse(localStorage.getItem(NEAR_KEY) ?? "null");
    return Number.isFinite(area?.lat) && Number.isFinite(area?.lon) ? area : null;
  } catch {
    return null;
  }
}

// Suggestions don't wait longer than this for your location.
const SEARCH_AREA_WAIT_MS = 3000;

// Where to look first: here, if location is already allowed (never asks while you type), or the
// area of the last place picked.
async function searchArea() {
  try {
    const { state } = await navigator.permissions.query({ name: "geolocation" });
    if (state === "granted") {
      const tooSlow = new Promise((_, reject) => setTimeout(() => reject(new Error("slow")), SEARCH_AREA_WAIT_MS));
      return await Promise.race([currentPosition(), tooSlow]);
    }
  } catch {
    // Fall back to the remembered area.
  }
  return rememberedArea();
}

// Places farther than this are left out when there are closer ones, so "Siebel" near campus
// doesn't also offer a shop in Rotterdam.
const NEARBY_KM = 150;

// Rough distance in km, plenty for "near here or not".
function kmBetween(a, b) {
  const toRadians = Math.PI / 180;
  const x = (b.lon - a.lon) * toRadians * Math.cos(((a.lat + b.lat) / 2) * toRadians);
  const y = (b.lat - a.lat) * toRadians;
  return Math.hypot(x, y) * 6371;
}

// "201 North Goodwin Avenue, Urbana, Illinois"
function describeAddress(properties) {
  const street = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  const town = properties.city || properties.town || properties.village || properties.county;
  return [street, town, properties.state].filter(Boolean).join(", ");
}

// Up to 5 places matching what's typed, closest first, as { lat, lon, name, address }.
export async function suggestPlaces(text) {
  const url = new URL(SUGGEST_API);
  url.searchParams.set("q", text);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en");
  const area = await searchArea();
  if (area) {
    url.searchParams.set("lat", String(area.lat));
    url.searchParams.set("lon", String(area.lon));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`The map answered ${response.status}`);
  const { features } = await response.json();
  const places = features.map(({ geometry, properties }) => ({
    lat: geometry.coordinates[1],
    lon: geometry.coordinates[0],
    name: properties.name || describeAddress(properties),
    address: describeAddress(properties),
  }));
  // The map sometimes has a building twice (as a building and as a place); show it once.
  const seen = new Set();
  const distinct = places.filter((place) => {
    const key = `${place.name}|${place.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const nearby = area ? distinct.filter((place) => kmBetween(area, place) <= NEARBY_KM) : [];
  return nearby.length > 0 ? nearby : distinct;
}

// Called when a suggestion is picked, so later suggestions start near it.
export function pickedPlace(place) {
  rememberArea(place);
}

// Where this computer is now, as { lat, lon }. The browser asks permission the first time.
// A Mac's first try often comes back empty while it reads nearby Wi-Fi, so it tries once more.
export async function currentPosition() {
  try {
    return await askForPosition();
  } catch (error) {
    if (error.message === LOCATION_DENIED) throw error;
    return askForPosition();
  }
}

function askForPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser can't share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { lat: coords.latitude, lon: coords.longitude };
        rememberArea(here);
        resolve(here);
      },
      (problem) => {
        const denied = problem.code === problem.PERMISSION_DENIED;
        reject(new Error(denied ? LOCATION_DENIED : "Couldn't find where you are. Check that Wi-Fi is on, then try again."));
      },
      { maximumAge: LOCATION_MAX_AGE_MS, timeout: LOCATION_TIMEOUT_MS },
    );
  });
}

// How many minutes the trip takes, rounded up.
export async function tripMinutes(from, to, mode) {
  const server = ROUTE_SERVERS[mode] ?? ROUTE_SERVERS.walk;
  const response = await fetch(`${server}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`);
  if (!response.ok) throw new Error(`The route server answered ${response.status}`);
  const result = await response.json();
  if (result.code !== "Ok" || !result.routes?.length) throw new Error("No route found.");
  return Math.max(1, Math.ceil(result.routes[0].duration / 60));
}
