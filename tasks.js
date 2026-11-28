// Pure task logic: grouping by urgency, validation, and storage.
// Kept free of DOM code so tests.html can exercise it directly.

export const STORAGE_KEY = "due-tasks-v1";

export const GROUPS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due today" },
  { id: "week", label: "This week" },
  { id: "later", label: "Later" },
  { id: "done", label: "Done" },
];

// Returns a local-time YYYY-MM-DD string, matching what <input type="date"> produces.
export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(fromKey, toKey) {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to - from) / 86_400_000);
}

export function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// Weeks start on Sunday, like Google Calendar.
export function startOfWeek(dateKey) {
  const daysSinceSunday = new Date(`${dateKey}T00:00:00`).getDay();
  return addDays(dateKey, -daysSinceSunday);
}

export function weekDays(weekStartKey) {
  return Array.from({ length: 7 }, (_, offset) => addDays(weekStartKey, offset));
}

export function startOfMonth(dateKey) {
  return `${dateKey.slice(0, 7)}-01`;
}

// The first day of the month `months` away, e.g. addMonths("2026-10-31", 1) is "2026-11-01".
export function addMonths(dateKey, months) {
  const date = new Date(`${startOfMonth(dateKey)}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return toDateKey(date);
}

// Every day shown in a month grid: whole weeks (Sunday to Saturday) from the week holding the 1st
// to the week holding the last day, so 35 or 42 days including some from the months around it.
export function monthGrid(dateKey) {
  const first = startOfMonth(dateKey);
  const last = addDays(addMonths(first, 1), -1);
  const days = [];
  for (let day = startOfWeek(first); day <= last || days.length % 7 !== 0; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

// Tasks without a time sort after timed ones, since "due Thursday" means by the end of Thursday.
function compareTimes(a, b) {
  return (a.time || "99:99").localeCompare(b.time || "99:99");
}

// Tasks due on one day: unfinished first, then by time, then by name.
export function tasksDueOn(tasks, dateKey) {
  return tasks
    .filter((task) => task.due === dateKey)
    .sort((a, b) => Number(a.done) - Number(b.done) || compareTimes(a, b) || a.name.localeCompare(b.name));
}

// Formats "23:59" as "11:59 PM" (in the user's locale); "" for no time.
export function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Returns a local-time HH:MM string, matching what <input type="time"> produces.
export function toTimeKey(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export const COURSE_COLOR_COUNT = 6;

// The same class name always gets the same color; tasks without a class get none (-1).
export function courseColorIndex(course) {
  const key = course.trim().toLowerCase();
  if (!key) return -1;
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return hash % COURSE_COLOR_COUNT;
}

// nowTime (HH:MM) makes a task due earlier today overdue once its time has passed.
export function urgencyOf(task, todayKey, nowTime = "00:00") {
  if (task.done) return "done";
  const daysLeft = daysBetween(todayKey, task.due);
  if (daysLeft < 0) return "overdue";
  if (daysLeft === 0 && task.time && task.time < nowTime) return "overdue";
  if (daysLeft === 0) return "today";
  if (daysLeft <= 7) return "week";
  return "later";
}

// Groups tasks by urgency, each group sorted by due date then name.
export function groupTasks(tasks, todayKey, nowTime) {
  const groups = Object.fromEntries(GROUPS.map((group) => [group.id, []]));
  for (const task of tasks) {
    groups[urgencyOf(task, todayKey, nowTime)].push(task);
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.due.localeCompare(b.due) || compareTimes(a, b) || a.name.localeCompare(b.name));
  }
  return groups;
}

export function describeDue(task, todayKey) {
  const day = describeDueDay(task, todayKey);
  return task.time ? `${day} at ${formatTime(task.time)}` : day;
}

function describeDueDay(task, todayKey) {
  const daysLeft = daysBetween(todayKey, task.due);
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  if (daysLeft === -1) return "yesterday";
  if (daysLeft < 0) return `${-daysLeft} days ago`;
  if (daysLeft <= 7) return `in ${daysLeft} days`;
  const date = new Date(`${task.due}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Returns an error message for bad input, or null if the task can be created.
export function validateTask({ name, due, time, notes, weight }) {
  if (!name || !name.trim()) return "Give the task a name.";
  if (name.trim().length > 120) return "Keep the name under 120 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due ?? "")) return "Pick a due date.";
  if (Number.isNaN(new Date(`${due}T00:00:00`).getTime())) return "That due date isn't valid.";
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "That time isn't valid.";
  if ((notes ?? "").trim().length > NOTES_LIMIT) return "Keep notes under 1,000 characters.";
  if (weight !== undefined && weight !== null && weight !== "" && cleanWeight(weight) === null) {
    return "Worth should be a percent from 1 to 100.";
  }
  return null;
}

// How much of the grade a task is worth, as a whole percent from 1 to 100, or null if not given.
// Heavier work ranks higher on Today and in Plan my day, and makes its week count as busier.
export function cleanWeight(value) {
  if (value === null || value === undefined || value === "") return null;
  const percent = Number(value);
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) return null;
  return Math.round(percent);
}

// Heavier first; tasks without a weight keep their order after the ones with one at the same spot.
export function compareWeight(a, b) {
  return (b.weight ?? 0) - (a.weight ?? 0);
}

// Notes on a task: links (like the assignment on Canvas) and short reminders ("chapters 4-6").
const NOTES_LIMIT = 1000;
const LINK_PATTERN = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;

// Notes split into plain text and links, so links can be shown clickable without any HTML from the
// notes reaching the page: [{ text } | { link }]. Only http and https links count.
export function notesParts(notes) {
  const parts = [];
  let last = 0;
  for (const match of (notes ?? "").matchAll(LINK_PATTERN)) {
    if (match.index > last) parts.push({ text: notes.slice(last, match.index) });
    parts.push({ link: match[0] });
    last = match.index + match[0].length;
  }
  if (last < (notes ?? "").length) parts.push({ text: notes.slice(last) });
  return parts;
}

// The first link in a task's notes, or "": what the 🔗 on the calendar opens.
export function firstLink(notes) {
  return notesParts(notes).find((part) => part.link)?.link ?? "";
}

export function createTask({
  name,
  course,
  due,
  time,
  reminders = [],
  repeat = "none",
  estimateMinutes = 0,
  groupId = "",
  customColor = null,
  steps = [],
  notes = "",
  pinned = false,
  weight = null,
}) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    course: (course ?? "").trim(),
    due,
    time: time ?? "",
    done: false,
    ...cleanReminders({ reminders, repeat }),
    estimateMinutes,
    groupId,
    customColor,
    steps: cleanSteps(steps),
    notes: (notes ?? "").trim().slice(0, NOTES_LIMIT),
    pinned: pinned === true,
    weight: cleanWeight(weight),
  };
}

// Pinned tasks (★) sit at the top of Today whenever they're due, until they're checked off or
// unpinned. Soonest due first.
export function pinnedTasks(tasks) {
  return tasks.filter((task) => task.pinned && !task.done).sort((a, b) => a.due.localeCompare(b.due) || compareTimes(a, b));
}

// Steps break a big task into smaller pieces, each on its own day ("Outline" Mon, "Draft" Wed),
// shown on the calendar and checked off one at a time: { id, name, date, done }.
export const MAX_STEPS = 12;
const STEP_NAME_LIMIT = 80;

function isStep(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.date === "string"
  );
}

// Saved or typed steps, trimmed, in day order, at most 12. Anything unreadable is dropped.
export function cleanSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return steps
    .filter(isStep)
    .map((step) => ({ id: step.id, name: step.name.trim(), date: step.date, done: step.done === true }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, MAX_STEPS);
}

// What's wrong with a task's steps, or null if they're fine.
export function stepsError(steps, due) {
  for (const step of steps) {
    if (!step.name.trim()) return "Give each step a name, or remove it with ×.";
    if (step.name.trim().length > STEP_NAME_LIMIT) return "Keep each step under 80 characters.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(step.date)) return "Pick a day for each step.";
    if (step.date > due) return "Each step's day should be on or before the due date.";
  }
  return null;
}

// "1 of 3 steps", or "" for a task without steps.
export function stepProgress(task) {
  const steps = task.steps ?? [];
  if (steps.length === 0) return "";
  const done = steps.filter((step) => step.done).length;
  return `${done} of ${steps.length} step${steps.length === 1 ? "" : "s"}`;
}

// The steps on a day, as { task, step }, from tasks that aren't finished yet.
export function stepsOn(tasks, dateKey) {
  return tasks.flatMap((task) => (task.done ? [] : (task.steps ?? []).filter((step) => step.date === dateKey).map((step) => ({ task, step }))));
}

// Steps still to do from today or earlier, oldest first: what belongs on the Today list.
export function stepsToDo(tasks, todayKey) {
  return tasks
    .flatMap((task) => (task.done ? [] : (task.steps ?? []).filter((step) => !step.done && step.date <= todayKey).map((step) => ({ task, step }))))
    .sort((a, b) => a.step.date.localeCompare(b.step.date));
}

// A sensible day for a new step: the day after the last one, or today, but never after the due date.
export function nextStepDate(steps, due, todayKey) {
  const after = steps.length > 0 ? addDays(steps.at(-1).date, 1) : todayKey;
  const start = after < todayKey ? todayKey : after;
  return start > due ? due : start;
}

// Suggested steps, chosen from words in the task's name (first match wins). Papers, presentations,
// and projects come before exams, so "Final project" and "Final paper" aren't treated as exams.
const STEP_SUGGESTIONS = [
  { words: /\b(papers?|essays?|reports?|reflections?|writing)\b/, steps: ["Outline", "Draft", "Edit"] },
  { words: /\b(presentations?|slides|speech)\b/, steps: ["Make slides", "Practice", "Final run-through"] },
  { words: /\bprojects?\b/, steps: ["Plan", "Build", "Test"] },
  { words: /\b(exams?|midterms?|finals?|tests?)\b/, steps: ["Review notes", "Practice problems", "Practice test"] },
  { words: /\bquiz(zes)?\b/, steps: ["Review notes", "Practice problems"] },
  { words: /\blabs?\b/, steps: ["Read the lab", "Do the lab", "Write it up"] },
  { words: /\b(homework|hw\s*\d*|problem sets?|psets?|mps?)\b/, steps: ["Start problems", "Finish problems", "Check answers"] },
];
const DEFAULT_STEP_NAMES = ["Start", "Keep going", "Finish"];

// Steps to start from, as [{ name, date }]: names from the task's name, days spread from today (or
// the Start by day, if that's later) to the day before it's due. They only fill the form; nothing
// is saved until Save, so every one can be changed first.
// `from` is the earliest day to start, if later than today (Get ahead starts the week before).
export function suggestSteps({ name, due, estimateMinutes = 0 }, todayKey, { from = "" } = {}) {
  const text = name.toLowerCase();
  const names = STEP_SUGGESTIONS.find((suggestion) => suggestion.words.test(text))?.steps ?? DEFAULT_STEP_NAMES;
  const startBy = startByDate({ due, estimateMinutes });
  const first = [todayKey, startBy, from].filter(Boolean).sort().at(-1);
  // Done a day early when there's room; on the due date itself when there isn't.
  const last = addDays(due, -1) >= first ? addDays(due, -1) : due;
  const start = first > last ? last : first;
  const span = daysBetween(start, last);
  return names.map((stepName, index) => ({
    name: stepName,
    date: names.length === 1 ? last : addDays(start, Math.round((index * span) / (names.length - 1))),
  }));
}

// Search: every word typed has to appear in the name or class, ignoring capitals.
// Returns up to `limit` matches as { kind: "task" | "step" | "event", id, taskId, name, detail, date,
// time }: coming up first (soonest first), then past ones (most recent first).
export function searchEverything(text, { tasks, events = [] }, todayKey, limit = 20) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const matches = (...parts) => {
    const haystack = parts.filter(Boolean).join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
  const found = [
    ...tasks
      .filter((task) => matches(task.name, task.course))
      .map((task) => ({ kind: "task", id: task.id, taskId: task.id, name: task.name, detail: task.course, date: task.due, time: task.time })),
    ...tasks.flatMap((task) =>
      (task.steps ?? [])
        .filter((step) => matches(step.name, task.name, task.course))
        .map((step) => ({ kind: "step", id: step.id, taskId: task.id, name: step.name, detail: task.name, date: step.date, time: "" })),
    ),
    ...events
      .filter((entry) => matches(entry.name))
      .map((entry) => ({ kind: "event", id: entry.id, taskId: "", name: entry.name, detail: "", date: entry.date, time: entry.start ?? "" })),
  ];
  const moment = (item) => `${item.date} ${item.time || "24:00"}`;
  const upcoming = found.filter((item) => item.date >= todayKey).sort((a, b) => moment(a).localeCompare(moment(b)));
  const past = found.filter((item) => item.date < todayKey).sort((a, b) => moment(b).localeCompare(moment(a)));
  return [...upcoming, ...past].slice(0, limit);
}

// Showing just one class or group on the calendar. A filter is { kind: "course", value } for a
// class (from the Class box, ignoring capitals and spaces) or { kind: "group", id }.
const sameCourse = (a, b) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

export function matchesFilter(item, filter) {
  if (!filter) return true;
  if (filter.kind === "group") return item.groupId === filter.id;
  return Boolean((item.course ?? "").trim()) && sameCourse(item.course, filter.value);
}

// The buttons to choose from: classes in use (A to Z, written the way they were first typed),
// then groups in use. Only unfinished tasks and events count, so old classes drop off.
export function filterOptions(tasks, events, groups) {
  const items = [...tasks.filter((task) => !task.done), ...events];
  const courses = new Map();
  for (const item of items) {
    const course = (item.course ?? "").trim();
    if (course && !courses.has(course.toLowerCase())) courses.set(course.toLowerCase(), course);
  }
  const classOptions = [...courses.values()]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((course) => ({ kind: "course", value: course, label: course }));
  const groupOptions = groups
    .filter((group) => items.some((item) => item.groupId === group.id))
    .map((group) => ({ kind: "group", id: group.id, label: group.name, color: group.color }));
  return [...classOptions, ...groupOptions];
}

// Events happen at a time (a study group, a club meeting); tasks are due by a time. Events can't be
// checked off or missed, and are drawn from their start to their end like Google Calendar events.
// An all-day event has no start or end.

