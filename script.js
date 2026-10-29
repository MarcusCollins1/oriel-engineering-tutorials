
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
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
const tutorialsRef = collection(db, "tutorials");

// ========================================
// LOCAL USER
// ========================================

// Each browser gets its own random ID.
// The ID stays the same when the user changes their name.

let userId = localStorage.getItem("tutorialUserId");

if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("tutorialUserId", userId);
}

let userName = localStorage.getItem("tutorialUserName") || "";

const $ = (id) => document.getElementById(id);

const nameDialog = $("nameDialog");
const nameForm = $("nameForm");
const tutorialDialog = $("tutorialDialog");
const tutorialForm = $("tutorialForm");
const tutorialList = $("tutorialList");
const moduleFilter = $("moduleFilter");
const statusMessage = $("statusMessage");

let tutorials = [];
let selectedCourse = "all";

// ========================================
// NAME ENTRY
// ========================================

function updateUserDisplay() {
  $("userName").textContent = userName
    ? `Hello, ${userName}`
    : "";
}

function openNameDialog() {
  $("nameInput").value = userName;
  nameDialog.showModal();
}

updateUserDisplay();

if (!userName) {
  openNameDialog();
}

$("changeNameBtn").addEventListener("click", openNameDialog);

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("nameInput").value.trim();

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  userName = name;
  localStorage.setItem("tutorialUserName", userName);

  updateUserDisplay();
  nameDialog.close();
  renderTutorials();
});

// Prevent closing the name dialog before a name is entered.
nameDialog.addEventListener("cancel", (event) => {
  if (!userName) {
    event.preventDefault();
  }
});

// ========================================
// LIVE FIRESTORE UPDATES
// ========================================

onSnapshot(
  tutorialsRef,
  (snapshot) => {
    tutorials = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    tutorials.sort((a, b) => {
      const first = `${a.date}T${a.startTime}`;
      const second = `${b.date}T${b.startTime}`;
      return first.localeCompare(second);
    });

    updateModuleFilter();
    renderTutorials();
    showStatus("");
  },
  (error) => {
    showStatus("Could not load tutorials: " + error.message);
  }
);

// ========================================
// COURSE AND MODULE FILTERS
// ========================================

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCourse = button.dataset.course;

    document.querySelectorAll(".filter").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    moduleFilter.value = "all";
    updateModuleFilter();
    renderTutorials();
  });
});

moduleFilter.addEventListener("change", renderTutorials);

function updateModuleFilter() {
  const previousValue = moduleFilter.value;

  const modules = [
    ...new Set(
      tutorials
        .filter((tutorial) =>
          selectedCourse === "all" ||
          tutorial.course === selectedCourse
        )
        .map((tutorial) => tutorial.module)
        .filter(Boolean)
    )
  ].sort();

  moduleFilter.replaceChildren();
  moduleFilter.add(new Option("All modules", "all"));

  modules.forEach((moduleName) => {
    moduleFilter.add(new Option(moduleName, moduleName));
  });

  if (modules.includes(previousValue)) {
    moduleFilter.value = previousValue;
  }
}

// ========================================
// RENDER TUTORIALS
// ========================================

function renderTutorials() {
  tutorialList.replaceChildren();

  if (!userName) {
    showEmptyState("Enter your name to use the planner.");
    return;
  }

  const now = new Date();

  const filtered = tutorials.filter((tutorial) => {
    const matchesCourse =
      selectedCourse === "all" ||
      tutorial.course === selectedCourse;

    const matchesModule =
      moduleFilter.value === "all" ||
      tutorial.module === moduleFilter.value;

    const endDateTime = new Date(
      `${tutorial.date}T${tutorial.endTime}:00`
    );

    return matchesCourse &&
           matchesModule &&
           endDateTime > now;
  });

  if (filtered.length === 0) {
    showEmptyState("No upcoming tutorials match your filters.");
    return;
  }

  filtered.forEach((tutorial) => {
    tutorialList.appendChild(createTutorialCard(tutorial));
  });
}

