
# SECOND YEAR MINIPROJECT
# 🎓 Smart Attendance System - SECOND YEAR MINIPROJECT 🚀
## 📖 Project Overview
The **Smart Attendance System** is a modernized approach to classroom attendance tracking. This project utilizes facial recognition technology and geolocation validation to securely and accurately log student attendance. It eliminates proxy attendance and manual errors by ensuring the student is physically present in the designated classroom area and visually verified. 
This repository contains the source code for my **Second-Year Computer Science Engineering (CSE) Mini Project**. It is built with a robust, modern full-stack architecture, focusing on performance, security, and a seamless user experience.
## ✨ Features
*   **🧑‍💻 Facial Recognition Login & Verification**: Securely identifies students using real-time face matching (`face-api.js`).
*   **📍 Geofencing & Location Validation**: Ensures students can only mark attendance when they are within the allowed radius of the institution.
*   **👥 Role-Based Access Control**: Separate dashboards and functionalities for 'Admins' (Teachers/Management) and 'Students'.
*   **📅 Automated Timetable & Periods**: Dynamic attendance periods with defined start and end times.
*   **✅ Real-time Status Tracking**: Instant visual feedback on attendance status (Pending, Approved, Rejected).
*   **🔔 Automated Notifications**: Email alerts via Nodemailer for attendance updates.
*   **📱 Responsive & Modern UI**: Built with Radix UI, Framer Motion, and Tailwind CSS for a premium look across all devices.
## 🛠️ Technology Stack
| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Radix UI, Framer Motion, React Webcam |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL, Drizzle ORM |
| **Languages** | TypeScript, JavaScript, HTML, CSS |
| **Tools & Libraries** | face-api.js (Facial Recognition), Zod (Validation), Passport.js (Auth), Nodemailer, WebSocket (Realtime) |
## 🏗️ System Architecture
1.  **User Authentication**: The user (student/admin) logs into the system securely.
2.  **Geolocation Check**: For students marking attendance, the system first verifies their GPS coordinates against the pre-defined geofenced area.
3.  **Facial Verification**: If the location is valid, the webcam captures the student's face and matches it with their stored facial encoding.
4.  **Database Update**: Upon successful verification, the backend records the attendance for the specific period in the PostgreSQL database.
5.  **Admin Dashboard**: Admins can monitor live attendance, approve/reject requests, and manage system settings (like geofence radius).
## 📂 Project Structure
```text
SECOND-YEAR-MINIPROJECT/
├── client/           # Frontend React application code (Pages, Components, Hooks)
├── server/           # Backend Express.js server, APIs, and business logic
├── shared/           # Shared types, Zod schemas, and Drizzle database models
├── migrations/       # Database migration scripts
├── .env              # Environment variables
├── package.json      # Project dependencies and scripts
└── vite.config.ts    # Vite configuration
```
## 🚀 Installation and Setup
Follow these steps to run the project locally on your machine.
**1. Clone the repository**
```bash
git clone https://github.com/kalaiyarasan2007/SECOND-YEAR-MINIPROJECT.git
cd SECOND-YEAR-MINIPROJECT
```
**2. Install dependencies**
```bash
npm install
```
**3. Set up environment variables**
Create a `.env` file in the root directory and add your PostgreSQL database URL and other necessary secrets.
```env
DATABASE_URL=your_postgresql_database_url
```
**4. Push Database Schema**
```bash
npm run db:push
```
**5. Run the project (Development Mode)**
```bash
npm run dev
```
The application will start, and the development server URL will be displayed in your terminal (usually `http://localhost:5000`).
## 💡 Usage
*   **For Admins**: Log in to access the dashboard. Here you can configure the allowed geographical coordinates, manage student data, and monitor overall attendance records.
*   **For Students**: Log in using your registered credentials. When a class period is active, navigate to the attendance section, allow location and camera access, and verify your identity to mark yourself present.
## 🔮 Future Enhancements
*   Mobile Application (React Native) for easier student access.
*   Integration with campus Wi-Fi for an additional layer of location verification.
*   Detailed analytics and exportable reports (PDF/Excel) for administrators.
*   Machine Learning model improvements for faster face detection in low light.
## 👨‍💻 Developer
**Name:** Kalaiyarasan  
**Role:** Computer Science Engineering Student  
**GitHub:** [@kalaiyarasan2007](https://github.com/kalaiyarasan2007)
---
<p align="center">
  <img src="https://img.shields.io/badge/Language-TypeScript-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Framework-React-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>
