import {
  applyDarkMode,
  changePassword,
  currentAccountEmail,
  currentAccountName,
  finishTwoStep,
  sendPasswordResetToMe,
  signOutOfDueNext,
  startTwoStep,
  turnOffTwoStep,
  twoStepIsOn,
} from "./account.js";
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  googleCalendarEntries,
  googleCalendarStatus,
  showGoogleRange,
  startGoogleCalendar,
} from "./google-calendar.js";
import { currentPosition, pickedPlace, suggestPlaces, tripMinutes } from "./travel.js";
import {
  addDays,
  addMonths,
  addTimerMinutes,
  COURSE_COLOR_COUNT,
  courseColorIndex,
  createGroup,
  cleanQuickTimes,
  createRepeatingTasks,
  createTask,
  MAX_STEPS,
  suggestSteps,
  searchEverything,
  firstLink,
  notesParts,
  filterOptions,
  matchesFilter,
  compareWeight,
  nextStepDate,
  stepProgress,
  stepsError,
  stepsOn,
  stepsToDo,
  createEvent,
  cleanEventReminder,
  DEFAULT_EVENT_REMINDER,
  describeEventReminder,
  describeGoogleUpdate,
  EVENT_REMINDER_KEY,
  EVENT_REMINDER_OPTIONS,
  eventReminderDue,
  eventReminderOption,
  cleanTravelMode,
  DEFAULT_TRAVEL_MODE,
  describeLeaveReminder,
  hasTravel,
  needsTravelCheck,
  timeToLeave,
  TRAVEL_MODE_KEY,
  TRAVEL_MODES,
  travelModeOf,
  eventEntries,
  semesterWeeks,
  authErrorMessage,
  passwordChangeError,
  backupFile,
  twoStepCodeError,
  findDuplicateEvent,
  findDuplicateTask,
  DEFAULT_WORKLOAD,
  WORKLOAD_KEY,
  WORKLOAD_OPTIONS,
  applyGoogleChanges,
  changeGoogleEntry,
  GOOGLE_CHANGES_KEY,
  endsNextDay,
  loadEvents,
  saveEvents,
  updateEvent,
  validateEvent,
  createTimer,
  deleteFromSeries,
  findDatesInText,
  FOCUS_LENGTHS,
  formatCountdown,
  formatDuration,
  formatMinutes,
  freeWindows,
  describeFreeWindows,
  PLAN_DAY_END,
  PLAN_DAY_START,
  PLAN_PERIODS,
  guessCourse,
  gradeWeights,
  parseGradeBreakdown,
  markPastAsDone,
  newCanvasEvents,
  nextGroupColor,
  newTextEvents,
  settleImportedCanvasTasks,
  parseCanvasCalendar,
  parseFreeTime,
  describeDue,
  describeLeaves,
  describeReminder,
  describeReminderTimes,
  describeStart,
  ESTIMATE_OPTIONS,
  describeTimeLeft,
  formatTime,
  googleEventsOn,
  eventsNotInTasks,
  eventColumns,
  groupNameError,
  groupTasks,
  hasReminders,
  importReminders,
  loadGroups,
  loadProgress,
  loadTasks,
  monthGrid,
  morningSummary,
  sundayPlan,
  pinnedTasks,
  HOLIDAYS_KEY,
  cleanDarkSetting,
  DARK_KEY,
  describeFinalsCountdown,
  FINALS_KEY,
  guessFinalsDate,
  holidaysOn,
  createRepeatingEvents,
  deleteEventFromSeries,
  nextUpTask,
  parseTimeInput,
  pastTimeError,
  pauseTimer,
  PLAN_KEY,
  planDay,
  POMODORO_BREAK_MINUTES,
  POMODORO_FOCUS_MINUTES,
  QUICK_TIMES_KEY,
  quickPickLabel,
  quickTimePicks,
  REMINDER_LEVELS,
  REMINDER_OFFSETS,
  remindersBetween,
  REPEAT_OPTIONS,
  repeatError,
  recordCompletion,
  recordFocus,
  removeCompletion,
  rescheduleError,
  resumeTimer,
  saveGroups,
  saveProgress,
  saveTasks,
  startOfMonth,
  startOfWeek,
  streakInfo,
  taskColorIndex,
  tasksDueOn,
  understandMessage,
  tasksToStart,
  upcomingStarts,
  TASK_REPEAT_OPTIONS,
  timeChoices,
  timelineHours,
  timerMinutesDone,
  timerRemaining,
  toDateKey,
  toTimeKey,
  updateTask,
  urgencyOf,
  validateTask,
  weekDays,
  weekProgress,
} from "./tasks.js";

const periodLabel = document.getElementById("period-label");
const weekContainer = document.getElementById("week");
const agendaContainer = document.getElementById("agenda");
const semesterContainer = document.getElementById("semester");
const semesterPage = document.getElementById("semester-page");
const modeTabs = [...document.querySelectorAll("[data-mode-tab]")];
const monthContainer = document.getElementById("month");
const dayView = document.getElementById("day-view");
const dayContent = document.getElementById("day-content");
const viewSelect = document.getElementById("view-select");
const googleBanner = document.getElementById("google-banner");
const googleBannerText = document.getElementById("google-banner-text");
const googleBannerButton = document.getElementById("google-banner-refresh");
const googleBannerNotNow = document.getElementById("google-banner-not-now");
// "Not now" on the offer to connect lasts until this tab closes.
const GOOGLE_NOT_NOW_KEY = "due-google-not-now";
const previousButton = document.getElementById("previous-period");
const nextButton = document.getElementById("next-period");
const VIEW_SETTINGS_KEY = "due-view";
const overdueSection = document.getElementById("overdue");
const overdueList = document.getElementById("overdue-list");
const overdueCount = document.getElementById("overdue-count");
const overdueEmpty = document.getElementById("overdue-empty");
const OVERDUE_OPEN_KEY = "due-overdue-open";
const THEME_KEY = "due-theme";
const BACKGROUND_KEY = "due-background";
// Grid was replaced by Soft glow (Olivia found it confusing); move anyone who chose Grid over.
try {
  if (localStorage.getItem(BACKGROUND_KEY) === "grid") localStorage.setItem(BACKGROUND_KEY, "glow");
} catch {
  // It still shows as Soft glow; it just isn't saved yet.
}
const settingsPanel = document.getElementById("settings-panel");
const themeOptions = [...document.querySelectorAll("[data-theme-choice]")];
const todayList = document.getElementById("today-list");
const todaySummary = document.getElementById("today-summary");
const todayEmpty = document.getElementById("today-empty");
const planPanel = document.getElementById("plan-panel");
const planButton = document.getElementById("open-plan");
const startByList = document.getElementById("start-by-list");
const startByEmpty = document.getElementById("start-by-empty");
const hint = document.getElementById("hint");
const toast = document.getElementById("toast");
const storageError = document.getElementById("storage-error");

const addDialog = document.getElementById("add-dialog");
const addDialogTitle = document.getElementById("add-dialog-title");
const addSubmitButton = document.getElementById("add-submit");
const focusFromEditButton = document.getElementById("focus-from-edit");
const form = document.getElementById("add-form");
const nameInput = document.getElementById("task-name");
const courseInput = document.getElementById("task-course");
const dueInput = document.getElementById("task-due");
const formMessage = document.getElementById("form-message");
const quickPicksLabel = document.getElementById("quick-picks-label");
const quickPicksList = document.getElementById("quick-picks-list");
const reminderOptions = document.getElementById("reminder-options");
const repeatSelect = document.getElementById("task-repeat");
const repeatsSection = document.getElementById("task-repeats-section");
const repeatsSelect = document.getElementById("task-repeats");
const repeatDetails = document.getElementById("repeat-details");
const repeatWeekdays = document.getElementById("repeat-weekdays");
const untilInput = document.getElementById("task-until");
const repeatsSummary = document.getElementById("repeats-summary");
const remindersSection = document.getElementById("reminders-section");
const remindersSummary = document.getElementById("reminders-summary");
const weightSection = document.getElementById("weight-section");
const weightInput = document.getElementById("task-weight");
const notesSection = document.getElementById("notes-section");
const notesInput = document.getElementById("task-notes");
const notesLinks = document.getElementById("notes-links");
const stepsSection = document.getElementById("steps-section");
const stepsSummary = document.getElementById("steps-summary");
const stepRows = document.getElementById("step-rows");
const addStepButton = document.getElementById("add-step");
const suggestStepsButton = document.getElementById("suggest-steps");
const groupSection = document.getElementById("group-section");
const groupSummary = document.getElementById("group-summary");
const groupOptions = document.getElementById("group-options");
const groupMessage = document.getElementById("group-message");
const newGroupName = document.getElementById("new-group-name");
const newGroupColors = document.getElementById("new-group-colors");
const groupLegend = document.getElementById("group-legend");
const taskColorOptions = document.getElementById("task-color");
const estimateSection = document.getElementById("estimate-section");
const estimateSelect = document.getElementById("estimate-select");
const estimateStart = document.getElementById("estimate-start");

const notifyBanner = document.getElementById("notify-banner");
const notifyText = document.getElementById("notify-text");
const notifyButton = document.getElementById("notify-enable");
const reminderAlerts = document.getElementById("reminder-alerts");

const missedDialog = document.getElementById("missed-dialog");
const missedProgress = document.getElementById("missed-progress");
const missedTitle = document.getElementById("missed-title");
const missedDetails = document.getElementById("missed-details");
const missedPicks = document.getElementById("missed-picks");
const missedForm = document.getElementById("missed-form");
const missedDueInput = document.getElementById("missed-due");
const missedMessage = document.getElementById("missed-message");
const missedLaterButton = document.getElementById("missed-later");
const missedAllDoneButton = document.getElementById("missed-all-done");

let tasks = [];
let events = [];
// "calendar" or "semester", switched by the tabs next to the name. It always opens on the calendar.
let mode = "calendar";
// Google events moved or hidden inside Due Next only (see applyGoogleChanges).
let googleChanges = {};
// The Google entries on screen, by id, so a drag or click can find the one it's on.
const googleEntryById = new Map();
let groups = [];
// Your own quick-pick times, editable in the task form.
let quickTimes = [];
let progress = { sessions: [], completions: [] };
// Today's plan: { date, freeText, windows, blocks, unscheduled, skippedIds }, or null.
let dayPlan = null;
// The date being looked at: the day in day view, or any day of the week or month in those views.
let visibleDate = toDateKey(new Date());
let view = "week";
let dayLayout = "timeline";
// Set when the day view should scroll to the current hour (on opening it or changing day),
// but not on the every-minute refresh, which keeps the user's scroll position.
let scrollDayToStart = true;
let toastTimer;
// Missed tasks waiting in the reschedule pop-up, first one showing.
let missedQueue = [];
let missedTotal = 0;
let missedSingle = false;
// The task or event being changed in the form, or null when the form is adding a new one.
let editingTaskId = null;
// The steps in the open task form, changed in place until Save.
let formSteps = [];
let editingEventId = null;
// Whether the form is adding a "task" (due by a time) or an "event" (happens at a time).
let formKind = "task";

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function formatDay(dateKey, options) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, options);
}

// "Tuesday, Oct 27 at 9:00 AM"
function formatWhen(due, time) {
  const day = formatDay(due, { weekday: "long", month: "short", day: "numeric" });
  return time ? `${day} at ${formatTime(time)}` : day;
}

function formatHour(hour) {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: "numeric" });
}

// "9:00 AM · CS 124 · ↻ · 🔔" (↻ marks a repeating task); "Anytime" stands in for a missing time where a list mixes timed and untimed tasks.
function taskDetails(task, { anytimeLabel = false } = {}) {
  const time = formatTime(task.time) || (anytimeLabel ? "Anytime" : "");
  const repeating = task.seriesId ? "↻" : "";
  return [time, task.course, repeating, hasReminders(task) && !task.done ? "🔔" : ""].filter(Boolean).join(" · ");
}

function showStorageError(message) {
  storageError.textContent = message;
  storageError.hidden = false;
}

function loadGoogleChanges() {
  try {
    const saved = JSON.parse(localStorage.getItem(GOOGLE_CHANGES_KEY) ?? "{}");
    googleChanges = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    googleChanges = {};
  }
}

function persistGoogleChanges() {
  try {
    localStorage.setItem(GOOGLE_CHANGES_KEY, JSON.stringify(googleChanges));
  } catch {
    showStorageError("Couldn't save your changes to Google events in this browser.");
  }
}

function persistEvents() {
  try {
    saveEvents(localStorage, events);
  } catch {
    showStorageError("Couldn't save your events in this browser. Changes will be lost when you close the page.");
  }
}

function persist() {
  try {
    saveTasks(localStorage, tasks);
  } catch {
    showStorageError("Couldn't save your tasks in this browser. Changes will be lost when you close the page.");
  }
}

// Longer messages (like why a trip couldn't be worked out) can stay up longer to be read.
// `undo` adds an Undo button, and keeps the message up long enough to use it.
function showToast(text, { seconds = 2.6, undo = null } = {}) {
  toast.textContent = text;
  toast.classList.toggle("has-action", Boolean(undo));
  if (undo) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast-undo";
    button.textContent = "Undo";
    button.addEventListener("click", () => {
      undo();
      showToast("Undone.");
    });
    toast.append(" ", button);
  }
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), (undo ? Math.max(seconds, 10) : seconds) * 1000);
}

function persistProgress() {
  try {
    saveProgress(localStorage, progress);
  } catch {
    // The task itself is saved; only its place in the progress numbers is lost.
  }
}

// Checking a task off counts toward progress and streaks; unchecking takes it back.
function creditCompletion(task) {
  recordCompletion(progress, task.id, toDateKey(new Date()));
  persistProgress();
}

function setDone(task, done) {
  task.done = done;
  if (task.done) {
    creditCompletion(task);
  } else {
    removeCompletion(progress, task.id);
    persistProgress();
  }
  persist();
  render();
}

// A little celebration: confetti bursts from the circle that was clicked. Short, never in the way of
// a click, off in Settings → Look → Celebrations, and skipped when the computer asks for less motion.
const CELEBRATE_KEY = "due-celebrate";
const CONFETTI_COLORS = ["--c0-edge", "--c1-edge", "--c2-edge", "--c3-edge", "--c4-edge", "--c5-edge", "--accent"];
const CONFETTI_MS = 1100;

function celebrationsOn() {
  try {
    return localStorage.getItem(CELEBRATE_KEY) !== "off";
  } catch {
    return true;
  }
}

function celebrate(click, { pieces = 26 } = {}) {
  if (!celebrationsOn() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // From where the circle was clicked, or the middle of the screen (keyboard, no position).
  const x = click?.clientX || window.innerWidth / 2;
  const y = click?.clientY || window.innerHeight / 2;
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  const styles = getComputedStyle(document.documentElement);
  for (let index = 0; index < pieces; index++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = styles.getPropertyValue(CONFETTI_COLORS[index % CONFETTI_COLORS.length]).trim();
    layer.append(piece);
    // Up and out in a fan, then falling a little as it fades.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const distance = 50 + Math.random() * 70;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    piece.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 40}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: CONFETTI_MS, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
    );
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), CONFETTI_MS + 100);
}

// Every check-off and delete comes with Undo, in case of a wrong click.
function toggleDone(task, click) {
  setDone(task, !task.done);
  if (task.done) celebrate(click);
  showToast(task.done ? `Checked off “${task.name}”.` : `“${task.name}” is back on your list.`, {
    undo: () => setDone(task, !task.done),
  });
}

// One step of a big task, on its own day: the circle checks off just the step, and the name opens
// the task with its steps showing.
function renderStepChip(task, step, { late = false } = {}) {
  const item = document.createElement("li");
  item.className = `chip step-chip${step.done ? " done" : ""}`;
  item.dataset.stepOf = task.id;
  const colorIndex = taskColorIndex(task, groups);
  if (colorIndex >= 0) item.dataset.color = String(colorIndex);

  const checkButton = document.createElement("button");
  checkButton.type = "button";
  checkButton.className = "chip-check";
  checkButton.setAttribute("aria-pressed", String(step.done));
  checkButton.setAttribute("aria-label", `${step.done ? "Uncheck" : "Check off"} ${step.name}, a step of ${task.name}`);
  checkButton.addEventListener("click", (click) => toggleStep(task, step, click));
  const check = document.createElement("span");
  check.className = "check";
  check.setAttribute("aria-hidden", "true");
  checkButton.append(check);

  const open = document.createElement("button");
  open.type = "button";
  open.className = "chip-open";
  open.setAttribute("aria-label", `Change ${task.name} and its steps`);
  open.addEventListener("click", () => openEditDialog(task, { showSteps: true }));
  const text = document.createElement("span");
  text.className = "chip-text";
  const name = document.createElement("span");
  name.className = "chip-name";
  name.textContent = step.name;
  const meta = document.createElement("span");
  meta.className = "chip-meta";
  const from = late ? ` · from ${formatDay(step.date, { weekday: "short" })}` : "";
  meta.textContent = `Step of ${task.name}${from}`;
  text.append(name, meta);
  open.append(text);
  item.append(checkButton, open);
  return item;
}

function toggleStep(task, step, click) {
  const flip = () => {
    step.done = !step.done;
    persist();
    render();
  };
  flip();
  if (step.done) celebrate(click, { pieces: 14 });
  showToast(step.done ? `Checked off “${step.name}” · ${task.name}: ${stepProgress(task)}.` : `“${step.name}” is back on your list.`, {
    undo: flip,
  });
}

// Search: type part of a name, pick a match, and the calendar jumps to its day with it highlighted.
const searchBar = document.getElementById("search-bar");
const searchPanel = document.getElementById("search-panel");
const searchInput = document.getElementById("search-input");
const searchHint = document.getElementById("search-hint");
const searchResults = document.getElementById("search-results");
const SEARCH_HIGHLIGHT_MS = 2500;

function searchableEvents() {
  const google = applyGoogleChanges(eventsNotInTasks(googleCalendarEntries(), tasks), googleChanges);
  return [...google, ...eventEntries(events, groups)];
}

function describeFound(item) {
  const when = item.time ? formatWhen(item.date, item.time) : formatDay(item.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const kind = { task: "Task", step: `Step of ${item.detail}`, event: "Event" }[item.kind];
  return [kind, item.kind === "task" ? item.detail : "", when].filter(Boolean).join(" · ");
}

function renderSearch() {
  const text = searchInput.value.trim();
  const found = searchEverything(text, { tasks, events: searchableEvents() }, toDateKey(new Date()));
  searchHint.textContent = !text
    ? "Type part of a name or class, like HW10 or MATH 220."
    : found.length === 0
      ? `Nothing matches “${text}”.`
      : "";
  searchResults.replaceChildren(
    ...found.map((item) => {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      const name = document.createElement("span");
      name.className = "search-result-name";
      name.textContent = item.name;
      const detail = document.createElement("span");
      detail.className = "search-result-detail";
      detail.textContent = describeFound(item);
      button.append(name, detail);
      button.addEventListener("click", () => showFound(item));
      row.append(button);
      return row;
    }),
  );
}

// Jumps to the match's day and briefly highlights it, so your eye lands on it.
function closeSearch() {
  searchPanel.hidden = true;
}

function showFound(item) {
  closeSearch();
  searchInput.value = "";
  searchInput.blur();
  if (mode !== "calendar") showMode("calendar");
  showDate(item.date);
  const selector =
    item.kind === "task"
      ? `[data-task-id="${CSS.escape(item.taskId)}"]`
      : item.kind === "step"
        ? `.step-chip[data-step-of="${CSS.escape(item.taskId)}"]`
        : `[data-entry-id="${CSS.escape(item.id)}"]`;
  const candidates = [...document.querySelectorAll(`.calendar-area ${selector}, main ${selector}`)].filter(
    (element) => !element.closest("#today-list, #start-by-list, #overdue") && (item.kind !== "step" || element.querySelector(".chip-name")?.textContent === item.name),
  );
  const target = candidates[0];
  if (!target) return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.classList.add("search-found");
  setTimeout(() => target.classList.remove("search-found"), SEARCH_HIGHLIGHT_MS);
}

function openSearch() {
  renderSearch();
  searchPanel.hidden = false;
}

searchInput.addEventListener("focus", openSearch);
searchInput.addEventListener("click", openSearch);
searchInput.addEventListener("input", openSearch);
// Return picks the first match; Escape closes the matches.
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSearch();
    searchInput.blur();
  }
  if (event.key !== "Enter") return;
  event.preventDefault();
  searchResults.querySelector("button")?.click();
});
// Clicking anywhere else closes the matches.
document.addEventListener("pointerdown", (event) => {
  if (!searchBar.contains(event.target)) closeSearch();
});

// Deleting a copy of a repeating task first asks which copies to delete.
const deleteDialog = document.getElementById("delete-dialog");
let taskToDelete = null;

function deleteTask(task) {
  if (task.seriesId) {
    taskToDelete = task;
    document.getElementById("delete-title").textContent = `Delete “${task.name}”`;
    document.getElementById("delete-details").textContent = "This task repeats. Which ones should be deleted?";
    deleteDialog.returnValue = "cancel";
    deleteDialog.showModal();
    return;
  }
  tasks = tasks.filter((other) => other.id !== task.id);
  persist();
  render();
  showToast(`Deleted “${task.name}”.`, { undo: () => restoreTasks([task]) });
}

// Puts deleted tasks back (any that aren't already back), with their steps and progress.
function restoreTasks(deleted) {
  const ids = new Set(tasks.map((task) => task.id));
  tasks.push(...deleted.filter((task) => !ids.has(task.id)));
  persist();
  render();
}

deleteDialog.addEventListener("close", () => {
  const scope = deleteDialog.returnValue;
  if (eventToDelete) {
    deleteRepeatingEvent(eventToDelete, scope);
    eventToDelete = null;
    return;
  }
  const task = taskToDelete;
  taskToDelete = null;
  if (!task || scope === "cancel") return;
  const before = tasks;
  tasks = deleteFromSeries(tasks, task, scope);
  const deleted = before.filter((other) => !tasks.includes(other));
  persist();
  render();
  const day = formatDay(task.due, { weekday: "short", month: "short", day: "numeric" });
  showToast(scope === "one" ? `Deleted “${task.name}” on ${day}.` : `Deleted ${deleted.length} of “${task.name}”.`, {
    undo: () => restoreTasks(deleted),
  });
});
deleteDialog.addEventListener("click", (event) => {
  if (event.target === deleteDialog) deleteDialog.close();
});

function isMissed(task) {
  const now = new Date();
  return urgencyOf(task, toDateKey(now), toTimeKey(now)) === "overdue";
}

function openRescheduleFor(task) {
  openMissedDialog([task.id], { single: true });
}

// One task on the calendar: the circle checks it off, the name opens it to change, the × deletes it.
// Clicking a missed task opens the reschedule pop-up instead (it has "Mark as done" too),
// so a missed task is never crossed off by accident. The Overdue list adds a Reschedule button.
function renderChip(task, subtitle, { showRescheduleButton = false, showFocusButton = false } = {}) {
  const missed = isMissed(task);
  const item = document.createElement("li");
  item.className = `chip${task.done ? " done" : ""}${missed ? " missed" : ""}`;
  item.dataset.taskId = task.id;
  const colorIndex = taskColorIndex(task, groups);
  if (colorIndex >= 0) item.dataset.color = String(colorIndex);

  const checkButton = document.createElement("button");
  checkButton.type = "button";
  checkButton.className = "chip-check";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "chip-open";
  if (missed) {
    checkButton.setAttribute("aria-label", `Reschedule or finish ${task.name} (missed)`);
    checkButton.addEventListener("click", () => openRescheduleFor(task));
    open.setAttribute("aria-label", `Reschedule or finish ${task.name} (missed)`);
    open.addEventListener("click", () => openRescheduleFor(task));
  } else {
    checkButton.setAttribute("aria-pressed", String(task.done));
    checkButton.setAttribute("aria-label", `${task.done ? "Uncheck" : "Check off"} ${task.name}`);
    checkButton.addEventListener("click", (click) => toggleDone(task, click));
    open.setAttribute("aria-label", `Change ${task.name}`);
    open.addEventListener("click", () => openEditDialog(task));
  }

  const check = document.createElement("span");
  check.className = "check";
  check.setAttribute("aria-hidden", "true");
  checkButton.append(check);

  const text = document.createElement("span");
  text.className = "chip-text";
  const name = document.createElement("span");
  name.className = "chip-name";
  name.textContent = task.name;
  text.append(name);
  if (task.weight && !task.done) {
    const weight = document.createElement("span");
    weight.className = "chip-weight";
    weight.textContent = `${task.weight}%`;
    weight.title = `Worth ${task.weight}% of your grade`;
    text.append(weight);
  }
  const progressText = stepProgress(task);
  if (progressText && !task.done) {
    const progressBadge = document.createElement("span");
    progressBadge.className = "chip-steps";
    progressBadge.textContent = progressText;
    text.append(progressBadge);
  }
  if (missed && !showRescheduleButton) {
    const badge = document.createElement("span");
    badge.className = "chip-missed";
    badge.textContent = "Missed";
    text.append(badge);
  }
  const startText = describeStart(task, toDateKey(new Date()));
  if (startText && !missed) {
    const start = document.createElement("span");
    start.className = `chip-start${startText === "Start now!" ? " start-now" : ""}`;
    start.textContent = startText;
    text.append(start);
  }
  if (subtitle) {
    const meta = document.createElement("span");
    meta.className = "chip-meta";
    meta.textContent = subtitle;
    text.append(meta);
  }
  open.append(text);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "chip-delete";
  remove.textContent = "×";
  remove.setAttribute("aria-label", `Delete ${task.name}`);
  remove.addEventListener("click", () => deleteTask(task));

  item.append(checkButton, open);
  if (showRescheduleButton) {
    const reschedule = document.createElement("button");
    reschedule.type = "button";
    reschedule.className = "chip-reschedule";
    reschedule.textContent = "Reschedule";
    reschedule.setAttribute("aria-label", `Reschedule ${task.name}`);
    reschedule.addEventListener("click", () => openRescheduleFor(task));
    item.append(reschedule);
  }
  if (showFocusButton && !task.done) {
    const focusButton = document.createElement("button");
    focusButton.type = "button";
    focusButton.className = "chip-focus";
    focusButton.textContent = "🔒";
    focusButton.title = "Lock in on this";
    focusButton.setAttribute("aria-label", `Lock in on ${task.name}`);
    focusButton.addEventListener("click", () => openFocusStart(task));
    item.append(focusButton);
  }
  if (!task.done || task.pinned) item.append(pinButton(task));
  const link = firstLink(task.notes);
  if (link) item.append(linkButton(link, task.name));
  item.append(remove);
  if (task.pinned && !task.done) item.classList.add("pinned");
  return item;
}

// ☆ pins a task to the top of Today (★) until it's checked off or unpinned.
function pinButton(task) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip-star";
  button.textContent = task.pinned ? "★" : "☆";
  button.setAttribute("aria-pressed", String(task.pinned === true));
  button.setAttribute("aria-label", `${task.pinned ? "Unpin" : "Pin"} ${task.name}`);
  button.title = task.pinned ? "Unpin from the top of Today" : "Pin to the top of Today";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePin(task);
  });
  return button;
}

function togglePin(task) {
  task.pinned = !task.pinned;
  persist();
  render();
  showToast(task.pinned ? `Pinned “${task.name}” to the top of Today.` : `Unpinned “${task.name}”.`);
}

// 🔗 on a task with a link in its notes: one click opens it in a new tab.
function linkButton(href, taskName) {
  const anchor = document.createElement("a");
  anchor.className = "chip-link";
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = "🔗";
  anchor.title = `Open ${href}`;
  anchor.setAttribute("aria-label", `Open the link for ${taskName}`);
  // Opening the link shouldn't also open or drag the task.
  anchor.addEventListener("click", (event) => event.stopPropagation());
  return anchor;
}

// Under the Notes box: the links in it, clickable, so they're one click away from the open task too.
function renderNotesLinks() {
  const links = notesParts(notesInput.value).filter((part) => part.link);
  notesLinks.hidden = links.length === 0;
  notesLinks.replaceChildren(
    ...links.flatMap(({ link }, index) => {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = `🔗 ${link.replace(/^https?:\/\//, "").slice(0, 60)}`;
      return index === 0 ? [anchor] : [" ", anchor];
    }),
  );
}

notesInput.addEventListener("input", renderNotesLinks);

// The day's events: your own, plus Google's minus any that are already tasks here, as moved or
// hidden in Due Next.
function eventsOn(dateKey) {
  // Showing one class: only your events in it (Google's have no class, so they're hidden too).
  if (calendarFilter) {
    const shown = events.filter((event) => matchesFilter(event, calendarFilter));
    return googleEventsOn(eventEntries(shown, groups), dateKey);
  }
  const google = applyGoogleChanges(eventsNotInTasks(googleCalendarEntries(), tasks), googleChanges);
  const holidays = holidaysShown() ? holidaysOn(dateKey) : [];
  return googleEventsOn([...holidays, ...google, ...eventEntries(events, groups)], dateKey);
}

// Holidays show unless they've been turned off in Settings → Look.
function holidaysShown() {
  try {
    return localStorage.getItem(HOLIDAYS_KEY) !== "off";
  } catch {
    return true;
  }
}

