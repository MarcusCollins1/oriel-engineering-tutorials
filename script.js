
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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
// 1. FIREBASE CONFIGURATION
// ========================================

// Replace these values with your own Firebase config.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
const tutorialsRef = collection(db, "tutorials");

// ========================================
// 2. APPLICATION STATE
// ========================================

let currentUser = null;
let tutorials = [];
let selectedCourse = "all";
let unsubscribeTutorials = null;

const $ = (id) => document.getElementById(id);

const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const newTutorialBtn = $("newTutorialBtn");
const tutorialDialog = $("tutorialDialog");
const tutorialForm = $("tutorialForm");
const tutorialList = $("tutorialList");
const moduleFilter = $("moduleFilter");
const availableOnly = $("availableOnly");
const statusMessage = $("statusMessage");

// ========================================
// 3. GOOGLE AUTHENTICATION
// ========================================

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    showStatus("Sign-in failed: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showStatus(error.message);
  }
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  loginBtn.classList.toggle("hidden", !!user);
  logoutBtn.classList.toggle("hidden", !user);
  newTutorialBtn.classList.toggle("hidden", !user);

  $("userName").textContent = user
    ? user.displayName || user.email
    : "";

  // Stop listening to the previous account's data.
  if (unsubscribeTutorials) {
    unsubscribeTutorials();
    unsubscribeTutorials = null;
  }

  tutorials = [];
  renderTutorials();

  if (user) {
    subscribeToTutorials();
  } else {
    showStatus("Sign in to view and manage tutorials.");
  }
});

// ========================================
// 4. LIVE FIRESTORE UPDATES
// ========================================

function subscribeToTutorials() {
  unsubscribeTutorials = onSnapshot(
    tutorialsRef,
    (snapshot) => {
      tutorials = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

      tutorials.sort((a, b) => {
        const first = `${a.date}T${a.time}`;
        const second = `${b.date}T${b.time}`;
        return first.localeCompare(second);
      });

      updateModuleFilter();
      renderTutorials();
      showStatus("");
    },
    (error) => {
      showStatus(
        "Could not load tutorials: " + error.message
      );
    }
  );
}

// ========================================
// 5. COURSE AND MODULE FILTERS
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
availableOnly.addEventListener("change", renderTutorials);

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
    )
  ].sort();

  moduleFilter.replaceChildren();

  const allOption = new Option("All modules", "all");
  moduleFilter.add(allOption);

  modules.forEach((moduleName) => {
    moduleFilter.add(new Option(moduleName, moduleName));
  });

  if (modules.includes(previousValue)) {
    moduleFilter.value = previousValue;
  }
}

// ========================================
// 6. RENDER TUTORIAL CARDS
// ========================================

function renderTutorials() {
  tutorialList.replaceChildren();

  if (!currentUser) {
    showEmptyState("Sign in to see upcoming tutorials.");
    return;
  }

  const today = getLocalDate();

  const filtered = tutorials.filter((tutorial) => {
    const matchesCourse =
      selectedCourse === "all" ||
      tutorial.course === selectedCourse;

    const matchesModule =
      moduleFilter.value === "all" ||
      tutorial.module === moduleFilter.value;

    const hasSpace =
      !availableOnly.checked ||
      tutorial.attendees.length < tutorial.capacity;

    const isUpcoming = tutorial.date >= today;

    return matchesCourse &&
           matchesModule &&
           hasSpace &&
           isUpcoming;
  });

  if (filtered.length === 0) {
    showEmptyState("No tutorials match your filters.");
    return;
  }

  filtered.forEach((tutorial) => {
    tutorialList.appendChild(createTutorialCard(tutorial));
  });
}

