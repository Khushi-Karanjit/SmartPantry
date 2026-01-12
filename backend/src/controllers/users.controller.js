const User = require("../models/User");

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user: { id: user._id.toString(), username: user.username, email: user.email } });
  } catch (err) {
    next(err);
  }
}

module.exports = { me };