// Which class or group the calendar is showing, or null for everything. Kept only until the page
// reloads, so nothing stays hidden by surprise. Today, Overdue, and Start by always show everything.
let calendarFilter = null;

function calendarTasks() {
  return calendarFilter ? tasks.filter((task) => matchesFilter(task, calendarFilter)) : tasks;
}

const sameFilter = (a, b) => Boolean(a && b) && a.kind === b.kind && (a.kind === "group" ? a.id === b.id : a.value.toLowerCase() === b.value.toLowerCase());

// "Moved in Due Next. Google Calendar says 3:00 PM – 4:00 PM on Mon, Nov 9."
function describeGoogleMove(entry) {
  const { date, start, end } = entry.original;
  const day = date === entry.date ? "" : ` on ${formatDay(date, { weekday: "short", month: "short", day: "numeric" })}`;
  return `Moved in Due Next. Google Calendar says ${formatTime(start)} – ${formatTime(end)}${day}.`;
}

// An event. Google's are only shown for reference, so they can't be changed here; clicking one of
// your own opens it to change or delete.
function renderGoogleEvent(entry, { short = false } = {}) {
  const item = document.createElement("li");
  item.className = "google-event";
  const range = entry.end === entry.start ? formatTime(entry.start) : `${formatTime(entry.start)} – ${formatTime(entry.end)}`;
  const longTime = entry.start ? range : "All day";
  item.dataset.entryId = entry.id;
  if (entry.holiday) {
    // Holidays are just shown; there's nothing to open or change.
    item.classList.add("holiday");
    item.title = `${entry.name} · holiday`;
    const name = document.createElement("span");
    name.className = "google-event-name";
    name.textContent = entry.name;
    item.append(name);
    return item;
  }
  if (entry.eventId) {
    item.classList.add("due-event");
    item.dataset.eventId = entry.eventId;
    if (entry.colorIndex >= 0) item.dataset.color = String(entry.colorIndex);
    item.title = [entry.name, longTime, entry.location && `📍 ${entry.location}`, "click to change"].filter(Boolean).join(" · ");
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    const open = () => openEditEvent(events.find((event) => event.id === entry.eventId));
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      open();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
  } else {
    if (/^#[0-9a-f]{6}$/i.test(entry.color)) item.style.setProperty("--event-color", entry.color);
    item.title = [entry.name, longTime, entry.original ? describeGoogleMove(entry) : "from Google Calendar"].join(" · ");
    item.classList.toggle("moved", Boolean(entry.original));
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    googleEntryById.set(entry.id, entry);
    const open = () => openGoogleEventDialog(entry);
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      open();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
  }
  const time = document.createElement("span");
  time.className = "google-event-time";
  time.textContent = entry.start ? (short ? formatShortTime(entry.start) : longTime) : "All day";
  const name = document.createElement("span");
  name.className = "google-event-name";
  name.textContent = entry.name;
  // A month cell is tiny, so all-day events there show just their name, like Google's.
  if (short && !entry.start) item.append(name);
  else item.append(time, name);
  return item;
}

// "9am", "11:59pm": Google Calendar's short times, which fit in a month cell.
function formatShortTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const hour = hours % 12 || 12;
  return `${hour}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}${hours < 12 ? "am" : "pm"}`;
}

// In the month grid, timed tasks read like Google's timed events (circle, time, name, no box);
// tasks without a time are solid bars like Google's all-day events.
function renderMonthChip(task) {
  const chip = renderChip(task, "");
  if (task.time) {
    chip.classList.add("timed");
    const time = document.createElement("span");
    time.className = "month-time";
    time.textContent = formatShortTime(task.time);
    chip.querySelector(".chip-text").prepend(time);
  }
  return chip;
}

// Week: an hour-by-hour grid with a column per day. Tasks sit in the hour they're due, and Google
// events stretch from their start to their end, side by side when they overlap.
const WEEK_LABEL_WIDTH = "56px";
// Where a spot across the 7 day columns sits (0 is the start of the first day, 1 the end of the last).
const weekColumnLeft = (fraction) => `calc(${WEEK_LABEL_WIDTH} + (100% - ${WEEK_LABEL_WIDTH}) * ${fraction})`;

// A task is a moment, not a stretch of time, so the week draws it half an hour tall.
const WEEK_TASK_MINUTES = 30;
const LATEST_BLOCK_START = "23:29";

// "16:30" plus 45 minutes is "17:15". It stops at the end of the day, or with `wrap`, carries on
// past midnight ("23:30" plus an hour is "00:30").
function clockAfter(time, minutes, { wrap = false } = {}) {
  const [hours, mins] = time.split(":").map(Number);
  const later = hours * 60 + mins + minutes;
  const total = wrap ? later % (24 * 60) : Math.min(later, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function renderWeekHead(days, todayKey) {
  const head = document.createElement("div");
  head.className = "week-head";
  head.append(document.createElement("span"));
  for (const dateKey of days) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-day-head";
    if (dateKey === todayKey) button.classList.add("is-today");
    if (dateKey < todayKey) button.classList.add("is-past");
    button.setAttribute("aria-label", `See ${formatDay(dateKey, { weekday: "long", month: "long", day: "numeric" })}`);
    const weekday = document.createElement("span");
    weekday.className = "weekday";
    weekday.textContent = formatDay(dateKey, { weekday: "short" });
    const dateNumber = document.createElement("span");
    dateNumber.className = "date-number";
    dateNumber.textContent = String(parseDateKey(dateKey).getDate());
    button.append(weekday, dateNumber);
    button.addEventListener("click", () => {
      view = "day";
      saveViewSettings();
      showDate(dateKey);
    });
    head.append(button);
  }
  return head;
}

// One row of the week: a label, then a cell per day. Clicking an empty cell adds a task due then.
function renderWeekRow(label, days, itemsFor, hour) {
  const row = document.createElement("div");
  row.className = "week-row";
  if (hour !== undefined) row.dataset.hour = String(hour);
  const labelElement = document.createElement("span");
  labelElement.className = "week-label";
  labelElement.textContent = label;
  row.append(labelElement);
  for (const dateKey of days) {
    const cell = document.createElement("ul");
    cell.className = "week-cell";
    cell.append(...itemsFor(dateKey));
    cell.addEventListener("click", (event) => {
      if (event.target !== cell) return;
      openAddDialog(dateKey);
      if (hour !== undefined) {
        taskTime.write(`${String(hour).padStart(2, "0")}:00`);
        highlightChosenPick();
      }
    });
    row.append(cell);
  }
  return row;
}

function renderWeek(todayKey) {
  const days = weekDays(startOfWeek(visibleDate));
  const previousScroll = weekContainer.scrollTop;
  const dayTasks = new Map(days.map((dateKey) => [dateKey, tasksDueOn(calendarTasks(), dateKey)]));
  const dayEvents = new Map(days.map((dateKey) => [dateKey, eventsOn(dateKey)]));

  const grid = document.createElement("div");
  grid.className = "week-inner";
  // The day names and the All day row (holidays, all-day events, tasks with no time) stay in view
  // while the hours scroll.
  const weekTop = document.createElement("div");
  weekTop.className = "week-top";
  weekTop.append(
    renderWeekHead(days, todayKey),
    renderWeekRow("All day", days, (dateKey) => [
      ...dayEvents.get(dateKey).filter((entry) => !entry.start).map((entry) => renderGoogleEvent(entry, { short: true })),
      ...dayTasks.get(dateKey).filter((task) => !task.time).map(renderMonthChip),
      ...stepsOn(calendarTasks(), dateKey).map(({ task, step }) => renderStepChip(task, step)),
    ]),
  );
  grid.append(weekTop);
  const timedEvents = [...dayEvents.values()].flat().filter((entry) => entry.start);
  const hours = timelineHours([...[...dayTasks.values()].flat(), ...timedEvents.map((entry) => ({ time: entry.start }))]);
  for (const hour of hours) grid.append(renderWeekRow(formatHour(hour), days, () => [], hour));

  // Tasks and events share the layer, so they sit side by side instead of on top of each other.
  const layer = document.createElement("ul");
  layer.className = "timeline-events week-events";
  layer.setAttribute("aria-label", "Tasks and events");
  days.forEach((dateKey, dayIndex) => {
    const timedTasks = dayTasks
      .get(dateKey)
      .filter((task) => task.time)
      // A task due late at night (11:59 PM) is drawn ending at midnight, so it stays inside the grid.
      .map((task) => {
        const start = task.time > LATEST_BLOCK_START ? LATEST_BLOCK_START : task.time;
        return { task, start, end: clockAfter(start, WEEK_TASK_MINUTES) };
      });
    const timedEvents = dayEvents.get(dateKey).filter((other) => other.start);
    for (const { entry, column, columns } of eventColumns([...timedEvents, ...timedTasks])) {
      const block = entry.task ? renderMonthChip(entry.task) : renderGoogleEvent(entry);
      block.classList.add("timeline-event");
      if (entry.task) {
        block.classList.add("week-task");
        block.title = `${entry.task.name} · due ${formatTime(entry.task.time)}`;
      } else {
        block.querySelector(".google-event-time").textContent = `${formatShortTime(entry.start)}–${formatShortTime(entry.end)}`;
        makeDraggableEvent(block, entry);
      }
      block.dataset.start = entry.start;
      block.dataset.end = entry.end;
      block.style.left = weekColumnLeft((dayIndex + column / columns) / 7);
      block.style.width = `calc((100% - ${WEEK_LABEL_WIDTH}) / ${7 * columns})`;
      layer.append(block);
    }
  });
  grid.append(layer);

  const now = new Date();
  const todayIndex = days.indexOf(todayKey);
  const nowRow = grid.querySelector(`[data-hour="${now.getHours()}"]`);
  if (todayIndex >= 0 && nowRow) {
    const nowLine = document.createElement("div");
    nowLine.className = "now-line week-now";
    nowLine.style.top = `${(now.getMinutes() / 60) * 100}%`;
    nowLine.style.left = weekColumnLeft(todayIndex / 7);
    nowLine.style.width = `calc((100% - ${WEEK_LABEL_WIDTH}) / 7)`;
    nowLine.setAttribute("aria-hidden", "true");
    nowRow.append(nowLine);
  }

  weekContainer.replaceChildren(grid);
  placeTimelineEvents(grid);
  enableGridDragging(grid, {
    scroller: weekContainer,
    dayAt: (clientX) => {
      const heads = [...grid.querySelectorAll(".week-day-head")];
      const index = heads.findIndex((head) => clientX < head.getBoundingClientRect().right);
      return days[index === -1 ? days.length - 1 : index];
    },
    columnOf: (dateKey) => ({ left: weekColumnLeft(days.indexOf(dateKey) / 7), width: `calc((100% - ${WEEK_LABEL_WIDTH}) / 7)` }),
  });
  if (!scrollDayToStart) {
    weekContainer.scrollTop = previousScroll;
    return;
  }
  // Opens on the hour before now this week, or 8 AM on other weeks.
  scrollDayToStart = false;
  const firstHour = todayIndex >= 0 ? now.getHours() - 1 : 8;
  const startRow = [...grid.querySelectorAll("[data-hour]")].find((row) => Number(row.dataset.hour) >= firstHour);
  const headHeight = grid.querySelector(".week-top").offsetHeight;
  if (startRow) weekContainer.scrollTop = startRow.offsetTop - headHeight;
}

// Agenda: everything coming up for two weeks, day by day, skipping empty days.
const AGENDA_DAYS = 14;

function agendaDayName(dateKey, todayKey) {
  const name = formatDay(dateKey, { weekday: "long", month: "short", day: "numeric" });
  if (dateKey === todayKey) return `Today · ${name}`;
  if (dateKey === addDays(todayKey, 1)) return `Tomorrow · ${name}`;
  return name;
}

function renderAgenda(todayKey) {
  const days = [];
  for (let offset = 0; offset < AGENDA_DAYS; offset++) {
    const dateKey = addDays(visibleDate, offset);
    // All-day events first, then events and tasks by time; tasks due "any time" come last.
    const items = [
      ...eventsOn(dateKey).map((entry) => ({ order: entry.start || "", render: () => renderGoogleEvent(entry) })),
      ...tasksDueOn(calendarTasks(), dateKey).map((task) => ({
        order: task.time || "24:00",
        render: () => renderChip(task, taskDetails(task, { anytimeLabel: true })),
      })),
      // Steps have a day but no time, so they come after everything else.
      ...stepsOn(calendarTasks(), dateKey).map(({ task, step }) => ({ order: "25:00", render: () => renderStepChip(task, step) })),
    ].sort((a, b) => a.order.localeCompare(b.order));
    if (items.length === 0) continue;

    const day = document.createElement("section");
    day.className = "agenda-day";
    if (dateKey === todayKey) day.classList.add("is-today");
    const heading = document.createElement("h3");
    heading.className = "agenda-date";
    heading.textContent = agendaDayName(dateKey, todayKey);
    const list = document.createElement("ul");
    list.className = "agenda-items";
    list.append(...items.map((item) => item.render()));
    day.append(heading, list);
    days.push(day);
  }
  if (days.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-day";
    empty.textContent = "Nothing on your calendar for these two weeks.";
    days.push(empty);
  }
  agendaContainer.replaceChildren(...days);
}

// Semester: its own part of the app, switched to with the 📊 Semester tab, with a row per week showing
// how heavy it is, so crunch weeks can be seen coming. Clicking a week goes back to the calendar on it.
function weekRange(start) {
  const end = addDays(start, 6);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return `${formatDay(start, { month: "short", day: "numeric" })} – ${formatDay(end, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" })}`;
}

function countOf(list, one, many) {
  return list.length === 0 ? "" : `${list.length} ${list.length === 1 ? one : many}`;
}

// "2 exams, 1 project, 5 assignments · about 9 hours of work"
function describeWorkload(week) {
  const counts = [countOf(week.exams, "exam", "exams"), countOf(week.projects, "project", "projects"), countOf(week.assignments, "assignment", "assignments")]
    .filter(Boolean)
    .join(", ");
  const hours = Math.round((week.minutes / 60) * 2) / 2;
  const amount = week.minutes < 60 ? `${week.minutes} minutes` : `${hours} hour${hours === 1 ? "" : "s"}`;
  const work = week.minutes > 0 ? `about ${amount} of work` : "";
  return [counts, work].filter(Boolean).join(" · ");
}

// "Very busy · 2 exams, 1 project, 5 assignments · about 9 hours of work"
function describeSemesterWeek(week) {
  return [week.levelLabel, describeWorkload(week)].filter(Boolean).join(" · ");
}

// A quiet line under the date in the task and event form when that week is already busy, so it can
// be weighed before saving. For an event (often plans with people), it also names the next lighter week.
const busyWeekNote = document.getElementById("busy-week-note");

function updateBusyWeekNote() {
  const date = dueInput.value;
  const others = tasks.filter((task) => task.id !== editingTaskId);
  const weeks = /^\d{4}-\d{2}-\d{2}$/.test(date) ? semesterWeeks(others, toDateKey(new Date()), { workload: chosenWorkload() }) : [];
  const index = weeks.findIndex((week) => week.start === startOfWeek(date));
  const week = weeks[index];
  const busy = week && (week.level === "busy" || week.level === "very-busy");
  busyWeekNote.hidden = !busy;
  if (!busy) return;
  const lighter = formKind === "event" ? weeks.slice(index + 1).find((other) => other.level === "free" || other.level === "light") : null;
  busyWeekNote.textContent = [
    `Heads up: ${weekRange(week.start)} is already ${week.levelLabel.toLowerCase()} · ${describeWorkload(week)}.`,
    lighter ? `${weekRange(lighter.start)} is lighter.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// The week's days as small columns, taller for more due, with the heaviest one picked out.
function renderSemesterDays(week) {
  const strip = document.createElement("span");
  strip.className = "semester-days";
  strip.setAttribute("aria-hidden", "true");
  const most = Math.max(3, ...week.days.map((day) => day.score));
  for (const day of week.days) {
    const column = document.createElement("span");
    column.className = "semester-day";
    if (day === week.heaviest) column.classList.add("heaviest");
    const bar = document.createElement("span");
    bar.className = "semester-day-bar";
    const fill = document.createElement("span");
    fill.style.height = `${(day.score / most) * 100}%`;
    bar.append(fill);
    const letter = document.createElement("span");
    letter.textContent = formatDay(day.date, { weekday: "narrow" });
    column.append(bar, letter);
    strip.append(column);
  }
  return strip;
}

// "Heaviest: Thu, Dec 3 · 1 exam, 2 assignments". Counts, not names, since the Get ahead line
// already names the big work.
function describeHeaviestDay(week, day) {
  const onDay = (list) => list.filter((task) => task.due === day.date);
  const counts = describeWorkload({ exams: onDay(week.exams), projects: onDay(week.projects), assignments: onDay(week.assignments), minutes: 0 });
  const when = formatDay(day.date, { weekday: "short", month: "short", day: "numeric" });
  return `Heaviest: ${when} · ${counts}`;
}

function semesterAdvice(week, isThisWeek) {
  if (week.level === "free" || week.level === "light") return "Lighter week, a good time for plans.";
  if (week.level === "steady") return "";
  const bigWork = [...week.exams, ...week.projects];
  // Two classes can both have an "Exam 3"; then the class tells them apart. The same exam saved twice
  // (say, from a syllabus and from Canvas) is named once.
  const named = (task) =>
    task.course && bigWork.some((other) => other.name === task.name && other.course !== task.course)
      ? `“${task.name}” (${task.course})`
      : `“${task.name}”`;
  const big = [...new Set(bigWork.map(named))].slice(0, 2);
  const when = isThisWeek ? "now" : "the week before";
  return big.length > 0 ? `Get ahead: start ${big.join(" and ")} ${when}.` : `Get ahead: knock out a few of these ${when}.`;
}

function chosenWorkload() {
  try {
    const saved = localStorage.getItem(WORKLOAD_KEY);
    return WORKLOAD_OPTIONS.some((option) => option.id === saved) ? saved : DEFAULT_WORKLOAD;
  } catch {
    return DEFAULT_WORKLOAD;
  }
}

// Timed events for the Semester view's "beyond a usual week" hours: your own and Google's (as moved or
// hidden in Due Next). With one class picked, only your events for that class.
function semesterEvents() {
  if (calendarFilter) return eventEntries(events.filter((event) => matchesFilter(event, calendarFilter)), groups);
  return [...applyGoogleChanges(eventsNotInTasks(googleCalendarEntries(), tasks), googleChanges), ...eventEntries(events, groups)];
}

// "📅 +5 hours of events beyond a usual week"
function describeExtraEvents(minutes) {
  const hours = Math.round(minutes / 30) / 2;
  return `📅 +${hours} hour${hours === 1 ? "" : "s"} of classes and events beyond a usual week`;
}

// What's due in a week, on its card: "Thu · Midterm 2 · CHEM 102", in day order, exams and
// projects in bold, up to 8 and then "+3 more".
const SEMESTER_LIST_LIMIT = 8;

function renderSemesterTasks(week) {
  const due = week.days.flatMap((day) => [...day.tasks].sort(compareTaskTimes));
  if (due.length === 0) return null;
  const big = new Set([...week.exams, ...week.projects]);
  const list = document.createElement("span");
  list.className = "semester-tasks";
  for (const task of due.slice(0, SEMESTER_LIST_LIMIT)) {
    const line = document.createElement("span");
    line.className = `semester-task${big.has(task) ? " big" : ""}`;
    const day = document.createElement("span");
    day.className = "semester-task-day";
    day.textContent = formatDay(task.due, { weekday: "short" });
    line.append(day, [task.name, task.course, stepProgress(task)].filter(Boolean).join(" · "));
    list.append(line);
  }
  if (due.length > SEMESTER_LIST_LIMIT) {
    const more = document.createElement("span");
    more.className = "semester-task more";
    more.textContent = `+${due.length - SEMESTER_LIST_LIMIT} more`;
    list.append(more);
  }
  return list;
}

// The countdown at the top of the Semester view: "📚 3 weeks until finals (Dec 11) · 2 busy weeks
// before then", with a date box to set when finals start (otherwise guessed from a "Final" task).
function finalsDate(todayKey) {
  let chosen = "";
  try {
    chosen = localStorage.getItem(FINALS_KEY) ?? "";
  } catch {
    // Fall back to the guess.
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(chosen) ? chosen : guessFinalsDate(tasks, todayKey);
}

function renderFinalsCountdown(weeks, todayKey) {
  const finals = finalsDate(todayKey);
  const box = document.createElement("div");
  box.className = "finals-countdown";
  const text = document.createElement("p");
  text.className = "finals-text";
  const countdown = describeFinalsCountdown(finals, todayKey);
  if (countdown) {
    const busyBefore = weeks.filter((week) => week.start < finals && (week.level === "busy" || week.level === "very-busy")).length;
    const busyText = busyBefore > 0 ? ` · ${busyBefore} busy week${busyBefore === 1 ? "" : "s"} before then` : "";
    text.textContent = `📚 ${countdown}${busyText}`;
  } else {
    // Finals week (and a bit after): encouragement. Long after: ready for next term's date.
    const finalsWeek = finals && finals <= todayKey && addDays(finals, 14) >= todayKey;
    text.textContent = finalsWeek ? "📚 Finals are here. You've got this." : "📚 Set when finals start to see a countdown.";
  }
  const label = document.createElement("label");
  label.className = "finals-date";
  label.textContent = "Finals start ";
  const input = document.createElement("input");
  input.type = "date";
  input.value = finals;
  input.addEventListener("change", () => {
    try {
      if (input.value) localStorage.setItem(FINALS_KEY, input.value);
      else localStorage.removeItem(FINALS_KEY);
    } catch {
      // It just won't be remembered.
    }
    render();
  });
  label.append(input);
  box.append(text, label);
  return box;
}

// Get ahead: one click adds suggested steps to the week's exams and projects that don't have any yet,
// spread from today (or their Start by day) to the day before, so the work starts early. With Undo.
function renderGetAhead(week) {
  const big = [...week.exams, ...week.projects].filter((task) => !task.done && (task.steps ?? []).length === 0);
  if (big.length === 0) return null;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quiet-button get-ahead";
  button.textContent = "🪜 Get ahead";
  button.title = `Add steps to ${big.map((task) => task.name).join(", ")}`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const todayKey = toDateKey(new Date());
    for (const task of big) {
      // Starting the week before, like the card's tip says (or today, if that's sooner).
      const steps = suggestSteps(task, todayKey, { from: addDays(task.due, -7) });
      task.steps = steps.map((step) => ({ id: crypto.randomUUID(), ...step, done: false }));
    }
    persist();
    render();
    const names = big.map((task) => `“${task.name}”`).join(" and ");
    showToast(`Added steps to ${names}. They're on your calendar.`, {
      undo: () => {
        for (const task of big) task.steps = [];
        persist();
        render();
      },
    });
  });
  return button;
}

// Tasks with a time first, earliest first; "any time" ones after.
function compareTaskTimes(a, b) {
  return (a.time || "24:00").localeCompare(b.time || "24:00");
}

function renderSemester(todayKey) {
  // Picking a class in the Show row works out each week from just that class, and leaves out the
  // weeks where it has nothing due.
  const weeks = semesterWeeks(calendarTasks(), todayKey, { workload: chosenWorkload(), events: semesterEvents() });
  const shownWeeks = calendarFilter ? weeks.filter((week) => week.days.some((day) => day.tasks.length > 0)) : weeks;
  const most = Math.max(12, ...weeks.map((week) => week.score));
  const busiest = weeks.filter((week) => week.busiest).sort((a, b) => b.score - a.score);
  const summary = document.createElement("p");
  summary.className = "semester-summary";
  const chosen = calendarFilter ? (calendarFilter.value ?? groups.find((group) => group.id === calendarFilter.id)?.name ?? "") : "";
  const busiestText = busiest.map((week) => weekRange(week.start)).join(", ");
  if (chosen && shownWeeks.length === 0) summary.textContent = `Nothing due for ${chosen} coming up. 🎉`;
  else if (busiest.length > 0) summary.textContent = `🔥 ${chosen ? `Busiest weeks for ${chosen}` : "Your busiest weeks"}: ${busiestText}.`;
  else summary.textContent = `No busy weeks${chosen ? ` for ${chosen}` : ""} coming up. 🎉`;
  const countdown = renderFinalsCountdown(weeks, todayKey);
  const rows = shownWeeks.map((week) => {
    const index = weeks.indexOf(week);
    // A clickable card rather than a <button>, so the Get ahead button can sit inside it.
    const row = document.createElement("div");
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.className = `semester-week level-${week.level}`;
    row.dataset.weekStart = week.start;
    row.setAttribute("aria-label", `${weekRange(week.start)}: ${describeSemesterWeek(week)}. Open this week.`);
    const dates = document.createElement("span");
    dates.className = "semester-dates";
    dates.textContent = `${week.busiest ? "🔥 " : ""}${index === 0 ? "This week" : weekRange(week.start)}`;
    const bar = document.createElement("span");
    bar.className = "semester-bar";
    const fill = document.createElement("span");
    fill.style.width = `${(week.score / most) * 100}%`;
    bar.append(fill);
    const label = document.createElement("span");
    label.className = "semester-label";
    label.textContent = describeSemesterWeek(week);
    row.append(dates, bar, label);
    if (week.level !== "free") row.append(renderSemesterDays(week));
    if (week.heaviest) {
      const heaviest = document.createElement("span");
      heaviest.className = "semester-heaviest";
      heaviest.textContent = describeHeaviestDay(week, week.heaviest);
      row.append(heaviest);
    }
    if (week.extraEventMinutes > 0) {
      const extra = document.createElement("span");
      extra.className = "semester-extra-events";
      extra.textContent = describeExtraEvents(week.extraEventMinutes);
      row.append(extra);
    }
    const weekList = renderSemesterTasks(week);
    if (weekList) row.append(weekList);
    const advice = semesterAdvice(week, index === 0);
    if (advice) {
      const tip = document.createElement("span");
      tip.className = "semester-advice";
      tip.textContent = advice;
      row.append(tip);
    }
    const getAhead = renderGetAhead(week);
    if (getAhead) row.append(getAhead);
    const openWeek = () => {
      showMode("calendar");
      view = "week";
      saveViewSettings();
      showDate(week.start);
    };
    row.addEventListener("click", openWeek);
    row.addEventListener("keydown", (event) => {
      if (event.target !== row || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      openWeek();
    });
    return row;
  });
  semesterContainer.replaceChildren(countdown, summary, ...rows);
}

// Switching shows one part and hides the other; style.css hides the calendar's controls too.
function showMode(next) {
  mode = next;
  document.body.dataset.mode = next;
  for (const tab of modeTabs) tab.setAttribute("aria-selected", String(tab.dataset.modeTab === next));
  semesterPage.hidden = next !== "semester";
  if (next === "semester") {
    renderSemester(toDateKey(new Date()));
    window.scrollTo(0, 0);
  }
}

for (const tab of modeTabs) tab.addEventListener("click", () => showMode(tab.dataset.modeTab));

// Most tasks a month cell lists before "+2 more", so every week row stays the same height.
const MONTH_CELL_TASKS = 3;

function renderMonthDay(dateKey, todayKey) {
  const day = document.createElement("div");
  day.className = "month-day";
  day.dataset.date = dateKey;
  if (dateKey === todayKey) day.classList.add("is-today");
  if (dateKey < todayKey) day.classList.add("is-past");
  if (startOfMonth(dateKey) !== startOfMonth(visibleDate)) day.classList.add("is-other-month");

  const dateNumber = document.createElement("span");
  dateNumber.className = "date-number";
  dateNumber.textContent = String(parseDateKey(dateKey).getDate());

  const dayTasks = tasksDueOn(calendarTasks(), dateKey);
  const items = [
    ...eventsOn(dateKey).map((entry) => () => renderGoogleEvent(entry, { short: true })),
    ...dayTasks.map((task) => () => renderMonthChip(task)),
    ...stepsOn(calendarTasks(), dateKey).map(({ task, step }) => () => renderStepChip(task, step)),
  ];
  const list = document.createElement("ul");
  list.className = "month-tasks";
  list.append(...items.slice(0, MONTH_CELL_TASKS).map((renderItem) => renderItem()));
  day.append(dateNumber, list);

  const hiddenCount = items.length - MONTH_CELL_TASKS;
  if (hiddenCount > 0) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "month-more";
    more.textContent = `+${hiddenCount} more`;
    more.setAttribute("aria-label", `See everything on ${formatDay(dateKey, { month: "long", day: "numeric" })}`);
    more.addEventListener("click", () => {
      view = "day";
      saveViewSettings();
      showDate(dateKey);
    });
    day.append(more);
  }

  // Like the week, clicking blank space in a day adds a task due then.
  day.addEventListener("click", (event) => {
    if (event.target === day || event.target === list || event.target === dateNumber) openAddDialog(dateKey);
  });
  return day;
}

// Month: drag a task (or one of your events) to another day. It keeps its time, a plain click still
// opens it, and the move has Undo, like dragging in Week. Google events and steps stay put here.
let monthDrag = null;

