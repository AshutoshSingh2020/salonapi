const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { env } = require("../config/env");

const uploadDir = path.join(__dirname, "../../", env.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${unique}-${safeName}`);
  }
});

const upload = multer({ storage });

module.exports = { upload, uploadDir };