function createTutorialCard(tutorial) {
  const card = document.createElement("article");
  card.className = "tutorial-card";

  // Attendees are stored as an object:
  // { browserId: "Student Name" }

  const attendees = tutorial.attendees || {};
  const attendeeIds = Object.keys(attendees);
  const count = attendeeIds.length;
  const isJoined = Object.hasOwn(attendees, userId);

  const top = document.createElement("div");
  top.className = "card-top";

  const badge = document.createElement("span");
  badge.className = "module-badge";
  badge.textContent = tutorial.module;

  const courseLabel = document.createElement("span");
  courseLabel.className = "course-label";
  courseLabel.textContent = tutorial.course;

  top.append(badge, courseLabel);

  const title = document.createElement("h3");
  title.textContent = tutorial.topic;

  const details = document.createElement("div");
  details.className = "details";

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

  const countText = document.createElement("strong");
  countText.textContent =
    `${count} ${count === 1 ? "student" : "students"} attending`;

  const namesText = document.createElement("p");
  namesText.textContent = count
    ? Object.values(attendees).join(", ")
    : "Nobody has signed up yet.";

  attendeeSection.append(countText, namesText);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const actionBtn = document.createElement("button");
  actionBtn.className = "btn";

  if (isJoined) {
    actionBtn.textContent = "Leave tutorial";
    actionBtn.classList.add("secondary");

    actionBtn.addEventListener("click", async () => {
      actionBtn.disabled = true;
      await leaveTutorial(tutorial.id);
      actionBtn.disabled = false;
    });
  } else {
    actionBtn.textContent = "Join tutorial";
    actionBtn.classList.add("primary");

    actionBtn.addEventListener("click", async () => {
      actionBtn.disabled = true;
      await joinTutorial(tutorial.id);
      actionBtn.disabled = false;
    });
  }

  actions.appendChild(actionBtn);

  card.append(
    top,
    title,
    details,
    attendeeSection,
    actions
  );

  return card;
}

function addDetail(container, label, value) {
  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");

  strong.textContent = `${label}: `;

  paragraph.append(
    strong,
    document.createTextNode(value)
  );

  container.appendChild(paragraph);
}

function showEmptyState(message) {
  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = message;
  tutorialList.appendChild(element);
}

function showStatus(message) {
  statusMessage.textContent = message;
}

// ========================================
// CREATE TUTORIAL
// ========================================

$("newTutorialBtn").addEventListener("click", () => {
  if (!userName) {
    openNameDialog();
    return;
  }

  tutorialForm.reset();
  $("dateInput").min = getLocalDate();
  tutorialDialog.showModal();
});

$("closeDialogBtn").addEventListener("click", () => {
  tutorialDialog.close();
});

$("cancelDialogBtn").addEventListener("click", () => {
  tutorialDialog.close();
});

tutorialForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!userName) {
    openNameDialog();
    return;
  }

  const course = $("courseInput").value;
  const moduleName = $("moduleInput").value.trim().toUpperCase();
  const topic = $("topicInput").value.trim();
  const date = $("dateInput").value;
  const startTime = $("startTimeInput").value;
  const endTime = $("endTimeInput").value;
  const location = $("locationInput").value.trim();
  const joinCreator = $("joinCreatorInput").checked;

  if (!["A1", "A2", "A3", "A4"].includes(course)) {
    alert("Please select a valid course.");
    return;
  }

  if (!new RegExp(`^${course}[A-Z0-9]+$`).test(moduleName)) {
    alert(`Module must start with ${course}, e.g. ${course}A.`);
    return;
  }

  if (!topic || !location || !date || !startTime || !endTime) {
    alert("Please complete all fields.");
    return;
  }

  if (endTime <= startTime) {
    alert("End time must be later than start time.");
    return;
  }

  const startDateTime = new Date(`${date}T${startTime}:00`);

  if (startDateTime <= new Date()) {
    alert("Please choose a future start time.");
    return;
  }

  const attendees = joinCreator
    ? { [userId]: userName }
    : {};

  const createBtn = $("createBtn");
  createBtn.disabled = true;
  createBtn.textContent = "Creating...";

  try {
    await addDoc(tutorialsRef, {
      course,
      module: moduleName,
      topic,
      date,
      startTime,
      endTime,
      location,
      createdBy: userId,
      createdByName: userName,
      attendees,
      createdAt: serverTimestamp()
    });

    tutorialDialog.close();
    tutorialForm.reset();
    showStatus("Tutorial created successfully.");
  } catch (error) {
    alert("Could not create tutorial: " + error.message);
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = "Create tutorial";
  }
});

// ========================================
// JOIN TUTORIAL
// ========================================

async function joinTutorial(tutorialId) {
  if (!userName) {
    openNameDialog();
    return;
  }

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

      const tutorialEnd = new Date(
        `${tutorial.date}T${tutorial.endTime}:00`
      );

      if (tutorialEnd <= new Date()) {
        throw new Error("This tutorial has already ended.");
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
    alert("Could not join: " + error.message);
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

      const tutorial = snapshot.data();
      const attendees = { ...(tutorial.attendees || {}) };

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
    alert("Could not leave: " + error.message);
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