export const EVENTS_KEY = "due-events-v1";

// Returns an error message for bad input, or null if the event can be created.
export function validateEvent({ name, date, start, end, allDay = false, location = "" }) {
  if (!name || !name.trim()) return "Give the event a name.";
  if (name.trim().length > 120) return "Keep the name under 120 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return "Pick a date.";
  if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) return "That date isn't valid.";
  if ((location ?? "").trim().length > 200) return "Keep the location under 200 characters.";
  if (allDay) return null;
  if (!start || !end) return "Pick a start and an end time, or check All day.";
  const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!clock.test(start) || !clock.test(end)) return "That time isn't valid.";
  if (end === start) return "Pick an end time different from the start time.";
  return null;
}

// An end time earlier than the start (11:30 PM to 12:30 AM) means the event ends the next day.
export function endsNextDay(event) {
  return Boolean(event.start && event.end && event.end < event.start);
}

export function createEvent({
  name,
  course,
  date,
  start,
  end,
  groupId = "",
  customColor = null,
  reminder = "default",
  location = "",
  travelMode = "default",
  place = null,
}) {
  const trimmedLocation = (location ?? "").trim();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    course: (course ?? "").trim(),
    date,
    start: start ?? "",
    end: end ?? "",
    groupId,
    customColor,
    reminder: cleanEventReminder(reminder, { allowDefault: true }),
    location: trimmedLocation,
    travelMode: cleanTravelMode(travelMode, { allowDefault: true }),
    // Where the location is on the map, found when the event is saved.
    place: trimmedLocation && isPlace(place) ? place : null,
  };
}

// Getting to an event: walking, biking, or driving, with a default in Settings.
export const TRAVEL_MODE_KEY = "due-travel-mode";
export const DEFAULT_TRAVEL_MODE = "walk";
export const TRAVEL_MODES = [
  { id: "walk", label: "Walk", trip: "walk" },
  { id: "bike", label: "Bike", trip: "bike ride" },
  { id: "drive", label: "Drive", trip: "drive" },
];
// "Leave now" comes this many minutes before the trip would get you there exactly on time.
export const LEAVE_EXTRA_MINUTES = 5;
// Trip times are checked from this long before an event starts.
export const TRAVEL_CHECK_MINUTES = 120;

export function cleanTravelMode(id, { allowDefault = false } = {}) {
  if (allowDefault && id === "default") return id;
  if (TRAVEL_MODES.some((mode) => mode.id === id)) return id;
  return allowDefault ? "default" : DEFAULT_TRAVEL_MODE;
}

export function travelModeOf(event, defaultMode) {
  const id = event.travelMode && event.travelMode !== "default" ? event.travelMode : cleanTravelMode(defaultMode);
  return TRAVEL_MODES.find((mode) => mode.id === id);
}

function isPlace(value) {
  return value !== null && typeof value === "object" && Number.isFinite(value.lat) && Number.isFinite(value.lon);
}

// True for a timed event with a place on the map, which can have a "Leave now" reminder.
export function hasTravel(event) {
  return Boolean(event.start && isPlace(event.place));
}

// The moment (ms) to leave: the trip time plus a few extra minutes before the event starts.
export function leaveMoment(event, travelMinutes) {
  return eventStartMoment(event) - (travelMinutes + LEAVE_EXTRA_MINUTES) * 60_000;
}

// True while it's time to leave: from the leave moment until the event starts.
export function timeToLeave(event, travelMinutes, now) {
  return now >= leaveMoment(event, travelMinutes) && now < eventStartMoment(event);
}

// True when trip times should be checked: the event has a place and starts within 2 hours.
export function needsTravelCheck(event, now) {
  const minutesUntil = (eventStartMoment(event) - now) / 60_000;
  return hasTravel(event) && minutesUntil > 0 && minutesUntil <= TRAVEL_CHECK_MINUTES;
}

// "12 min walk to Siebel Center, starts at 3:00 PM"
export function describeLeaveReminder(event, travelMinutes, mode) {
  const placeName = event.place?.name || event.location;
  return `${travelMinutes} min ${mode.trip} to ${placeName}, starts at ${formatTime(event.start)}`;
}

// Event reminders: one choice in Settings for every event, which any single event can change.
// "default" on an event means "whatever Settings says".
export const EVENT_REMINDER_KEY = "due-event-reminder";
export const DEFAULT_EVENT_REMINDER = "30";
export const EVENT_REMINDER_OPTIONS = [
  { id: "none", label: "No reminder", minutes: null },
  { id: "0", label: "When it starts", minutes: 0 },
  { id: "10", label: "10 min before", minutes: 10 },
  { id: "30", label: "30 min before", minutes: 30 },
  { id: "60", label: "1 hour before", minutes: 60 },
  { id: "1440", label: "1 day before", minutes: 24 * 60 },
];
// All-day events have no start time, so their reminder counts back from 9 AM that day.
const ALL_DAY_EVENT_HOUR = "09:00";

export function cleanEventReminder(id, { allowDefault = false } = {}) {
  if (allowDefault && id === "default") return id;
  if (EVENT_REMINDER_OPTIONS.some((option) => option.id === id)) return id;
  return allowDefault ? "default" : DEFAULT_EVENT_REMINDER;
}

// The reminder choice that applies to an event, given the Settings default.
export function eventReminderOption(event, defaultId) {
  const id = event.reminder && event.reminder !== "default" ? event.reminder : cleanEventReminder(defaultId);
  return EVENT_REMINDER_OPTIONS.find((option) => option.id === id) ?? EVENT_REMINDER_OPTIONS[0];
}

function eventStartMoment(event) {
  return new Date(`${event.date}T${event.start || ALL_DAY_EVENT_HOUR}:00`).getTime();
}

// True if the event's reminder moment falls after `from` and at or before `to` (both in ms).
export function eventReminderDue(event, defaultId, from, to) {
  const { minutes } = eventReminderOption(event, defaultId);
  if (minutes === null) return false;
  const moment = reminderMoment(eventStartMoment(event), minutes);
  return moment > from && moment <= to;
}

// The body of an event reminder: "Starts in 30 min, at 3:00 PM", "Starts now", or "Tomorrow, all day".
export function describeEventReminder(event, now) {
  if (!event.start) {
    const day = describeDue({ due: event.date, time: "" }, toDateKey(now));
    return `${day[0].toUpperCase()}${day.slice(1)}, all day`;
  }
  const minutesLeft = Math.round((eventStartMoment(event) - now) / 60_000);
  if (minutesLeft <= 0) return `Starts now, until ${formatTime(event.end)}`;
  if (minutesLeft < 60) return `Starts in ${minutesLeft} min, at ${formatTime(event.start)}`;
  if (event.date === toDateKey(now)) {
    const hours = Math.round(minutesLeft / 60);
    return `Starts in ${hours} hour${hours === 1 ? "" : "s"}, at ${formatTime(event.start)}`;
  }
  return `Starts ${describeDue({ due: event.date, time: event.start }, toDateKey(now))}`;
}

// A changed copy of an event that stays the same event.
// Changing one copy of a repeating event keeps it in its series, so deleting can still offer the rest.
export function updateEvent(event, input) {
  return { ...createEvent(input), id: event.id, ...(event.seriesId ? { seriesId: event.seriesId } : {}) };
}

// Without an end date, a repeating event (a class, a shift) is added for this many days: about a
// semester, since a class schedule changes each term.
export const EVENT_REPEAT_HORIZON_DAYS = 16 * 7;

// One event per date; copies share a seriesId so they can be deleted together, like repeating tasks.
export function createRepeatingEvents(input, repeat) {
  if (repeat.repeats === "none") return [createEvent(input)];
  const until = repeat.until || addDays(input.date, EVENT_REPEAT_HORIZON_DAYS - 1);
  const seriesId = crypto.randomUUID();
  return repeatDates(input.date, { ...repeat, until }).map((date) => ({ ...createEvent({ ...input, date }), seriesId }));
}

// The events left after deleting one copy of a repeating event, that copy and every later one, or all.
export function deleteEventFromSeries(events, event, scope) {
  return events.filter((other) => {
    if (other.id === event.id) return false;
    if (scope === "one" || !event.seriesId || other.seriesId !== event.seriesId) return true;
    return scope === "following" && other.date < event.date;
  });
}

function isEvent(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.date === "string" &&
    typeof value.start === "string" &&
    typeof value.end === "string"
  );
}

export function loadEvents(storage) {
  const raw = storage.getItem(EVENTS_KEY);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed)
    ? parsed
        .filter(isEvent)
        .map((event) => ({
          course: "",
          groupId: "",
          customColor: null,
          location: "",
          place: null,
          ...event,
          reminder: cleanEventReminder(event.reminder, { allowDefault: true }),
          travelMode: cleanTravelMode(event.travelMode, { allowDefault: true }),
        }))
    : [];
}

export function saveEvents(storage, events) {
  storage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// Events in the same shape as Google Calendar's, so the calendar can draw both the same way.
// An event that ends the next day is drawn in two pieces, one on each day.
export function eventEntries(events, groups) {
  return events.flatMap((event) => {
    const entry = (id, date, start, end) => ({
      id,
      eventId: event.id,
      sourceId: "",
      name: event.name,
      date,
      start,
      end,
      location: event.location,
      colorIndex: taskColorIndex(event, groups),
    });
    if (!endsNextDay(event)) return [entry(event.id, event.date, event.start, event.end)];
    return [entry(event.id, event.date, event.start, "23:59"), entry(`${event.id}:next`, addDays(event.date, 1), "00:00", event.end)];
  });
}

// Groups: named sets of tasks (School, Work, ...), each with a color. A color is an index into the
// theme's class colors, so groups look right in every theme.

export const GROUPS_KEY = "due-groups-v1";
const STARTER_GROUPS = [
  { id: "school", name: "School", color: 0 },
  { id: "work", name: "Work", color: 4 },
  { id: "personal", name: "Personal", color: 1 },
];

function isGroup(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Number.isInteger(value.color) &&
    value.color >= 0 &&
    value.color < COURSE_COLOR_COUNT
  );
}

// Reads the groups from storage; someone with none saved yet starts with the starter groups.
export function loadGroups(storage) {
  const raw = storage.getItem(GROUPS_KEY);
  if (raw === null) return STARTER_GROUPS.map((group) => ({ ...group }));
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.filter(isGroup) : [];
}

export function saveGroups(storage, groups) {
  storage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

// Returns an error message for a new group's name, or null if it can be added.
export function groupNameError(name, groups) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "Give the group a name.";
  if (trimmed.length > 30) return "Keep the group name under 30 characters.";
  if (groups.some((group) => group.name.toLowerCase() === trimmed.toLowerCase())) return "You already have a group with that name.";
  return null;
}

export function createGroup(name, color) {
  return { id: crypto.randomUUID(), name: name.trim(), color };
}

// The first color no group is using, so a new group starts out looking different.
export function nextGroupColor(groups) {
  const used = new Set(groups.map((group) => group.color));
  for (let color = 0; color < COURSE_COLOR_COUNT; color++) {
    if (!used.has(color)) return color;
  }
  return groups.length % COURSE_COLOR_COUNT;
}

// A task's color: one chosen just for it, then its group's, then its class's (-1 for no color).
export function taskColorIndex(task, groups) {
  if (Number.isInteger(task.customColor)) return task.customColor;
  const group = groups.find((other) => other.id === task.groupId);
  return group ? group.color : courseColorIndex(task.course);
}

// A changed copy of a task: everything from the form is replaced, but it stays the same task:
// same id, done or not, and still linked to its repeat and to Canvas.
export function updateTask(task, input) {
  // A change that doesn't mention steps keeps the ones the task has.
  const steps = input.steps === undefined ? (task.steps ?? []) : cleanSteps(input.steps);
  const notes = input.notes === undefined ? (task.notes ?? "") : createTask(input).notes;
  // Pinning is done with the ☆ button, so changing the task in the form keeps it.
  return { ...task, ...createTask(input), id: task.id, done: task.done, steps, notes, pinned: task.pinned === true };
}

// "Start by": how long a task will take decides when to begin, working back from the due date.

