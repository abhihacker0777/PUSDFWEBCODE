# 🎓 Poornima University - Previous Year Question Papers Portal

A Full-Stack Web Application Designed To Help Poornima University Students Easily Find, Filter, And View Previous Year Question Papers (Mse & Ese). Built With A Focus On Speed, Responsive Design, And An Intuitive User Experience.

## ✨ Key Features

- **Cascading Search Interface**: Dynamic, Real-time Filtering That Prevents "Dead End" Searches.
- **Automated Cloud Storage**: Direct Integration With Google Drive API For Secure, Permission-controlled PDF Hosting.
- **Dual-Write Audit Trail**: Administrative Actions Are Logged To A Real-time Dashboard And Permanently Archived To Google Sheets.
- **Self-Healing Database**: 5-Minute Automated Firebase Cache Cleanup To Prevent Exceeding Free-tier Quotas.
- **Secure Authentication**: Google OAuth 2.0 Login System Restricted To Authorized University Administrators.
- **Responsive Architecture**: Polished UI Built With React And Tailwind CSS, Fully Optimized For Both Mobile And Desktop.



## 🚀 Technologies Used

**Frontend Ecosystem**
- **Core**: react.js, Vite
- **Styling**: Tailwind CSS
- **State & Routing**: React Hooks, React Router DOM

**Backend Ecosystem**
- **Server**: node.js, express.js
- **Database (Indexing)**: Google Firebase (Firestore)
- **Storage (Files)**: Google Drive API V3
- **Logging (Archive)**: Google Sheets API V4
- **Security**: JWT (JSON Web Tokens), Helmet.js, Google OAuth 2.0

## 🛠️ Getting Started

### Prerequisites
- node.js (V18 Or Higher)
- npm Or yarn
- Git

### Installation & Setup

1. **Clone The Repository:**
   ```Bash
   git clone [https://github.com/abhihacker0777/PUSDFWEBCODE.git]
   cd pusdfwebcode
   ```

2. **Setup The Backend:**
   ```Bash
   cd backend
   npm install
   ```
   *Create A `.env` File In The `backend` Folder And Securely Add Your Firebase Base64 Credentials, Google OAuth Keys, And JWT Secrets.*

3. **Setup The Frontend:**
   ```Bash
   cd ../frontend
   npm install
   ```
   *Create A `.env` File In The `frontend` Folder And Set `Vite_API_URL` To Your Backend Server URL.*

4. **Run The Development Servers:**
   *Open Two Terminal Windows.*
   
   **Terminal 1 (Backend):**
   ```Bash
   cd backend
   node server.js
   ```
   **Terminal 2 (Frontend):**
   ```Bash
   cd frontend
   npm run dev
   ```

## 📂 Project Structure

```Text
PYQP-Portal/
├── backend/               # Express.js Server & API Routes
│   ├── uploads/           # Ephemeral storage for Multer Parsing
│   ├── server.js          # Core Logic, OAuth, And API Integrations
│   └── package.json
├── frontend/              # React.js SPA (Single Page Application)
│   ├── src/               # Components, Pages, And API Services
│   ├── tailwind.config.js # Custom Poornima University Branding Themes
│   └── package.json
└── .gitignore             # Global Security Exclusions
```

## 🌟 Features In Detail

### Smart Document Processing
When An Admin Uploads A Document, The Server Temporarily Parses It Via `multer`, Automatically Generates A Secure, View-Only Google Drive Link, Indexes The Metadata (Course, Year, Semester) Into Firestore, And Immediately Deletes The Temporary Local File To Prevent Server Bloat.

### Persistent OAuth Security
Instead Of Requiring Admins To Constantly Log In, Google OAuth 2.0 Tokens Are Encrypted And Saved Securely Within Firestore. This Ensures The node.js Server Remains Persistently Authenticated To Google Workspace Even After Server Restarts Or Deployments.

### Infinite Scalability Logging
To Keep The Database Fast And Free, The `logs` API Utilizes An Automated Garbage Collection System. Recent Activity Is Kept In Firestore For 5 Minutes For Rapid UI Rendering In The Admin Panel, While All Logs Are Simultaneously Appended To A Hidden Google Sheet For Permanent, Zero-Cost Data Archiving.

---
**Developed By:** Abhishek Sankhla  
*BCA (Cyber Security) Batch 2025-28 | Poornima University | [LinkedIn Profile](https://linkedin.com/in/abhihacker0777)*