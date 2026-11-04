import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Movie from "../models/Movie.js";
import { deleteStoredFile } from "../services/storage.service.js";

export const uploadMovie = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No movie file provided. Please upload a valid video file.",
      });
    }

    const title = req.body.title ? req.body.title.trim() : "";
    if (!title) {
      await deleteStoredFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Movie title is required.",
      });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const movie = await Movie.create({
      owner: req.user._id,
      title,
      originalFilename: req.file.originalname,
      storageKey: req.file.path,
      storageUrl: `/uploads/movies/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      duration: Number(req.body.duration) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Movie uploaded and stored successfully.",
      data: { movie: movie.toSafeObject(baseUrl) },
    });
  } catch (error) {
    if (req.file?.path) {
      await deleteStoredFile(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "An error occurred during movie upload.",
    });
  }
};

export const getMyMovies = async (req, res) => {
  try {
    const host = req.get("host");
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const movies = await Movie.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: movies.length,
      data: {
        movies: movies.map((m) => m.toSafeObject(baseUrl)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching movies.",
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid movie ID is required.",
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    if (movie.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You do not own this private movie.",
      });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    return res.status(200).json({
      success: true,
      data: { movie: movie.toSafeObject(baseUrl) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the movie.",
    });
  }
};

export const streamMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid movie ID" });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    if (movie.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access forbidden" });
    }

    const filePath = path.resolve(movie.storageKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Video file missing on server" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start: start, end: end });

      const head = {
        "Content-Range": "bytes " + start + "-" + end + "/" + fileSize,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": movie.mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": movie.mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while streaming the video.",
    });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid movie ID is required.",
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    if (movie.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You can only delete your own movies.",
      });
    }

    await deleteStoredFile(movie.storageKey);
    await Movie.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Movie and stored file deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the movie.",
    });
  }
};