
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ========================================
// FIREBASE CONFIGURATION
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyA_CXSZVz6meJgcJyktktWNmPtLmeFNXn0",
  authDomain: "marcus-collins-github-website.firebaseapp.com",
  projectId: "marcus-collins-github-website",
  storageBucket: "marcus-collins-github-website.firebasestorage.app",
  messagingSenderId: "328004594228",
  appId: "1:328004594228:web:47074e07c446a328bbf861",
  measurementId: "G-6M9HBX4E3Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const modulesRef = collection(db, "modules");
const tutorialsRef = collection(db, "tutorials");

// ========================================
// LOCAL USER
// ========================================

const $ = (id) => document.getElementById(id);

function getUserId(name) {
  return "name_" + name.trim().toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

let userName = localStorage.getItem("tutorialUserName") || "";
let userId = userName ? getUserId(userName) : "";


// ========================================
// APPLICATION STATE
// ========================================

let modules = [];
let tutorials = [];
let selectedCourse = "all";
let selectedModuleId = null;

const expandedModules = new Set();

const moduleList = $("moduleList");
const nameDialog = $("nameDialog");
const moduleDialog = $("moduleDialog");
const tutorialDialog = $("tutorialDialog");

// ========================================
// NAME MANAGEMENT
// ========================================

function updateUserDisplay() {
  $("userName").textContent = userName
    ? `Hello, ${userName}`
    : "";
}

function openNameDialog() {
  $("nameInput").value = userName;

  if (!nameDialog.open) {
    nameDialog.showModal();
  }
}

updateUserDisplay();

if (!userName) {
  openNameDialog();
}

$("changeNameBtn").addEventListener("click", openNameDialog);

$("nameForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("nameInput").value.trim();

  if (!name || !getUserId(name).slice(5)) {
    alert("Please enter a valid name.");
    return;
  }

  userName = name;
  userId = getUserId(name);

  localStorage.setItem("tutorialUserName", userName);
  localStorage.setItem("tutorialUserId", userId);

  updateUserDisplay();
  nameDialog.close();
  renderModules();
});


nameDialog.addEventListener("cancel", (event) => {
  if (!userName) {
    event.preventDefault();
  }
});

// ========================================
// FIRESTORE LIVE UPDATES
// ========================================

onSnapshot(
  modulesRef,
  (snapshot) => {
    modules = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    modules.sort((a, b) => a.id.localeCompare(b.id));

    renderModules();
    showStatus("");
  },
  (error) => {
    showStatus("Could not load modules: " + error.message);
  }
);

onSnapshot(
  tutorialsRef,
  (snapshot) => {
    tutorials = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    tutorials.sort((a, b) => {
      const first = `${a.date}T${a.startTime}`;
      const second = `${b.date}T${b.startTime}`;
      return first.localeCompare(second);
    });

    renderModules();
  },
  (error) => {
    showStatus("Could not load tutorials: " + error.message);
  }
);

// ========================================
// COURSE FILTERS
// ========================================

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCourse = button.dataset.course;

    document.querySelectorAll(".filter").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
    renderModules();
  });
});

// ========================================
// RENDER MODULES
// ========================================

function renderModules() {
  moduleList.replaceChildren();

  const filtered = modules.filter((module) =>
    selectedCourse === "all" ||
    module.course === selectedCourse
  );

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No modules yet. Create one to get started.";
    moduleList.appendChild(empty);
    return;
  }

  filtered.forEach((module) => {
    moduleList.appendChild(createModuleCard(module));
  });
}