export const ESTIMATE_OPTIONS = [
  { minutes: 0, label: "Not sure" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
  { minutes: 300, label: "5 hours" },
  { minutes: 480, label: "8 hours" },
];

// Olivia's rule: up to 2 hours a day on one task, finishing a day before it's due.
const WORK_MINUTES_PER_DAY = 120;

// The day to begin (a date key), or "" for a task with no estimate.
export function startByDate(task) {
  if (!task.estimateMinutes) return "";
  return addDays(task.due, -Math.ceil(task.estimateMinutes / WORK_MINUTES_PER_DAY));
}

// "Start by Tue", "Start today", or "Start now!" once the day has passed.
// "" when there's nothing to say: no estimate, already done, or the due date has passed.
export function describeStart(task, todayKey) {
  const startBy = startByDate(task);
  if (!startBy || task.done || task.due < todayKey) return "";
  if (startBy < todayKey) return "Start now!";
  if (startBy === todayKey) return "Start today";
  const date = new Date(`${startBy}T00:00:00`);
  const options = daysBetween(todayKey, startBy) < 7 ? { weekday: "short" } : { month: "short", day: "numeric" };
  return `Start by ${date.toLocaleDateString(undefined, options)}`;
}

// Unfinished tasks whose day to begin is still ahead, soonest first. These fill the Start by list.
export function upcomingStarts(tasks, todayKey) {
  return tasks
    .filter((task) => !task.done && startByDate(task) > todayKey)
    .sort((a, b) => startByDate(a).localeCompare(startByDate(b)) || a.due.localeCompare(b.due) || a.name.localeCompare(b.name));
}

// Unfinished tasks due later whose day to begin has arrived, most behind first. These join the Today list.
export function tasksToStart(tasks, todayKey) {
  return tasks
    .filter((task) => !task.done && task.due > todayKey && startByDate(task) && startByDate(task) <= todayKey)
    .sort((a, b) => startByDate(a).localeCompare(startByDate(b)) || a.due.localeCompare(b.due) || a.name.localeCompare(b.name));
}

// How a task itself can repeat (separate from repeating its reminders).
export const TASK_REPEAT_OPTIONS = [
  { id: "none", label: "Doesn't repeat" },
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Every week" },
  { id: "biweekly", label: "Every 2 weeks" },
  { id: "monthly", label: "Every month" },
];

// Without an end date, a repeating task is added this many days ahead.
export const REPEAT_HORIZON_DAYS = 365;

function weekdayOf(dateKey) {
  return new Date(`${dateKey}T00:00:00`).getDay();
}

// The due dates of a repeating task, starting from its first due date. weekdays (0 = Sunday)
// are used for weekly repeats and default to the first date's weekday. A monthly repeat on the
// 31st skips months without a 31st, as calendar apps do.
export function repeatDates(startKey, { repeats, weekdays = [], until = "" }) {
  if (repeats === "none") return [startKey];
  const last = until || addDays(startKey, REPEAT_HORIZON_DAYS - 1);
  const dates = [];
  if (repeats === "daily") {
    for (let day = startKey; day <= last; day = addDays(day, 1)) dates.push(day);
  } else if (repeats === "weekly" || repeats === "biweekly") {
    const days = weekdays.length > 0 ? weekdays : [weekdayOf(startKey)];
    const weeksApart = repeats === "weekly" ? 1 : 2;
    for (let weekStart = startOfWeek(startKey); weekStart <= last; weekStart = addDays(weekStart, 7 * weeksApart)) {
      for (const day of weekDays(weekStart)) {
        if (day >= startKey && day <= last && days.includes(weekdayOf(day))) dates.push(day);
      }
    }
  } else if (repeats === "monthly") {
    const dayOfMonth = startKey.slice(8);
    for (let month = startOfMonth(startKey); month <= last; month = addMonths(month, 1)) {
      const day = `${month.slice(0, 8)}${dayOfMonth}`;
      const exists = toDateKey(new Date(`${day}T00:00:00`)) === day;
      if (exists && day >= startKey && day <= last) dates.push(day);
    }
  }
  return dates;
}

// Returns an error message for a repeat that can't be added, or null.
export function repeatError(due, { repeats, weekdays = [], until = "" }) {
  if (repeats === "none") return null;
  if (until && until < due) return "The end date has to be on or after the first date.";
  if ((repeats === "weekly" || repeats === "biweekly") && weekdays.length === 0) return "Pick at least one day to repeat on.";
  if (repeatDates(due, { repeats, weekdays, until }).length === 0) return "None of those days come before the end date.";
  return null;
}

// Canvas calendar import. Canvas offers a calendar feed (.ics file) of every assignment and event.

// Turns a Canvas course tag into a class name: "math_220_120268_262973" or "FA26 LAS 101"
// becomes "MATH 220" / "LAS 101"; tags that aren't a course (like "citl_citl_open_260025") give "".
function courseFromCanvasTag(tag) {
  const codeMatch = tag.match(/^([a-z]{2,5})_(\d{3})_/i) ?? tag.match(/\b([A-Z]{2,5}) (\d{3})\b/);
  return codeMatch ? `${codeMatch[1].toUpperCase()} ${codeMatch[2]}` : "";
}

function unescapeIcsText(text) {
  return text.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
}

// Reads an .ics calendar file into events { canvasId, name, course, due, time }, in file order.
// Times in UTC (ending in Z) become local times; all-day events get no time.
// Returns null if the text isn't a calendar file.
export function parseCanvasCalendar(text) {
  if (!/BEGIN:VCALENDAR/.test(text)) return null;
  // Long lines are folded onto following lines that start with a space or tab.
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const events = [];
  let fields = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      fields = {};
    } else if (line === "END:VEVENT" && fields) {
      if (fields.UID && fields.SUMMARY && fields.DTSTART) events.push(canvasEvent(fields));
      fields = null;
    } else if (fields) {
      const colon = line.indexOf(":");
      if (colon > 0) {
        // "DTSTART;TZID=America/Los_Angeles:20261203T090000": the time zone rides along as a parameter.
        const [key, ...params] = line.slice(0, colon).split(";");
        fields[key] = line.slice(colon + 1);
        const zone = params.find((param) => param.startsWith("TZID="));
        if (zone) fields[`${key}_TZID`] = zone.slice(5).replace(/^"|"$/g, "");
      }
    }
  }
  return events;
}

// The moment a clock time in a named time zone happens, like 9 AM on Dec 3 in "America/Los_Angeles".
// It asks the browser how far that zone is from UTC at that time (which changes with daylight
// saving), checking twice in case the first guess lands on the other side of a clock change.
// Returns null for a zone the browser doesn't know, so the time is read as local instead.
function zonedMoment([year, month, day, hours, minutes, seconds], timeZone) {
  let format;
  try {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  } catch {
    return null;
  }
  const offsetAt = (moment) => {
    const parts = Object.fromEntries(format.formatToParts(new Date(moment)).map((part) => [part.type, Number(part.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - moment;
  };
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  const firstGuess = wallClock - offsetAt(wallClock);
  return new Date(wallClock - offsetAt(firstGuess));
}

function canvasEvent(fields) {
  const summary = unescapeIcsText(fields.SUMMARY);
  const tagMatch = summary.match(/\s*\[([^\]]*)\]$/);
  const name = tagMatch ? summary.slice(0, tagMatch.index) : summary;
  const course = tagMatch ? courseFromCanvasTag(tagMatch[1]) : "";

  const stamp = fields.DTSTART.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/);
  let due = "";
  let time = "";
  if (stamp) {
    const [, year, month, day, hours, minutes, seconds, utc] = stamp;
    if (hours === undefined) {
      due = `${year}-${month}-${day}`;
    } else {
      const moment = utc
        ? new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds))
        : (fields.DTSTART_TZID && zonedMoment([year, month, day, hours, minutes, seconds].map(Number), fields.DTSTART_TZID)) ||
          new Date(year, month - 1, day, hours, minutes, seconds);
      due = toDateKey(moment);
      time = toTimeKey(moment);
    }
  }
  return { canvasId: fields.UID, name: name || "Untitled", course, due, time };
}

// Canvas events not already in the task list (matched by their Canvas id), so importing twice adds nothing twice.
export function newCanvasEvents(events, tasks) {
  const imported = new Set(tasks.map((task) => task.canvasId).filter(Boolean));
  return events.filter((event) => event.due && !imported.has(event.canvasId));
}

// Canvas work that was already due when it was imported was most likely turned in, so it is
// checked off automatically instead of showing up as missed. Each Canvas task is settled once,
// when it gets its importedOn date; anything that becomes overdue after that is a real miss.
// Changes the tasks in place and returns how many were changed.
export function settleImportedCanvasTasks(tasks, now) {
  const todayKey = toDateKey(now);
  let changed = 0;
  for (const task of tasks) {
    if (!task.canvasId || task.importedOn) continue;
    task.importedOn = todayKey;
    if (!task.done && urgencyOf(task, todayKey, toTimeKey(now)) === "overdue") task.done = true;
    changed++;
  }
  return changed;
}

// Focus mode timer. Time left is worked out from the clock, so a throttled background tab stays accurate.

export const FOCUS_LENGTHS = [15, 25, 45, 60];
export const POMODORO_FOCUS_MINUTES = 25;
export const POMODORO_BREAK_MINUTES = 5;

export function createTimer(minutes, now) {
  return { remainingMs: minutes * 60_000, totalMs: minutes * 60_000, runningSince: now };
}

export function timerRemaining(timer, now) {
  const elapsed = timer.runningSince === null ? 0 : now - timer.runningSince;
  return Math.max(0, timer.remainingMs - elapsed);
}

export function pauseTimer(timer, now) {
  return { ...timer, remainingMs: timerRemaining(timer, now), runningSince: null };
}

export function resumeTimer(timer, now) {
  return { ...timer, runningSince: now };
}

export function addTimerMinutes(timer, minutes, now) {
  const added = minutes * 60_000;
  return { remainingMs: timerRemaining(timer, now) + added, totalMs: timer.totalMs + added, runningSince: now };
}

// Whole minutes focused so far, not counting paused time.
export function timerMinutesDone(timer, now) {
  return Math.round((timer.totalMs - timerRemaining(timer, now)) / 60_000);
}

// "24:59" for the big countdown; rounds up so it shows 25:00 at the start and 0:00 only at the end.
export function formatCountdown(remainingMs) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function describeLeaves(count) {
  if (count === 0) return "You stayed on this page the whole time ✨";
  return count === 1 ? "You left this page 1 time." : `You left this page ${count} times.`;
}

// Plan my day: smart rules that fit tasks into the times someone is free today.

export const PLAN_KEY = "due-plan-v1";
const DEFAULT_BLOCK_MINUTES = 45;
const SHORTEST_BLOCK_MINUTES = 25;
const BREAK_MINUTES = 10;
const PLAN_AHEAD_DAYS = 7;

// A time written without AM or PM means the likely one: 1-7 is afternoon, 12 is noon,
// and 8-11 is morning unless that has already passed today.
function likelyStartMinutes(hour, minutes, nowMinutes) {
  if (hour > 12) return hour * 60 + minutes;
  if (hour === 12) return 12 * 60 + minutes;
  if (hour < 8) return (hour + 12) * 60 + minutes;
  const morning = hour * 60 + minutes;
  return morning > nowMinutes ? morning : morning + 12 * 60;
}

function clockMinutes(hour, minutes, period) {
  return (hour % 12) * 60 + minutes + (period === "p" ? 12 * 60 : 0);
}

// Reads free time like "2-5, 7-9", "9am to 11", or "1:30-3pm and 14:00-16:00".
// Returns { windows: [{ start, end }] } in minutes, sorted and merged, or { error }.
export function parseFreeTime(text, nowMinutes) {
  const parts = text.toLowerCase().replace(/\s+to\s+|[–—]/g, "-").split(/,|\band\b|&/).map((part) => part.trim()).filter(Boolean);
  const example = "Try something like 2-5, 7-9.";
  if (parts.length === 0) return { error: `Type when you're free. ${example}` };
  const windows = [];
  for (const part of parts) {
    const match = part.match(/^(\d{1,2})(?::(\d{2}))?\s*(a|p)?\.?m?\.?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(a|p)?\.?m?\.?$/);
    if (!match) return { error: `I couldn't read “${part}”. ${example}` };
    const [startHour, startMinutes, endHour, endMinutes] = [match[1], match[2] ?? 0, match[4], match[5] ?? 0].map(Number);
    const [startPeriod, endPeriod] = [match[3], match[6]];
    if (startHour > 23 || endHour > 24 || startMinutes > 59 || endMinutes > 59) return { error: `I couldn't read “${part}”. ${example}` };

    let end;
    let start;
    if (startPeriod) {
      start = clockMinutes(startHour, startMinutes, startPeriod);
    } else if (endPeriod) {
      end = clockMinutes(endHour, endMinutes, endPeriod);
      const sameHalf = clockMinutes(startHour, startMinutes, endPeriod);
      start = sameHalf < end ? sameHalf : clockMinutes(startHour, startMinutes, "a");
    } else {
      start = likelyStartMinutes(startHour, startMinutes, nowMinutes);
    }
    if (end === undefined) {
      if (endPeriod) {
        end = clockMinutes(endHour, endMinutes, endPeriod);
      } else if (endHour > 12) {
        end = endHour * 60 + endMinutes;
      } else {
        // The first time with that number after the start.
        const first = (endHour % 12) * 60 + endMinutes;
        end = [first, first + 12 * 60, first + 24 * 60].find((candidate) => candidate > start);
      }
    }
    if (end <= start || end > 24 * 60) return { error: `“${part}” needs to end after it starts, on the same day.` };
    windows.push({ start, end });
  }
  windows.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const window of windows) {
    const last = merged.at(-1);
    if (last && window.start <= last.end) last.end = Math.max(last.end, window.end);
    else merged.push({ ...window });
  }
  return { windows: merged };
}

export function formatMinutes(totalMinutes) {
  return formatTime(timeFromMinutes(totalMinutes));
}

// Why a task is in the plan, and how urgent that makes it (lower goes first):
// missed, then time to start, then due today, then due soonest.
function planReason(task, todayKey, nowTime) {
  if (urgencyOf(task, todayKey, nowTime) === "overdue") return { rank: 0, reason: "Missed" };
  const startBy = startByDate(task);
  if (task.due > todayKey && startBy && startBy <= todayKey) return { rank: 1, reason: "Time to start" };
  if (task.due === todayKey) return { rank: 2, reason: "Due today" };
  return { rank: 3, reason: `Due ${describeDue(task, todayKey)}` };
}

// Unfinished tasks worth planning today, most urgent first: anything missed or started,
// due today, or due within a week.
export function tasksToPlan(tasks, todayKey, nowTime, skippedIds = []) {
  const horizon = addDays(todayKey, PLAN_AHEAD_DAYS);
  return tasks
    .filter((task) => !task.done && !skippedIds.includes(task.id))
    .map((task) => ({ task, ...planReason(task, todayKey, nowTime) }))
    .filter(({ task, rank }) => rank < 3 || task.due <= horizon)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.task.due.localeCompare(b.task.due) ||
        compareWeight(a.task, b.task) ||
        compareTimes(a.task, b.task) ||
        a.task.name.localeCompare(b.task.name),
    );
}

