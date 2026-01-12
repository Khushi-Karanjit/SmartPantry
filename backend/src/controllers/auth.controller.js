const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing in .env");
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, password are required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existing) {
      return res.status(409).json({ message: "User already exists (email or username)" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { usernameOrEmail, password } = req.body || {};

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: "usernameOrEmail and password are required" });
    }

    const input = String(usernameOrEmail).trim();

    const query = input.includes("@")
      ? { email: input.toLowerCase() }
      : { username: input };

    // passwordHash is select:false, so explicitly include it
    const user = await User.findOne(query).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id.toString());

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
