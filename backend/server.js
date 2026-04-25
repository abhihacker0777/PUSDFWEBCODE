require("dotenv").config();
const admin = require("firebase-admin");

const base64Key = process.env.FIREBASE_BASE64;

if (!base64Key) {
  console.error("❌ FATAL ERROR: FIREBASE_BASE64 is undefined.");
  console.log("Check if your .env file is in: C:\\PUSDFWEBCODE\\backend\\.env");
  process.exit(1);
}

try {
  const decodedKey = Buffer.from(base64Key, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin Initialized");
} catch (err) {
  console.error("❌ JSON Parse Error: The decoded Base64 is not a valid JSON string.");
  process.exit(1);
}
const db = admin.firestore();

const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs"); 
const path = require("path"); 
const { google } = require("googleapis");
const helmet = require("helmet");

const SECRET = process.env.JWT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SHEET_ID = process.env.SHEET_ID;
const FRONTEND_URL = process.env.FRONTEND_URL;
const SHEET_URL = process.env.SHEET_URL;

const app = express();
app.use(cors());

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "script-src": ["'self'"],
    "img-src": ["'self'", "data:", "https://*.googleusercontent.com", "https://*.gstatic.com", "https://*.google.com"], 
  }
}));

app.use(express.json());
app.use(express.static('public'));

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("INVALID_TYPE"), false);
  }
};

const upload = multer({ 
  dest: "uploads/",
  fileFilter: fileFilter 
});

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).send("❌ No Token");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send("❌ Invalid Token");
  }
}

app.get('/logs', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('logs').orderBy('id', 'desc').get();
    const logs = [];
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    let batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.id < sevenDaysAgo) {
        batch.delete(doc.ref);
        deletedCount++;
      } else {
        logs.push(data);
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`🧹 Auto-cleaned ${deletedCount} logs older than 7 days from Firebase.`);
    }

    res.json(logs);
  } catch (err) {
    console.error("Log fetch error:", err);
    res.json([]);
  }
});

app.post('/logs', verifyToken, async (req, res) => {
  try {
    const logData = req.body;

    await db.collection('logs').doc(logData.id.toString()).set(logData);

    if (global.authClient) {
      const sheets = google.sheets({ version: "v4", auth: global.authClient });
      
      const rowData = [
        logData.id,
        logData.date,
        logData.status,
        logData.course || "-",
        logData.year || "-",
        logData.spec || "-",
        logData.semester || "-",
        logData.exam || "-",
        logData.name || "-"
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Logs!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [rowData] }
      });
    }

    res.status(200).send("Log Saved Successfully");
  } catch (err) {
    console.error("Log write error:", err);
    res.status(500).send("Error saving log");
  }
});

app.delete('/logs/clear', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('logs').get();
    const batches = [];
    let batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      if (count === 500) {
        batches.push(batch.commit());
        batch = db.batch();
        count = 0;
      }
    });
    if (count > 0) batches.push(batch.commit());
    await Promise.all(batches);
    
    res.status(200).send("Database Logs Wiped"); 
  } catch (error) {
    console.error("Firebase Clear Error:", error);
    res.status(500).send("Server failed to wipe database");
  }
});

app.post('/logs/delete', verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;
    const batches = [];
    let batch = db.batch();
    let count = 0;
    
    ids.forEach(id => {
      const ref = db.collection('logs').doc(id.toString());
      batch.delete(ref);
      count++;
      if (count === 500) {
        batches.push(batch.commit());
        batch = db.batch();
        count = 0;
      }
    });
    if (count > 0) batches.push(batch.commit());
    await Promise.all(batches);
    
    res.status(200).send("Selected Logs Deleted");
  } catch (error) {
    console.error("Firebase Delete Error:", error);
    res.status(500).send("Server failed to delete specific logs");
  }
});

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI 
);

oAuth2Client.on('tokens', (tokens) => {
  db.collection('config').doc('google_token').set(tokens, { merge: true });
});