monthContainer.addEventListener("pointerdown", (pointer) => {
  if (pointer.button !== 0 || monthDrag) return;
  if (pointer.target.closest(".chip-check, .chip-delete, .chip-star, .chip-link, .month-more")) return;
  const chip = pointer.target.closest(".month-day [data-task-id], .month-day .due-event[data-event-id]");
  if (!chip) return;
  const task = chip.dataset.taskId ? tasks.find((other) => other.id === chip.dataset.taskId) : null;
  const event = chip.dataset.eventId ? events.find((other) => other.id === chip.dataset.eventId) : null;
  if ((!task && !event) || task?.done || (event && endsNextDay(event))) return;
  monthDrag = { task, event, chip, x: pointer.clientX, y: pointer.clientY, moved: false, ghost: null, target: null };
});

document.addEventListener("pointermove", (pointer) => {
  if (!monthDrag) return;
  if (!monthDrag.moved && Math.hypot(pointer.clientX - monthDrag.x, pointer.clientY - monthDrag.y) < DRAG_START_PX) return;
  if (!monthDrag.moved) {
    monthDrag.moved = true;
    monthDrag.chip.classList.add("being-dragged");
    monthDrag.ghost = document.createElement("div");
    monthDrag.ghost.className = "month-drag-ghost";
    monthDrag.ghost.textContent = (monthDrag.task ?? monthDrag.event).name;
    document.body.append(monthDrag.ghost);
  }
  monthDrag.ghost.style.left = `${pointer.clientX}px`;
  monthDrag.ghost.style.top = `${pointer.clientY}px`;
  const day = document.elementFromPoint(pointer.clientX, pointer.clientY)?.closest(".month-day");
  if (monthDrag.target !== day) {
    monthDrag.target?.classList.remove("drop-target");
    monthDrag.target = day && monthContainer.contains(day) ? day : null;
    monthDrag.target?.classList.add("drop-target");
  }
});

document.addEventListener("pointerup", () => {
  const drag = monthDrag;
  monthDrag = null;
  if (!drag?.moved) return;
  drag.ghost.remove();
  drag.target?.classList.remove("drop-target");
  // The drag ends with a click on whatever is under the pointer; it shouldn't also open it.
  const swallowClick = (click) => click.stopPropagation();
  window.addEventListener("click", swallowClick, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallowClick, { capture: true }), 0);
  const day = drag.target?.dataset.date;
  if (!day) {
    render();
    return;
  }
  dropOnMonthDay(drag, day);
});

function dropOnMonthDay({ task, event }, day) {
  if (task) {
    if (task.due === day) return render();
    const problem = pastTimeError(day, task.time, new Date());
    if (problem) {
      render();
      showToast(problem);
      return;
    }
    const before = task.due;
    task.due = day;
    persist();
    render();
    showToast(`Moved “${task.name}” to ${formatWhen(day, task.time)}.`, {
      undo: () => {
        task.due = before;
        persist();
        render();
      },
    });
    return;
  }
  if (event.date === day) return render();
  const before = event.date;
  event.date = day;
  persistEvents();
  forgetTrip(event.id);
  render();
  showToast(`Moved “${event.name}” to ${formatEventWhen(event)}.`, {
    undo: () => {
      event.date = before;
      persistEvents();
      forgetTrip(event.id);
      render();
    },
  });
}

function renderMonth(todayKey) {
  const weekdayNames = weekDays(startOfWeek(todayKey)).map((dateKey) => {
    const name = document.createElement("div");
    name.className = "weekday month-weekday";
    name.textContent = formatDay(dateKey, { weekday: "short" });
    return name;
  });
  monthContainer.replaceChildren(...weekdayNames, ...monthGrid(visibleDate).map((dateKey) => renderMonthDay(dateKey, todayKey)));
}

function renderPeriodLabel() {
  if (view === "month") {
    periodLabel.textContent = formatDay(visibleDate, { month: "long", year: "numeric" });
    return;
  }
  if (view === "day") {
    periodLabel.textContent = formatDay(visibleDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return;
  }
  if (view === "agenda") {
    const last = addDays(visibleDate, AGENDA_DAYS - 1);
    periodLabel.textContent = `${formatDay(visibleDate, { month: "long", day: "numeric" })} – ${formatDay(last, { month: "long", day: "numeric", year: "numeric" })}`;
    return;
  }
  const days = weekDays(startOfWeek(visibleDate));
  const first = parseDateKey(days[0]);
  const last = parseDateKey(days[6]);
  const sameMonth = first.getMonth() === last.getMonth();
  const start = first.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const end = last.toLocaleDateString(undefined, sameMonth ? { day: "numeric" } : { month: "long", day: "numeric" });
  periodLabel.textContent = `${start} – ${end}, ${last.getFullYear()}`;
}

function renderTimelineRow(label, rowTasks) {
  const row = document.createElement("div");
  row.className = "timeline-row";
  const hourLabel = document.createElement("span");
  hourLabel.className = "timeline-label";
  hourLabel.textContent = label;
  const list = document.createElement("ul");
  list.className = "timeline-tasks";
  list.append(...rowTasks.map((task) => renderChip(task, taskDetails(task, { anytimeLabel: true }))));
  row.append(hourLabel, list);
  return row;
}

// Today's planned blocks show on the timeline; clicking one opens the plan.
function addPlanBlocksToRow(row, hour) {
  const list = row.querySelector(".timeline-tasks");
  const hourBlocks = (dayPlan?.blocks ?? []).filter((block) => Math.floor(block.start / 60) === hour);
  for (const block of hourBlocks.reverse()) {
    const task = tasks.find((other) => other.id === block.taskId);
    if (!task || task.done || dayPlan.skippedIds.includes(task.id)) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timeline-plan";
    button.textContent = `${formatMinutes(block.start)}–${formatMinutes(block.end)} · ${task.name}`;
    button.addEventListener("click", openPlanPanel);
    list.prepend(button);
  }
}

function renderTimeline(dayTasks, dayEvents, daySteps, isToday) {
  const timeline = document.createElement("div");
  timeline.className = "timeline";

  const allDay = dayEvents.filter((entry) => !entry.start);
  if (allDay.length > 0 || daySteps.length > 0) {
    const row = renderTimelineRow("All day", []);
    row.querySelector(".timeline-tasks").append(
      ...allDay.map((entry) => renderGoogleEvent(entry)),
      ...daySteps.map(({ task, step }) => renderStepChip(task, step)),
    );
    timeline.append(row);
  }

  const now = new Date();
  const timedEvents = dayEvents.filter((entry) => entry.start);
  const hours = timelineHours([...dayTasks, ...timedEvents.map((entry) => ({ time: entry.start }))]);
  const lastHour = hours.at(-1);
  for (const hour of hours) {
    // Tasks with no time are due by the end of the day, so they sit in the last hour.
    const rowTasks = dayTasks.filter((task) =>
      task.time ? Number(task.time.slice(0, 2)) === hour : hour === lastHour,
    );
    const row = renderTimelineRow(formatHour(hour), rowTasks);
    row.dataset.hour = String(hour);
    if (timedEvents.length > 0) {
      const lane = document.createElement("div");
      lane.className = "timeline-lane";
      row.append(lane);
    }
    if (isToday) addPlanBlocksToRow(row, hour);
    if (isToday && hour === now.getHours()) {
      const nowLine = document.createElement("div");
      nowLine.className = "now-line";
      nowLine.style.top = `${(now.getMinutes() / 60) * 100}%`;
      nowLine.setAttribute("aria-hidden", "true");
      row.append(nowLine);
    }
    timeline.append(row);
  }
  if (timedEvents.length > 0) {
    timeline.classList.add("has-events");
    const head = document.createElement("div");
    head.className = "timeline-head";
    for (const text of ["", "Tasks", "Calendar"]) {
      const label = document.createElement("span");
      label.textContent = text;
      head.append(label);
    }
    timeline.prepend(head);
    const layer = document.createElement("ul");
    layer.className = "timeline-events";
    layer.setAttribute("aria-label", "From Google Calendar");
    for (const { entry, column, columns } of eventColumns(timedEvents)) {
      const block = renderGoogleEvent(entry);
      block.classList.add("timeline-event");
      // Blocks can be narrow, so the name comes first and the time is short: "3pm–6pm".
      block.querySelector(".google-event-time").textContent = `${formatShortTime(entry.start)}–${formatShortTime(entry.end)}`;
      block.dataset.start = entry.start;
      block.dataset.end = entry.end;
      makeDraggableEvent(block, entry);
      block.style.left = `${(column / columns) * 100}%`;
      block.style.width = `${100 / columns}%`;
      layer.append(block);
    }
    timeline.append(layer);
  }
  return timeline;
}

// Stretches each Google event from its start to its end. Rows grow with their tasks, so this
// measures the rows once they're on screen.
function placeTimelineEvents(timeline) {
  const rows = new Map([...timeline.querySelectorAll("[data-hour]")].map((row) => [Number(row.dataset.hour), row]));
  const firstHour = Math.min(...rows.keys());
  const lastHour = Math.max(...rows.keys());
  const position = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const row = rows.get(Math.min(Math.max(hours, firstHour), lastHour));
    return row.offsetTop + (hours < firstHour ? 0 : (minutes / 60) * row.offsetHeight);
  };
  for (const block of timeline.querySelectorAll(".timeline-event")) {
    const top = position(block.dataset.start);
    block.style.top = `${top}px`;
    block.style.height = `${Math.max(position(block.dataset.end) - top, 20)}px`;
  }
}

// Dragging on the hour grids (Week, and Day's timeline): move your tasks and events to a new time
// or day, stretch an event's end, or drag across empty time to make a new event. Google events
// can't be dragged, since Due Next never changes your Google Calendar.

const DRAG_START_PX = 5;
const SNAP_MINUTES = 15;
const DAY_MINUTES = 24 * 60;
// While a drag is going: { kind: "move-event" | "resize-event" | "move-task" | "create", ... }.
let gridDrag = null;

// Timed events (yours, except ones running past midnight, and Google's) get a handle to stretch them.
function makeDraggableEvent(block, entry) {
  if (entry.eventId) {
    const event = events.find((other) => other.id === entry.eventId);
    if (!event || endsNextDay(event)) return;
    block.dataset.eventId = event.id;
  } else {
    if (!entry.start) return;
    block.dataset.googleId = entry.id;
  }
  block.classList.add("draggable");
  const handle = document.createElement("span");
  handle.className = "resize-handle";
  handle.setAttribute("aria-hidden", "true");
  block.append(handle);
}

function clockFromMinutes(total) {
  const minutes = Math.min(Math.max(total, 0), DAY_MINUTES - 1);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function minutesFromClock(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const snap = (minutes) => Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

// The time of day (in minutes) at a point on the grid, from its hour rows.
function minutesAt(grid, clientY) {
  const rows = [...grid.querySelectorAll("[data-hour]")];
  for (const row of rows) {
    const { top, bottom, height } = row.getBoundingClientRect();
    if (clientY < bottom || row === rows.at(-1)) {
      const fraction = Math.min(Math.max((clientY - top) / height, 0), 1);
      return Number(row.dataset.hour) * 60 + fraction * 60;
    }
  }
  return 0;
}

// Where a time sits, in px from the top of the grid (like placeTimelineEvents).
function offsetOf(grid, minutes) {
  const rows = [...grid.querySelectorAll("[data-hour]")];
  const hour = Math.floor(Math.min(minutes, DAY_MINUTES - 1) / 60);
  const row = rows.find((other) => Number(other.dataset.hour) === hour) ?? (hour < Number(rows[0].dataset.hour) ? rows[0] : rows.at(-1));
  const rowHour = Number(row.dataset.hour);
  if (hour < rowHour) return row.offsetTop;
  return row.offsetTop + ((minutes - rowHour * 60) / 60) * row.offsetHeight;
}

function enableGridDragging(grid, { scroller, dayAt, columnOf }) {
  grid.addEventListener("pointerdown", (pointer) => {
    if (pointer.button !== 0 || gridDrag) return;
    const target = pointer.target;
    const eventBlock = target.closest(".timeline-event.draggable");
    const taskChip = target.closest("[data-task-id]");
    const inHours = target.closest("[data-hour]");
    let drag = null;
    const downMinutes = minutesAt(grid, pointer.clientY);
    if (eventBlock) {
      // One of your events, or a Google one (changed in Due Next only).
      const event = events.find((other) => other.id === eventBlock.dataset.eventId);
      const google = event ? null : googleEntryById.get(eventBlock.dataset.googleId);
      const shown = event ?? google;
      if (!shown) return;
      const start = minutesFromClock(shown.start);
      const length = minutesFromClock(shown.end) - start;
      const common = { event, google, date: shown.date, start, element: eventBlock };
      drag = target.classList.contains("resize-handle")
        ? { kind: "resize-event", ...common }
        : { kind: "move-event", ...common, length, grab: downMinutes - start };
    } else if (taskChip && (taskChip.classList.contains("week-task") || inHours)) {
      const task = tasks.find((other) => other.id === taskChip.dataset.taskId);
      if (!task || task.done) return;
      const start = task.time ? minutesFromClock(task.time) : downMinutes;
      drag = { kind: "move-task", task, start, grab: task.time && taskChip.classList.contains("week-task") ? downMinutes - start : 0, element: taskChip };
    } else if (inHours && !target.closest("button, a, input, .timeline-event, .chip")) {
      drag = { kind: "create", from: snap(downMinutes) };
    }
    if (!drag) return;
    gridDrag = { ...drag, grid, scroller, dayAt, columnOf, x: pointer.clientX, y: pointer.clientY, moved: false, day: dayAt(pointer.clientX) };
    // A press that never turns into a drag is just a click, wherever the button is let go.
    window.addEventListener(
      "pointerup",
      () => {
        if (gridDrag && !gridDrag.moved) gridDrag = null;
      },
      { once: true },
    );
  });

  grid.addEventListener("pointermove", (pointer) => {
    if (!gridDrag || gridDrag.grid !== grid) return;
    if (!gridDrag.moved && Math.hypot(pointer.clientX - gridDrag.x, pointer.clientY - gridDrag.y) < DRAG_START_PX) return;
    if (!gridDrag.moved) {
      gridDrag.moved = true;
      // Only now does the grid take over the pointer, so plain clicks still reach what was clicked.
      try {
        grid.setPointerCapture(pointer.pointerId);
      } catch {
        // The browser no longer tracks this pointer (or it's a screen check's pretend one); the drag
        // still works while the pointer stays over the calendar.
      }
      gridDrag.element?.classList.add("being-dragged");
      gridDrag.ghost = document.createElement("div");
      gridDrag.ghost.className = "drag-ghost";
      grid.append(gridDrag.ghost);
    }
    // Scrolls along when dragging near the top or bottom of the calendar.
    const { top, bottom } = scroller.getBoundingClientRect();
    if (pointer.clientY < top + 30) scroller.scrollTop -= 12;
    else if (pointer.clientY > bottom - 30) scroller.scrollTop += 12;
    updateDragGhost(pointer);
  });

  const finish = (pointer, cancelled) => {
    if (!gridDrag || gridDrag.grid !== grid) return;
    const drag = gridDrag;
    gridDrag = null;
    if (!drag.moved) return;
    // The drag ends with a click on whatever is under the pointer; it shouldn't also open it.
    const swallowClick = (click) => click.stopPropagation();
    window.addEventListener("click", swallowClick, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallowClick, { capture: true }), 0);
    if (cancelled) {
      render();
      return;
    }
    dropDrag(drag, pointer);
  };
  grid.addEventListener("pointerup", (pointer) => finish(pointer, false));
  grid.addEventListener("pointercancel", (pointer) => finish(pointer, true));
}

// Works out the new times for the drag so far: { day, start, end } in minutes.
function dragTimes(drag, pointer) {
  const at = minutesAt(drag.grid, pointer.clientY);
  const day = drag.kind === "resize-event" ? drag.date : drag.dayAt(pointer.clientX);
  if (drag.kind === "resize-event") {
    return { day, start: drag.start, end: Math.min(Math.max(snap(at), drag.start + SNAP_MINUTES), DAY_MINUTES - 1) };
  }
  if (drag.kind === "move-event") {
    const start = Math.min(Math.max(snap(at - drag.grab), 0), DAY_MINUTES - drag.length);
    return { day, start, end: Math.min(start + drag.length, DAY_MINUTES - 1) };
  }
  if (drag.kind === "move-task") {
    const start = Math.min(Math.max(snap(at - drag.grab), 0), DAY_MINUTES - 1);
    return { day, start, end: start + WEEK_TASK_MINUTES };
  }
  const here = snap(at);
  const start = Math.min(drag.from, here);
  const end = Math.max(drag.from, here, start + SNAP_MINUTES);
  return { day: drag.day, start, end: Math.min(end, DAY_MINUTES - 1) };
}

function updateDragGhost(pointer) {
  const drag = gridDrag;
  const { day, start, end } = dragTimes(drag, pointer);
  const top = offsetOf(drag.grid, start);
  const { left, width } = drag.columnOf(day);
  Object.assign(drag.ghost.style, { top: `${top}px`, height: `${Math.max(offsetOf(drag.grid, end) - top, 18)}px`, left, width });
  const dayName = day === (drag.task?.due ?? drag.date ?? drag.day) ? "" : `${formatDay(day, { weekday: "short" })} `;
  drag.ghost.textContent =
    drag.kind === "move-task"
      ? `Due ${dayName}${formatTime(clockFromMinutes(start))}`
      : `${dayName}${formatTime(clockFromMinutes(start))} – ${formatTime(clockFromMinutes(end))}`;
}

function dropDrag(drag, pointer) {
  const { day, start, end } = dragTimes(drag, pointer);
  if (drag.kind === "create") {
    openAddDialog(day);
    eventStart.write(clockFromMinutes(start));
    eventEnd.write(clockFromMinutes(end));
    setFormKind("event");
    render();
    return;
  }
  if (drag.kind === "move-task") {
    const time = clockFromMinutes(start);
    const problem = pastTimeError(day, time, new Date());
    if (problem) {
      render();
      showToast(problem);
      return;
    }
    const before = { due: drag.task.due, time: drag.task.time };
    Object.assign(drag.task, { due: day, time });
    persist();
    render();
    showToast(`Moved “${drag.task.name}” to ${formatWhen(day, time)}.`, {
      undo: () => {
        Object.assign(drag.task, before);
        persist();
        render();
      },
    });
    return;
  }
  const verb = drag.kind === "resize-event" ? "Changed" : "Moved";
  if (drag.google) {
    const moved = { date: day, start: clockFromMinutes(start), end: clockFromMinutes(end) };
    const before = googleChanges;
    googleChanges = changeGoogleEntry(googleChanges, drag.google, moved);
    persistGoogleChanges();
    render();
    showToast(`${verb} “${drag.google.name}” to ${formatEventWhen(moved)}.`, { undo: () => restoreGoogleChanges(before) });
    return;
  }
  const before = { date: drag.event.date, start: drag.event.start, end: drag.event.end };
  Object.assign(drag.event, { date: day, start: clockFromMinutes(start), end: clockFromMinutes(end) });
  persistEvents();
  forgetTrip(drag.event.id);
  render();
  showToast(`${verb} “${drag.event.name}” to ${formatEventWhen(drag.event)}.`, {
    undo: () => {
      Object.assign(drag.event, before);
      persistEvents();
      forgetTrip(drag.event.id);
      render();
    },
  });
}

// A Google event's box: hide it, or put a moved one back, in Due Next only.
const googleEventDialog = document.getElementById("google-event-dialog");
const googleEventReset = document.getElementById("google-event-reset");
let openGoogleEntry = null;

function openGoogleEventDialog(entry) {
  openGoogleEntry = entry;
  document.getElementById("google-event-title").textContent = entry.name;
  const day = formatDay(entry.date, { weekday: "long", month: "short", day: "numeric" });
  const times = entry.start ? (entry.end === entry.start ? formatTime(entry.start) : `${formatTime(entry.start)} – ${formatTime(entry.end)}`) : "All day";
  document.getElementById("google-event-when").textContent = `${day}, ${times}`;
  const moved = document.getElementById("google-event-moved");
  moved.hidden = !entry.original;
  moved.textContent = entry.original ? describeGoogleMove(entry) : "";
  googleEventReset.hidden = !entry.original;
  googleEventDialog.showModal();
}

function restoreGoogleChanges(saved) {
  googleChanges = saved;
  persistGoogleChanges();
  render();
}

document.getElementById("google-event-hide").addEventListener("click", () => {
  const before = googleChanges;
  googleChanges = changeGoogleEntry(googleChanges, openGoogleEntry, { hidden: true });
  persistGoogleChanges();
  googleEventDialog.close();
  render();
  showToast(`Hid “${openGoogleEntry.name}”. Settings → Google Calendar can show it again.`, {
    undo: () => restoreGoogleChanges(before),
  });
});
googleEventReset.addEventListener("click", () => {
  const before = googleChanges;
  googleChanges = changeGoogleEntry(googleChanges, openGoogleEntry, null);
  persistGoogleChanges();
  googleEventDialog.close();
  render();
  showToast(`Put “${openGoogleEntry.name}” back at Google's time.`, { undo: () => restoreGoogleChanges(before) });
});
document.getElementById("google-event-done").addEventListener("click", () => googleEventDialog.close());
googleEventDialog.addEventListener("click", (event) => {
  if (event.target === googleEventDialog) googleEventDialog.close();
});

function renderDayList(dayTasks, dayEvents, daySteps, nowTime) {
  const wrapper = document.createElement("div");
  wrapper.className = "day-list-view";

  if (dayEvents.length > 0) {
    const events = document.createElement("ul");
    events.className = "day-events";
    events.setAttribute("aria-label", "From Google Calendar");
    events.append(...dayEvents.map((entry) => renderGoogleEvent(entry)));
    wrapper.append(events);
  }

  if (daySteps.length > 0) {
    const steps = document.createElement("ul");
    steps.className = "day-list day-steps";
    steps.setAttribute("aria-label", "Steps for this day");
    steps.append(...daySteps.map(({ task, step }) => renderStepChip(task, step)));
    wrapper.append(steps);
  }

  if (dayTasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-day";
    empty.textContent = daySteps.length > 0 ? "Nothing due this day." : "Nothing due this day. Click + New to add a task or event.";
    wrapper.append(empty);
    return wrapper;
  }

  const nextUp = nextUpTask(dayTasks, nowTime);
  if (nextUp) {
    const card = document.createElement("div");
    card.className = "next-up";
    const label = document.createElement("p");
    label.className = "next-up-label";
    label.textContent = "Coming up next";
    const name = document.createElement("p");
    name.className = "next-up-name";
    name.textContent = nextUp.name;
    const meta = document.createElement("p");
    meta.className = "next-up-meta";
    const timeLeft = nowTime && nextUp.time ? describeTimeLeft(nextUp.time, nowTime) : "";
    meta.textContent = [taskDetails(nextUp, { anytimeLabel: true }), timeLeft].filter(Boolean).join(" · ");
    card.append(label, name, meta);
    wrapper.append(card);
  }

  const list = document.createElement("ul");
  list.className = "day-list";
  list.append(...dayTasks.map((task) => renderChip(task, taskDetails(task, { anytimeLabel: true }), { showFocusButton: true })));
  wrapper.append(list);
  return wrapper;
}

// The hour to scroll to: an hour before now on today, otherwise the first timed task.
function startingHour(dayTasks, isToday) {
  if (isToday) return new Date().getHours() - 1;
  const firstTimed = dayTasks.find((task) => task.time);
  return firstTimed ? Number(firstTimed.time.slice(0, 2)) : 0;
}

function renderDayView(todayKey) {
  const dayTasks = tasksDueOn(calendarTasks(), visibleDate);
  const dayEvents = eventsOn(visibleDate);
  const daySteps = stepsOn(calendarTasks(), visibleDate);
  const isToday = visibleDate === todayKey;
  const previousScroll = dayContent.firstElementChild?.scrollTop ?? 0;
  const content =
    dayLayout === "timeline"
      ? renderTimeline(dayTasks, dayEvents, daySteps, isToday)
      : renderDayList(dayTasks, dayEvents, daySteps, isToday ? toTimeKey(new Date()) : null);
  dayContent.replaceChildren(content);
  if (dayLayout === "timeline") {
    placeTimelineEvents(content);
    enableGridDragging(content, {
      scroller: content,
      dayAt: () => visibleDate,
      columnOf: () => ({ left: "84px", width: "calc(100% - 84px)" }),
    });
  }

  if (!scrollDayToStart) {
    content.scrollTop = previousScroll;
    return;
  }
  scrollDayToStart = false;
  content.scrollTop = 0;
  if (dayLayout !== "timeline") return;
  const hour = startingHour(dayTasks, isToday);
  const row = [...content.querySelectorAll("[data-hour]")].find((candidate) => Number(candidate.dataset.hour) >= hour);
  if (row) content.scrollTop = row.offsetTop;
}

function renderOverdue(todayKey) {
  const overdue = groupTasks(tasks, todayKey, toTimeKey(new Date())).overdue;
  overdueCount.textContent = String(overdue.length);
  overdueSection.classList.toggle("has-overdue", overdue.length > 0);
  overdueEmpty.hidden = overdue.length > 0;
  overdueList.replaceChildren(
    ...overdue.map((task) => {
      const due = `Due ${describeDue(task, todayKey)}`;
      return renderChip(task, task.course ? `${task.course} · ${due}` : due, { showRescheduleButton: true });
    }),
  );
}

// Tasks due later that should be started by now, under their own heading.
function renderTimeToStart(toStart, todayKey) {
  if (toStart.length === 0) return [];
  const heading = document.createElement("li");
  heading.className = "today-heading";
  heading.textContent = "Time to start";
  const chips = toStart.map((task) =>
    renderChip(task, [task.course, `Due ${describeDue(task, todayKey)}`].filter(Boolean).join(" · "), { showFocusButton: true }),
  );
  return [heading, ...chips];
}

// Today's to-do list beside the calendar: pinned tasks (★) first, then missed tasks (in red), then
// everything due today, then work due later whose day to begin has arrived.
function renderTodayList(todayKey) {
  const nowTime = toTimeKey(new Date());
  const pinned = pinnedTasks(tasks);
  const notPinned = (task) => !pinned.includes(task);
  // Within each part, heavier work (a bigger grade weight) comes first.
  const missed = groupTasks(tasks, todayKey, nowTime).overdue.filter(notPinned).sort(compareWeight);
  const dueToday = tasksDueOn(tasks, todayKey)
    .filter((task) => !missed.includes(task) && notPinned(task))
    .sort((a, b) => Number(a.done) - Number(b.done) || compareWeight(a, b));
  const toStart = tasksToStart(tasks, todayKey).filter(notPinned).sort(compareWeight);
  // Steps for today, plus earlier ones not checked off yet; checked-off ones from today stay, crossed out.
  const todaySteps = [
    ...stepsToDo(tasks, todayKey),
    ...stepsOn(tasks, todayKey).filter(({ step }) => step.done),
  ];
  const toDo = [...pinned, ...missed, ...dueToday, ...toStart];

  todayList.replaceChildren(
    ...pinned.map((task) =>
      renderChip(task, [task.course, `Due ${describeDue(task, todayKey)}`].filter(Boolean).join(" · "), { showFocusButton: true }),
    ),
    ...missed.map((task) =>
      renderChip(task, [task.course, `Due ${describeDue(task, todayKey)}`].filter(Boolean).join(" · "), { showFocusButton: true }),
    ),
    ...dueToday.map((task) => renderChip(task, taskDetails(task, { anytimeLabel: true }), { showFocusButton: true })),
    ...todaySteps.map(({ task, step }) => renderStepChip(task, step, { late: step.date < todayKey })),
    ...renderTimeToStart(toStart, todayKey),
  );
  todayEmpty.hidden = toDo.length + todaySteps.length > 0;
  const left = toDo.filter((task) => !task.done).length + todaySteps.filter(({ step }) => !step.done).length;
  const date = formatDay(todayKey, { weekday: "long", month: "short", day: "numeric" });
  todaySummary.textContent =
    toDo.length + todaySteps.length === 0 ? date : left === 0 ? `${date} · all done ✓` : `${date} · ${left} left`;
}

// The Start by list: tasks with a time estimate whose day to begin is still ahead.
function renderStartByList(todayKey) {
  const upcoming = upcomingStarts(tasks, todayKey);
  startByList.replaceChildren(
    ...upcoming.map((task) => {
      const length = ESTIMATE_OPTIONS.find((option) => option.minutes === task.estimateMinutes)?.label;
      return renderChip(task, [task.course, `Due ${describeDue(task, todayKey)}`, length].filter(Boolean).join(" · "));
    }),
  );
  startByEmpty.hidden = upcoming.length > 0;
}

function groupDot(color) {
  const dot = document.createElement("span");
  dot.className = "group-dot";
  dot.dataset.color = String(color);
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

// The color key lists only groups that have a task, so unused ones don't add clutter.
// The row of classes and groups under Overdue: click one to see only its work on the calendar,
// All (or the same one again) to see everything.
function renderGroupLegend() {
  const options = filterOptions(tasks, events, groups);
  // A class whose last task was finished or deleted while chosen: back to everything.
  if (calendarFilter && !options.some((option) => sameFilter(option, calendarFilter))) calendarFilter = null;
  groupLegend.hidden = options.length === 0;
  const choose = (filter) => {
    calendarFilter = filter;
    render();
  };
  const button = (label, filter, color) => {
    const item = document.createElement("li");
    const choice = document.createElement("button");
    choice.type = "button";
    choice.className = "filter-choice";
    const chosen = filter ? sameFilter(filter, calendarFilter) : !calendarFilter;
    choice.setAttribute("aria-pressed", String(chosen));
    if (color !== undefined) choice.append(groupDot(color));
    choice.append(label);
    choice.addEventListener("click", () => choose(chosen && filter ? null : filter));
    item.append(choice);
    return item;
  };
  const note = document.createElement("li");
  note.className = "filter-note";
  note.textContent = calendarFilter ? "Showing only:" : "Show:";
  groupLegend.replaceChildren(
    note,
    button("All", null),
    ...options.map((option) => button(option.label, option, option.color)),
  );
}

function renderControls() {
  viewSelect.value = view;
  for (const button of document.querySelectorAll("[data-layout]")) {
    button.setAttribute("aria-pressed", String(button.dataset.layout === dayLayout));
  }
  previousButton.setAttribute("aria-label", `Previous ${view}`);
  nextButton.setAttribute("aria-label", `Next ${view}`);
}

function render() {
  // Redrawing mid-drag would pull the grid out from under the pointer; it redraws on drop instead.
  if (gridDrag || monthDrag?.moved) return;
  const todayKey = toDateKey(new Date());
  renderControls();
  renderPeriodLabel();
  renderOverdue(todayKey);
  renderGroupLegend();
  renderTodayList(todayKey);
  renderPlanButton();
  if (planPanel.open) renderPlan();
  renderStartByList(todayKey);
  renderNotifyBanner();

  showGoogleRange(...visibleRange());
  renderGoogleBanner();
  if (mode === "semester") renderSemester(todayKey);
  if (settingsPanel.open) showGoogleSetting();

  document.body.classList.toggle("day-mode", view === "day");
  document.body.dataset.view = view;
  weekContainer.hidden = view !== "week";
  monthContainer.hidden = view !== "month";
  dayView.hidden = view !== "day";
  agendaContainer.hidden = view !== "agenda";
  if (view === "week") {
    renderWeek(todayKey);
  } else if (view === "month") {
    renderMonth(todayKey);
  } else if (view === "agenda") {
    renderAgenda(todayKey);
  } else {
    renderDayView(todayKey);
  }

  if (tasks.length === 0) {
    hint.textContent = "No tasks yet. Click + New to add your first one.";
  } else if (view === "week") {
    hint.textContent = "Click an hour to add a task due then, or a day's name to see just that day.";
  } else if (view === "agenda") {
    hint.textContent = "Everything coming up in the next two weeks. Click a circle to check a task off, or its name to change it.";
  } else if (view === "month") {
    hint.textContent = "Click a day to add a task due then. Click a circle to check a task off, or its name to change it.";
  } else {
    hint.textContent = "Click a circle to check a task off, or its name to change it. + New adds to this day.";
  }
}

// Rows change height with the window, so the Google event blocks are measured again.
window.addEventListener("resize", () => {
  const timeline = dayContent.querySelector(".timeline.has-events");
  if (timeline && !dayView.hidden) placeTimelineEvents(timeline);
  const week = weekContainer.querySelector(".week-inner");
  if (week && !weekContainer.hidden) placeTimelineEvents(week);
});

// The first and last dates on screen.
function visibleRange() {
  if (view === "day") return [visibleDate, visibleDate];
  if (view === "agenda") return [visibleDate, addDays(visibleDate, AGENDA_DAYS - 1)];
  if (view === "month") {
    const grid = monthGrid(visibleDate);
    return [grid[0], grid.at(-1)];
  }
  const start = startOfWeek(visibleDate);
  return [start, addDays(start, 6)];
}

// Google's access pass runs out after about an hour, and getting a new one needs a click.
function googleOfferDismissed() {
  try {
    return sessionStorage.getItem(GOOGLE_NOT_NOW_KEY) === "true";
  } catch {
    return false;
  }
}

// The quiet Update button: shows how fresh your saved Google events are, and turns a color after a day.
const googleUpdateButton = document.getElementById("google-update");
const googleUpdateAge = document.getElementById("google-update-age");

function renderGoogleUpdate() {
  const { status, updatedAt } = googleCalendarStatus();
  googleUpdateButton.hidden = !updatedAt || status === "off";
  if (googleUpdateButton.hidden) return;
  const { text, stale } = describeGoogleUpdate(updatedAt);
  googleUpdateAge.textContent = status === "loading" ? "· Updating…" : `· ${text}`;
  googleUpdateButton.classList.toggle("stale", stale && status !== "loading");
  googleUpdateButton.disabled = status === "loading";
  googleUpdateButton.title = "Get the latest from Google Calendar";
}

googleUpdateButton.addEventListener("click", () => connectGoogle());
// Keeps "Updated … ago" honest while Due Next sits open.
setInterval(renderGoogleUpdate, 60_000);

function renderGoogleBanner() {
  renderGoogleUpdate();
  const { status } = googleCalendarStatus();
  const offering = status === "suggest" && !googleOfferDismissed();
  googleBanner.hidden = !offering && status !== "reconnect" && status !== "error";
  googleBannerText.textContent = {
    suggest: "Your Google Calendar isn't showing on this computer yet. One click brings your events in.",
    error: "Couldn't load your Google Calendar. Due Next will try again in a few minutes.",
  }[status] ?? "Your Google Calendar events are hidden until Google gets a quick click.";
  googleBannerButton.hidden = status !== "reconnect" && !offering;
  googleBannerNotNow.hidden = !offering;
}

googleBannerNotNow.addEventListener("click", () => {
  try {
    sessionStorage.setItem(GOOGLE_NOT_NOW_KEY, "true");
  } catch {
    // It just shows again after a reload.
  }
  renderGoogleBanner();
});

function showDate(dateKey) {
  visibleDate = dateKey;
  scrollDayToStart = true;
  render();
}

function loadViewSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_SETTINGS_KEY) ?? "{}");
    if (["day", "week", "month", "agenda"].includes(saved.view)) view = saved.view;
    if (saved.dayLayout === "timeline" || saved.dayLayout === "list") dayLayout = saved.dayLayout;
  } catch {
    // A missing or unreadable preference just means the defaults.
  }
}

