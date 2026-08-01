const fs = require("fs");
const path = require("path");
const {
  DRIVE_ACCESS_DOMAIN,
  DRIVE_FOLDER_ID
} = require("../config/env");
const { normalizeText } = require("../utils/helpers");
const { getServiceDrive } = require("./googleService");

function safeDriveFileName(originalName, mimeType) {
  if (!originalName) {
    throw new Error("Uploaded file name is required.");
  }

  const parsed = path.parse(path.basename(originalName));
  const ext = parsed.ext.toLowerCase();
  if (!isAllowedFileExtension(originalName) || !hasMatchingFileType({ originalname: originalName, mimetype: mimeType })) {
    throw new Error("INVALID_TYPE");
  }

  const base = parsed.name
    .replace(/[\u0000-\u001F\u007F<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "paper";
  return `${base}${ext}`;
}

function extractDriveFileId(link = "") {
  const text = normalizeText(link, 500);
  return text.match(/\/file\/d\/([^/]+)/)?.[1] || text.match(/[?&]id=([^&]+)/)?.[1] || "";
}

async function uploadFileToDrive(file) {
  const drive = await getServiceDrive();
  const driveRes = await drive.files.create({
    resource: { name: safeDriveFileName(file.originalname, file.mimetype), parents: [DRIVE_FOLDER_ID] },
    media: { mimeType: file.mimetype, body: fs.createReadStream(file.path) },
    fields: "id"
  });

  await drive.permissions.create({
    fileId: driveRes.data.id,
    requestBody: { role: "reader", type: "domain", domain: DRIVE_ACCESS_DOMAIN, allowFileDiscovery: false }
  });

  return {
    id: driveRes.data.id,
    link: `https://drive.google.com/file/d/${driveRes.data.id}/view`
  };
}

function isAllowedFileExtension(fileName = "") {
  const ext = path.extname(fileName).toLowerCase();
  return ext === ".pdf" || ext === ".docx";
}

function hasMatchingFileType(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  return (file.mimetype === "application/pdf" && ext === ".pdf") ||
    (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && ext === ".docx");
}

function validateUploadedFile(file) {
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(file.path, "r");
  try {
    fs.readSync(fd, buffer, 0, 4, 0);
  } finally {
    fs.closeSync(fd);
  }

  if (file.mimetype === "application/pdf" && buffer.subarray(0, 4).toString() === "%PDF") return;
  if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
  ) return;

  throw new Error("INVALID_FILE_SIGNATURE");
}

module.exports = {
  extractDriveFileId,
  uploadFileToDrive,
  isAllowedFileExtension,
  hasMatchingFileType,
  validateUploadedFile
};