db.collection('config').doc('google_token').get().then(doc => {
  if (doc.exists) {
    try {
      const tokens = doc.data();
      oAuth2Client.setCredentials(tokens);
      global.authClient = oAuth2Client;
      console.log("✅ Auto Logged In Using Saved Database Token");
    } catch (e) {
      console.error("❌ Failed to parse database token.");
    }
  }
}).catch(err => console.log("No saved DB Token Found Or DB Error", err));

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets"
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ user: username }, SECRET, { expiresIn: "1d" });
    return res.json({ success: true, token });
  }

  res.json({ success: false, message: "Invalid credentials" });
});

app.post("/upload", verifyToken, (req, res) => {
  req.setTimeout(0);

  upload.single("file")(req, res, async (err) => {
    if (err && err.message === "INVALID_TYPE") {
      return res.send("❌ Security Alert: Only PDF And DOCX files Are Permitted.");
    }
    if (err) {
      console.error("MULTER ERROR:", err);
      return res.status(400).send("❌ Upload Error");
    }

    try {
      if (!global.authClient) {
        return res.send(`❌ Login First: ${process.env.BASE_URL}/auth`);
      }

      const authClient = global.authClient;
      const drive = google.drive({ version: "v3", auth: authClient });
      const sheets = google.sheets({ version: "v4", auth: authClient });

      const { course, year, spec, sem, exam, name, index } = req.body;

      if (!course || !year || !spec || !sem || !exam || !name) {
        return res.send("❌ All Fields Required");
      }

      if (!req.file && !index) {
        return res.send("❌ File Required For New Paper");
      }

      const sheetData = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A:G"
      });

      const rows = sheetData.data.values || [];

      let fileLink = null;

      if (req.file) {
        const driveRes = await drive.files.create({
          resource: {
            name: req.file.originalname,
            parents: [process.env.DRIVE_FOLDER_ID]
          },
          media: {
            mimeType: req.file.mimetype,
            body: fs.createReadStream(req.file.path)
          },
          fields: "id"
        });

        await drive.permissions.create({
          fileId: driveRes.data.id,
          requestBody: { role: "reader", type: "anyone" }
        });

        fileLink = `https://drive.google.com/file/d/${driveRes.data.id}/view`;
      }

      if (index) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${index}:G${index}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[course, year, spec, sem, exam, name, fileLink || (rows[index - 1] ? rows[index - 1][6] : "")]]
          }
        });
        return res.send("✅ Updated Successfully");
      }

      let found = false;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === course && row[1] === year && row[2] === spec && row[3] === sem && row[4] === exam && row[5] === name) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!G${i + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[fileLink || row[6]]] }
          });
          found = true;
          break;
        }
      }

      if (!found) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: "Sheet1!A:G",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[course, year, spec, sem, exam, name, fileLink || ""]] }
        });
      }

      res.send(found ? "✅ Updated Existing Paper" : "✅ Added New Paper");

    } catch (err) {
      console.error(err);
      res.send("❌ Error Occurred");
    } finally {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  });
});

app.delete("/delete", verifyToken, async (req, res) => {
  try {
    if (!global.authClient) return res.send("❌ Login First");

    const { index } = req.body;

    if (!index) return res.send("❌ No Index Provided");

    const sheets = google.sheets({ version: "v4", auth: global.authClient });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: index - 1,
              endIndex: index
            }
          }
        }]
      }
    });

    res.send("✅ Deleted Successfully");
  } catch (err) {
    console.error(err);
    res.send("❌ Delete Failed");
  }
});

app.use(express.static('public'));