// Fits tasks into free windows from now on. Each gets its estimate (45 minutes if unknown), up to
// 2 hours today, with a 10-minute break after it, and must finish before a time due today.
// If it doesn't fit whole anywhere, it takes the first gap of at least 25 minutes.
// maxMinutes, if given, is how much work to plan in all; tasks past it wait for another day.
// Returns { blocks: [{ taskId, start, end, reason, partial }], unscheduled: [{ taskId, reason }] }.
export function planDay(tasks, windows, { todayKey, nowMinutes, skippedIds = [], maxMinutes = Infinity }) {
  const open = windows
    .map((window) => ({ start: Math.max(window.start, nowMinutes), end: window.end }))
    .filter((window) => window.end > window.start);
  const blocks = [];
  const unscheduled = [];
  let minutesLeft = maxMinutes;
  for (const { task, reason, rank } of tasksToPlan(tasks, todayKey, timeFromMinutes(nowMinutes), skippedIds)) {
    if (minutesLeft < SHORTEST_BLOCK_MINUTES) {
      unscheduled.push({ taskId: task.id, reason });
      continue;
    }
    const wanted = Math.min(task.estimateMinutes || DEFAULT_BLOCK_MINUTES, WORK_MINUTES_PER_DAY, minutesLeft);
    const deadline = rank === 2 && task.time ? minutesOf(task.time) : 24 * 60;
    const roomIn = (window) => Math.min(window.end, deadline) - window.start;
    const window = open.find((candidate) => roomIn(candidate) >= wanted) ?? open.find((candidate) => roomIn(candidate) >= SHORTEST_BLOCK_MINUTES);
    if (!window) {
      unscheduled.push({ taskId: task.id, reason });
      continue;
    }
    const length = Math.min(wanted, roomIn(window));
    blocks.push({ taskId: task.id, start: window.start, end: window.start + length, reason, partial: length < wanted });
    window.start += length + BREAK_MINUTES;
    minutesLeft -= length;
  }
  blocks.sort((a, b) => a.start - b.start);
  return { blocks, unscheduled };
}

// Reasonable hours for planned work, and the time left around each event to get there and back.
export const PLAN_DAY_START = 8 * 60;
export const PLAN_DAY_END = 22 * 60;
const EVENT_BUFFER_MINUTES = 10;

// Times of day someone can choose to work in, all within reasonable hours.
export const PLAN_PERIODS = {
  anytime: { label: "Anytime", start: PLAN_DAY_START, end: PLAN_DAY_END },
  morning: { label: "Morning", start: PLAN_DAY_START, end: 12 * 60 },
  afternoon: { label: "Afternoon", start: 12 * 60, end: 17 * 60 },
  evening: { label: "Evening", start: 17 * 60, end: PLAN_DAY_END },
};

// The free gaps between calendar events (timed entries with "HH:MM" start and end) within a range
// of the day (8 AM to 10 PM unless given) and from now on, with a 10-minute buffer around each event.
// Gaps too short to work in are left out. Returns [{ start, end }] in minutes.
export function freeWindows(timedEntries, nowMinutes = 0, { start = PLAN_DAY_START, end = PLAN_DAY_END } = {}) {
  const busy = timedEntries
    .map((entry) => ({ start: minutesOf(entry.start) - EVENT_BUFFER_MINUTES, end: minutesOf(entry.end) + EVENT_BUFFER_MINUTES }))
    .filter((block) => block.end - block.start > 2 * EVENT_BUFFER_MINUTES)
    .sort((a, b) => a.start - b.start);
  // Plans start on a 5-minute mark, so "now" at 2:07 means 2:10.
  let cursor = Math.max(start, Math.ceil(nowMinutes / 5) * 5);
  const windows = [];
  const addWindow = (windowEnd) => {
    if (windowEnd - cursor >= SHORTEST_BLOCK_MINUTES) windows.push({ start: cursor, end: windowEnd });
  };
  for (const block of busy) {
    if (block.start >= end) break;
    if (block.start > cursor) addWindow(block.start);
    cursor = Math.max(cursor, block.end);
  }
  addWindow(end);
  return windows;
}

function shortClock(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}${hours < 12 ? "am" : "pm"}`;
}

// Free windows written the way the plan's box reads them: "11am-3pm, 6:50pm-10pm".
export function describeFreeWindows(windows) {
  return windows.map((window) => `${shortClock(window.start)}-${shortClock(window.end)}`).join(", ");
}

// The chat helper: set phrases, not real AI. understandMessage turns a typed sentence into
// a { type, ... } request, and nothing here changes any tasks.

const WEEKDAY_WORD = /\b(next\s+)?(sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?\b/i;
const WEEKDAY_STARTS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// The first date in the text as { due, start, end }, or null: today, tomorrow, weekdays, "Nov 12", "11/12".
function findDatePhrase(text, todayKey) {
  const word = text.match(/\b(today|tonight|tomorrow)\b/i);
  if (word) {
    const offset = word[1].toLowerCase() === "tomorrow" ? 1 : 0;
    return { due: addDays(todayKey, offset), start: word.index, end: word.index + word[0].length };
  }
  const written = datesInLine(text, todayKey.slice(0, 4))[0];
  if (written) {
    // A date with no year that already passed means next year.
    const hasYear = /\d{4}/.test(text.slice(written.start, written.end)) || /\/\d{2,4}$/.test(text.slice(written.start, written.end));
    const due = written.due < todayKey && !hasYear ? `${Number(written.year) + 1}${written.due.slice(4)}` : written.due;
    return { due, start: written.start, end: written.end };
  }
  const weekday = text.match(WEEKDAY_WORD);
  if (!weekday) return null;
  const wanted = WEEKDAY_STARTS.indexOf(weekday[2].slice(0, 3).toLowerCase());
  const today = new Date(`${todayKey}T00:00:00`).getDay();
  // The next one coming; "next Friday" means the one in the following week.
  let daysAhead = (wanted - today + 7) % 7 || 7;
  if (weekday[1]) {
    const daysLeftInWeek = (7 - today) % 7;
    if (daysAhead <= daysLeftInWeek) daysAhead += 7;
  }
  return { due: addDays(todayKey, daysAhead), start: weekday.index, end: weekday.index + weekday[0].length };
}

function findTimePhrase(text) {
  const named = text.match(/\b(?:at\s+)?(noon|midnight)\b/i);
  if (named) {
    return { time: named[1].toLowerCase() === "noon" ? "12:00" : "23:59", start: named.index, end: named.index + named[0].length };
  }
  const clock = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ?? text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?()/i);
  if (!clock) return null;
  const hours = Number(clock[1]);
  const minutes = Number(clock[2] ?? 0);
  if (hours > 23 || minutes > 59) return null;
  const period = clock[3]?.[0]?.toLowerCase();
  const total = period ? clockMinutes(hours, minutes, period) : likelyStartMinutes(hours, minutes, -1);
  return { time: timeFromMinutes(total), start: clock.index, end: clock.index + clock[0].length };
}

// "2 hours", "90 min", "half an hour": { minutes, start, end }, or null.
function findDurationPhrase(text) {
  const half = text.match(/\bhalf\s+(?:an\s+)?hour\b/i);
  if (half) return { minutes: 30, start: half.index, end: half.index + half[0].length };
  const anHour = text.match(/\ban\s+hour\b/i);
  if (anHour) return { minutes: 60, start: anHour.index, end: anHour.index + anHour[0].length };
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\b/i);
  if (!match) return null;
  const minutes = Number(match[1]) * (match[2].toLowerCase().startsWith("h") ? 60 : 1);
  return { minutes, start: match.index, end: match.index + match[0].length };
}

// The closest choice in the task form's "how long" row.
function nearestEstimate(minutes) {
  return ESTIMATE_OPTIONS.filter((option) => option.minutes > 0).reduce((best, option) =>
    Math.abs(option.minutes - minutes) < Math.abs(best.minutes - minutes) ? option : best,
  ).minutes;
}

function cutOut(text, phrase) {
  return phrase ? `${text.slice(0, phrase.start)} , ${text.slice(phrase.end)}` : text;
}

// The task details in a sentence like "econ homework due Friday at 5, probably 2 hours".
function parseNewTask(text, todayKey) {
  let rest = text;
  const course = rest.match(/\b([a-z]{2,5})\s?(\d{3})\b/i);
  if (course) rest = cutOut(rest, { start: course.index, end: course.index + course[0].length });
  const duration = findDurationPhrase(rest);
  rest = cutOut(rest, duration);
  const time = findTimePhrase(rest);
  rest = cutOut(rest, time);
  const date = findDatePhrase(rest, todayKey);
  rest = cutOut(rest, date);

  let name = rest
    .replace(/^\s*(?:please\s+)?(?:add|create|new task|remind me (?:to|about)|i have|i've got|ive got|i need to)\b/i, " ")
    .replace(/^[\s,:.-]+/, "")
    .replace(/^(?:a|an|my|the)\s+/i, "")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const dangling = /\s*\b(?:due|by|on|at|for|in|and|takes?|will take|it'?ll take|probably|about|around|maybe|should)$/i;
  while (dangling.test(name)) name = name.replace(dangling, "");
  name = name.replace(/[\s.,!?:;-]+$/, "");
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1, 120),
    course: course ? `${course[1].toUpperCase()} ${course[2]}` : "",
    due: date?.due ?? "",
    time: time?.time ?? "",
    estimateMinutes: duration ? nearestEstimate(duration.minutes) : 0,
  };
}

// A time range like "3-5", "from 3 to 5pm", or "11am–1pm": { start, end } in minutes plus where it
// was found, or null. "2-3 hours" is a length, not a range. Without am/pm, 1–7 are afternoon times.
const TIME_RANGE = /\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b(?!\s*(?:hours?|hrs?|min))/i;

function findTimeRange(text) {
  const match = text.match(TIME_RANGE);
  if (!match) return null;
  const [startHour, startMinute, endHour, endMinute] = [match[1], match[2] ?? 0, match[4], match[5] ?? 0].map(Number);
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) return null;
  const startPeriod = match[3]?.[0].toLowerCase();
  const endPeriod = match[6]?.[0].toLowerCase();
  let start = startPeriod ? clockMinutes(startHour, startMinute, startPeriod) : likelyStartMinutes(startHour, startMinute, -1);
  let end = endPeriod ? clockMinutes(endHour, endMinute, endPeriod) : clockMinutes(endHour, endMinute, start >= 12 * 60 ? "p" : "a");
  // "11-1pm" starts in the morning; "3-5" ends in the afternoon too.
  if (!startPeriod && endPeriod && start > end) start -= 12 * 60;
  if (end <= start && !endPeriod) end += 12 * 60;
  if (start < 0 || end <= start || end >= 24 * 60) return null;
  return { start, end, index: match.index, length: match[0].length };
}

// An event in a sentence like "study group tomorrow 3-5 at Grainger Library": it needs a time range.
// Returns { name, date, start, end, location } (date "" if none was said), or null.
function parseNewEvent(text, todayKey) {
  const range = findTimeRange(text);
  if (!range) return null;
  let rest = cutOut(text, { start: range.index, end: range.index + range.length });
  // A place starts with a capital letter, so "at night" isn't one.
  const place = rest.match(/\b(?:at|in)\s+((?:[A-Z][\w'&.-]*)(?:\s+[A-Z0-9][\w'&.-]*)*)/);
  if (place) rest = cutOut(rest, { start: place.index, end: place.index + place[0].length });
  const date = findDatePhrase(rest, todayKey);
  rest = cutOut(rest, date);
  let name = rest
    .replace(/^\s*(?:please\s+)?(?:add|create|schedule|put|new event|event)\b(?:\s+(?:an?\s+)?event\b)?/i, " ")
    .replace(/^[\s,:.-]+/, "")
    .replace(/^(?:a|an|my|the)\s+/i, "")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const dangling = /\s*\b(?:on|at|from|for|in|and|is)$/i;
  while (dangling.test(name)) name = name.replace(dangling, "");
  name = name.replace(/[\s.,!?:;-]+$/, "");
  if (!name) return null;
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1, 120),
    date: date?.due ?? "",
    start: timeFromMinutes(range.start),
    end: timeFromMinutes(range.end),
    location: place ? place[1] : "",
  };
}

// The Sunday a question like "how busy is next week?" is about.
function askedWeekStart(text, todayKey) {
  const thisWeek = startOfWeek(todayKey);
  if (/\bnext\s+week\b/i.test(text)) return addDays(thisWeek, 7);
  if (/\bthis\s+week\b/i.test(text)) return thisWeek;
  const date = findDatePhrase(text, todayKey);
  return date ? startOfWeek(date.due) : thisWeek;
}

// The unfinished task that best matches some typed words, soonest due first, or null.
export function findTaskByWords(words, tasks) {
  const wanted = words.toLowerCase().replace(/\b(my|the|a|an)\b/g, " ").split(/\s+/).filter(Boolean);
  if (wanted.length === 0) return null;
  const matches = tasks.filter((task) => !task.done && wanted.every((word) => task.name.toLowerCase().includes(word)));
  return matches.sort((a, b) => a.due.localeCompare(b.due))[0] ?? null;
}

// Tasks for "what's due ...": missed work is included when asking about today or this week.
function listRange(text, todayKey) {
  if (/\btomorrow\b/i.test(text)) {
    const tomorrow = addDays(todayKey, 1);
    return { from: tomorrow, to: tomorrow, label: "tomorrow" };
  }
  if (/\b(this\s+)?week\b/i.test(text)) return { from: "", to: addDays(startOfWeek(todayKey), 6), label: "this week" };
  const date = findDatePhrase(text.replace(/\btoday\b/i, ""), todayKey);
  if (date) {
    const label = new Date(`${date.due}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    return { from: date.due, to: date.due, label };
  }
  return { from: "", to: todayKey, label: "today" };
}

export function tasksInRange(tasks, { from, to }) {
  return tasks
    .filter((task) => !task.done && task.due >= from && task.due <= to)
    .sort((a, b) => a.due.localeCompare(b.due) || compareTimes(a, b) || a.name.localeCompare(b.name));
}

// Tasks to suggest, most urgent first; among equally urgent ones, those that fit the time come first.
export function suggestTasks(tasks, todayKey, nowTime, minutes = null) {
  const fits = ({ task }) => minutes === null || (task.estimateMinutes || DEFAULT_BLOCK_MINUTES) <= minutes;
  return tasksToPlan(tasks, todayKey, nowTime)
    .map((item, order) => ({ ...item, order }))
    .sort((a, b) => a.rank - b.rank || Number(fits(b)) - Number(fits(a)) || a.order - b.order)
    .map(({ task, reason }) => ({ task, reason }));
}

