import { installEventDelegation } from "./events.js";
import { loadStoredList, saveStoredList } from "./storage.js";
import {
  DAY_FORMATTER,
  DEFAULT_PROGRESSIONS,
  MAX_WORKOUTS_PER_DAY,
  METADATA_RATINGS,
  MONTH_DAY_FORMATTER,
  MONTH_FORMATTER,
  MOVEMENT_DATA_URL,
  RATING_COLORS,
  REGION_HIERARCHY,
  REGION_MACRO_ORDER,
  REP_GROUP_SIZE,
  REP_GROUP_TAIL,
  REP_GROUP_THRESHOLD,
  ROLE_GROUPS,
  SORT_DIRECTIONS,
  SORT_LABELS,
  TAG_GROUP_LABELS,
  TAG_GROUP_ORDER,
  TRAINING_RATINGS,
  WEEKDAY_LABELS,
  WORKOUT_COLOR_OPTIONS,
  WORKOUT_HEATMAP_POINTS_PER_MOVEMENT,
  WORKOUT_HEATMAP_ROLE_POINTS,
  WORKOUT_STORAGE_KEY,
  WORKOUT_TEMPLATE_STORAGE_KEY,
  WRAP_HINTS
} from "./config.js";

const movementHome = document.getElementById("movementHome");
const movementWorkoutPage = document.getElementById("movementWorkoutPage");
const movementLivePage = document.getElementById("movementLivePage");
const movementCollection = document.getElementById("movementCollection");
const movementDetailPage = document.getElementById("movementDetailPage");
const movementComparePage = document.getElementById("movementComparePage");
const movementsView = document.getElementById("movementsView");
const movementStatus = document.getElementById("movementStatus");
const evidenceModal = document.getElementById("evidenceModal");
const movementQuickViewModal = document.getElementById("movementQuickViewModal");
const confirmModal = document.getElementById("confirmModal");

let movementLibrary = [];
let anatomyMuscles = [];
let anatomyMeshBase = "./assets/bodyparts3d/";
let movementView = "home";
let activeCollectionGroup = null;
let activeRegionMacro = null;
let selectedCollectionTags = [];
let collectionSearchQuery = "";
let collectionFiltersOpen = false;
let collectionSortOpen = false;
let collectionSortMetric = "composite";
let collectionSortSubtype = null;
let collectionSortDirection = "none";
let collectionSortMenuOpen = false;
let collectionSortDirectionOpen = false;
let activeMovementId = null;
let compareAnchorId = null;
let compareTargetId = null;
let compareOriginMovementId = null;
let activeWorkoutId = null;
let activeWorkoutTemplateId = null;
let activeBlockId = null;
let workoutBuilderReturnWorkoutId = null;
let schedulePickerOpen = false;
let calendarDaySheetOpen = false;
let quickActivityOpen = false;
let initialEvidenceOpened = false;
let workouts = loadStoredWorkouts();
let workoutTemplates = loadStoredWorkoutTemplates();
let selectedCalendarDate = todayKey();
let visibleCalendarMonth = monthStart(parseDateKey(selectedCalendarDate));
let pendingConfirmAction = null;
let activeBuilderMovementDrag = null;
let builderPointerDrag = null;
const selectedMuscles = {};

const DELEGATED_HANDLERS = {
  click: {
    stopPropagation: event => event.stopPropagation(),
    openMovementCollection: () => openMovementCollection(),
    changeCalendarRange: (event, control) => changeCalendarRange(Number(control.dataset.direction)),
    goToToday: () => goToToday(),
    openCalendarDaySheet: (event, control) => openCalendarDaySheet(control.dataset.dateKey, event),
    closeCalendarDaySheet: () => closeCalendarDaySheet(),
    openSchedulePicker: (event, control) => openSchedulePicker(control.dataset.dateKey, event),
    openQuickActivity: (event, control) => openQuickActivity(control.dataset.dateKey, event),
    createRestDay: (event, control) => createRestDay(control.dataset.dateKey, event),
    closeQuickActivity: () => closeQuickActivity(),
    openLiveWorkout: (event, control) => {
      event.stopPropagation();
      openLiveWorkout(control.dataset.workoutId);
    },
    closeSchedulePicker: () => closeSchedulePicker(),
    createWorkoutTemplate: () => createWorkoutTemplate(),
    scheduleWorkoutFromTemplate: (event, control) => scheduleWorkoutFromTemplate(control.dataset.templateId, control.dataset.dateKey),
    openWorkoutTemplateBuilder: (event, control) => openWorkoutTemplateBuilder(control.dataset.templateId),
    updateWorkoutColor: (event, control) => updateWorkoutColor(control.dataset.workoutId, control.dataset.color),
    openMovementHome: () => openMovementHome(),
    exitWorkoutBuilder: (event, control) => exitWorkoutBuilder(control.dataset.workoutId),
    addWorkoutBlock: (event, control) => addWorkoutBlock(control.dataset.workoutId),
    deleteWorkout: (event, control) => deleteWorkout(control.dataset.workoutId),
    openTemplateNameDialog: (event, control) => openTemplateNameDialog(control.dataset.workoutId),
    saveScheduledWorkout: (event, control) => saveScheduledWorkout(control.dataset.workoutId),
    editLiveWorkout: (event, control) => openWorkoutBuilder(control.dataset.workoutId, { returnTo: "live" }),
    toggleLiveWorkoutComplete: (event, control) => toggleLiveWorkoutComplete(control.dataset.workoutId),
    changeLiveBlock: (event, control) => changeLiveBlock(Number(control.dataset.direction)),
    openMovementQuickView: (event, control) => openMovementQuickView(control.dataset.movementId),
    addSetToWorkoutMovement: (event, control) => addSetToWorkoutMovement(
      control.dataset.workoutId,
      control.dataset.blockId,
      control.dataset.movementId
    ),
    removeLiveSet: (event, control) => removeLiveSet(event, control),
    openSetLoadEditor: (event, control) => openSetLoadEditor(event, control),
    toggleExtraRepButton: (event, control) => toggleExtraRepButton(event, control),
    increaseTargetReps: (event, control) => adjustTargetReps(event, control, 1),
    decreaseTargetReps: (event, control) => adjustTargetReps(event, control, -1),
    toggleWorkoutBlockFlow: (event, control) => toggleWorkoutBlockFlow(control.dataset.workoutId, control.dataset.blockId),
    openWorkoutMovementPicker: (event, control) => openWorkoutMovementPicker(control.dataset.workoutId, control.dataset.blockId),
    removeWorkoutBlock: (event, control) => removeWorkoutBlock(control.dataset.workoutId, control.dataset.blockId),
    removeBuilderMovement: (event, control) => removeBuilderMovement(event, control),
    viewWorkoutMovement: (event, control) => {
      if (consumeBuilderRowClick()) return;
      viewWorkoutMovement(control.dataset.workoutId, control.dataset.blockId, control.dataset.movementId);
    },
    closeConfirmDialog: () => closeConfirmDialog(),
    confirmDialogAction: () => confirmDialogAction(),
    finishWorkoutMovementPicker: () => finishWorkoutMovementPicker(),
    openMovementBackToCollection: () => openMovementBackToCollection(),
    startCompareFromMovement: (event, control) => startCompareFromMovement(control.dataset.movementId),
    openEvidence: (event, control) => openEvidence(control.dataset.movementId),
    closeMovementQuickView: () => closeMovementQuickView(),
    openCompareSelection: () => openCompareSelection(),
    clearCompareMode: () => clearCompareMode(),
    returnToCompareOrigin: () => returnToCompareOrigin(),
    clearCompareModeAndReturn: () => clearCompareMode({ returnToOrigin: true }),
    toggleCollectionFilters: () => toggleCollectionFilters(),
    toggleCollectionSortPanel: () => toggleCollectionSortPanel(),
    toggleSortDirectionMenu: () => toggleSortDirectionMenu(),
    setSortDirection: (event, control) => setSortDirection(control.dataset.direction),
    setCollectionSort: (event, control) => setCollectionSort(control.dataset.metric),
    setCollectionSortSubtype: (event, control) => setCollectionSortSubtype(control.dataset.subtype),
    addMovementToActiveWorkout: (event, control) => addMovementToActiveWorkout(control.dataset.movementId, event),
    openMovementGroup: (event, control) => openMovementGroup(control.dataset.group),
    toggleCollectionTag: (event, control) => toggleCollectionTag(control.dataset.label, control.dataset.group),
    toggleRegionMacro: (event, control) => toggleRegionMacro(control.dataset.label),
    openMovementDetail: (event, control) => openMovementDetail(control.dataset.movementId),
    closeEvidence: () => closeEvidence(),
    selectMovementMuscle: (event, control) => selectMovementMuscle(control.dataset.movementId, control.dataset.muscleId)
  },
  input: {
    updateWorkoutColor: (event, control) => updateWorkoutColor(control.dataset.workoutId, control.value),
    updateWorkoutTitle: (event, control) => updateWorkoutTitle(control.dataset.workoutId, control.value),
    updateTimedSetDuration: (event, control) => updateTimedSetDuration(event, control),
    handleCollectionSearchInput: event => handleCollectionSearchInput(event)
  },
  submit: {
    confirmSaveWorkoutAsTemplate: (event, control) => confirmSaveWorkoutAsTemplate(event, control.dataset.workoutId),
    createQuickActivity: (event, control) => createQuickActivity(event, control)
  },
  keydown: {
    handleMovementListingKey: (event, control) => handleMovementListingKey(event, control.dataset.movementId),
    handleRepStripKeydown: (event, control) => handleRepStripKeydown(event, control)
  },
  touchstart: {
    startLiveBlockSwipe: event => startLiveBlockSwipe(event),
    startDetailSwipe: event => startDetailSwipe(event)
  },
  touchend: {
    finishLiveBlockSwipe: event => finishLiveBlockSwipe(event),
    finishDetailSwipe: event => finishDetailSwipe(event)
  },
  pointerdown: {
    startLiveSetSwipe: (event, control) => startLiveSetSwipe(event, control),
    startRepStripDrag: (event, control) => startRepStripDrag(event, control),
    startBuilderRemoveSwipe: (event, control) => startBuilderRemoveSwipe(event, control),
    startBuilderPointerDrag: (event, control) => startBuilderPointerDrag(event, control)
  },
  pointermove: {
    moveLiveSetSwipe: event => moveLiveSetSwipe(event),
    moveBuilderRemoveSwipe: event => moveBuilderRemoveSwipe(event)
  },
  pointerup: {
    finishLiveSetSwipe: event => finishLiveSetSwipe(event),
    finishBuilderRemoveSwipe: event => finishBuilderRemoveSwipe(event)
  },
  pointercancel: {
    cancelLiveSetSwipe: event => cancelLiveSetSwipe(event),
    cancelBuilderRemoveSwipe: event => cancelBuilderRemoveSwipe(event)
  },
  dragstart: {
    startBuilderMovementDrag: (event, control) => startBuilderMovementDrag(event, control)
  },
  dragover: {
    allowBuilderMovementDrop: (event, control) => allowBuilderMovementDrop(event, control)
  },
  dragleave: {
    clearBuilderDropTarget: (event, control) => clearBuilderDropTarget(event, control)
  },
  drop: {
    dropBuilderMovementOnBlock: (event, control) => dropBuilderMovementOnBlock(
      event,
      control.dataset.workoutId,
      control.dataset.blockId,
      control
    ),
    dropBuilderMovementOnRow: (event, control) => dropBuilderMovementOnRow(
      event,
      control.dataset.workoutId,
      control.dataset.blockId,
      Number(control.dataset.movementIndex),
      control
    )
  },
  dragend: {
    finishBuilderMovementDrag: () => finishBuilderMovementDrag()
  }
};

installEventDelegation(document, DELEGATED_HANDLERS);

publishAppData();
initMovementLibrary();

async function initMovementLibrary() {
  try {
    setMovementStatus("Loading movement library");
    const data = await loadMovementData();
    movementLibrary = Array.isArray(data.movements) ? data.movements : [];
    anatomyMuscles = Array.isArray(data.anatomy?.muscles) ? data.anatomy.muscles : [];
    anatomyMeshBase = data.anatomy?.meshBase || anatomyMeshBase;
    publishAppData();
    applyInitialMovementRoute();
    renderMovementApp({ replaceHistory: true });
    openInitialEvidenceFromUrl();
    setMovementStatus("");
  } catch (error) {
    console.error("Movement library failed to load", error);
    setMovementStatus("Movement library failed to load");
  }
}

async function loadMovementData() {
  const response = await fetch(MOVEMENT_DATA_URL);
  if (!response.ok) {
    throw new Error(`Movement data request failed with ${response.status}`);
  }
  return response.json();
}

function publishAppData() {
  window.workoutApp = {
    anatomyMeshBase,
    anatomyMuscles,
    movementLibrary,
    workouts,
    workoutTemplates,
    muscleRolesForMovement,
    muscleIdForName,
    workoutMuscleHeatmap,
    workoutRecordById,
    selectedMuscles
  };
}

function setMovementStatus(message) {
  movementStatus.textContent = message;
}

function renderMovementApp(options = {}) {
  movementsView.dataset.view = movementView;
  movementHome.hidden = movementView !== "home";
  movementWorkoutPage.hidden = movementView !== "workout";
  movementLivePage.hidden = movementView !== "live";
  movementCollection.hidden = movementView !== "collection";
  movementDetailPage.hidden = movementView !== "detail";
  movementComparePage.hidden = movementView !== "compare";

  if (movementView === "home") renderMovementHome();
  if (movementView === "workout") renderWorkoutBuilderPage();
  if (movementView === "live") renderLiveWorkoutPage();
  if (movementView === "collection") renderMovementCollection();
  if (movementView === "detail") renderMovementDetailPage();
  if (movementView === "compare") renderMovementComparePage();

  if (!options.skipHistory) updateMovementHistory({ replaceHistory: options.replaceHistory });
  syncModalScrollLock();
  requestAnimationFrame(() => window.renderLocalAnatomyViewers?.());
}

function renderMovementHome() {
  movementHome.innerHTML = `
    <div class="home-shell">
      <section class="home-panel">
        <h1>Calendar</h1>
        <div class="home-actions single">
          <button type="button" class="compare-button home-library-link" data-action="openMovementCollection">Movement Library</button>
        </div>
      </section>
      <section class="home-stats" aria-label="Workout summary">
        ${renderHomeStat("Last 30", `${completedWorkoutDaysInWindow(30)}/30`, "completed days")}
        ${renderHomeStat("Drafts", workoutCountByStatus(["draft", "active"]), "planned")}
        ${renderHomeStat("Templates", workoutTemplates.length, "workouts")}
      </section>
      <section class="calendar-panel" aria-label="Workout calendar">
        ${renderCalendarHeader()}
        <div class="month-calendar">
          <div class="calendar-weekdays" aria-hidden="true">
            ${WEEKDAY_LABELS.map(label => `<span>${escapeHTML(label)}</span>`).join("")}
          </div>
          <div class="calendar-grid">
            ${calendarDays(visibleCalendarMonth).map(renderCalendarDay).join("")}
          </div>
        </div>
        <div class="mobile-week-calendar">
          ${mobileCalendarWeeks().map(renderMobileCalendarWeek).join("")}
        </div>
      </section>
      ${renderCalendarDaySheet()}
      ${renderScheduleModal()}
      ${renderQuickActivityModal()}
      <section id="workoutLibraryPanel" class="workout-library-panel" aria-label="Workout templates">
        <div class="workout-library-header">
          <h2>Workout Templates</h2>
        </div>
        ${renderWorkoutTemplateList()}
      </section>
    </div>
  `;
}

function renderHomeStat(label, value, caption) {
  return `
    <div class="home-stat">
      <span class="eyebrow">${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
      <span class="movement-count">${escapeHTML(caption)}</span>
    </div>
  `;
}

function renderCalendarHeader() {
  return `
    <div class="calendar-toolbar">
      <h2>${escapeHTML(MONTH_FORMATTER.format(visibleCalendarMonth))}</h2>
      <div class="calendar-nav">
        <button type="button" class="compare-button" data-action="changeCalendarRange" data-direction="-1" aria-label="Previous range">Prev</button>
        <button type="button" class="compare-button" data-action="goToToday">Today</button>
        <button type="button" class="compare-button" data-action="changeCalendarRange" data-direction="1" aria-label="Next range">Next</button>
      </div>
    </div>
  `;
}

function renderMobileCalendarWeek(week) {
  return `
    <section class="mobile-week-block" aria-label="${escapeHTML(week.label)}">
      <div class="mobile-week-days">
        ${week.days.map(date => renderCalendarDay(date, { mobile: true })).join("")}
      </div>
    </section>
  `;
}

function renderCalendarDay(date, options = {}) {
  const key = formatDateKey(date);
  const dayWorkouts = workoutsForDate(key);
  const status = calendarDateStatus(dayWorkouts);
  const isMobile = Boolean(options.mobile);
  const classes = [
    isMobile ? "mobile-calendar-day" : "calendar-day",
    !isMobile && !sameMonth(date, visibleCalendarMonth) ? "outside-month" : "",
    key === todayKey() ? "today" : "",
    dayWorkouts.length ? "has-workout" : "",
    dayWorkouts.some(workout => workout.kind === "rest") ? "rest-day" : "",
    status
  ].filter(Boolean).join(" ");

  if (isMobile) {
    return `
      <button
        type="button"
        class="${classes}"
        data-action="openCalendarDaySheet"
        data-date-key="${escapeHTML(key)}"
        aria-label="${escapeHTML(calendarDayLabel(date, dayWorkouts))}"
        aria-haspopup="dialog"
      >
        <div class="mobile-calendar-date">
          <span>${escapeHTML(WEEKDAY_LABELS[date.getDay()])}</span>
          <strong>${escapeHTML(MONTH_DAY_FORMATTER.format(date))}</strong>
        </div>
        <div class="calendar-day-actions">
          ${renderCalendarWorkoutIndicators(dayWorkouts)}
        </div>
      </button>
    `;
  }

  return `
    <button
      type="button"
      class="${classes}"
      data-action="openCalendarDaySheet"
      data-date-key="${escapeHTML(key)}"
      aria-label="${escapeHTML(calendarDayLabel(date, dayWorkouts))}"
      aria-haspopup="dialog"
    >
      <span class="calendar-day-number">${date.getDate()}</span>
      <div class="calendar-day-actions">
        ${renderCalendarWorkoutIndicators(dayWorkouts)}
      </div>
    </button>
  `;
}

function renderCalendarWorkoutIndicators(dayWorkouts) {
  return dayWorkouts.slice(0, MAX_WORKOUTS_PER_DAY).map(workout => `
    <span
      class="calendar-workout-indicator status-${escapeHTML(workout.status)} kind-${escapeHTML(workout.kind || "workout")}"
      style="${workoutColorStyle(workout)}"
      aria-hidden="true"
    ></span>
  `).join("");
}

function renderCalendarDaySheet() {
  if (!calendarDaySheetOpen) return "";
  const dayWorkouts = workoutsForDate(selectedCalendarDate);
  const hasRestDay = dayWorkouts.some(workout => workout.kind === "rest");
  const canAdd = dayWorkouts.length < MAX_WORKOUTS_PER_DAY && !hasRestDay;
  return `
    <div class="schedule-modal calendar-day-modal" data-action="closeCalendarDaySheet" role="presentation">
      <section class="schedule-dialog calendar-day-dialog" data-action="stopPropagation" role="dialog" aria-modal="true" aria-label="Entries on ${escapeHTML(DAY_FORMATTER.format(parseDateKey(selectedCalendarDate)))}">
        <div class="schedule-dialog-header">
          <h2>${escapeHTML(DAY_FORMATTER.format(parseDateKey(selectedCalendarDate)))}</h2>
          <button type="button" class="back-button" data-action="closeCalendarDaySheet">Close</button>
        </div>
        <div class="calendar-day-workout-list">
          ${dayWorkouts.map(workout => `
            <button
              type="button"
              class="calendar-day-workout-option${workout.status === "completed" ? " completed" : ""}${workout.kind === "rest" ? " rest" : ""}"
              style="${workoutColorStyle(workout)}"
              data-action="openLiveWorkout"
              data-workout-id="${escapeHTML(workout.id)}"
            >
              <span class="calendar-day-workout-color" aria-hidden="true"></span>
              <span>
                <strong>${escapeHTML(workoutTitle(workout))}</strong>
                <small>${escapeHTML(workout.kind === "rest" ? "Rest day" : workout.status === "completed" ? "Completed" : "Open workout")}</small>
              </span>
            </button>
          `).join("") || `<p class="empty-state">Nothing logged.</p>`}
        </div>
        ${canAdd ? `
          <div class="calendar-day-add-actions">
            ${dayWorkouts.length ? "" : `
              <button
                type="button"
                class="compare-button calendar-day-add-button"
                data-action="createRestDay"
                data-date-key="${escapeHTML(selectedCalendarDate)}"
              >Rest Day</button>
            `}
            <button
              type="button"
              class="compare-button calendar-day-add-button"
              data-action="openQuickActivity"
              data-date-key="${escapeHTML(selectedCalendarDate)}"
            >Add Activity</button>
            <button
              type="button"
              class="detail-evidence-button calendar-day-add-button"
              data-action="openSchedulePicker"
              data-date-key="${escapeHTML(selectedCalendarDate)}"
            >Add Workout</button>
          </div>
        ` : hasRestDay ? "" : `<p class="movement-count">Maximum of ${MAX_WORKOUTS_PER_DAY} entries.</p>`}
      </section>
    </div>
  `;
}

function renderQuickActivityModal() {
  if (!quickActivityOpen) return "";
  return `
    <div class="schedule-modal" data-action="closeQuickActivity" role="presentation">
      <section class="schedule-dialog quick-activity-dialog" data-action="stopPropagation" role="dialog" aria-modal="true" aria-label="Add activity">
        <div class="schedule-dialog-header">
          <h2>Add Activity</h2>
          <button type="button" class="back-button" data-action="closeQuickActivity">Close</button>
        </div>
        <form class="quick-activity-form" data-submit-action="createQuickActivity">
          <label>
            <span>Name</span>
            <input name="title" maxlength="80" placeholder="Soccer practice" autocomplete="off" required autofocus>
          </label>
          <label class="quick-activity-color-field">
            <span>Color</span>
            <input type="color" name="color" value="${escapeHTML(WORKOUT_COLOR_OPTIONS[0].value)}" aria-label="Activity color">
          </label>
          <button type="submit" class="detail-evidence-button">Save Activity</button>
        </form>
      </section>
    </div>
  `;
}