app.get("/auth", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({ 
  access_type: "offline", 
  scope: SCOPES, 
  prompt: "consent"
});

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Server Authorization</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .card {
          background-color: white;
          padding: 40px 30px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        h2 {
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 24px;
        }
        p {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.5;
          font-size: 15px;
        }
        .btn {
          display: inline-block;
          background-color: #05488B;
          color: #ffc107;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(5, 72, 139, 0.2);
        }
        .btn:hover {
          background-color: #043a70;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(5, 72, 139, 0.3);
        }
        .logo-img {
          width: 130px;
          height: auto;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <img src="/logo.png" alt="Poornima University Logo" class="logo-img">
        <h2>poornima.edu.in 🔐 Authorization</h2>
        <p>To Update The Data , Server Need Your Permission</p>
        <a href="${authUrl}" class="btn">Authorize with Google</a>
      </div>
    </body>
    </html>
  `);
});

app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await db.collection('config').doc('google_token').set(tokens);
    global.authClient = oAuth2Client;
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authorization Successful</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .card {
          background-color: white;
          padding: 40px 30px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        .logo-img {
          width: 130px;
          height: auto;
          margin-bottom: 15px;
        }
        .icon {
          font-size: 55px;
          margin-bottom: 10px;
        }
        h2 {
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 24px;
        }
        p {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.5;
          font-size: 15px;
        }
        .btn {
          display: inline-block;
          background-color: #05488B;
          color: #ffc107;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(5, 72, 139, 0.2);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <img src="/logo.png" alt="Poornima University Logo" class="logo-img">
        <div class="icon">🎉</div>
        <h2>Authorization Successful!</h2>
        <p>The Server Is Now Securely Connected To Admin Panel</p>
        <a href="${FRONTEND_URL}/login" class="btn">Return to Dashboard</a>
      </div>
    </body>
    </html>
  `);
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("Authorization Failed");
  }
});

app.get("/papers", verifyToken, async (req, res) => {
  try {
    if (!global.authClient) return res.json([]);

    const sheets = google.sheets({ version: "v4", auth: global.authClient });

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:G"
    });

    const rows = sheetData.data.values || [];

    const data = rows.slice(1).map((row, i) => ({
      index: i + 2,
      course: row[0],
      year: row[1],
      spec: row[2],
      sem: row[3],
      exam: row[4],
      name: row[5],
      link: row[6]
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

app.post("/sync", verifyToken, async (req, res) => {
  try {

    const response = await fetch(SHEET_URL);
    const text = await response.text();

    let rows = [];
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        const json = JSON.parse(text.substring(start, end));
        rows = json.table.rows;
    } catch (e) {
        throw new Error("Invalid Spreadsheet JSON format");
    }

    const papersRef = db.collection('papers');
    const snapshot = await papersRef.get();

    const batches = [];
    let batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      if (count === 500) {
        batches.push(batch.commit());
        batch = db.batch();
        count = 0;
      }
    });
    if (count > 0) batches.push(batch.commit());
    await Promise.all(batches);

    console.log("Old database cleared. Ready for fresh sync.");

    let updatedCount = 0;
    const writeBatches = [];
    let writeBatch = db.batch();
    let writeCount = 0;

    for (const row of rows) {
      const paper = {
        course: row.c[0]?.v || "",
        year: row.c[1]?.v || "",
        specialization: row.c[2]?.v || "",
        sem: row.c[3]?.v || "",
        exam: row.c[4]?.v || "",
        name: row.c[5]?.v || "",
        link: row.c[6]?.v || ""
      };

      if (paper.course && paper.year && paper.sem && paper.exam && paper.name) {
        const rawId = `${paper.course}-${paper.year}-${paper.sem}-${paper.exam}-${paper.name}`;
        const docId = rawId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

        const docRef = db.collection("papers").doc(docId);
        writeBatch.set(docRef, paper);
        writeCount++;
        updatedCount++;

        if (writeCount === 500) {
          writeBatches.push(writeBatch.commit());
          writeBatch = db.batch();
          writeCount = 0;
        }
      }
    }
    if (writeCount > 0) writeBatches.push(writeBatch.commit());
    await Promise.all(writeBatches);
    
    res.json({ success: true, message: `✅ Data Updated Successfully. ${updatedCount} 🎉` });

  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ success: false, message: "❌ Failed To Fetch Data." });
  }
});

const server = app.listen(3000, () => {
  console.log("🚀 Server Started On Port 3000");
});

server.timeout = 300000;