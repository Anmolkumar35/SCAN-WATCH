import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "demo",
  api_secret: process.env.CLOUDINARY_API_SECRET || "demo",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "scane_watch/movies",
    resource_type: "video",
    allowed_formats: ["mp4", "mkv", "webm", "avi", "mov"],
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

export default cloudinary;

