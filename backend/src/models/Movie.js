import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Movie owner is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      maxlength: [120, "Movie title cannot exceed 120 characters"],
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    storageUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.methods.toSafeObject = function (baseUrl = "") {
  return {
    _id: this._id,
    title: this.title,
    originalFilename: this.originalFilename,
    mimeType: this.mimeType,
    fileSize: this.fileSize,
    duration: this.duration,
    streamUrl: `${baseUrl}/api/movies/${this._id}/stream`,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;