function renderScheduleModal() {
  if (!schedulePickerOpen) return "";
  if (!workoutTemplates.length) {
    return `
      <div class="schedule-modal" data-action="closeSchedulePicker" role="presentation">
        <section class="schedule-dialog" data-action="stopPropagation" role="dialog" aria-modal="true" aria-label="Choose workout">
          <div class="schedule-dialog-header">
            <div>
              <p class="eyebrow">Add Workout</p>
              <h2>${escapeHTML(DAY_FORMATTER.format(parseDateKey(selectedCalendarDate)))}</h2>
            </div>
            <button type="button" class="back-button" data-action="closeSchedulePicker">Close</button>
          </div>
          <p class="empty-state">No workout templates yet. Create one below.</p>
          <button type="button" class="detail-evidence-button" data-action="createWorkoutTemplate">Add Template</button>
        </section>
      </div>
    `;
  }

  return `
    <div class="schedule-modal" data-action="closeSchedulePicker" role="presentation">
      <section class="schedule-dialog" data-action="stopPropagation" role="dialog" aria-modal="true" aria-label="Choose saved workout">
        <div class="schedule-dialog-header">
          <div>
            <p class="eyebrow">Add Workout</p>
            <h2>${escapeHTML(DAY_FORMATTER.format(parseDateKey(selectedCalendarDate)))}</h2>
          </div>
          <button type="button" class="back-button" data-action="closeSchedulePicker">Close</button>
        </div>
        <div class="template-grid">
          ${workoutTemplates.map(template => renderWorkoutTemplateTile(template, { mode: "schedule", dateKey: selectedCalendarDate })).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderWorkoutTemplateList() {
  return `
    <div class="template-grid">
      <button type="button" class="workout-template-tile add" data-action="createWorkoutTemplate" aria-label="Add template">
        <span class="workout-template-plus" aria-hidden="true">+</span>
        <strong>Add Template</strong>
      </button>
      ${workoutTemplates.map(template => renderWorkoutTemplateTile(template, { mode: "library", dateKey: selectedCalendarDate })).join("")}
    </div>
  `;
}

function renderWorkoutTemplateTile(template, { mode, dateKey }) {
  const movements = workoutMovements(template);
  const action = mode === "schedule" ? "scheduleWorkoutFromTemplate" : "openWorkoutTemplateBuilder";
  const label = mode === "schedule"
    ? `Use ${workoutTitle(template)}`
    : `Edit ${workoutTitle(template)}`;
  return `
    <button
      type="button"
      class="workout-template-tile"
      style="${workoutColorStyle(template)}"
      data-action="${action}"
      data-template-id="${escapeHTML(template.id)}"
      data-date-key="${escapeHTML(dateKey)}"
      aria-label="${escapeHTML(label)}"
    >
      <span class="workout-template-topline">
        <span class="template-movement-count">${movements.length} movement${movements.length === 1 ? "" : "s"}</span>
        <span class="workout-color-chip" aria-hidden="true"></span>
      </span>
      <div>
        <h3>${escapeHTML(workoutTitle(template))}</h3>
      </div>
    </button>
  `;
}

function workoutTitle(workout) {
  if (workout.title) return workout.title;
  if (workout.name) return workout.name;
  if (workout.status === "completed") return "Completed Workout";
  return workout.status ? "Workout Draft" : "Untitled Workout";
}

function renderWorkoutTrainingOverview(workout) {
  const trainingRows = workoutTrainingCategoryScores(workout);
  const setupRows = workoutMetadataCategoryScores(workout);
  if (!trainingRows.length && !setupRows.length) return "";
  return `
    <section class="workout-training-overview" aria-label="Workout training score detail">
      ${trainingRows.length ? `
        <div class="workout-score-section">
          <p class="section-label">Training Max</p>
          <div class="workout-training-grid">
            ${trainingRows.map(row => renderWorkoutTrainingScore(row, "training")).join("")}
          </div>
        </div>
      ` : ""}
      ${setupRows.length ? `
        <div class="workout-score-section">
          <p class="section-label">Setup Average</p>
          <div class="workout-training-grid">
            ${setupRows.map(row => renderWorkoutTrainingScore(row, "metadata")).join("")}
          </div>
        </div>
      ` : ""}
    </section>
  `;
}

function renderWorkoutTrainingScore(row, ratingGroup) {
  const percent = scorePercent(row.score, row.maxScore);
  return `
    <div class="workout-training-score" style="${ratingStyle(row.key, percent, ratingGroup)} --score-percent: ${percent}%;">
      <div class="workout-training-score-head">
        <strong>${escapeHTML(row.label)}</strong>
        <span>${row.score}/${row.maxScore}</span>
      </div>
      <span class="workout-training-track" aria-hidden="true">
        <span class="workout-training-fill"></span>
        ${(row.distribution || []).map(item => `
          <span
            class="workout-score-dot${item.score === row.score ? " best" : ""}"
            style="--dot-left: ${scorePercent(item.score, row.maxScore)}%;"
            title="${escapeHTML(`${item.name}: ${item.score}`)}"
          ></span>
        `).join("")}
      </span>
    </div>
  `;
}

function workoutTrainingCategoryScores(workout) {
  const movements = workoutMovementEntries(workout).map(entry => entry.movement);
  if (!movements.length) return [];
  return Object.entries(TRAINING_RATINGS).map(([key, label]) => {
    const distribution = movements.map(movement => ({
      name: movement.name,
      score: ratingScore(movement, key)
    }));
    return {
      key,
      label,
      score: Math.max(...distribution.map(item => item.score), 0),
      maxScore: 100,
      distribution
    };
  });
}

function workoutMetadataCategoryScores(workout) {
  const movements = workoutMovementEntries(workout).map(entry => entry.movement);
  if (!movements.length) return [];
  return Object.entries(METADATA_RATINGS).map(([key, label]) => ({
    key,
    label,
    score: Math.round(movements.reduce((sum, movement) => sum + ratingScore(movement, key), 0) / movements.length),
    maxScore: 100
  }));
}

function workoutMuscleHeatmap(workout) {
  const totals = new Map();
  workoutMovements(workout).forEach(movement => {
    const roleBuckets = ROLE_GROUPS
      .map(group => ({
        muscles: movementMuscles(movement, group.key).filter(muscle => muscle.name),
        points: WORKOUT_HEATMAP_ROLE_POINTS[group.key] || 0
      }))
      .filter(bucket => bucket.muscles.length && bucket.points);
    const rolePointTotal = roleBuckets.reduce((sum, bucket) => sum + bucket.points, 0);
    if (!rolePointTotal) return;
    const scale = WORKOUT_HEATMAP_POINTS_PER_MOVEMENT / rolePointTotal;
    roleBuckets.forEach(bucket => {
      const pointsPerMuscle = (bucket.points * scale) / bucket.muscles.length;
      bucket.muscles.forEach(muscle => {
        const key = normalizeMuscleName(muscle.name);
        const existing = totals.get(key) || { name: muscle.name, score: 0 };
        existing.score += pointsPerMuscle;
        totals.set(key, existing);
      });
    });
  });
  return [...totals.values()]
    .map(item => ({ ...item, score: Math.round(item.score * 10) / 10 }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function renderWorkoutMuscleMap(workout) {
  const heatmap = workoutMuscleHeatmap(workout);
  if (!heatmap.length) return "";
  return `
    <section class="workout-muscle-map" style="${workoutColorStyle(workout)}" aria-label="Workout muscle map">
      <div class="workout-muscle-map-head">
        <p class="section-label">Muscle Map</p>
      </div>
      <div class="movement-visual workout-map-visual">
        <div
          class="local-anatomy-viewer workout-anatomy-viewer"
          data-workout-id="${escapeHTML(workout.id)}"
          aria-label="${escapeHTML(workoutTitle(workout))} workout muscle activation viewer"
        >
          <div class="anatomy-loading">Loading workout muscle map</div>
        </div>
        <span class="workout-map-gradient" aria-hidden="true"></span>
      </div>
    </section>
  `;
}

function renderWorkoutColorPicker(workout) {
  const activeColor = workoutColor(workout);
  return `
    <div class="workout-color-picker" aria-label="Workout color">
      ${WORKOUT_COLOR_OPTIONS.map(option => `
        <button
          type="button"
          class="workout-color-swatch${option.value === activeColor ? " active" : ""}"
          style="--workout-color: ${option.value};"
          data-action="updateWorkoutColor"
          data-workout-id="${escapeHTML(workout.id)}"
          data-color="${escapeHTML(option.value)}"
          aria-label="Set workout color to ${escapeHTML(option.label)}"
          aria-pressed="${option.value === activeColor ? "true" : "false"}"
        ></button>
      `).join("")}
      <input
        type="color"
        class="workout-custom-color"
        value="${escapeHTML(activeColor)}"
        aria-label="Choose custom workout color"
        data-input-action="updateWorkoutColor"
        data-workout-id="${escapeHTML(workout.id)}"
      >
    </div>
  `;
}

function renderWorkoutBuilderPage() {
  const workout = activeWorkout();
  if (!workout) {
    movementWorkoutPage.innerHTML = `
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openMovementHome">Back</button>
      </div>
      <p class="empty-state">No workout selected.</p>
    `;
    return;
  }

  const isTemplate = activeWorkoutIsTemplate();
  const blocks = workoutBlocks(workout);
  movementWorkoutPage.innerHTML = `
    <div class="workout-builder">
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="exitWorkoutBuilder" data-workout-id="${escapeHTML(workout.id)}">Back</button>
        ${isTemplate ? "" : `<span class="movement-count">${escapeHTML(shortDateLabel(workout.date))}</span>`}
      </div>
      <section class="workout-builder-header">
        <p class="eyebrow">${isTemplate ? "Workout Template" : "Scheduled Workout"}</p>
        <input
          class="workout-title-input"
          value="${escapeHTML(workout.title || workout.name || "")}"
          placeholder="${escapeHTML(workoutTitle(workout))}"
          aria-label="Workout title"
          data-input-action="updateWorkoutTitle"
          data-workout-id="${escapeHTML(workout.id)}"
        >
        ${renderWorkoutColorPicker(workout)}
        <div class="workout-builder-actions">
          <button type="button" class="detail-evidence-button" data-action="addWorkoutBlock" data-workout-id="${escapeHTML(workout.id)}">Add Block</button>
          <button type="button" class="delete-button" data-action="deleteWorkout" data-workout-id="${escapeHTML(workout.id)}">${isTemplate ? "Delete Template" : "Delete Workout"}</button>
        </div>
      </section>
      <section class="workout-block-list" aria-label="Workout flow">
        ${blocks.map((block, index) => renderWorkoutBlock(workout, block, index)).join("")}
      </section>
      ${renderWorkoutMuscleMap(workout)}
      ${renderWorkoutTrainingOverview(workout)}
      ${isTemplate ? "" : `
        <section class="workout-builder-save-footer" aria-label="Save scheduled workout">
          <span class="movement-count">Saved on ${escapeHTML(shortDateLabel(workout.date))}.</span>
          <button type="button" class="secondary" data-action="openTemplateNameDialog" data-workout-id="${escapeHTML(workout.id)}">Save as Template</button>
          <button type="button" data-action="saveScheduledWorkout" data-workout-id="${escapeHTML(workout.id)}">Save Workout</button>
        </section>
      `}
    </div>
  `;
}

function renderLiveWorkoutPage() {
  const workout = activeScheduledWorkout();
  if (!workout) {
    movementLivePage.innerHTML = `
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openMovementHome">Back</button>
      </div>
      <p class="empty-state">No scheduled workout selected.</p>
    `;
    return;
  }

  if (workout.status === "completed") {
    renderCompletedWorkoutPage(workout);
    return;
  }

  const blocks = workoutBlocks(workout);
  const blockState = liveBlockState(workout, blocks);
  const progress = liveWorkoutProgress(workout);
  const completeLabel = "Finish";
  movementLivePage.innerHTML = `
    <div class="live-workout" style="${workoutColorStyle(workout)}">
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openMovementHome">Back</button>
        <div class="compare-tray-actions">
          <button type="button" class="compare-button" data-action="editLiveWorkout" data-workout-id="${escapeHTML(workout.id)}">Edit</button>
          <button type="button" class="detail-evidence-button" data-action="toggleLiveWorkoutComplete" data-workout-id="${escapeHTML(workout.id)}">${completeLabel}</button>
        </div>
      </div>
      <section class="live-workout-header">
        <div class="live-workout-title-row">
          <div>
            <p class="eyebrow">Live Workout</p>
            <h1>${escapeHTML(workoutTitle(workout))}</h1>
          </div>
          <span class="workout-color-chip" aria-hidden="true"></span>
        </div>
        <span class="movement-count">${escapeHTML(shortDateLabel(workout.date))}</span>
        ${renderLiveWorkoutProgress(progress)}
      </section>
      <section
        class="live-workout-list"
        aria-label="Live workout movements"
        data-touchstart-action="startLiveBlockSwipe"
        data-touchend-action="finishLiveBlockSwipe"
      >
        ${blockState.block ? renderLiveWorkoutBlock(workout, blockState.block, blockState.index, blockState.count) : `<p class="empty-state">No blocks in this workout yet.</p>`}
      </section>
    </div>
  `;
}

function renderCompletedWorkoutPage(workout) {
  const isQuickEntry = workout.kind !== "workout";
  const blocks = workoutBlocks(workout).filter(block => blockMovements(block).length);
  movementLivePage.innerHTML = `
    <div class="completed-workout" style="${workoutColorStyle(workout)}">
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openMovementHome">Back</button>
        ${isQuickEntry ? `
          <button type="button" class="delete-button" data-action="deleteWorkout" data-workout-id="${escapeHTML(workout.id)}">Delete</button>
        ` : `
          <button type="button" class="compare-button" data-action="toggleLiveWorkoutComplete" data-workout-id="${escapeHTML(workout.id)}">Reopen</button>
        `}
      </div>
      <header class="completed-workout-header">
        <div>
          <p class="eyebrow">Completed</p>
          <h1>${escapeHTML(workoutTitle(workout))}</h1>
        </div>
        <span class="completed-workout-mark" aria-hidden="true"></span>
        <p class="movement-count">${escapeHTML(shortDateLabel(workout.date))}</p>
      </header>
      ${blocks.length ? `
        <section class="completed-workout-blocks" aria-label="Completed workout record">
          ${blocks.map((block, index) => renderCompletedWorkoutBlock(workout, block, index)).join("")}
        </section>
      ` : ""}
    </div>
  `;
}

function renderCompletedWorkoutBlock(workout, block, blockIndex) {
  const movements = blockMovements(block);
  return `
    <section class="completed-workout-block">
      <p class="eyebrow">Block ${blockIndex + 1}</p>
      ${movements.map(entry => renderCompletedWorkoutMovement(workout, entry)).join("") || `<p class="movement-count">No movements.</p>`}
    </section>
  `;
}

function renderCompletedWorkoutMovement(workout, entry) {
  const movement = entry.movement;
  const plan = movementProgressionPlan(movement, entry, workout);
  const sets = plan.setTargets.map((target, setIndex) => displayLiveSet(entry, target, setIndex));
  return `
    <div class="completed-workout-movement">
      <button type="button" class="live-movement-title-button" data-action="openMovementQuickView" data-movement-id="${escapeHTML(movement.id)}">${escapeHTML(movement.name)}</button>
      <div class="completed-set-list">
        ${sets.map((set, setIndex) => renderCompletedSet(set, plan.schema, setIndex)).join("")}
      </div>
    </div>
  `;
}

function renderCompletedSet(set, schema, setIndex) {
  if (set.metric === "seconds") {
    const actual = set.completedDurationSeconds || 0;
    return `
      <div class="completed-set-row${set.done ? " done" : ""}">
        <span>Set ${setIndex + 1}</span>
        <strong>${actual} sec</strong>
        <small>Target ${set.targetDurationSeconds} sec</small>
      </div>
    `;
  }
  const load = formatLoadDisplay(set.load, schema);
  return `
    <div class="completed-set-row${set.done ? " done" : ""}">
      <span>Set ${setIndex + 1}</span>
      <strong>${escapeHTML(load)} × ${set.completedReps}</strong>
      <small>Target ${set.targetReps}</small>
    </div>
  `;
}

function renderLiveWorkoutProgress(progress) {
  return `
    <div class="live-progress" data-live-progress style="--progress: ${progress.percent}%">
      <div class="live-progress-row">
        <span class="movement-count">Progress</span>
        <strong data-live-progress-percent>${progress.percent}%</strong>
      </div>
      <span class="live-progress-track" aria-hidden="true"><span class="live-progress-fill"></span></span>
      <span class="movement-count" data-live-progress-count>${progress.completed}/${progress.total} sets complete</span>
    </div>
  `;
}

function renderLiveWorkoutBlock(workout, block, index, blockCount) {
  const movements = blockMovements(block);
  const complete = liveBlockComplete(workout, block) ? " is-complete" : "";
  const flowMode = blockFlowMode(block, movements);
  return `
    <article class="live-workout-block${complete}" aria-label="Workout block ${index + 1} of ${blockCount}">
      <div class="live-block-header">
        <button type="button" class="back-button" data-action="changeLiveBlock" data-direction="-1" ${index <= 0 ? "disabled" : ""}>Prev</button>
        <div class="live-block-index">
          <span class="movement-count">Block</span>
          <strong>${index + 1}/${Math.max(1, blockCount)}</strong>
        </div>
        <button type="button" class="compare-button" data-action="changeLiveBlock" data-direction="1" ${index >= blockCount - 1 ? "disabled" : ""}>Next</button>
      </div>
      <div class="live-block-grid">
        ${movements.length ? (
          flowMode === "interleaved"
            ? renderInterleavedLiveBlock(workout, block, movements)
            : movements.map(entry => renderLiveWorkoutRow(workout, block, entry)).join("")
        ) : `<div class="block-empty">No movements in this workout yet.</div>`}
      </div>
    </article>
  `;
}

function renderInterleavedLiveBlock(workout, block, movements) {
  const plannedRows = movements.map(entry => ({
    entry,
    plan: movementProgressionPlan(entry.movement, entry, workout)
  }));
  const maxSets = Math.max(0, ...plannedRows.map(row => row.plan.setTargets.length));
  return `
    <div class="live-set-rounds">
      ${Array.from({ length: maxSets }, (_, setIndex) => `
        <section class="live-set-round" aria-label="Interleaved set ${setIndex + 1}">
          <span class="live-set-round-header">Set ${setIndex + 1}</span>
          <div class="live-set-round-grid">
            ${plannedRows.map(row => renderLiveWorkoutSingleSetRow(workout, block, row.entry, row.plan, setIndex)).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderLiveWorkoutRow(workout, block, entry) {
  const movement = movementById(entry.movementId);
  if (!movement) return "";
  const plan = movementProgressionPlan(movement, entry, workout);
  const displaySets = plan.setTargets.map((target, setIndex) => displayLiveSet(entry, target, setIndex));
  const complete = displaySets.length && displaySets.every(set => set.done) ? " is-complete" : "";
  return `
    <div class="live-workout-row${complete}" data-live-movement-row>
      <div class="live-row-header">
        <div class="live-row-title-line">
          <button type="button" class="live-movement-title-button" data-action="openMovementQuickView" data-movement-id="${escapeHTML(movement.id)}">${escapeHTML(movement.name)}</button>
          ${renderLiveAddSetButton(workout, block, entry, movement)}
        </div>
      </div>
      <div class="live-target-strip" aria-label="Next target">
        <span class="live-target-box"><span>Beat</span><strong>${escapeHTML(plan.previousSummary)}</strong></span>
      </div>
      <div class="live-set-grid">
        ${displaySets.map((set, setIndex) => renderLiveSetTile(workout, block, entry, plan, set, setIndex)).join("")}
      </div>
    </div>
  `;
}

function renderLiveWorkoutSingleSetRow(workout, block, entry, plan, setIndex) {
  const target = plan.setTargets[setIndex];
  if (!target) return "";
  const movement = entry.movement || movementById(entry.movementId);
  if (!movement) return "";
  const set = displayLiveSet(entry, target, setIndex);
  const complete = set.done ? " is-complete" : "";
  return `
    <div class="live-workout-row single-set${complete}" data-live-movement-row>
      <div class="live-row-header">
        <div class="live-row-title-line">
          <button type="button" class="live-movement-title-button" data-action="openMovementQuickView" data-movement-id="${escapeHTML(movement.id)}">${escapeHTML(movement.name)}</button>
          ${setIndex === 0 ? renderLiveAddSetButton(workout, block, entry, movement) : ""}
        </div>
      </div>
      <div class="live-set-grid">
        ${renderLiveSetTile(workout, block, entry, plan, set, setIndex)}
      </div>
    </div>
  `;
}

function renderLiveAddSetButton(workout, block, entry, movement) {
  const setCount = targetSetCountForEntry(movement, entry, workout);
  return `
    <button
      type="button"
      class="block-icon-button add live-add-set-button"
      data-action="addSetToWorkoutMovement"
      data-workout-id="${escapeHTML(workout.id)}"
      data-block-id="${escapeHTML(block.id)}"
      data-movement-id="${escapeHTML(entry.movementId)}"
      aria-label="Add set ${setCount + 1} to ${escapeHTML(movement.name)}"
      title="Add set"
    >${renderUiIcon("plus")}</button>
  `;
}

function liveWorkoutProgress(workout) {
  const entries = workoutMovementEntries(workout);
  const totals = entries.reduce((summary, entry) => {
    const plan = movementProgressionPlan(entry.movement, entry, workout);
    plan.setTargets.forEach((target, setIndex) => {
      const set = displayLiveSet(entry, target, setIndex);
      const targetValue = set.metric === "seconds" ? set.targetDurationSeconds : set.targetReps;
      const completedValue = set.metric === "seconds" ? set.completedDurationSeconds : set.completedReps;
      summary.total += 1;
      summary.completed += set.done ? 1 : 0;
      summary.progress += Math.min(1, Math.max(0, completedValue) / Math.max(1, targetValue));
    });
    return summary;
  }, { total: 0, completed: 0, progress: 0 });
  return {
    total: totals.total,
    completed: totals.completed,
    percent: totals.total ? Math.round((totals.progress / totals.total) * 100) : 0
  };
}

function liveMovementComplete(workout, entry) {
  const movement = movementById(entry?.movementId);
  if (!movement) return false;
  const plan = movementProgressionPlan(movement, entry, workout);
  const sets = plan.setTargets.map((target, setIndex) => displayLiveSet(entry, target, setIndex));
  return Boolean(sets.length && sets.every(set => set.done));
}

function liveBlockComplete(workout, block) {
  const entries = blockMovements(block);
  return Boolean(entries.length && entries.every(entry => liveMovementComplete(workout, entry)));
}

function liveBlockState(workout, blocks = workoutBlocks(workout)) {
  if (!blocks.length) return { block: null, index: 0, count: 0 };
  let index = blocks.findIndex(block => block.id === activeBlockId);
  if (index < 0) {
    index = blocks.findIndex(block => !liveBlockComplete(workout, block));
  }
  if (index < 0) index = 0;
  activeBlockId = blocks[index].id;
  return { block: blocks[index], index, count: blocks.length };
}

function changeLiveBlock(direction) {
  const workout = activeScheduledWorkout();
  const blocks = workoutBlocks(workout);
  if (!workout || blocks.length < 2) return;
  const state = liveBlockState(workout, blocks);
  const nextIndex = Math.max(0, Math.min(blocks.length - 1, state.index + direction));
  if (nextIndex === state.index) return;
  activeBlockId = blocks[nextIndex].id;
  renderMovementApp({ replaceHistory: true });
}

let liveBlockSwipeStart = null;

function startLiveBlockSwipe(event) {
  if (event.target.closest(".live-set-tile, .set-rep-boxes, .set-target-tools, .set-load-button, button, input")) return;
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  liveBlockSwipeStart = { x: touch.clientX, y: touch.clientY };
}

function finishLiveBlockSwipe(event) {
  if (!liveBlockSwipeStart) return;
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  const dx = touch.clientX - liveBlockSwipeStart.x;
  const dy = touch.clientY - liveBlockSwipeStart.y;
  liveBlockSwipeStart = null;
  if (Math.abs(dx) < 72 || Math.abs(dy) > 58) return;
  changeLiveBlock(dx < 0 ? 1 : -1);
}

let activeLiveSetSwipe = null;

function startLiveSetSwipe(event, control = event.currentTarget) {
  if (event.button !== undefined && event.button !== 0) return;
  if (event.target.closest(".set-rep-boxes, .rep-box-unit, input")) return;
  const tile = control;
  activeLiveSetSwipe = {
    tile,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    dx: 0,
    active: false
  };
  tile.setPointerCapture?.(event.pointerId);
}

function moveLiveSetSwipe(event) {
  if (!activeLiveSetSwipe || activeLiveSetSwipe.pointerId !== event.pointerId) return;
  const dx = event.clientX - activeLiveSetSwipe.startX;
  const dy = event.clientY - activeLiveSetSwipe.startY;
  if (!activeLiveSetSwipe.active) {
    if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) {
      cancelLiveSetSwipe(event);
      return;
    }
    if (Math.abs(dx) < 8) return;
    activeLiveSetSwipe.active = true;
    activeLiveSetSwipe.tile.classList.add("is-swiping");
  }

  event.preventDefault();
  activeLiveSetSwipe.dx = Math.min(0, Math.max(-120, dx));
  activeLiveSetSwipe.tile.style.transform = `translateX(${activeLiveSetSwipe.dx}px)`;
  activeLiveSetSwipe.tile.classList.toggle("is-remove-ready", activeLiveSetSwipe.dx <= -64);
}

function finishLiveSetSwipe(event) {
  if (!activeLiveSetSwipe || activeLiveSetSwipe.pointerId !== event.pointerId) return;
  const swipe = activeLiveSetSwipe;
  resetLiveSetSwipe();
  if (swipe.dx <= -64) {
    event.preventDefault();
    removeSetFromWorkoutMovement(
      swipe.tile.dataset.workoutId,
      swipe.tile.dataset.blockId,
      swipe.tile.dataset.movementId,
      Number(swipe.tile.dataset.setIndex)
    );
  }
}

function cancelLiveSetSwipe(event) {
  if (activeLiveSetSwipe && (!event || activeLiveSetSwipe.pointerId === event.pointerId)) {
    resetLiveSetSwipe();
  }
}

function resetLiveSetSwipe() {
  if (!activeLiveSetSwipe) return;
  const tile = activeLiveSetSwipe.tile;
  tile.classList.remove("is-swiping", "is-remove-ready");
  tile.style.transform = "";
  try {
    tile.releasePointerCapture?.(activeLiveSetSwipe.pointerId);
  } catch {}
  activeLiveSetSwipe = null;
}

function renderLiveSetTile(workout, block, entry, plan, set, setIndex) {
  if (set.metric === "seconds") {
    return renderTimedLiveSetTile(workout, block, entry, plan, set, setIndex);
  }
  const done = set.completedReps >= set.targetReps ? " is-done" : "";
  const loadDisplay = formatLoadDisplay(set.load, plan.schema);
  const loadEmpty = loadDisplay === "--" ? " empty" : "";
  const totalSlots = Math.max(set.targetReps, set.completedReps);
  return `
    <article
      class="live-set-tile${done}"
      data-workout-id="${escapeHTML(workout.id)}"
      data-block-id="${escapeHTML(block.id)}"
      data-movement-id="${escapeHTML(entry.movementId)}"
      data-set-index="${setIndex}"
      data-target-reps="${set.targetReps}"
      data-completed-reps="${set.completedReps}"
      data-extra-slots="0"
      aria-label="${escapeHTML(entry.movement.name)} set ${setIndex + 1}. Swipe left to remove this set."
      data-pointerdown-action="startLiveSetSwipe"
      data-pointermove-action="moveLiveSetSwipe"
      data-pointerup-action="finishLiveSetSwipe"
      data-pointercancel-action="cancelLiveSetSwipe"
    >
      <button
        type="button"
        class="set-load-button${loadEmpty}"
        data-workout-id="${escapeHTML(workout.id)}"
        data-block-id="${escapeHTML(block.id)}"
        data-movement-id="${escapeHTML(entry.movementId)}"
        data-set-index="${setIndex}"
        data-load="${escapeHTML(set.load ?? "")}"
        data-target-load="${escapeHTML(set.targetLoad ?? "")}"
        data-action="openSetLoadEditor"
        aria-label="${escapeHTML(entry.movement.name)} set ${setIndex + 1} pounds. Click to edit."
      >${escapeHTML(loadDisplay)}</button>
      <div
        class="set-rep-boxes"
        role="slider"
        tabindex="0"
        aria-label="${escapeHTML(entry.movement.name)} set ${setIndex + 1} completed reps"
        aria-valuemin="0"
        aria-valuemax="${totalSlots}"
        aria-valuenow="${set.completedReps}"
        data-pointerdown-action="startRepStripDrag"
        data-keydown-action="handleRepStripKeydown"
      >
        ${renderRepBoxes(workout, block, entry, set, setIndex)}
      </div>
      <div class="set-target-tools">
        ${renderExtraRepControls(workout, block, entry, set, setIndex, plan.setTargets.length)}
        <button
          type="button"
          class="set-target-count"
          data-target-reps="${set.targetReps}"
          data-action="toggleExtraRepButton"
          aria-label="Edit rep slots for ${escapeHTML(entry.movement.name)} set ${setIndex + 1}"
        >${set.targetReps}</button>
      </div>
    </article>
  `;
}

function renderTimedLiveSetTile(workout, block, entry, plan, set, setIndex) {
  const done = set.completedDurationSeconds >= set.targetDurationSeconds ? " is-done" : "";
  return `
    <article
      class="live-set-tile timed-set-tile${done}"
      data-workout-id="${escapeHTML(workout.id)}"
      data-block-id="${escapeHTML(block.id)}"
      data-movement-id="${escapeHTML(entry.movementId)}"
      data-set-index="${setIndex}"
      data-target-duration="${set.targetDurationSeconds}"
      data-completed-duration="${set.completedDurationSeconds}"
      aria-label="${escapeHTML(entry.movement.name)} set ${setIndex + 1}. Target ${set.targetDurationSeconds} seconds. Swipe left to remove this set."
      data-pointerdown-action="startLiveSetSwipe"
      data-pointermove-action="moveLiveSetSwipe"
      data-pointerup-action="finishLiveSetSwipe"
      data-pointercancel-action="cancelLiveSetSwipe"
    >
      <span class="timed-set-target">
        <small>Target</small>
        <strong>${set.targetDurationSeconds} sec</strong>
      </span>
      <label class="timed-duration-field">
        <input
          type="number"
          inputmode="numeric"
          min="0"
          step="1"
          value="${escapeHTML(set.completedDurationSeconds || "")}"
          placeholder="${set.targetDurationSeconds}"
          data-input-action="updateTimedSetDuration"
          data-workout-id="${escapeHTML(workout.id)}"
          data-block-id="${escapeHTML(block.id)}"
          data-movement-id="${escapeHTML(entry.movementId)}"
          data-set-index="${setIndex}"
          data-target-duration="${set.targetDurationSeconds}"
          aria-label="Seconds completed for ${escapeHTML(entry.movement.name)} set ${setIndex + 1}"
        >
        <span>sec</span>
      </label>
      <button
        type="button"
        class="timed-set-remove-button"
        data-action="removeLiveSet"
        data-workout-id="${escapeHTML(workout.id)}"
        data-block-id="${escapeHTML(block.id)}"
        data-movement-id="${escapeHTML(entry.movementId)}"
        data-set-index="${setIndex}"
        ${plan.setTargets.length <= 1 ? "disabled" : ""}
        aria-label="Remove set ${setIndex + 1}"
      >${renderUiIcon("trash")}</button>
    </article>
  `;
}

function renderRepBoxes(workout, block, entry, set, setIndex) {
  return renderRepBoxUnits({
    workoutId: workout.id,
    blockId: block.id,
    movementId: entry.movementId,
    setIndex,
    targetReps: set.targetReps,
    completedReps: set.completedReps,
    totalSlots: Math.max(set.targetReps, set.completedReps)
  });
}

function repBoxUnits(totalReps) {
  const total = Math.max(0, nullableInteger(totalReps) || 0);
  if (total < REP_GROUP_THRESHOLD) {
    return Array.from({ length: total }, (_, index) => {
      const reps = index + 1;
      return { start: reps, end: reps, size: 1 };
    });
  }

  const groups = Math.floor((total - REP_GROUP_TAIL) / REP_GROUP_SIZE);
  const remainder = total - groups * REP_GROUP_SIZE;
  const groupedUnits = Array.from({ length: groups }, (_, index) => ({
    start: index * REP_GROUP_SIZE + 1,
    end: (index + 1) * REP_GROUP_SIZE,
    size: REP_GROUP_SIZE
  }));
  const singleUnits = Array.from({ length: remainder }, (_, index) => {
    const reps = groups * REP_GROUP_SIZE + index + 1;
    return { start: reps, end: reps, size: 1 };
  });
  return [...groupedUnits, ...singleUnits];
}

function renderRepBoxUnits({
  workoutId,
  blockId,
  movementId,
  setIndex,
  targetReps,
  completedReps,
  totalSlots
}) {
  return repBoxUnits(totalSlots).map(unit => {
    const fillPercent = repUnitFillPercent(unit, completedReps);
    const filled = fillPercent >= 100 ? " filled" : "";
    const partial = fillPercent > 0 && fillPercent < 100 ? " partial" : "";
    const grouped = unit.size > 1 ? " grouped" : "";
    const extra = unit.start > targetReps ? " extra" : "";
    const label = unit.size > 1 ? String(unit.size) : "";
    return `
      <span
        class="rep-box rep-box-unit${grouped}${extra}${filled}${partial}"
        style="--rep-fill: ${fillPercent}%;"
        data-workout-id="${escapeHTML(workoutId)}"
        data-block-id="${escapeHTML(blockId)}"
        data-movement-id="${escapeHTML(movementId)}"
        data-set-index="${setIndex}"
        data-reps="${unit.end}"
        data-rep-start="${unit.start}"
        data-rep-size="${unit.size}"
        data-target-reps="${targetReps}"
        aria-hidden="true"
      ><span>${escapeHTML(label)}</span></span>
    `;
  }).join("");
}

function repUnitFillPercent(unit, completedReps) {
  if (completedReps < unit.start) return 0;
  if (completedReps >= unit.end) return 100;
  return Math.round(((completedReps - unit.start + 1) / unit.size) * 100);
}

function renderExtraRepControls(workout, block, entry, set, setIndex, setCount) {
  return `
    <button
      type="button"
      class="extra-rep-step-button extra-rep-add-button"
      data-workout-id="${escapeHTML(workout.id)}"
      data-block-id="${escapeHTML(block.id)}"
      data-movement-id="${escapeHTML(entry.movementId)}"
      data-set-index="${setIndex}"
      data-target-reps="${set.targetReps}"
      data-current-reps="${set.completedReps}"
      data-action="increaseTargetReps"
      hidden
      aria-label="Increase target above ${set.targetReps} reps"
    >+</button>
    <button
      type="button"
      class="extra-rep-step-button extra-rep-remove-button"
      data-workout-id="${escapeHTML(workout.id)}"
      data-block-id="${escapeHTML(block.id)}"
      data-movement-id="${escapeHTML(entry.movementId)}"
      data-set-index="${setIndex}"
      data-target-reps="${set.targetReps}"
      data-current-reps="${set.completedReps}"
      data-action="decreaseTargetReps"
      hidden
      aria-label="Decrease target below ${set.targetReps} reps"
    >-</button>
    <button
      type="button"
      class="extra-rep-step-button set-remove-button"
      data-workout-id="${escapeHTML(workout.id)}"
      data-block-id="${escapeHTML(block.id)}"
      data-movement-id="${escapeHTML(entry.movementId)}"
      data-set-index="${setIndex}"
      data-action="removeLiveSet"
      hidden
      ${setCount <= 1 ? "disabled" : ""}
      aria-label="Remove set ${setIndex + 1}"
    >${renderUiIcon("trash")}</button>
  `;
}

function displayLiveSet(entry, target, setIndex) {
  const existing = normalizePerformedSet(entry.performedSets?.[setIndex]);
  if (target.metric === "seconds" || Number.isFinite(target.durationSeconds)) {
    const targetDurationSeconds = Math.max(
      1,
      nullableInteger(existing?.targetDurationSeconds) || nullableInteger(target.durationSeconds) || 1
    );
    const completedDurationSeconds = Math.max(0, nullableInteger(existing?.durationSeconds) || 0);
    return {
      metric: "seconds",
      targetDurationSeconds,
      completedDurationSeconds,
      rir: existing?.rir ?? null,
      done: completedDurationSeconds >= targetDurationSeconds
    };
  }

  const plannedTargetReps = Math.max(1, nullableInteger(target.reps) || 1);
  const targetReps = Math.max(
    1,
    Number.isFinite(existing?.targetReps)
      ? existing.targetReps + Math.max(0, existing.extraSlots)
      : plannedTargetReps
  );
  const completedReps = Math.max(0, nullableInteger(existing?.reps) || 0);
  return {
    metric: "reps",
    load: existing?.load ?? target.load ?? null,
    targetLoad: existing?.targetLoad ?? target.load ?? null,
    targetReps,
    completedReps,
    extraSlots: 0,
    rir: existing?.rir ?? null,
    done: completedReps >= targetReps
  };
}

function formatLoadDisplay(load, schema) {
  if (Number.isFinite(load)) return formatSetNumber(load);
  return schema.loadStep ? "--" : "BW";
}

let activeRepDrag = null;

function startRepStripDrag(event, control = event.currentTarget) {
  if (event.button !== undefined && event.button !== 0) return;
  const tile = control.closest(".live-set-tile");
  if (!tile) return;
  activeRepDrag = {
    ...repStripPayload(control, event.clientX),
    strip: control,
    pointerId: event.pointerId
  };
  control.setPointerCapture?.(event.pointerId);
  recordRepBoxPayload(activeRepDrag);
}

function handleRepStripKeydown(event, control = event.currentTarget) {
  const tile = control.closest(".live-set-tile");
  if (!tile) return;
  const currentReps = Number(tile.dataset.completedReps || 0);
  const maxReps = Math.max(Number(tile.dataset.targetReps || 0), currentReps);
  let reps = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") reps = Math.min(maxReps, currentReps + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") reps = Math.max(0, currentReps - 1);
  if (event.key === "Home") reps = 0;
  if (event.key === "End") reps = maxReps;
  if (reps === null) return;
  event.preventDefault();
  recordRepBoxPayload(repStripPayload(control, null, reps));
}

function adjustTargetReps(event, control = event.currentTarget, delta = 0) {
  event.preventDefault();
  event.stopPropagation();
  const button = control;
  const tile = button.closest(".live-set-tile");
  if (!tile) return;
  const completedReps = Math.max(0, Number(tile.dataset.completedReps || 0));
  const targetReps = Math.max(1, Number(tile.dataset.targetReps || button.dataset.targetReps || 1));
  const nextTargetReps = Math.max(1, targetReps + delta);
  if (nextTargetReps === targetReps) return;
  tile.dataset.targetReps = String(nextTargetReps);
  tile.dataset.extraSlots = "0";
  tile.classList.add("is-extra-editing");
  tile.classList.toggle("is-done", completedReps >= nextTargetReps);
  syncExtraRepBoxes(tile, completedReps, nextTargetReps);
  updateTargetCountUI(tile, nextTargetReps);
  updateExtraRepControls(tile);
  recordPerformedTargetReps(
    button.dataset.workoutId,
    button.dataset.blockId,
    button.dataset.movementId,
    Number(button.dataset.setIndex),
    nextTargetReps,
    completedReps
  );
  syncLiveCompletionUI(tile);
}

function toggleExtraRepButton(event, control = event.currentTarget) {
  event.preventDefault();
  event.stopPropagation();
  const tile = control.closest(".live-set-tile");
  if (!tile) return;
  const targetReps = Number(tile.dataset.targetReps || control.dataset.targetReps);
  tile.dataset.extraSlots = "0";
  tile.classList.add("is-extra-editing");
  updateExtraRepControls(tile);
  tile.querySelector(".extra-rep-add-button")?.focus();
  updateTargetCountUI(tile, targetReps);
}

function handleRepBoxPointerMove(event) {
  if (!activeRepDrag || activeRepDrag.pointerId !== event.pointerId) return;
  recordRepBoxPayload(repStripPayload(activeRepDrag.strip, event.clientX));
}

function finishRepBoxDrag(event) {
  if (!activeRepDrag || (event?.pointerId !== undefined && activeRepDrag.pointerId !== event.pointerId)) return;
  try {
    activeRepDrag.strip.releasePointerCapture?.(activeRepDrag.pointerId);
  } catch {}
  activeRepDrag = null;
}

window.addEventListener("pointermove", handleRepBoxPointerMove);
window.addEventListener("pointerup", finishRepBoxDrag);
window.addEventListener("pointercancel", finishRepBoxDrag);
document.addEventListener("click", closeExtraRepEditorsFromClick);
document.addEventListener("pointerdown", closeExtraRepEditorsFromPointer, true);

function repStripPayload(strip, clientX, repsOverride = null) {
  const tile = strip.closest(".live-set-tile");
  return {
    workoutId: tile?.dataset.workoutId,
    blockId: tile?.dataset.blockId,
    movementId: tile?.dataset.movementId,
    setIndex: Number(tile?.dataset.setIndex),
    reps: repsOverride === null ? repsFromPointer(tile, clientX) : repsOverride,
    targetReps: Number(tile?.dataset.targetReps),
    tile
  };
}

function repsFromPointer(tile, clientX) {
  const boxes = [...(tile?.querySelectorAll(".rep-box-unit") || [])];
  if (!boxes.length) return 0;
  const firstRect = boxes[0].getBoundingClientRect();
  if (clientX < firstRect.left) return 0;
  let reps = 0;
  boxes.forEach(box => {
    const rect = box.getBoundingClientRect();
    const start = Number(box.dataset.repStart || box.dataset.reps);
    const end = Number(box.dataset.reps);
    const size = Math.max(1, Number(box.dataset.repSize || 1));
    if (clientX >= rect.right) {
      reps = end;
      return;
    }
    if (clientX >= rect.left && clientX < rect.right) {
      const position = Math.max(0, Math.min(rect.width, clientX - rect.left));
      reps = Math.max(start, Math.min(end, start + Math.floor((position / rect.width) * size)));
    }
  });
  return reps;
}

function recordRepBoxPayload(payload) {
  if (!payload || !Number.isFinite(payload.reps) || !Number.isFinite(payload.targetReps)) return;
  recordPerformedReps(
    payload.workoutId,
    payload.blockId,
    payload.movementId,
    payload.setIndex,
    payload.reps,
    payload.targetReps
  );
  updateRepBoxUI(payload.tile, payload.reps, payload.targetReps);
}

function updateRepBoxUI(tile, completedReps, targetReps) {
  if (!tile) return;
  tile.classList.toggle("is-done", completedReps >= targetReps);
  tile.dataset.completedReps = String(completedReps);
  tile.dataset.extraSlots = "0";
  syncExtraRepBoxes(tile, completedReps, targetReps);
  tile.querySelectorAll(".rep-box-unit").forEach(button => {
    const unit = {
      start: Number(button.dataset.repStart || button.dataset.reps),
      end: Number(button.dataset.reps),
      size: Math.max(1, Number(button.dataset.repSize || 1))
    };
    const fillPercent = repUnitFillPercent(unit, completedReps);
    button.style.setProperty("--rep-fill", `${fillPercent}%`);
    button.classList.toggle("filled", fillPercent >= 100);
    button.classList.toggle("partial", fillPercent > 0 && fillPercent < 100);
  });
  updateTargetCountUI(tile, targetReps);
  updateExtraRepControls(tile);
  syncLiveCompletionUI(tile);
}

function syncLiveCompletionUI(tile) {
  const movementRow = tile.closest("[data-live-movement-row]");
  if (movementRow) {
    const setTiles = [...movementRow.querySelectorAll(".live-set-tile")];
    movementRow.classList.toggle("is-complete", Boolean(setTiles.length && setTiles.every(item => item.classList.contains("is-done"))));
  }

  const block = tile.closest(".live-workout-block");
  if (block) {
    const movementRows = [...block.querySelectorAll("[data-live-movement-row]")];
    block.classList.toggle("is-complete", Boolean(movementRows.length && movementRows.every(row => row.classList.contains("is-complete"))));
  }

  updateLiveProgressUI(tile.dataset.workoutId);
}

function updateLiveProgressUI(workoutId) {
  const workout = workoutRecordById(workoutId);
  if (!workout) return;
  const progress = liveWorkoutProgress(workout);
  const progressRoot = document.querySelector("[data-live-progress]");
  if (!progressRoot) return;
  progressRoot.style.setProperty("--progress", `${progress.percent}%`);
  const percent = progressRoot.querySelector("[data-live-progress-percent]");
  const count = progressRoot.querySelector("[data-live-progress-count]");
  if (percent) percent.textContent = `${progress.percent}%`;
  if (count) count.textContent = `${progress.completed}/${progress.total} sets complete`;
}

function syncExtraRepBoxes(tile, completedReps, targetReps) {
  const row = tile.querySelector(".set-rep-boxes");
  if (!row) return;
  const totalSlots = Math.max(targetReps, completedReps);
  row.innerHTML = renderRepBoxUnits({
    workoutId: tile.dataset.workoutId || "",
    blockId: tile.dataset.blockId || "",
    movementId: tile.dataset.movementId || "",
    setIndex: Number(tile.dataset.setIndex || 0),
    targetReps,
    completedReps,
    totalSlots
  });
  row.setAttribute("aria-valuemax", String(totalSlots));
  row.setAttribute("aria-valuenow", String(completedReps));
}

function updateTargetCountUI(tile, targetReps) {
  const targetCount = tile.querySelector(".set-target-count");
  if (!targetCount) return;
  targetCount.textContent = String(targetReps);
  targetCount.dataset.targetReps = String(targetReps);
}

function updateExtraRepControls(tile) {
  const editing = tile.classList.contains("is-extra-editing");
  const targetReps = Number(tile.dataset.targetReps || 0);
  const completedReps = Number(tile.dataset.completedReps || 0);
  const addButton = tile.querySelector(".extra-rep-add-button");
  const removeButton = tile.querySelector(".extra-rep-remove-button");
  const removeSetButton = tile.querySelector(".set-remove-button");
  [addButton, removeButton, removeSetButton].forEach(button => {
    if (!button) return;
    button.hidden = !editing;
  });
  [addButton, removeButton].forEach(button => {
    if (!button) return;
    button.dataset.currentReps = String(completedReps);
    button.dataset.targetReps = String(targetReps);
  });
  if (removeButton) {
    removeButton.disabled = targetReps <= 1;
  }
}

function closeExtraRepEditorsFromPointer(event) {
  document.querySelectorAll(".live-set-tile.is-extra-editing").forEach(tile => {
    if (tile.contains(event.target)) return;
    closeExtraRepEditor(tile);
  });
}

function closeExtraRepEditorsFromClick(event) {
  document.querySelectorAll(".live-set-tile.is-extra-editing").forEach(tile => {
    if (tile.contains(event.target)) return;
    closeExtraRepEditor(tile);
  });
}

function closeExtraRepEditor(tile) {
  const targetReps = Number(tile.dataset.targetReps || 0);
  const completedReps = Number(tile.dataset.completedReps || 0);
  tile.classList.remove("is-extra-editing");
  tile.dataset.extraSlots = "0";
  syncExtraRepBoxes(tile, completedReps, targetReps);
  updateTargetCountUI(tile, targetReps);
  updateExtraRepControls(tile);
}

function openSetLoadEditor(event, control = event.currentTarget) {
  event.preventDefault();
  const button = control;
  const value = button.dataset.load || "";
  const input = document.createElement("input");
  input.className = "set-load-editor";
  input.type = "number";
  input.inputMode = "decimal";
  input.min = "0";
  input.step = "0.5";
  input.value = value;
  input.dataset.workoutId = button.dataset.workoutId;
  input.dataset.blockId = button.dataset.blockId;
  input.dataset.movementId = button.dataset.movementId;
  input.dataset.setIndex = button.dataset.setIndex;
  input.dataset.targetLoad = button.dataset.targetLoad || "";
  input.setAttribute("aria-label", button.getAttribute("aria-label") || "Edit set pounds");
  input.addEventListener("blur", () => commitSetLoadEditor(input));
  input.addEventListener("keydown", keyEvent => {
    if (keyEvent.key === "Enter") input.blur();
    if (keyEvent.key === "Escape") renderMovementApp({ skipHistory: true });
  });
  button.replaceWith(input);
  input.focus();
  input.select();
}

function commitSetLoadEditor(input) {
  updatePerformedSet(
    input.dataset.workoutId,
    input.dataset.blockId,
    input.dataset.movementId,
    Number(input.dataset.setIndex),
    "load",
    input.value
  );
  renderMovementApp({ skipHistory: true });
}

function renderWorkoutBlock(workout, block, index) {
  const movements = blockMovements(block);
  const flowMode = blockFlowMode(block, movements);
  return `
    <article class="workout-block">
      <div class="block-header">
        <h3>Block ${index + 1}</h3>
        <div class="block-actions">
          ${movements.length > 1 ? `
            <button
              type="button"
              class="block-flow-button${flowMode === "interleaved" ? " active" : ""}"
              data-action="toggleWorkoutBlockFlow"
              data-workout-id="${escapeHTML(workout.id)}"
              data-block-id="${escapeHTML(block.id)}"
              aria-pressed="${flowMode === "interleaved" ? "true" : "false"}"
              title="Toggle set order"
            >${flowMode === "interleaved" ? "Interleave" : "Straight"}</button>
          ` : ""}
          <button
            type="button"
            class="block-icon-button add"
            data-action="openWorkoutMovementPicker"
            data-workout-id="${escapeHTML(workout.id)}"
            data-block-id="${escapeHTML(block.id)}"
            aria-label="Add movement to block ${index + 1}"
            title="Add movement"
          >${renderUiIcon("plus")}</button>
          ${workoutBlocks(workout).length > 1 ? `
            <button
              type="button"
              class="block-icon-button danger"
              data-action="removeWorkoutBlock"
              data-workout-id="${escapeHTML(workout.id)}"
              data-block-id="${escapeHTML(block.id)}"
              aria-label="Remove block ${index + 1}"
              title="Remove block"
            >${renderUiIcon("trash")}</button>
          ` : ""}
        </div>
      </div>
      <div
        class="block-movement-list"
        data-workout-id="${escapeHTML(workout.id)}"
        data-block-id="${escapeHTML(block.id)}"
        data-dragover-action="allowBuilderMovementDrop"
        data-dragleave-action="clearBuilderDropTarget"
        data-drop-action="dropBuilderMovementOnBlock"
      >
        ${movements.map((entry, movementIndex) => renderBlockMovementRow(workout, block, entry, movementIndex)).join("") || `<div class="block-empty">No movements in this block yet.</div>`}
      </div>
    </article>
  `;
}

function renderBlockMovementRow(workout, block, entry, movementIndex) {
  const movement = movementById(entry.movementId);
  if (!movement) return "";
  return `
    <div class="block-movement-shell">
      <button
        type="button"
        class="builder-remove-action"
        data-action="removeBuilderMovement"
        data-workout-id="${escapeHTML(workout.id)}"
        data-block-id="${escapeHTML(block.id)}"
        data-movement-id="${escapeHTML(movement.id)}"
        aria-label="Remove ${escapeHTML(movement.name)}"
        hidden
      >${renderUiIcon("trash")}</button>
      <div
        class="block-movement-row"
        draggable="true"
        data-workout-id="${escapeHTML(workout.id)}"
        data-block-id="${escapeHTML(block.id)}"
        data-movement-index="${movementIndex}"
        data-movement-id="${escapeHTML(movement.id)}"
        data-dragstart-action="startBuilderMovementDrag"
        data-dragover-action="allowBuilderMovementDrop"
        data-dragleave-action="clearBuilderDropTarget"
        data-drop-action="dropBuilderMovementOnRow"
        data-dragend-action="finishBuilderMovementDrag"
        data-pointerdown-action="startBuilderRemoveSwipe"
        data-pointermove-action="moveBuilderRemoveSwipe"
        data-pointerup-action="finishBuilderRemoveSwipe"
        data-pointercancel-action="cancelBuilderRemoveSwipe"
      >
        <button
          type="button"
          class="block-movement-title-button"
          data-action="viewWorkoutMovement"
          data-pointerdown-action="startBuilderPointerDrag"
          data-workout-id="${escapeHTML(workout.id)}"
          data-block-id="${escapeHTML(block.id)}"
          data-movement-id="${escapeHTML(movement.id)}"
          aria-label="View ${escapeHTML(movement.name)}"
        >
          <strong>${escapeHTML(movement.name)}</strong>
          <span class="movement-count">${escapeHTML(movementMuscles(movement, "primary").map(muscle => muscle.name).join(", ") || "Primary pending")}</span>
        </button>
      </div>
    </div>
  `;
}

function renderUiIcon(name) {
  const icons = {
    plus: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </svg>
    `,
    trash: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 6h18"></path>
        <path d="M8 6V4h8v2"></path>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
      </svg>
    `,
  };
  return icons[name] || "";
}

function builderDragPayloadFromRow(row) {
  return {
    workoutId: row?.dataset.workoutId || "",
    sourceBlockId: row?.dataset.blockId || "",
    sourceIndex: Number(row?.dataset.movementIndex),
    sourceRow: row || null
  };
}

function startBuilderMovementDrag(event, control = event.currentTarget) {
  const row = control;
  activeBuilderMovementDrag = builderDragPayloadFromRow(row);
  row.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify({
    workoutId: activeBuilderMovementDrag.workoutId,
    sourceBlockId: activeBuilderMovementDrag.sourceBlockId,
    sourceIndex: activeBuilderMovementDrag.sourceIndex
  }));
}

function allowBuilderMovementDrop(event, control = event.currentTarget) {
  if (!activeBuilderMovementDrag) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  clearBuilderDropMarkers();
  const row = control.classList?.contains("block-movement-row")
    ? control
    : null;
  if (row) {
    row.classList.add(builderDropPositionForRow(row, event) === "after" ? "is-drop-after" : "is-drop-before");
    return;
  }
  control.classList?.add("is-drop-target");
}

function clearBuilderDropTarget(event, control = event.currentTarget) {
  if (!control.contains(event.relatedTarget)) {
    control.classList.remove("is-drop-before", "is-drop-after", "is-drop-target");
  }
}

function dropBuilderMovementOnRow(event, workoutId, targetBlockId, targetIndex, control = event.currentTarget) {
  if (!activeBuilderMovementDrag) return;
  event.preventDefault();
  event.stopPropagation();
  const position = builderDropPositionForRow(control, event);
  const insertIndex = targetIndex + (position === "after" ? 1 : 0);
  moveBuilderMovement(
    workoutId,
    activeBuilderMovementDrag.sourceBlockId,
    activeBuilderMovementDrag.sourceIndex,
    targetBlockId,
    insertIndex
  );
  finishBuilderMovementDrag();
}

function dropBuilderMovementOnBlock(event, workoutId, targetBlockId, control = event.currentTarget) {
  if (!activeBuilderMovementDrag) return;
  event.preventDefault();
  const list = control;
  const insertIndex = list.querySelectorAll(".block-movement-row").length;
  moveBuilderMovement(
    workoutId,
    activeBuilderMovementDrag.sourceBlockId,
    activeBuilderMovementDrag.sourceIndex,
    targetBlockId,
    insertIndex
  );
  finishBuilderMovementDrag();
}

function finishBuilderMovementDrag() {
  activeBuilderMovementDrag?.sourceRow?.classList.remove("is-dragging");
  activeBuilderMovementDrag = null;
  builderPointerDrag = null;
  clearBuilderDropMarkers();
}

function builderDropPositionForRow(row, event) {
  const rect = row.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
}

function clearBuilderDropMarkers() {
  document.querySelectorAll(".block-movement-row.is-drop-before, .block-movement-row.is-drop-after").forEach(row => {
    row.classList.remove("is-drop-before", "is-drop-after");
  });
  document.querySelectorAll(".block-movement-list.is-drop-target").forEach(list => {
    list.classList.remove("is-drop-target");
  });
}

function startBuilderPointerDrag(event, control = event.currentTarget) {
  if (event.pointerType === "mouse") return;
  const row = control.closest(".block-movement-row");
  if (!row) return;
  activeBuilderMovementDrag = builderDragPayloadFromRow(row);
  builderPointerDrag = {
    startX: event.clientX,
    startY: event.clientY,
    target: null,
    dragging: false
  };
  startBuilderRemoveSwipe(event, row);
  event.stopPropagation();
}

function handleBuilderPointerMove(event) {
  if (!builderPointerDrag || !activeBuilderMovementDrag) return;
  const dx = event.clientX - builderPointerDrag.startX;
  const dy = event.clientY - builderPointerDrag.startY;
  const moved = Math.hypot(dx, dy);
  if (builderRemoveSwipe?.active) {
    builderPointerDrag = null;
    activeBuilderMovementDrag = null;
    return;
  }
  if (!builderPointerDrag.dragging && moved < 8) return;
  if (!builderPointerDrag.dragging && Math.abs(dx) >= Math.abs(dy)) return;
  if (!builderPointerDrag.dragging) cancelBuilderRemoveSwipe(event);
  builderPointerDrag.dragging = true;
  event.preventDefault();
  activeBuilderMovementDrag.sourceRow?.classList.add("is-dragging");
  clearBuilderDropMarkers();
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const row = element?.closest?.(".block-movement-row");
  if (row && row !== activeBuilderMovementDrag.sourceRow) {
    const position = builderDropPositionForRow(row, event);
    row.classList.add(position === "after" ? "is-drop-after" : "is-drop-before");
    builderPointerDrag.target = {
      blockId: row.dataset.blockId,
      index: Number(row.dataset.movementIndex) + (position === "after" ? 1 : 0)
    };
    return;
  }
  const list = element?.closest?.(".block-movement-list");
  if (list) {
    list.classList.add("is-drop-target");
    builderPointerDrag.target = {
      blockId: list.dataset.blockId,
      index: list.querySelectorAll(".block-movement-row").length
    };
  }
}

function finishBuilderPointerDrag() {
  if (!builderPointerDrag || !activeBuilderMovementDrag) return;
  const target = builderPointerDrag.target;
  const payload = activeBuilderMovementDrag;
  const didDrag = builderPointerDrag.dragging;
  if (didDrag) suppressBuilderRowClickUntil = Date.now() + 500;
  if (didDrag && target?.blockId) {
    moveBuilderMovement(
      payload.workoutId,
      payload.sourceBlockId,
      payload.sourceIndex,
      target.blockId,
      target.index
    );
  }
  finishBuilderMovementDrag();
}

window.addEventListener("pointermove", handleBuilderPointerMove);
window.addEventListener("pointerup", finishBuilderPointerDrag);
window.addEventListener("pointercancel", finishBuilderPointerDrag);

let builderRemoveSwipe = null;
let suppressBuilderRowClickUntil = 0;

function startBuilderRemoveSwipe(event, control = event.currentTarget) {
  if (event.pointerType === "mouse") return;
  const row = control;
  closeRevealedBuilderRows(row);
  if (row.classList.contains("is-remove-revealed")) {
    closeBuilderRemoveRow(row);
    return;
  }
  builderRemoveSwipe = {
    pointerId: event.pointerId,
    row,
    startX: event.clientX,
    startY: event.clientY,
    dx: 0,
    active: false
  };
  row.setPointerCapture?.(event.pointerId);
}

function moveBuilderRemoveSwipe(event) {
  if (!builderRemoveSwipe || builderRemoveSwipe.pointerId !== event.pointerId) return;
  const dx = event.clientX - builderRemoveSwipe.startX;
  const dy = event.clientY - builderRemoveSwipe.startY;
  if (!builderRemoveSwipe.active && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy))) return;
  if (dx > 0) return;
  event.preventDefault();
  builderRemoveSwipe.active = true;
  builderRemoveSwipe.dx = Math.max(-110, dx);
  builderRemoveSwipe.row.classList.add("is-remove-swiping");
  builderRemoveSwipe.row.style.transform = `translateX(${builderRemoveSwipe.dx}px)`;
}

function finishBuilderRemoveSwipe(event) {
  if (!builderRemoveSwipe || builderRemoveSwipe.pointerId !== event.pointerId) return;
  const shouldReveal = builderRemoveSwipe.active && builderRemoveSwipe.dx <= -64;
  const row = builderRemoveSwipe.row;
  cancelBuilderRemoveSwipe(event);
  if (!shouldReveal) return;
  suppressBuilderRowClickUntil = Date.now() + 500;
  row.closest(".block-movement-shell")?.querySelector(".builder-remove-action")?.removeAttribute("hidden");
  row.classList.add("is-remove-revealed");
}

function cancelBuilderRemoveSwipe(event) {
  if (!builderRemoveSwipe || (event?.pointerId !== undefined && builderRemoveSwipe.pointerId !== event.pointerId)) return;
  const row = builderRemoveSwipe.row;
  row.classList.remove("is-remove-swiping");
  row.style.transform = "";
  row.releasePointerCapture?.(builderRemoveSwipe.pointerId);
  builderRemoveSwipe = null;
}

function consumeBuilderRowClick() {
  return Date.now() < suppressBuilderRowClickUntil;
}

function closeRevealedBuilderRows(exceptRow = null) {
  document.querySelectorAll(".block-movement-row.is-remove-revealed").forEach(row => {
    if (row !== exceptRow) closeBuilderRemoveRow(row);
  });
}

function closeBuilderRemoveRow(row) {
  row.classList.remove("is-remove-revealed");
  row.closest(".block-movement-shell")?.querySelector(".builder-remove-action")?.setAttribute("hidden", "");
}

function closeBuilderRemoveActionsFromPointer(event) {
  const activeShell = event.target.closest?.(".block-movement-shell");
  document.querySelectorAll(".block-movement-row.is-remove-revealed").forEach(row => {
    if (row.closest(".block-movement-shell") !== activeShell) closeBuilderRemoveRow(row);
  });
}

document.addEventListener("pointerdown", closeBuilderRemoveActionsFromPointer, true);

function calendarDayLabel(date, dayWorkouts) {
  const base = DAY_FORMATTER.format(date);
  if (!dayWorkouts.length) return `${base}, nothing logged`;
  return `${base}, ${dayWorkouts.length} entr${dayWorkouts.length === 1 ? "y" : "ies"}`;
}

function changeCalendarMonth(delta) {
  visibleCalendarMonth = monthStart(new Date(
    visibleCalendarMonth.getFullYear(),
    visibleCalendarMonth.getMonth() + delta,
    1
  ));
  calendarDaySheetOpen = false;
  schedulePickerOpen = false;
  quickActivityOpen = false;
  renderMovementApp({ skipHistory: true });
}

function changeCalendarRange(delta) {
  if (isMobileViewport()) {
    const nextDate = addDays(parseDateKey(selectedCalendarDate), delta * 7);
    selectedCalendarDate = formatDateKey(nextDate);
    visibleCalendarMonth = monthStart(nextDate);
    calendarDaySheetOpen = false;
    schedulePickerOpen = false;
    quickActivityOpen = false;
    renderMovementApp({ skipHistory: true });
    return;
  }
  changeCalendarMonth(delta);
}

function isMobileViewport() {
  return window.matchMedia?.("(max-width: 560px)").matches;
}

function goToToday() {
  selectedCalendarDate = todayKey();
  visibleCalendarMonth = monthStart(parseDateKey(selectedCalendarDate));
  calendarDaySheetOpen = false;
  schedulePickerOpen = false;
  quickActivityOpen = false;
  renderMovementApp({ skipHistory: true });
}

function openCalendarDaySheet(dateKey, event) {
  event?.preventDefault();
  event?.stopPropagation();
  const normalizedDate = formatDateKey(parseDateKey(dateKey));
  selectedCalendarDate = normalizedDate;
  visibleCalendarMonth = monthStart(parseDateKey(normalizedDate));
  schedulePickerOpen = false;
  quickActivityOpen = false;
  calendarDaySheetOpen = true;
  renderMovementApp({ skipHistory: true });
}

function closeCalendarDaySheet() {
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  renderMovementApp({ skipHistory: true });
}

function openSchedulePicker(dateKey, event) {
  event?.preventDefault();
  event?.stopPropagation();
  selectedCalendarDate = formatDateKey(parseDateKey(dateKey));
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  schedulePickerOpen = true;
  renderMovementApp({ skipHistory: true });
}

function closeSchedulePicker() {
  schedulePickerOpen = false;
  calendarDaySheetOpen = true;
  renderMovementApp({ skipHistory: true });
}

function openQuickActivity(dateKey, event) {
  event?.preventDefault();
  event?.stopPropagation();
  selectedCalendarDate = formatDateKey(parseDateKey(dateKey));
  calendarDaySheetOpen = false;
  schedulePickerOpen = false;
  quickActivityOpen = true;
  renderMovementApp({ skipHistory: true });
}

function closeQuickActivity() {
  quickActivityOpen = false;
  calendarDaySheetOpen = true;
  renderMovementApp({ skipHistory: true });
}

function createQuickActivity(event, form) {
  event.preventDefault();
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim().slice(0, 80);
  if (!title) {
    form.elements.title?.focus();
    return;
  }
  const dayWorkouts = workoutsForDate(selectedCalendarDate);
  if (dayWorkouts.length >= MAX_WORKOUTS_PER_DAY || dayWorkouts.some(workout => workout.kind === "rest")) {
    quickActivityOpen = false;
    calendarDaySheetOpen = true;
    renderMovementApp({ skipHistory: true });
    return;
  }

  const now = new Date().toISOString();
  workouts = [
    ...workouts,
    {
      id: `activity_${selectedCalendarDate}_${Date.now().toString(36)}`,
      kind: "activity",
      templateId: null,
      date: selectedCalendarDate,
      status: "completed",
      title,
      color: normalizeWorkoutColor(formData.get("color")),
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      blocks: []
    }
  ];
  quickActivityOpen = false;
  calendarDaySheetOpen = true;
  saveStoredWorkouts();
  publishAppData();
  renderMovementApp({ skipHistory: true });
}

function createRestDay(dateKey, event) {
  event?.preventDefault();
  event?.stopPropagation();
  const normalizedDate = formatDateKey(parseDateKey(dateKey));
  if (workoutsForDate(normalizedDate).length) return;
  const now = new Date().toISOString();
  workouts = [
    ...workouts,
    {
      id: `rest_${normalizedDate}_${Date.now().toString(36)}`,
      kind: "rest",
      templateId: null,
      date: normalizedDate,
      status: "completed",
      title: "Rest Day",
      color: "#9aa3ad",
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      blocks: []
    }
  ];
  selectedCalendarDate = normalizedDate;
  visibleCalendarMonth = monthStart(parseDateKey(normalizedDate));
  calendarDaySheetOpen = true;
  schedulePickerOpen = false;
  quickActivityOpen = false;
  saveStoredWorkouts();
  publishAppData();
  renderMovementApp({ skipHistory: true });
}

function createWorkoutTemplate() {
  const now = new Date().toISOString();
  const id = `template_${Date.now().toString(36)}`;
  workoutTemplates = [
    ...workoutTemplates,
    {
      id,
      title: "",
      color: WORKOUT_COLOR_OPTIONS[0].value,
      createdAt: now,
      updatedAt: now,
      blocks: [createWorkoutBlock()]
    }
  ];
  saveStoredWorkoutTemplates();
  publishAppData();
  openWorkoutTemplateBuilder(id, { replaceHistory: false });
}

function scheduleWorkoutFromTemplate(templateId, dateKey) {
  const template = workoutTemplates.find(item => item.id === templateId);
  if (!template) return;
  const normalizedDate = formatDateKey(parseDateKey(dateKey));
  const scheduledForDay = workoutsForDate(normalizedDate);
  if (scheduledForDay.length >= MAX_WORKOUTS_PER_DAY || scheduledForDay.some(workout => workout.kind === "rest")) {
    selectedCalendarDate = normalizedDate;
    schedulePickerOpen = false;
    quickActivityOpen = false;
    calendarDaySheetOpen = true;
    renderMovementApp({ skipHistory: true });
    return;
  }

  const now = new Date().toISOString();
  const id = `workout_${normalizedDate}_${Date.now().toString(36)}`;
  workouts = [
    ...workouts,
    {
      id,
      templateId: template.id,
      date: normalizedDate,
      status: "draft",
      title: workoutTitle(template),
      color: workoutColor(template),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      blocks: cloneWorkoutBlocks(template)
    }
  ];
  selectedCalendarDate = normalizedDate;
  visibleCalendarMonth = monthStart(parseDateKey(normalizedDate));
  schedulePickerOpen = false;
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  saveStoredWorkouts();
  publishAppData();
  openWorkoutBuilder(id, { replaceHistory: false });
}

function openWorkoutBuilder(workoutId, options = {}) {
  const workout = workouts.find(item => item.id === workoutId);
  if (!workout) return;
  if (workout.status === "completed") {
    openLiveWorkout(workout.id, options);
    return;
  }
  activeWorkoutId = workout.id;
  activeWorkoutTemplateId = null;
  activeBlockId = null;
  workoutBuilderReturnWorkoutId = options.returnTo === "live" ? workout.id : null;
  selectedCalendarDate = workout.date;
  schedulePickerOpen = false;
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  movementView = "workout";
  renderMovementApp(options);
}

function openLiveWorkout(workoutId, options = {}) {
  const workout = workouts.find(item => item.id === workoutId);
  if (!workout) return;
  activeWorkoutId = workout.id;
  activeWorkoutTemplateId = null;
  activeBlockId = null;
  selectedCalendarDate = workout.date;
  schedulePickerOpen = false;
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  movementView = "live";
  renderMovementApp(options);
}

function saveScheduledWorkout(workoutId) {
  const workout = workouts.find(item => item.id === workoutId);
  if (!workout) return;
  const shouldReturnToLive = workoutBuilderReturnWorkoutId === workout.id;
  updateWorkout(workout.id, item => ({
    ...item,
    updatedAt: new Date().toISOString()
  }), { skipRender: true });
  selectedCalendarDate = workout.date;
  workoutBuilderReturnWorkoutId = null;
  if (shouldReturnToLive) {
    openLiveWorkout(workout.id, { replaceHistory: false });
    return;
  }
  activeWorkoutId = null;
  activeWorkoutTemplateId = null;
  activeBlockId = null;
  openMovementHome({ replaceHistory: false });
}

function openTemplateNameDialog(workoutId) {
  const workout = workouts.find(item => item.id === workoutId);
  if (!workout) return;
  const suggestedName = workoutTitle(workout);
  confirmModal.innerHTML = `
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-label="Name template">
      <form class="confirm-form" data-submit-action="confirmSaveWorkoutAsTemplate" data-workout-id="${escapeHTML(workout.id)}">
        <div class="confirm-copy">
          <h3>Name template</h3>
          <label>
            <span class="movement-count">Template name</span>
            <input
              class="confirm-name-input"
              data-template-name-input
              value="${escapeHTML(suggestedName)}"
              placeholder="Workout template"
              aria-label="Template name"
            >
          </label>
        </div>
        <div class="confirm-actions">
          <button type="button" class="back-button" data-action="closeConfirmDialog">Cancel</button>
          <button type="submit" class="detail-evidence-button">Save Template</button>
        </div>
      </form>
    </section>
  `;
  confirmModal.hidden = false;
  syncModalScrollLock();
  const input = confirmModal.querySelector("[data-template-name-input]");
  input?.focus();
  input?.select();
}

function confirmSaveWorkoutAsTemplate(event, workoutId) {
  event.preventDefault();
  const input = confirmModal.querySelector("[data-template-name-input]");
  const templateTitle = String(input?.value || "").trim();
  if (!templateTitle) {
    input?.focus();
    return;
  }
  closeConfirmDialog();
  saveWorkoutAsTemplate(workoutId, templateTitle);
}

function saveWorkoutAsTemplate(workoutId, templateTitle) {
  const workout = workouts.find(item => item.id === workoutId);
  if (!workout) return;
  const cleanTitle = String(templateTitle || "").trim();
  if (!cleanTitle) {
    openTemplateNameDialog(workoutId);
    return;
  }
  const now = new Date().toISOString();
  workoutTemplates = [
    ...workoutTemplates,
    {
      id: `template_${Date.now().toString(36)}`,
      title: cleanTitle,
      color: workoutColor(workout),
      createdAt: now,
      updatedAt: now,
      blocks: cloneWorkoutBlocks(workout)
    }
  ];
  saveStoredWorkoutTemplates();
  publishAppData();
  setMovementStatus(`Saved "${cleanTitle}" as a template.`);
  window.setTimeout(() => {
    if (movementStatus.textContent === `Saved "${cleanTitle}" as a template.`) setMovementStatus("");
  }, 2200);
}

function exitWorkoutBuilder(workoutId) {
  const shouldReturnToLive = workoutBuilderReturnWorkoutId === workoutId &&
    workouts.some(workout => workout.id === workoutId);
  workoutBuilderReturnWorkoutId = null;
  if (shouldReturnToLive) {
    openLiveWorkout(workoutId, { replaceHistory: false });
    return;
  }
  openMovementHome({ replaceHistory: false });
}

function openWorkoutTemplateBuilder(templateId, options = {}) {
  const template = workoutTemplates.find(item => item.id === templateId);
  if (!template) return;
  activeWorkoutTemplateId = template.id;
  activeWorkoutId = null;
  activeBlockId = null;
  workoutBuilderReturnWorkoutId = null;
  schedulePickerOpen = false;
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  movementView = "workout";
  renderMovementApp(options);
}

function openWorkoutMovementPicker(workoutId, blockId, options = {}) {
  const workout = workoutRecordById(workoutId);
  const block = workoutBlocks(workout).find(item => item.id === blockId);
  if (!workout || !block) return;
  setActiveWorkoutRecord(workout.id);
  activeBlockId = block.id;
  if (workout.date) selectedCalendarDate = workout.date;
  openMovementCollection(null, options);
}

function viewWorkoutMovement(workoutId, blockId, movementId) {
  const workout = workoutRecordById(workoutId);
  const block = workoutBlocks(workout).find(item => item.id === blockId);
  if (!workout || !block || !movementById(movementId)) return;
  setActiveWorkoutRecord(workout.id);
  activeBlockId = block.id;
  if (workout.date) selectedCalendarDate = workout.date;
  openMovementDetail(movementId);
}

function finishWorkoutMovementPicker() {
  const workout = activeWorkout();
  if (workout?.date) selectedCalendarDate = workout.date;
  movementView = "workout";
  activeBlockId = null;
  renderMovementApp({ skipHistory: false });
}

function activeWorkout() {
  return workoutTemplates.find(template => template.id === activeWorkoutTemplateId) ||
    workouts.find(workout => workout.id === activeWorkoutId) ||
    null;
}

function activeScheduledWorkout() {
  return workouts.find(workout => workout.id === activeWorkoutId) || null;
}

function activeWorkoutIsTemplate() {
  return Boolean(activeWorkoutTemplateId && workoutTemplates.some(template => template.id === activeWorkoutTemplateId));
}

function workoutRecordById(recordId) {
  return workoutTemplates.find(template => template.id === recordId) ||
    workouts.find(workout => workout.id === recordId) ||
    null;
}

function setActiveWorkoutRecord(recordId) {
  if (workoutTemplates.some(template => template.id === recordId)) {
    activeWorkoutTemplateId = recordId;
    activeWorkoutId = null;
    return;
  }

  if (workouts.some(workout => workout.id === recordId)) {
    activeWorkoutId = recordId;
    activeWorkoutTemplateId = null;
  }
}

function activeWorkoutBlock() {
  const workout = activeWorkout();
  return workoutBlocks(workout).find(block => block.id === activeBlockId) || workoutBlocks(workout)[0] || null;
}

function workoutHasMovement(workout, movementId) {
  const block = activeWorkoutBlock();
  const entries = block ? block.movements : workoutEntries(workout);
  return entries.some(entry =>
    (typeof entry === "string" ? entry : entry.movementId) === movementId
  );
}

function addMovementToActiveWorkout(movementId, event) {
  event?.preventDefault();
  event?.stopPropagation();
  const movement = movementById(movementId);
  const workout = activeWorkout();
  if (!movement || !workout) return;

  const block = activeWorkoutBlock() || workoutBlocks(workout)[0];
  if (!block) return;
  const blockIndex = workoutBlocks(workout).findIndex(item => item.id === block.id);
  if (blockIndex < 0) return;
  const existingIndex = (block.movements || []).findIndex(entry =>
    (typeof entry === "string" ? entry : entry.movementId) === movement.id
  );
  const now = new Date().toISOString();
  const nextMovements = existingIndex >= 0
    ? block.movements || []
    : [
        ...(block.movements || []),
        {
          movementId: movement.id,
          order: (block.movements || []).length,
          target: null,
          performedSets: []
        }
      ];

  const nextBlocks = workoutBlocks(workout).map((item, index) =>
    index === blockIndex
      ? { ...item, movements: normalizeMovementEntries(nextMovements) }
      : item
  );
  updateWorkout(workout.id, item => ({
    ...item,
    updatedAt: now,
    blocks: nextBlocks,
    movements: undefined
  }), { skipRender: true });
  finishWorkoutMovementPicker();
}

function movementProgressionPlan(movement, entry, workout) {
  const schema = progressionSchemaForMovement(movement);
  const targetSetCount = targetSetCountForEntry(movement, entry, workout);
  const previous = previousMovementPerformance(movement.id, workout);
  const previousSets = previous?.sets || [];
  const setTargets = nextSetTargets(previousSets, schema, targetSetCount);
  return {
    schema,
    setTargets,
    previousSummary: previousSets.length ? summarizeSetTargets(previousSets, schema) : "No history",
    ruleLabel: schema.metric === "seconds"
      ? `Complete holds, then +${schema.durationStep} sec`
      : schema.loadStep
        ? `Complete reps, then +${schema.loadStep} lb`
        : "Complete reps, then harder"
  };
}

function progressionSchemaForMovement(movement) {
  if (movement.tracking?.metric === "seconds") {
    return {
      ...DEFAULT_PROGRESSIONS.timed,
      durationMin: movement.tracking.targetMin,
      durationMax: movement.tracking.targetMax,
      durationStep: movement.tracking.targetStep
    };
  }

  if (movement.tracking?.metric === "reps") {
    return {
      ...DEFAULT_PROGRESSIONS.relativeStrength,
      repMin: movement.tracking.targetMin,
      repMax: movement.tracking.targetMax,
      repStep: movement.tracking.targetStep
    };
  }

  const text = [
    movement.id,
    movement.name,
    movement.family,
    movement.equipment,
    movement.variantType,
    ...(movement.tags || []).map(tag => tag.label)
  ].join(" ").toLowerCase();

  if (/chin[_ -]?up|pull[_ -]?up|parallel[_ -]?bar[_ -]?dip|\bdip\b/.test(text)) {
    return DEFAULT_PROGRESSIONS.relativeStrength;
  }

  if (/push[_ -]?up|pull[_ -]?up|dip|calisthenics|bodyweight/.test(text)) {
    return DEFAULT_PROGRESSIONS.bodyweight;
  }

  if (/curl|extension|fly|raise|pressdown|isolation/.test(text)) {
    return DEFAULT_PROGRESSIONS.isolation;
  }

  return DEFAULT_PROGRESSIONS.compound;
}

function targetSetCountForEntry(movement, entry, workout = null) {
  const schema = progressionSchemaForMovement(movement);
  const scheduledWorkout = isWorkoutRecord(workout);
  return Math.max(1, scheduledWorkout ? Number(entry?.target?.sets) || schema.sets : schema.sets);
}

function previousMovementPerformance(movementId, currentWorkout) {
  return workouts
    .filter(workout => workout.id !== currentWorkout?.id)
    .filter(workout => workout.date <= (currentWorkout?.date || todayKey()))
    .flatMap(workout => workoutEntries(workout)
      .filter(entry => entry.movementId === movementId && performedSetsWithValues(entry).length)
      .map(entry => ({ workout, entry, sets: performedSetsWithValues(entry) }))
    )
    .sort((a, b) => {
      if (a.workout.date !== b.workout.date) return b.workout.date.localeCompare(a.workout.date);
      return String(b.workout.updatedAt || b.workout.createdAt || "").localeCompare(String(a.workout.updatedAt || a.workout.createdAt || ""));
    })[0] || null;
}

function performedSetsWithValues(entry) {
  return normalizePerformedSets(entry?.performedSets || [])
    .filter(set => set.done || Number.isFinite(set.reps) || Number.isFinite(set.durationSeconds));
}

function nextSetTargets(previousSets, schema, targetSetCount) {
  if (schema.metric === "seconds") {
    const targets = Array.from({ length: targetSetCount }, (_, index) => {
      const previous = previousSets[index] || previousSets[previousSets.length - 1] || {};
      return {
        load: null,
        durationSeconds: Number.isFinite(previous.durationSeconds) ? previous.durationSeconds : schema.durationMin,
        rir: normalizeRirValue(previous.rir) ?? schema.rirTarget,
        done: false,
        metric: "seconds"
      };
    });
    if (!previousSets.length || !previousSets.every(set => set.done)) return targets;
    return targets.map(set => ({
      ...set,
      durationSeconds: Math.min(schema.durationMax, set.durationSeconds + schema.durationStep),
      rir: schema.rirTarget
    }));
  }

  const targets = Array.from({ length: targetSetCount }, (_, index) => {
    const previous = previousSets[index] || previousSets[previousSets.length - 1] || {};
    return {
      load: Number.isFinite(previous.load) ? previous.load : null,
      reps: Number.isFinite(previous.reps) ? previous.reps : schema.repMin,
      rir: normalizeRirValue(previous.rir) ?? schema.rirTarget,
      done: false,
      metric: "reps"
    };
  });

  if (!previousSets.length) return targets;

  if (!previousSets.every(set => set.done)) return targets;

  const hasLoad = schema.loadStep > 0 && targets.every(set => Number.isFinite(set.load));
  const allAtTop = targets.every(set => Number(set.reps) >= schema.repMax);
  const allRecovered = targets.every(set => set.rir === null || set.rir >= 1);

  if (hasLoad && allAtTop && allRecovered) {
    return targets.map(set => ({
      ...set,
      load: roundLoad(Number(set.load) + schema.loadStep),
      reps: schema.repMin,
      rir: schema.rirTarget
    }));
  }

  if (!allRecovered) return targets;
  return targets.map(set => ({
    ...set,
    reps: Math.min(schema.repMax, Number(set.reps) + schema.repStep),
    rir: schema.rirTarget
  }));
}

function summarizeSetTargets(sets, schema) {
  if (schema.metric === "seconds") {
    const durations = sets
      .map(set => Number.isFinite(set.durationSeconds) ? set.durationSeconds : null)
      .filter(value => value !== null)
      .join("/");
    return `${durations || schema.durationMin} sec`;
  }
  const firstLoad = sets.find(set => Number.isFinite(set.load))?.load;
  const reps = sets
    .map(set => Number.isFinite(set.reps) ? set.reps : null)
    .filter(value => value !== null)
    .join("/");
  if (Number.isFinite(firstLoad)) return `${formatSetNumber(firstLoad)} x ${reps || schema.repMin}`;
  return `${schema.loadStep ? "load" : "BW"} x ${reps || schema.repMin}`;
}

function recordPerformedReps(workoutId, blockId, movementId, setIndex, reps, targetReps) {
  const completedReps = Math.max(0, nullableInteger(reps) || 0);
  const requiredReps = Math.max(1, nullableInteger(targetReps) || 1);
  updateWorkoutMovementEntry(workoutId, blockId, movementId, (entry, workout) => {
    const target = setTargetForEntry(workout, entry, setIndex);
    return setPerformedSetAt(entry, setIndex, existing => {
      const base = performedSetWithTarget(target, existing);
      const done = completedReps >= requiredReps;
      return {
        ...base,
        targetLoad: target.load ?? base.targetLoad ?? null,
        targetReps: requiredReps,
        reps: completedReps,
        extraSlots: 0,
        done,
        completedAt: done ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };
    });
  }, { skipRender: true, markActive: true });
}

function updateTimedSetDuration(event, control = event.currentTarget) {
  const completedDurationSeconds = Math.max(0, nullableInteger(control.value) || 0);
  const targetDurationSeconds = Math.max(1, nullableInteger(control.dataset.targetDuration) || 1);
  recordPerformedDuration(
    control.dataset.workoutId,
    control.dataset.blockId,
    control.dataset.movementId,
    Number(control.dataset.setIndex),
    completedDurationSeconds,
    targetDurationSeconds
  );
  const tile = control.closest(".live-set-tile");
  if (!tile) return;
  tile.dataset.completedDuration = String(completedDurationSeconds);
  tile.classList.toggle("is-done", completedDurationSeconds >= targetDurationSeconds);
  syncLiveCompletionUI(tile);
}

function recordPerformedDuration(workoutId, blockId, movementId, setIndex, durationSeconds, targetSeconds) {
  updateWorkoutMovementEntry(workoutId, blockId, movementId, (entry, workout) => {
    const target = setTargetForEntry(workout, entry, setIndex);
    const done = durationSeconds >= targetSeconds;
    return setPerformedSetAt(entry, setIndex, existing => ({
      ...performedSetWithTarget(target, existing),
      targetDurationSeconds: targetSeconds,
      durationSeconds,
      done,
      completedAt: done ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }));
  }, { skipRender: true, markActive: true });
}

function recordPerformedTargetReps(workoutId, blockId, movementId, setIndex, targetReps, completedReps) {
  const requiredReps = Math.max(1, nullableInteger(targetReps) || 1);
  const actualReps = Math.max(0, nullableInteger(completedReps) || 0);
  updateWorkoutMovementEntry(workoutId, blockId, movementId, (entry, workout) => {
    const target = setTargetForEntry(workout, entry, setIndex);
    return setPerformedSetAt(entry, setIndex, existing => {
      const base = performedSetWithTarget(target, existing);
      const done = actualReps >= requiredReps;
      return {
        ...base,
        targetLoad: target.load ?? base.targetLoad ?? null,
        targetReps: requiredReps,
        extraSlots: 0,
        done,
        completedAt: done ? existing.completedAt || new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };
    });
  }, { skipRender: true, markActive: true });
}

function updatePerformedSet(workoutId, blockId, movementId, setIndex, field, value) {
  const numericValue = field === "reps" ? nullableInteger(value) : nullableNumber(value);
  updateWorkoutMovementEntry(workoutId, blockId, movementId, (entry, workout) => {
    const target = setTargetForEntry(workout, entry, setIndex);
    return setPerformedSetAt(entry, setIndex, existing => {
      const targetReps = Math.max(1, nullableInteger(existing.targetReps) || nullableInteger(target.reps) || 1);
      const done = field === "reps" ? (numericValue || 0) >= targetReps : undefined;
      return {
        ...performedSetWithTarget(target, existing),
        targetLoad: target.load ?? existing.targetLoad ?? null,
        targetReps,
        [field]: numericValue,
        ...(done === undefined ? {} : { done, completedAt: done ? new Date().toISOString() : null }),
        updatedAt: new Date().toISOString()
      };
    });
  }, { skipRender: true, markActive: true });
}

function toggleLiveWorkoutComplete(workoutId) {
  updateWorkout(workoutId, workout => {
    const completed = workout.status === "completed";
    return {
      ...workout,
      status: completed ? "active" : "completed",
      completedAt: completed ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function setTargetForEntry(workout, entry, setIndex) {
  const movement = movementById(entry.movementId);
  if (!movement) return {};
  const plan = movementProgressionPlan(movement, entry, workout);
  return plan.setTargets[setIndex] || plan.setTargets[0] || {};
}

function updateWorkoutMovementEntry(workoutId, blockId, movementId, entryUpdater, options = {}) {
  updateWorkout(workoutId, workout => {
    if (workout.status === "completed") return workout;
    return {
      ...workout,
      status: options.markActive && workout.status === "draft" ? "active" : workout.status,
      updatedAt: new Date().toISOString(),
      blocks: workoutBlocks(workout).map(block =>
        block.id === blockId
          ? {
              ...block,
              movements: normalizeMovementEntries(block.movements).map(entry =>
                entry.movementId === movementId ? entryUpdater(entry, workout, block) : entry
              )
            }
          : block
      )
    };
  }, options);
}

function setPerformedSetAt(entry, setIndex, setUpdater) {
  const performedSets = normalizePerformedSets(entry.performedSets || []);
  while (performedSets.length <= setIndex) {
    performedSets.push({
      targetLoad: null,
      targetReps: null,
      targetDurationSeconds: null,
      load: null,
      reps: null,
      durationSeconds: null,
      extraSlots: 0,
      rir: null,
      done: false,
      completedAt: null,
      updatedAt: null
    });
  }
  performedSets[setIndex] = normalizePerformedSet(setUpdater(performedSets[setIndex])) || performedSets[setIndex];
  return { ...entry, performedSets };
}

function performedSetWithTarget(target = {}, existing = {}) {
  return {
    targetLoad: existing.targetLoad ?? target.load ?? null,
    targetReps: existing.targetReps ?? target.reps ?? null,
    targetDurationSeconds: existing.targetDurationSeconds ?? target.durationSeconds ?? null,
    load: existing.load ?? target.load ?? null,
    reps: existing.reps ?? null,
    durationSeconds: existing.durationSeconds ?? null,
    extraSlots: Math.max(0, nullableInteger(existing.extraSlots) || 0),
    rir: existing.rir ?? null,
    done: Boolean(existing.done),
    completedAt: existing.completedAt || null,
    updatedAt: existing.updatedAt || null
  };
}

function updateWorkoutTitle(workoutId, title) {
  updateWorkout(workoutId, workout => ({
    ...workout,
    title,
    name: undefined,
    updatedAt: new Date().toISOString()
  }), { skipRender: true });
}

function updateWorkoutColor(workoutId, color) {
  updateWorkout(workoutId, workout => ({
    ...workout,
    color: normalizeWorkoutColor(color),
    updatedAt: new Date().toISOString()
  }));
}

function addWorkoutBlock(workoutId) {
  updateWorkout(workoutId, workout => ({
    ...workout,
    updatedAt: new Date().toISOString(),
    blocks: [...workoutBlocks(workout), createWorkoutBlock()]
  }));
}

function toggleWorkoutBlockFlow(workoutId, blockId) {
  updateWorkout(workoutId, workout => ({
    ...workout,
    updatedAt: new Date().toISOString(),
    blocks: workoutBlocks(workout).map(block =>
      block.id === blockId
        ? {
            ...block,
            flowMode: blockFlowMode(block) === "interleaved" ? "sequential" : "interleaved"
          }
        : block
    )
  }));
}

function removeWorkoutBlock(workoutId, blockId) {
  updateWorkout(workoutId, workout => {
    const blocks = workoutBlocks(workout);
    const nextBlocks = blocks.filter(block => block.id !== blockId);
    return {
      ...workout,
      updatedAt: new Date().toISOString(),
      blocks: nextBlocks.length ? nextBlocks : [createWorkoutBlock()]
    };
  });
}

function removeMovementFromBlock(workoutId, blockId, movementId) {
  updateWorkout(workoutId, workout => ({
    ...workout,
    updatedAt: new Date().toISOString(),
    blocks: workoutBlocks(workout).map(block =>
      block.id === blockId
        ? {
            ...block,
            movements: normalizeMovementEntries((block.movements || []).filter(entry =>
              (typeof entry === "string" ? entry : entry.movementId) !== movementId
            ))
          }
        : block
    )
  }));
}

function removeBuilderMovement(event, control = event.currentTarget) {
  event.preventDefault();
  event.stopPropagation();
  removeMovementFromBlock(
    control.dataset.workoutId,
    control.dataset.blockId,
    control.dataset.movementId
  );
}

function addSetToWorkoutMovement(workoutId, blockId, movementId) {
  if (!workouts.some(workout => workout.id === workoutId)) return;
  updateWorkoutMovementEntry(workoutId, blockId, movementId, (entry, workout) => {
    const movement = movementById(entry.movementId);
    if (!movement) return entry;
    const currentSetCount = targetSetCountForEntry(movement, entry, workout);
    return {
      ...entry,
      target: {
        ...(entry.target || {}),
        sets: currentSetCount + 1
      }
    };
  });
}

function removeSetFromWorkoutMovement(workoutId, blockId, movementId, setIndex) {
  if (!workouts.some(workout => workout.id === workoutId)) return;
  const removeIndex = Math.max(0, Number.isFinite(setIndex) ? setIndex : 0);
  updateWorkoutMovementEntry(workoutId, blockId, movementId, (entry, workout) => {
    const movement = movementById(entry.movementId);
    if (!movement) return entry;
    const currentSetCount = targetSetCountForEntry(movement, entry, workout);
    if (currentSetCount <= 1) return entry;
    const performedSets = normalizePerformedSets(entry.performedSets || []);
    if (removeIndex < performedSets.length) performedSets.splice(removeIndex, 1);
    return {
      ...entry,
      target: {
        ...(entry.target || {}),
        sets: currentSetCount - 1
      },
      performedSets
    };
  }, { markActive: true });
}

function removeLiveSet(event, control = event.currentTarget) {
  event.preventDefault();
  event.stopPropagation();
  removeSetFromWorkoutMovement(
    control.dataset.workoutId,
    control.dataset.blockId,
    control.dataset.movementId,
    Number(control.dataset.setIndex)
  );
}

function moveBuilderMovement(workoutId, sourceBlockId, sourceIndex, targetBlockId, targetIndex) {
  updateWorkout(workoutId, workout => {
    const blocks = workoutBlocks(workout).map(block => ({
      ...block,
      movements: normalizeMovementEntries(block.movements || [])
    }));
    const sourceBlock = blocks.find(block => block.id === sourceBlockId);
    const targetBlock = blocks.find(block => block.id === targetBlockId);
    if (!sourceBlock || !targetBlock) return workout;
    const fromIndex = Math.max(0, Math.min(sourceBlock.movements.length - 1, Number(sourceIndex)));
    const [entry] = sourceBlock.movements.splice(fromIndex, 1);
    if (!entry) return workout;
    let insertIndex = Math.max(0, Math.min(Number(targetIndex), targetBlock.movements.length));
    if (sourceBlock.id === targetBlock.id && fromIndex < Number(targetIndex)) {
      insertIndex = Math.max(0, insertIndex - 1);
    }
    targetBlock.movements.splice(insertIndex, 0, entry);
    activeBlockId = targetBlock.id;
    return {
      ...workout,
      updatedAt: new Date().toISOString(),
      blocks: blocks.map(block => ({
        ...block,
        movements: normalizeMovementEntries(block.movements)
      }))
    };
  });
}

function deleteWorkout(workoutId) {
  const template = workoutTemplates.find(item => item.id === workoutId);
  if (template) {
    openConfirmDialog({
      title: "Delete template?",
      message: `"${workoutTitle(template)}" will be removed from your workout templates. Scheduled workouts already created from it will stay on the calendar.`,
      confirmLabel: "Yes, delete",
      onConfirm: () => {
        workoutTemplates = workoutTemplates.filter(item => item.id !== workoutId);
        activeWorkoutTemplateId = null;
        activeBlockId = null;
        saveStoredWorkoutTemplates();
        publishAppData();
        openMovementHome({ replaceHistory: false });
      }
    });
    return;
  }

  const workout = workouts.find(item => item.id === workoutId);
  if (!workout) return;
  const entryLabel = workout.kind === "rest" ? "rest day" : workout.kind === "activity" ? "activity" : "workout";
  openConfirmDialog({
    title: `Delete ${entryLabel}?`,
    message: `"${workoutTitle(workout)}" on ${shortDateLabel(workout.date)} will be removed from the calendar.`,
    confirmLabel: "Yes, delete",
    onConfirm: () => {
      workouts = workouts.filter(item => item.id !== workoutId);
      selectedCalendarDate = workout.date;
      activeWorkoutId = null;
      activeBlockId = null;
      saveStoredWorkouts();
      publishAppData();
      openMovementHome({ replaceHistory: false });
    }
  });
}

function openConfirmDialog({ title, message, confirmLabel = "Yes", cancelLabel = "No", onConfirm }) {
  pendingConfirmAction = typeof onConfirm === "function" ? onConfirm : null;
  confirmModal.innerHTML = `
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
      <div class="confirm-copy">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(message)}</p>
      </div>
      <div class="confirm-actions">
        <button type="button" class="back-button" data-action="closeConfirmDialog">${escapeHTML(cancelLabel)}</button>
        <button type="button" class="delete-button" data-action="confirmDialogAction">${escapeHTML(confirmLabel)}</button>
      </div>
    </section>
  `;
  confirmModal.hidden = false;
  syncModalScrollLock();
  confirmModal.querySelector(".back-button")?.focus();
}

function closeConfirmDialog() {
  confirmModal.hidden = true;
  confirmModal.innerHTML = "";
  pendingConfirmAction = null;
  syncModalScrollLock();
}

function confirmDialogAction() {
  const action = pendingConfirmAction;
  confirmModal.hidden = true;
  confirmModal.innerHTML = "";
  pendingConfirmAction = null;
  syncModalScrollLock();
  action?.();
}

function syncModalScrollLock() {
  const modalOpen = !evidenceModal.hidden ||
    !movementQuickViewModal.hidden ||
    !confirmModal.hidden ||
    schedulePickerOpen ||
    calendarDaySheetOpen ||
    quickActivityOpen;
  document.body.style.overflow = modalOpen ? "hidden" : "";
}

function updateWorkout(workoutId, updater, options = {}) {
  let changed = false;
  if (workoutTemplates.some(template => template.id === workoutId)) {
    workoutTemplates = workoutTemplates.map(template => {
      if (template.id !== workoutId) return template;
      changed = true;
      return normalizeWorkoutTemplateRecord(updater(template));
    });
    if (!changed) return;
    saveStoredWorkoutTemplates();
    publishAppData();
    if (!options.skipRender) renderMovementApp({ skipHistory: true });
    return;
  }

  workouts = workouts.map(workout => {
    if (workout.id !== workoutId) return workout;
    changed = true;
    return normalizeWorkoutRecord(updater(workout));
  });
  if (!changed) return;
  saveStoredWorkouts();
  publishAppData();
  if (!options.skipRender) renderMovementApp({ skipHistory: true });
}

function loadStoredWorkouts() {
  return loadStoredList(WORKOUT_STORAGE_KEY, normalizeWorkoutRecord, isWorkoutRecord, compareWorkouts, "workout");
}

function saveStoredWorkouts() {
  workouts = saveStoredList(WORKOUT_STORAGE_KEY, workouts, normalizeWorkoutRecord, isWorkoutRecord, compareWorkouts, "workout");
}

function loadStoredWorkoutTemplates() {
  return loadStoredList(
    WORKOUT_TEMPLATE_STORAGE_KEY,
    normalizeWorkoutTemplateRecord,
    isWorkoutTemplateRecord,
    compareWorkoutTemplates,
    "workout template"
  );
}

function saveStoredWorkoutTemplates() {
  workoutTemplates = saveStoredList(
    WORKOUT_TEMPLATE_STORAGE_KEY,
    workoutTemplates,
    normalizeWorkoutTemplateRecord,
    isWorkoutTemplateRecord,
    compareWorkoutTemplates,
    "workout template"
  );
}

function normalizeWorkoutRecord(workout) {
  if (!workout || typeof workout !== "object") return workout;
  const kind = ["activity", "rest"].includes(workout.kind) ? workout.kind : "workout";
  const legacyMovements = normalizeMovementEntries(workout.movements || []);
  const blocks = kind !== "workout"
    ? []
    : Array.isArray(workout.blocks) && workout.blocks.length
      ? workout.blocks.map(normalizeWorkoutBlock)
      : [createWorkoutBlock(legacyMovements)];
  return {
    id: String(workout.id || `workout_${workout.date || todayKey()}_${Date.now().toString(36)}`),
    kind,
    templateId: workout.templateId || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(workout.date || "") ? workout.date : todayKey(),
    status: ["draft", "active", "completed"].includes(workout.status) ? workout.status : "draft",
    title: workout.title ?? workout.name ?? "",
    color: normalizeWorkoutColor(workout.color),
    createdAt: workout.createdAt || new Date().toISOString(),
    updatedAt: workout.updatedAt || workout.createdAt || new Date().toISOString(),
    completedAt: workout.completedAt || null,
    blocks
  };
}

function normalizeWorkoutTemplateRecord(template) {
  if (!template || typeof template !== "object") return template;
  const legacyMovements = normalizeMovementEntries(template.movements || []);
  const blocks = Array.isArray(template.blocks) && template.blocks.length
    ? template.blocks.map(normalizeWorkoutBlock)
    : [createWorkoutBlock(legacyMovements)];
  return {
    id: String(template.id || `template_${Date.now().toString(36)}`),
    title: template.title ?? template.name ?? "",
    color: normalizeWorkoutColor(template.color),
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || template.createdAt || new Date().toISOString(),
    blocks
  };
}

function normalizeWorkoutBlock(block) {
  return {
    id: String(block?.id || `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`),
    title: block?.title || "",
    flowMode: ["sequential", "interleaved"].includes(block?.flowMode) ? block.flowMode : null,
    movements: normalizeMovementEntries(block?.movements || [])
  };
}

function normalizeMovementEntries(entries) {
  return (entries || [])
    .map((entry, order) => {
      const movementId = typeof entry === "string" ? entry : entry?.movementId;
      if (!movementId) return null;
      return {
        movementId,
        order,
        target: typeof entry === "object" ? entry.target ?? null : null,
        performedSets: normalizePerformedSets(entry?.performedSets || [])
      };
    })
    .filter(Boolean);
}

function normalizePerformedSets(sets) {
  return (sets || [])
    .map(normalizePerformedSet)
    .filter(Boolean);
}

function normalizePerformedSet(set) {
  if (!set || typeof set !== "object") return null;
  return {
    targetLoad: nullableNumber(set.targetLoad),
    targetReps: nullableInteger(set.targetReps),
    targetDurationSeconds: nullableInteger(set.targetDurationSeconds),
    load: nullableNumber(set.load),
    reps: nullableInteger(set.reps),
    durationSeconds: nullableInteger(set.durationSeconds),
    extraSlots: Math.max(0, nullableInteger(set.extraSlots) || 0),
    rir: normalizeRirValue(set.rir),
    done: Boolean(set.done),
    completedAt: set.completedAt || null,
    updatedAt: set.updatedAt || null
  };
}

function nullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function nullableInteger(value) {
  const number = nullableNumber(value);
  return number === null ? null : Math.round(number);
}

function normalizeRirValue(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(3, number));
}

function roundLoad(value) {
  const number = nullableNumber(value);
  return number === null ? null : Math.round(number * 2) / 2;
}

function formatSetNumber(value) {
  const number = nullableNumber(value);
  if (number === null) return "";
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function createWorkoutBlock(movements = [], flowMode = null) {
  return {
    id: `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    flowMode: ["sequential", "interleaved"].includes(flowMode) ? flowMode : null,
    movements: normalizeMovementEntries(movements)
  };
}

