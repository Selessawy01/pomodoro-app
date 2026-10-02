// ========================================
// DOM Elements
// ========================================

const pomodoroSection = document.querySelector(".timer");
const pomodoroHeader  = document.querySelector(".header");

const pomodoroBtn     = document.querySelector(".pomodoro-btn");
const shortBreakBtn   = document.querySelector(".short-break-btn");
const longBreakBtn    = document.querySelector(".long-break-btn");

const settingsSection  = document.querySelector(".settings");
const settingsCloseBtn = document.querySelector(".settings__close-btn");
const settingsForm  = document.querySelector(".settings__form");
const inputWrappers = document.querySelectorAll(".settings__input");

const pomodoroInput   = document.querySelector("#pomodoro");
const shortBreakInput = document.querySelector("#short-break");
const longBreakInput  = document.querySelector("#long-break");

const timer       = document.querySelector(".timer__action");
const startBtn    = document.querySelector(".timer__status");
const progressBar = document.querySelector(".timer__progress-bar");
const settingsBtn = document.querySelector(".timer__settings-btn");

const tablist    = document.querySelector(".header__tabs");
const tabs       = [pomodoroBtn, shortBreakBtn, longBreakBtn];
const announcer  = document.getElementById("timer-announcer");

// ========================================
// Constants
// ========================================
const circumference = 2 * Math.PI * 130;


const presetElements = [
    { el: timer,    base: "preset1-txt" },
    { el: startBtn, base: "preset2-txt" },
    { el: tablist,  base: "preset3-txt" }
];

// ========================================
// State
// ========================================

let intervalId;
let endTime;  /********** */
let running = false;
let mode = "pomodoro";
let pomodoroCount = 0;
let lastFocusedElement = null;

let durations = {
    pomodoro   : Number(pomodoroInput.value),
    shortBreak : Number(shortBreakInput.value),
    longBreak  : Number(longBreakInput.value)
};

let timeLeft = durations.pomodoro * 60;
let totalTime = timeLeft;

// ========================================
// Timer Setup
// ========================================
progressBar.style.strokeDasharray = circumference;

// ========================================
// Helpers
// ========================================
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function announce(message) {
    announcer.textContent = message;
}

function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
    );
}

function getValidDuration(input) {
    const value = Number(input.value);

    if (!Number.isFinite(value)) {
        return Number(input.min);
    }

    return Math.min(
        Math.max(value, Number(input.min)),
        Number(input.max)
    );
}

// ========================================
// Font & Appearance
// ========================================

function applyFontPreset(fontKey) {
    presetElements.forEach(({ el, base }) => {
        el.classList.remove(`${base}-kumbh`, `${base}-roboto`, `${base}-spacemono`);
        el.classList.add(`${base}-${fontKey}`);
    });
}

// ========================================
// Tab Navigation
// ========================================

function updateActiveTab() {
    const activeMap = {
        pomodoro: pomodoroBtn,
        shortBreak: shortBreakBtn,
        longBreak: longBreakBtn
    };
    
    const activeTab = activeMap[mode];

    tabs.forEach(tab => {
        const isActive = tab === activeMap[mode];
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.setAttribute("tabindex", isActive ? "0" : "-1");

    });

     timer.setAttribute("aria-labelledby", activeTab.id);
}

// ========================================
// Progress Ring
// ========================================
function updateProgress() {
    const progress = timeLeft / totalTime;
    const offset = circumference * (1 - progress);
    progressBar.style.strokeDashoffset = offset;
}


// ========================================
// Timer logic
// ========================================

function changeMode(newMode, duration) {
    clearInterval(intervalId);

    mode      = newMode;
    timeLeft  = duration;
    totalTime = duration;
    running   = false;

    timer.textContent = formatTime(timeLeft);
    startBtn.textContent = "start";

    updateActiveTab();
    updateProgress();
}

function startTimer() {

    endTime = Date.now() + timeLeft * 1000;  /********** */
    intervalId = setInterval(countdown, 1000);

    running = true;
    startBtn.textContent = "pause";
}

function pauseTimer() {

     timeLeft = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
    );
    clearInterval(intervalId);

    running = false;
    startBtn.textContent = "resume";
}

function switchToNextMode() {
    if (mode === "pomodoro") {
        pomodoroCount++;

        if (pomodoroCount === 4) {
            mode = "longBreak";
            pomodoroCount = 0;

            announce("Pomodoro complete. Starting long break.");
        } else {
            mode = "shortBreak";

            announce("Pomodoro complete. Starting short break.");
        }
    } else {
        mode = "pomodoro";

        announce("Break complete. Starting pomodoro.");
    }

    timeLeft = durations[mode] * 60;
    totalTime = timeLeft;

    updateActiveTab();

    timer.textContent = formatTime(timeLeft);
    updateProgress();
}

