import express from "express";
import {
  uploadMovie,
  getMyMovies,
  getMovieById,
  streamMovie,
  deleteMovie,
} from "../controllers/movie.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { movieUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/upload", protect, (req, res, next) => {
  movieUpload.single("video")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload validation failed.",
      });
    }
    next();
  });
}, uploadMovie);

router.get("/", protect, getMyMovies);
router.get("/:id", protect, getMovieById);
router.get("/:id/stream", protect, streamMovie);
router.delete("/:id", protect, deleteMovie);

export default router;