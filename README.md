
# Oxford Engineering Tutorial Planner

A shared tutorial planner for Oxford engineering students.

## Features

- Courses A1, A2, A3 and A4
- Create modules such as A1A, A1B and A1D
- Add multiple tutorial slots to each module
- Each slot has a topic, date, start time, end time and location
- Join and leave individual tutorials
- Unlimited signups per tutorial
- See who is attending
- Real-time Firestore updates
- Names stored in localStorage
- No authentication required
- Responsive layout

## Project files

index.html
style.css
script.js
firestore.rules
README.md

## Firebase setup

1. Open https://console.firebase.google.com/
2. Select your Firebase project.
3. Open Firestore Database.
4. Go to Rules.
5. Paste the contents of firestore.rules.
6. Click Publish.

You do not need Firebase Authentication.

## Firestore structure

There are two collections:

modules
tutorials

A module document has its module code as its ID.

Example:

modules/A1D

{
  "course": "A1",
  "description": "Thermodynamics",
  "createdBy": "browser-id"
}

A tutorial document has an automatically generated ID.

Example:

tutorials/random-document-id

{
  "moduleId": "A1D",
  "topic": "Problem Sheet 3",
  "date": "2026-11-02",
  "startTime": "14:00",
  "endTime": "15:00",
  "location": "College",
  "attendees": {
    "browser-id-1": "Marcus",
    "browser-id-2": "Alice"
  }
}

Both document types also contain a Firestore createdAt
timestamp. Tutorials contain creator information.

## Deploying to GitHub Pages

Upload the following files to your repository:

- index.html
- style.css
- script.js
- firestore.rules
- README.md

In GitHub:

Settings > Pages

Choose:

Source: Deploy from a branch
Branch: main
Folder: / (root)

Your website:

https://marcuscollins1.github.io/oriel-engineering-tutorials/

## Using the website

### First visit

Enter your name when prompted.

The website remembers your name using localStorage.

### Create a module

1. Click New module.
2. Select A1, A2, A3 or A4.
3. Enter a module code, e.g. A1D.
4. Optionally enter a description.
5. Click Create module.

### Add a tutorial

1. Open a module.
2. Click Add tutorial.
3. Enter the topic.
4. Choose the date.
5. Enter start and end times.
6. Enter the location.
7. Click Add tutorial.

### Join a tutorial

Open the module and click Join tutorial
under the tutorial slot you want.

Your name appears in the attendees list.

Click Leave tutorial to remove yourself.

## Name storage

The browser saves:

tutorialUserName
tutorialUserId

Names are not authenticated.

Changing your name does not automatically
rename your existing signups.

Clearing localStorage generates a new browser ID.

## Old data

This version uses a new data structure.

Old standalone tutorials are not displayed.

You can recreate them under the correct modules.

You can manually delete old documents from the
Firestore Console if you no longer need them.

## Limitations

- No authentication or account security.
- Modules and tutorials cannot be edited or deleted.
- End times must be later than start times.
- Tutorial slots cannot cross midnight.
- Past tutorial slots are hidden, not deleted.
- Dates and times use the browser's local timezone.
- Firestore documents have a maximum size, so
  attendee storage is not literally unlimited.
- Public database access may incur Firestore usage costs.