function saveViewSettings() {
  try {
    localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify({ view, dayLayout }));
  } catch {
    // Not saving this preference is harmless.
  }
}

// Errors show in red; info (like the test notification result) shows in gray.
function showFormMessage(text, { info = false } = {}) {
  formMessage.textContent = text;
  formMessage.classList.toggle("is-info", info);
}

// A time entered in three slots: hour, minutes, and AM/PM buttons. Typing "a" or "p" in a slot
// picks AM or PM, and a finished hour jumps to the minutes. onChange runs after every edit.
function createTimeSlots(group, onChange = () => {}) {
  const hourInput = group.querySelector(".time-slot[id$='-hour']");
  const minuteInput = group.querySelector(".time-slot[id$='-minute']");
  const periodButtons = [...group.querySelectorAll("[data-period]")];
  let period = "";

  function showPeriod() {
    for (const button of periodButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.period === period));
    }
  }

  for (const button of periodButtons) {
    button.addEventListener("click", () => {
      period = button.dataset.period;
      showPeriod();
      onChange();
    });
  }

  for (const input of [hourInput, minuteInput]) {
    // Handled on keydown so "a", "p", and ":" work even when the slot is already full.
    input.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "p") {
        event.preventDefault();
        period = key === "a" ? "AM" : "PM";
        showPeriod();
        onChange();
      } else if ((key === ":" || key === ";") && input === hourInput) {
        event.preventDefault();
        minuteInput.focus();
      }
    });
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");
      // No hour starts with 3-9 and has a second digit, so move on right away ("945p" → 9:45 PM).
      if (input === hourInput && /^(\d\d|[3-9])$/.test(input.value)) minuteInput.focus();
      onChange();
    });
  }

  return {
    // Returns { time } ("" when every slot is empty) or { error }.
    read() {
      const hour = hourInput.value;
      const minute = minuteInput.value;
      if (!hour && !minute && !period) return { time: "" };
      if (!hour) return { error: "Type the hour, like 11." };
      const hourNumber = Number(hour);
      if (!period && hourNumber >= 1 && hourNumber <= 12) return { error: "Pick AM or PM." };
      return parseTimeInput(`${hour}:${minute.padStart(2, "0")} ${period}`);
    },
    // Fills the slots from HH:MM, or clears them for "".
    write(time) {
      if (time) {
        const [hours, minutes] = time.split(":").map(Number);
        hourInput.value = String(hours % 12 || 12);
        minuteInput.value = String(minutes).padStart(2, "0");
        period = hours >= 12 ? "PM" : "AM";
      } else {
        hourInput.value = "";
        minuteInput.value = "";
        period = "";
      }
      showPeriod();
    },
    focus() {
      hourInput.focus();
    },
  };
}

const taskTime = createTimeSlots(document.getElementById("task-time"), () => highlightChosenPick());

// Clicking into a time box opens a list of times to scroll through and tap. For a task, times
// already past today are grayed out. For today, the list carries on into tomorrow's times (picking
// one moves the date to tomorrow), so late at night "in 40 minutes" is still in the list.
// Typing still works; the list closes when focus leaves the box and list.
function attachTimeList(group, list, slots, { pastAllowed = false, offerTomorrow = false, onPick = () => {} } = {}) {
  function open() {
    const chosen = slots.read().time ?? "";
    const now = new Date();
    const todayKey = toDateKey(now);
    const tomorrowKey = addDays(todayKey, 1);
    const choices = timeChoices(dueInput.value, now).map((choice) => ({
      ...choice,
      date: dueInput.value,
      disabled: choice.disabled && !pastAllowed,
    }));
    if (offerTomorrow && dueInput.value === todayKey) {
      choices.push(
        ...timeChoices(tomorrowKey, now).map((choice) => ({ ...choice, date: tomorrowKey, label: `${choice.label} · tomorrow` })),
      );
    }
    list.replaceChildren(
      ...choices.map(({ time, label, disabled, date }) => {
        const choice = document.createElement("button");
        choice.type = "button";
        choice.className = "time-choice";
        choice.setAttribute("role", "option");
        choice.setAttribute("aria-selected", String(time === chosen && date === dueInput.value));
        choice.disabled = disabled;
        choice.dataset.time = time;
        choice.textContent = label;
        const pick = () => {
          if (date !== dueInput.value) {
            dueInput.value = date;
            dueInput.dispatchEvent(new Event("change"));
          }
          slots.write(time);
          onPick(time);
          showFormMessage("");
          list.hidden = true;
        };
        // Picked as soon as the mouse button goes down: Safari can close the list before a click
        // finishes. A click still works for the keyboard (Enter or Space on a focused time).
        choice.addEventListener("mousedown", (event) => {
          if (event.button !== 0 || choice.disabled) return;
          event.preventDefault();
          pick();
        });
        choice.addEventListener("click", pick);
        return choice;
      }),
    );
    list.hidden = false;
    // Start at the chosen time, or (for today) the next time coming up, or 9 AM, instead of at midnight.
    const upNext = dueInput.value === todayKey ? choices.findIndex((choice) => choice.date === tomorrowKey || choice.time > toTimeKey(now)) : -1;
    const start =
      list.querySelector("[aria-selected='true']") ??
      (upNext >= 0 ? list.children[upNext] : null) ??
      list.querySelector("[data-time='09:00']");
    if (start) list.scrollTop = start.offsetTop - 4;
  }

  // Keeps the time box focused while scrolling the list with the mouse, so the list stays open.
  list.addEventListener("mousedown", (event) => event.preventDefault());
  group.addEventListener("focusin", () => {
    if (list.hidden || list.dataset.for !== group.id) {
      list.dataset.for = group.id;
      open();
    }
  });
  for (const area of [group, list]) {
    area.addEventListener("focusout", (event) => {
      if (list.dataset.for === group.id && !group.contains(event.relatedTarget) && !list.contains(event.relatedTarget)) {
        list.hidden = true;
      }
    });
  }
}

const taskTimeList = document.getElementById("task-time-list");
attachTimeList(document.getElementById("task-time"), taskTimeList, taskTime, { offerTomorrow: true, onPick: highlightChosenPick });

// An event's start and end share one list of times; picking a start moves the end to an hour later.
const eventStartGroup = document.getElementById("event-start");
const eventNextDay = document.getElementById("event-next-day");
const eventStart = createTimeSlots(eventStartGroup, () => showNextDayNote());
const eventEnd = createTimeSlots(document.getElementById("event-end"), () => showNextDayNote());

// Says so when the end time is earlier than the start, so an event past midnight is never a surprise.
function showNextDayNote() {
  const start = eventStart.read().time;
  const end = eventEnd.read().time;
  eventNextDay.hidden = eventAllDay.checked || !endsNextDay({ start, end });
}
const eventTimeList = document.getElementById("event-time-list");
attachTimeList(eventStartGroup, eventTimeList, eventStart, {
  pastAllowed: true,
  offerTomorrow: true,
  onPick: (time) => {
    eventEnd.write(clockAfter(time, 60, { wrap: true }));
    showNextDayNote();
  },
});
attachTimeList(document.getElementById("event-end"), eventTimeList, eventEnd, { pastAllowed: true, onPick: showNextDayNote });

const missedTime = createTimeSlots(document.getElementById("missed-time"), () => highlightMissedPick());

function highlightChosenPick() {
  for (const button of quickPicksList.children) {
    const chosen = button.dataset.due === dueInput.value && button.dataset.time === taskTime.read().time;
    button.setAttribute("aria-pressed", String(chosen));
  }
}

function renderQuickPicks() {
  const now = new Date();
  const forToday = dueInput.value === toDateKey(now);
  quickPicksLabel.textContent = forToday ? `Quick picks · it's ${formatTime(toTimeKey(now))}` : "Quick picks";
  quickPicksList.replaceChildren(
    ...quickTimePicks(dueInput.value, now, quickTimes).map((pick) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-pick";
      button.dataset.due = pick.due;
      button.dataset.time = pick.time;
      button.textContent = pick.label;
      if (pick.label === "In 1 hour") button.title = formatTime(pick.time);
      button.addEventListener("click", () => {
        dueInput.value = pick.due;
        updateBusyWeekNote();
        taskTime.write(pick.time);
        highlightChosenPick();
        renderOptionSummaries();
      });
      return button;
    }),
  );
  highlightChosenPick();
}

// The reminder pills and the Repeat menu in the add form, built once from the choices in tasks.js.
reminderOptions.append(
  ...REMINDER_OFFSETS.map(({ minutes, label }) => {
    const option = document.createElement("label");
    option.className = "quick-pick reminder-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(minutes);
    option.append(checkbox, label);
    return option;
  }),
);
repeatSelect.append(...REPEAT_OPTIONS.map(({ id, label }) => new Option(label, id)));

// The Repeats menu and its weekday pills (Sunday first, like the calendar).
repeatsSelect.append(...TASK_REPEAT_OPTIONS.map(({ id, label }) => new Option(label, id)));
repeatWeekdays.append(
  ...weekDays(startOfWeek(toDateKey(new Date()))).map((dateKey) => {
    const option = document.createElement("label");
    option.className = "quick-pick reminder-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(parseDateKey(dateKey).getDay());
    option.append(checkbox, formatDay(dateKey, { weekday: "short" }));
    return option;
  }),
);

// How long a task will take, as one plain menu; picking a length shows when to start.
estimateSelect.append(
  ...ESTIMATE_OPTIONS.map(({ minutes, label }) => {
    const option = new Option(minutes === 0 ? "How long will it take? (optional)" : label, String(minutes));
    option.defaultSelected = minutes === 0;
    return option;
  }),
);

// The group picker in the task form: one pill per group, plus making a new group right there.
function chosenGroupId() {
  return groupOptions.querySelector("input:checked")?.value ?? "";
}

function renderGroupOptions(selectedId) {
  const known = groups.some((group) => group.id === selectedId) ? selectedId : "";
  const pill = (value, label, color) => {
    const option = document.createElement("label");
    option.className = "quick-pick reminder-option";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "group";
    radio.value = value;
    radio.checked = value === known;
    if (color !== null) option.append(radio, groupDot(color), label);
    else option.append(radio, label);
    return option;
  };
  groupOptions.replaceChildren(
    pill("", "No group", null),
    ...groups.map((group) => {
      const wrapper = document.createElement("span");
      wrapper.className = "group-pick";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "group-delete";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Delete the ${group.name} group`);
      remove.addEventListener("click", () => deleteGroup(group));
      wrapper.append(pill(group.id, group.name, group.color), remove);
      return wrapper;
    }),
  );
  renderNewGroupColors();
}

function renderNewGroupColors() {
  const suggested = nextGroupColor(groups);
  newGroupColors.replaceChildren(
    ...Array.from({ length: COURSE_COLOR_COUNT }, (_, color) => {
      const option = document.createElement("label");
      option.className = "color-dot";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "new-group-color";
      radio.value = String(color);
      radio.checked = color === suggested;
      radio.setAttribute("aria-label", `Color ${color + 1}`);
      option.append(radio, groupDot(color));
      return option;
    }),
  );
}

function persistGroups() {
  try {
    saveGroups(localStorage, groups);
  } catch {
    showStorageError("Couldn't save your groups in this browser. Changes will be lost when you close the page.");
  }
}

function addNewGroup() {
  const error = groupNameError(newGroupName.value, groups);
  groupMessage.textContent = error ?? "";
  if (error) {
    newGroupName.focus();
    return;
  }
  const color = Number(newGroupColors.querySelector("input:checked").value);
  const group = createGroup(newGroupName.value, color);
  groups.push(group);
  persistGroups();
  newGroupName.value = "";
  renderGroupOptions(group.id);
  renderOptionSummaries();
}

// Tasks in a deleted group stay, and go back to their class color.
function deleteGroup(group) {
  const selected = chosenGroupId();
  groups = groups.filter((other) => other.id !== group.id);
  for (const task of tasks) {
    if (task.groupId === group.id) task.groupId = "";
  }
  persistGroups();
  persist();
  render();
  renderGroupOptions(selected === group.id ? "" : selected);
  renderOptionSummaries();
}

document.getElementById("add-group").addEventListener("click", addNewGroup);
// Enter in the new group's name adds the group rather than saving the whole task.
newGroupName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addNewGroup();
  }
});

// A color for one task, like an exam that should stand out from the rest of its group.
taskColorOptions.append(
  ...[null, ...Array.from({ length: COURSE_COLOR_COUNT }, (_, color) => color)].map((color) => {
    const option = document.createElement("label");
    option.className = color === null ? "color-dot no-custom-color" : "color-dot";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "task-color";
    radio.value = color === null ? "" : String(color);
    radio.defaultChecked = color === null;
    radio.setAttribute("aria-label", color === null ? "Same as group" : `Color ${color + 1}`);
    if (color === null) option.append(radio, "Same as group");
    else option.append(radio, groupDot(color));
    return option;
  }),
);

function chosenCustomColor() {
  const { value } = taskColorOptions.querySelector("input:checked");
  return value === "" ? null : Number(value);
}

function chosenEstimate() {
  return Number(estimateSelect.value);
}

function isWeeklyRepeat() {
  return repeatsSelect.value === "weekly" || repeatsSelect.value === "biweekly";
}

// Weekly repeats start out on the due date's weekday; the other days can be added.
function showRepeatDetails() {
  repeatDetails.hidden = repeatsSelect.value === "none";
  repeatWeekdays.hidden = !isWeeklyRepeat();
  const checkboxes = [...repeatWeekdays.querySelectorAll("input")];
  if (isWeeklyRepeat() && !checkboxes.some((checkbox) => checkbox.checked) && dueInput.value) {
    const dueWeekday = String(parseDateKey(dueInput.value).getDay());
    for (const checkbox of checkboxes) checkbox.checked = checkbox.value === dueWeekday;
  }
}

function chosenRepeat() {
  const weekdays = [...repeatWeekdays.querySelectorAll("input:checked")].map((checkbox) => Number(checkbox.value));
  return { repeats: repeatsSelect.value, weekdays, until: untilInput.value };
}

repeatsSelect.addEventListener("change", showRepeatDetails);

function checkedLabels(container) {
  return [...container.querySelectorAll("input:checked")].map((checkbox) => checkbox.parentElement.textContent);
}

// The closed Repeats and Reminders rows show what is chosen: "Every week on Tue, Thu", "1 day, 1 hour before".
// The task form's Steps: a row per step (name, day, ×), and + Add step.
function renderStepRows() {
  stepRows.replaceChildren(
    ...formSteps.map((step, index) => {
      const row = document.createElement("li");
      row.className = "step-row";
      const name = document.createElement("input");
      name.type = "text";
      name.value = step.name;
      name.placeholder = "Like Outline or Draft";
      name.maxLength = 80;
      name.setAttribute("aria-label", `Step ${index + 1} name`);
      name.addEventListener("input", () => {
        step.name = name.value;
      });
      const day = document.createElement("input");
      day.type = "date";
      day.value = step.date;
      if (dueInput.value) day.max = dueInput.value;
      day.setAttribute("aria-label", `Step ${index + 1} day`);
      day.addEventListener("change", () => {
        step.date = day.value;
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button step-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove step ${index + 1}`);
      remove.addEventListener("click", () => {
        formSteps.splice(index, 1);
        renderStepRows();
        renderOptionSummaries();
      });
      if (step.done) row.classList.add("done");
      row.append(name, day, remove);
      return row;
    }),
  );
  addStepButton.disabled = formSteps.length >= MAX_STEPS;
  addStepButton.textContent = formSteps.length >= MAX_STEPS ? `Up to ${MAX_STEPS} steps` : "+ Add step";
  // Suggestions are just a starting point, offered quietly while there are no steps yet.
  suggestStepsButton.hidden = formSteps.length > 0;
}

suggestStepsButton.addEventListener("click", () => {
  const todayKey = toDateKey(new Date());
  if (!nameInput.value.trim() || !dueInput.value) {
    showFormMessage("Type the task's name and due date first, so the steps fit it.");
    return;
  }
  const suggested = suggestSteps({ name: nameInput.value, due: dueInput.value, estimateMinutes: chosenEstimate() }, todayKey);
  formSteps = suggested.map((step) => ({ id: crypto.randomUUID(), ...step, done: false }));
  renderStepRows();
  renderOptionSummaries();
  showFormMessage("Here are some steps to start from. Change any name or day, remove any with ×, then Save.", { info: true });
  stepRows.querySelector("input").focus();
});

addStepButton.addEventListener("click", () => {
  const todayKey = toDateKey(new Date());
  formSteps.push({ id: crypto.randomUUID(), name: "", date: nextStepDate(formSteps, dueInput.value || todayKey, todayKey), done: false });
  renderStepRows();
  renderOptionSummaries();
  stepRows.lastElementChild.querySelector("input").focus();
});

function renderOptionSummaries() {
  const group = groups.find((other) => other.id === chosenGroupId());
  const customColor = chosenCustomColor();
  const summaryColor = customColor ?? group?.color;
  const summaryText = [group?.name ?? "No group", customColor === null ? "" : "its own color"].filter(Boolean).join(" · ");
  groupSummary.replaceChildren(...(summaryColor === undefined ? [] : [groupDot(summaryColor)]), summaryText);

  const estimateMinutes = chosenEstimate();
  const startText = dueInput.value ? describeStart({ due: dueInput.value, estimateMinutes, done: false }, toDateKey(new Date())) : "";
  estimateStart.hidden = !(estimateMinutes && startText);
  estimateStart.textContent = startText;

  const { repeats, until } = chosenRepeat();
  if (repeats === "none") {
    repeatsSummary.textContent = "Doesn't repeat";
  } else {
    const label = TASK_REPEAT_OPTIONS.find((option) => option.id === repeats).label;
    const days = isWeeklyRepeat() ? ` on ${checkedLabels(repeatWeekdays).join(", ")}` : "";
    const end = until ? ` until ${formatDay(until, { month: "short", day: "numeric" })}` : "";
    repeatsSummary.textContent = `${label}${days}${end}`;
  }

  const reminderTimes = checkedLabels(reminderOptions);
  const reminderRepeat = REPEAT_OPTIONS.find((option) => option.id === repeatSelect.value);
  const parts = [];
  if (reminderTimes.length > 0) parts.push(`${reminderTimes.join(", ")} before`);
  if (reminderRepeat.id !== "none") parts.push(reminderRepeat.label);
  remindersSummary.textContent = parts.length > 0 ? parts.join(" · ") : "No reminders";

  const doneSteps = formSteps.filter((step) => step.done).length;
  stepsSummary.textContent =
    formSteps.length === 0
      ? "Break into steps"
      : `${formSteps.length} step${formSteps.length === 1 ? "" : "s"}${doneSteps ? ` · ${doneSteps} done` : ""}`;
}

form.addEventListener("change", renderOptionSummaries);

function chosenReminders() {
  return [...reminderOptions.querySelectorAll("input:checked")].map((checkbox) => Number(checkbox.value));
}

// Editing your quick-pick times. The same editor appears under the picks in the task form and in Settings.
const quickPicksEditor = document.getElementById("quick-picks-editor");
const editQuickPicksButton = document.getElementById("edit-quick-picks");
const quickTimeEditors = [];

