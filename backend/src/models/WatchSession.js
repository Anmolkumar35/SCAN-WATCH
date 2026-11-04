import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const watchSessionSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie is required to start a watch session"],
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Session host is required"],
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitations: [invitationSchema],
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
      index: true,
    },
    // Schema structure ready for future real-time playback sync (Step 9/10)
    playbackState: {
      currentTime: { type: Number, default: 0 },
      isPlaying: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now },
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

watchSessionSchema.methods.toSafeObject = function (baseUrl = "") {
  return {
    _id: this._id,
    movie: this.movie
      ? {
          _id: this.movie._id,
          title: this.movie.title,
          originalFilename: this.movie.originalFilename,
          mimeType: this.movie.mimeType,
          fileSize: this.movie.fileSize,
          duration: this.movie.duration,
          streamUrl: `${baseUrl}/api/movies/${this.movie._id}/stream`,
        }
      : null,
    host: this.host
      ? {
          _id: this.host._id,
          username: this.host.username,
          fullName: this.host.fullName,
          avatarUrl: this.host.avatarUrl,
        }
      : null,
    participants: Array.isArray(this.participants)
      ? this.participants.map((p) =>
          p && p.username
            ? {
                _id: p._id,
                username: p.username,
                fullName: p.fullName,
                avatarUrl: p.avatarUrl,
              }
            : p
        )
      : [],
    invitations: Array.isArray(this.invitations)
      ? this.invitations.map((inv) => ({
          _id: inv._id,
          user: inv.user && inv.user.username
            ? {
                _id: inv.user._id,
                username: inv.user.username,
                fullName: inv.user.fullName,
                avatarUrl: inv.user.avatarUrl,
              }
            : inv.user,
          status: inv.status,
          respondedAt: inv.respondedAt,
          createdAt: inv.createdAt,
        }))
      : [],
    status: this.status,
    playbackState: this.playbackState,
    endedAt: this.endedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const WatchSession = mongoose.model("WatchSession", watchSessionSchema);
export default WatchSession;