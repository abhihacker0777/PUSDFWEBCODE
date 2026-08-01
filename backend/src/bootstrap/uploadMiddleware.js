const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { BACKEND_ROOT, MAX_UPLOAD_BYTES } = require("../config/env");
const {
  hasMatchingFileType,
  isAllowedFileExtension
} = require("../services/driveService");

function createUploadMiddleware() {
  const uploadDir = path.join(BACKEND_ROOT, "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  return multer({
    dest: uploadDir,
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 20, fieldSize: 1024 },
    fileFilter: (req, file, cb) => {
      if (isAllowedFileExtension(file.originalname) && hasMatchingFileType(file)) cb(null, true);
      else cb(new Error("INVALID_TYPE"), false);
    }
  });
}

module.exports = { createUploadMiddleware };