function cloneWorkoutBlocks(workout) {
  return workoutBlocks(workout).map(block => createWorkoutBlock(
    normalizeMovementEntries(block.movements || []).map(entry => ({
      ...entry,
      target: null,
      performedSets: []
    })),
    block.flowMode
  ));
}

function blockFlowMode(block, movements = blockMovements(block)) {
  if (block?.flowMode === "sequential" || block?.flowMode === "interleaved") return block.flowMode;
  return movements.length > 1 ? "interleaved" : "sequential";
}

function normalizeWorkoutColor(color) {
  const value = String(color || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  return WORKOUT_COLOR_OPTIONS.some(option => option.value === value)
    ? value
    : WORKOUT_COLOR_OPTIONS[0].value;
}

function workoutColor(workout) {
  return normalizeWorkoutColor(workout?.color);
}

function workoutColorStyle(workout) {
  return `--workout-color: ${workoutColor(workout)};`;
}

function isWorkoutRecord(workout) {
  return Boolean(
    workout &&
    typeof workout.id === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(workout.date || "") &&
    ["draft", "active", "completed"].includes(workout.status)
  );
}

function isWorkoutTemplateRecord(template) {
  return Boolean(
    template &&
    typeof template.id === "string" &&
    Array.isArray(template.blocks)
  );
}

function compareWorkouts(a, b) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
}

