
# Oxford Engineering Tutorial Planner

A shared tutorial scheduling website for seven Oxford
engineering students.

## Features

- Four courses: A1, A2, A3, A4
- Custom modules, e.g. A1A, A1B, A2A
- Create tutorial slots
- Join and leave tutorials
- Groups of 2 or 3 students
- Real-time Firestore updates
- Google Authentication
- Responsive design

## 1. Create a Firebase project

Visit https://console.firebase.google.com/

Create a new project.

## 2. Enable Google Authentication

In Firebase Console:

Authentication > Sign-in method > Google > Enable

Add your GitHub Pages domain to the authorized
domains list.

For example:

yourusername.github.io

## 3. Create Firestore

Go to:

Firestore Database > Create database

Choose a database location and create the database.

## 4. Configure the website

Go to:

Project settings > General > Your apps

Register a Web app.

Copy the firebaseConfig object into script.js.

## 5. Configure security rules

Open firestore.rules.

Replace the seven example email addresses with
the Google account addresses of your group.

In Firebase Console:

Firestore Database > Rules

Paste the rules and publish them.

Before publishing, test the rules using the
Firebase Emulator or Rules Playground.

## 6. Deploy to GitHub Pages

Create a public GitHub repository.

Upload:
- index.html
- style.css
- script.js
- firestore.rules
- README.md

Go to:

Settings > Pages

Under Build and deployment:

Source: Deploy from a branch
Branch: main
Folder: / (root)

Save the settings.

Your website will be available at:

https://marcuscollins1.github.io/oriel-engineering-tutorials/

## 7. Using the website

1. Sign in with Google.
2. Select a course.
3. Click New tutorial to create a slot.
4. Enter the module, topic, date, time and location.
5. Choose a group size of 2 or 3.
6. Other students can click Join tutorial.
7. Students can leave a tutorial if necessary.

Tutorials update automatically for everyone.

## Notes

- GitHub Pages hosts the frontend.
- Firestore stores tutorial data.
- Firebase Authentication identifies students.
- Firebase security rules control database access.
- The Firebase web API key is public configuration,
  not a secret.
- Do not store Firebase Admin SDK credentials or
  service account private keys in the repository.