function createTutorialCard(tutorial) {
  const card = document.createElement("article");
  card.className = "tutorial-card";

  const count = tutorial.attendees.length;
  const capacity = tutorial.capacity;
  const isFull = count >= capacity;
  const isJoined = tutorial.attendees.includes(currentUser.uid);

  const percentage = Math.min(100, (count / capacity) * 100);

  // Use textContent for user-provided text to prevent HTML injection.
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
  addDetail(details, "Time", tutorial.time);
  addDetail(details, "Location", tutorial.location);

  const capacitySection = document.createElement("div");

  const capacityHeader = document.createElement("div");
  capacityHeader.className = "capacity-header";

  const capacityTitle = document.createElement("span");
  capacityTitle.textContent = "Group members";

  const capacityCount = document.createElement("span");
  capacityCount.textContent = `${count} / ${capacity}`;

  capacityHeader.append(capacityTitle, capacityCount);

  const bar = document.createElement("div");
  bar.className = "capacity-bar";

  const fill = document.createElement("div");
  fill.className = "capacity-fill";
  fill.style.width = `${percentage}%`;

  if (isFull) {
    fill.classList.add("full");
  }

  bar.appendChild(fill);
  capacitySection.append(capacityHeader, bar);

  const attendees = document.createElement("div");
  attendees.className = "attendees";

  const names = tutorial.attendees.map((uid) => {
    return tutorial.attendeeNames?.[uid] || "Student";
  });

  attendees.textContent = names.length
    ? "Attending: " + names.join(", ")
    : "Nobody has signed up yet.";

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
  } else if (isFull) {
    actionBtn.textContent = "Group full";
    actionBtn.classList.add("secondary");
    actionBtn.disabled = true;
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
    capacitySection,
    attendees,
    actions
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
// 7. CREATE A TUTORIAL
// ========================================

newTutorialBtn.addEventListener("click", () => {
  if (!currentUser) return;

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

  const user = currentUser;
  if (!user) return;

  const course = $("courseInput").value;
  const moduleName = $("moduleInput").value.trim().toUpperCase();
  const topic = $("topicInput").value.trim();
  const date = $("dateInput").value;
  const time = $("timeInput").value;
  const location = $("locationInput").value.trim();
  const capacity = Number($("capacityInput").value);
  const joinCreator = $("joinCreatorInput").checked;

  if (!["A1", "A2", "A3", "A4"].includes(course)) {
    alert("Please select a valid course.");
    return;
  }

  if (!new RegExp(`^${course}[A-Z0-9]+$`).test(moduleName)) {
    alert(`Module must start with ${course}, e.g. ${course}A.`);
    return;
  }

  if (!topic || !location || !date || !time) {
    alert("Please complete all fields.");
    return;
  }

  if (new Date(`${date}T${time}:00`) <= new Date()) {
    alert("Please choose a future date and time.");
    return;
  }

  const attendees = joinCreator ? [user.uid] : [];

  const attendeeNames = joinCreator
    ? { [user.uid]: user.displayName || "Student" }
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
      time,
      location,
      capacity,
      createdBy: user.uid,
      attendees,
      attendeeNames,
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
// 8. JOIN A TUTORIAL
// ========================================

async function joinTutorial(tutorialId) {
  const user = currentUser;
  if (!user) {
    alert("Please sign in first.");
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
      const attendees = tutorial.attendees || [];

      if (attendees.includes(user.uid)) {
        throw new Error("You are already signed up.");
      }

      if (attendees.length >= tutorial.capacity) {
        throw new Error("This group is already full.");
      }

      if (
        new Date(`${tutorial.date}T${tutorial.time}:00`) <= new Date()
      ) {
        throw new Error("This tutorial has already started.");
      }

      transaction.update(tutorialDoc, {
        attendees: [...attendees, user.uid],
        attendeeNames: {
          ...tutorial.attendeeNames,
          [user.uid]: user.displayName || "Student"
        }
      });
    });

    showStatus("You have joined the tutorial.");
  } catch (error) {
    alert("Could not join: " + error.message);
  }
}

// ========================================
// 9. LEAVE A TUTORIAL
// ========================================

async function leaveTutorial(tutorialId) {
  const user = currentUser;
  if (!user) return;

  const tutorialDoc = doc(db, "tutorials", tutorialId);

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(tutorialDoc);

      if (!snapshot.exists()) {
        throw new Error("Tutorial no longer exists.");
      }

      const tutorial = snapshot.data();
      const attendees = tutorial.attendees || [];

      if (!attendees.includes(user.uid)) {
        throw new Error("You are not in this tutorial.");
      }

      const updatedAttendees = attendees.filter(
        (uid) => uid !== user.uid
      );

      const updatedNames = {
        ...tutorial.attendeeNames
      };

      delete updatedNames[user.uid];

      transaction.update(tutorialDoc, {
        attendees: updatedAttendees,
        attendeeNames: updatedNames
      });
    });

    showStatus("You have left the tutorial.");
  } catch (error) {
    alert("Could not leave: " + error.message);
  }
}

// ========================================
// 10. DATE HELPER
// ========================================

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