export function understandMessage(text, tasks, now) {
  const message = text.trim();
  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (!message) return { type: "unknown" };

  if (/^(hi|hello|hey|yo)\b[\s!.]*$/i.test(message)) return { type: "hello" };
  if (/\b(help|what can you)\b/i.test(message)) return { type: "help" };
  if (/\b(streak|progress|how am i doing)\b/i.test(message)) return { type: "progress" };

  if (/\b(busiest|crunch)\b/i.test(message)) return { type: "busiest" };
  if (/\bhow\s+(?:busy|bad|heavy|full|packed)\b/i.test(message)) return { type: "busyWeek", weekStart: askedWeekStart(message, todayKey) };
  if (/\b(when am i free|am i free|free time|when can i|when do i have time)\b/i.test(message)) {
    return { type: "free", date: findDatePhrase(message, todayKey)?.due ?? todayKey };
  }

  if (/\bplan\b.*\b(day|today)\b|^plan\b/i.test(message)) {
    const free = message.match(/\bfree\b(?:\s+(?:from|at|time))?[\s:]*(.+)$/i);
    return { type: "plan", freeText: free ? free[1].trim() : "" };
  }

  const moving = message.match(/^(?:please\s+)?(?:move|reschedule|push|change)\s+(.+?)\s+to\s+(.+)$/i);
  if (moving) {
    const date = findDatePhrase(moving[2], todayKey);
    const task = findTaskByWords(moving[1], tasks);
    if (!task) return { type: "noTask", words: moving[1] };
    if (!date) return { type: "noDate", task };
    return { type: "move", task, due: date.due, time: findTimePhrase(moving[2])?.time ?? task.time };
  }

  const finished = message.match(/^(?:i\s+)?(?:just\s+)?(?:finished|completed|did|done with|mark|check off)\s+(.+?)(?:\s+(?:as\s+)?(?:done|finished|complete))?[\s.!]*$/i);
  if (finished) {
    const task = findTaskByWords(finished[1], tasks);
    return task ? { type: "finish", task } : { type: "noTask", words: finished[1] };
  }

  if (/\bwhat('?s| is| do i have)\b.*\b(due|week|today|tomorrow)\b|^due\b|\bon my (list|plate)\b|\bdo i have\b.*\b(due|today|tomorrow|week)\b/i.test(message)) {
    const range = listRange(message, todayKey);
    return { type: "list", label: range.label, tasks: tasksInRange(tasks, range) };
  }

  const available = /^i\s+(?:only\s+)?(?:have|got)\s+(?:about\s+)?(?:\d|an\s+hour|half)/i.test(message);
  if (available || /\b(what should|what do i do|what next|what now|pick for me|suggest)\b/i.test(message)) {
    const duration = findDurationPhrase(message);
    return {
      type: "suggest",
      minutes: duration?.minutes ?? null,
      suggestions: suggestTasks(tasks, todayKey, timeFromMinutes(nowMinutes), duration?.minutes ?? null),
    };
  }

  const event = parseNewEvent(message, todayKey);
  if (event) return event.date ? { type: "addEvent", details: event } : { type: "askEventDate", details: event };

  const details = parseNewTask(message, todayKey);
  const askedToAdd = /^\s*(?:please\s+)?(?:add|create|new task|remind me)\b/i.test(message);
  if (!details.name) return { type: "unknown" };
  if (details.due) return { type: "add", details };
  return askedToAdd ? { type: "askDate", details } : { type: "unknown" };
}

// Progress and streaks. Each Lock in session and each checked-off task is recorded with its date.

export const PROGRESS_KEY = "due-progress-v1";
const STREAK_FOCUS_MINUTES = 10;

export function loadProgress(storage) {
  const parsed = JSON.parse(storage.getItem(PROGRESS_KEY) ?? "{}");
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    completions: Array.isArray(parsed.completions) ? parsed.completions : [],
  };
}

export function saveProgress(storage, progress) {
  storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// Records a Lock in session, or updates it if it's still going (after "+10 more minutes").
// Sessions under a minute aren't recorded. Returns the session's entry, if there is one.
export function recordFocus(progress, entry, fields) {
  if (entry) return Object.assign(entry, fields);
  if (fields.minutes < 1) return null;
  const newEntry = { ...fields };
  progress.sessions.push(newEntry);
  return newEntry;
}

export function recordCompletion(progress, taskId, dateKey) {
  if (!progress.completions.some((completion) => completion.taskId === taskId)) {
    progress.completions.push({ taskId, date: dateKey });
  }
}

// Unchecking a task takes back its credit.
export function removeCompletion(progress, taskId) {
  progress.completions = progress.completions.filter((completion) => completion.taskId !== taskId);
}

// The days that count: at least 10 minutes locked in, or at least one task checked off.
function activeDays(progress) {
  const minutesByDay = {};
  for (const session of progress.sessions) minutesByDay[session.date] = (minutesByDay[session.date] ?? 0) + session.minutes;
  const days = new Set(progress.completions.map((completion) => completion.date));
  for (const [day, minutes] of Object.entries(minutesByDay)) {
    if (minutes >= STREAK_FOCUS_MINUTES) days.add(day);
  }
  return days;
}

// { current, longest, activeToday }. A streak stays alive through today until the day is over.
export function streakInfo(progress, todayKey) {
  const days = activeDays(progress);
  const activeToday = days.has(todayKey);
  let current = 0;
  for (let day = activeToday ? todayKey : addDays(todayKey, -1); days.has(day); day = addDays(day, -1)) current++;
  let longest = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue;
    let length = 0;
    for (let next = day; days.has(next); next = addDays(next, 1)) length++;
    longest = Math.max(longest, length);
  }
  return { current, longest, activeToday };
}

// This week's numbers (Sunday to Saturday), with time per class or group, most time first.
export function weekProgress(progress, todayKey) {
  const weekStart = startOfWeek(todayKey);
  const inWeek = (date) => date >= weekStart && date <= todayKey;
  const sessions = progress.sessions.filter((session) => inWeek(session.date));
  const byLabel = new Map();
  for (const { label, color, minutes } of sessions) {
    const row = byLabel.get(label) ?? { label, color, minutes: 0 };
    row.minutes += minutes;
    byLabel.set(label, row);
  }
  return {
    minutes: sessions.reduce((total, session) => total + session.minutes, 0),
    tasksDone: progress.completions.filter((completion) => inWeek(completion.date)).length,
    sessionCount: sessions.length,
    stayedCount: sessions.filter((session) => session.leaves === 0).length,
    byLabel: [...byLabel.values()].sort((a, b) => b.minutes - a.minutes),
  };
}

// "45m", "3h", "1h 30m"
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

// The first time the app opens before noon each day, a quick summary of today. Otherwise null.
export function morningSummary(tasks, progress, now, lastShownDate) {
  const todayKey = toDateKey(now);
  if (now.getHours() >= 12 || lastShownDate === todayKey) return null;
  const groups = groupTasks(tasks, todayKey, toTimeKey(now));
  const counts = [
    [groups.today.length, "due"],
    [tasksToStart(tasks, todayKey).length, "to start"],
    [groups.overdue.length, "missed"],
  ].filter(([count]) => count > 0);
  const { current } = streakInfo(progress, todayKey);
  const streak = current > 0 ? ` · 🔥 ${current}-day streak` : "";
  if (counts.length === 0) return `Nothing due today 🌷${streak}`;
  return `Today: ${counts.map(([count, label]) => `${count} ${label}`).join(", ")}${streak}`;
}

// The Sunday card: the first time the app opens on a Sunday, what's due this week (Sunday to
// Saturday). Otherwise null. Returns { due: [unfinished tasks, soonest first], busiest: { date, count }
// for a day with 2 or more due (or null), big: [exams and projects this week], steps: how many steps
// are planned this week }.
export function sundayPlan(tasks, now, lastShownDate) {
  const todayKey = toDateKey(now);
  if (now.getDay() !== 0 || lastShownDate === todayKey) return null;
  const end = addDays(todayKey, 6);
  const due = tasks
    .filter((task) => !task.done && task.due >= todayKey && task.due <= end)
    .sort((a, b) => a.due.localeCompare(b.due) || compareTimes(a, b) || a.name.localeCompare(b.name));
  const perDay = new Map();
  for (const task of due) perDay.set(task.due, (perDay.get(task.due) ?? 0) + 1);
  const [busiestDate, busiestCount] = [...perDay].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];
  const steps = tasks
    .filter((task) => !task.done)
    .flatMap((task) => task.steps ?? [])
    .filter((step) => !step.done && step.date >= todayKey && step.date <= end).length;
  return {
    due,
    busiest: busiestCount >= 2 ? { date: busiestDate, count: busiestCount } : null,
    big: due.filter(isBigWork),
    steps,
  };
}

// Finals countdown, at the top of the Semester view. The date is set there ("Finals start"), or
// guessed from the earliest unfinished task with "final" in its name that isn't a project, paper,
// or presentation ("CHEM 102 Final" counts; "Final project" doesn't).
export const FINALS_KEY = "due-finals";
const FINAL_EXAM_WORDS = /\bfinals?\b/i;
const NOT_AN_EXAM = /\b(projects?|papers?|essays?|reports?|presentations?|portfolios?)\b/i;

export function guessFinalsDate(tasks, todayKey) {
  return (
    tasks
      .filter((task) => !task.done && task.due >= todayKey && FINAL_EXAM_WORDS.test(task.name) && !NOT_AN_EXAM.test(task.name))
      .map((task) => task.due)
      .sort()[0] ?? ""
  );
}