function setUpQuickTimesEditor({ listId, choiceId, addId, messageId }) {
  const list = document.getElementById(listId);
  const choice = document.getElementById(choiceId);
  const message = document.getElementById(messageId);

  // The menu starts at 7 AM (and comes back there when the form resets) instead of midnight.
  choice.append(...timeChoices("", new Date()).map(({ time, label }) => new Option(label, time, time === "07:00", time === "07:00")));

  function render() {
    list.replaceChildren(
      ...quickTimes.map((time) => {
        const item = document.createElement("span");
        item.className = "quick-pick quick-time";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "group-delete";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remove ${quickPickLabel(time)}`);
        remove.addEventListener("click", () => {
          message.textContent = "";
          if (quickTimes.length === 1) {
            message.textContent = "Keep at least one quick-pick time.";
            return;
          }
          saveQuickTimes(quickTimes.filter((other) => other !== time));
        });
        item.append(quickPickLabel(time), remove);
        return item;
      }),
    );
  }

  document.getElementById(addId).addEventListener("click", () => {
    const time = choice.value;
    message.textContent = "";
    if (quickTimes.includes(time)) {
      message.textContent = `${quickPickLabel(time)} is already one of your quick picks.`;
    } else if (quickTimes.length >= 6) {
      message.textContent = "You can have up to 6. Remove one first.";
    } else {
      saveQuickTimes([...quickTimes, time]);
    }
  });

  const editor = { render, clearMessage: () => (message.textContent = "") };
  quickTimeEditors.push(editor);
  return editor;
}

const formQuickTimes = setUpQuickTimesEditor({
  listId: "quick-times",
  choiceId: "quick-time-choice",
  addId: "add-quick-time",
  messageId: "quick-times-message",
});
const settingsQuickTimes = setUpQuickTimesEditor({
  listId: "settings-quick-times",
  choiceId: "settings-quick-time-choice",
  addId: "settings-add-quick-time",
  messageId: "settings-quick-times-message",
});

function loadQuickTimes() {
  try {
    quickTimes = cleanQuickTimes(JSON.parse(localStorage.getItem(QUICK_TIMES_KEY) ?? "null"));
  } catch {
    quickTimes = cleanQuickTimes(null);
  }
}

function saveQuickTimes(times) {
  quickTimes = cleanQuickTimes(times);
  try {
    localStorage.setItem(QUICK_TIMES_KEY, JSON.stringify(quickTimes));
  } catch {
    // The new picks still work until the page closes.
  }
  for (const editor of quickTimeEditors) editor.render();
  renderQuickPicks();
}

editQuickPicksButton.addEventListener("click", () => {
  quickPicksEditor.hidden = !quickPicksEditor.hidden;
  editQuickPicksButton.textContent = quickPicksEditor.hidden ? "Edit" : "Done";
  editQuickPicksButton.setAttribute("aria-expanded", String(!quickPicksEditor.hidden));
  formQuickTimes.clearMessage();
  formQuickTimes.render();
});

function closeQuickTimesEditor() {
  quickPicksEditor.hidden = true;
  editQuickPicksButton.textContent = "Edit";
  editQuickPicksButton.setAttribute("aria-expanded", "false");
}

// Switches the form between a task (due date and time, reminders, estimate) and an event
// (a date with a start and end time, or all day).
const kindSwitch = document.getElementById("kind-switch");
const kindOptions = [...kindSwitch.querySelectorAll("[data-kind]")];
const dueWord = document.getElementById("due-word");
const taskTimeGroup = document.getElementById("task-time");
const taskQuickPicks = document.getElementById("task-quick-picks");
const eventWhen = document.getElementById("event-when");
const eventTimesLine = eventWhen.querySelector(".when-line");
const eventAllDay = document.getElementById("event-all-day");
const deleteEventButton = document.getElementById("delete-event");
const eventReminderRow = document.getElementById("event-reminder-row");
const eventReminderSelect = document.getElementById("event-reminder");
const eventReminderOptions = document.getElementById("event-reminder-options");

// The reminder every event gets unless it says otherwise, chosen in Settings → Reminders.
function defaultEventReminder() {
  try {
    return cleanEventReminder(localStorage.getItem(EVENT_REMINDER_KEY) ?? DEFAULT_EVENT_REMINDER);
  } catch {
    return DEFAULT_EVENT_REMINDER;
  }
}

function reminderLabel(id) {
  return EVENT_REMINDER_OPTIONS.find((option) => option.id === id).label;
}

// The event form's menu: the Settings default first, then every choice.
function fillEventReminderMenu(chosen) {
  const defaultOption = new Option(`${reminderLabel(defaultEventReminder())} (your default)`, "default");
  eventReminderSelect.replaceChildren(
    defaultOption,
    ...EVENT_REMINDER_OPTIONS.map((option) => new Option(option.id === "none" ? "No reminder" : `Remind me ${option.label.toLowerCase()}`, option.id)),
  );
  eventReminderSelect.value = chosen;
}

// A row of choices on a Settings page, saved under `key`, with the current one pressed.
function renderSettingChoices(container, options, key, chosen, onChoose) {
  container.replaceChildren(
    ...options.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "settings-option";
      button.setAttribute("aria-pressed", String(option.id === chosen));
      const name = document.createElement("span");
      name.className = "settings-option-name";
      name.textContent = option.label;
      button.append(name);
      button.addEventListener("click", () => {
        try {
          localStorage.setItem(key, option.id);
        } catch {
          // The choice still applies until the page closes.
        }
        onChoose(option);
      });
      return button;
    }),
  );
}

function renderEventReminderSettings() {
  renderSettingChoices(eventReminderOptions, EVENT_REMINDER_OPTIONS, EVENT_REMINDER_KEY, defaultEventReminder(), (option) => {
    renderEventReminderSettings();
    if (option.id !== "none" && notificationsSupported() && Notification.permission === "default") {
      Notification.requestPermission();
    }
    showToast(option.id === "none" ? "Events won't remind you." : `Events will remind you ${option.label.toLowerCase()}.`);
  });
}
renderEventReminderSettings();

// Getting to events with a location: walk, bike, or drive.
const eventLocationRow = document.getElementById("event-location-row");
const eventLocationInput = document.getElementById("event-location");
const travelModesGroup = document.getElementById("travel-modes");
const travelModeOptions = document.getElementById("travel-mode-options");
// The form's choice: "default" (whatever Settings says) until a button is clicked.
let chosenTravelMode = "default";
// The place picked from the suggestions, or null while the location is just typed text.
let chosenPlace = null;
const placeSuggestions = document.getElementById("place-suggestions");
const placeChosen = document.getElementById("place-chosen");
const SUGGEST_DELAY_MS = 300;
let suggestTimer;
// Only the newest search's answer is shown, even if an older one comes back later.
let suggestRequest = 0;

function defaultTravelMode() {
  try {
    return cleanTravelMode(localStorage.getItem(TRAVEL_MODE_KEY) ?? DEFAULT_TRAVEL_MODE);
  } catch {
    return DEFAULT_TRAVEL_MODE;
  }
}

function renderTravelModes() {
  const shown = chosenTravelMode === "default" ? defaultTravelMode() : chosenTravelMode;
  travelModesGroup.hidden = !chosenPlace;
  travelModesGroup.replaceChildren(
    ...TRAVEL_MODES.map((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-pick";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(mode.id === shown));
      button.setAttribute("aria-pressed", String(mode.id === shown));
      button.textContent = mode.label;
      button.addEventListener("click", () => {
        chosenTravelMode = mode.id;
        renderTravelModes();
      });
      return button;
    }),
  );
}
// Shows the picked place under the box, with Walk / Bike / Drive; or nothing for typed text.
function showChosenPlace(place) {
  chosenPlace = place;
  placeChosen.hidden = !place;
  placeChosen.textContent = place ? `📍 ${[place.name, place.address].filter(Boolean).join(" · ")}` : "";
  renderTravelModes();
}

function renderPlaceSuggestions(places) {
  placeSuggestions.replaceChildren(
    ...places.map((place) => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = "place-choice";
      choice.setAttribute("role", "option");
      const name = document.createElement("span");
      name.className = "place-choice-name";
      name.textContent = place.name;
      const address = document.createElement("span");
      address.className = "place-choice-address";
      address.textContent = place.address;
      choice.append(name, address);
      const pick = () => {
        eventLocationInput.value = place.name;
        placeSuggestions.hidden = true;
        pickedPlace(place);
        showChosenPlace(place);
      };
      // Picked on mouse down, like the time list, so Safari can't close the list first.
      choice.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        pick();
      });
      choice.addEventListener("click", pick);
      return choice;
    }),
  );
  placeSuggestions.hidden = places.length === 0;
}

eventLocationInput.addEventListener("input", () => {
  showChosenPlace(null);
  clearTimeout(suggestTimer);
  const text = eventLocationInput.value.trim();
  if (text.length < 3) {
    placeSuggestions.hidden = true;
    return;
  }
  suggestTimer = setTimeout(async () => {
    const request = ++suggestRequest;
    try {
      const places = await suggestPlaces(text);
      if (request === suggestRequest) renderPlaceSuggestions(places);
    } catch {
      // Without suggestions the location is kept as typed, with the usual reminder.
      if (request === suggestRequest) placeSuggestions.hidden = true;
    }
  }, SUGGEST_DELAY_MS);
});
eventLocationInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !placeSuggestions.hidden) {
    event.preventDefault();
    placeSuggestions.hidden = true;
  }
});
placeSuggestions.addEventListener("mousedown", (event) => event.preventDefault());
for (const area of [eventLocationInput, placeSuggestions]) {
  area.addEventListener("focusout", (event) => {
    if (!eventLocationInput.contains(event.relatedTarget) && !placeSuggestions.contains(event.relatedTarget)) {
      placeSuggestions.hidden = true;
    }
  });
}

function renderTravelModeSettings() {
  renderSettingChoices(travelModeOptions, TRAVEL_MODES, TRAVEL_MODE_KEY, defaultTravelMode(), (mode) => {
    renderTravelModeSettings();
    showToast(`Trips to events will be worked out for a ${mode.trip}.`);
  });
}
renderTravelModeSettings();

const workloadOptions = document.getElementById("workload-options");

function renderWorkloadSettings() {
  renderSettingChoices(workloadOptions, WORKLOAD_OPTIONS, WORKLOAD_KEY, chosenWorkload(), (option) => {
    renderWorkloadSettings();
    render();
    showToast(`Workload set to ${option.label.split(":")[0].toLowerCase()}. Your semester's busy weeks are updated.`);
  });
}
renderWorkloadSettings();

function setFormKind(kind) {
  formKind = kind;
  const isEvent = kind === "event";
  const editing = editingTaskId !== null || editingEventId !== null;
  for (const option of kindOptions) option.setAttribute("aria-checked", String(option.dataset.kind === kind));
  addDialog.dataset.kind = kind;
  addDialogTitle.textContent = `${editing ? "Change" : "New"} ${kind}`;
  addSubmitButton.textContent = editing ? "Save changes" : "Save";
  nameInput.placeholder = isEvent ? "Add event name" : "Add task name";
  nameInput.setAttribute("aria-label", isEvent ? "Event name" : "Task name");
  dueWord.textContent = isEvent ? "On" : "Due";
  dueInput.setAttribute("aria-label", isEvent ? "Date" : "Due date");
  taskTimeGroup.hidden = isEvent;
  taskQuickPicks.hidden = isEvent;
  taskTimeList.hidden = true;
  eventTimeList.hidden = true;
  eventWhen.hidden = !isEvent;
  eventTimesLine.hidden = eventAllDay.checked;
  showNextDayNote();
  remindersSection.hidden = isEvent;
  stepsSection.hidden = isEvent;
  notesSection.hidden = isEvent;
  weightSection.hidden = isEvent;
  estimateSection.hidden = isEvent;
  eventReminderRow.hidden = !isEvent;
  eventLocationRow.hidden = !isEvent;
  // New tasks and events can repeat (a class every Mon, Wed, Fri). Changing one copy changes just
  // that copy, so the repeat itself can't be changed then.
  repeatsSection.hidden = editing;
  document.getElementById("until-default").textContent = isEvent ? "(optional, otherwise 16 weeks)" : "(optional, otherwise a year)";
  updateBusyWeekNote();
}

for (const option of kindOptions) {
  option.addEventListener("click", () => {
    const kind = option.dataset.kind;
    if (kind === formKind) return;
    // A time already picked carries over, so clicking an hour then Event starts the event then.
    if (kind === "event" && !eventStart.read().time && taskTime.read().time) {
      eventStart.write(taskTime.read().time);
      eventEnd.write(clockAfter(taskTime.read().time, 60, { wrap: true }));
    }
    if (kind === "task" && !taskTime.read().time && eventStart.read().time) taskTime.write(eventStart.read().time);
    showFormMessage("");
    setFormKind(kind);
    nameInput.focus();
  });
}

eventAllDay.addEventListener("change", () => {
  eventTimesLine.hidden = eventAllDay.checked;
  eventTimeList.hidden = true;
  showNextDayNote();
});

// Asks before saving something that looks like a copy of what's already there. Returns true if it
// asked (so saving stops for now); after "Add anyway" the form saves again and this lets it through.
const duplicateDialog = document.getElementById("duplicate-dialog");
let duplicateAllowed = false;
let openDuplicate = () => {};

function askAboutDuplicate(question, openExisting) {
  if (duplicateAllowed) {
    duplicateAllowed = false;
    return false;
  }
  document.getElementById("duplicate-title").textContent = question;
  openDuplicate = openExisting;
  duplicateDialog.showModal();
  return true;
}

document.getElementById("duplicate-add").addEventListener("click", () => {
  duplicateDialog.close();
  duplicateAllowed = true;
  form.requestSubmit();
});
document.getElementById("duplicate-open").addEventListener("click", () => {
  duplicateDialog.close();
  addDialog.close();
  openDuplicate();
});
document.getElementById("duplicate-cancel").addEventListener("click", () => duplicateDialog.close());

function openAddDialog(dateKey) {
  closeQuickTimesEditor();
  editingTaskId = null;
  editingEventId = null;
  form.reset();
  kindSwitch.hidden = false;
  focusFromEditButton.hidden = true;
  deleteEventButton.hidden = true;
  eventStart.write("");
  eventEnd.write("");
  fillEventReminderMenu("default");
  chosenTravelMode = "default";
  placeSuggestions.hidden = true;
  showChosenPlace(null);
  setFormKind("task");
  repeatsSection.open = false;
  remindersSection.open = false;
  stepsSection.open = false;
  formSteps = [];
  renderStepRows();
  renderNotesLinks();
  groupSection.open = false;
  groupMessage.textContent = "";
  renderGroupOptions("");
  taskTime.write("");
  showFormMessage("");
  dueInput.value = dateKey;
  updateBusyWeekNote();
  showRepeatDetails();
  renderOptionSummaries();
  renderQuickPicks();
  addDialog.showModal();
  nameInput.focus();
}

// The same form as New task, filled in with the task so any part of it can be changed.
function openEditDialog(task, { showSteps = false } = {}) {
  closeQuickTimesEditor();
  editingTaskId = task.id;
  editingEventId = null;
  form.reset();
  kindSwitch.hidden = true;
  deleteEventButton.hidden = true;
  setFormKind("task");
  focusFromEditButton.hidden = task.done;
  showFormMessage(task.seriesId ? "This is one of a repeating task. Changes apply to this one only." : "", {
    info: true,
  });
  nameInput.value = task.name;
  courseInput.value = task.course;
  dueInput.value = task.due;
  updateBusyWeekNote();
  taskTime.write(task.time);
  for (const checkbox of reminderOptions.querySelectorAll("input")) {
    checkbox.checked = task.reminders.includes(Number(checkbox.value));
  }
  repeatSelect.value = task.repeat;
  estimateSelect.value = String(task.estimateMinutes);
  remindersSection.open = false;
  formSteps = (task.steps ?? []).map((step) => ({ ...step }));
  stepsSection.open = showSteps;
  renderStepRows();
  notesInput.value = task.notes ?? "";
  renderNotesLinks();
  weightInput.value = task.weight ?? "";
  groupSection.open = false;
  groupMessage.textContent = "";
  renderGroupOptions(task.groupId);
  taskColorOptions.querySelector(`input[value="${task.customColor ?? ""}"]`).checked = true;
  renderOptionSummaries();
  renderQuickPicks();
  addDialog.showModal();
  nameInput.focus();
}

// The same form, filled in with one of your events.
function openEditEvent(event) {
  closeQuickTimesEditor();
  editingTaskId = null;
  editingEventId = event.id;
  form.reset();
  kindSwitch.hidden = true;
  focusFromEditButton.hidden = true;
  deleteEventButton.hidden = false;
  showFormMessage("");
  nameInput.value = event.name;
  courseInput.value = event.course;
  dueInput.value = event.date;
  eventStart.write(event.start);
  eventEnd.write(event.end);
  eventAllDay.checked = !event.start;
  fillEventReminderMenu(event.reminder);
  eventLocationInput.value = event.location;
  chosenTravelMode = event.travelMode;
  placeSuggestions.hidden = true;
  showChosenPlace(event.place);
  setFormKind("event");
  showFormMessage(event.seriesId ? "This is one of a repeating event. Changes apply to this one only." : "", { info: true });
  groupSection.open = false;
  groupMessage.textContent = "";
  renderGroupOptions(event.groupId);
  taskColorOptions.querySelector(`input[value="${event.customColor ?? ""}"]`).checked = true;
  renderOptionSummaries();
  addDialog.showModal();
  nameInput.focus();
}

// "Tuesday, Nov 10, 3:00 PM – 5:00 PM" or "Tuesday, Nov 10, all day"
function formatEventWhen(event) {
  const day = formatDay(event.date, { weekday: "long", month: "short", day: "numeric" });
  if (!event.start) return `${day}, all day`;
  return `${day}, ${formatTime(event.start)} – ${formatTime(event.end)}${endsNextDay(event) ? " the next day" : ""}`;
}

function saveEventFromForm() {
  const allDay = eventAllDay.checked;
  const start = allDay ? { time: "" } : eventStart.read();
  const end = allDay ? { time: "" } : eventEnd.read();
  if (start.error || end.error) {
    showFormMessage(start.error ?? end.error);
    (start.error ? eventStart : eventEnd).focus();
    return;
  }
  const input = {
    name: nameInput.value,
    course: courseInput.value,
    date: dueInput.value,
    start: start.time,
    end: end.time,
    allDay,
    groupId: chosenGroupId(),
    customColor: chosenCustomColor(),
    reminder: eventReminderSelect.value,
    location: eventLocationInput.value,
    travelMode: chosenTravelMode,
    place: chosenPlace,
  };
  const error = validateEvent(input);
  if (error) {
    showFormMessage(error);
    if (!input.name.trim()) nameInput.focus();
    return;
  }
  const edited = events.find((other) => other.id === editingEventId);
  const repeat = chosenRepeat();
  if (!edited) {
    const repeatProblem = repeatError(input.date, repeat);
    if (repeatProblem) {
      showFormMessage(repeatProblem);
      return;
    }
  }
  const existing = edited ? null : findDuplicateEvent(events, input);
  if (existing && askAboutDuplicate(`You already have “${existing.name}” on ${formatEventWhen(existing)}. Add another one?`, () => openEditEvent(existing))) {
    return;
  }
  const newEvents = edited ? [] : createRepeatingEvents(input, repeat);
  const saved = edited ? Object.assign(edited, updateEvent(edited, input)) : newEvents[0];
  events.push(...newEvents);
  persistEvents();
  forgetTrip(saved.id);
  addDialog.close();
  if (view === "month") render();
  else showDate(saved.date);
  if (newEvents.length > 1) {
    const repeatLabel = TASK_REPEAT_OPTIONS.find((option) => option.id === repeat.repeats).label.toLowerCase();
    const lastDate = formatDay(newEvents.at(-1).date, { month: "short", day: "numeric", year: "numeric" });
    showToast(`Added “${saved.name}” ${repeatLabel}, ${newEvents.length} times through ${lastDate}.`);
  } else {
    showToast(`${edited ? "Saved" : "Added"} “${saved.name}” for ${formatEventWhen(saved)}.`);
  }
  if (eventReminderSelect.value !== "none" && notificationsSupported() && Notification.permission === "default") {
    Notification.requestPermission().then(render);
  }
  if (saved.place) findTrip(saved);
  else if (saved.location && saved.start) {
    showToast(`No travel time for “${saved.location}”: it wasn't picked from the suggestions. You'll get your usual reminder.`, {
      seconds: 8,
    });
  }
}

// Trip times for events starting soon, by event id, as { minutes, mode, checkedAt }.
const tripEstimates = new Map();
// Rechecks a trip after this long, since you may have moved.
const TRIP_RECHECK_MS = 10 * 60_000;
// Events whose "Leave now" already showed, kept for this tab so a reload doesn't repeat it.
const LEFT_KEY = "due-leave-reminded";
let checkingTrips = false;

function leaveReminded() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(LEFT_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markLeaveReminded(eventId) {
  try {
    sessionStorage.setItem(LEFT_KEY, JSON.stringify([...leaveReminded(), eventId]));
  } catch {
    // It may show once more after a reload, which is harmless.
  }
}

function forgetTrip(eventId) {
  tripEstimates.delete(eventId);
  try {
    sessionStorage.setItem(LEFT_KEY, JSON.stringify([...leaveReminded()].filter((id) => id !== eventId)));
  } catch {
    // See markLeaveReminded.
  }
}

async function checkTrip(event, here) {
  const mode = travelModeOf(event, defaultTravelMode());
  const minutes = await tripMinutes(here, event.place, mode.id);
  tripEstimates.set(event.id, { minutes, mode: mode.id, checkedAt: Date.now() });
  return { minutes, mode };
}

// How long to wait for the browser's location after saving, before saying it didn't come.
const FIND_TRIP_LIMIT_MS = 60_000;

// Right after saving an event with a picked place: say how long the trip is from here. It always
// ends with a message, even if the browser never answers (for example, a location question that
// was never shown or answered).
async function findTrip(event) {
  if (!event.start) return;
  const finding = setTimeout(() => showToast("Finding where you are to work out the trip…", { seconds: 60 }), 2500);
  const tooLong = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Your browser never shared your location. If it asked, click Allow, then save the event again.")),
      FIND_TRIP_LIMIT_MS,
    ),
  );
  try {
    const { minutes, mode } = await Promise.race([currentPosition().then((here) => checkTrip(event, here)), tooLong]);
    showToast(`${event.place.name} · about ${minutes} min ${mode.trip} from where you are.`, { seconds: 6 });
  } catch (error) {
    showToast(`${error.message} You'll get your usual reminder for “${event.name}”.`, { seconds: 8 });
  } finally {
    clearTimeout(finding);
  }
}

// Keeps trip times current for events with a place starting within 2 hours.
async function updateTrips(now) {
  const due = events.filter((event) => {
    const known = tripEstimates.get(event.id);
    const fresh = known && known.mode === travelModeOf(event, defaultTravelMode()).id && now - known.checkedAt < TRIP_RECHECK_MS;
    return needsTravelCheck(event, now) && !fresh;
  });
  if (due.length === 0 || checkingTrips) return;
  checkingTrips = true;
  try {
    const here = await currentPosition();
    for (const event of due) await checkTrip(event, here);
  } catch {
    // Without a trip time, the event's usual reminder is used instead.
  } finally {
    checkingTrips = false;
  }
}

// Puts deleted events back (any that aren't already back).
function restoreEvents(deleted) {
  const ids = new Set(events.map((event) => event.id));
  events.push(...deleted.filter((event) => !ids.has(event.id)));
  persistEvents();
  render();
}

// A repeating event first asks which copies to delete, like a repeating task.
let eventToDelete = null;

function deleteRepeatingEvent(event, scope) {
  if (scope === "cancel") return;
  const before = events;
  events = deleteEventFromSeries(events, event, scope);
  const deleted = before.filter((other) => !events.includes(other));
  persistEvents();
  render();
  const day = formatDay(event.date, { weekday: "short", month: "short", day: "numeric" });
  showToast(scope === "one" ? `Deleted “${event.name}” on ${day}.` : `Deleted ${deleted.length} of “${event.name}”.`, {
    undo: () => restoreEvents(deleted),
  });
}

deleteEventButton.addEventListener("click", () => {
  const deleted = events.find((event) => event.id === editingEventId);
  addDialog.close();
  if (!deleted) return;
  if (deleted.seriesId) {
    eventToDelete = deleted;
    document.getElementById("delete-title").textContent = `Delete “${deleted.name}”`;
    document.getElementById("delete-details").textContent = "This event repeats. Which ones should be deleted?";
    deleteDialog.returnValue = "cancel";
    deleteDialog.showModal();
    return;
  }
  events = events.filter((event) => event.id !== deleted.id);
  persistEvents();
  render();
  showToast(`Deleted “${deleted.name}”.`, { undo: () => restoreEvents([deleted]) });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (formKind === "event") {
    saveEventFromForm();
    return;
  }
  const typedTime = taskTime.read();
  if (typedTime.error) {
    showFormMessage(typedTime.error);
    taskTime.focus();
    return;
  }
  const input = {
    name: nameInput.value,
    course: courseInput.value,
    due: dueInput.value,
    time: typedTime.time,
    reminders: chosenReminders(),
    repeat: repeatSelect.value,
    estimateMinutes: chosenEstimate(),
    groupId: chosenGroupId(),
    customColor: chosenCustomColor(),
    steps: formSteps,
    notes: notesInput.value,
    weight: weightInput.value,
  };
  const error = validateTask(input);
  if (error) {
    showFormMessage(error);
    (input.name.trim() ? dueInput : nameInput).focus();
    return;
  }
  const stepProblem = stepsError(formSteps, input.due);
  if (stepProblem) {
    showFormMessage(stepProblem);
    stepsSection.open = true;
    return;
  }

  const editedTask = tasks.find((task) => task.id === editingTaskId);
  // Only a new or changed time is checked, so a missed task can still be renamed without moving it.
  const timeChanged = !editedTask || editedTask.due !== input.due || editedTask.time !== input.time;
  const pastProblem = timeChanged ? pastTimeError(input.due, input.time, new Date()) : null;
  if (pastProblem) {
    showFormMessage(pastProblem);
    taskTime.focus();
    return;
  }
  const repeat = chosenRepeat();
  if (!editedTask) {
    const repeatProblem = repeatError(input.due, repeat);
    if (repeatProblem) {
      showFormMessage(repeatProblem);
      return;
    }
    const existing = findDuplicateTask(tasks, input);
    if (existing && askAboutDuplicate(`You already have “${existing.name}”${existing.course ? ` (${existing.course})` : ""} due ${formatWhen(existing.due, existing.time)}. Add another one?`, () => openEditDialog(existing))) {
      return;
    }
  }
  const newTasks = editedTask ? [] : createRepeatingTasks(input, repeat);
  const task = editedTask ? Object.assign(editedTask, updateTask(editedTask, input)) : newTasks[0];
  tasks.push(...newTasks);
  persist();
  addDialog.close();
  // The month view stays on the month being looked at; the others jump to the task's day.
  if (view === "month") render();
  else showDate(task.due);
  if (editedTask) {
    showToast(`Saved “${task.name}” for ${formatWhen(task.due, task.time)}.`);
  } else if (newTasks.length > 1) {
    const repeatLabel = TASK_REPEAT_OPTIONS.find((option) => option.id === repeat.repeats).label.toLowerCase();
    const lastDue = formatDay(newTasks.at(-1).due, { month: "short", day: "numeric", year: "numeric" });
    showToast(`Added “${task.name}” ${repeatLabel}, ${newTasks.length} times through ${lastDue}.`);
  } else {
    showToast(`Added “${task.name}” to ${formatWhen(task.due, task.time)}.`);
  }
  // Asking here, right after the user chose reminders, is when the browser's question makes sense.
  if (hasReminders(task) && notificationsSupported() && Notification.permission === "default") {
    Notification.requestPermission().then(render);
  }
});

// Reminders: while the app is open (even in a background tab), check every 20 seconds
// for reminder moments that passed since the last check and show a notification for each task.

function notificationsSupported() {
  return "Notification" in window;
}

// Shown when a task has reminders but notifications can't be shown yet.
function renderNotifyBanner() {
  const permission = notificationsSupported() ? Notification.permission : "unsupported";
  const todayKey = toDateKey(new Date());
  const eventReminders = events.some(
    (event) => event.date >= todayKey && eventReminderOption(event, defaultEventReminder()).minutes !== null,
  );
  const needed = (tasks.some((task) => hasReminders(task) && !task.done) || eventReminders) && permission !== "granted";
  notifyBanner.hidden = !needed;
  notifyButton.hidden = permission !== "default";
  if (permission === "default") {
    notifyText.textContent = "Turn on notifications so Due Next can remind you about your tasks.";
  } else if (permission === "denied") {
    notifyText.textContent =
      "Notifications are blocked for this site. Allow them in your browser's site settings to get reminders.";
  } else {
    notifyText.textContent = "This browser can't show notifications. Reminders will appear here on the page instead.";
  }
}

notifyButton.addEventListener("click", () => Notification.requestPermission().then(render));

// A reminder on the page that stays until dismissed, so it isn't missed while looking away.
// A newer reminder for the same task replaces the older one.
function showReminderAlert(name, body, tag) {
  reminderAlerts.querySelector(`[data-tag="${CSS.escape(tag)}"]`)?.remove();
  const alert = document.createElement("li");
  alert.className = "reminder-alert";
  alert.dataset.tag = tag;
  const text = document.createElement("span");
  const nameText = document.createElement("span");
  nameText.className = "reminder-alert-name";
  nameText.textContent = `🔔 ${name}`;
  text.append(nameText, ` · ${body}`);
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "quiet-button";
  dismiss.textContent = "Got it";
  dismiss.addEventListener("click", () => alert.remove());
  alert.append(text, dismiss);
  reminderAlerts.prepend(alert);
}

// Returns true if a desktop notification was shown.
function sendNotification(title, body, tag) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  // The tag replaces an older notification for the same task instead of stacking them.
  const notification = new Notification(title, { body, tag });
  notification.addEventListener("click", () => {
    window.focus();
    notification.close();
  });
  return true;
}

function showReminder(name, body, tag) {
  showReminderAlert(name, body, tag);
  return sendNotification(`Due Next: ${name}`, body, tag);
}

function remind(task) {
  showReminder(task.name, describeReminder(task, new Date()), task.id);
}

// Checks notifications right away, asking for permission first if the browser hasn't been asked.
document.getElementById("test-notification").addEventListener("click", async () => {
  if (notificationsSupported() && Notification.permission === "default") await Notification.requestPermission();
  render();
  if (showReminder("Test notification", "Reminders are working.", "test")) {
    showFormMessage("Sent. No pop-up? Your Mac may be blocking this browser: System Settings → Notifications.", {
      info: true,
    });
  } else if (notificationsSupported() && Notification.permission === "denied") {
    showFormMessage("Notifications are blocked for this site. Allow them in your browser's site settings.");
  } else {
    showFormMessage("This browser can't show notifications, so reminders will only appear on the page.", {
      info: true,
    });
  }
});

// Reminders more than 10 minutes old (say, after the laptop slept) are skipped rather than shown late.
const STALE_REMINDER_MS = 10 * 60_000;
let lastReminderCheck = Date.now();

function checkReminders() {
  const now = Date.now();
  const from = Math.max(lastReminderCheck, now - STALE_REMINDER_MS);
  lastReminderCheck = now;
  for (const task of tasks) {
    if (remindersBetween(task, from, now).length > 0) remind(task);
  }
  const defaultReminder = defaultEventReminder();
  const alreadyLeft = leaveReminded();
  for (const event of events) {
    // With a trip time, "Leave now" takes the place of the usual reminder.
    const trip = hasTravel(event) ? tripEstimates.get(event.id) : null;
    if (trip) {
      if (!alreadyLeft.has(event.id) && timeToLeave(event, trip.minutes, now)) {
        markLeaveReminded(event.id);
        const mode = TRAVEL_MODES.find((option) => option.id === trip.mode);
        showReminder(`Leave now: ${event.name}`, describeLeaveReminder(event, trip.minutes, mode), `leave-${event.id}`);
      }
      continue;
    }
    if (eventReminderDue(event, defaultReminder, from, now)) {
      showReminder(event.name, describeEventReminder(event, new Date(now)), `event-${event.id}`);
    }
  }
  updateTrips(now);
}

// The reschedule pop-up: shown for every missed task when the app opens (one at a time),
// or for a single task from its Reschedule button in the Overdue section.

function openMissedDialog(taskIds, { single }) {
  missedQueue = [...taskIds];
  missedTotal = taskIds.length;
  missedSingle = single;
  showMissedTask();
  if (missedQueue.length > 0 && !missedDialog.open) missedDialog.showModal();
}

function currentMissedTask() {
  return tasks.find((task) => task.id === missedQueue[0]);
}

