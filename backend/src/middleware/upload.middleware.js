import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads/movies");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and strip path traversal characters
    const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/gi, "");
    const baseName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName}-${uniqueSuffix}${sanitizedExt}`);
  },
});

const allowedMimeTypes = [
  "video/mp4",
  "video/mkv",
  "video/x-matroska",
  "video/webm",
  "video/quicktime",
];

const allowedExtensions = [".mp4", ".mkv", ".webm", ".mov"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only MP4, MKV, WEBM, and MOV video formats are permitted."),
      false
    );
  }
  cb(null, true);
};

export const movieUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1536 * 1024 * 1024, // 1.5 GB limit
    files: 1,
  },
});