// "3 weeks until finals (Dec 11)", "5 days until finals (Dec 11)", "Finals start tomorrow",
// "Finals start today", or "" once they've started or with no date.
export function describeFinalsCountdown(finalsKey, todayKey) {
  if (!finalsKey || finalsKey < todayKey) return "";
  const days = daysBetween(todayKey, finalsKey);
  if (days === 0) return "Finals start today";
  if (days === 1) return "Finals start tomorrow";
  const date = new Date(`${finalsKey}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days < 14) return `${days} days until finals (${date})`;
  return `${Math.floor(days / 7)} weeks until finals (${date})`;
}

// Dark mode (Settings → Look): "system" follows the computer (the default), "off", "on", or "night",
// which is dark from one time to another, like 8 PM to 7 AM. Saved as { mode, from, to }.
export const DARK_KEY = "due-dark";
export const DARK_MODES = ["system", "off", "on", "night"];
const DEFAULT_DARK = { mode: "system", from: "20:00", to: "07:00" };
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export function cleanDarkSetting(value) {
  const setting = value && typeof value === "object" ? value : {};
  return {
    mode: DARK_MODES.includes(setting.mode) ? setting.mode : DEFAULT_DARK.mode,
    from: CLOCK.test(setting.from) ? setting.from : DEFAULT_DARK.from,
    to: CLOCK.test(setting.to) ? setting.to : DEFAULT_DARK.to,
  };
}

// Whether Due Next should be dark right now. A night window can cross midnight (8 PM to 7 AM) or
// not (1 PM to 5 PM); from and to being the same means all day.
export function isDarkNow(setting, now, computerIsDark) {
  const { mode, from, to } = cleanDarkSetting(setting);
  if (mode === "on") return true;
  if (mode === "off") return false;
  if (mode === "system") return computerIsDark;
  const clock = toTimeKey(now);
  if (from === to) return true;
  return from < to ? clock >= from && clock < to : clock >= from || clock < to;
}

// Holidays, shown as all-day items at the top of each day: US holidays plus popular ones (Valentine's
// Day, Halloween, ...). Worked out from rules, so every year is covered with nothing to download.
export const HOLIDAYS_KEY = "due-holidays";

const pad = (number) => String(number).padStart(2, "0");
const dateOf = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

// The nth weekday (0 = Sunday) of a month; n = -1 means the last one.
function nthWeekday(year, month, weekday, n) {
  if (n > 0) {
    const first = new Date(year, month - 1, 1).getDay();
    return dateOf(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(year, month, 0);
  return dateOf(year, month, lastDay.getDate() - ((lastDay.getDay() - weekday + 7) % 7));
}

// Easter Sunday (the Western church's date), by the anonymous Gregorian method.
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dateOf(year, month, day);
}

export function holidaysIn(year) {
  return [
    { date: dateOf(year, 1, 1), name: "New Year's Day" },
    { date: nthWeekday(year, 1, 1, 3), name: "Martin Luther King Jr. Day" },
    { date: dateOf(year, 2, 14), name: "Valentine's Day" },
    { date: nthWeekday(year, 2, 1, 3), name: "Presidents' Day" },
    { date: dateOf(year, 3, 17), name: "St. Patrick's Day" },
    { date: easter(year), name: "Easter" },
    { date: nthWeekday(year, 5, 0, 2), name: "Mother's Day" },
    { date: nthWeekday(year, 5, 1, -1), name: "Memorial Day" },
    { date: nthWeekday(year, 6, 0, 3), name: "Father's Day" },
    { date: dateOf(year, 6, 19), name: "Juneteenth" },
    { date: dateOf(year, 7, 4), name: "Independence Day" },
    { date: nthWeekday(year, 9, 1, 1), name: "Labor Day" },
    { date: nthWeekday(year, 10, 1, 2), name: "Indigenous Peoples' Day" },
    { date: dateOf(year, 10, 31), name: "Halloween" },
    { date: dateOf(year, 11, 11), name: "Veterans Day" },
    { date: nthWeekday(year, 11, 4, 4), name: "Thanksgiving" },
    { date: dateOf(year, 12, 24), name: "Christmas Eve" },
    { date: dateOf(year, 12, 25), name: "Christmas" },
    { date: dateOf(year, 12, 31), name: "New Year's Eve" },
  ];
}

const holidaysByYear = new Map();

// The holidays on a day, as all-day calendar entries: { id, name, date, start: "", end: "", holiday: true }.
export function holidaysOn(dateKey) {
  const year = Number(dateKey.slice(0, 4));
  if (!holidaysByYear.has(year)) holidaysByYear.set(year, holidaysIn(year));
  return holidaysByYear
    .get(year)
    .filter((holiday) => holiday.date === dateKey)
    .map((holiday) => ({ id: `holiday:${holiday.date}:${holiday.name}`, name: holiday.name, date: holiday.date, start: "", end: "", holiday: true }));
}

// Finding due dates in text, such as a syllabus PDF or a pasted schedule.

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_DATE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:,?\s+(\d{4}))?/gi;
const NUMBER_DATE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/g;
const CLOCK_TIME = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i;

// Grade weights from a syllabus's grading breakdown ("Homework 20%", "Midterms (2) 30%", "Final Exam
// 25%"). Each category's percent is split across that class's assignments of the same kind, so 10
// homeworks at 20% are 2% each. Kinds are checked in this order, so "Final project" is a project and
// "Final exam" is the final, not a midterm.
const GRADE_KINDS = [
  { kind: "paper", label: "Papers", words: /\b(papers?|essays?|reports?|writing)\b/i },
  { kind: "presentation", label: "Presentations", words: /\b(presentations?|speech(es)?)\b/i },
  { kind: "project", label: "Projects", words: /\bprojects?\b/i },
  { kind: "lab", label: "Labs", words: /\blabs?\b/i },
  { kind: "final", label: "Final", words: /\bfinals?\b/i },
  { kind: "midterm", label: "Exams", words: /\b(midterms?|exams?|tests?|hour exams?)\b/i },
  { kind: "quiz", label: "Quizzes", words: /\bquiz(zes)?\b/i },
  { kind: "homework", label: "Homework", words: /\b(homeworks?|hw\s*\d*|assignments?|problem sets?|psets?|mps?|machine problems?|worksheets?)\b/i },
  { kind: "reading", label: "Readings", words: /\b(readings?|reading responses?|reflections?)\b/i },
];

function gradeKindOf(text) {
  return GRADE_KINDS.find(({ words }) => words.test(text))?.kind ?? "";
}

// The breakdown found in a syllabus: [{ kind, label, percent, count }], one per kind (the first line
// wins). A line counts when it names a kind and has a percent from 1 to 100; letter-grade scales
// ("A 93%") name no kind, so they're skipped. count is how many there are when the line says so
// ("Midterms (2)", "3 exams"), or 0.
export function parseGradeBreakdown(text) {
  const found = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
    if (!match) continue;
    const percent = Number(match[1]);
    if (percent < 1 || percent > 100) continue;
    const kind = gradeKindOf(line.slice(0, match.index) || line);
    if (!kind || found.has(kind)) continue;
    const before = line.slice(0, match.index);
    const stated = before.match(/\((\d{1,2})\)|\b(\d{1,2})\s+(?:midterms?|exams?|tests?|quiz(?:zes)?|homeworks?|labs?|projects?|papers?|essays?)\b/i);
    const count = stated ? Number(stated[1] ?? stated[2]) : 0;
    found.set(kind, { kind, label: GRADE_KINDS.find((option) => option.kind === kind).label, percent, count });
  }
  return [...found.values()];
}

// Each item's share of the grade ({ name } items, the new ones and the class's tasks already here),
// as weights in the same order, or null where the syllabus has nothing for its kind. A final with no
// "Final" line shares the exams' percent.
export function gradeWeights(items, breakdown) {
  const byKind = new Map(breakdown.map((part) => [part.kind, part.percent]));
  const statedCount = new Map(breakdown.map((part) => [part.kind, part.count ?? 0]));
  const kindFor = (item) => {
    const kind = gradeKindOf(item.name);
    return kind === "final" && !byKind.has("final") ? "midterm" : kind;
  };
  const kinds = items.map(kindFor);
  const counts = new Map();
  for (const kind of kinds) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  // Split by how many the syllabus says there are, or by how many were found if that's more.
  const shareOf = (kind) => byKind.get(kind) / Math.max(counts.get(kind), statedCount.get(kind) ?? 0);
  return kinds.map((kind) => (byKind.has(kind) ? cleanWeight(Math.max(1, shareOf(kind))) : null));
}

// The class a document is about, from a course code near the top ("Math 220 Calculus" gives "MATH 220").
export function guessCourse(text) {
  const match = text.slice(0, 500).match(/\b([A-Za-z]{2,5})\s?(\d{3})\b/);
  return match ? `${match[1].toUpperCase()} ${match[2]}` : "";
}

// The year dates without one belong to: the most common 20xx year in the text, or the current year.
function documentYear(text, today) {
  const counts = {};
  for (const [year] of text.matchAll(/\b20\d{2}\b/g)) counts[year] = (counts[year] ?? 0) + 1;
  const [mostCommon] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return mostCommon ?? String(today.getFullYear());
}

// Every date mentioned on one line, in order: { start, end, due }.
function datesInLine(line, year) {
  const found = [];
  for (const match of line.matchAll(MONTH_DATE)) {
    const month = MONTHS.indexOf(match[1].toLowerCase()) + 1;
    found.push({ start: match.index, end: match.index + match[0].length, month, day: Number(match[2]), year: match[3] ?? year });
  }
  for (const match of line.matchAll(NUMBER_DATE)) {
    const shortYear = match[3] && match[3].length === 2 ? `20${match[3]}` : match[3];
    found.push({ start: match.index, end: match.index + match[0].length, month: Number(match[1]), day: Number(match[2]), year: shortYear ?? year });
  }
  return found
    .map((date) => ({ ...date, due: `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}` }))
    .filter((date) => date.month >= 1 && date.month <= 12 && toDateKey(new Date(`${date.due}T00:00:00`)) === date.due)
    .sort((a, b) => a.start - b.start);
}

// A task name from the words around a date: separators, weekdays, times, and leftover dates are dropped.
function cleanName(text) {
  return text
    .replace(new RegExp(`(?:\\bat\\s+)?${CLOCK_TIME.source}`, "gi"), " ")
    .replace(MONTH_DATE, " ")
    .replace(NUMBER_DATE, " ")
    .replace(/\b(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|sday|nesday|rsday|urday)?\b\.?,?/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:–—|•·,.()-]+|[\s:–—|•·,(-]+$/g, "")
    .slice(0, 80);
}

function timeAfter(text) {
  const match = text.match(CLOCK_TIME);
  if (!match) return "";
  const hours = Number(match[1]);
  if (hours < 1 || hours > 12) return "";
  const pm = match[3].toLowerCase().startsWith("p");
  return `${String((hours % 12) + (pm ? 12 : 0)).padStart(2, "0")}:${match[2] ?? "00"}`;
}

// Finds due dates in a document's text. Each line with dates becomes one event per date, named by
// the rest of the line. A line like "Exam 1: Exam 2: Thursday, September 24 Thursday, October 29"
// (a table flattened by the PDF) pairs each "Label:" with the date in the same position.
// Returns events { name, due, time } in date order, without repeats.
export function findDatesInText(text, today = new Date()) {
  const year = documentYear(text, today);
  const events = [];
  let previousLine = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const dates = datesInLine(line, year);
    if (dates.length === 0) {
      if (line) previousLine = line;
      continue;
    }
    const labels = [...line.slice(0, dates[0].start).matchAll(/([A-Za-z][\w .#&'-]{0,40}?):/g)].map((match) => match[1].trim());
    dates.forEach((date, index) => {
      const nextStart = dates[index + 1]?.start ?? line.length;
      let name = labels.length === dates.length ? labels[index] : "";
      if (!name) name = cleanName(dates.length === 1 ? line : line.slice(date.end, nextStart));
      if (!name) name = cleanName(previousLine) || "Due";
      events.push({ name, due: date.due, time: timeAfter(line.slice(date.end, nextStart)) });
    });
  }
  const seen = new Set();
  return events
    .filter((event) => {
      const key = `${event.due}|${event.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.due.localeCompare(b.due));
}

// Found events not already in the task list (same name on the same day), so importing twice adds nothing twice.
export function newTextEvents(events, tasks) {
  const existing = new Set(tasks.map((task) => `${task.due}|${task.name.toLowerCase()}`));
  return events.filter((event) => !existing.has(`${event.due}|${event.name.toLowerCase()}`));
}

// Imported work that was already due is most likely done, so it comes in checked off instead of missed.
export function markPastAsDone(tasks, now) {
  for (const task of tasks) {
    if (urgencyOf(task, toDateKey(now), toTimeKey(now)) === "overdue") task.done = true;
  }
}

// The tasks left after deleting a copy of a repeating task: "one" deletes just that copy,
// "following" also deletes the copies due after it, and "all" deletes every copy.
export function deleteFromSeries(tasks, task, scope) {
  return tasks.filter((other) => {
    if (other.id === task.id) return false;
    if (scope === "one" || other.seriesId !== task.seriesId) return true;
    return scope === "following" && other.due < task.due;
  });
}

// One task per due date; copies of a repeating task share a seriesId so they can be found together.
export function createRepeatingTasks(input, repeat) {
  if (repeat.repeats === "none") return [createTask(input)];
  const seriesId = crypto.randomUUID();
  // Steps belong to one due date, so only the first copy gets them.
  return repeatDates(input.due, repeat).map((due, index) => ({ ...createTask({ ...input, due, steps: index === 0 ? input.steps : [] }), seriesId }));
}

// Reminder choices: set times before the due time, plus an optional repeating schedule.
export const REMINDER_OFFSETS = [
  { minutes: 7 * 24 * 60, label: "1 week" },
  { minutes: 2 * 24 * 60, label: "2 days" },
  { minutes: 24 * 60, label: "1 day" },
  { minutes: 3 * 60, label: "3 hours" },
  { minutes: 60, label: "1 hour" },
  { minutes: 30, label: "30 min" },
  { minutes: 15, label: "15 min" },
];

// Reminder levels for a whole import, since nobody chooses reminders one by one for 30+ assignments.
export const REMINDER_LEVELS = [
  { id: "none", label: "No reminders", minutes: [] },
  { id: "light", label: "Light: 1 day before", minutes: [24 * 60] },
  { id: "normal", label: "Normal: 1 day and 1 hour before", minutes: [24 * 60, 60] },
  { id: "heavy", label: "Heavy: 2 days, 1 day, and 1 hour before", minutes: [2 * 24 * 60, 24 * 60, 60] },
];

// Bigger work gets more of a heads-up. Projects are checked first, so "Final Project" counts as a project.
const PROJECT_WORDS = /\b(projects?|essays?|papers?|presentations?|reports?)\b/i;
const EXAM_WORDS = /\b(exams?|midterms?|finals?|quiz(zes)?|tests?)\b/i;

// The reminders an imported task gets at this level, longest notice first.
export function importReminders(name, levelId) {
  const level = REMINDER_LEVELS.find((option) => option.id === levelId);
  if (!level || level.minutes.length === 0) return [];
  const extra = PROJECT_WORDS.test(name) ? [7 * 24 * 60, 2 * 24 * 60] : EXAM_WORDS.test(name) ? [2 * 24 * 60] : [];
  return [...new Set([...extra, ...level.minutes])].sort((a, b) => b - a);
}

// Semester overview: how heavy each week is, so crunch weeks aren't a surprise. Exams and projects
// count as 3 assignments each, and estimated time adds 1 for every 2 hours. Quizzes count as
// ordinary assignments here (unlike for reminders), since weekly reading quizzes would otherwise
// make every week look like finals. Only unfinished tasks count.
const BIG_EXAM_WORDS = /\b(exams?|midterms?|finals?|tests?)\b/i;
const SEMESTER_MIN_WEEKS = 6;
const SEMESTER_MAX_WEEKS = 26;
const BIG_WORK_WEIGHT = 3;
const SEMESTER_LEVELS = [
  { id: "free", label: "Nothing due", below: 0.5 },
  { id: "light", label: "Light", below: 4 },
  { id: "steady", label: "Steady", below: 8 },
  { id: "busy", label: "Busy", below: 12 },
  { id: "very-busy", label: "Very busy", below: Infinity },
];
const BUSIEST_WEEKS = 3;

// How much someone can handle in a week (Settings → Workload) stretches or shrinks the levels.
export const WORKLOAD_KEY = "due-workload";
export const DEFAULT_WORKLOAD = "normal";
export const WORKLOAD_OPTIONS = [
  { id: "less", label: "Less: weeks count as busy sooner", scale: 0.6 },
  { id: "normal", label: "Normal", scale: 1 },
  { id: "more", label: "More: it takes more for a week to be busy", scale: 1.5 },
];

// An exam or project, which counts extra toward how busy a week or day is.
function isBigWork(task) {
  return PROJECT_WORDS.test(task.name) || BIG_EXAM_WORDS.test(task.name);
}

// How much one task adds to a week or day: 3 for an exam or project, 1 otherwise, plus 1 for every
// 2 hours estimated.
// With a grade weight, that decides instead: every 5% counts like one assignment (a 25% exam is 5, a 2%
// quiz is half of one), between 0.5 and 8.
function workloadScore(task) {
  const size = task.weight ? Math.min(Math.max(task.weight / 5, 0.5), 8) : isBigWork(task) ? BIG_WORK_WEIGHT : 1;
  return size + (task.estimateMinutes ?? 0) / 120;
}

// A day only counts as the week's heaviest when something stands out: 3 or more things due, or an
// exam or project.
const HEAVY_DAY_TASKS = 3;

// One entry per week from this week through the last week with work due (at least 6 weeks):
// { start, exams, projects, assignments (each a list of tasks), minutes, score, level, busiest,
//   days (7 of { date, tasks, score }), heaviest (one of days, or null) }.
// Minutes of timed events ({ date, start, end }) in each week, by the week's Sunday. All-day events
// and holidays have no start, so they don't count.
function eventMinutesByWeek(events) {
  const byWeek = new Map();
  for (const event of events) {
    if (!event.start || !event.end || event.end <= event.start) continue;
    const week = startOfWeek(event.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + minutesOf(event.end) - minutesOf(event.start));
  }
  return byWeek;
}

// A usual week's event minutes: the middle of the weeks that have any (mostly the class schedule).
function usualWeekMinutes(weekMinutes) {
  const busyWeeks = weekMinutes.filter((minutes) => minutes > 0).sort((a, b) => a - b);
  if (busyWeeks.length === 0) return 0;
  const middle = Math.floor(busyWeeks.length / 2);
  return busyWeeks.length % 2 ? busyWeeks[middle] : (busyWeeks[middle - 1] + busyWeeks[middle]) / 2;
}

// Extra event time counts once it's at least an hour beyond a usual week, every 2 hours like one
// assignment (the same as a time estimate).
export const EXTRA_EVENT_MINUTES = 60;

