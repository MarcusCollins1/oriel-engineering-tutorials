
# Oxford Engineering Tutorial Planner

A simple tutorial scheduling website for Oxford
engineering students.

## Features

- Courses A1, A2, A3 and A4
- Custom modules such as A1A and A2B
- Create tutorial slots
- Start and end times
- Unlimited tutorial signups
- View attendees
- Join and leave tutorials
- Real-time Firestore updates
- Name stored in localStorage
- No login or authentication
- Mobile-friendly layout

## How it works

When someone visits the website for the first time,
they enter their name.

The website saves two values in localStorage:

- tutorialUserName
- tutorialUserId

The name identifies the student in the interface.

The ID identifies their browser's signups.

Both values remain saved between visits unless
the browser's site data is cleared.

## Firebase setup

1. Open https://console.firebase.google.com/
2. Select the existing Firebase project.
3. Open Firestore Database.
4. Open the Rules tab.
5. Replace the rules with firestore.rules.
6. Publish the rules.

Firebase Authentication is not required.

## GitHub Pages

Upload the following files:

- index.html
- style.css
- script.js
- firestore.rules
- README.md

Ensure the three website files are named exactly:

index.html
style.css
script.js

The website is hosted at:

https://marcuscollins1.github.io/oriel-engineering-tutorials/

## Creating tutorials

1. Enter your name if prompted.
2. Click New tutorial.
3. Select the course.
4. Enter the module.
5. Enter the topic.
6. Choose the date.
7. Choose the start and end times.
8. Enter the location.
9. Click Create tutorial.

## Joining tutorials

Click Join tutorial on any upcoming tutorial.

Your name will appear in the attendees list.

Click Leave tutorial to remove yourself.

There is no configured group-size limit.

## Changing your name

Click Change name in the header.

Your new name is saved in localStorage.

Existing attendee names in Firestore are not
automatically updated when you change your name.

## Notes

This is a trust-based website without authentication.

Anyone with access to the public Firebase database
can read tutorials and modify attendance.

Browser IDs are not secure identities.

Clearing localStorage generates a new browser ID,
so old signups will no longer be recognised as yours.

Existing Firestore documents using the previous
attendees array format must be migrated or recreated.

The website uses the browser's local time zone.

Tutorials cannot currently be edited or deleted.