function compareWorkoutTemplates(a, b) {
  return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
}

function workoutsForDate(dateKey) {
  return workouts.filter(workout => workout.date === dateKey).sort(compareWorkouts);
}

function workoutMovements(workout) {
  return workoutMovementEntries(workout).map(entry => entry.movement);
}

function workoutMovementEntries(workout) {
  return workoutEntries(workout)
    .map(entry => ({ ...entry, movement: movementById(entry.movementId) }))
    .filter(entry => entry.movement);
}

function workoutBlocks(workout) {
  if (!workout || typeof workout !== "object") return [];
  if (Array.isArray(workout.blocks) && workout.blocks.length) {
    return workout.blocks.map(normalizeWorkoutBlock);
  }
  const legacyMovements = normalizeMovementEntries(workout.movements || []);
  return legacyMovements.length ? [createWorkoutBlock(legacyMovements)] : [];
}

function workoutEntries(workout) {
  return workoutBlocks(workout).flatMap(block => block.movements || []);
}

function blockMovements(block) {
  return normalizeMovementEntries(block?.movements || [])
    .map(entry => ({ ...entry, movement: movementById(entry.movementId) }))
    .filter(entry => entry.movement);
}

function workoutCountByStatus(statuses) {
  const accepted = new Set(statuses);
  return workouts.filter(workout => accepted.has(workout.status)).length;
}