export function semesterWeeks(tasks, todayKey, { workload = DEFAULT_WORKLOAD, events = [] } = {}) {
  const { scale } = WORKLOAD_OPTIONS.find((option) => option.id === workload) ?? WORKLOAD_OPTIONS[1];
  const first = startOfWeek(todayKey);
  const minutesByWeek = eventMinutesByWeek(events);
  const ahead = tasks.filter((task) => !task.done && task.due >= first);
  const lastDue = ahead.reduce((latest, task) => (task.due > latest ? task.due : latest), first);
  const count = Math.min(Math.max(Math.floor(daysBetween(first, lastDue) / 7) + 1, SEMESTER_MIN_WEEKS), SEMESTER_MAX_WEEKS);
  const weekStarts = Array.from({ length: count }, (_, index) => addDays(first, index * 7));
  const usual = usualWeekMinutes(weekStarts.map((start) => minutesByWeek.get(start) ?? 0));
  const weeks = weekStarts.map((start) => {
    const end = addDays(start, 6);
    const due = ahead.filter((task) => task.due >= start && task.due <= end);
    const projects = due.filter((task) => PROJECT_WORDS.test(task.name));
    const exams = due.filter((task) => !PROJECT_WORDS.test(task.name) && BIG_EXAM_WORDS.test(task.name));
    const assignments = due.filter((task) => !projects.includes(task) && !exams.includes(task));
    const minutes = due.reduce((total, task) => total + (task.estimateMinutes ?? 0), 0);
    const eventMinutes = minutesByWeek.get(start) ?? 0;
    const beyondUsual = eventMinutes - usual;
    const extraEventMinutes = beyondUsual >= EXTRA_EVENT_MINUTES ? beyondUsual : 0;
    const score = due.reduce((total, task) => total + workloadScore(task), 0) + extraEventMinutes / 120;
    // "Nothing due" stays as it is; the other levels move with the workload choice.
    const level = SEMESTER_LEVELS.find((option) => score < (option.id === "free" ? option.below : option.below * scale));
    const days = weekDays(start).map((date) => {
      const dayTasks = due.filter((task) => task.due === date);
      return { date, tasks: dayTasks, score: dayTasks.reduce((total, task) => total + workloadScore(task), 0) };
    });
    const top = days.reduce((best, day) => (day.score > best.score ? day : best), days[0]);
    const standsOut = top.tasks.length >= HEAVY_DAY_TASKS || top.tasks.some(isBigWork);
    const heaviest = top.score > 0 && standsOut ? top : null;
    return {
      start,
      exams,
      projects,
      assignments,
      minutes,
      eventMinutes,
      extraEventMinutes,
      score,
      level: level.id,
      levelLabel: level.label,
      busiest: false,
      days,
      heaviest,
    };
  });
  const busy = weeks.filter((week) => week.level === "busy" || week.level === "very-busy");
  for (const week of [...busy].sort((a, b) => b.score - a.score).slice(0, BUSIEST_WEEKS)) week.busiest = true;
  return weeks;
}

// "1 week, 2 days, 1 day before"
export function describeReminderTimes(minutes) {
  const labels = minutes.map((value) => REMINDER_OFFSETS.find((offset) => offset.minutes === value)?.label).filter(Boolean);
  return labels.length > 0 ? `${labels.join(", ")} before` : "";
}

export const REPEAT_OPTIONS = [
  { id: "none", label: "Don't repeat" },
  { id: "daily", label: "Once a day at 9 AM until it's due" },
  { id: "every3h", label: "Every 3 hours on the day it's due" },
  { id: "hourly", label: "Every hour on the day it's due" },
];

const REPEAT_STEP_HOURS = { every3h: 3, hourly: 1 };

// Keeps only known reminder choices, so bad saved data can't schedule strange reminders.
function cleanReminders({ reminders, repeat }) {
  const known = new Set(REMINDER_OFFSETS.map((offset) => offset.minutes));
  return {
    reminders: [...new Set(Array.isArray(reminders) ? reminders : [])].filter((minutes) => known.has(minutes)),
    repeat: REPEAT_OPTIONS.some((option) => option.id === repeat) ? repeat : "none",
  };
}

// The moment a task is due. A task with no time is due by the end of its day.
export function dueMoment(task) {
  return new Date(`${task.due}T${task.time || "23:59"}:00`);
}

// When a reminder goes off. "1 day before" or "1 week before" means the same clock time that many
// days earlier, even when clocks change for daylight saving in between; shorter ones ("3 hours
// before") are real hours.
function reminderMoment(moment, minutes) {
  const dayMinutes = 24 * 60;
  if (minutes % dayMinutes !== 0) return moment - minutes * 60_000;
  const date = new Date(moment);
  date.setDate(date.getDate() - minutes / dayMinutes);
  return date.getTime();
}

// Reminder moments (in ms) for a task that fall after `from` and at or before `to`, oldest first.
// Finished tasks and moments at or after the due time never remind.
export function remindersBetween(task, from, to) {
  if (task.done) return [];
  const due = dueMoment(task).getTime();
  const moments = (task.reminders ?? []).map((minutes) => reminderMoment(due, minutes));

  if (task.repeat === "daily") {
    for (let day = toDateKey(new Date(from)); day <= toDateKey(new Date(to)); day = addDays(day, 1)) {
      moments.push(new Date(`${day}T09:00:00`).getTime());
    }
  }
  const stepHours = REPEAT_STEP_HOURS[task.repeat];
  if (stepHours) {
    const startOfDueDay = new Date(`${task.due}T00:00:00`).getTime();
    for (let moment = due - stepHours * 3_600_000; moment >= startOfDueDay; moment -= stepHours * 3_600_000) {
      moments.push(moment);
    }
  }

  return [...new Set(moments)].filter((moment) => moment > from && moment <= to && moment < due).sort((a, b) => a - b);
}

export function hasReminders(task) {
  return (task.reminders ?? []).length > 0 || (task.repeat ?? "none") !== "none";
}

// The body of a reminder: "Due in 15 min", "Due in 3 hours, at 9:00 PM", or "Due tomorrow at 9:00 AM".
export function describeReminder(task, now) {
  const minutesLeft = Math.round((dueMoment(task) - now) / 60_000);
  const todayKey = toDateKey(now);
  if (minutesLeft <= 0) return "Due now";
  if (minutesLeft < 60) return `Due in ${minutesLeft} min`;
  if (task.due === todayKey) {
    if (!task.time) return "Due by the end of today";
    const hours = Math.round(minutesLeft / 60);
    return `Due in ${hours} hour${hours === 1 ? "" : "s"}, at ${formatTime(task.time)}`;
  }
  return `Due ${describeDue(task, todayKey)}`;
}

function isTask(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.course === "string" &&
    typeof value.due === "string" &&
    typeof value.done === "boolean" &&
    (value.time === undefined || typeof value.time === "string") &&
    (value.reminders === undefined || Array.isArray(value.reminders)) &&
    (value.repeat === undefined || typeof value.repeat === "string") &&
    (value.steps === undefined || Array.isArray(value.steps)) &&
    (value.notes === undefined || typeof value.notes === "string") &&
    (value.pinned === undefined || typeof value.pinned === "boolean") &&
    (value.weight === undefined || value.weight === null || typeof value.weight === "number") &&
    (value.seriesId === undefined || typeof value.seriesId === "string") &&
    (value.canvasId === undefined || typeof value.canvasId === "string") &&
    (value.importedOn === undefined || typeof value.importedOn === "string") &&
    (value.estimateMinutes === undefined || typeof value.estimateMinutes === "number") &&
    (value.groupId === undefined || typeof value.groupId === "string") &&
    (value.customColor === undefined || value.customColor === null || Number.isInteger(value.customColor))
  );
}

// Reads tasks from storage. Throws if storage is unavailable or the data is corrupt.
export function loadTasks(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Saved tasks are not a list.");
  // Tasks saved before due times existed have no time; treat them as "any time that day".
  // Tasks saved before reminders existed have none.
  return parsed
    .filter(isTask)
    .map((task) => ({ ...task, time: task.time ?? "", ...cleanReminders(task), estimateMinutes: task.estimateMinutes ?? 0, groupId: task.groupId ?? "", customColor: task.customColor ?? null, steps: cleanSteps(task.steps), notes: task.notes ?? "", pinned: task.pinned === true, weight: cleanWeight(task.weight) }));
}

export function saveTasks(storage, tasks) {
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function minutesOf(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Quick-pick times can be changed in the task form; these are the ones everyone starts with.
export const QUICK_TIMES_KEY = "due-quick-times";
export const DEFAULT_QUICK_TIMES = ["09:00", "12:00", "17:00", "23:59"];
const MAX_QUICK_TIMES = 6;

// Saved quick-pick times, sorted, without repeats or invalid ones, at most 6. Anything unreadable means the defaults.
export function cleanQuickTimes(times) {
  if (!Array.isArray(times)) return [...DEFAULT_QUICK_TIMES];
  const valid = times.filter((time) => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time));
  return [...new Set(valid)].sort().slice(0, MAX_QUICK_TIMES);
}

// "Noon", "9 AM", or "7:30 AM": short labels for the pick buttons.
export function quickPickLabel(time) {
  if (time === "12:00") return "Noon";
  return time.endsWith(":00") ? formatTime(time).replace(/:00(?=\s)/, "") : formatTime(time);
}

// One-tap due times for the task form, from your quick-pick times. For today they depend on the
// current time (skipping times already past or under 30 minutes away); for other days they are your times.
// Each pick is { label, due, time }; time "" means "no time".
export function quickTimePicks(dueKey, now, times = DEFAULT_QUICK_TIMES) {
  const noTime = { label: "No time", due: dueKey, time: "" };
  const todayKey = toDateKey(now);
  if (dueKey !== todayKey) {
    return [...times.map((time) => ({ label: quickPickLabel(time), due: dueKey, time })), noTime];
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const picks = [];

  const inOneHour = Math.ceil((nowMinutes + 60) / 15) * 15;
  if (inOneHour < 24 * 60) {
    picks.push({ label: "In 1 hour", due: todayKey, time: timeFromMinutes(inOneHour) });
  }

  for (const time of times) {
    if (minutesOf(time) >= nowMinutes + 30 && minutesOf(time) > inOneHour) {
      picks.push({ label: time === "23:59" ? "Tonight 11:59 PM" : quickPickLabel(time), due: todayKey, time });
    }
  }

  // Later in the day, offer tomorrow at your first time, and at your last time if it's gone for today.
  const tomorrowKey = addDays(todayKey, 1);
  const [first, last] = [times[0], times.at(-1)];
  if (first && nowMinutes >= 12 * 60) {
    picks.push({ label: `Tomorrow ${quickPickLabel(first)}`, due: tomorrowKey, time: first });
  }
  if (last && last !== first && !picks.some((pick) => pick.time === last)) {
    picks.push({ label: `Tomorrow ${quickPickLabel(last)}`, due: tomorrowKey, time: last });
  }

  return [...picks.slice(0, 4), noTime];
}

// Hours shown in the day timeline: 7 AM through 11 PM, starting earlier if a task is due earlier.
export function timelineHours(dayTasks) {
  const taskHours = dayTasks.filter((task) => task.time).map((task) => Number(task.time.slice(0, 2)));
  const firstHour = Math.min(7, ...taskHours);
  return Array.from({ length: 24 - firstHour }, (_, offset) => firstHour + offset);
}

// The first unfinished task that is still ahead. dayTasks must already be in tasksDueOn order.
// nowTime (HH:MM) is given only for today, so earlier times today count as already passed.
export function nextUpTask(dayTasks, nowTime) {
  return dayTasks.find((task) => !task.done && (!nowTime || !task.time || task.time >= nowTime)) ?? null;
}

// "2h 15m left", "45m left", or "due now" for a time later today.
export function describeTimeLeft(time, nowTime) {
  const minutesLeft = minutesOf(time) - minutesOf(nowTime);
  if (minutesLeft <= 0) return "due now";
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  if (hours === 0) return `${minutes}m left`;
  return minutes === 0 ? `${hours}h left` : `${hours}h ${minutes}m left`;
}

// The scrollable list of times in the task form: every 15 minutes, plus 11:59 PM.
// For today, times that have already passed (or are right now) can't be picked.
export function timeChoices(dueKey, now) {
  const isToday = dueKey === toDateKey(now);
  const nowTime = toTimeKey(now);
  const times = [...Array.from({ length: 96 }, (_, index) => timeFromMinutes(index * 15)), "23:59"];
  return times.map((time) => ({ time, label: formatTime(time), disabled: isToday && time <= nowTime }));
}

// Saving a task for a time earlier today would make it missed right away, so that's refused.
export function pastTimeError(due, time, now) {
  if (!time || due !== toDateKey(now) || time > toTimeKey(now)) return null;
  return "That time has already passed today. Pick a later time or another day.";
}

// Returns an error message if a missed task can't be moved to this date and time, or null.
// Moving it to a time that has already passed would leave it overdue, so that is refused.
export function rescheduleError(due, time, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due ?? "")) return "Pick a new date.";
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "That time isn't valid.";
  const urgency = urgencyOf({ due, time, done: false }, toDateKey(now), toTimeKey(now));
  return urgency === "overdue" ? "Pick a time that hasn't passed yet." : null;
}

// Reads a typed time ("11:59 PM", "9am", "930a", "noon", "21:30") into HH:MM.
// Returns { time } ("" when blank) or { error }. Hours 1-12 need AM or PM, so "8:00" is never guessed.
export function parseTimeInput(text) {
  const cleaned = text.trim().toLowerCase().replace(/[\s.]/g, "");
  if (!cleaned) return { time: "" };
  if (cleaned === "noon") return { time: "12:00" };

  const match = cleaned.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/);
  if (!match) return { error: "Type a time like 11:59 PM." };
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3]?.[0];
  if (minutes > 59) return { error: "Type a time like 11:59 PM." };

  if (period) {
    if (hours < 1 || hours > 12) return { error: "Type a time like 11:59 PM." };
    hours = (hours % 12) + (period === "p" ? 12 : 0);
  } else if (hours > 23) {
    return { error: "Type a time like 11:59 PM." };
  } else if (hours >= 1 && hours <= 12) {
    return { error: `Add AM or PM, like ${match[1]}:${match[2] ?? "00"} AM.` };
  }
  return { time: timeFromMinutes(hours * 60 + minutes) };
}

// Accounts. These saved values follow you to any computer you sign in on. Things that belong to one
// computer stay out: the Canvas link (it works like a password), and small reminders like the morning card.
// Changes to Google events that only apply inside Due Next (Google Calendar itself never changes):
// { [entry id]: { hidden: true } or { date, start, end } }. Entry ids name one day of one event,
// so changing a class changes just that meeting.
export const GOOGLE_CHANGES_KEY = "due-google-changes";