function createModuleCard(module) {
  const card = document.createElement("article");
  card.className = "module-card";

  const moduleTutorials = tutorials.filter(
    (tutorial) => tutorial.moduleId === module.id
  );

  const now = new Date();

  const upcomingTutorials = moduleTutorials.filter((tutorial) => {
    const end = new Date(
      `${tutorial.date}T${tutorial.endTime}:00`
    );

    return end > now;
  });

  const joinedTutorials = upcomingTutorials.filter((tutorial) => {
    const attendees = tutorial.attendees || {};
    return Object.hasOwn(attendees, userId);
  });

  const hasJoined = joinedTutorials.length > 0;

  if (hasJoined) {
    card.classList.add("module-joined");
  }


  const header = document.createElement("div");
  header.className = "module-header";
  header.setAttribute("role", "button");
  header.setAttribute("tabindex", "0");

  const titleArea = document.createElement("div");
  titleArea.className = "module-title";

  const badge = document.createElement("span");
  badge.className = "module-badge";
  badge.textContent = module.id;

  const description = document.createElement("span");
  description.className = "module-description";
  description.textContent = module.description || "";

  titleArea.append(badge, description);

  const meta = document.createElement("span");
  meta.className = "module-meta";

  const count = upcomingTutorials.length;  
  meta.textContent = hasJoined
    ? `${joinedTutorials.length} joined · ${count} upcoming`
    : `${count} upcoming ${count === 1 ? "tutorial" : "tutorials"}`;


  
  if (hasJoined) {
    const joinedBadge = document.createElement("span");
    joinedBadge.className = "joined-badge";
    joinedBadge.textContent = "✓ Signed up";
    titleArea.appendChild(joinedBadge);
  }

header.append(titleArea, meta);


  const content = document.createElement("div");
  content.className = "module-content";

  const isExpanded = expandedModules.has(module.id);
  content.classList.toggle("hidden", !isExpanded);
  header.setAttribute("aria-expanded", String(isExpanded));

  const toggleModule = () => {
    if (expandedModules.has(module.id)) {
      expandedModules.delete(module.id);
    } else {
      expandedModules.add(module.id);
    }

    renderModules();
  };

  header.addEventListener("click", toggleModule);

  header.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleModule();
    }
  });

  const actions = document.createElement("div");
  actions.className = "module-actions";

  const addBtn = document.createElement("button");
  addBtn.className = "btn primary";
  addBtn.textContent = "+ Add tutorial";

  addBtn.addEventListener("click", () => {
    openTutorialDialog(module);
  });

  actions.appendChild(addBtn);
  content.appendChild(actions);

  const tutorialList = document.createElement("div");
  tutorialList.className = "tutorial-list";

  if (upcomingTutorials.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-module";
    empty.textContent = "No upcoming tutorials for this module.";
    tutorialList.appendChild(empty);
  } else {
    upcomingTutorials.forEach((tutorial) => {
      tutorialList.appendChild(createTutorialCard(tutorial));
    });
  }

  content.appendChild(tutorialList);
  card.append(header, content);

  return card;
}

// ========================================
// RENDER INDIVIDUAL TUTORIALS
// ========================================

function createTutorialCard(tutorial) {
  const card = document.createElement("article");
  card.className = "tutorial-card";

  const attendees = tutorial.attendees || {};
  const attendeeIds = Object.keys(attendees);

  const isJoined = Object.hasOwn(attendees, userId);

  const details = document.createElement("div");
  details.className = "tutorial-details";

  const dateText = new Date(
    `${tutorial.date}T12:00:00`
  ).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  addDetail(details, "Date", dateText);
  addDetail(
    details,
    "Time",
    `${tutorial.startTime} – ${tutorial.endTime}`
  );
  addDetail(details, "Location", tutorial.location);

  const attendeeSection = document.createElement("div");
  attendeeSection.className = "attendees";

  const count = attendeeIds.length;

  const countText = document.createElement("strong");
  countText.textContent =
    `${count} ${count === 1 ? "student" : "students"} attending`;

  const namesText = document.createElement("p");
  namesText.textContent = count
    ? Object.values(attendees).join(", ")
    : "Nobody signed up yet.";

  attendeeSection.append(countText, namesText);

  const button = document.createElement("button");
  button.className = "btn";

  if (isJoined) {
    button.textContent = "Leave tutorial";
    button.classList.add("secondary");
  } else {
    button.textContent = "Join tutorial";
    button.classList.add("primary");
  }

  button.addEventListener("click", async () => {
    if (!userName) {
      openNameDialog();
      return;
    }

    button.disabled = true;

    try {
      if (isJoined) {
        await leaveTutorial(tutorial.id);
      } else {
        await joinTutorial(tutorial.id);
      }
    } finally {
      button.disabled = false;
    }
  });

  card.append(
    details,
    attendeeSection,
    button
  );

  return card;
}

function addDetail(container, label, value) {
  const paragraph = document.createElement("p");

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  paragraph.append(strong, document.createTextNode(value));
  container.appendChild(paragraph);
}

function showStatus(message) {
  $("statusMessage").textContent = message;
}

// ========================================
// DIALOG CONTROLS
// ========================================

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    $(button.dataset.close).close();
  });
});

// ========================================
// CREATE MODULE
// ========================================

$("newModuleBtn").addEventListener("click", () => {
  if (!userName) {
    openNameDialog();
    return;
  }

  $("moduleForm").reset();
  moduleDialog.showModal();
});