function showMissedTask() {
  // Skip tasks deleted or checked off since the queue was made.
  while (missedQueue.length > 0 && !currentMissedTask()) missedQueue.shift();
  const task = currentMissedTask();
  if (!task) {
    if (missedDialog.open) missedDialog.close();
    return;
  }

  const now = new Date();
  const position = missedTotal - missedQueue.length + 1;
  missedProgress.hidden = missedSingle || missedTotal === 1;
  missedProgress.textContent = `Missed task ${position} of ${missedTotal}`;
  missedTitle.textContent = missedSingle ? `Reschedule “${task.name}”` : `You missed “${task.name}”`;
  missedDetails.textContent = [`Due ${describeDue(task, toDateKey(now))}`, task.course].filter(Boolean).join(" · ");
  missedLaterButton.textContent = missedSingle ? "Cancel" : "Ask me later";
  // When several are waiting (say, after importing past Canvas work), they can all be cleared at once.
  missedAllDoneButton.hidden = missedSingle || missedQueue.length < 2;
  missedAllDoneButton.textContent = `✓ Mark all ${missedQueue.length} as done`;
  missedMessage.textContent = "";
  // Start from tomorrow at the task's old time; quick picks fill the boxes, and Move confirms.
  missedDueInput.value = addDays(toDateKey(now), 1);
  missedTime.write(task.time);

  // Today's quick picks, minus "No time", which would be unclear here.
  const picks = quickTimePicks(toDateKey(now), now, quickTimes).filter((pick) => pick.time !== "");
  missedPicks.replaceChildren(
    ...picks.map((pick) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-pick";
      button.dataset.due = pick.due;
      button.dataset.time = pick.time;
      button.textContent = pick.label;
      button.addEventListener("click", () => {
        missedDueInput.value = pick.due;
        missedTime.write(pick.time);
        highlightMissedPick();
      });
      return button;
    }),
  );
  highlightMissedPick();
}

function highlightMissedPick() {
  for (const button of missedPicks.children) {
    const chosen = button.dataset.due === missedDueInput.value && button.dataset.time === missedTime.read().time;
    button.setAttribute("aria-pressed", String(chosen));
  }
}

function finishMissedTask(toastText) {
  persist();
  render();
  showToast(toastText);
  missedQueue.shift();
  showMissedTask();
}

function moveMissedTask(due, time) {
  const task = currentMissedTask();
  const error = rescheduleError(due, time, new Date());
  if (error) {
    missedMessage.textContent = error;
    return;
  }
  task.due = due;
  task.time = time;
  finishMissedTask(`Moved “${task.name}” to ${formatWhen(due, time)}.`);
}

missedDueInput.addEventListener("change", highlightMissedPick);
missedForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const typedTime = missedTime.read();
  if (typedTime.error) {
    missedMessage.textContent = typedTime.error;
    missedTime.focus();
    return;
  }
  moveMissedTask(missedDueInput.value, typedTime.time);
});
document.getElementById("missed-done").addEventListener("click", () => {
  const task = currentMissedTask();
  task.done = true;
  creditCompletion(task);
  finishMissedTask(`Checked off “${task.name}”.`);
});
document.getElementById("missed-drop").addEventListener("click", () => {
  const task = currentMissedTask();
  tasks = tasks.filter((other) => other.id !== task.id);
  finishMissedTask(`Deleted “${task.name}”.`);
});
missedLaterButton.addEventListener("click", () => missedDialog.close());
missedAllDoneButton.addEventListener("click", () => {
  const waiting = missedQueue.map((id) => tasks.find((task) => task.id === id)).filter(Boolean);
  for (const task of waiting) {
    task.done = true;
    creditCompletion(task);
  }
  missedQueue = [];
  persist();
  render();
  missedDialog.close();
  showToast(`Checked off ${waiting.length} missed tasks.`);
});
missedDialog.addEventListener("click", (event) => {
  if (event.target === missedDialog) missedDialog.close();
});

// Picks are rebuilt only when the date is typed, so tapping "Tomorrow 9 AM" doesn't reshuffle them.
dueInput.addEventListener("change", renderQuickPicks);
dueInput.addEventListener("change", updateBusyWeekNote);
// Step days can't be after the due date, so their pickers follow it.
dueInput.addEventListener("change", renderStepRows);
dueInput.addEventListener("input", updateBusyWeekNote);

document.getElementById("cancel-add").addEventListener("click", () => addDialog.close());
// Clicking the dimmed backdrop outside the form closes the dialog.
addDialog.addEventListener("click", (event) => {
  if (event.target === addDialog) addDialog.close();
});

// New tasks default to today, or to the day being looked at in day view,
// or to the 1st when looking at a month that doesn't include today.
function newTaskDate() {
  const todayKey = toDateKey(new Date());
  if (view === "day") return visibleDate;
  if (view === "month" && startOfMonth(visibleDate) !== startOfMonth(todayKey)) return startOfMonth(visibleDate);
  return todayKey;
}

document.getElementById("new-task").addEventListener("click", () => openAddDialog(newTaskDate()));
document.getElementById("go-to-today").addEventListener("click", () => showDate(toDateKey(new Date())));

// Keyboard shortcuts (Olivia wanted Control, so a stray key never opens anything): Ctrl+N opens a
// new task, Ctrl+/ jumps to search, Ctrl+T goes to today. They're ignored while typing in a box and
// while a pop-up is open. Cmd+N and Cmd+T still do what the browser does on a Mac.
function isTypingIn(element) {
  return Boolean(element?.closest?.("input, textarea, select, [contenteditable='true']"));
}

document.addEventListener("keydown", (event) => {
  if (!event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (isTypingIn(event.target) || document.querySelector("dialog[open]")) return;
  if (document.body.classList.contains("signed-out")) return;
  const key = event.key.toLowerCase();
  if (key === "n") {
    event.preventDefault();
    if (mode !== "calendar") showMode("calendar");
    openAddDialog(newTaskDate());
  } else if (key === "/") {
    event.preventDefault();
    searchInput.focus();
  } else if (key === "t") {
    event.preventDefault();
    if (mode !== "calendar") showMode("calendar");
    showDate(toDateKey(new Date()));
  }
});
function movePeriod(direction) {
  if (view === "month") showDate(addMonths(visibleDate, direction));
  else if (view === "agenda") showDate(addDays(visibleDate, direction * AGENDA_DAYS));
  else showDate(addDays(visibleDate, view === "day" ? direction : direction * 7));
}

previousButton.addEventListener("click", () => movePeriod(-1));
nextButton.addEventListener("click", () => movePeriod(1));

viewSelect.addEventListener("change", () => {
  view = viewSelect.value;
  scrollDayToStart = true;
  saveViewSettings();
  render();
});
for (const button of document.querySelectorAll("[data-layout]")) {
  button.addEventListener("click", () => {
    dayLayout = button.dataset.layout;
    scrollDayToStart = true;
    saveViewSettings();
    render();
  });
}

// Focus mode: pick a length, then a full-screen countdown that notices when you leave the page,
// nudges you back after a short while, and asks if you finished when the time is up.
const focusStartDialog = document.getElementById("focus-start");
const focusLengths = document.getElementById("focus-lengths");
const focusNoTasks = document.getElementById("focus-no-tasks");
const focusTaskField = document.getElementById("focus-task-field");
const focusTaskSelect = document.getElementById("focus-task-select");
const focusLengthSection = document.getElementById("focus-length-section");
const focusScreen = document.getElementById("focus-screen");
const focusKicker = document.getElementById("focus-kicker");
const focusTaskTitle = document.getElementById("focus-task");
const focusCourse = document.getElementById("focus-course");
const focusCountdown = document.getElementById("focus-countdown");
const focusStatus = document.getElementById("focus-status");
const focusActions = document.getElementById("focus-actions");
// How long someone can be away before the nudge, so quickly checking something doesn't set it off.
const FOCUS_NUDGE_DELAY_MS = 30_000;
const EXTRA_FOCUS_MINUTES = 10;
// How long Stop must be held, so a session can't be quit on impulse.
const STOP_HOLD_MS = 3000;
// Going in and out of full screen can briefly unfocus the window, which shouldn't count as leaving.
const FULLSCREEN_SETTLE_MS = 1500;

// The running session: { task, pomodoro, timer, phase, leaves, away, nudgeTimeout, ignoreLeavesUntil }.
// phase is "focus", "break", or "ended" (a question is showing and no clock is running).
let focusSession = null;
let focusTicker;
let chimeContext = null;
let taskToFocusOn = null;

// Opened from a task, it locks in on that task; from the top bar, it asks which one.
function openFocusStart(task = null) {
  taskToFocusOn = task;
  document.getElementById("focus-start-title").textContent = task ? `Lock in on “${task.name}”` : "🔒 Lock in";
  const choices = task ? [] : unfinishedTasksSoonestFirst();
  focusTaskSelect.replaceChildren(
    ...choices.map((choice) => new Option(`${choice.name} · ${describeDue(choice, toDateKey(new Date()))}`, choice.id)),
  );
  focusTaskField.hidden = task !== null || choices.length === 0;
  focusNoTasks.hidden = task !== null || choices.length > 0;
  focusLengthSection.hidden = task === null && choices.length === 0;
  focusStartDialog.showModal();
}

function unfinishedTasksSoonestFirst() {
  const now = new Date();
  const groups = groupTasks(tasks, toDateKey(now), toTimeKey(now));
  return [...groups.overdue, ...groups.today, ...groups.week, ...groups.later];
}

document.getElementById("open-lock-in").addEventListener("click", () => openFocusStart());

focusLengths.append(
  ...FOCUS_LENGTHS.map((minutes) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "focus-length";
    button.textContent = `${minutes} min`;
    button.addEventListener("click", () => startFocus(minutes, false));
    return button;
  }),
);
const pomodoroButton = document.createElement("button");
pomodoroButton.type = "button";
pomodoroButton.className = "focus-length pomodoro";
pomodoroButton.textContent = `🍅 Pomodoro: ${POMODORO_FOCUS_MINUTES} min, then a ${POMODORO_BREAK_MINUTES}-min break`;
pomodoroButton.addEventListener("click", () => startFocus(POMODORO_FOCUS_MINUTES, true));
focusLengths.append(pomodoroButton);

document.getElementById("focus-cancel").addEventListener("click", () => focusStartDialog.close());
focusStartDialog.addEventListener("click", (event) => {
  if (event.target === focusStartDialog) focusStartDialog.close();
});

function setFocusActions(actions) {
  focusActions.replaceChildren(
    ...actions.map(({ label, primary = false, onClick, holdToConfirm = false }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = primary ? "primary-button" : "quiet-button";
      button.textContent = label;
      if (holdToConfirm) makeHoldButton(button, onClick);
      else button.addEventListener("click", onClick);
      return button;
    }),
  );
}

// A button that only acts after being pressed and held, filling up as it goes.
// Holding Space or Enter works too, for keyboard users.
function makeHoldButton(button, onConfirm) {
  let holdTimeout = null;
  button.classList.add("hold-button");
  button.style.setProperty("--hold-ms", `${STOP_HOLD_MS}ms`);
  const startHold = () => {
    if (holdTimeout !== null) return;
    button.classList.add("holding");
    focusStatus.textContent = "Keep holding to stop…";
    holdTimeout = setTimeout(onConfirm, STOP_HOLD_MS);
  };
  const cancelHold = () => {
    if (holdTimeout === null) return;
    clearTimeout(holdTimeout);
    holdTimeout = null;
    button.classList.remove("holding");
    focusStatus.textContent = "You've got this. Hold for 3 seconds if you really want to stop.";
  };
  button.addEventListener("pointerdown", startHold);
  button.addEventListener("pointerup", cancelHold);
  button.addEventListener("pointerleave", cancelHold);
  button.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      startHold();
    }
  });
  button.addEventListener("keyup", cancelHold);
  button.addEventListener("blur", cancelHold);
}

function enterFullScreen() {
  if (!focusSession) return;
  focusSession.ignoreLeavesUntil = Date.now() + FULLSCREEN_SETTLE_MS;
  focusScreen.requestFullscreen?.().catch(() => {
    // Some browsers refuse full screen; the session still fills the window.
  });
}

function exitFullScreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

document.addEventListener("fullscreenchange", () => {
  if (!focusSession) return;
  focusSession.ignoreLeavesUntil = Date.now() + FULLSCREEN_SETTLE_MS;
  if (focusSession.phase === "focus") showRunningFocus();
});

// Closing or reloading the tab during a session asks first.
window.addEventListener("beforeunload", (event) => {
  if (focusSession) event.preventDefault();
});
window.addEventListener("pagehide", recordFocusProgress);

function startFocus(minutes, pomodoro) {
  const task = taskToFocusOn ?? tasks.find((other) => other.id === focusTaskSelect.value);
  focusStartDialog.close();
  // These need a click to be allowed, and this is the click: nudges need notifications, the end chime needs sound.
  if (notificationsSupported() && Notification.permission === "default") Notification.requestPermission();
  chimeContext ??= new AudioContext();
  chimeContext.resume();

  focusSession = { task, pomodoro, timer: createTimer(minutes, Date.now()), phase: "focus", leaves: 0, away: false, nudgeTimeout: null, ignoreLeavesUntil: 0, counting: true, logEntry: null };
  focusTaskTitle.textContent = task.name;
  focusCourse.textContent = task.course;
  focusScreen.showModal();
  enterFullScreen();
  showRunningFocus();
  clearInterval(focusTicker);
  focusTicker = setInterval(tickFocus, 250);
}

function showRunningFocus() {
  const paused = focusSession.timer.runningSince === null;
  const onBreak = focusSession.phase === "break";
  focusKicker.textContent = onBreak ? "Break ☕" : paused ? "Paused" : "Focusing";
  focusStatus.textContent = onBreak ? "Stretch, get some water, rest your eyes." : "";
  setFocusActions(
    onBreak
      ? [{ label: "End break", onClick: finishBreak }]
      : [
          { label: paused ? "▶ Resume" : "⏸ Pause", primary: true, onClick: togglePause },
          { label: "Hold to stop", onClick: stopFocus, holdToConfirm: true },
          ...(document.fullscreenElement || !focusScreen.requestFullscreen
            ? []
            : [{ label: "⛶ Full screen", onClick: enterFullScreen }]),
        ],
  );
  drawCountdown();
}

function drawCountdown() {
  const text = formatCountdown(timerRemaining(focusSession.timer, Date.now()));
  focusCountdown.textContent = text;
  document.title = `${text} · ${focusSession.task.name}`;
}

function tickFocus() {
  if (!focusSession || focusSession.phase === "ended") return;
  drawCountdown();
  if (timerRemaining(focusSession.timer, Date.now()) > 0) return;
  if (focusSession.phase === "break") finishBreak();
  else finishFocus();
}

function togglePause() {
  const now = Date.now();
  const { timer } = focusSession;
  focusSession.timer = timer.runningSince === null ? resumeTimer(timer, now) : pauseTimer(timer, now);
  showRunningFocus();
}

function playChime() {
  if (!chimeContext) return;
  // Two soft rising notes.
  [523.25, 783.99].forEach((frequency, index) => {
    const start = chimeContext.currentTime + index * 0.22;
    const oscillator = chimeContext.createOscillator();
    const volume = chimeContext.createGain();
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.25, start + 0.03);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    oscillator.connect(volume).connect(chimeContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.75);
  });
}

function clearFocusNudge() {
  clearTimeout(focusSession.nudgeTimeout);
  focusSession.nudgeTimeout = null;
}

// Saves this session's time so far. It's safe to repeat: the same entry is updated, and breaks don't count.
function recordFocusProgress() {
  if (!focusSession || !focusSession.counting) return;
  const { task, timer, leaves, logEntry } = focusSession;
  const group = groups.find((other) => other.id === task.groupId);
  focusSession.logEntry = recordFocus(progress, logEntry, {
    date: toDateKey(new Date()),
    minutes: timerMinutesDone(timer, Date.now()),
    leaves,
    label: group?.name ?? (task.course || "Other"),
    color: group?.color ?? courseColorIndex(task.course),
  });
  persistProgress();
}

function finishFocus() {
  recordFocusProgress();
  focusSession.phase = "ended";
  clearFocusNudge();
  playChime();
  const { task } = focusSession;
  sendNotification("Time's up! 🎉", `Did you finish ${task.name}?`, "focus");
  const minutes = timerMinutesDone(focusSession.timer, Date.now());
  focusKicker.textContent = "Time's up! 🎉";
  focusCountdown.textContent = "0:00";
  document.title = "Time's up! · Due Next";
  focusStatus.textContent = `You focused for ${minutes} minutes. ${describeLeaves(focusSession.leaves)} Did you finish?`;
  setFocusActions([
    {
      label: "✓ Yes, mark it done",
      primary: true,
      onClick: () => {
        task.done = true;
        creditCompletion(task);
        persist();
        render();
        offerBreakOrClose(`Checked off “${task.name}”. Nice work! 🎉`);
      },
    },
    {
      label: `+${EXTRA_FOCUS_MINUTES} more minutes`,
      onClick: () => {
        focusSession.timer = addTimerMinutes(focusSession.timer, EXTRA_FOCUS_MINUTES, Date.now());
        focusSession.phase = "focus";
        showRunningFocus();
      },
    },
    {
      label: "Not yet, back to my calendar",
      onClick: () => offerBreakOrClose("Keep going, you've got this."),
    },
  ]);
}

// In a Pomodoro the break comes next; otherwise the session is over.
function offerBreakOrClose(message) {
  if (!focusSession.pomodoro) {
    closeFocus(message);
    return;
  }
  focusKicker.textContent = "Good work";
  focusStatus.textContent = message;
  setFocusActions([
    { label: `☕ Start ${POMODORO_BREAK_MINUTES}-minute break`, primary: true, onClick: startBreak },
    { label: "Back to my calendar", onClick: () => closeFocus(message) },
  ]);
}

function startBreak() {
  focusSession.counting = false;
  focusSession.timer = createTimer(POMODORO_BREAK_MINUTES, Date.now());
  focusSession.phase = "break";
  showRunningFocus();
}

function finishBreak() {
  focusSession.phase = "ended";
  playChime();
  const { task } = focusSession;
  const question = task.done ? "Hope you feel rested." : "Ready for another round?";
  sendNotification("Break's over ☕", task.done ? question : `Ready for another round on ${task.name}?`, "focus");
  focusKicker.textContent = "Break's over ☕";
  focusCountdown.textContent = "0:00";
  document.title = "Break's over · Due Next";
  focusStatus.textContent = question;
  const actions = [{ label: "Back to my calendar", onClick: () => closeFocus("") }];
  if (!task.done) {
    actions.unshift({
      label: `▶ Another ${POMODORO_FOCUS_MINUTES} minutes`,
      primary: true,
      onClick: () => {
        focusSession.timer = createTimer(POMODORO_FOCUS_MINUTES, Date.now());
        focusSession.phase = "focus";
        focusSession.leaves = 0;
        focusSession.counting = true;
        focusSession.logEntry = null;
        showRunningFocus();
      },
    });
  }
  setFocusActions(actions);
}

function stopFocus() {
  recordFocusProgress();
  const minutes = timerMinutesDone(focusSession.timer, Date.now());
  closeFocus(`Focus ended after ${minutes} ${minutes === 1 ? "minute" : "minutes"}. ${describeLeaves(focusSession.leaves)}`);
}

function closeFocus(message) {
  clearInterval(focusTicker);
  clearFocusNudge();
  focusSession = null;
  document.title = "Due Next";
  exitFullScreen();
  focusScreen.close();
  if (message) showToast(message);
}

// Leaving: switching tabs or apps. Each time away counts once, and one nudge goes out if it lasts.
function noticeLeaving() {
  if (!focusSession || focusSession.phase !== "focus" || focusSession.away) return;
  if (focusSession.timer.runningSince === null || Date.now() < focusSession.ignoreLeavesUntil) return;
  focusSession.away = true;
  focusSession.leaves++;
  const { task } = focusSession;
  focusSession.nudgeTimeout = setTimeout(() => {
    if (!focusSession) return;
    const minutesLeft = Math.ceil(timerRemaining(focusSession.timer, Date.now()) / 60_000);
    sendNotification(`Come back to ${task.name} 💪`, `${minutesLeft} ${minutesLeft === 1 ? "minute" : "minutes"} left`, "focus");
  }, FOCUS_NUDGE_DELAY_MS);
}

function noticeReturning() {
  if (!focusSession || !focusSession.away) return;
  focusSession.away = false;
  clearFocusNudge();
  if (focusSession.phase === "focus") focusStatus.textContent = `Welcome back 💪 ${describeLeaves(focusSession.leaves)}`;
}

window.addEventListener("blur", noticeLeaving);
window.addEventListener("focus", noticeReturning);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) noticeLeaving();
  else noticeReturning();
});

// Esc would close the full-screen page by accident, so it only leaves through its buttons.
focusScreen.addEventListener("cancel", (event) => event.preventDefault());

focusFromEditButton.addEventListener("click", () => {
  const task = tasks.find((other) => other.id === editingTaskId);
  addDialog.close();
  if (task) openFocusStart(task);
});

// Import: add tasks from a file (a syllabus PDF or a calendar .ics), a calendar link (by downloading
// its file), or pasted text. Everything found is previewed, and only the checked ones are added.
const importDialog = document.getElementById("import-dialog");
const importForm = document.getElementById("import-form");
const importIntro = document.getElementById("import-intro");
const importLinkSteps = document.getElementById("import-link-steps");
const importFileArea = document.getElementById("import-file-area");
const importPasteArea = document.getElementById("import-paste-area");
const importText = document.getElementById("import-text");
const importCourseRow = document.getElementById("import-course-row");
const importCourse = document.getElementById("import-course");
const importGroupRow = document.getElementById("import-group-row");
const importGroup = document.getElementById("import-group");
const importNewGroup = document.getElementById("import-new-group");
const importReminderRow = document.getElementById("import-reminder-row");
const importReminderLevel = document.getElementById("import-reminders");
const importFile = document.getElementById("import-file");
const importSummary = document.getElementById("import-summary");
const importWeights = document.getElementById("import-weights");
const importPreview = document.getElementById("import-preview");
const importList = document.getElementById("import-list");
const importAll = document.getElementById("import-all");
const importMessage = document.getElementById("import-message");
const importSubmit = document.getElementById("import-submit");
const canvasLinkInput = document.getElementById("canvas-link");
const fileDrop = document.getElementById("file-drop");
const fileDropText = document.getElementById("file-drop-text");
const CANVAS_LINK_KEY = "due-canvas-link";
const FILE_DROP_HINT = fileDropText.textContent;
// pdf.js (the PDF reader built into Firefox) is loaded only when someone imports a PDF.
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

const IMPORT_INTROS = {
  file: "Choose a syllabus PDF, or a calendar file (.ics) from Canvas, Google Calendar, or Outlook. You'll see everything it found before anything is added.",
  link: "Canvas can't send assignments straight to Due Next, so you download your calendar as a file and add it here. After the first time, start at step 3.",
  paste: "Copy a schedule from a PDF, webpage, or email (Cmd+A, then Cmd+C) and paste it here.",
};

let importMode = "file";
// What the preview shows: "calendar" events carry their own class; "text" events use the Class box and editable names.
let importSource = "calendar";
let importEvents = [];
// Tasks already in Due Next that this import also found; choosing a group moves them into it too.
let importExisting = [];
// From a syllabus: its grade breakdown, and the weights it gives this class's tasks already here
// (only ones without a weight, so nothing typed by hand is changed), as [{ task, weight }].
let importBreakdown = [];
let importExistingWeights = [];
const NEW_GROUP_CHOICE = "new";

function showImportMode(mode) {
  importMode = mode;
  for (const button of document.querySelectorAll("[data-import-mode]")) {
    button.setAttribute("aria-pressed", String(button.dataset.importMode === mode));
  }
  importIntro.textContent = IMPORT_INTROS[mode];
  importLinkSteps.hidden = mode !== "link";
  importFileArea.hidden = mode === "paste";
  importPasteArea.hidden = mode !== "paste";
  importMessage.textContent = "";
}

for (const button of document.querySelectorAll("[data-import-mode]")) {
  button.addEventListener("click", () => showImportMode(button.dataset.importMode));
}

// The Canvas feed link is kept only in this browser's storage, never in the app's code.
function savedCanvasLink() {
  try {
    return localStorage.getItem(CANVAS_LINK_KEY) ?? "";
  } catch {
    return "";
  }
}

function isCanvasFeedLink(link) {
  return /^https:\/\/\S+\/feeds\/calendars\/\S+\.ics$/.test(link);
}

canvasLinkInput.addEventListener("change", () => {
  const link = canvasLinkInput.value.trim();
  importMessage.textContent = "";
  if (link && !isCanvasFeedLink(link)) {
    importMessage.textContent = "That doesn't look like a Canvas calendar link. It starts with https:// and ends in .ics.";
    return;
  }
  try {
    localStorage.setItem(CANVAS_LINK_KEY, link);
  } catch {
    // It still works for now; it just won't be remembered.
  }
});

document.getElementById("canvas-download").addEventListener("click", () => {
  const link = canvasLinkInput.value.trim();
  if (!isCanvasFeedLink(link)) {
    importMessage.textContent = link
      ? "That doesn't look like a Canvas calendar link. It starts with https:// and ends in .ics."
      : "Paste your Canvas calendar link in step 2 first.";
    canvasLinkInput.focus();
    return;
  }
  importMessage.textContent = "";
  window.open(link, "_blank", "noopener");
});

// Dragging a file onto the drop area works like choosing it.
fileDrop.addEventListener("dragover", (event) => {
  event.preventDefault();
  fileDrop.classList.add("is-dragging");
});
fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("is-dragging"));
fileDrop.addEventListener("drop", (event) => {
  event.preventDefault();
  fileDrop.classList.remove("is-dragging");
  if (event.dataTransfer.files.length === 0) return;
  importFile.files = event.dataTransfer.files;
  importFile.dispatchEvent(new Event("change"));
});

function importCheckboxes() {
  return [...importList.querySelectorAll("input[type='checkbox']")];
}

// Tasks already here that this import would change: all of them for a group, and for reminders
// only unfinished ones with none yet, so reminders set by hand are left alone.
function existingTasksToUpdate() {
  if (importGroup.value !== "") return importExisting;
  if (importReminderLevel.value === "none") return [];
  return importExisting.filter((task) => !task.done && !hasReminders(task));
}

function updateImportButton() {
  const count = importCheckboxes().filter((checkbox) => checkbox.checked).length;
  const updateCount = existingTasksToUpdate().length;
  const weightCount = importExistingWeights.length;
  importSubmit.disabled = count === 0 && updateCount === 0 && weightCount === 0;
  if (count === 0 && updateCount > 0) importSubmit.textContent = updateCount === 1 ? "Update 1 task" : `Update ${updateCount} tasks`;
  // Importing a syllabus again just to get its grade weights onto the tasks already here.
  else if (count === 0 && weightCount > 0) importSubmit.textContent = `Set grade weights on ${weightCount} task${weightCount === 1 ? "" : "s"}`;
  else importSubmit.textContent = count === 1 ? "Add 1 task" : `Add ${count} tasks`;
  importAll.checked = count > 0 && count === importEvents.length;
}

// Shows each row what it will get, since exams and projects differ from the level chosen.
function renderImportReminderLabels() {
  for (const checkbox of importCheckboxes()) {
    const row = checkbox.closest(".import-row");
    const nameElement = row.querySelector(".import-row-name");
    const name = nameElement.value ?? nameElement.textContent;
    const text = describeReminderTimes(importReminders(name, importReminderLevel.value));
    row.querySelector(".import-row-reminder").textContent = text ? `🔔 ${text}` : "";
  }
}

importReminderLevel.append(...REMINDER_LEVELS.map(({ id, label }) => new Option(label, id)));
importReminderLevel.addEventListener("change", () => {
  renderImportReminderLabels();
  updateImportButton();
});

function renderImportGroups() {
  importGroup.replaceChildren(
    new Option("No group (keep class colors)", ""),
    ...groups.map((group) => new Option(group.name, group.id)),
    new Option("+ New group…", NEW_GROUP_CHOICE),
  );
  importGroup.value = "";
  importNewGroup.value = "";
  importNewGroup.hidden = true;
}

importGroup.addEventListener("change", () => {
  importNewGroup.hidden = importGroup.value !== NEW_GROUP_CHOICE;
  if (!importNewGroup.hidden) importNewGroup.focus();
  updateImportButton();
});

function clearImportPreview() {
  importEvents = [];
  importExisting = [];
  importBreakdown = [];
  importExistingWeights = [];
  importWeights.hidden = true;
  importGroupRow.hidden = true;
  importReminderRow.hidden = true;
  importGroup.value = "";
  importReminderLevel.value = "light";
  importList.replaceChildren();
  importSummary.hidden = true;
  importPreview.hidden = true;
  importCourseRow.hidden = true;
  importMessage.textContent = "";
  updateImportButton();
}

function resetImport() {
  importForm.reset();
  clearImportPreview();
  canvasLinkInput.value = savedCanvasLink();
  fileDropText.textContent = FILE_DROP_HINT;
  fileDrop.classList.remove("has-file");
  showImportMode("file");
}