// The Google entries as Due Next shows them: hidden ones left out, moved ones at their new time
// (with `original` holding Google's own date and times).
export function applyGoogleChanges(entries, changes) {
  return entries.flatMap((entry) => {
    const change = changes[entry.id];
    if (!change) return [entry];
    if (change.hidden) return [];
    return [{ ...entry, date: change.date, start: change.start, end: change.end, original: { date: entry.date, start: entry.start, end: entry.end } }];
  });
}

// The changes after moving or hiding one entry (`update` is { hidden: true }, { date, start, end },
// or null to put it back). Moving it back to Google's own time forgets the change.
export function changeGoogleEntry(changes, entry, update) {
  const next = { ...changes };
  const google = entry.original ?? entry;
  const backToGoogle = update && !update.hidden && update.date === google.date && update.start === google.start && update.end === google.end;
  if (!update || backToGoogle) delete next[entry.id];
  else next[entry.id] = update.hidden ? { hidden: true } : { date: update.date, start: update.start, end: update.end };
  return next;
}

// Remembers in your account that you connected Google Calendar (and with which Google account),
// so other computers can offer to connect too. Google's pass itself is never saved to the account.
export const GOOGLE_WANTED_KEY = "due-google-wanted";

// The last copy of your Google events, saved to your account so they stay on the calendar after
// Google's hour-long pass runs out, on every computer. Only what the calendar shows is kept (name,
// day, time, color), never descriptions, guests, or links. As { updatedAt, start, end, entries }.
export const GOOGLE_SAVED_KEY = "due-google-saved-v1";
// After this long, the Update button's "Updated … ago" turns a color as a gentle reminder.
export const GOOGLE_STALE_MS = 24 * 60 * 60 * 1000;

// "Updated just now", "Updated 5 min ago", "Updated 3 hr ago", "Updated 2 days ago", and whether
// it's been long enough to remind you.
export function describeGoogleUpdate(updatedAt, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60_000));
  const stale = now - updatedAt >= GOOGLE_STALE_MS;
  if (minutes < 1) return { text: "Updated just now", stale };
  if (minutes < 60) return { text: `Updated ${minutes} min ago`, stale };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { text: `Updated ${hours} hr ago`, stale };
  const days = Math.floor(hours / 24);
  return { text: `Updated ${days} day${days === 1 ? "" : "s"} ago`, stale };
}

// Of two saved copies of your Google events (as saved text), the one updated last.
function newerGoogleSaved(first, second) {
  const updatedAt = (text) => {
    try {
      return Number(JSON.parse(text)?.updatedAt) || 0;
    } catch {
      return 0;
    }
  };
  return updatedAt(second) > updatedAt(first) ? second : first;
}

export const SYNCED_KEYS = [
  STORAGE_KEY,
  EVENTS_KEY,
  EVENT_REMINDER_KEY,
  TRAVEL_MODE_KEY,
  WORKLOAD_KEY,
  GOOGLE_WANTED_KEY,
  GOOGLE_CHANGES_KEY,
  GOOGLE_SAVED_KEY,
  GROUPS_KEY,
  PROGRESS_KEY,
  PLAN_KEY,
  QUICK_TIMES_KEY,
  HOLIDAYS_KEY,
  DARK_KEY,
  FINALS_KEY,
  "due-celebrate",
  "due-theme",
  "due-background",
];

// The synced values that are saved in this browser, as { key: text }.
export function syncedData(storage) {
  const data = {};
  for (const key of SYNCED_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
}

// A backup of everything saved to your account (tasks, steps, events, groups, progress, settings) as
// one readable file: { app, version, savedAt, data: { key: value } }. Values that are JSON are kept
// as JSON so the file is easy to read; anything else is kept as text.
export function backupFile(storage, now = new Date()) {
  const data = {};
  for (const [key, text] of Object.entries(syncedData(storage))) {
    try {
      data[key] = JSON.parse(text);
    } catch {
      data[key] = text;
    }
  }
  const backup = { app: "Due Next", version: 1, savedAt: now.toISOString(), data };
  return { name: `due-next-backup-${toDateKey(now)}.json`, text: JSON.stringify(backup, null, 2) };
}

function parseList(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeById(first, second) {
  const ids = new Set(first.map((item) => item.id));
  return [...first, ...second.filter((item) => !ids.has(item.id))];
}

// Combines this browser's saved data with the account's, for signing in on a browser that already
// has its own tasks. Tasks, events, and groups from both are kept (the account's copy wins when both have the
// same one); for everything else, the account's setting wins.
export function mergeSyncedData(accountValues, localValues) {
  const merged = { ...localValues, ...accountValues };
  for (const key of [STORAGE_KEY, GROUPS_KEY, EVENTS_KEY]) {
    if (accountValues[key] === undefined || localValues[key] === undefined) continue;
    merged[key] = JSON.stringify(mergeById(parseList(accountValues[key]), parseList(localValues[key])));
  }
  if (accountValues[GOOGLE_SAVED_KEY] !== undefined && localValues[GOOGLE_SAVED_KEY] !== undefined) {
    merged[GOOGLE_SAVED_KEY] = newerGoogleSaved(accountValues[GOOGLE_SAVED_KEY], localValues[GOOGLE_SAVED_KEY]);
  }
  return merged;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

// Usernames ignore capitals and spaces around them, so "Olivia " and "olivia" are the same account.
export function normalizeUsername(text) {
  return text.trim().toLowerCase();
}

// What's wrong with a username someone wants to pick, or "" if it's fine.
// Usernames never contain @, so the sign-in box can tell a username from an email.
export function usernameError(text) {
  const username = normalizeUsername(text);
  if (!username) return "Pick a username.";
  if (!USERNAME_PATTERN.test(username)) return "Usernames can only use letters, numbers, and _.";
  if (username.length < 3 || username.length > 20) return "Use 3 to 20 characters for your username.";
  return "";
}

// What's wrong with the sign-in form, or "" if it's ready to send.
export function signInError({ login, password }) {
  if (!login.trim()) return "Type your username or email.";
  if (!password) return "Type your password.";
  return "";
}

// What a new password still needs, or "" if it's strong enough. Signing in never checks this, so
// passwords made before these rules keep working.
export function passwordStrengthError(password) {
  const missing = [];
  if (!/[A-Z]/.test(password)) missing.push("an uppercase letter");
  if (!/[0-9]/.test(password)) missing.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("a symbol like ! or #");
  if (password.length < 6) return "Use at least 6 characters for your password, with an uppercase letter, a number, and a symbol.";
  if (missing.length === 0) return "";
  const list = missing.length < 3 ? missing.join(" and ") : `${missing.slice(0, -1).join(", ")}, and ${missing.at(-1)}`;
  return `Your password also needs ${list}.`;
}

// Step 1 of creating an account: the username and password.
export function newLoginError({ username, password }) {
  return usernameError(username) || passwordStrengthError(password);
}

// Changing your password in Settings → Account: what's wrong with what was typed, or "" if it's fine.
export function passwordChangeError({ current, next, again }) {
  if (!current) return "Type your current password.";
  const weak = passwordStrengthError(next);
  if (weak) return weak;
  if (next !== again) return "The new passwords don't match.";
  if (next === current) return "That's the same as your current password. Pick a new one.";
  return "";
}

// Step 2 of creating an account: the email and first and last name.
export function profileError({ email, firstName, lastName }) {
  const trimmed = email.trim();
  if (!trimmed) return "Type your email.";
  if (!EMAIL_PATTERN.test(trimmed)) return "That email doesn't look right. It needs an @.";
  if (!firstName.trim()) return "Type your first name.";
  if (!lastName.trim()) return "Type your last name.";
  return "";
}

const WRONG_SIGN_IN = "That username or password isn't right. Try again, or use Forgot password.";
const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": WRONG_SIGN_IN,
  "auth/wrong-password": WRONG_SIGN_IN,
  "auth/user-not-found": "There's no account with that email yet. Create one instead.",
  "auth/email-already-in-use": "There's already an account with that email. Sign in instead.",
  "auth/invalid-email": "That email doesn't look right.",
  "auth/weak-password": "Use at least 6 characters for your password.",
  "auth/too-many-requests": "Too many tries. Wait a few minutes, then try again.",
  "auth/network-request-failed": "Couldn't reach Due Next. Check your internet and try again.",
  "due/username-not-found": "There's no account with that username. Check the spelling, or create an account.",
  "due/username-taken": "That username is taken. Try another one.",
  "auth/invalid-verification-code": "That code isn't right. Type the newest 6-digit code from your authenticator app.",
  "auth/requires-recent-login": "For safety, sign out and back in, then try again.",
  "auth/unverified-email": "Verify your email first, then try again.",
  "auth/operation-not-allowed": "Two-step sign-in isn't switched on for Due Next yet.",
  "auth/admin-restricted-operation": "Two-step sign-in isn't switched on for Due Next yet.",
  "due/needs-code": "Type the 6-digit code from your authenticator app too.",
};

// Two-step sign-in codes from an authenticator app are 6 digits; spaces (as some apps show them) are ignored.
export function cleanTwoStepCode(text) {
  return text.replace(/\s+/g, "");
}

// What's wrong with a typed two-step code, or "" if it looks right.
export function twoStepCodeError(text) {
  const code = cleanTwoStepCode(text);
  if (!code) return "Type the 6-digit code from your authenticator app.";
  if (!/^\d{6}$/.test(code)) return "The code is 6 digits, like 123 456.";
  return "";
}

// Sign-in error codes (Firebase's, plus Due Next's own "due/" ones), in plain words.
export function authErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] ?? "Something went wrong. Try again in a moment.";
}

// Google Calendar: events are only shown, never changed. A Google event becomes one entry per day
// it covers, so each day can list its own: { id, sourceId, name, date, start, end, color }, with local
// "HH:MM" times, or start and end "" for an all-day event. sourceId is the event's original calendar
// id, which for a Canvas feed is the same id Canvas import saves. Cancelled and declined events are left out.
export function googleEventDays(event, color = "") {
  if (event.status === "cancelled") return [];
  if (event.attendees?.some((person) => person.self && person.responseStatus === "declined")) return [];
  const name = event.summary?.trim() || "(No title)";
  const entry = (date, start, end) => ({ id: `${event.id}:${date}`, sourceId: event.iCalUID ?? "", name, date, start, end, color });
  const days = [];
  if (event.start?.date) {
    const end = event.end?.date ?? addDays(event.start.date, 1);
    for (let date = event.start.date; date < end; date = addDays(date, 1)) days.push(entry(date, "", ""));
    return days;
  }
  if (!event.start?.dateTime) return [];
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end?.dateTime ?? event.start.dateTime);
  const firstDay = toDateKey(start);
  // An event ending exactly at midnight doesn't spill into the next day.
  const lastDay = toTimeKey(end) === "00:00" && end > start ? addDays(toDateKey(end), -1) : toDateKey(end);
  for (let date = firstDay; date <= lastDay; date = addDays(date, 1)) {
    const startTime = date === firstDay ? toTimeKey(start) : "00:00";
    const endTime = date === toDateKey(end) ? toTimeKey(end) : "23:59";
    // A day an event covers from start to end counts as all day, like Google shows it.
    const wholeDay = startTime === "00:00" && endTime === "23:59";
    days.push(wholeDay ? entry(date, "", "") : entry(date, startTime, endTime));
  }
  return days;
}

// "HW8 [math_220_120268_262973]" and "hw8" are the same name: Canvas's class tag and capitals don't count.
function comparableName(name) {
  return name.replace(/\s*\[[^\]]*\]$/, "").trim().replace(/\s+/g, " ").toLowerCase();
}

// An existing task that's very likely the same one: due the same day, with the same name ignoring
// capitals, extra spaces, and a trailing Canvas tag like "[math_220_120268]". Used to ask before
// adding a second copy, for example the same exam from a syllabus and from Canvas.
export function findDuplicateTask(tasks, { name, due }) {
  const key = comparableName(name);
  return tasks.find((task) => task.due === due && comparableName(task.name) === key) ?? null;
}

// The same for events: same name on the same day.
export function findDuplicateEvent(events, { name, date }) {
  const key = comparableName(name);
  return events.find((event) => event.date === date && comparableName(event.name) === key) ?? null;
}

// Leaves out Google events that are already Due Next tasks, so nothing shows twice: the same Canvas
// assignment (by its Canvas id), or an event with the same name on the day the task is due.
export function eventsNotInTasks(entries, tasks) {
  const canvasIds = new Set(tasks.map((task) => task.canvasId).filter(Boolean));
  const dueNames = new Set(tasks.map((task) => `${task.due}|${comparableName(task.name)}`));
  return entries.filter((entry) => !canvasIds.has(entry.sourceId) && !dueNames.has(`${entry.date}|${comparableName(entry.name)}`));
}

function minutesOfDay(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Side-by-side columns for timed events that overlap, like Google's day view. Returns
// [{ entry, column, columns }]: events that overlap share a group and split its width.
export function eventColumns(timedEntries) {
  const sorted = [...timedEntries].sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
  const placed = [];
  let group = [];
  let groupEnd = -1;
  let columnEnds = [];
  const closeGroup = () => {
    for (const item of group) item.columns = columnEnds.length;
    group = [];
    columnEnds = [];
  };
  for (const entry of sorted) {
    const start = minutesOfDay(entry.start);
    const end = Math.max(minutesOfDay(entry.end), start + 1);
    if (start >= groupEnd) closeGroup();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) column = columnEnds.push(end) - 1;
    else columnEnds[column] = end;
    const item = { entry, column, columns: 1 };
    group.push(item);
    placed.push(item);
    groupEnd = Math.max(groupEnd, end);
  }
  closeGroup();
  return placed;
}

// The Google events on one day: all-day ones first, then by start time.
export function googleEventsOn(entries, dateKey) {
  return entries
    .filter((entry) => entry.date === dateKey)
    .sort((a, b) => Boolean(b.start === "") - Boolean(a.start === "") || a.start.localeCompare(b.start) || a.name.localeCompare(b.name));
}
