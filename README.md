# 🎓 Poornima University - Previous Year Question Papers Portal

A Full-Stack Web Application Designed To Help Poornima University Students Easily Find, Filter, And View Previous Year Question Papers (Mse & Ese). Built With A Focus On Speed, Responsive Design, And An Intuitive User Experience.

## ✨ Features
* **Smart Filtering:** Dynamically Filter Papers By Course, Year, Specialization, Semester, And Exam Type.
* **Lightning Fast:** Implements A Local Caching System (`localstorage`) To Load Papers Instantly On Repeat Visits And Save Database Reads.
* **Secure Admin Uploads:** A Dedicated Node.js/express Backend Handles Secure Paper Uploads And Authentication.
* **Modern UI/UX:** Clean, Responsive Interface Styled With Tailwind CSS, Featuring Smooth Loading States And Academic Typography.

## 🛠️ Tech Stack
**Frontend:**
* React.js (Vite)
* Tailwind CSS
* React Hooks (State Management & Side Effects)

**Backend & Database:**
* Node.js & Express.js
* Firebase Cloud Firestore (NoSQL Database)
* Google Cloud Service Accounts (Secure Backend Access)

---

## 📂 Project Structure

This Repository Is Split Into Two Main Directories:

* `/frontend` - The React Vite Application (User Interface)
* `/backend` - The Express.js Server (Admin & File Handling)

---

## 🚀 Local Development Setup

If You Want To Run This Project On Your Local Machine, Follow These Steps:

### 1. Clone The Repository
```Bash
Git Clone [https://github.com/abhihacker0777/PUSDFWEBCODE.git]
CD Yourreponame
```

### 2. Backend Setup
```Bash
CD Backend
npm Install
```
**Important:** You Will Need To Create A `.env` File And Add Your `serviceaccount.json` Inside The `backend/` Folder To Connect To Firebase. (These Files Are Ignored In Git For Security).

Start The Server:
```Bash
Node Server.js
```

### 3. Frontend Setup
Open A New Terminal Window:
```Bash
CD Frontend
npm Install
```
Start The React Development Server:
```Bash
npm Run Dev
```

---

## 🔐 Environment Variables
To Run This Project, You Will Need To Set Up The Following Environment Variables. Create A `.env` File In Both The Frontend And Backend Directories.

**Frontend (`frontend/.env`):**
* `Vite_API_BASE_URL` (Your Backend URL)
* Firebase Config Keys (If Connecting Directly From The Client)

**Backend (`backend/.env`):**
* `port`
* Firebase Admin Credentials

*(Note: Never Push Your Actual `.env` Files Or `serviceaccount.json` To GitHub!)*

---
## 👨‍💻 Author
**Abhishek Sankhla**
* BCA (Cyber Security) Batch - 2025-28
* Poornima University
* [LinkedIn Profile](https://linkedin.com/in/abhihacker0777)