function renderImportRow(event, index, todayKey) {
  const item = document.createElement("li");
  // A label makes the whole row tick the box; rows with an editable name can't be labels.
  const row = document.createElement(importSource === "text" ? "div" : "label");
  row.className = "import-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = String(index);
  // Upcoming work starts checked; things already past, or probably already here under another
  // source (the same exam from a syllabus and from Canvas), start unchecked.
  const alreadyHere = findDuplicateTask(tasks, event);
  checkbox.checked = event.due >= todayKey && !alreadyHere;
  const text = document.createElement("span");
  text.className = "import-row-text";
  // Names found in text are a best guess, so they can be fixed before adding.
  const name = document.createElement(importSource === "text" ? "input" : "span");
  name.className = "import-row-name";
  if (importSource === "text") {
    name.type = "text";
    name.value = event.name;
    name.setAttribute("aria-label", "Task name");
  } else {
    name.textContent = event.name;
  }
  const meta = document.createElement("span");
  meta.className = "import-row-meta";
  const when = formatDay(event.due, { weekday: "short", month: "short", day: "numeric" });
  meta.textContent = [event.weight ? `${event.weight}% of grade` : "", when, formatTime(event.time), event.course, alreadyHere ? "Already in Due Next" : ""]
    .filter(Boolean)
    .join(" · ");
  checkbox.setAttribute("aria-label", `Add ${event.name}, ${when}`);
  const reminder = document.createElement("span");
  reminder.className = "import-row-meta import-row-reminder";
  text.append(name, meta, reminder);
  row.append(checkbox, text);
  item.append(row);
  return item;
}

function showImportPreview(found, newEvents, emptyText) {
  const todayKey = toDateKey(new Date());
  renderImportGroups();
  importGroupRow.hidden = found.length === 0;
  importReminderRow.hidden = found.length === 0;
  // With grade weights from a syllabus, the most important come first; otherwise by date.
  importEvents = newEvents.sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || a.due.localeCompare(b.due) || a.time.localeCompare(b.time),
  );
  importWeights.hidden = importBreakdown.length === 0;
  const existingText =
    importExistingWeights.length > 0
      ? ` Also sets weights on ${importExistingWeights.length} of this class's tasks already in Due Next.`
      : "";
  importWeights.textContent = `Grade weights from the syllabus: ${importBreakdown.map((part) => `${part.label} ${part.percent}%`).join(" · ")}. Listed most to least important.${existingText}`;
  const alreadyAdded = found.length - importEvents.length;
  const upcomingCount = importEvents.filter((event) => event.due >= todayKey && !findDuplicateTask(tasks, event)).length;
  const lookAlikes = importEvents.filter((event) => findDuplicateTask(tasks, event)).length;
  const summary = `Found ${importEvents.length} new${alreadyAdded > 0 ? ` (${alreadyAdded} already in Due Next)` : ""}.`;
  importSummary.hidden = false;
  if (found.length === 0) {
    importSummary.textContent = emptyText;
  } else if (importEvents.length === 0) {
    importSummary.textContent = "Everything here is already in Due Next ✓ You can still update their group and reminders above.";
  } else if (upcomingCount === 0) {
    importSummary.textContent = `${summary} They're all in the past, so none are checked. Past ones you add come in already done.`;
  } else {
    const checkedText = upcomingCount === 1 ? "The 1 upcoming one is checked." : `The ${upcomingCount} upcoming ones are checked.`;
    const lookAlikeText =
      lookAlikes > 0 ? ` ${lookAlikes === 1 ? "1 looks like something" : `${lookAlikes} look like things`} you already have, so ${lookAlikes === 1 ? "it isn't" : "they aren't"} checked.` : "";
    importSummary.textContent = `${summary} ${checkedText}${lookAlikeText} Past ones you add come in already done.`;
  }
  importList.replaceChildren(...importEvents.map((event, index) => renderImportRow(event, index, todayKey)));
  importPreview.hidden = importEvents.length === 0;
  renderImportReminderLabels();
  updateImportButton();
}

// Dates found in a syllabus or pasted text, with the class guessed from the text (and editable).
function previewTextImport(text) {
  importSource = "text";
  const found = findDatesInText(text);
  const foundKeys = new Set(found.map((event) => `${event.due}|${event.name.toLowerCase()}`));
  importExisting = tasks.filter((task) => foundKeys.has(`${task.due}|${task.name.toLowerCase()}`));
  importCourseRow.hidden = found.length === 0;
  importCourse.value = guessCourse(text);
  const newEvents = newTextEvents(found, tasks);
  importBreakdown = parseGradeBreakdown(text);
  importExistingWeights = [];
  if (importBreakdown.length > 0) {
    // Split each category across everything of that kind for the class: what's new plus what's here.
    const course = importCourse.value.trim().toLowerCase();
    const classTasks = course ? tasks.filter((task) => task.course.trim().toLowerCase() === course) : [];
    const weights = gradeWeights([...newEvents, ...classTasks], importBreakdown);
    newEvents.forEach((event, index) => {
      event.weight = weights[index];
    });
    importExistingWeights = classTasks
      .map((task, index) => ({ task, weight: weights[newEvents.length + index] }))
      .filter(({ task, weight }) => weight && !task.weight);
  }
  showImportPreview(
    found,
    newEvents,
    "No dates found. Dates need a month and day, like “Sep 15” or “9/15”. Try pasting just the schedule part.",
  );
}

function previewCalendarImport(events) {
  importSource = "calendar";
  importBreakdown = [];
  importExistingWeights = [];
  importCourseRow.hidden = true;
  const foundIds = new Set(events.map((event) => event.canvasId));
  importExisting = tasks.filter((task) => foundIds.has(task.canvasId));
  showImportPreview(events, newCanvasEvents(events, tasks), "This calendar file has no events in it.");
}

// The text of a PDF, one line per row of text on the page.
async function readPdfText(file) {
  const pdfjs = await import(PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lines = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const content = await (await pdf.getPage(pageNumber)).getTextContent();
    let line = "";
    let lineY = null;
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (lineY !== null && Math.abs(y - lineY) > 2) {
        lines.push(line);
        line = "";
      }
      line += item.str;
      lineY = y;
    }
    lines.push(line);
  }
  return lines.join("\n");
}

importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  clearImportPreview();
  if (!file) return;
  fileDropText.textContent = `${file.name} (choose a different file)`;
  fileDrop.classList.add("has-file");

  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    importMessage.textContent = "";
    importSummary.hidden = false;
    importSummary.textContent = "Reading the PDF…";
    let text;
    try {
      text = await readPdfText(file);
    } catch {
      importSummary.hidden = true;
      importMessage.textContent = "Couldn't read that PDF. Check your internet connection, or use Paste text instead.";
      return;
    }
    if (!text.trim()) {
      importSummary.hidden = true;
      importMessage.textContent = "This PDF has no readable text (it may be a scanned picture). Try Paste text instead.";
      return;
    }
    previewTextImport(text);
    return;
  }

  const events = parseCanvasCalendar(await file.text());
  if (!events) {
    importMessage.textContent = "Due Next can read PDFs and calendar (.ics) files. For anything else, use Paste text.";
    return;
  }
  previewCalendarImport(events);
});

document.getElementById("find-dates").addEventListener("click", () => {
  clearImportPreview();
  if (!importText.value.trim()) {
    importMessage.textContent = "Paste a schedule into the box first.";
    importText.focus();
    return;
  }
  previewTextImport(importText.value);
});

importList.addEventListener("change", () => {
  renderImportReminderLabels();
  updateImportButton();
});
importAll.addEventListener("change", () => {
  for (const checkbox of importCheckboxes()) checkbox.checked = importAll.checked;
  updateImportButton();
});

// The group chosen in the preview, creating it if it's new. Returns null if the new name isn't valid.
function resolveImportGroup() {
  if (importGroup.value !== NEW_GROUP_CHOICE) return groups.find((group) => group.id === importGroup.value) ?? { id: "" };
  const error = groupNameError(importNewGroup.value, groups);
  if (error) {
    importMessage.textContent = error;
    importNewGroup.focus();
    return null;
  }
  const group = createGroup(importNewGroup.value, nextGroupColor(groups));
  groups.push(group);
  persistGroups();
  return group;
}

importForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const group = resolveImportGroup();
  if (!group) return;
  const groupId = group.id;
  const level = importReminderLevel.value;
  const updates = existingTasksToUpdate();
  const now = new Date();
  const chosenRows = importCheckboxes().filter((checkbox) => checkbox.checked);
  const newTasks = chosenRows.map((checkbox) => {
    const found = importEvents[Number(checkbox.value)];
    if (importSource === "calendar") {
      const reminders = importReminders(found.name, level);
      return { ...createTask({ ...found, name: found.name.slice(0, 120), groupId, reminders }), canvasId: found.canvasId };
    }
    const typedName = checkbox.closest(".import-row").querySelector(".import-row-name").value.trim();
    const name = (typedName || found.name).slice(0, 120);
    const reminders = importReminders(name, level);
    return createTask({ name, course: importCourse.value, due: found.due, time: found.time, groupId, reminders, weight: found.weight });
  });
  for (const { task, weight } of importExistingWeights) task.weight = weight;
  if (importSource === "calendar") settleImportedCanvasTasks(newTasks, now);
  else markPastAsDone(newTasks, now);
  tasks.push(...newTasks);
  for (const task of updates) {
    if (groupId) task.groupId = groupId;
    if (!task.done && !hasReminders(task)) task.reminders = importReminders(task.name, level);
  }
  persist();
  importDialog.close();
  render();
  const added = newTasks.length === 1 ? "Added 1 task." : `Added ${newTasks.length} tasks.`;
  const updated = updates.length === 1 ? "Updated 1 already here." : `Updated ${updates.length} already here.`;
  const weighted = importExistingWeights.length;
  const weightedText = weighted > 0 ? ` Set grade weights on ${weighted} already here.` : "";
  if (newTasks.length === 0) showToast(updates.length > 0 ? `${updated}${weightedText}` : weightedText.trim());
  else showToast(`${updates.length > 0 ? `${added} ${updated}` : added}${weightedText}`);
  const anyReminders = [...newTasks, ...updates].some((task) => hasReminders(task));
  if (anyReminders && notificationsSupported() && Notification.permission === "default") {
    Notification.requestPermission().then(render);
  }
});

document.getElementById("open-import").addEventListener("click", () => {
  resetImport();
  importDialog.showModal();
});
document.getElementById("import-cancel").addEventListener("click", () => importDialog.close());
importDialog.addEventListener("click", (event) => {
  if (event.target === importDialog) importDialog.close();
});

// Plan my day: say when you're free, and smart rules fit today's tasks into those times.
const planForm = document.getElementById("plan-form");
const planMessage = document.getElementById("plan-message");
const planResult = document.getElementById("plan-result");
const planBlocks = document.getElementById("plan-blocks");
const planEmpty = document.getElementById("plan-empty");
const planUnscheduled = document.getElementById("plan-unscheduled");
const planUnscheduledList = document.getElementById("plan-unscheduled-list");
const planSource = document.getElementById("plan-source");
const planExactToggle = document.getElementById("plan-exact-toggle");
const planExact = document.getElementById("plan-exact");
const planFrom = document.getElementById("plan-from");
const planTo = document.getElementById("plan-to");
const planAmount = document.getElementById("plan-amount");
const planHourButtons = [...document.querySelectorAll("[data-plan-hours]")];
const planPeriodButtons = [...document.querySelectorAll("[data-plan-period]")];
const DEFAULT_PLAN_HOURS = 2;
let planHours = DEFAULT_PLAN_HOURS;
let planPeriod = "anytime";
// Exact times, when chosen, replace the buttons: { from, to, minutes }, all in minutes.
let planExactChoice = null;
const DEFAULT_EXACT = { from: 9 * 60, to: 17 * 60, minutes: 90 };

function nowInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function loadDayPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "null");
    // A plan is only for the day it was made.
    dayPlan = saved?.date === toDateKey(new Date()) ? saved : null;
  } catch {
    dayPlan = null;
  }
}

function saveDayPlan() {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(dayPlan));
  } catch {
    // The plan still works until the page closes.
  }
}

// typed is true for a plan from free time typed in the chat, which replanning keeps as typed.
function makeDayPlan({ freeText, windows, typed = false }) {
  const todayKey = toDateKey(new Date());
  const skippedIds = dayPlan?.skippedIds ?? [];
  const maxMinutes = planExactChoice?.minutes ?? planHours * 60;
  const plan = planDay(tasks, windows, { todayKey, nowMinutes: nowInMinutes(), skippedIds, maxMinutes });
  dayPlan = { date: todayKey, freeText, windows, skippedIds, hours: planHours, period: planPeriod, exact: planExactChoice, typed, ...plan };
  saveDayPlan();
  render();
}

function renderPlanButton() {
  const left = (dayPlan?.blocks ?? []).filter((block) => {
    const task = tasks.find((other) => other.id === block.taskId);
    return task && !task.done && !dayPlan.skippedIds.includes(task.id);
  }).length;
  planButton.textContent = dayPlan ? `My plan · ${left} left` : "Plan my day";
}

function renderPlanBlock(block) {
  const task = tasks.find((other) => other.id === block.taskId);
  if (!task) return null;
  const skipped = dayPlan.skippedIds.includes(task.id);
  const item = document.createElement("li");
  item.className = `plan-block${task.done ? " is-done" : ""}${skipped ? " is-skipped" : ""}`;
  const color = taskColorIndex(task, groups);
  if (color >= 0) item.dataset.color = String(color);

  const text = document.createElement("div");
  text.className = "plan-block-text";
  const time = document.createElement("span");
  time.className = "plan-block-time";
  time.textContent = `${formatMinutes(block.start)}–${formatMinutes(block.end)}`;
  const name = document.createElement("span");
  name.className = "plan-block-name";
  name.textContent = task.name;
  const why = document.createElement("span");
  why.className = "plan-block-why";
  why.textContent = [block.reason, task.course, block.partial ? "part of it" : "", skipped ? "skipped" : ""].filter(Boolean).join(" · ");
  text.append(time, name, why);

  const actions = document.createElement("div");
  actions.className = "plan-block-actions";
  if (!task.done && !skipped) {
    const lockIn = document.createElement("button");
    lockIn.type = "button";
    lockIn.className = "quiet-button";
    lockIn.textContent = "🔒";
    lockIn.setAttribute("aria-label", `Lock in on ${task.name}`);
    lockIn.addEventListener("click", () => {
      planPanel.close();
      openFocusStart(task);
    });
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "quiet-button";
    skip.textContent = "Skip";
    skip.setAttribute("aria-label", `Skip ${task.name} today`);
    skip.addEventListener("click", () => {
      dayPlan.skippedIds.push(task.id);
      saveDayPlan();
      render();
    });
    actions.append(lockIn, skip);
  }
  item.append(text, actions);
  return item;
}

function renderPlan() {
  planResult.hidden = !dayPlan;
  if (!dayPlan) return;
  planBlocks.replaceChildren(...dayPlan.blocks.map(renderPlanBlock).filter(Boolean));
  planEmpty.hidden = dayPlan.blocks.length > 0;
  planEmpty.textContent = dayPlan.unscheduled.length > 0
    ? "Nothing fits in that time. Try more hours or another time of day."
    : "Nothing to plan: no missed tasks, and nothing due in the next week 🎉";
  const names = dayPlan.unscheduled
    .map(({ taskId, reason }) => {
      const task = tasks.find((other) => other.id === taskId);
      return task && !task.done ? `${task.name} (${reason})` : null;
    })
    .filter(Boolean);
  planUnscheduled.hidden = names.length === 0;
  planUnscheduledList.replaceChildren(
    ...names.map((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      return item;
    }),
  );
}

// The exact-time menus: start and end times every 15 minutes, and amounts up to 6 hours.
function fillExactMenus() {
  const timeOption = (minutes) => new Option(formatMinutes(minutes % (24 * 60)), String(minutes));
  for (let minutes = 6 * 60; minutes < 24 * 60; minutes += 15) planFrom.append(timeOption(minutes));
  for (let minutes = 6 * 60 + 15; minutes <= 24 * 60; minutes += 15) planTo.append(timeOption(minutes));
  for (let minutes = 15; minutes <= 6 * 60; minutes += 15) planAmount.append(new Option(formatDuration(minutes), String(minutes)));
}
fillExactMenus();

function showPlanChoices() {
  const exact = planExactChoice !== null;
  for (const button of planHourButtons) button.setAttribute("aria-pressed", String(!exact && Number(button.dataset.planHours) === planHours));
  for (const button of planPeriodButtons) button.setAttribute("aria-pressed", String(!exact && button.dataset.planPeriod === planPeriod));
  planExact.hidden = !exact;
  planExactToggle.setAttribute("aria-expanded", String(exact));
  planExactToggle.textContent = exact ? "Use the buttons instead" : "Choose exact times";
  if (exact) {
    planFrom.value = String(planExactChoice.from);
    planTo.value = String(planExactChoice.to);
    planAmount.value = String(planExactChoice.minutes);
  }
  planSource.textContent =
    googleCalendarStatus().status !== "off"
      ? "Due Next fits your work into the empty times on your calendar."
      : "Connect Google Calendar in Settings, and Due Next will work around your events.";
}

function noFreeTimeMessage(range) {
  if (planExactChoice) return `No free time left between ${formatMinutes(range.start)} and ${formatMinutes(range.end % (24 * 60))} today.`;
  if (planPeriod !== "anytime") return `No free time left in the ${PLAN_PERIODS[planPeriod].label.toLowerCase()} today. Try another time of day.`;
  if (nowInMinutes() >= PLAN_DAY_END) return "It's after 10 PM, so there's no time left to plan today.";
  return "Your calendar is full for the rest of today.";
}

// Today's free time to plan in: the gaps between calendar events (if connected) within the chosen
// time of day or exact times.
function chosenFreeTime() {
  const range = planExactChoice ? { start: planExactChoice.from, end: planExactChoice.to } : PLAN_PERIODS[planPeriod];
  if (range.end <= range.start) return { error: "Pick an end time after the start time." };
  const busy = eventsOn(toDateKey(new Date())).filter((entry) => entry.start);
  const windows = freeWindows(busy, nowInMinutes(), range);
  if (windows.length === 0) return { error: noFreeTimeMessage(range) };
  return { windows, freeText: describeFreeWindows(windows) };
}

function openPlanPanel() {
  planHours = dayPlan?.hours ?? DEFAULT_PLAN_HOURS;
  planPeriod = dayPlan?.period ?? "anytime";
  planExactChoice = dayPlan?.exact ?? null;
  showPlanChoices();
  planMessage.textContent = "";
  renderPlan();
  planPanel.showModal();
}

for (const button of planHourButtons) {
  button.addEventListener("click", () => {
    planHours = Number(button.dataset.planHours);
    planExactChoice = null;
    showPlanChoices();
  });
}
for (const button of planPeriodButtons) {
  button.addEventListener("click", () => {
    planPeriod = button.dataset.planPeriod;
    planExactChoice = null;
    planMessage.textContent = "";
    showPlanChoices();
  });
}
planExactToggle.addEventListener("click", () => {
  planExactChoice = planExactChoice ? null : { ...DEFAULT_EXACT };
  planMessage.textContent = "";
  showPlanChoices();
});
for (const menu of [planFrom, planTo, planAmount]) {
  menu.addEventListener("change", () => {
    planExactChoice = { from: Number(planFrom.value), to: Number(planTo.value), minutes: Number(planAmount.value) };
    planMessage.textContent = "";
  });
}
planForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const freeTime = chosenFreeTime();
  if (freeTime.error) {
    planMessage.textContent = freeTime.error;
    return;
  }
  makeDayPlan(freeTime);
});
// Replanning keeps the same choices and looks at the calendar again.
document.getElementById("plan-replan").addEventListener("click", () => {
  planHours = dayPlan.hours ?? DEFAULT_PLAN_HOURS;
  planPeriod = dayPlan.period ?? "anytime";
  planExactChoice = dayPlan.exact ?? null;
  const freeTime = dayPlan.typed ? { windows: dayPlan.windows, freeText: dayPlan.freeText, typed: true } : chosenFreeTime();
  if (freeTime.error) {
    showToast(freeTime.error);
    return;
  }
  makeDayPlan(freeTime);
  showToast("Replanned from now.");
});
planButton.addEventListener("click", openPlanPanel);
document.getElementById("close-plan").addEventListener("click", () => planPanel.close());
planPanel.addEventListener("click", (event) => {
  if (event.target === planPanel) planPanel.close();
});

// The chat helper: it understands set phrases (see understandMessage), and it shows any
// change to a task and waits for a click before making it.
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const CHAT_HELP = [
  "Here's what I understand:",
  "• “econ homework due Friday at 5, probably 2 hours”",
  "• “study group tomorrow 3-5 at Grainger Library” (an event)",
  "• “when am I free tomorrow?”",
  "• “when's my busiest week?” or “how busy is next week?”",
  "• “what's due this week?”",
  "• “I have 45 minutes”",
  "• “plan my day, free 2-5, 7-9”",
  "• “move essay to Friday”",
  "• “I finished HW9”",
  "• “how am I doing?”",
].join("\n");

// Adds a message. Each action is { label, onClick }; clicking one removes the buttons so it can't run twice.
function addChatMessage(text, { fromUser = false, actions = [] } = {}) {
  const item = document.createElement("li");
  item.className = `chat-message${fromUser ? " from-user" : ""}`;
  const body = document.createElement("span");
  body.textContent = text;
  item.append(body);
  if (actions.length > 0) {
    const row = document.createElement("div");
    row.className = "chat-actions";
    row.append(
      ...actions.map(({ label, onClick }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiet-button";
        button.textContent = label;
        button.addEventListener("click", () => {
          row.remove();
          onClick();
        });
        return button;
      }),
    );
    item.append(row);
  }
  chatMessages.append(item);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function describeNewTask({ name, course, due, time, estimateMinutes }) {
  const length = ESTIMATE_OPTIONS.find((option) => option.minutes === estimateMinutes)?.label;
  return [name, formatWhen(due, time), course, estimateMinutes ? length : ""].filter(Boolean).join("\n");
}

// "Add event “Study group” on Tuesday, Nov 17, 3:00 PM – 5:00 PM at Grainger Library?"
function offerToAddEvent(details) {
  const when = formatEventWhen(details);
  addChatMessage(`Add this event?\n${details.name}\n${when}${details.location ? `\nAt ${details.location}` : ""}`, {
    actions: [
      {
        label: "✓ Add it",
        onClick: () => {
          events.push(createEvent(details));
          persistEvents();
          render();
          const note = details.location ? " To get a travel time, open it and pick the place from the suggestions." : "";
          addChatMessage(`Added “${details.name}” ✓${note}`);
        },
      },
      { label: "Cancel", onClick: () => addChatMessage("Okay, I didn't add it.") },
    ],
  });
}

// "Your busiest weeks: Dec 6 – 12 (Busy · 2 projects, 5 assignments), …", with a button to the Semester tab.
function replyWithBusiestWeeks() {
  const weeks = semesterWeeks(tasks, toDateKey(new Date()), { workload: chosenWorkload() });
  const busiest = weeks.filter((week) => week.busiest).sort((a, b) => b.score - a.score);
  if (busiest.length === 0) {
    addChatMessage("No busy weeks coming up 🎉 Every week ahead looks light or steady.");
    return;
  }
  const lines = busiest.map((week) => `• ${weekRange(week.start)}: ${describeSemesterWeek(week)}`);
  addChatMessage(`Your busiest weeks:\n${lines.join("\n")}`, {
    actions: [{ label: "📊 Open Semester", onClick: () => showMode("semester") }],
  });
}

// "Next week (Nov 22 – 28): Busy · 1 exam, 4 assignments. Heaviest: Sat, Nov 28 · 1 exam. Get ahead: …"
function replyWithWeek(weekStart) {
  const todayKey = toDateKey(new Date());
  const weeks = semesterWeeks(tasks, todayKey, { workload: chosenWorkload() });
  const index = weeks.findIndex((week) => week.start === weekStart);
  const label = weekStart === startOfWeek(todayKey) ? "This week" : weekStart === addDays(startOfWeek(todayKey), 7) ? "Next week" : "That week";
  if (index === -1) {
    addChatMessage(`${label} (${weekRange(weekStart)}) has nothing due in Due Next.`);
    return;
  }
  const week = weeks[index];
  const heaviest = week.heaviest ? ` ${describeHeaviestDay(week, week.heaviest)}.` : "";
  const advice = semesterAdvice(week, index === 0);
  addChatMessage(`${label} (${weekRange(week.start)}): ${describeSemesterWeek(week)}.${heaviest}${advice ? ` ${advice}` : ""}`);
}

// The gaps between classes and events on a day, 8 AM to 10 PM, the same way Plan my day finds them.
function replyWithFreeTime(dateKey) {
  const todayKey = toDateKey(new Date());
  const busy = eventsOn(dateKey).filter((entry) => entry.start);
  const windows = freeWindows(busy, dateKey === todayKey ? nowInMinutes() : 0, { start: PLAN_DAY_START, end: PLAN_DAY_END });
  const day = dateKey === todayKey ? "today" : dateKey === addDays(todayKey, 1) ? "tomorrow" : formatDay(dateKey, { weekday: "long", month: "short", day: "numeric" });
  const google = googleCalendarStatus().status === "connected" ? "" : "\n(Google Calendar isn't showing right now, so this only counts your Due Next events.)";
  addChatMessage(
    windows.length === 0
      ? `I don't see any free time ${day} between 8 AM and 10 PM.${google}`
      : `You're free ${day}: ${describeFreeWindows(windows)}.${google}`,
  );
}

function offerToAdd(details) {
  addChatMessage(`Add this task?\n${describeNewTask(details)}`, {
    actions: [
      {
        label: "✓ Add it",
        onClick: () => {
          tasks.push(createTask(details));
          persist();
          render();
          addChatMessage(`Added “${details.name}” ✓`);
        },
      },
      { label: "Cancel", onClick: () => addChatMessage("Okay, I didn't add it.") },
    ],
  });
}

function offerToMove(task, due, time) {
  addChatMessage(`Move “${task.name}” to ${formatWhen(due, time)}?`, {
    actions: [
      {
        label: "✓ Move it",
        onClick: () => {
          const problem = rescheduleError(due, time, new Date());
          if (problem) {
            addChatMessage(problem);
            return;
          }
          task.due = due;
          task.time = time;
          persist();
          render();
          addChatMessage(`Moved “${task.name}” ✓`);
        },
      },
      { label: "Cancel", onClick: () => addChatMessage("Okay, I left it where it is.") },
    ],
  });
}

function offerToFinish(task) {
  addChatMessage(`Check off “${task.name}” (due ${describeDue(task, toDateKey(new Date()))})?`, {
    actions: [
      {
        label: "✓ Check it off",
        onClick: () => {
          task.done = true;
          creditCompletion(task);
          persist();
          render();
          addChatMessage(`Checked off “${task.name}”. Nice work! 🎉`);
        },
      },
      { label: "Cancel", onClick: () => addChatMessage("Okay, I left it open.") },
    ],
  });
}

function showSuggestion(suggestions, index) {
  if (suggestions.length === 0) {
    addChatMessage("Nothing needs doing in the next week. Enjoy the break 🎉");
    return;
  }
  if (index >= suggestions.length) {
    addChatMessage("That's everything coming up in the next week.");
    return;
  }
  const { task, reason } = suggestions[index];
  addChatMessage(`I'd do “${task.name}”.\n${reason}${task.course ? ` · ${task.course}` : ""}`, {
    actions: [
      {
        label: "🔒 Lock in",
        onClick: () => {
          chatPanel.close();
          openFocusStart(task);
        },
      },
      { label: "Something else", onClick: () => showSuggestion(suggestions, index + 1) },
    ],
  });
}

function replyToPlan(freeText) {
  if (!freeText) {
    addChatMessage("Sure. Open your plan and choose how much you want to work.", {
      actions: [
        {
          label: "Open my plan",
          onClick: () => {
            chatPanel.close();
            openPlanPanel();
          },
        },
      ],
    });
    return;
  }
  const parsed = parseFreeTime(freeText, nowInMinutes());
  if (parsed.error) {
    addChatMessage(parsed.error);
    return;
  }
  planExactChoice = null;
  makeDayPlan({ freeText, windows: parsed.windows, typed: true });
  chatPanel.close();
  openPlanPanel();
}

function replyWithProgress() {
  const todayKey = toDateKey(new Date());
  const { current } = streakInfo(progress, todayKey);
  const week = weekProgress(progress, todayKey);
  addChatMessage(`🔥 ${current}-day streak\nThis week: ${formatDuration(week.minutes)} locked in, ${week.tasksDone} ${week.tasksDone === 1 ? "task" : "tasks"} finished.`);
}

function replyToMessage(text) {
  const request = understandMessage(text, tasks, new Date());
  const todayKey = toDateKey(new Date());
  switch (request.type) {
    case "hello":
      addChatMessage("Hi! What can I help with?");
      break;
    case "help":
      addChatMessage(CHAT_HELP);
      break;
    case "progress":
      replyWithProgress();
      break;
    case "plan":
      replyToPlan(request.freeText);
      break;
    case "move":
      offerToMove(request.task, request.due, request.time);
      break;
    case "noDate":
      addChatMessage(`What day should I move “${request.task.name}” to? Try “move ${request.task.name} to Friday.”`);
      break;
    case "finish":
      offerToFinish(request.task);
      break;
    case "noTask":
      addChatMessage(`I couldn't find an unfinished task matching “${request.words}”. Check the name and try again.`);
      break;
    case "list":
      addChatMessage(
        request.tasks.length === 0
          ? `Nothing due ${request.label} 🎉`
          : `Due ${request.label}:\n${request.tasks.map((task) => `• ${task.name} (${describeDue(task, todayKey)})`).join("\n")}`,
      );
      break;
    case "suggest":
      showSuggestion(request.suggestions, 0);
      break;
    case "add":
      offerToAdd(request.details);
      break;
    case "askDate":
      addChatMessage(`When is “${request.details.name}” due? Try “add ${request.details.name} due Friday.”`);
      break;
    case "addEvent":
      offerToAddEvent(request.details);
      break;
    case "askEventDate":
      addChatMessage(`What day is “${request.details.name}”? Try “${request.details.name} tomorrow ${formatShortTime(request.details.start)}-${formatShortTime(request.details.end)}.”`);
      break;
    case "busiest":
      replyWithBusiestWeeks();
      break;
    case "busyWeek":
      replyWithWeek(request.weekStart);
      break;
    case "free":
      replyWithFreeTime(request.date);
      break;
    default:
      addChatMessage(`Sorry, I didn't understand that. I'm a simple helper, so I only know certain phrases.\n\n${CHAT_HELP}`);
  }
}

function sendChat(text) {
  addChatMessage(text, { fromUser: true });
  replyToMessage(text);
}

document.getElementById("chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  sendChat(text);
});