function countdown() {
    //timeLeft--;
    timeLeft = Math.max(
    0,
    Math.ceil((endTime - Date.now()) / 1000)
);
    timer.textContent = formatTime(timeLeft);
    updateProgress();

    if (timeLeft > 0) return;

    clearInterval(intervalId);
    running=false;
    startBtn.textContent = "start";

    setTimeout(() => {
        switchToNextMode();
        startTimer();
        }, 1000);
}


// ========================================
// Settings dialog: open/close, focus trap, Escape
// ========================================

function openSettings() {
    lastFocusedElement = document.activeElement;

    pomodoroHeader.classList.add("hidden");
    pomodoroSection.classList.add("hidden");
    settingsSection.classList.remove("hidden");

    const heading = settingsSection.querySelector(".setting__heading");
   /* if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
    }*/
   if (event.shiftKey && document.activeElement === heading) {
    event.preventDefault();
    focusable[focusable.length - 1].focus();
    return;
   }
}

function closeSettings() {
    pomodoroHeader.classList.remove("hidden");
    pomodoroSection.classList.remove("hidden");
    settingsSection.classList.add("hidden");

    if (lastFocusedElement) lastFocusedElement.focus();
}

function handleSettingsKeydown(event) {
    if (event.key === "Escape") {
        closeSettings();
        return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(settingsSection);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    }

    if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}
// ========================================
// Settings
// ========================================
function applySettings(){
    const pomodoroTime   =  getValidDuration(pomodoroInput);
    const shortBreakTime =  getValidDuration(shortBreakInput);
    const longBreakTime  =  getValidDuration(longBreakInput);

    const selectedFont  = document.querySelector('input[name="font"]:checked').value;
    const selectedColor = document.querySelector('input[name="color"]:checked').value;

    const durationChanged =
        durations.pomodoro !== pomodoroTime ||
        durations.shortBreak !== shortBreakTime ||
        durations.longBreak !== longBreakTime;

    durations.pomodoro   = pomodoroTime;
    durations.shortBreak = shortBreakTime;
    durations.longBreak  = longBreakTime;

    if (!running  && durationChanged ) {
    timeLeft = durations[mode] * 60;
    totalTime = timeLeft;

    timer.textContent = formatTime(timeLeft);
    updateProgress();
    }

    document.body.classList.remove("font-kumbh", "font-roboto", "font-spacemono");
    document.body.classList.add(`font-${selectedFont}`);
    applyFontPreset(selectedFont);

    document.body.classList.remove("color-red", "color-cyan", "color-purple");
    document.body.classList.add(`color-${selectedColor}`);
}

// ========================================
// Event listeners
// ========================================

startBtn.addEventListener("click", () => {
    if (!running) {
       startTimer();
    } else {
         pauseTimer();
        
    }
});

pomodoroBtn.addEventListener("click", () => {
    changeMode("pomodoro", durations.pomodoro * 60);
});

shortBreakBtn.addEventListener("click", () => {
    changeMode("shortBreak", durations.shortBreak * 60);
});

longBreakBtn.addEventListener("click", () => {
    changeMode("longBreak", durations.longBreak * 60);
});

tablist.addEventListener("keydown", (event) => {
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = null;

    switch (event.key) {
        case "ArrowRight":
            newIndex = (currentIndex + 1) % tabs.length;
            break;
        case "ArrowLeft":
            newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            break;
        case "Home":
            newIndex = 0;
            break;
        case "End":
            newIndex = tabs.length - 1;
            break;
        default:
            return;
    }

    event.preventDefault();
    tabs[newIndex].focus();
    tabs[newIndex].click();
});

settingsBtn.addEventListener("click", openSettings);
settingsCloseBtn.addEventListener("click", closeSettings);
settingsSection.addEventListener("keydown", handleSettingsKeydown);


inputWrappers.forEach(wrapper => {
    const input  = wrapper.querySelector("input");
    const upBtn  = wrapper.querySelector(".settings__arrow-up");
    const downBtn = wrapper.querySelector(".settings__arrow-down");

    upBtn.addEventListener("click", () => input.stepUp());
    downBtn.addEventListener("click", () => input.stepDown());
});

settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applySettings();
    closeSettings();

    
});

// ========================================
// Init
// ========================================

updateActiveTab();
timer.textContent = formatTime(timeLeft);
updateProgress();