$("moduleForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const course = $("courseInput").value;
  const moduleCode = $("moduleInput").value.trim().toUpperCase();
  const description = $("moduleDescriptionInput").value.trim();

  if (!["A1", "A2", "A3", "A4"].includes(course)) {
    alert("Please select a valid course.");
    return;
  }

  if (!new RegExp(`^${course}[A-Z0-9]+$`).test(moduleCode)) {
    alert(`Module must start with ${course}, e.g. ${course}A.`);
    return;
  }

  if (modules.some((module) => module.id === moduleCode)) {
    alert("This module already exists.");
    return;
  }

  const button = $("createModuleBtn");
  button.disabled = true;

  try {
    await setDoc(doc(db, "modules", moduleCode), {
      course,
      description,
      createdBy: userId,
      createdAt: serverTimestamp()
    });

    expandedModules.add(moduleCode);
    moduleDialog.close();
    $("moduleForm").reset();

    showStatus("Module created successfully.");
  } catch (error) {
    alert("Could not create module: " + error.message);
  } finally {
    button.disabled = false;
  }
});

// ========================================
// CREATE TUTORIAL SLOT
// ========================================

function openTutorialDialog(module) {
  if (!userName) {
    openNameDialog();
    return;
  }

  selectedModuleId = module.id;

  $("tutorialForm").reset();
  $("selectedModuleLabel").textContent =
    `Module: ${module.id}`;

  $("dateInput").min = getLocalDate();

  tutorialDialog.showModal();
}

$("tutorialForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!userName || !selectedModuleId) {
    return;
  }

  const date = $("dateInput").value;
  const startTime = $("startTimeInput").value;
  const endTime = $("endTimeInput").value;
  const location = $("locationInput").value.trim();
  const joinCreator = $("joinCreatorInput").checked;

  if (!date || !startTime || !endTime || !location) {
    alert("Please complete all fields.");
    return;
  }

  if (endTime <= startTime) {
    alert("End time must be later than start time.");
    return;
  }

  const start = new Date(`${date}T${startTime}:00`);

  if (start <= new Date()) {
    alert("Please choose a future start time.");
    return;
  }

  const attendees = joinCreator
    ? { [userId]: userName }
    : {};

  const button = $("createTutorialBtn");
  button.disabled = true;

  try {
    await addDoc(tutorialsRef, {
      moduleId: selectedModuleId,
      date,
      startTime,
      endTime,
      location,
      attendees,
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp()
    });

    expandedModules.add(selectedModuleId);

    tutorialDialog.close();
    $("tutorialForm").reset();

    showStatus("Tutorial added successfully.");
  } catch (error) {
    alert("Could not add tutorial: " + error.message);
  } finally {
    button.disabled = false;
  }
});

// ========================================
// JOIN TUTORIAL
// ========================================

async function joinTutorial(tutorialId) {
  const tutorialDoc = doc(db, "tutorials", tutorialId);

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(tutorialDoc);

      if (!snapshot.exists()) {
        throw new Error("Tutorial no longer exists.");
      }

      const tutorial = snapshot.data();
      const attendees = tutorial.attendees || {};

      if (Object.hasOwn(attendees, userId)) {
        throw new Error("You are already signed up.");
      }

      const end = new Date(
        `${tutorial.date}T${tutorial.endTime}:00`
      );

      if (end <= new Date()) {
        throw new Error("This tutorial has ended.");
      }

      transaction.update(tutorialDoc, {
        attendees: {
          ...attendees,
          [userId]: userName
        }
      });
    });

    showStatus("You have joined the tutorial.");
  } catch (error) {
    alert("Could not join tutorial: " + error.message);
  }
}

// ========================================
// LEAVE TUTORIAL
// ========================================

async function leaveTutorial(tutorialId) {
  const tutorialDoc = doc(db, "tutorials", tutorialId);

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(tutorialDoc);

      if (!snapshot.exists()) {
        throw new Error("Tutorial no longer exists.");
      }

      const attendees = {
        ...(snapshot.data().attendees || {})
      };

      if (!Object.hasOwn(attendees, userId)) {
        throw new Error("You are not signed up.");
      }

      delete attendees[userId];

      transaction.update(tutorialDoc, {
        attendees
      });
    });

    showStatus("You have left the tutorial.");
  } catch (error) {
    alert("Could not leave tutorial: " + error.message);
  }
}

// ========================================
// DATE HELPER
// ========================================

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
