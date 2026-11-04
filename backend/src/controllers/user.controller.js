import User from "../models/User.js";

export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid username search query.",
      });
    }

    const currentUserId = req.user._id;
    const query = username.trim();

    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: currentUserId },
    })
      .select("fullName username avatar")
      .limit(20);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: { users },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while searching users.",
    });
  }
};