// Tap-to-ask buttons, so it's clear what the helper understands. "+ Add an event" puts an example
// in the box to change before sending.
for (const button of document.querySelectorAll(".chat-suggestion")) {
  button.addEventListener("click", () => {
    if (button.dataset.ask) {
      sendChat(button.dataset.ask);
      return;
    }
    chatInput.value = button.dataset.fill;
    chatInput.focus();
    chatInput.select();
  });
}

// The chat opens from a round button in the bottom right corner, like a website's help chat.
// It doesn't block the page, so the calendar stays usable while it's open.
const chatLauncher = document.getElementById("open-chat");
const chatGreeting = document.getElementById("chat-greeting");
const CHAT_GREETING_KEY = "due-chat-greeting-seen";

function hideChatGreeting() {
  chatGreeting.hidden = true;
  try {
    localStorage.setItem(CHAT_GREETING_KEY, "true");
  } catch {
    // It just shows again next time.
  }
}

try {
  chatGreeting.hidden = localStorage.getItem(CHAT_GREETING_KEY) === "true";
} catch {
  chatGreeting.hidden = false;
}

function openChat() {
  hideChatGreeting();
  if (chatMessages.children.length === 0) {
    addChatMessage(`Hi! I'm a simple helper, not a full AI, so I understand certain phrases. I always ask before changing anything.\n\n${CHAT_HELP}`);
  }
  chatPanel.show();
  chatLauncher.textContent = "×";
  chatLauncher.setAttribute("aria-label", "Close chat");
  chatLauncher.setAttribute("aria-expanded", "true");
  chatInput.focus();
}

chatLauncher.addEventListener("click", () => {
  if (chatPanel.open) chatPanel.close();
  else openChat();
});
chatPanel.addEventListener("close", () => {
  chatLauncher.textContent = "💬";
  chatLauncher.setAttribute("aria-label", "Open chat");
  chatLauncher.setAttribute("aria-expanded", "false");
});
// show() doesn't watch for Escape the way showModal() does, so the chat listens for it itself.
chatPanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") chatPanel.close();
});
document.getElementById("close-chat").addEventListener("click", () => chatPanel.close());
document.getElementById("dismiss-chat-greeting").addEventListener("click", hideChatGreeting);

// Progress panel: the streak, this week's numbers, and time by class or group.
const progressPanel = document.getElementById("progress-panel");

function renderProgress() {
  const todayKey = toDateKey(new Date());
  const { current, longest, activeToday } = streakInfo(progress, todayKey);
  document.getElementById("streak-count").textContent = current === 1 ? "1-day streak" : `${current}-day streak`;
  let note = "Lock in for 10 minutes or check off a task to start one.";
  if (activeToday) note = "You did something today ✓";
  else if (current > 0) note = "Lock in for 10 minutes or check off a task today to keep it going.";
  if (longest > current) note += ` Your longest is ${longest} days.`;
  document.getElementById("streak-note").textContent = note;

  const week = weekProgress(progress, todayKey);
  document.getElementById("week-time").textContent = formatDuration(week.minutes);
  document.getElementById("week-tasks").textContent = String(week.tasksDone);
  document.getElementById("week-tasks-label").textContent = week.tasksDone === 1 ? "task finished" : "tasks finished";
  document.getElementById("week-focus").textContent =
    week.sessionCount === 0
      ? "No Lock in sessions yet this week. Click 🔒 Lock in to start one."
      : `You stayed on the page in ${week.stayedCount} of ${week.sessionCount} ${week.sessionCount === 1 ? "session" : "sessions"}.`;

  const most = week.byLabel[0]?.minutes ?? 1;
  document.getElementById("week-bars").replaceChildren(
    ...week.byLabel.map(({ label, color, minutes }) => {
      const row = document.createElement("li");
      const text = document.createElement("div");
      text.className = "progress-bar-text";
      const name = document.createElement("span");
      name.textContent = label;
      const time = document.createElement("span");
      time.textContent = formatDuration(minutes);
      text.append(name, time);
      const track = document.createElement("div");
      track.className = "progress-bar-track";
      const fill = groupDot(color);
      fill.style.width = `${(minutes / most) * 100}%`;
      track.append(fill);
      row.append(text, track);
      return row;
    }),
  );
}

document.getElementById("open-progress").addEventListener("click", () => {
  renderProgress();
  progressPanel.showModal();
});
document.getElementById("close-progress").addEventListener("click", () => progressPanel.close());
progressPanel.addEventListener("click", (event) => {
  if (event.target === progressPanel) progressPanel.close();
});

// Settings: a list of sections on the left, and the chosen section's options on the right.
const settingsRows = [...document.querySelectorAll("[data-settings-section]")];
const settingsPages = [...document.querySelectorAll("[data-settings-page]")];
const backgroundOptions = [...document.querySelectorAll("[data-background-choice]")];
const settingsCanvasLink = document.getElementById("settings-canvas-link");
const settingsCanvasStatus = document.getElementById("settings-canvas-status");
const settingsCanvasMessage = document.getElementById("settings-canvas-message");

function showSettingsSection(section) {
  for (const row of settingsRows) {
    row.setAttribute("aria-current", String(row.dataset.settingsSection === section));
  }
  for (const page of settingsPages) page.hidden = page.dataset.settingsPage !== section;
}

for (const row of settingsRows) {
  row.addEventListener("click", () => showSettingsSection(row.dataset.settingsSection));
}

// index.html applies the saved theme and background before the page draws; these switch them.
// Dark mode: Match my computer, Off, On, or At night (between two times, 8 PM to 7 AM to start).
const darkOptions = [...document.querySelectorAll("[data-dark-choice]")];
const darkNightTimes = document.getElementById("dark-night-times");
const darkFrom = document.getElementById("dark-from");
const darkTo = document.getElementById("dark-to");

function darkSetting() {
  try {
    return cleanDarkSetting(JSON.parse(localStorage.getItem(DARK_KEY) ?? "null"));
  } catch {
    return cleanDarkSetting(null);
  }
}

function saveDarkSetting(changes) {
  try {
    localStorage.setItem(DARK_KEY, JSON.stringify(cleanDarkSetting({ ...darkSetting(), ...changes })));
  } catch {
    // It can't be remembered without storage.
  }
  applyDarkMode();
  showChosenLook();
}

for (const option of darkOptions) option.addEventListener("click", () => saveDarkSetting({ mode: option.dataset.darkChoice }));
darkFrom.addEventListener("change", () => saveDarkSetting({ from: darkFrom.value }));
darkTo.addEventListener("change", () => saveDarkSetting({ to: darkTo.value }));
// "At night" switches by itself when the time comes, even with Due Next open.
setInterval(applyDarkMode, 60_000);

const celebrateOptions = [...document.querySelectorAll("[data-celebrate-choice]")];
for (const option of celebrateOptions) {
  option.addEventListener("click", () => {
    try {
      localStorage.setItem(CELEBRATE_KEY, option.dataset.celebrateChoice);
    } catch {
      // It still changes for now; it just won't be remembered.
    }
    showChosenLook();
    if (option.dataset.celebrateChoice === "on") {
      const { left, top, width, height } = option.getBoundingClientRect();
      celebrate({ clientX: left + width / 2, clientY: top + height / 2 }, { pieces: 14 });
    }
  });
}

const holidaysOptions = [...document.querySelectorAll("[data-holidays-choice]")];
for (const option of holidaysOptions) {
  option.addEventListener("click", () => {
    try {
      localStorage.setItem(HOLIDAYS_KEY, option.dataset.holidaysChoice);
    } catch {
      // It still changes for now; it just won't be remembered.
    }
    showChosenLook();
    render();
  });
}

function showChosenLook() {
  for (const option of celebrateOptions) option.setAttribute("aria-pressed", String((option.dataset.celebrateChoice === "on") === celebrationsOn()));
  const dark = darkSetting();
  for (const option of darkOptions) option.setAttribute("aria-pressed", String(option.dataset.darkChoice === dark.mode));
  darkNightTimes.hidden = dark.mode !== "night";
  darkFrom.value = dark.from;
  darkTo.value = dark.to;
  const shown = holidaysShown();
  for (const option of holidaysOptions) option.setAttribute("aria-pressed", String((option.dataset.holidaysChoice === "on") === shown));
  const { theme, background } = document.documentElement.dataset;
  for (const option of themeOptions) {
    option.setAttribute("aria-pressed", String(option.dataset.themeChoice === theme));
  }
  for (const option of backgroundOptions) {
    option.setAttribute("aria-pressed", String(option.dataset.backgroundChoice === background));
  }
}

function chooseLook(setting, key, value) {
  document.documentElement.dataset[setting] = value;
  showChosenLook();
  try {
    localStorage.setItem(key, value);
  } catch {
    // The look still applies; it just won't be remembered next time.
  }
}

for (const option of themeOptions) {
  option.addEventListener("click", () => chooseLook("theme", THEME_KEY, option.dataset.themeChoice));
}
for (const option of backgroundOptions) {
  option.addEventListener("click", () => chooseLook("background", BACKGROUND_KEY, option.dataset.backgroundChoice));
}

function showCanvasSetting() {
  const link = savedCanvasLink();
  settingsCanvasLink.value = link;
  settingsCanvasStatus.textContent = link
    ? "✓ A Canvas link is saved. Import uses it for Download my calendar file."
    : "No Canvas link saved yet. Paste the Calendar Feed link from Canvas Calendar.";
}

function storeCanvasLink(link) {
  try {
    if (link) localStorage.setItem(CANVAS_LINK_KEY, link);
    else localStorage.removeItem(CANVAS_LINK_KEY);
  } catch {
    settingsCanvasMessage.textContent = "Couldn't save that in this browser.";
    return false;
  }
  canvasLinkInput.value = link;
  showCanvasSetting();
  return true;
}

const settingsGoogleStatus = document.getElementById("settings-google-status");
const settingsGoogleConnect = document.getElementById("settings-google-connect");
const settingsGoogleDisconnect = document.getElementById("settings-google-disconnect");
const settingsGoogleMessage = document.getElementById("settings-google-message");
const settingsGoogleUnhide = document.getElementById("settings-google-unhide");

settingsGoogleUnhide.addEventListener("click", () => {
  googleChanges = Object.fromEntries(Object.entries(googleChanges).filter(([, change]) => !change.hidden));
  persistGoogleChanges();
  render();
  showGoogleSetting();
  settingsGoogleMessage.textContent = "Your hidden Google events are back.";
});

const GOOGLE_STATUS_TEXT = {
  off: "Not connected. Connect to see your Google Calendar events alongside your tasks.",
  suggest: "Connected on another computer. Connect here too to see your events on this one.",
  loading: "Connecting… Finish in the Google window that opened.",
  reconnect: "Connected, but Google needs a quick click to keep your events up to date.",
  saved: "Showing your saved Google events. Click Update to get the latest.",
  error: "Couldn't load your Google Calendar. Due Next will try again in a few minutes.",
};

function showGoogleSetting() {
  const { status, account } = googleCalendarStatus();
  settingsGoogleStatus.textContent =
    status === "connected" ? `✓ Connected${account ? ` as ${account}` : ""}. Your events are on the calendar.` : GOOGLE_STATUS_TEXT[status];
  settingsGoogleConnect.hidden = status === "connected";
  settingsGoogleConnect.disabled = status === "loading";
  settingsGoogleConnect.textContent = ["off", "suggest", "loading"].includes(status)
    ? "Connect Google Calendar"
    : status === "saved"
      ? "Update"
      : "Reconnect";
  settingsGoogleDisconnect.hidden = status === "off";
  const hiddenCount = Object.values(googleChanges).filter((change) => change.hidden).length;
  settingsGoogleUnhide.hidden = hiddenCount === 0;
  settingsGoogleUnhide.textContent = `Show ${hiddenCount} hidden event${hiddenCount === 1 ? "" : "s"} again`;
}

async function connectGoogle() {
  settingsGoogleMessage.textContent = "";
  try {
    await connectGoogleCalendar();
    showToast("Google Calendar is up to date.");
  } catch (error) {
    settingsGoogleMessage.textContent = `${error.message} If no Google window opened, allow pop-ups for this page and try again.`;
    showToast(error.message);
  }
}

settingsGoogleConnect.addEventListener("click", connectGoogle);
googleBannerButton.addEventListener("click", connectGoogle);
settingsGoogleDisconnect.addEventListener("click", () => {
  disconnectGoogleCalendar();
  settingsGoogleMessage.textContent = "Disconnected. Your Google events are no longer shown.";
});

document.getElementById("settings-save-canvas").addEventListener("click", () => {
  const link = settingsCanvasLink.value.trim();
  settingsCanvasMessage.textContent = "";
  if (!isCanvasFeedLink(link)) {
    settingsCanvasMessage.textContent = link
      ? "That doesn't look like a Canvas calendar link. It starts with https:// and ends in .ics."
      : "Paste your Canvas calendar link first.";
    settingsCanvasLink.focus();
    return;
  }
  if (storeCanvasLink(link)) settingsCanvasMessage.textContent = "Saved.";
});

document.getElementById("settings-remove-canvas").addEventListener("click", () => {
  settingsCanvasMessage.textContent = "";
  if (!savedCanvasLink()) {
    settingsCanvasMessage.textContent = "There's no link to remove.";
    return;
  }
  if (storeCanvasLink("")) settingsCanvasMessage.textContent = "Removed.";
});

const settingsAccountMessage = document.getElementById("settings-account-message");
const signOutButton = document.getElementById("settings-sign-out");

// Settings → Account → Change password.
const changePasswordForm = document.getElementById("change-password-form");
const changePasswordMessage = document.getElementById("change-password-message");
const changePasswordSubmit = document.getElementById("change-password-submit");

document.getElementById("change-password-forgot").addEventListener("click", async (event) => {
  const forgotButton = event.currentTarget;
  forgotButton.disabled = true;
  changePasswordMessage.classList.add("is-info");
  changePasswordMessage.textContent = "Sending…";
  try {
    await sendPasswordResetToMe();
    changePasswordMessage.textContent = `A link to reset your password is on its way to ${currentAccountEmail()}. If you don't see it, check spam.`;
  } catch (error) {
    changePasswordMessage.classList.remove("is-info");
    changePasswordMessage.textContent = authErrorMessage(error.code);
  } finally {
    forgotButton.disabled = false;
  }
});

changePasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fields = ["current-password", "new-password", "new-password-again"].map((id) => document.getElementById(id));
  const [current, next, again] = fields.map((field) => field.value);
  const code = document.getElementById("change-password-code").value;
  const problem = passwordChangeError({ current, next, again }) || (twoStepIsOn() ? twoStepCodeError(code) : "");
  changePasswordMessage.classList.remove("is-info");
  changePasswordMessage.textContent = problem;
  if (problem) return;
  changePasswordSubmit.disabled = true;
  changePasswordMessage.textContent = "Changing…";
  try {
    await changePassword(current, next, code);
    changePasswordForm.reset();
    changePasswordMessage.classList.add("is-info");
    changePasswordMessage.textContent = "Password changed ✓ Use the new one next time you sign in.";
  } catch (error) {
    const wrongCurrent = error.code === "auth/invalid-credential" || error.code === "auth/wrong-password";
    changePasswordMessage.textContent = wrongCurrent ? "That current password isn't right." : authErrorMessage(error.code);
  } finally {
    changePasswordSubmit.disabled = false;
  }
});

// Settings → Account → Download a backup: everything saved to the account, as one file.
document.getElementById("download-backup").addEventListener("click", () => {
  const { name, text } = backupFile(localStorage);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast(`Backup downloaded: ${name}`);
});

// Settings → Account → Two-step sign-in: turning it on (password, then scan a QR code and type the
// first code) or off (password and a code).
const twoStepStatus = document.getElementById("two-step-status");
const twoStepForm = document.getElementById("two-step-form");
const twoStepPassword = document.getElementById("two-step-password");
const twoStepOffCode = document.getElementById("two-step-off-code");
const twoStepSubmit = document.getElementById("two-step-submit");
const twoStepSetup = document.getElementById("two-step-setup");
const twoStepCode = document.getElementById("two-step-code");
const twoStepMessage = document.getElementById("two-step-message");
const QR_LIBRARY = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
let twoStepSecret = null;

function showTwoStepMessage(text, { isInfo = false } = {}) {
  twoStepMessage.textContent = text;
  twoStepMessage.classList.toggle("is-info", isInfo);
}

function showTwoStepSetting() {
  const on = twoStepIsOn();
  twoStepStatus.textContent = on
    ? "✓ On. Signing in asks for your password and a 6-digit code from your authenticator app."
    : "Off. Turn it on so signing in also needs a 6-digit code from an app on your phone, so a stolen password isn't enough.";
  twoStepSubmit.textContent = on ? "Turn off" : "Turn on";
  twoStepForm.hidden = false;
  twoStepSetup.hidden = true;
  twoStepSecret = null;
  twoStepForm.reset();
  twoStepSetup.reset();
  // Changing your password, or turning two-step off, also asks for a code while it's on.
  for (const field of document.querySelectorAll(".two-step-code-field")) field.hidden = !on;
}

function loadQrLibrary() {
  if (window.qrcode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = QR_LIBRARY;
    script.onload = resolve;
    script.onerror = () => reject(new Error("no-qr"));
    document.head.append(script);
  });
}

async function drawTwoStepQr(link) {
  const holder = document.getElementById("two-step-qr");
  holder.textContent = "";
  try {
    await loadQrLibrary();
    const qr = window.qrcode(0, "M");
    qr.addData(link);
    qr.make();
    holder.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch {
    holder.textContent = "Couldn't draw the QR code. Type the key below into the app instead.";
  }
}

twoStepForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const on = twoStepIsOn();
  const password = twoStepPassword.value;
  const problem = !password ? "Type your password." : on ? twoStepCodeError(twoStepOffCode.value) : "";
  showTwoStepMessage(problem);
  if (problem) return;
  twoStepSubmit.disabled = true;
  showTwoStepMessage(on ? "Turning off…" : "Getting things ready…", { isInfo: true });
  try {
    if (on) {
      await turnOffTwoStep(password, twoStepOffCode.value);
      showTwoStepSetting();
      showTwoStepMessage("Two-step sign-in is off. Signing in needs only your password now.", { isInfo: true });
      return;
    }
    const started = await startTwoStep(password);
    if (started.verifyEmail) {
      showTwoStepMessage(
        `First, verify your email: a link is on its way to ${started.verifyEmail} (check spam too). Click it, then come back and press Turn on again.`,
        { isInfo: true },
      );
      return;
    }
    twoStepSecret = started.secret;
    document.getElementById("two-step-key").textContent = started.key;
    twoStepForm.hidden = true;
    twoStepSetup.hidden = false;
    showTwoStepMessage("");
    await drawTwoStepQr(started.link);
    twoStepCode.focus();
  } catch (error) {
    const wrongPassword = error.code === "auth/invalid-credential" || error.code === "auth/wrong-password";
    showTwoStepMessage(wrongPassword ? "That password isn't right." : authErrorMessage(error.code));
  } finally {
    twoStepSubmit.disabled = false;
  }
});

twoStepSetup.addEventListener("submit", async (event) => {
  event.preventDefault();
  const problem = twoStepCodeError(twoStepCode.value);
  showTwoStepMessage(problem);
  if (problem || !twoStepSecret) return;
  const confirm = document.getElementById("two-step-confirm");
  confirm.disabled = true;
  showTwoStepMessage("Checking the code…", { isInfo: true });
  try {
    await finishTwoStep(twoStepSecret, twoStepCode.value);
    showTwoStepSetting();
    showTwoStepMessage("Two-step sign-in is on ✓ Next time you sign in, have your authenticator app ready.", { isInfo: true });
  } catch (error) {
    showTwoStepMessage(authErrorMessage(error.code));
  } finally {
    confirm.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  settingsAccountMessage.textContent = "Signing out…";
  try {
    await signOutOfDueNext();
  } catch {
    signOutButton.disabled = false;
    settingsAccountMessage.textContent = "Couldn't sign out. Check your internet and try again.";
  }
});

document.getElementById("open-settings").addEventListener("click", () => {
  document.getElementById("settings-account-name").textContent = currentAccountName();
  document.getElementById("settings-account-email").textContent = currentAccountEmail();
  settingsAccountMessage.textContent = "";
  showTwoStepSetting();
  showTwoStepMessage("");
  showChosenLook();
  settingsQuickTimes.clearMessage();
  settingsQuickTimes.render();
  settingsCanvasMessage.textContent = "";
  showCanvasSetting();
  showGoogleSetting();
  settingsGoogleMessage.textContent = "";
  showSettingsSection("look");
  settingsPanel.showModal();
});
document.getElementById("close-settings").addEventListener("click", () => settingsPanel.close());
settingsPanel.addEventListener("click", (event) => {
  if (event.target === settingsPanel) settingsPanel.close();
});

// Remember whether the Overdue section was left open. It's only a convenience, so storage errors are ignored.
try {
  overdueSection.open = localStorage.getItem(OVERDUE_OPEN_KEY) === "true";
} catch {
  overdueSection.open = false;
}
overdueSection.addEventListener("toggle", () => {
  try {
    localStorage.setItem(OVERDUE_OPEN_KEY, String(overdueSection.open));
  } catch {
    // Not saving this preference is harmless.
  }
});

try {
  tasks = loadTasks(localStorage);
  events = loadEvents(localStorage);
  loadGoogleChanges();
  groups = loadGroups(localStorage);
  progress = loadProgress(localStorage);
  loadDayPlan();
} catch {
  showStorageError("Couldn't read your saved tasks. You can still add tasks, but they may not be saved.");
}
// Canvas tasks imported before importedOn existed get settled now, so old past work doesn't show as missed.
if (settleImportedCanvasTasks(tasks, new Date()) > 0) persist();
loadQuickTimes();
loadViewSettings();
startGoogleCalendar(render);
render();

// The first time the app opens on a Sunday, a gentle look at the week ahead. It replaces the
// morning card that day, so there's only ever one.
const SUNDAY_SHOWN_KEY = "due-sunday-shown";
const SUNDAY_LIST_LIMIT = 6;

function showSundayPlan() {
  const now = new Date();
  // Opening the app with ?preview=sunday shows the card any day, to check how it looks.
  const preview = new URLSearchParams(location.search).get("preview") === "sunday";
  if (preview) now.setDate(now.getDate() - now.getDay());
  let lastShown = "";
  try {
    lastShown = preview ? "" : (localStorage.getItem(SUNDAY_SHOWN_KEY) ?? "");
  } catch {
    // Without storage it may show again on the next open, which is harmless.
  }
  const plan = sundayPlan(tasks, now, lastShown);
  if (!plan) return false;
  const weekday = (dateKey) => formatDay(dateKey, { weekday: "short" });
  const count = plan.due.length;
  document.getElementById("sunday-summary").textContent =
    count === 0 ? "Nothing due this week 🌷" : `${count} due this week${plan.busiest ? ` · busiest ${weekday(plan.busiest.date)} (${plan.busiest.count})` : ""}`;
  const shown = plan.due.slice(0, SUNDAY_LIST_LIMIT);
  document.getElementById("sunday-list").replaceChildren(
    ...shown.map((task) => {
      const item = document.createElement("li");
      const day = document.createElement("span");
      day.className = "sunday-day";
      day.textContent = weekday(task.due);
      item.append(day, ` ${task.name}${task.course ? ` · ${task.course}` : ""}`);
      return item;
    }),
    ...(count > shown.length ? [Object.assign(document.createElement("li"), { textContent: `+${count - shown.length} more` })] : []),
  );
  const extras = [];
  if (plan.big.length > 0) extras.push(`Start early on ${plan.big.map((task) => task.name).join(", ")}.`);
  if (plan.steps > 0) extras.push(`${plan.steps} step${plan.steps === 1 ? "" : "s"} planned.`);
  const extra = document.getElementById("sunday-extra");
  extra.textContent = extras.join(" ");
  extra.hidden = extras.length === 0;
  const card = document.getElementById("sunday-card");
  card.hidden = false;
  document.getElementById("sunday-dismiss").addEventListener("click", () => {
    card.hidden = true;
  });
  // Opens the Semester view at this week's card (its busiest days and tips), highlighted for a moment.
  document.getElementById("sunday-see-week").addEventListener("click", () => {
    card.hidden = true;
    showMode("semester");
    const weekCard = semesterContainer.querySelector(`[data-week-start="${startOfWeek(toDateKey(now))}"]`);
    if (!weekCard) return;
    weekCard.scrollIntoView({ block: "center", behavior: "smooth" });
    weekCard.classList.add("search-found");
    setTimeout(() => weekCard.classList.remove("search-found"), SEARCH_HIGHLIGHT_MS);
  });
  if (!preview) {
    try {
      localStorage.setItem(SUNDAY_SHOWN_KEY, toDateKey(now));
      // It stands in for today's morning card too.
      localStorage.setItem(MORNING_SHOWN_KEY, toDateKey(now));
    } catch {
      // See above.
    }
  }
  return true;
}

// The first time the app opens each morning, show a quick summary of today.
const MORNING_SHOWN_KEY = "due-morning-shown";
function showMorningSummary() {
  const now = new Date();
  // Opening the app with ?preview=morning shows the card at any time, to check how it looks.
  const preview = new URLSearchParams(location.search).get("preview") === "morning";
  if (preview) now.setHours(9, 0);
  let lastShown = "";
  try {
    lastShown = preview ? "" : (localStorage.getItem(MORNING_SHOWN_KEY) ?? "");
  } catch {
    // Without storage it may show again on the next open, which is harmless.
  }
  const summary = morningSummary(tasks, progress, now, lastShown);
  if (!summary) return;
  document.getElementById("morning-text").textContent = summary;
  const card = document.getElementById("morning-card");
  card.hidden = false;
  document.getElementById("morning-dismiss").addEventListener("click", () => {
    card.hidden = true;
  });
  if (preview) return;
  try {
    localStorage.setItem(MORNING_SHOWN_KEY, toDateKey(now));
  } catch {
    // See above.
  }
}
// Ask about missed tasks each time the app opens. "Later" just closes it until next time.
const missedOnOpen = groupTasks(tasks, toDateKey(new Date()), toTimeKey(new Date())).overdue;
if (missedOnOpen.length > 0) {
  openMissedDialog(
    missedOnOpen.map((task) => task.id),
    { single: false },
  );
}

// The Sunday card (or the morning card) waits until the missed-tasks pop-up is closed, because the
// pop-up blocks clicks on everything behind it, including the card's buttons.
function showOpeningCard() {
  if (!showSundayPlan()) showMorningSummary();
  // A ?preview=sunday or ?preview=morning link shows its card once; reloading goes back to normal.
  const params = new URLSearchParams(location.search);
  if (params.has("preview")) {
    params.delete("preview");
    const rest = params.toString();
    history.replaceState(null, "", `${location.pathname}${rest ? `?${rest}` : ""}${location.hash}`);
  }
}
if (missedDialog.open) missedDialog.addEventListener("close", showOpeningCard, { once: true });
else showOpeningCard();
// Re-render each minute so tasks move to Overdue when their time passes.
setInterval(render, 60_000);
setInterval(checkReminders, 20_000);

// Back to the top: a round button in the bottom left corner once the top bar (Today, the arrows,
// + New) has scrolled out of view.
const backToTop = document.getElementById("back-to-top");
const topBar = document.querySelector(".top-bar");

function updateBackToTop() {
  backToTop.hidden = topBar.getBoundingClientRect().bottom > 0;
}

window.addEventListener("scroll", updateBackToTop, { passive: true });
backToTop.addEventListener("click", () => {
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
});
updateBackToTop();
