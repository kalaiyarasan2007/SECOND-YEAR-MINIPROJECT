## Packages
@vladmandic/face-api | Face recognition library for browser
react-webcam | React component for accessing webcam
date-fns | Date formatting utilities

## Notes
- Models for face-api are loaded from https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/
- Requires camera permissions from the user's browser.
- Requires geolocation permissions from the user's browser for marking attendance.
- Auth uses HttpOnly cookies; no need to manually handle JWT in localStorage.