function completedWorkoutDaysInWindow(dayCount) {
  const today = parseDateKey(todayKey());
  const first = addDays(today, -Math.max(0, dayCount - 1));
  const completedDates = new Set(
    workouts
      .filter(workout => workout.status === "completed")
      .map(workout => workout.date)
  );
  let count = 0;
  for (let cursor = new Date(first); cursor <= today; cursor = addDays(cursor, 1)) {
    if (completedDates.has(formatDateKey(cursor))) count += 1;
  }
  return count;
}

function calendarDateStatus(dayWorkouts) {
  if (dayWorkouts.some(workout => workout.status === "completed")) return "completed";
  if (dayWorkouts.some(workout => workout.status === "active")) return "active";
  if (dayWorkouts.some(workout => workout.status === "draft")) return "draft";
  return "";
}

function shortDateLabel(dateKey) {
  return DAY_FORMATTER.format(parseDateKey(dateKey));
}

function calendarDays(monthDate) {
  const first = monthStart(monthDate);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function mobileCalendarWeeks() {
  const centerDate = parseDateKey(selectedCalendarDate);
  const centerStart = weekStart(centerDate);
  return [
    { label: "Past", start: addDays(centerStart, -7) },
    { label: "Current", start: centerStart },
    { label: "Next", start: addDays(centerStart, 7) }
  ].map(week => ({
    ...week,
    days: Array.from({ length: 7 }, (_, index) => addDays(week.start, index))
  }));
}

function todayKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || todayKey()).split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }
  return new Date(year, month - 1, day);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function weekStart(date) {
  return addDays(date, -date.getDay());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameMonth(date, monthDate) {
  return date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth();
}

function renderMovementCollection() {
  const movements = collectionMovements();
  const scope = collectionSummaryLabel();
  movementCollection.innerHTML = `
    <div class="screen-topbar">
      <button type="button" class="back-button" data-action="${activeWorkout() ? "finishWorkoutMovementPicker" : "openMovementHome"}">Back</button>
    </div>
    <section class="collection-header">
      <div class="collection-title">
        <h1>Movements</h1>
        <p id="collectionSummaryText">${escapeHTML(collectionResultSummary(scope, movements.length))}</p>
      </div>
    </section>
    ${renderCompareTray()}
    ${renderCollectionSearch()}
    ${renderCollectionControls()}
    <div id="movementList" class="movement-list">
      ${movements.map(renderMovementListing).join("") || `<p class="empty-state">No movements in this collection yet.</p>`}
    </div>
  `;
}

function renderMovementDetailPage() {
  const movement = movementById(activeMovementId) || movementLibrary[0];
  if (!movement) {
    movementDetailPage.innerHTML = `
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openMovementBackToCollection">Back</button>
      </div>
      <p class="empty-state">No movement selected.</p>
    `;
    return;
  }

  activeMovementId = movement.id;
  movementDetailPage.innerHTML = `
    <div class="detail-swipe-zone" data-touchstart-action="startDetailSwipe" data-touchend-action="finishDetailSwipe">
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openMovementBackToCollection">Back</button>
      </div>
      <section class="detail-hero">
        <div class="detail-header-grid">
          ${renderMovementTotal(movement)}
          <div class="detail-title">
            <h1>${escapeHTML(movement.name)}</h1>
            ${renderCommunityRating(movement)}
          </div>
        </div>
        <div class="movement-card-tags">${movement.tags.map(renderTagPill).join("")}</div>
        <p class="detail-description">${escapeHTML(movement.description || "")}</p>
        <div class="detail-actions">
          <div class="movement-summary-meta">
            <span>Primary: ${escapeHTML(movementMuscles(movement, "primary").map(muscle => muscle.name).join(", ") || "Pending")}</span>
          </div>
          <div class="compare-tray-actions">
            ${renderAddMovementButton(movement)}
            <button type="button" class="compare-button" data-action="startCompareFromMovement" data-movement-id="${escapeHTML(movement.id)}">Compare</button>
            <button type="button" class="detail-evidence-button" data-action="openEvidence" data-movement-id="${escapeHTML(movement.id)}">Evidence</button>
          </div>
        </div>
      </section>
      ${renderCompareTray()}
      <section class="detail-body">
        ${renderMovementDetail(movement)}
      </section>
    </div>
  `;
}

function openMovementQuickView(movementId) {
  const movement = movementById(movementId);
  if (!movement) return;
  movementQuickViewModal.innerHTML = `
    <section
      class="quick-view-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="${escapeHTML(movement.name)} movement details"
    >
      <div class="quick-view-close-row">
        <button type="button" class="modal-close" data-action="closeMovementQuickView" aria-label="Close movement details">X</button>
      </div>
      <section class="detail-hero">
        <div class="detail-header-grid">
          ${renderMovementTotal(movement)}
          <div class="detail-title">
            <h3 class="quick-view-title">${escapeHTML(movement.name)}</h3>
            ${renderCommunityRating(movement)}
            <div class="movement-card-tags">${movement.tags.map(renderTagPill).join("")}</div>
          </div>
        </div>
        <p class="detail-description">${escapeHTML(movement.description || "")}</p>
        <div class="detail-actions">
          <div class="movement-summary-meta">
            <span>Primary: ${escapeHTML(movementMuscles(movement, "primary").map(muscle => muscle.name).join(", ") || "Pending")}</span>
          </div>
          <button type="button" class="detail-evidence-button" data-action="openEvidence" data-movement-id="${escapeHTML(movement.id)}">Evidence</button>
        </div>
      </section>
      <section class="detail-body">
        ${renderMovementDetail(movement)}
      </section>
    </section>
  `;
  movementQuickViewModal.hidden = false;
  syncModalScrollLock();
  movementQuickViewModal.querySelector(".modal-close")?.focus();
  requestAnimationFrame(() => window.renderLocalAnatomyViewers?.());
}

function closeMovementQuickView() {
  movementQuickViewModal.hidden = true;
  movementQuickViewModal.innerHTML = "";
  syncModalScrollLock();
}

function renderMovementComparePage() {
  const anchor = movementById(compareAnchorId);
  const target = movementById(compareTargetId);
  if (!anchor || !target) {
    movementComparePage.innerHTML = `
      <div class="screen-topbar">
        <button type="button" class="back-button" data-action="openCompareSelection">Back</button>
        <button type="button" class="compare-button" data-action="clearCompareMode">Cancel</button>
      </div>
      <p class="empty-state">Pick two movements to compare.</p>
    `;
    return;
  }

  movementComparePage.innerHTML = `
    <div class="screen-topbar">
      <button type="button" class="back-button" data-action="returnToCompareOrigin">Back</button>
      <div class="compare-tray-actions">
        <button type="button" class="compare-button" data-action="openCompareSelection">Change second</button>
        <button type="button" class="compare-button" data-action="clearCompareModeAndReturn">Cancel</button>
      </div>
    </div>
    <section class="compare-panel">
      <p class="eyebrow">Compare</p>
      <h1>${escapeHTML(anchor.name)} vs ${escapeHTML(target.name)}</h1>
      ${renderCompareLegend(anchor, target)}
      ${renderCompareScores(anchor, target)}
      ${renderCompareSharedMuscles(anchor, target)}
      <div class="compare-grid">
        ${renderCompareColumn(anchor, "First")}
        ${renderCompareColumn(target, "Second")}
      </div>
    </section>
  `;
}

function renderCompareColumn(movement, label) {
  return `
    <article class="compare-column">
      <p class="eyebrow">${escapeHTML(label)}</p>
      <div>
        ${renderMovementTotal(movement)}
        <h3>${escapeHTML(movement.name)}</h3>
        ${renderCommunityRating(movement)}
      </div>
      <p class="detail-description">${escapeHTML(movement.description || "")}</p>
      ${renderCompareMuscles(movement, compareSharedMuscleNames())}
      <button type="button" class="detail-evidence-button" data-action="openEvidence" data-movement-id="${escapeHTML(movement.id)}">Evidence</button>
    </article>
  `;
}

function renderCompareScores(anchor, target) {
  return `
    <section class="compare-row">
      <p class="section-label">Scores</p>
      <div class="compare-scoreboard">
        ${renderCompareScoreRow("Composite", compositeMovementScore(anchor), compositeMovementScore(target), true, compositeRatingKeys().length * 100, "composite")}
        ${Object.entries(TRAINING_RATINGS).map(([key, label]) => renderCompareScoreRow(label, ratingScore(anchor, key), ratingScore(target, key), false, 100, key)).join("")}
        ${Object.entries(METADATA_RATINGS).map(([key, label]) => renderCompareScoreRow(label, ratingScore(anchor, key), ratingScore(target, key), false, 100, key)).join("")}
      </div>
    </section>
  `;
}

function renderCompareLegend(anchor, target) {
  return `
    <section class="compare-row">
      <p class="section-label">Key</p>
      <div class="compare-legend">
        <span class="compare-key"><span class="compare-swatch"></span>${escapeHTML(anchor.name)}</span>
        <span class="compare-key"><span class="compare-swatch second"></span>${escapeHTML(target.name)}</span>
      </div>
    </section>
  `;
}

function renderCompareScoreRow(label, anchorScore, targetScore, featured = false, maxScore = 100, ratingKey = "composite") {
  const anchorPosition = scorePercent(anchorScore, maxScore);
  const targetPosition = scorePercent(targetScore, maxScore);
  const low = Math.min(anchorPosition, targetPosition);
  const high = Math.max(anchorPosition, targetPosition);
  const tied = anchorScore === targetScore;
  return `
    <div class="compare-score-row${featured ? " featured" : ""}" style="${ratingStyle(ratingKey)}">
      <div class="compare-score-head">
        <strong>${escapeHTML(label)}</strong>
        <div class="compare-score-values">
          <span class="compare-score-value"><span class="compare-swatch"></span>${anchorScore}</span>
          <span class="compare-score-value"><span class="compare-swatch second"></span>${targetScore}</span>
        </div>
      </div>
      <div
        class="compare-number-line"
        role="img"
        aria-label="${escapeHTML(`${label}: first ${anchorScore}, second ${targetScore}`)}"
      >
        <span class="compare-score-range" style="--range-left: ${low}%; --range-width: ${Math.max(0, high - low)}%"></span>
        <span class="compare-score-marker${anchorScore >= targetScore ? " winner" : ""}" style="--score-left: ${anchorPosition}%">${anchorScore}</span>
        <span class="compare-score-marker second${targetScore >= anchorScore && !tied ? " winner" : ""}" style="--score-left: ${targetPosition}%">${targetScore}</span>
      </div>
    </div>
  `;
}

function renderCompareMuscles(movement, sharedNames) {
  return `
    <section class="compare-row">
      <p class="section-label">Muscles</p>
      <div class="compare-muscle-list">
        ${ROLE_GROUPS.map(group => `
          <div>
            <strong class="role-label ${group.className}">${escapeHTML(group.label)}</strong>
            <div class="movement-card-tags">
              ${movementMuscles(movement, group.key).map(muscle => {
                const normalized = normalizeMuscleName(muscle.name);
                const shared = sharedNames.has(normalized) ? " shared" : "";
                return `<span class="compare-muscle${shared}">${escapeHTML(muscle.name)}</span>`;
              }).join("") || `<span class="movement-count">Pending</span>`}
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCompareSharedMuscles(anchor, target) {
  const shared = compareSharedMuscleNames(anchor, target);
  const names = movementMuscleNames(anchor)
    .filter(name => shared.has(normalizeMuscleName(name)));
  return `
    <section class="compare-row">
      <p class="section-label">Shared Muscles</p>
      <div class="movement-card-tags">
        ${names.map(name => `<span class="compare-muscle shared">${escapeHTML(name)}</span>`).join("") || `<span class="movement-count">No overlap listed.</span>`}
      </div>
    </section>
  `;
}

function renderCollectionControls() {
  return `
    <section class="collection-controls" aria-label="Movement library controls">
      <button
        type="button"
        class="collection-menu-button${collectionFiltersOpen ? " active" : ""}"
        data-action="toggleCollectionFilters"
        aria-expanded="${collectionFiltersOpen ? "true" : "false"}"
      >Filters <span>${escapeHTML(filterControlLabel())}</span></button>
      <div class="collection-menu-shell collection-sort-shell">
        <button
          type="button"
          class="collection-menu-button${collectionSortOpen ? " active" : ""}"
          data-action="toggleCollectionSortPanel"
          aria-expanded="${collectionSortOpen ? "true" : "false"}"
        >Sort <span>${escapeHTML(sortControlLabel())}</span></button>
        <button
          type="button"
          class="collection-menu-gear-button${collectionSortDirectionOpen ? " active" : ""}"
          data-action="toggleSortDirectionMenu"
          aria-expanded="${collectionSortDirectionOpen ? "true" : "false"}"
          aria-label="Sort direction"
        ><img src="assets/icons/sort-gear.png" alt=""></button>
      </div>
      ${collectionFiltersOpen ? renderCollectionFilterPanel() : ""}
      ${collectionSortOpen ? renderCollectionSortPanel() : ""}
    </section>
  `;
}

function renderCollectionSearch() {
  return `
    <div class="collection-search">
      <input
        class="collection-search-input"
        type="search"
        value="${escapeHTML(collectionSearchQuery)}"
        placeholder="Search movements"
        aria-label="Search movements"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        data-input-action="handleCollectionSearchInput"
      >
    </div>
  `;
}

function renderCollectionFilterPanel() {
  return `
    <div class="collection-dropdown-panel" aria-label="Movement filters">
      <div class="collection-tree">
        <div class="collection-tree-column">
          ${movementCollections().map(renderCollectionRootButton).join("")}
        </div>
        ${activeCollectionGroup ? renderCollectionBranchColumn() : ""}
        ${activeCollectionGroup === "region" && activeRegionMacro ? renderRegionLeafColumn(activeRegionMacro) : ""}
      </div>
    </div>
  `;
}

function renderCollectionSortPanel() {
  if (collectionSortDirectionOpen) {
    return `
      <div class="collection-dropdown-panel">
        <div class="collection-sort-tree sort-direction-tree" aria-label="Sort direction">
          ${renderSortDirectionPanel()}
        </div>
      </div>
    `;
  }

  return `
    <div class="collection-dropdown-panel">
      <div class="collection-sort-tree" aria-label="Movement sorting">
        <div class="sort-tree-column">
          ${Object.entries(SORT_LABELS).map(([key, label]) => renderSortMetricButton(key, label)).join("")}
        </div>
        ${renderSortBranchColumn()}
      </div>
    </div>
  `;
}

function renderSortBranchColumn() {
  const ratings = sortSubtypeRatings();
  if (!ratings || !collectionSortMenuOpen) return "";
  return `
    <div class="sort-tree-column" style="${ratingStyle(collectionSortMetric)}">
      ${Object.entries(ratings).map(([key, label]) => renderSortSubtypeButton(key, label)).join("")}
    </div>
  `;
}

function renderSortDirectionPanel() {
  return `
    <div class="sort-direction-cell">
      ${Object.entries(SORT_DIRECTIONS).filter(([key]) => key !== "none").map(([key, label]) => `
        <button
          type="button"
          class="sort-direction-button${collectionSortDirection === key ? " active" : ""}"
          data-action="setSortDirection"
          data-direction="${escapeHTML(key)}"
          aria-pressed="${collectionSortDirection === key ? "true" : "false"}"
        >${escapeHTML(label)}</button>
      `).join("")}
    </div>
  `;
}

function renderSortMetricButton(key, label) {
  const active = isSortingActive() && collectionSortMetric === key ? " active" : "";
  const open = collectionSortMetric === key && sortSubtypeRatings(key) && collectionSortMenuOpen ? " open" : "";
  const branch = sortSubtypeRatings(key) ? " branch" : "";
  return `
    <button
      type="button"
      class="sort-tree-button${branch}${open}${active}"
      style="${ratingStyle(key)}"
      data-action="setCollectionSort"
      data-metric="${escapeHTML(key)}"
      aria-pressed="${isSortingActive() && collectionSortMetric === key ? "true" : "false"}"
    >${escapeHTML(label)}</button>
  `;
}

function renderSortSubtypeButton(key, label) {
  const active = isSortingActive() && activeSortSubtype() === key ? " active" : "";
  return `
    <button
      type="button"
      class="sort-tree-button${active}"
      style="${ratingStyle(key)}"
      data-action="setCollectionSortSubtype"
      data-subtype="${escapeHTML(key)}"
      aria-pressed="${activeSortSubtype() === key ? "true" : "false"}"
    >${escapeHTML(label)}</button>
  `;
}

function filterControlLabel() {
  const selectedTags = selectedCollectionTagObjects();
  if (selectedTags.length) return `${selectedTags.length} selected`;
  return activeCollectionGroup ? tagGroupLabel(activeCollectionGroup) : "Any";
}

function sortControlLabel() {
  if (!isSortingActive()) return "None";
  const direction = collectionSortDirection === "asc" ? "low first" : "high first";
  const metric = collectionSortMetric === "composite"
    ? "Composite"
    : sortSubtypeRatings(collectionSortMetric)?.[activeSortSubtype()] || SORT_LABELS[collectionSortMetric];
  return `${metric}, ${direction}`;
}

function collectionResultSummary(scope, count) {
  const search = normalizeSearchText(collectionSearchQuery);
  const prefix = search ? `${scope} · "${collectionSearchQuery.trim()}"` : scope;
  return `${prefix} · ${count} movement${count === 1 ? "" : "s"}`;
}

function renderCompareTray() {
  const anchor = movementById(compareAnchorId);
  if (!anchor || movementView === "compare") return "";
  return `
    <section class="compare-tray" aria-label="Active movement comparison">
      <div>
        <p class="eyebrow">Compare active</p>
        <strong>${escapeHTML(anchor.name)}</strong>
      </div>
      <div class="compare-tray-actions">
        <button type="button" class="compare-button" data-action="openCompareSelection">Pick second</button>
        <button type="button" class="compare-button" data-action="clearCompareMode">Cancel</button>
      </div>
    </section>
  `;
}

function renderAddMovementButton(movement) {
  const workout = activeWorkout();
  if (!workout) return "";
  const added = workoutHasMovement(workout, movement.id);
  return `
    <button
      type="button"
      class="add-movement-button${added ? " added" : ""}"
      data-action="addMovementToActiveWorkout"
      data-movement-id="${escapeHTML(movement.id)}"
      aria-pressed="${added ? "true" : "false"}"
    >${added ? "Added" : "Add Movement"}</button>
  `;
}

function renderCollectionRootButton(collection) {
  const selectedCount = selectedCountForGroup(collection.label);
  const isActive = activeCollectionGroup === collection.label;
  const active = isActive ? " active" : "";
  const hasSelection = selectedCount > 0;
  return `
    <button
      type="button"
      class="collection-tree-button branch${active}${hasSelection ? " partial" : ""}"
      data-action="openMovementGroup"
      data-group="${escapeHTML(collection.label)}"
      aria-label="Open ${escapeHTML(collectionTitle(collection))}"
      >${escapeHTML(collectionTitle(collection))}${selectedCount ? `<span>${selectedCount}</span>` : ""}</button>
  `;
}

function renderCollectionFilter(collection) {
  const isActive = isCollectionTagSelected(collection.label, collection.group);
  const active = isActive ? " active" : "";
  return `
    <button
      type="button"
      class="collection-tree-button${active}"
      data-action="toggleCollectionTag"
      data-label="${escapeHTML(collection.label)}"
      data-group="${escapeHTML(collection.group)}"
      aria-pressed="${isActive ? "true" : "false"}"
    >${escapeHTML(collectionTitle(collection))}<span>${collection.count}</span></button>
  `;
}

function renderCollectionBranchColumn() {
  if (activeCollectionGroup === "region") return renderRegionMacroColumn();
  return `
    <div class="collection-tree-column">
      ${collectionFilters().map(renderCollectionFilter).join("") || `<span class="movement-count">No options yet.</span>`}
    </div>
  `;
}

function renderRegionMacroColumn() {
  return `
    <div class="collection-tree-column">
      ${REGION_MACRO_ORDER.map(renderRegionMacroFilter).join("")}
    </div>
  `;
}

function renderRegionLeafColumn(macro) {
  const filters = regionSubFilters(macro);
  return `
    <div class="collection-tree-column">
      ${filters.map(renderCollectionFilter).join("") || `<span class="movement-count">No subgroups yet.</span>`}
    </div>
  `;
}

function renderRegionMacroFilter(label) {
  const count = regionMacroCount(label);
  const selected = isRegionMacroSelected(label) ? " active" : "";
  const partial = isRegionMacroPartial(label) ? " partial" : "";
  const open = activeRegionMacro === label ? " open" : "";
  const branch = regionSubFilters(label).length ? " branch" : "";
  return `
    <button
      type="button"
      class="collection-tree-button${branch}${open}${selected}${partial}"
      data-action="toggleRegionMacro"
      data-label="${escapeHTML(label)}"
      aria-pressed="${isRegionMacroSelected(label) ? "true" : "false"}"
    >${escapeHTML(label)} <span>${count}</span></button>
  `;
}

function renderMovementListing(movement) {
  return `
    <article
      class="movement-listing"
      role="button"
      tabindex="0"
      data-action="openMovementDetail"
      data-keydown-action="handleMovementListingKey"
      data-movement-id="${escapeHTML(movement.id)}"
    >
      ${renderMovementTotal(movement)}
      <div class="listing-copy">
        <h3>${escapeHTML(movement.name)}</h3>
        ${renderCommunityRating(movement)}
        <div class="movement-card-tags">${movement.tags.slice(0, 5).map(renderTagPill).join("")}</div>
        <p class="listing-summary">${escapeHTML(movement.description || "")}</p>
        <div class="movement-summary-meta">
          <span>Primary: ${escapeHTML(movementMuscles(movement, "primary").map(muscle => muscle.name).join(", ") || "Pending")}</span>
        </div>
        ${activeWorkout() ? `<div class="movement-listing-actions">${renderAddMovementButton(movement)}</div>` : ""}
      </div>
      <div class="movement-arrow" aria-hidden="true">&rsaquo;</div>
    </article>
  `;
}

function renderCommunityRating(movement) {
  const rating = movement.communityRating || {};
  const scale = Math.max(1, Math.min(10, Number(rating.scale) || 5));
  const count = Math.max(0, Number(rating.reviewCount ?? rating.count) || 0);
  const average = Number(rating.averageStars ?? rating.average);
  const hasRating = count > 0 && Number.isFinite(average);
  const score = hasRating ? Math.max(0, Math.min(scale, average)) : 0;
  const filledStars = Math.round(score);
  const stars = Array.from({ length: scale }, (_, index) => `
    <span class="${index < filledStars ? "filled" : "empty"}" aria-hidden="true">&#9733;</span>
  `).join("");
  const label = hasRating
    ? `${score.toFixed(1)}/${scale} (${count})`
    : "No community reviews";

  return `
    <div
      class="community-rating${hasRating ? " has-rating" : ""}"
      title="${hasRating ? "Community rating" : "Community rating scaffold; no reviews collected yet"}"
      aria-label="${escapeHTML(hasRating ? `Community rating ${label}` : "No community reviews yet")}"
    >
      <span class="community-stars">${stars}</span>
      <span class="community-rating-label">${escapeHTML(label)}</span>
    </div>
  `;
}

function renderMovementDetail(movement) {
  return `
      <div class="movement-card-body">
        <div class="movement-copy">
          ${renderRatingGroup("Training", TRAINING_RATINGS, movement, "training")}
          ${renderRatingGroup("Setup", METADATA_RATINGS, movement, "metadata")}
          <div class="muscle-grid">
            ${ROLE_GROUPS.map(group => renderMuscleGroup(movement, group)).join("")}
          </div>
        </div>
        <div class="movement-visual">
          <div
            class="local-anatomy-viewer"
            data-movement-id="${escapeHTML(movement.id)}"
            aria-label="${escapeHTML(movement.name)} local BodyParts3D muscle viewer"
          >
            <div class="anatomy-loading">Loading local BodyParts3D meshes</div>
          </div>
          <div class="role-legend">
            <div class="role-key primary">Primary</div>
            <div class="role-key secondary">Secondary</div>
            <div class="role-key support">Support</div>
          </div>
        </div>
      </div>
  `;
}

function openMovementHome(options = {}) {
  movementView = "home";
  activeWorkoutId = null;
  activeWorkoutTemplateId = null;
  activeBlockId = null;
  schedulePickerOpen = false;
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  activeCollectionGroup = null;
  activeRegionMacro = null;
  activeMovementId = null;
  renderMovementApp(options);
}

function openMovementCollection(tag = null, options = {}) {
  if (movementView !== "workout") {
    activeWorkoutId = null;
    activeWorkoutTemplateId = null;
    activeBlockId = null;
  }
  if (tag && tag !== "all") {
    const tagRecord = collectionTagFor(tag);
    selectedCollectionTags = [collectionTagKey(tagRecord.label, tagRecord.group)];
    activeCollectionGroup = tagRecord.group;
    activeRegionMacro = tagRecord.group === "region" ? regionMacroForLabel(tagRecord.label) : null;
  } else {
    selectedCollectionTags = [];
    activeCollectionGroup = null;
    activeRegionMacro = null;
  }
  if (!options.preserveSearch) collectionSearchQuery = "";
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function handleCollectionSearchInput(event) {
  collectionSearchQuery = String(event.target.value || "").slice(0, 80);
  updateCollectionResults();
}

function updateCollectionResults() {
  const movements = collectionMovements();
  const summary = document.getElementById("collectionSummaryText");
  const list = document.getElementById("movementList");
  if (summary) summary.textContent = collectionResultSummary(collectionSummaryLabel(), movements.length);
  if (list) {
    list.innerHTML = movements.map(renderMovementListing).join("") ||
      `<p class="empty-state">No movements in this collection yet.</p>`;
  }
}

function toggleCollectionFilters(options = {}) {
  collectionFiltersOpen = !collectionFiltersOpen;
  if (collectionFiltersOpen) {
    collectionSortOpen = false;
    collectionSortDirectionOpen = false;
  }
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function toggleCollectionSortPanel(options = {}) {
  collectionSortOpen = !collectionSortOpen;
  if (collectionSortOpen) {
    collectionFiltersOpen = false;
    collectionSortDirectionOpen = false;
    collectionSortMenuOpen = Boolean(sortSubtypeRatings(collectionSortMetric));
  } else {
    collectionSortDirectionOpen = false;
  }
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function toggleCollectionTag(label, group, options = {}) {
  const key = collectionTagKey(label, group);
  let nextTags = isCollectionTagSelected(label, group)
    ? selectedCollectionTags.filter(item => item !== key)
    : [...selectedCollectionTags, key];
  if (group === "region" && labelIsRegionSubgroup(label)) {
    const macro = regionMacroForLabel(label);
    nextTags = nextTags.filter(item => item !== collectionTagKey(macro, "region"));
    activeRegionMacro = macro;
  } else if (group === "region" && REGION_MACRO_ORDER.includes(label)) {
    activeRegionMacro = label;
  }
  selectedCollectionTags = uniqueCollectionTagKeys(nextTags);
  activeCollectionGroup = group;
  if (group !== "region") activeRegionMacro = null;
  collectionFiltersOpen = true;
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function setCollectionSort(metric, options = {}) {
  const nextMetric = normalizeSortMetric(metric);
  const sameActiveMetric = isSortingActive() && collectionSortMetric === nextMetric;
  collectionSortMetric = nextMetric;
  collectionSortSubtype = defaultSortSubtype(collectionSortMetric, collectionSortSubtype);
  collectionSortDirection = collectionSortDirection === "none" ? "desc" : collectionSortDirection;
  collectionSortOpen = true;
  collectionFiltersOpen = false;
  collectionSortDirectionOpen = false;
  collectionSortMenuOpen = Boolean(sortSubtypeRatings(collectionSortMetric)) &&
    (!sameActiveMetric || !collectionSortMenuOpen);
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function setCollectionSortSubtype(subtype, options = {}) {
  collectionSortSubtype = normalizeSortSubtype(collectionSortMetric, subtype);
  collectionSortDirection = collectionSortDirection === "none" ? "desc" : collectionSortDirection;
  collectionSortMenuOpen = true;
  collectionSortOpen = true;
  collectionSortDirectionOpen = false;
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function toggleSortDirectionMenu(options = {}) {
  collectionSortDirectionOpen = !collectionSortDirectionOpen;
  collectionSortOpen = true;
  collectionFiltersOpen = false;
  collectionSortMenuOpen = false;
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function setSortDirection(direction, options = {}) {
  collectionSortDirection = normalizeSortDirection(direction, true);
  collectionSortOpen = true;
  collectionFiltersOpen = false;
  collectionSortDirectionOpen = false;
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function openMovementGroup(group, options = {}) {
  activeCollectionGroup = group;
  if (group !== "region") activeRegionMacro = null;
  if (group === "region" && !activeRegionMacro) activeRegionMacro = inferActiveRegionMacro();
  collectionFiltersOpen = true;
  collectionSortOpen = false;
  collectionSortDirectionOpen = false;
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function toggleRegionMacro(label, options = {}) {
  const labels = regionMacroSelectionLabels(label);
  const keys = labels.map(item => collectionTagKey(item, "region"));
  const allSelected = Boolean(keys.length && keys.every(key => selectedCollectionTags.includes(key)));
  activeRegionMacro = label;
  activeCollectionGroup = "region";
  selectedCollectionTags = selectedCollectionTags.filter(key => !keys.includes(key));
  if (!allSelected) selectedCollectionTags = [...selectedCollectionTags, ...keys];
  selectedCollectionTags = uniqueCollectionTagKeys(selectedCollectionTags);
  collectionFiltersOpen = true;
  collectionSortOpen = false;
  collectionSortDirectionOpen = false;
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function openMovementBackToCollection(options = {}) {
  movementView = "collection";
  activeMovementId = null;
  renderMovementApp(options);
}

function openMovementDetail(movementId, options = {}) {
  const movement = movementById(movementId);
  if (!movement) return;
  if (compareAnchorId && movement.id !== compareAnchorId && !options.forceDetail) {
    compareTargetId = movement.id;
    activeMovementId = null;
    movementView = "compare";
    renderMovementApp(options);
    return;
  }
  activeMovementId = movement.id;
  movementView = "detail";
  renderMovementApp(options);
}

function startCompareFromMovement(movementId, options = {}) {
  const movement = movementById(movementId);
  if (!movement) return;
  compareAnchorId = movement.id;
  compareTargetId = null;
  compareOriginMovementId = movement.id;
  activeMovementId = null;
  activeCollectionGroup = null;
  selectedCollectionTags = [];
  movementView = "collection";
  renderMovementApp(options);
}

function openCompareSelection(options = {}) {
  if (!movementById(compareAnchorId)) {
    clearCompareMode(options);
    return;
  }
  compareTargetId = null;
  activeMovementId = null;
  activeCollectionGroup = null;
  activeRegionMacro = null;
  selectedCollectionTags = [];
  movementView = "collection";
  renderMovementApp(options);
}

function returnToCompareOrigin(options = {}) {
  const origin = movementById(compareOriginMovementId) || movementById(compareAnchorId);
  compareAnchorId = null;
  compareTargetId = null;
  compareOriginMovementId = null;
  if (origin) {
    activeMovementId = origin.id;
    movementView = "detail";
  } else {
    activeMovementId = null;
    movementView = "collection";
  }
  renderMovementApp(options);
}

function clearCompareMode(options = {}) {
  const origin = movementById(compareOriginMovementId) || movementById(compareAnchorId);
  compareAnchorId = null;
  compareTargetId = null;
  compareOriginMovementId = null;
  if (options.returnToOrigin && origin) {
    activeMovementId = origin.id;
    movementView = "detail";
  } else if (movementView === "compare") {
    activeMovementId = null;
    movementView = "collection";
  }
  renderMovementApp(options);
}

function handleMovementListingKey(event, movementId) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openMovementDetail(movementId);
}

let detailSwipeStart = null;
function startDetailSwipe(event) {
  if (event.target.closest(".local-anatomy-viewer")) return;
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  detailSwipeStart = { x: touch.clientX, y: touch.clientY };
}

function finishDetailSwipe(event) {
  if (!detailSwipeStart) return;
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  const dx = touch.clientX - detailSwipeStart.x;
  const dy = touch.clientY - detailSwipeStart.y;
  detailSwipeStart = null;
  if (Math.abs(dx) > 80 && Math.abs(dy) < 52) {
    openMovementBackToCollection();
  }
}

function applyInitialMovementRoute() {
  const params = new URLSearchParams(window.location.search);
  schedulePickerOpen = false;
  calendarDaySheetOpen = false;
  quickActivityOpen = false;
  const routeView = params.get("view");
  const collection = params.get("collection");
  const group = params.get("group");
  collectionSearchQuery = String(params.get("q") || "").slice(0, 80);
  const routeTags = selectedTagsFromParam(params.get("tags"));
  const routeSortMetric = params.get("sort");
  collectionSortMetric = normalizeSortMetric(routeSortMetric);
  collectionSortSubtype = normalizeSortSubtype(collectionSortMetric, params.get("rating"));
  collectionSortDirection = normalizeSortDirection(params.get("direction"), Boolean(routeSortMetric));
  collectionSortMenuOpen = false;
  collectionSortDirectionOpen = false;
  const routeCompareAnchor = movementById(params.get("compare"));
  const routeCompareTarget = movementById(params.get("compareWith"));
  const routeCompareOrigin = movementById(params.get("compareOrigin")) || routeCompareAnchor;
  const routeWorkout = workouts.find(workout => workout.id === params.get("workout"));
  const routeTemplate = workoutTemplates.find(template => template.id === params.get("template"));
  const routeWorkoutRecord = routeTemplate || routeWorkout;
  const routeBlockId = params.get("block");
  compareAnchorId = routeCompareAnchor?.id || null;
  compareTargetId = routeCompareTarget?.id || null;
  compareOriginMovementId = routeCompareOrigin?.id || null;
  activeWorkoutId = routeTemplate ? null : routeWorkout?.id || null;
  activeWorkoutTemplateId = routeTemplate?.id || null;
  activeBlockId = routeWorkoutRecord && workoutBlocks(routeWorkoutRecord).some(block => block.id === routeBlockId)
    ? routeBlockId
    : null;
  if (!routeTags.length && collection && collection !== "all") {
    const tagRecord = collectionTagFor(collection, group);
    routeTags.push(collectionTagKey(tagRecord.label, tagRecord.group));
  }
  const movementId = params.get("movement") || params.get("open");
  if (routeView === "live" && routeWorkout) {
    movementView = "live";
    selectedCalendarDate = routeWorkout.date;
    visibleCalendarMonth = monthStart(parseDateKey(routeWorkout.date));
    schedulePickerOpen = false;
    selectedCollectionTags = [];
    activeCollectionGroup = null;
    activeRegionMacro = null;
    activeMovementId = null;
    return;
  }
  if (routeView === "workout" && routeWorkoutRecord) {
    movementView = routeWorkoutRecord.status === "completed" ? "live" : "workout";
    if (routeWorkoutRecord.date) {
      selectedCalendarDate = routeWorkoutRecord.date;
      visibleCalendarMonth = monthStart(parseDateKey(routeWorkoutRecord.date));
    }
    schedulePickerOpen = false;
    selectedCollectionTags = [];
    activeCollectionGroup = null;
    activeRegionMacro = null;
    activeMovementId = null;
    return;
  }
  if (routeView === "compare" && compareAnchorId && compareTargetId) {
    movementView = "compare";
    selectedCollectionTags = routeTags;
    activeCollectionGroup = group || null;
    activeRegionMacro = inferActiveRegionMacro();
    activeMovementId = null;
    return;
  }
  if (movementId && movementById(movementId)) {
    movementView = "detail";
    selectedCollectionTags = routeTags;
    activeCollectionGroup = group || selectedCollectionTagObjects()[0]?.group || null;
    activeRegionMacro = inferActiveRegionMacro();
    activeMovementId = movementById(movementId).id;
    return;
  }
  if (routeView === "collection" || params.has("collection") || group || routeTags.length) {
    movementView = "collection";
    selectedCollectionTags = routeTags;
    activeCollectionGroup = group || selectedCollectionTagObjects()[0]?.group || null;
    activeRegionMacro = inferActiveRegionMacro();
    activeMovementId = null;
    return;
  }
  movementView = "home";
  activeWorkoutId = null;
  activeWorkoutTemplateId = null;
  activeCollectionGroup = null;
  activeRegionMacro = null;
  selectedCollectionTags = [];
  activeMovementId = null;
}

function updateMovementHistory({ replaceHistory = false } = {}) {
  const state = {
    movementView,
    activeCollectionGroup,
    activeRegionMacro,
    selectedCollectionTags,
    collectionSortMetric,
    collectionSortSubtype,
    collectionSortDirection,
    collectionSearchQuery,
    activeMovementId,
    compareAnchorId,
    compareTargetId,
    compareOriginMovementId,
    activeWorkoutId,
    activeWorkoutTemplateId,
    activeBlockId
  };
  const method = replaceHistory ? "replaceState" : "pushState";
  window.history[method](state, "", movementRouteUrl());
}

function movementRouteUrl() {
  const url = new URL(window.location.href);
  clearRouteParams(url);
  if (movementView === "home") {
    return url;
  } else if (movementView === "collection") {
    url.searchParams.set("view", "collection");
    setCollectionRouteParams(url);
  } else if (movementView === "detail") {
    url.searchParams.set("view", "detail");
    setCollectionRouteParams(url);
    url.searchParams.set("movement", activeMovementId);
  } else if (movementView === "workout") {
    url.searchParams.set("view", "workout");
    setActiveWorkoutRouteParams(url);
  } else if (movementView === "live") {
    url.searchParams.set("view", "live");
    setActiveWorkoutRouteParams(url, { includeTemplate: false, includeBlock: true });
  } else if (movementView === "compare") {
    url.searchParams.set("view", "compare");
    setCollectionRouteParams(url, { includeCompareTarget: true });
  }
  return url;
}

function clearRouteParams(url) {
  [
    "open",
    "collection",
    "view",
    "group",
    "movement",
    "tags",
    "compare",
    "compareWith",
    "compareOrigin",
    "sort",
    "rating",
    "direction",
    "q",
    "workout",
    "template",
    "block"
  ].forEach(param => url.searchParams.delete(param));
}

function setRouteParam(url, key, value) {
  if (value) url.searchParams.set(key, value);
}

function setCollectionRouteParams(url, { includeCompareTarget = false } = {}) {
  setSortParams(url);
  setRouteParam(url, "group", activeCollectionGroup);
  if (selectedCollectionTags.length) url.searchParams.set("tags", selectedCollectionTags.join(","));
  setRouteParam(url, "compare", compareAnchorId);
  if (includeCompareTarget) setRouteParam(url, "compareWith", compareTargetId);
  setRouteParam(url, "compareOrigin", compareOriginMovementId);
  setActiveWorkoutRouteParams(url, { includeBlock: true });
  setRouteParam(url, "q", collectionSearchQuery.trim());
}

function setActiveWorkoutRouteParams(url, { includeTemplate = true, includeBlock = false } = {}) {
  setRouteParam(url, "workout", activeWorkoutId);
  if (includeTemplate) setRouteParam(url, "template", activeWorkoutTemplateId);
  if (includeBlock) setRouteParam(url, "block", activeBlockId);
}

function setSortParams(url) {
  if (!isSortingActive()) return;
  url.searchParams.set("sort", collectionSortMetric);
  if (collectionSortMetric !== "composite") url.searchParams.set("rating", activeSortSubtype());
  url.searchParams.set("direction", collectionSortDirection);
}

window.addEventListener("popstate", event => {
  if (event.state?.movementView) {
    movementView = event.state.movementView;
    activeCollectionGroup = event.state.activeCollectionGroup || null;
    selectedCollectionTags = Array.isArray(event.state.selectedCollectionTags) ? event.state.selectedCollectionTags : [];
    activeRegionMacro = event.state.activeRegionMacro || inferActiveRegionMacro();
    collectionSortMetric = normalizeSortMetric(event.state.collectionSortMetric);
    collectionSortSubtype = normalizeSortSubtype(collectionSortMetric, event.state.collectionSortSubtype);
    collectionSortDirection = normalizeSortDirection(event.state.collectionSortDirection);
    collectionSearchQuery = String(event.state.collectionSearchQuery || "").slice(0, 80);
    collectionFiltersOpen = false;
    collectionSortOpen = false;
    collectionSortMenuOpen = false;
    collectionSortDirectionOpen = false;
    activeMovementId = event.state.activeMovementId || null;
    compareAnchorId = event.state.compareAnchorId || null;
    compareTargetId = event.state.compareTargetId || null;
    compareOriginMovementId = event.state.compareOriginMovementId || null;
    activeWorkoutId = event.state.activeWorkoutId || null;
    activeWorkoutTemplateId = event.state.activeWorkoutTemplateId || null;
    activeBlockId = event.state.activeBlockId || null;
  } else {
    applyInitialMovementRoute();
  }
  renderMovementApp({ skipHistory: true });
});

function movementCollections() {
  return TAG_GROUP_ORDER
    .map(group => ({
      kind: "group",
      label: group,
      group,
      kicker: "Category",
      title: tagGroupLabel(group),
      count: collectionCount(null, group)
    }))
    .filter(collection => collection.count > 0);
}

function collectionFilters() {
  if (!activeCollectionGroup) return [];
  return tagCollectionsForGroup(activeCollectionGroup);
}

function tagCollectionsForGroup(group) {
  const seen = new Set();
  return movementLibrary
    .flatMap(movement => movement.tags || [])
    .filter(tag => tag.group === group)
    .filter(tag => {
      if (seen.has(tag.label)) return false;
      seen.add(tag.label);
      return true;
    })
    .map(tag => ({
      kind: "tag",
      label: tag.label,
      group: tag.group,
      title: tag.label,
      count: collectionCount(tag.label, tag.group)
    }));
}

function regionSubFilters(macro) {
  return (REGION_HIERARCHY[macro] || [])
    .map(label => ({
      kind: "tag",
      label,
      group: "region",
      title: label,
      count: collectionCount(label, "region")
    }))
    .filter(collection => collection.count > 0);
}

function regionMacroCount(label) {
  const labels = regionMacroFilterLabels(label);
  return movementLibrary.filter(movement =>
    movementMatchesAnyTagLabels(movement, labels, "region")
  ).length;
}

function inferActiveRegionMacro() {
  const regionTag = selectedCollectionTagObjects().find(tag => tag.group === "region");
  if (regionTag) return regionMacroForLabel(regionTag.label);
  return null;
}

function regionMacroForLabel(label) {
  if (REGION_MACRO_ORDER.includes(label)) return label;
  return Object.entries(REGION_HIERARCHY).find(([, labels]) => labels.includes(label))?.[0] || "Misc";
}

function labelIsRegionSubgroup(label) {
  return Object.values(REGION_HIERARCHY).some(labels => labels.includes(label));
}

function regionMacroFilterLabels(label) {
  const childLabels = regionSubFilters(label).map(filter => filter.label);
  return childLabels.length ? childLabels : [label];
}

function regionMacroSelectionLabels(label) {
  const labels = regionMacroFilterLabels(label);
  return labels
    .filter((item, index) => labels.indexOf(item) === index)
    .filter(item => collectionCount(item, "region") > 0);
}

function isRegionMacroSelected(label) {
  const childLabels = regionSubFilters(label).map(filter => filter.label);
  if (isCollectionTagSelected(label, "region")) return true;
  return Boolean(childLabels.length && childLabels.every(item => isCollectionTagSelected(item, "region")));
}

function isRegionMacroPartial(label) {
  const selected = regionMacroSelectionLabels(label)
    .filter(item => isCollectionTagSelected(item, "region"));
  return Boolean(selected.length && !isRegionMacroSelected(label));
}

function uniqueCollectionTagKeys(keys) {
  return [...new Set(keys.map(String))];
}

function collectionMovements(label = null, group = null) {
  const selectedTags = selectedCollectionTagObjects();
  if (!selectedTags.length && !label) return sortedMovements(searchMovements(movementLibrary));
  if (!label) {
    return sortedMovements(searchMovements(movementLibrary.filter(movement => movementMatchesSelectedTags(movement, selectedTags))));
  }
  if (group === "region" && REGION_MACRO_ORDER.includes(label)) {
    const labels = regionMacroFilterLabels(label);
    return sortedMovements(searchMovements(movementLibrary.filter(movement =>
      movementMatchesAnyTagLabels(movement, labels, group)
    )));
  }
  return sortedMovements(searchMovements(movementLibrary.filter(movement =>
    movement.tags?.some(tag => tag.label === label && (!group || tag.group === group))
  )));
}

function searchMovements(movements) {
  const terms = normalizeSearchText(collectionSearchQuery).split(" ").filter(Boolean);
  if (!terms.length) return movements;
  return movements.filter(movement => {
    const haystack = movementSearchText(movement);
    return terms.every(term => haystack.includes(term));
  });
}

function movementSearchText(movement) {
  return normalizeSearchText(movement.name);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortedMovements(movements) {
  if (!isSortingActive()) return [...movements];
  const direction = collectionSortDirection === "asc" ? 1 : -1;
  return [...movements].sort((a, b) => {
    const scoreDelta = movementSortScore(a) - movementSortScore(b);
    if (scoreDelta) return scoreDelta * direction;
    return a.name.localeCompare(b.name);
  });
}

function movementSortScore(movement) {
  if (collectionSortMetric === "training" || collectionSortMetric === "metadata") {
    return ratingScore(movement, activeSortSubtype());
  }
  return compositeMovementScore(movement) || 0;
}

function activeSortSubtype() {
  return defaultSortSubtype(collectionSortMetric, collectionSortSubtype);
}

function isSortingActive() {
  return collectionSortDirection !== "none";
}

function sortSubtypeRatings(metric = collectionSortMetric) {
  if (metric === "training") return TRAINING_RATINGS;
  if (metric === "metadata") return METADATA_RATINGS;
  return null;
}

function defaultSortSubtype(metric, subtype) {
  return normalizeSortSubtype(metric, subtype);
}

function normalizeSortMetric(metric) {
  return Object.prototype.hasOwnProperty.call(SORT_LABELS, metric) ? metric : "composite";
}

function normalizeSortSubtype(metric, subtype) {
  const ratings = sortSubtypeRatings(metric);
  if (!ratings) return null;
  return Object.prototype.hasOwnProperty.call(ratings, subtype)
    ? subtype
    : Object.keys(ratings)[0];
}

function normalizeSortDirection(direction, hasSortMetric = false) {
  if (Object.prototype.hasOwnProperty.call(SORT_DIRECTIONS, direction)) return direction;
  return hasSortMetric ? "desc" : "none";
}

function collectionCount(label, group) {
  if (!label && group) {
    return movementLibrary.filter(movement =>
      movement.tags?.some(tag => tag.group === group)
    ).length;
  }
  return collectionMovements(label, group).length;
}

function collectionLabel(label) {
  return label === "all" ? "All" : label;
}

function collectionTitle(collection) {
  return collection?.title || collectionLabel(collection?.label);
}

function collectionSummaryLabel() {
  const selectedTags = selectedCollectionTagObjects();
  if (selectedTags.length) return selectedTags.map(tag => tag.label).join(" + ");
  return activeCollectionGroup ? tagGroupLabel(activeCollectionGroup) : "Movements";
}

function selectedCollectionTagObjects() {
  return selectedCollectionTags
    .map(collectionTagFromKey)
    .filter(Boolean);
}

function selectedTagsFromParam(value) {
  if (!value) return [];
  return value
    .split(",")
    .map(key => collectionTagFromKey(key))
    .filter(Boolean)
    .map(tag => collectionTagKey(tag.label, tag.group));
}

function collectionTagKey(label, group) {
  return `${group}:${label}`;
}

function collectionTagFromKey(key) {
  const [group, ...labelParts] = String(key || "").split(":");
  const label = labelParts.join(":");
  if (!group || !label) return null;
  return collectionTagFor(label, group);
}

function isCollectionTagSelected(label, group) {
  return selectedCollectionTags.includes(collectionTagKey(label, group));
}

function selectedCountForGroup(group) {
  return selectedCollectionTagObjects().filter(tag => tag.group === group).length;
}

function movementMatchesSelectedTags(movement, selectedTags = selectedCollectionTagObjects()) {
  const selectedByGroup = effectiveSelectedTags(selectedTags).reduce((groups, tag) => {
    if (!groups[tag.group]) groups[tag.group] = new Set();
    groups[tag.group].add(tag.label);
    return groups;
  }, {});

  return Object.entries(selectedByGroup).every(([group, labels]) =>
    movement.tags?.some(tag => tag.group === group && labels.has(tag.label))
  );
}

function effectiveSelectedTags(selectedTags) {
  const expanded = selectedTags.flatMap(tag => {
    if (tag.group === "region" && REGION_MACRO_ORDER.includes(tag.label)) {
      return regionMacroFilterLabels(tag.label).map(label => collectionTagFor(label, "region"));
    }
    return [tag];
  });
  const seen = new Set();
  return expanded.filter(tag => {
    const key = collectionTagKey(tag.label, tag.group);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function movementMatchesAnyTagLabels(movement, labels, group) {
  const accepted = new Set(labels);
  return movement.tags?.some(tag =>
    (!group || tag.group === group) && accepted.has(tag.label)
  );
}

function collectionTagFor(label, group) {
  if (!label || label === "all") return { label: label || group || "all", group: group || "library" };
  const tags = movementLibrary.flatMap(movement => movement.tags || []);
  return tags.find(tag => tag.label === label && (!group || tag.group === group)) ||
    tags.find(tag => tag.label === label) ||
    { label, group: group || "region" };
}

function movementById(movementId) {
  return movementLibrary.find(item =>
    item.id === movementId || item.aliases?.includes(movementId)
  );
}

function renderMovementTotal(movement) {
  const score = compositeMovementScore(movement);
  const trainingScore = visibleGroupRating(movement, "training");
  const metadataScore = visibleGroupRating(movement, "metadata");
  if (!Number.isFinite(score)) return "";
  return `
    <div class="movement-score-stack">
      <div class="movement-total composite" style="${ratingStyle("composite", scorePercent(score, compositeRatingKeys().length * 100), "composite")}" title="Raw sum of training dimensions">
        <span>Composite</span>
        <div class="movement-total-value"><strong>${score}</strong></div>
      </div>
      ${trainingScore ? `
        <div class="movement-total compact training" style="${ratingStyle(trainingScore.key, trainingScore.score, "training")}" title="${escapeHTML(trainingScore.title)}">
          <span>Training</span>
          <div class="movement-total-value">
            <strong>${trainingScore.score}</strong>
            <em>${escapeHTML(trainingScore.label)}</em>
          </div>
        </div>
      ` : ""}
      ${metadataScore ? `
        <div class="movement-total compact metadata" style="${ratingStyle(metadataScore.key, metadataScore.score, "metadata")}" title="${escapeHTML(metadataScore.title)}">
          <span>Setup</span>
          <div class="movement-total-value">
            <strong>${metadataScore.score}</strong>
            <em>${escapeHTML(metadataScore.label)}</em>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function openEvidence(movementId) {
  const movement = movementLibrary.find(item =>
    item.id === movementId || item.aliases?.includes(movementId)
  );
  if (!movement) return;
  const studies = movement.evidence?.studies || [];

  evidenceModal.innerHTML = `
    <section
      class="evidence-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="${escapeHTML(movement.name)} evidence"
    >
      <div class="evidence-dialog-header">
        <div>
          <h3>${escapeHTML(movement.name)}</h3>
          <p>${escapeHTML(movement.variant || "Movement evidence record.")}</p>
          <span class="tag tag-pattern">${studies.length} sources</span>
        </div>
        <button type="button" class="modal-close" data-action="closeEvidence" aria-label="Close evidence">X</button>
      </div>
      ${renderEvidenceContent(movement)}
    </section>
  `;
  evidenceModal.hidden = false;
  syncModalScrollLock();
  evidenceModal.querySelector(".modal-close")?.focus();
}

function openInitialEvidenceFromUrl() {
  if (initialEvidenceOpened) return;
  const movementId = new URLSearchParams(window.location.search).get("evidence");
  if (!movementId) return;
  initialEvidenceOpened = true;
  openEvidence(movementId);
}

function closeEvidence() {
  evidenceModal.hidden = true;
  evidenceModal.innerHTML = "";
  syncModalScrollLock();
}

evidenceModal.addEventListener("click", event => {
  if (event.target === evidenceModal) closeEvidence();
});

movementQuickViewModal.addEventListener("click", event => {
  if (event.target === movementQuickViewModal) closeMovementQuickView();
});

confirmModal.addEventListener("click", event => {
  if (event.target === confirmModal) closeConfirmDialog();
});

window.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!confirmModal.hidden) {
    closeConfirmDialog();
    return;
  }
  if (!evidenceModal.hidden) {
    closeEvidence();
    return;
  }
  if (!movementQuickViewModal.hidden) closeMovementQuickView();
  else if (schedulePickerOpen) closeSchedulePicker();
  else if (calendarDaySheetOpen) closeCalendarDaySheet();
});

function renderEvidenceContent(movement) {
  const studies = movement.evidence?.studies || [];
  return `
    <div class="evidence-content">
      <div class="evidence-readout">
        <div class="evidence-note">
          <h4>Muscle Classification</h4>
          <p>${escapeHTML(movement.evidence?.verdict || movement.evidence?.summary || "")}</p>
        </div>
        <div class="evidence-section">
          <h4>What EMG Can Tell Us</h4>
          <p>${escapeHTML(movement.evidence?.clinicalShort || movement.evidence?.clinicalInterpretation || "")}</p>
        </div>
        <div class="evidence-section">
          <h4>When Classification Shifts</h4>
          <p>${escapeHTML(movement.evidence?.limitsShort || movement.evidence?.limitations || "")}</p>
        </div>
      </div>
      <div class="evidence-section">
        <h4>Muscle Roles</h4>
        <div class="role-evidence-grid">
          ${ROLE_GROUPS.map(group => renderRoleEvidence(movement, group, studies)).join("")}
        </div>
      </div>
      <div class="evidence-section">
        <h4>Sources</h4>
        <div class="study-grid">
          ${studies.map(renderStudyCard).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderMuscleGroup(movement, group) {
  const muscles = movementMuscles(movement, group.key);
  return `
    <div class="muscle-box">
      <strong class="role-label ${group.className}">${escapeHTML(group.label)}</strong>
      <div class="muscle-role">${muscles.map(muscle => renderMuscleChip(movement, muscle)).join("")}</div>
    </div>
  `;
}

function renderRoleEvidence(movement, group, studies) {
  const muscles = movementMuscles(movement, group.key);
  if (!muscles.length) return "";

  return muscles.map(muscle => `
    <article class="role-evidence-card">
      <span class="role-label ${group.className}">${escapeHTML(group.label)}</span>
      <strong>${escapeHTML(muscle.name)}</strong>
      <p>${escapeHTML(muscle.evidenceShort || muscle.evidence || "Evidence pending.")} ${sourceMarkers(muscle.sourceIds, studies).join(" ")}</p>
    </article>
  `).join("");
}

function renderStudyCard(study, index) {
  const doiUrl = study.doi ? `https://doi.org/${encodeURIComponent(study.doi)}` : study.url;
  return `
    <article class="study-card">
      <header>
        <h5>${escapeHTML(study.shortCitation || study.type || "Study")}</h5>
        <span class="study-index">${String(index + 1).padStart(2, "0")}</span>
      </header>
      <p>${escapeHTML(study.finding || study.relevance || "")}</p>
      <div class="evidence-meta">
        ${(study.usedFor || []).map(item => `<span class="evidence-chip">${escapeHTML(compactUseLabel(item))}</span>`).join("")}
      </div>
      <a href="${escapeHTML(doiUrl || study.url)}" target="_blank" rel="noreferrer" title="${escapeHTML(study.citation || "")}">${escapeHTML(study.doi ? `doi:${study.doi}` : "Open source")}</a>
    </article>
  `;
}

function sourceMarkers(sourceIds = [], studies = []) {
  return sourceIds
    .map(id => studies.findIndex(study => study.id === id))
    .filter(index => index >= 0)
    .map(index => `[${String(index + 1).padStart(2, "0")}]`);
}

function compactUseLabel(label) {
  return String(label)
    .replace(" muscle role", "")
    .replace("rating anchors", "ratings")
    .replace("hypertrophy score", "hypertrophy")
    .replace("fatigue efficiency score", "fatigue efficiency")
    .replace("support score", "support");
}

function muscleRolesForMovement(movement) {
  const roles = {};
  ROLE_GROUPS.forEach(group => {
    movementMuscles(movement, group.key).forEach(muscle => {
      roles[muscleIdForName(muscle.name)] = group.viewerRole;
    });
  });
  return roles;
}

function movementMuscles(movement, group) {
  return (movement.muscles?.[group] || []).map(muscle =>
    typeof muscle === "string" ? { name: muscle } : muscle
  );
}

function movementMuscleNames(movement) {
  return ROLE_GROUPS.flatMap(group =>
    movementMuscles(movement, group.key).map(muscle => muscle.name)
  );
}

function normalizeMuscleName(name) {
  return String(name || "").trim().toLowerCase();
}

function compareSharedMuscleNames(anchor = movementById(compareAnchorId), target = movementById(compareTargetId)) {
  if (!anchor || !target) return new Set();
  const targetNames = new Set(movementMuscleNames(target).map(normalizeMuscleName));
  return new Set(
    movementMuscleNames(anchor)
      .map(normalizeMuscleName)
      .filter(name => targetNames.has(name))
  );
}

function muscleIdForName(name) {
  const normalizedName = name.toLowerCase();
  const exact = anatomyMuscles.find(muscle =>
    muscle.name.toLowerCase() === normalizedName ||
    muscle.aliases?.some(alias => alias.toLowerCase() === normalizedName)
  );
  if (exact) return exact.id;
  const partial = anatomyMuscles.find(muscle =>
    muscle.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(muscle.name.toLowerCase().split(" / ")[0]) ||
    muscle.displayName?.toLowerCase().includes(normalizedName) ||
    muscle.aliases?.some(alias => alias.toLowerCase().includes(normalizedName) || normalizedName.includes(alias.toLowerCase()))
  );
  return partial?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function tagGroupLabel(group) {
  return TAG_GROUP_LABELS[group] || titleCase(group);
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function renderTagPill(tag) {
  return `<span class="${tagClass(tag)}">${escapeHTML(tag.label)}</span>`;
}

function tagClass(tag) {
  return `tag tag-${escapeHTML(tag.group)}`;
}

function renderMuscleChip(movement, muscle) {
  const muscleId = muscleIdForName(muscle.name);
  const active = selectedMuscles[movement.id] === muscleId ? " active" : "";
  return `
    <button
      type="button"
      class="muscle-chip${active}"
      data-muscle-card
      data-movement-id="${escapeHTML(movement.id)}"
      data-muscle-id="${escapeHTML(muscleId)}"
      data-action="selectMovementMuscle"
    >${renderWrappedText(muscle.name)}</button>
  `;
}

function renderWrappedText(value) {
  return String(value ?? "")
    .split(/(\s+)/)
    .map(part => {
      if (/^\s+$/.test(part)) return part;
      return WRAP_HINTS[part.toLowerCase()] || escapeHTML(part);
    })
    .join("");
}

function selectMovementMuscle(movementId, muscleId) {
  if (selectedMuscles[movementId] === muscleId) {
    delete selectedMuscles[movementId];
    muscleId = null;
  } else {
    selectedMuscles[movementId] = muscleId;
  }
  updateSelectedMuscleUI(movementId);
  window.setAnatomySelection?.(movementId, muscleId);
}

function updateSelectedMuscleUI(movementId) {
  document.querySelectorAll("[data-muscle-card]").forEach(button => {
    if (button.dataset.movementId !== movementId) return;
    button.classList.toggle("active", button.dataset.muscleId === selectedMuscles[movementId]);
  });
}

function renderRating(label, value, description, ratingKey = "composite") {
  const rating = typeof value === "object" && value !== null ? value : { score: value, rationale: description };
  const score = Math.max(0, Math.min(100, Number(rating.score) || 0));
  const filledDots = Math.round(score / 10);
  const dots = Array.from({ length: 10 }, (_, index) =>
    `<span class="${index < filledDots ? "filled" : ""}"></span>`
  ).join("");
  return `
    <div class="rating-box" style="${ratingStyle(ratingKey, score)}" title="${escapeHTML(rating.rationale || "")}">
      <div class="score-head">
        <strong>${escapeHTML(label)}</strong>
        <span class="score-value">${score}</span>
      </div>
      <div class="score-dots" role="img" aria-label="${escapeHTML(label)} ${score} out of 100. ${escapeHTML(rating.rationale || "")}">
        ${dots}
      </div>
    </div>
  `;
}

function renderRatingGroup(title, ratings, movement, group = "") {
  return `
    <section class="rating-section ${escapeHTML(group)}">
      <p class="section-label">${escapeHTML(title)}</p>
      <div class="rating-grid">
        ${Object.entries(ratings).map(([key, label]) => renderRating(label, movement.ratings?.[key], undefined, key)).join("")}
      </div>
    </section>
  `;
}

function compositeMovementScore(movement) {
  const scores = compositeRatingKeys()
    .map(key => movement.ratings?.[key] === undefined ? NaN : ratingScore(movement, key))
    .filter(Number.isFinite);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) : NaN;
}

function bestRating(movement, ratings) {
  return Object.entries(ratings)
    .map(([key, label]) => ({ key, label, score: ratingScore(movement, key) }))
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)[0] || null;
}

function visibleGroupRating(movement, group) {
  const ratings = group === "training" ? TRAINING_RATINGS : METADATA_RATINGS;
  if (isSortingActive() && collectionSortMetric === group) {
    const key = activeSortSubtype();
    return {
      key,
      label: ratings[key],
      score: ratingScore(movement, key),
      title: `Sorted by ${ratings[key]}`
    };
  }
  const best = bestRating(movement, ratings);
  return best ? { ...best, title: `Highest ${group === "training" ? "training" : "setup"} dimension` } : null;
}

function compositeRatingKeys() {
  return Object.keys(TRAINING_RATINGS);
}

function scorePercent(score, maxScore = 100) {
  return Math.max(0, Math.min(100, (Number(score) / Math.max(1, Number(maxScore))) * 100));
}

function ratingStyle(ratingKey, score = 100, group = ratingKey) {
  const color = ratingColor(ratingKey);
  const groupColor = ratingColor(group);
  return `--score-color: ${color}; --group-color: ${groupColor};`;
}

function ratingColor(ratingKey) {
  return RATING_COLORS[ratingKey] || RATING_COLORS.composite;
}

function ratingScore(movement, key) {
  return Math.max(0, Math.min(100, Number(movement.ratings?.[key]?.score ?? movement.ratings?.[key]) || 0));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(registration => registration.update());
  });
}
