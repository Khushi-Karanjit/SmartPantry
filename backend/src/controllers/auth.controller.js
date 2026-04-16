const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/email.service");

function signToken(userId, role) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing in .env");
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
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

    const adminEmail = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).toLowerCase().trim() : "";
    const adminUsername = process.env.ADMIN_USERNAME ? String(process.env.ADMIN_USERNAME).trim() : "";
    const role =
      (adminEmail && normalizedEmail === adminEmail) ||
      (adminUsername && normalizedUsername === adminUsername)
        ? "admin"
        : "user";

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role,
    });

    // Send Welcome Email
    try {
      const welcomeHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #2563eb; padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Smart Pantry Status</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0;">Welcome to the future of inventory management</p>
          </div>
          <div style="padding: 40px; color: #374151;">
            <p>Hi ${user.username},</p>
            <p>Thank you for choosing SmartPantry. Your account is now active and the intelligent monitoring system has been initialized.</p>
            <p>Here is what you can expect from your new Status Briefings:</p>
            <ul style="padding-left: 20px;">
              <li>Receive automated daily 8:00 AM status reports</li>
              <li>Real-time expiration alerts for all ingredients</li>
              <li>Intelligent shopping lists based on usage</li>
            </ul>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0;"><strong>Active Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0 0 0;"><strong>Account Status:</strong> Fully Operational</p>
            </div>
            <p>Get started by setting up your virtual pantry and exploring your first recipe!</p>
            <a href="http://localhost:5173/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Open Dashboard</a>
          </div>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">&copy; 2026 SmartPantry - Your Intelligent Kitchen Assistant</p>
          </div>
        </div>
      `;
      await sendEmail(user.email, "Welcome to SmartPantry: Your Intelligent Kitchen Awaits! 🥗", welcomeHtml);
    } catch (err) {
      console.error("[Auth] Failed to send welcome email:", err);
    }

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || "user",
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

    const role = user.role || "user";
    const token = signToken(user._id.toString(), role);

    // Create in-app notification
    try {
      await Notification.create({
        userId: user._id,
        title: "Login Successful",
        message: `Welcome back, ${user.username}! Your session has started.`,
        type: "system",
        priority: "low"
      });
    } catch (err) {
      console.error("[Auth] Failed to create login notification:", err);
    }

    // Send security email
    try {
      const loginTime = new Date().toLocaleString();
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Security Alert: Successful Login 🛡️</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>A new login was detected for your SmartPantry account.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Time:</strong> ${loginTime}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Success</p>
          </div>
          <p>If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">This is an automated security notification from SmartPantry.</p>
        </div>
      `;
      await sendEmail(user.email, "Security Alert: Successful Login 🛡️", emailHtml);
    } catch (err) {
      console.error("[Auth] Failed to send login security email:", err);
    }

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
